# Phase 5 — Velocity marquee, runtime tiers, polish

Spec: `docs/superpowers/specs/2026-10-10-cinematic-landing-design.md` (§4.3 Visit iMart, §7 moment 06, §9 tiers, §10 failure handling, §12 budgets).

**Goal:** finish the six moments with the Amarpath velocity marquee, make the quality tier able to step down at runtime (slow frames, 3D failure, context loss) without replaying anything, and close out with measurements and a review.

**Measured before starting (headless Edge, D3D11, 1440×900):** hero 60 fps; film 0.43 / 0.70 / 0.88 at 60 fps; film 0.15 at **48–51 fps, p95 34 ms** on both High and Mid. The cause is the live environment window (0.095–0.175), where the 256 px cubemap and its PMREM re-render every frame. A 128 px cubemap gives 60 fps, p95 16.9 ms, with no visible change in the frame highlights. That change is included in Task 1.

---

### Task 1: The tier can step down at runtime

- **`motion/tier.ts`**: add `lowerTier(t)` (high → mid → low) and `capTier(t, cap)` (the lower of the two), with tests.
- **`motion/use-tier.ts`**: the tier becomes a small store.
  - `stepDownTier()` lowers the tier by one step.
  - `dropToLowTier()` sets it to Low.
  - The cap is persisted in `sessionStorage` (`imart-tier-cap`), so a session never goes back up.
  - Subscribers are notified. A `?tier=` override disables runtime changes, because testing pins the tier.
- **`landing-experience.tsx`**: each effect depends on what it uses, not on the raw tier, so a step down never replays anything.

  | Effect | Depends on |
  |---|---|
  | Hero entrance / boot subscription | `ready` (tier known) |
  | Hero hand-off | `ready` |
  | Store motion | `ready` |
  | Film | `filmOn` (tier ≠ low) |
  | Smooth scroll | `smoothOn` (tier ≠ low) |
  | Pointer depth | `depthOn` (tier = high) |

- **Failure → Low in place.** `onError` (GLB / render error) and `webglcontextlost` on the canvas call `dropToLowTier()`. The film unpins (bindFilm's cleanup calls `ScrollTrigger.refresh()`), the canvas unmounts, and the poster stays.
- **`three/studio-lights.tsx`**: environment resolution goes from 256 to 128.

### Task 2: Frame-budget monitor (inside the canvas)

- **`motion/frame-budget.ts`** (pure, tested): `judgeFrames(windows, threshold = 50, needed = 3)` returns true when the last `needed` sampled windows are all below `threshold` fps.
- **`three/frame-budget.tsx`**: `useFrame` collects frame times into 1.5 s windows.
  - It stops sampling (and clears its history) during the first 4 s after mount, while the film is in progress (`0 < film.progress < 1`), while the document is hidden, and while the stage is not visible (frameloop `never`).
  - When `judgeFrames` is true it calls `stepDownTier()` once, then waits for the new tier to re-render it.
- **Mounting.** Only when the tier wasn't forced by `?tier=` and not in capture mode.

### Task 3: Moment 06 — the Amarpath marquee follows scroll velocity

- **`motion/marquee.ts`**: `bindMarquee(root)`.
  - A GSAP loop over the duplicated track: `xPercent: -50`, linear, 36 s, repeating.
  - A ScrollTrigger on `.visit` (top bottom → bottom top):
    - `onUpdate` reads `getVelocity()` and sets the target time scale to `dir × (1 + min(|v| / 250, 7))`;
    - `gsap.to(loop, { timeScale: target, duration: 0.3, overwrite: true })`, then eases back to `dir × 1` over 1.4 s;
    - the text skews slightly with velocity (≤ 4°) and settles back;
    - direction follows the scroll direction;
    - `onToggle` pauses the loop off-screen.
  - Root gets `data-marquee`. CSS turns off the CSS animation under `[data-marquee]`.
- **Map line reacts to the pointer (desktop, fine pointer).** On `pointermove` over `.visit`, the route's middle control point eases up to ±6 units toward the pointer, then settles back on leave. It uses a small rAF lerp that stops once settled.
- **Wiring.** Bound with the store motion (not under reduced motion).

### Task 4: Checks, measurements, review

- **e2e**:
  - the marquee moves (`x` changes over 500 ms);
  - a fast wheel burst raises its speed above the idle speed;
  - **Context loss:** call `WEBGL_lose_context.loseContext()` on the canvas and expect `data-tier="low"`, the film not pinned, and a still poster.
- **Frame-time sampling** script stays in `e2e/.artifacts/fps-check.mjs`. Report hero and film windows at High and Mid.
- **Bundle report** from `.next` (gzip):
  - JS on `/` for the motion libraries: ≤ 140 KB;
  - the lazy 3D chunk: ≤ 260 KB;
  - GLB size;
  - still sizes.
- **Screenshot strips:** desktop 1440×900 and mobile 390×844 at about 12 scroll positions, reviewed.
- **Final review** of the whole branch against the spec, then hand-off. The branch is not pushed without asking the owner.
