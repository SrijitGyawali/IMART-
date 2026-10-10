# Landing page / Phase 5 verification

Date: 2026-10-11. Branch: `cinematic-landing`, HEAD `bee3ff7`, plus the existing uncommitted Phase 5 changes. Reviewed against the cinematic landing design spec and Phase 5 plan.

**Verdict: partially implemented; not ready to mark Phase 5 complete.** The normal cinematic and shopping paths work, but Moment 06 is disconnected and runtime fallback has reproducible defects. This was a verification pass: no application source changed, no orders submitted, no commit or push made. Added local diagnostic scripts/results and this report; retained and enhanced the existing FPS script.

## Architecture observed

The server home page reads products/categories and builds public hero, category, shelf and promo data. `LandingExperience` composes the server-rendered sections and starts client motion. GSAP owns the scroll film and hand-off; Anime.js owns entrances, finish changes and UI motion; StringTune supplies desktop smooth scrolling and pointer effects. A mutable `scene-store` carries animation values into a lazily loaded React Three Fiber canvas without React updates on each frame. `useTier` is now an external React store with session-storage caps. High/Mid mount the canvas and film; Low unmounts them and exposes the server-rendered fallback.

## Findings, in recommended repair order

### 1. P1 — Slow-frame downgrade hides the product completely

**Browser reproduced.** Sustained delayed animation frames cause High → Mid → Low correctly, without replaying boot/entrance. On Low, the canvas is removed and the film unpins, but `data-phone` remains `ready` and the hero poster has computed opacity `0`. Enabling reduced motion after the live phone is ready reproduces the same disappearance.

Sources: [landing-experience.tsx:200](C:/Users/APTOS/Desktop/IMART/src/components/landing/landing-experience.tsx:200), [landing.css:238](C:/Users/APTOS/Desktop/IMART/src/components/landing/landing.css:238). Restore the poster state whenever live 3D is removed, not only from the error callback.

Evidence: [slow-frame-low.png](C:/Users/APTOS/Desktop/IMART/e2e/.artifacts/phase5/slow-frame-low.png), [audit-results.json](C:/Users/APTOS/Desktop/IMART/e2e/.artifacts/phase5/audit-results.json).

### 2. P2 — Velocity marquee and pointer-reactive route are not connected

**Browser and source confirmed.** `visit-motion.ts` implements `bindVisit`, but nothing imports/calls it. The root never receives `data-marquee`; CSS still supplies the 42-second constant-speed animation. There is also no CSS override to disable that animation once GSAP is attached.

Measured horizontal speeds: idle approximately −148 px/s, wheel burst −150 px/s, reverse scrolling −149 px/s. The marquee also continues offscreen. The map route's `d` attribute does not change with pointer movement.

Sources: [visit-motion.ts](C:/Users/APTOS/Desktop/IMART/src/components/landing/motion/visit-motion.ts), [landing-experience.tsx:173](C:/Users/APTOS/Desktop/IMART/src/components/landing/landing-experience.tsx:173), [landing.css:333](C:/Users/APTOS/Desktop/IMART/src/components/landing/landing.css:333). Wire the visit cleanup into store motion and disable the CSS transform animation under `data-marquee`; then rerun velocity, direction, skew and offscreen checks. The implemented ticker-based loop also differs from the plan's repeating GSAP tween; verify equivalent behavior if retained.

### 3. P2 — Storage failure prevents runtime recovery

**Browser reproduced.** When writing `imart-tier-cap` throws, losing the WebGL context leaves `data-tier="high"`, the film pinned and the failed canvas mounted. `setCap()` catches the storage error, then recomputes from the missing/old persisted cap instead of retaining the newly lowered cap in memory.

Source: [use-tier.ts:26](C:/Users/APTOS/Desktop/IMART/src/components/landing/motion/use-tier.ts:26). Apply an in-memory cap first; persistence should be best effort. With ordinary available storage, context loss and GLB failure both recover correctly.

### 4. P2 — Intro exceeds the 1.2-second hard cap; existing test gives a false pass

**Browser measured.** A document MutationObserver measured `data-boot="play"` → `done` at **3,932.5 ms** in a normal fresh context and **3,380.4 ms** with a two-second JS request delay. These include the pre-hydration interval. Neither satisfies the specified cap.

The inline gate starts the boot before hydration but has no timer. `playBoot` starts its timer only after hydration, uses **1,400 ms**, and its animation extends to 1,240 ms. Synchronous startup work can further delay dismissal. The existing e2e assertion checks only `data-boot === "done"`, not elapsed time.

Sources: [boot-intro.tsx:11](C:/Users/APTOS/Desktop/IMART/src/components/landing/intro/boot-intro.tsx:11), [play-boot.ts:74](C:/Users/APTOS/Desktop/IMART/src/components/landing/intro/play-boot.ts:74), [landing.e2e.mjs:56](C:/Users/APTOS/Desktop/IMART/e2e/landing.e2e.mjs:56). Enforce the deadline from the initial gate, align timeline duration, and keep expensive startup from holding the overlay open. Replace the current assertion with an actual timing assertion.

### 5. P2 — Mobile composition needs another pass

**Screenshot verified at 390×844.** At film progress 0.47, the enlarged device extends behind the Act 02 headline and supporting copy instead of staying above the text. The mobile model uses the same large fly-through scale as desktop.

Source: [phone-model.tsx:199](C:/Users/APTOS/Desktop/IMART/src/components/landing/three/phone-model.tsx:199). Evidence: [mobile Act 02](C:/Users/APTOS/Desktop/IMART/e2e/.artifacts/phase5/mobile-04-inside.png).

The initial mobile hero is also 1,201 px tall on an 844 px viewport. Price occupies y=810–864, purchase CTAs y=892–1,008 and finishes y=1,042–1,105. The purchase controls are below the initial viewport, falling short of the spec's full-viewport selling goal. Rebalance phone height, headline spacing and controls. Touch swiping the phone does correctly change Cosmic Orange → Deep Blue.

### 6. P2 — Low fallback lacks the specified visual film

**Source verified.** Low/no-WebGL renders four readable text acts, but no back, exploded, payment or delivery stills. `public/renders` contains only four hero finishes. This is less complete than the spec's still-based fallback story.

Source: [product-film.tsx:41](C:/Users/APTOS/Desktop/IMART/src/components/landing/film/product-film.tsx:41). Generate the missing stills and render them in the Low acts.

### 7. Bundle budgets are not met

Fresh production `.next` measurements, gzip at Node's default compression, decimal KB:

| Payload | Measured | Spec |
|---|---:|---:|
| StringTune chunk `24jmyxxarqwi1.js` | 129,430 bytes / 129.43 KB | Part of motion budget |
| GSAP/Anime/landing UI chunk `276uhopp454xz.js` | 76,218 bytes / 76.22 KB | Part of motion budget |
| Combined motion-bearing chunks | **205,648 bytes / 205.65 KB** | ≤140 KB |
| Lazy 3D chunk `28sqg17mh9bdq.js` | **297,944 bytes / 297.94 KB** | ≤260 KB |
| `iphone.v1.glb` | 1,501,040 bytes / 1.50 MB | ≤2.5 MB; approximately target |
| Hero stills | 12,006–15,686 bytes | ≤90 KB each — pass |

The motion chunk measurement includes colocated landing UI; it is not a claim that every byte is third-party library code. It excludes shared Next/React chunks. Inspection of inert Turbopack module registrations found approximately 17.45 KB gzip of Anime modules in addition to StringTune, before counting GSAP/ScrollTrigger, so the library budget is not explained solely by application code. See [bundles.json](C:/Users/APTOS/Desktop/IMART/e2e/.artifacts/phase5/bundles.json).

## Additional spec/coverage gaps

- **Forced tier semantics differ from the plan.** After a failure persists `low`, visiting `?tier=high` still yields Low. `dropToLowTier()` also bypasses the override guard. Slow-frame monitoring does respect the override. The source explicitly makes failure caps win, but the Phase 5 plan promises a pinned tier. Resolve/document this discrepancy. [use-tier.ts:22](C:/Users/APTOS/Desktop/IMART/src/components/landing/motion/use-tier.ts:22).
- **Mid still uses a live environment.** Both tiers pass the same `live` value to `StudioLights`, resulting in `frames={Infinity}` during sweep/finish/Act 01 windows. The spec says Mid should use a static environment plus shader sweeps. This is a source-confirmed tier gap, not a measured FPS failure on this desktop. [phone-canvas.tsx:47](C:/Users/APTOS/Desktop/IMART/src/components/landing/three/phone-canvas.tsx:47).
- **Canvas invisibility does not explicitly clear frame history.** `FrameBudget` checks warm-up, document visibility and film progress inside `useFrame`, but observes no stage-visibility change. No callbacks run under `frameloop="never"`; R3F restarts its clock on resume. Normal passage through the film usually clears history anyway. A consequential premature downgrade was **not reproduced**; treat this as an explicit-requirement/coverage gap. [runtime-guards.tsx:35](C:/Users/APTOS/Desktop/IMART/src/components/landing/three/runtime-guards.tsx:35).
- **Live reduced-motion changes leave existing DOM motion bindings active.** The hero/store effect captures the preference once and depends on `ready`, which stays true. Handle preference changes independently without replaying entrances. Initial reduced motion works.
- **Catalogue content:** an unrelated portrait product appears in the live landing shelf. The page is rendering real active data; review/curate catalogue content before launch. No live records were changed.
- The committed browser suite has no marquee velocity, context-loss, runtime store or monitor integration checks. The new diagnostic scripts expose failures but remain in the ignored artifact directory, not the durable regression suite.

## Checks completed

| Check | Result |
|---|---|
| Production `npm run build` | Pass, including Next TypeScript compilation |
| `tsc --noEmit` | Pass |
| `npm test` | 25/25 pass |
| ESLint on `src/components/landing` | Pass |
| Repository-wide ESLint | Fails: existing cart-provider state-in-effect error; POS unused setter warning |
| Existing browser suite | 79/79 assertions pass; no console/page errors or 5xx in normal paths. Boot timing assertion is inadequate as explained above. |
| Extra Phase 5 audit | 24 observations/checks, 9 fail; one route-settle check is not meaningful because the route never moved |
| Normal WebGL context loss, mid-film | Low, unpinned film, no canvas, opaque loaded poster; scroll position maintained |
| GLB request failure | Low with poster and unpinned acts |
| Slow frames | High → Mid → Low; no boot/entrance attribute replay; cap survives reload; poster defect remains |
| Monitor during active film / forced High | Does not downgrade under injected slow frames |
| Initial reduced motion / no WebGL / no JavaScript | Readable content; initial Low has a visible hero poster and no film pin |
| Search | Suggestions load, Escape restores input focus, Enter opens `/products?q=iphone` |
| Finish selection | Mouse selection, arrow keys and emulated touch swipe work |
| Store / shopping smoke | Tabs, FAQ, rail, service numbers, header transitions, links, cart and checkout rendering pass; no order submitted |
| Screenshot review | 12 desktop and 12 mobile positions; no horizontal overflow across the 24 captures |

## Frame-time measurements

Production server, headless Edge, D3D11 on Intel Iris Xe, 1440×900, DPR 1. Tests ran sequentially. Query overrides pinned each tier. Five-second warm-up; three-second stationary samples; six-second programmatic traversal. Values measure browser rAF cadence, not isolated GPU execution time.

| Window | High FPS | High p95 ms | Mid FPS | Mid p95 ms |
|---|---:|---:|---:|---:|
| Hero idle | 60.0 | 16.9 | 60.0 | 16.8 |
| Film 0.15 | 60.1 | 16.8 | 60.0 | 16.8 |
| Film 0.43 | 60.1 | 17.0 | 60.1 | 16.9 |
| Film 0.70 | 60.0 | 16.9 | 60.1 | 16.8 |
| Film 0.88 | 60.1 | 16.9 | 60.1 | 16.9 |
| Continuous film traversal | 58.2 | 17.1 | 57.9 | 17.1 |

The environment is now 128 px. The previously reported 0.15 slowdown is not reproduced. Stationary samples meet the frame-rate goals; continuous traversal is above Mid's 50 fps threshold but does not prove a strictly steady 60 fps High experience.

One emulated mobile cold-load lab run at 390×844, 150 ms latency, 1.6 Mbps download and 4× CPU throttling recorded **LCP 2.076 s** and cumulative unexpected layout shift **0.00040**. This sample meets the numeric budgets but is not a physical Android/iPhone or Safari sign-off. No physical devices were tested.

## Evidence and reproduction

- [Desktop strip](C:/Users/APTOS/Desktop/IMART/e2e/.artifacts/phase5/desktop-strip.png) · [Mobile strip](C:/Users/APTOS/Desktop/IMART/e2e/.artifacts/phase5/mobile-strip.png)
- [Existing suite log](C:/Users/APTOS/Desktop/IMART/e2e/.artifacts/phase5-existing-e2e.log)
- [Phase 5 diagnostic harness](C:/Users/APTOS/Desktop/IMART/e2e/.artifacts/phase5-audit.mjs) · [results](C:/Users/APTOS/Desktop/IMART/e2e/.artifacts/phase5/audit-results.json)
- [Additional browser checks](C:/Users/APTOS/Desktop/IMART/e2e/.artifacts/phase5-extra.mjs) · [results](C:/Users/APTOS/Desktop/IMART/e2e/.artifacts/phase5/extra-results.json)
- [FPS script](C:/Users/APTOS/Desktop/IMART/e2e/.artifacts/fps-check.mjs) · [High log](C:/Users/APTOS/Desktop/IMART/e2e/.artifacts/phase5/fps-high.log) · [Mid log](C:/Users/APTOS/Desktop/IMART/e2e/.artifacts/phase5/fps-mid.log)
- [Screenshot harness](C:/Users/APTOS/Desktop/IMART/e2e/.artifacts/phase5-screens.mjs)

With the production build served at port 3110, run the existing suite with `BASE_URL=http://localhost:3110`, and run `phase5-audit.mjs` for failure-injection reproduction. The FPS script accepts `BASE_URL` and `?tier=high` or `?tier=mid`. Browser scripts use installed Edge; they do not submit orders. The normal audit report stays tracked-capable under `docs/reviews`; `e2e/.artifacts` is git-ignored.

Handoff: fix the reproduced fallback and Moment 06 failures first, then intro/mobile composition, missing Low visuals and budgets. Promote the targeted regressions into the maintained test suite. Finish with physical Android/iPhone checks before release. The branch has not been pushed.
