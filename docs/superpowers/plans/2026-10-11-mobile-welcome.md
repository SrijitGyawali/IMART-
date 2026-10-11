# Mobile iMart Welcome Implementation Plan

> **For agentic workers:** Use subagent-driven-development for independent screen and runtime tasks, then review the integrated experience.

**Goal:** Implement the owner-approved compact mobile hero, original Hello Butwal display and continuous transition into the existing film.

**Architecture:** Keep server-rendered product data and a single finish picker. CSS grid reorders the hero on mobile while preserving desktop composition. Extend the existing screen shader/atlas rather than loading another texture or rendering loop. Regenerate the matching versioned WebP fallbacks. Existing scene handoff drives the welcome fade/route contraction.

**Tech Stack:** Installed Next.js 16, React 19, CSS, GSAP, Anime.js, StringTune, Three/R3F, Playwright Edge, Sharp.

## Global constraints
- No new runtime dependencies. No fabricated prices, stock or claims.
- Header/search, headline, phone, finishes, price, shop and WhatsApp visible at 390×844. At shorter sizes shrink decoration first; never clip content or prevent scrolling.
- Preserve desktop and the four-act film. Native mobile scroll and reduced-motion support.
- Brief mobile entrance with immediately visible content. No blocking mobile boot overlay.
- Render the welcome in the physical screen, including fallback stills. Existing finish selection tints the light.
- Do not publish during implementation. Preserve existing unrelated work.

### Task 1: Hero layout and contact
Files: hero/hero-stage.tsx, hero/finish-picker.tsx, hero/hero-poster.tsx, landing.css, motion/hero-motion.ts, intro/boot-intro.tsx, landing-experience.tsx.
- [x] Restructure hero into named heading, device, finish and purchase areas; retain `.hero-copy`, `.hero-ctas`, `.hero-price` hooks for desktop/legacy tests.
- [x] Mobile: headline above the phone, compact circular named finish controls below, product and live price, full shop button and quieter WhatsApp link. Keep touch targets ≥44px.
- [x] Use the existing WhatsApp number and a product-specific enquiry, accessible link text and normal external-link behavior.
- [x] Skip the decorative mobile boot. A short opacity/translation settle must leave buying controls visible throughout.
- [x] Measure the actual device slot with ResizeObserver so responsive CSS, fonts and orientation keep poster/live model aligned.

### Task 2: Welcome screen and transition
Files: three/screen-ui.ts, three/phone-model.tsx, new pure welcome-motion.ts + test.
Interfaces: consume scene.handoff, film.progress and selected finish; shader uniforms for welcome opacity, route contraction and finish tint. Keep existing payment/delivery uniforms unchanged.
- [x] Test welcome endpoints and continuous collapse into handoff using pure numeric inputs.
- [x] Extend the existing atlas with iMart, Hello, Butwal, Amarpath labels. Draw an original restrained route and finish-colored halo in the shader; no extra perpetual JS work.
- [x] Fade lettering then contract route to a point as handoff progresses. Existing delivery scene retains its shared street language.
- [x] Keep the slight hero angle. On mobile contain the fly-through so copy remains readable.

### Task 3: Runtime resilience
Files: motion/use-tier.ts, three/runtime-guards.tsx, three/phone-canvas.tsx; parent handles poster CSS.
- [x] Make downgrade cap apply in memory even if sessionStorage throws, and preserve forced test-tier semantics.
- [x] Explicitly clear monitor history on visibility changes and keep Mid environment static.
- [x] Ensure Low always reveals the new poster without replaying entrances.

### Task 4: Stills and verification
Files: scripts/render-stills.mjs, config.ts, config.test.ts, public/renders/*, e2e/mobile-welcome.e2e.mjs.
- [x] Regenerate all four hero finishes from the real shader, bump still version, and verify size <90KB per hero still.
- [x] Browser regression: geometry at 390×844, 360×740, 320×568, desktop; touch/keyboard finish selection; search and WhatsApp href; scroll handoff and four film acts; Low/reduced motion; GLB/context failure and unavailable storage.
- [x] Run unit tests, targeted lint, TypeScript and production build. Review screenshots and sample High/Mid frame rates on the real local GPU.
- [x] Independent final review of spec compliance and code quality; resolve findings and record validation before handoff.
