# iMart mobile welcome — implementation and verification

Date: 2026-10-11. Branch: `codex/mobile-welcome`, based on `58c7890`.

## Delivered

The opening mobile screen now places the headline above a smaller angled phone, with finish swatches, the actual product name and live price, the shop button and a quieter WhatsApp enquiry link beneath it. Logo and search remain prominent. The complete purchase path fits at 390×844, 360×740 and 320×568. Short landscape screens allow scrolling to the controls before the film handoff begins.

The screen is an original shader composition: iMart, “Hello, Butwal.”, an Amarpath route and a restrained light tinted by the selected finish. During the first scroll the lettering fades and the route contracts toward its point, then the existing four-act film takes over. Hero controls clear before the device crosses them. Mobile Act 02 uses a smaller scale so the phone stays above the supporting text.

The mobile boot overlay is skipped. Native mobile scrolling is preserved, the entrance is brief, the emerald/ivory palette is softer, and animated grain is replaced with a quieter static texture. Swiping and keyboard navigation update a single shared finish selection. WhatsApp uses the store's configured number and a product-specific enquiry; no message is sent automatically.

All four fallback stills were regenerated from the same scene as version 2. Runtime recovery now applies its cap in memory even if sessionStorage throws; Low always reveals the poster. Mid uses a static environment. Frame monitoring clears its history when the stage or document becomes hidden. Query tier overrides remain pinned for testing.

The previously disconnected Amarpath velocity marquee and pointer route are now bound to store motion. The route restores its exact original path on leave and cleanup. Runtime preference changes tear down motion without replaying the entrance or hiding purchase controls. An independent review caught the desktop cleanup bug; it was fixed and covered by an on/off preference regression.

No runtime dependency was added. Product data, pricing and contact details continue to come from the existing application data.

## Verification

- Production `npm run build`: pass, including Next TypeScript compilation.
- `tsc --noEmit`: pass.
- ESLint on landing source, both new browser suites and the still renderer: pass.
- Unit tests: 27/27 pass, including welcome transition continuity and endpoint tests.
- Welcome browser suite: 41/41 pass. Includes mobile/desktop layout, 568×320 landscape access, touch swipes, keyboard finishes, poster synchronization, search, WhatsApp URL, handoff, all film acts, live reduced-motion changes, context loss and storage failure.
- Runtime browser suite: 25/25 pass. Includes marquee movement/acceleration/reversal/offscreen pause; map response/exact restoration; context loss; cap persistence; forced override; sustained High → Mid → Low without entrance replay; film/forced monitoring exclusions; failed GLB; no WebGL; reduced-motion fallback.
- Existing landing suite: 79/79 pass on the final build, with no console errors, page errors or 5xx responses. Includes catalogue tabs, services, FAQ, header states, cart and checkout rendering. Final run recorded in `e2e/.artifacts/welcome/existing-e2e-final.log`.
- Reviewed 12 desktop and 12 mobile scroll-position screenshots, plus the welcome handoff, each hero size, finish changes and reduced-motion still.
- `git diff --check`: pass.

Browser checks use a production build in headless Edge with D3D11. They do not submit orders or send WhatsApp messages. No physical iPhone, Android device or Safari was tested. Repository-wide lint was not re-run; the earlier audit records unrelated existing lint errors.

Reproduce against a running production server by setting `BASE_URL` and running:

```text
node e2e/mobile-welcome.e2e.mjs
node e2e/landing-runtime.e2e.mjs
node e2e/landing.e2e.mjs
node e2e/.artifacts/fps-check.mjs ?tier=high
node e2e/.artifacts/fps-check.mjs ?tier=mid
```

## Performance measurements

Intel Iris Xe, Edge/D3D11, 1440×900, DPR 1. Runs were sequential. Five-second warm-up, three-second stationary samples, six-second programmatic film traversal. These measure browser rAF cadence, not isolated GPU execution time.

| Window | High FPS | High p95 ms | Mid FPS | Mid p95 ms |
|---|---:|---:|---:|---:|
| Hero idle | 59.7 | 16.8 | 60.1 | 16.8 |
| Film 0.15 | 60.0 | 16.9 | 60.1 | 16.8 |
| Film 0.43 | 60.1 | 16.8 | 60.1 | 16.8 |
| Film 0.70 | 60.0 | 16.8 | 60.1 | 16.8 |
| Film 0.88 | 60.1 | 16.9 | 60.1 | 16.9 |
| Continuous traversal | 58.1 | 17.0 | 56.7 | 32.9 |

Stationary motion is near 60 fps. Continuous traversal remains above the Mid 50 fps threshold, but the Mid sample has occasional longer frames and the High sample does not establish a strictly steady 60 fps. These results are not a guarantee across devices. LCP/CLS were not re-measured for this change.

Fresh production build sizes, gzip at Node's default compression, decimal KB:

| Payload | Bytes | Budget |
|---|---:|---:|
| StringTune chunk | 129,430 gzip | Part of motion budget |
| GSAP/Anime/landing UI chunk | 77,299 gzip | Part of motion budget |
| Combined motion-bearing chunks | 206,729 gzip | 140,000 — over |
| Lazy 3D chunk | 298,673 gzip | 260,000 — over |
| Phone GLB | 1,501,040 | 2,500,000 — pass |
| Cosmic Orange v2 still | 18,192 | 90,000 — pass |
| Deep Blue v2 still | 15,498 | 90,000 — pass |
| Fallback v2 still | 15,324 | 90,000 — pass |
| Silver v2 still | 19,112 | 90,000 — pass |

The motion total includes colocated landing UI, excludes shared Next/React chunks, and is not a claim that every byte is library code. The original audit already identified these bundle overruns. This change increases motion-bearing chunks by 1,081 gzip bytes and the 3D chunk by 729 gzip bytes, without adding another library.

## Remaining broader Phase 5 work

The mobile welcome direction is implemented. This is not a claim that the full original Phase 5 spec is now closed. The existing desktop intro still exceeds its 1.2-second hard cap; the legacy test's completion-only assertion must not be treated as timing proof. Low has the new hero still and readable stacked film text, but still lacks the four separate film-scene stills specified in the original design. Bundle reduction and physical-device checks remain. The live catalogue also still contains the unrelated portrait product identified in the earlier audit; no live catalogue records were changed.

Evidence lives in ignored `e2e/.artifacts/welcome/`: browser logs, `runtime/audit-results.json`, `fps-high.log`, `fps-mid.log`, `bundles.json`, hero/handoff/film captures, and `strips/desktop-strip.png`, `strips/mobile-strip.png`. Durable regression scripts are tracked separately under `e2e/`.

Verification was completed locally before publication. The owner subsequently requested a detailed commit and push to `main`; deployment verification is outside this report.
