# iMart cinematic landing page — design spec

- **Date:** 2026-10-10
- **Status:** Draft for owner review
- **Scope:** the home page (`/`) only. Catalogue, product, cart and checkout pages keep their current design.

---

## 1. Goal

Turn the home page into one continuous product film that flows

**BLACK → LIGHT → PRODUCT → INSIDE THE PRODUCT → PURCHASE → STORE**

with no hard visual resets, while remaining a shop people can actually buy from.

Success means two things at once:

1. A visitor thinks "this shop has a serious website".
2. Three seconds later they still know **what product this is, how much it costs, where iMart is, how to buy it, and how to contact the store**.

Six signature moments (§7) get the craft budget. Everything else exists to make those six feel premium.

---

## 2. Decisions (agreed with the owner, 2026-10-10)

| Topic | Decision |
|---|---|
| Mood | Dark stage at the top of the page, flowing into the existing light (white / iMart green) store |
| 3D centrepiece | A 3D phone |
| Model | Owner-supplied `iPhone 18 Pro Max 8.glb` (author: Ranguel). Licence **CC0**, confirmed by the owner, no credit required. Optimized for the web (§6.1). |
| Build approach | One job per library (§5.1): Three.js + React Three Fiber + Drei, GSAP + ScrollTrigger, StringTune, Anime.js |
| Claims allowed | **Genuine products** · **Sealed / new in box** · **Warranty included** |
| Claims forbidden | "Apple Authorized Reseller", "authorized source", and any statistic, review, rating, offer or guarantee not listed above |
| Experience | The owner's written brief (2026-10-10) is the source of truth. §4 restates it, including the adjustments in §3. |

---

## 3. Adjustments to the owner's brief (agreed)

1. **Category rail and product tabs come from real data**, not the brief's iPhone / Mac / iPad / Watch / AirPods list. iMart doesn't sell iPad, Watch or AirPods today. Rail and tabs show categories that have active products, plus **Mac** by name match (MacBooks are currently uncategorized, and the navbar already matches them by name). New categories appear automatically.
2. **Services** are the three the site offers today: *Find your fit*, *Repairs & after-sales*, *Phone exchange*.
3. **The phone screen shows our own UI** (§6.6). The model ships with a third-party wallpaper image (iClarified), which is removed.
4. **The model's aperture-blade animation is not used.** Variable aperture is an iPhone 18 Pro feature, and the hero sells the iPhone 17 Pro. The blades stay static.
5. **The intro never waits for downloads.** If the 3D isn't ready when the light-reveal starts, the reveal plays over a still image rendered from the same model, and the live 3D crossfades in later.
6. **The Amarpath marquee is driven by GSAP.** StringTune's marquee has no way to follow scroll velocity; this was checked in its source.
7. **Moment 05 lands the phone in the first tile of the first store row**: the category rail's iPhone tile, which shows the hero product's photo.

---

## 4. Experience

### 4.0 Boot — "iMart comes alive"

- First visit per browser session only (`sessionStorage` flag; if storage is unavailable, play it).
- Total ≤ 1.2 s, hard cap. Any click, touch, wheel, scroll or key **immediately** finishes it. Users are never trapped.
- Reduced motion: skipped entirely, straight to the hero.

Sequence:

1. Pure black.
2. A tiny green point appears at the centre and pulses once.
3. The point stretches horizontally for a fraction of a second, like an electronic signal.
4. From that signal `i` `M` `a` `r` `t` rise independently, with very subtle depth.
5. The green `.` snaps into place: a sharp, satisfying pulse, not a bounce. About 100 ms of radial glow.
6. The dot becomes a **light source**. Its green light reveals the edge of the phone hiding in the darkness behind the logo. The intro reveals the hero product.
7. The letters move apart and leave the viewport while the camera seems to push through the dot.
8. The darkness peels away from the phone like a physical layer, with very subtle shader distortion.
9. Hero.

### 4.1 Hero — "The product emerges" (full viewport, dark stage)

**Environment.** Near-black, never flat. A barely-there GLSL atmosphere: deep emerald gradients, slow aurora movement, tiny grain, faint volumetric-looking light, soft reflections behind the device. The green light reads as physically lighting the phone.
**Never:** floating blobs, random particles, galaxies, obvious shader flexing.

**Phone.**
- Desktop: large, slightly right of centre. Mobile: centred, 45–55 % of initial viewport height.
- Pose: mostly front-facing, slightly rotated. Heavy, premium, almost stationary.
- Idle: 1–2 px vertical drift, tiny rotation, very long cycle.
- Desktop pointer: mouse right → the phone rotates about 2–3°; mouse up → a tiny perspective reaction.

**First wow.** When the hero has loaded, a narrow highlight travels along the metal edge, like studio photography. It reveals the camera ring, frame, glass and buttons, then disappears.

**Headline** (in negative space, never over the phone):
- Small label `NEW`.
- `YOUR NEXT / UPGRADE.`, then a brief pause, then `MAKE IT / A PRO.` The second line has noticeably more presence.
- Characters start slightly below the baseline at near-zero opacity, rise, tracking tightens, and everything settles into crisp type. No spring.

**Price.** `FROM` + the live database price of the hero product. Never hardcoded. If the price can't load, no amount is shown, only the product name and CTA.

**CTAs.**
- Primary `SHOP IPHONE 17 PRO →` (the label uses the hero product's name), iMart green. On desktop the button shifts 3–5 px toward an approaching pointer and its arrow shifts farther. On click it compresses very slightly. On mobile it's a normal tactile press.
- Secondary `TALK TO US ↗` opens WhatsApp.

**Pick your finish.** `PICK YOUR FINISH` with named swatches taken from the hero product's colours (Cosmic Orange · Deep Blue · Silver). On select, over 400–600 ms:
1. the phone's lighting dims slightly;
2. a thin vertical light travels across the device, revealing the new finish behind it;
3. the environment tint subtly follows the finish;
4. the label updates.

On mobile, swiping horizontally across the phone also changes finish. The swatches stay visible.

**Depth planes.** BACK: shader atmosphere. MID-BACK: a huge, barely visible word `PRO`. MID: phone. FRONT: UI plus tiny light/grain. Pointer movement shifts the planes at slightly different amplitudes. It should be extremely subtle.

**Scroll cue and hand-off.** `SCROLL TO EXPLORE · 01` with a thin vertical progress line. As scrolling starts, scrubbed with the scroll:
- the headline moves back in depth (it doesn't just fade);
- `PRO` grows;
- the phone moves to exact centre;
- the navigation simplifies;
- the environment darkens and the green glow narrows.

### 4.2 The pinned product film — one four-act film

Pinned length: desktop **400 vh** (allowed 350–450), mobile **250 vh** (allowed 220–280). The phone is the protagonist throughout. A persistent `01 02 03 04` indicator brightens the current act and mutes the ones already passed.

**Act 01 — `GENUINE. / SEALED. / YOURS.`**
- The hero UI clears; only the phone remains.
- The camera slowly orbits around its edge to the back. As it arrives, the environment light changes and the lenses catch highlights one at a time.
- Microdetail: for a moment the background bends through a camera lens, then snaps back. Almost subliminal; high tier only.
- A light travels around the outline of the device.
- Supporting copy uses only allowed claims: `GENUINE APPLE PRODUCT · SEALED · NEW IN BOX · WARRANTY INCLUDED`.

**Transition 01 → 02.** The camera stops behind the phone and the copy disappears. One green scan line travels vertically through the phone; where it passes, the shell turns temporarily transparent. Then the device opens: calmly, not explosively.

**Act 02 — `WE KNOW IT / INSIDE OUT.`**
- Layers: **BACK GLASS · BATTERY · LOGIC BOARD · FRAME · DISPLAY**, with realistic proportions, about 20–50 px apart on screen depending on viewport.
- The camera moves slightly sideways, creating depth.
- The logic board carries the iMart signal-green accent; everything else stays realistic.
- Small editorial leader-line labels draw in as you scroll.
- **Inside-out moment:** the camera slowly travels through the gap between two layers. The view becomes almost completely dark, then emerges on the other side into the after-sales copy: repairs and after-sales care at the Amarpath store.

**Transition 02 → 03.** The layers move back into alignment and lock one at a time (click, click, click, click), with subtle mechanical timing. When the display connects, the screen turns on, and the screen becomes the next scene.

**Act 03 — `PAY / YOUR WAY.`**
- The camera moves toward the screen; the phone becomes a frame around an original iMart payment UI.
- Only the methods iMart supports: **CASH** (on delivery or pickup) and **QR**. The highlighted method follows scroll progress. No Apple Pay.
- With QR selected, an abstract (non-scannable) QR pattern appears, then collapses into the iMart green dot.
- The dot becomes `✓ PAYMENT READY`, a neutral state. No fake completed transaction.
- **Special transition:** the ✓ becomes the location pin. Payment confirmation → green dot → map pin → delivery act: one shape becoming the next.

**Act 04 — `DELIVERED / IN BUTWAL.`**
- The screen becomes a stylised local delivery view: thin abstract streets, a few lines, one glowing point. No real map is loaded. The map emerges from darkness as if drawn by light, and the pin pulses.
- Copy: `HOME DELIVERY IN BUTWAL` and `PICKUP AT AMARPATH`.
- A restrained `ORDER CONFIRMED` notification enters, presented as a demonstration (no claim about the visitor's real order).

**The big transition (end of Act 04).**
- The map lines expand beyond the phone, escape the screen and spread across the viewport.
- White light enters from behind the phone and physically overtakes the dark environment (not a background-colour fade). The aurora disappears and the phone falls slightly backward.
- The green lines straighten into the alignment guides of the store section.
- WHITE. The phone has become the first card of the store (§3.7).

### 4.3 The store comes alive (light, calm, selling)

After the film: stop. White / off-white, black type, beautiful product imagery. The cinematics have earned attention; now the page sells.

Order: Category rail → Product showcase (tabs) → Benefits → Promo panels → Services → FAQ → Visit iMart.

- **Category rail.** Desktop: large, horizontally aligned product silhouettes. Mobile: swipeable rail. Built from real categories (§3.1). On entering, items arrive from slightly different Y positions (never chaotic). Desktop hover: the image tilts 1–2° and a very soft radial light follows the cursor inside the card. No big 3D transforms.
- **Product cards.** On scroll, each card reveals image first, then name, then price, then CTA. Desktop hover: the image rises about 5 px, the shadow changes subtly, the arrow moves. The product gets most of the movement.
- **Tab switching** (real categories + Mac). Outgoing products move back slightly, blur 3–4 px and fade. The new set comes forward, blur resolves to zero, opacity resolves, with a 40–70 ms stagger. It should feel like changing physical display shelves.
- **Benefits.** Each icon starts as a single stroke that draws itself, then its text enters. Items: `GENUINE PRODUCTS` · `WARRANTY INCLUDED` · `DELIVERY IN BUTWAL` · `AFTER-SALES SUPPORT`.
- **Promo panels.** Massive editorial panels, about 70 % image / 30 % type, very little text. Images move slower than the viewport, and background and image move independently. They should never look like rectangular banners.
- **Services.** Large `01 02 03` numbers with no card backgrounds: `01 FIND YOUR FIT`, `02 REPAIRS & AFTER-SALES`, `03 PHONE EXCHANGE`. On entering, the numbers roll rapidly into place and an arrow line expands.
- **FAQ.** Simple, no cinematics. Smooth height interpolation, a plus that rotates only a few degrees toward a minus, excellent reading.
- **Visit iMart (second cinematic moment).** Huge type travels horizontally: `AMARPATH · BUTWAL · RUPANDEHI ·` repeating. Its speed follows scroll velocity: slow scroll moves it slowly, fast scroll surges it briefly, and it eases down when scrolling stops. A green point appears, a line draws outward and forms a simplified map/pin graphic. Beside it: `VISIT IMART` with `FIND OUR STORE ↗` (slightly magnetic on desktop). On desktop the map line reacts subtly to the pointer.

### 4.4 Global systems

**Cursor (desktop, fine pointers only).** The standard pointer always stays visible. A secondary precision ring of 22–28 px: a thin ring normally, slightly larger over links. Contextual labels only where meaningful: `VIEW` (product), `SELECT` (finish control), `CHAT ↗` (WhatsApp), `MAP ↗` (store). Removed entirely on touch devices.

**Motion language.** Three speeds, each with its own easing. The phone is heavier than the interface.

| Speed | Duration | Used for | Easing (starting values) |
|---|---|---|---|
| Fast | 100–250 ms | presses, tabs, cursor, small controls | `cubic-bezier(.2,.7,.2,1)` |
| Normal | 400–700 ms | cards, text, image reveals, colour changes | `cubic-bezier(.16,1,.3,1)` |
| Cinematic | 900–1800 ms | camera, phone, major transitions, environment | GSAP `power3.inOut`, with longer settles for the phone |

**Scroll.** Exactly one scroll system. Desktop: StringTune smooth scrolling, which writes the real document scroll position, so GSAP ScrollTrigger reads it natively (§5.4). Mobile: native scroll, no smoothing, no hijacking, no horizontal traps, shortened pins.

**Mobile.** Logo intro → phone hero → finish selector → compressed four-act story → store. During the film the phone sits in the upper 42–48 % of the viewport and the text in the lower area, never behind the device. Smaller layer separation, simpler shader, lower pixel ratio, no pointer or hover effects, no expensive post-processing. Mobile keeps the light sweep, device assembly, screen transformation, map-pin transition and dark-to-light transition.

---

## 5. Architecture

### 5.1 One job per library

| Library | Owns | Never touches |
|---|---|---|
| **StringTune** `@fiddle-digital/string-tune@1.2.6` (exact pin) | Desktop smooth scroll (native-mobile mode on touch); pointer depth for the hero planes (cursor module CSS vars); magnetic CTAs (small `strength`); split-text glyph vars for headlines; card spotlight and 1–2° tilt; cursor-ring position and target classes; slow promo-image parallax | The pinned film, the marquee |
| **GSAP + ScrollTrigger** (+ `@gsap/react`) | The pinned film master timeline (scrubbed); hero → film hand-off; white flood; map lines → store grid; Amarpath velocity marquee | Time-based UI |
| **Anime.js** v4 | Boot intro; finish-change sequence; entrance timelines (image → name → price → CTA); benefit stroke drawing (`svg.createDrawable`); services number roll; tab shelf swap; FAQ height; cursor label morphs; button press | Scroll position |
| **Three.js + R3F + Drei** | Phone, procedural internals, material/shader patches, atmosphere, camera rig, phone-screen UI | DOM |

### 5.2 Modules

```
src/app/(store)/page.tsx               server: data → props (hero product, finishes, price, categories, products)
src/components/landing/
  landing-experience.tsx               client: tier, motion bootstrap, composes sections, owns teardown
  scene-store.ts                       plain mutable store (no React state) shared by GSAP/Anime → R3F
  config.ts                            hero slugs, finish palette, motion tokens, film timeline ranges
  motion/
    string-tune.ts                     StringTune adapter: start/destroy, modes, ScrollTrigger sync
    gsap.ts                            plugin registration, shared eases
    tier.ts                            quality-tier detection + downgrade
  intro/boot-intro.tsx                 Anime.js boot sequence + fallback reveal
  hero/hero-stage.tsx                  SSR headline/price/CTAs/PRO plane/scroll cue
  hero/finish-picker.tsx               radiogroup → scene store + Anime sequence
  film/product-film.tsx                pinned section, master timeline, act copy, 01–04 rail
  film/layer-labels.tsx                SVG leader lines tracking projected layer anchors
  film/map-escape.tsx                  full-viewport SVG lines (homography to screen quad → store grid)
  three/phone-canvas.tsx               lazy (next/dynamic, ssr:false): Canvas, DPR, frameloop control
  three/phone-model.tsx                load GLB (meshopt), split material groups into layers, finishes
  three/phone-internals.tsx            procedural battery + logic board
  three/atmosphere.tsx                 GLSL backdrop: emerald gradient, aurora, grain, glow, white flood
  three/camera-rig.tsx                 keyframed camera path driven by film progress
  three/materials/*.ts                 onBeforeCompile patches: finish wipe + band, scan dither, light sweep
  three/screen/*.ts                    screen ShaderMaterial (SDF UI) + label atlas (Canvas2D, once)
  store/category-rail.tsx · product-showcase.tsx · benefits.tsx · promo-panels.tsx
  store/services.tsx · faq.tsx · visit-marquee.tsx · store-location.tsx
  cursor/precision-cursor.tsx
public/models/iphone.v1.glb            optimized model (committed)
public/renders/*.webp                  stills rendered from the model (committed)
scripts/build-phone-model.mjs          source GLB → optimized GLB + stills
assets-src/iphone-18-pro-max/          original 23.6 MB download (git-ignored)
```

Replaced or removed: `store-hero.tsx`, `home-products.tsx` (superseded by `product-showcase`), and the unused `smooth-scroll`, `scroll-progress`, `custom-cursor`, `magnetic`, `reveal`, `ripple`, `tilt-card`, `stats-counter`, `phone-trio`, plus the `lenis` and `framer-motion` dependencies.

### 5.3 Data rules

- **Hero product:** the first active product with stock > 0 in the ordered list `apple-iphone-17-pro`, `apple-iphone-17-pro-max`. If neither qualifies, the first in-stock product in the `iphone` category. If none, the hero shows no product name or price and its CTA goes to `/products?category=iphone`.
- **Display name:** the hero product's name with a leading "Apple " removed, uppercased in the CTA (`SHOP IPHONE 17 PRO →`).
- **Finishes:** parsed from the hero product's `color` field (comma-separated, trimmed, case-insensitive), then matched against the palette in `config.ts` (§6.4). Unknown names get the neutral fallback finish with their own label. No colours means no picker.
- **Price:** comes from the database at render time (`revalidate = 60`). If missing, it isn't rendered. There are no fallback numbers anywhere.
- **Rail and tabs:** categories with ≥ 1 active product, in the existing category order, plus **Mac** (name match `/macbook/i`) when such products exist.
- Only public catalogue fields cross into client components, as today.

### 5.4 State and scroll sync

- `scene-store.ts` is a plain object with typed fields: intro progress, film progress and act, explode amount, scan position, screen state values, finish from/to/wipe, pointer, flood, tier. GSAP and Anime.js write to it; R3F reads it in `useFrame`. Scrolling causes **no React re-renders**.
- StringTune runs in `smooth` mode on desktop and `default` (native) mode on mobile. It writes the real scroll position, so ScrollTrigger reads native scroll. ScrollTrigger is updated on StringTune's scroll event, and `ScrollTrigger.refresh()` runs after fonts load, after the GLB loads and on resize. GSAP uses `ignoreMobileResize`.
- Keyboard, scrollbar and anchor scrolling must keep working with smooth scroll on (covered by tests).

### 5.5 Loading and caching

1. **Server HTML** contains every word: headline, price, CTAs, act copy, store. The page is readable and shoppable without JS.
2. **Hero still** (`public/renders/hero-*.webp`, responsive sizes, `fetchpriority="high"`) is the LCP element.
3. **Motion libraries** (StringTune, GSAP, Anime.js, about 135 KB gz) load on the home route only, at hydration.
4. **The Three.js chunk and the GLB** start loading immediately on High/Mid tiers (`next/dynamic`, `ssr: false`, inside a client component). The live phone crossfades in over the still once its first frame is rendered.
5. `next.config` `headers()`: `/models/:path*` and `/renders/:path*` get `Cache-Control: public, max-age=31536000, immutable`. Filenames are versioned (`iphone.v1.glb`).

### 5.6 Header stages (home page only)

The landing sets `data-stage` on the storefront wrapper: `boot` → `hero` → `film` → `light`. CSS in `store.css`:

| Stage | Header |
|---|---|
| `boot` | Header hidden |
| `hero` | Topbar and header transparent over the dark stage, light text |
| `film` | Simplified: logo and bag only |
| `light` | The normal white header |

The hero extends beneath the header. Pages without the attribute are unaffected.

### 5.7 Lifecycle

All setup happens in effects and all teardown in their cleanups:
- `StringTune.destroy()`
- kill ScrollTriggers and timelines
- cancel Anime.js animations
- dispose the WebGL renderer, geometries, materials and textures
- remove `data-stage`

This keeps the page correct across client navigations and if `cacheComponents` / Activity is enabled later, since hidden routes run effect cleanups.

---

## 6. The 3D phone

### 6.1 Model pipeline

- Source: `iPhone 18 Pro Max 8.glb`. 23.6 MB, about 67k triangles, real-world scale in metres (79.2 × 163.4 × 13.3 mm). One multi-material mesh (20 materials) plus 6 aperture blades and one blade animation.
- `scripts/build-phone-model.mjs` (`@gltf-transform`):
  - removes the wallpaper image (4.3 MB) and the blade animation;
  - resizes textures: anodized normal 13.5 MB → 1024² WebP, mesh color/normal → 256², screw normal → 256²;
  - compresses geometry with meshopt (decoder bundled with three, no CDN);
  - writes `public/models/iphone.v1.glb`. **Budget ≤ 2.5 MB, target ≈ 1.5 MB.**
- The same script renders WebP stills with a headless browser and the real scene: hero (front ¾), back ¾, exploded, screen states, and hero variants per finish. They're used for the LCP image, the intro fallback and the Low tier.
- The original moves from `src/components/iphone-18-pro-max/` to `assets-src/` (git-ignored). Only optimized outputs are committed.

### 6.2 Layer map (material → layer)

Separation runs along the model's thickness axis (local +Y = toward the back).

| Layer (back → front) | Source |
|---|---|
| BACK GLASS | `Frosted glass`, `Tinted glass` (logo) |
| BATTERY | procedural (§6.3) |
| LOGIC BOARD | procedural (§6.3) |
| FRAME | `Anodized aluminum` (unibody incl. back and plateau), `Plastic antena`, `Plastic port`, `Metal mesh`, `Metal tint`, `Metal Screw`, all camera materials and blades |
| DISPLAY | `Glass`, `OLED`, `OLED off`, `Display Frame` |

The OLED mesh keeps its UVs. Its material is replaced by the screen shader (§6.6).

### 6.3 Procedural internals

Both are hidden until the device opens, and sized to sit inside the unibody footprint.
- **Battery:** rounded slab occupying the lower ~60 % of the footprint. Dark satin finish with a subtle neutral label (no brand marks), thin flex lead.
- **Logic board:** board in the upper ~35 % with a camera cut-out. Dark PCB with low-relief chips and shields, and fine traces in **iMart signal green** (emissive, the only coloured element).

### 6.4 Finishes (starting values, tuned visually)

| Finish (name match) | Aluminium | Frosted glass | Metalness / roughness |
|---|---|---|---|
| cosmic orange | `#D86A2B` | `#E58A55` | 0.45 / 0.35 |
| deep blue | `#2E3B55` | `#3B4A68` | 0.45 / 0.35 |
| silver | `#D5D7DA` | `#E4E6E8` | 0.65 / 0.28 |
| *fallback* | `#3A3B3E` | `#4A4C50` | 0.45 / 0.35 |

### 6.5 Lighting

- Drei `<Environment>` built from `<Lightformer>` studio strips. No HDR downloads.
- The environment re-renders only while a light is moving (load sweep, finish change, Act 01 outline light).
- A green key light provides the "signal" glow.
- Tone mapping: ACES filmic. Exposure is part of the scene store (used for the inside-out darkening).

### 6.6 Screen UI (shader, SDF-drawn, resolution-independent)

States, all driven by scene-store values:
- off;
- power-on;
- iMart wallpaper (our own emerald gradient);
- payment selector (CASH / QR) with a sliding highlight;
- abstract QR grid → collapse to dot;
- dot → ✓ (`PAYMENT READY`) → pin, via distance-field blending;
- delivery map draw-on with pin pulse and `HOME DELIVERY IN BUTWAL` / `PICKUP AT AMARPATH`;
- `ORDER CONFIRMED` notification.

Text comes from a label atlas drawn once with Canvas2D in the site font. The street layout lives in one shared module used by both the shader and `map-escape.tsx`.

### 6.7 Film timeline (initial ranges, p = film progress 0 → 1)

| p | Beat |
|---|---|
| 0.00–0.08 | Hero UI clears, camera begins orbit |
| 0.08–0.20 | Back reveal, lens highlights, lens refraction (High), outline light, Act 01 copy |
| 0.20–0.28 | Copy out, scan line, shell dithers transparent, separation begins |
| 0.28–0.38 | Layers separated, sideways camera, leader lines draw |
| 0.38–0.50 | Fly-through between layers (darkening), emerge, Act 02 after-sales copy |
| 0.50–0.58 | Layers lock one by one, display connects, screen powers on |
| 0.58–0.68 | Camera to screen, CASH ↔ QR highlight |
| 0.68–0.77 | QR → dot → ✓ PAYMENT READY → pin |
| 0.77–0.90 | Map draws by light, pin pulse, delivery labels, ORDER CONFIRMED (demo) |
| 0.90–1.00 | Lines escape, white flood, phone falls back, lines → store guides, phone → first store tile |

---

## 7. The six signature moments: how they're built

1. **The green dot becomes the light that reveals the phone.**
   - The DOM + Anime.js logo sequence plays instantly.
   - At the reveal, a green light in the 3D scene at the dot's screen position ramps up and rim-lights the phone edge. The letters drift apart and the camera dollies forward.
   - "Darkness pulled away" is a full-screen shader layer that peels open from the dot with a noise-distorted edge.
   - Without 3D, the same choreography runs with a CSS mask over the hero still.
2. **The finish change sends a studio light across the device.**
   - The finish materials get a wipe: old colour on one side of a moving vertical band, new on the other, with an emissive band at the edge.
   - Anime.js sequences dim → sweep → tint → label in about 500 ms.
   - The load "wow" uses a moving strip light in the environment, so reflections physically travel along the metal.
3. **The phone opens into separated layers and the camera moves between them.**
   - The scan line uses dithered (screen-door) transparency, avoiding transparent-sort artefacts.
   - Layer offsets follow the explode value. The camera follows a Catmull-Rom path through the gap between two layers, with an exposure dip to near black.
   - Reassembly uses per-layer staggered locks with a sharp settle and a specular glint at each seam.
4. **The payment confirmation morphs into the Butwal pin.** A distance-field blend inside the screen shader: dot → check → pin, one continuous shape.
5. **The delivery map escapes the phone and becomes the store grid.**
   - `map-escape.tsx` draws the same street lines in a full-viewport SVG, transformed by a perspective transform (matrix3d) onto the phone screen's projected corners each frame. The hand-off from the shader is pixel-aligned.
   - GSAP then expands the clip to the viewport and morphs the lines into straight guides measured from the store rail's real layout.
   - The atmosphere shader's flood term brings white light from behind the phone.
   - The phone tracks the first store tile's live rectangle and crossfades into its photo.
   - The canvas stops rendering until you scroll back.
6. **The Amarpath marquee reacts to scroll velocity.** A GSAP seamless loop whose time scale is set from ScrollTrigger velocity through a smoothed tween (surge, then ease back to the base speed).

---

## 8. Light store sections

| Section | Effects | Library |
|---|---|---|
| Category rail | Staggered Y arrival; hover tilt 1–2° + cursor spotlight; mobile swipe (native scroll-snap) | Anime.js · StringTune |
| Product showcase | Image → name → price → CTA reveal; hover lift 5 px + shadow + arrow; tab shelf swap (back + blur 3–4 px + fade / forward + unblur, 40–70 ms stagger) | Anime.js · CSS |
| Benefits | Stroke draw, then text | Anime.js |
| Promo panels | Image slower than the viewport, independent background drift | StringTune |
| Services | Number roll + arrow line expand on enter | Anime.js |
| FAQ | Smooth height, plus rotates a few degrees | Anime.js |
| Visit iMart | Velocity marquee; dot → line → pin draw; magnetic button; pointer-reactive map line | GSAP · Anime.js · StringTune |

Entrances trigger once, when an element enters the viewport (IntersectionObserver).

---

## 9. Quality tiers

The tier is chosen at runtime from:
- WebGL2 support;
- `prefers-reduced-motion`;
- Save-Data;
- `deviceMemory` / `hardwareConcurrency`;
- pointer type.

A performance monitor can step **down** one tier if FPS stays under 50, but never in the middle of the film and never back up within a session.

| Tier | Who | What runs |
|---|---|---|
| **High** | Desktop with a capable GPU | Everything: full atmosphere, moving environment light, lens refraction moment, DPR ≤ 2, smooth scroll, cursor, pointer depth |
| **Mid** | Phones, tablets, average laptops | Simplified atmosphere (fewer octaves, no volumetric term), static environment + shader sweeps, no transmission, DPR ≤ 1.5. On touch devices also: ~60 % layer separation, native scroll, no pointer/hover effects, 250 vh film. Mid-tier laptops keep smooth scroll and the 400 vh film. |
| **Low** | Reduced motion, Save-Data, no WebGL, low memory | No canvas. Stills of the same phone with crossfades and CSS transforms. The film is a stacked, unpinned story. No intro under reduced motion. Store unchanged. |

## 10. Failure handling

- **GLB load failure or WebGL context loss:** switch to the Low presentation in place, without breaking scroll (`ScrollTrigger.refresh()`).
- **Database failure:** no price, generic iPhone CTA, the store renders whatever data loaded.
- **Intro:** hard 1.2 s cap and skip on any input.
- **No JS:** server HTML and the hero still.

## 11. Accessibility

- All copy is real HTML text (headings per act), never baked into WebGL. The canvas is `aria-hidden`; stills have alt text.
- The finish picker is a radiogroup with arrow-key support and visible focus.
- The intro is decorative: no focus trap, skippable by any key.
- Text contrast on the dark stage is ≥ 4.5:1. Brand green `#176b48` is used for fills and glows; a lighter signal green is used for text on dark.
- The cursor ring is decorative; the native pointer always shows.
- Reduced motion → Low tier.

## 12. Performance budgets

| Item | Budget |
|---|---|
| Motion libraries on `/` (gz) | ≤ 140 KB |
| Lazy 3D chunk (gz) | ≤ 260 KB |
| GLB | ≤ 2.5 MB (target 1.5 MB) |
| Each still (WebP) | ≤ 120 KB; hero still ≤ 90 KB |
| LCP (mid mobile, 4G) | ≤ 2.5 s |
| CLS | < 0.05 |
| Frame rate | High: steady 60 fps on the dev machine (Iris Xe); Mid: ≥ 50 fps |

## 13. Testing (every phase)

- `tsc`, ESLint and `next build` pass.
- Playwright on the real GPU (Edge, D3D11):
  - **Intro:** finishes ≤ 1.2 s and skips on input.
  - **Fallback paths:** reduced-motion and no-WebGL render stills with no pin.
  - **Finish picker:** updates the label and `aria-checked`.
  - **Film:** acts 01–04 copy and rail state at set scroll positions.
  - **Flood:** the store rail is visible after it.
  - **Header:** `data-stage` transitions.
  - **Console:** no errors.
  - **Phone width:** no horizontal overflow at 390 px.
  - **Regression:** the cart → checkout flow (without submitting).
- Screenshot strips at about 12 scroll positions, desktop (1440×900) and mobile (390×844), reviewed each phase.
- Frame-time sampling during a scripted scroll; bundle-size report from the build; GLB size check.

## 14. Delivery phases

Each phase leaves the site working and is committed separately.

1. **Foundation:**
   - dependencies;
   - model pipeline (optimized GLB + stills);
   - motion adapters, scene store and tiers;
   - SSR page skeleton with all copy;
   - header stages;
   - removal of the old components and dependencies.
2. **Intro + hero + cursor:** moments 01 and 02.
3. **Product film:** acts 01–04, internals, screen shader, moments 03 and 04.
4. **Big transition + store sections:** moment 05.
5. **Visit marquee (moment 06) + Mid/Low tiers + polish.** Owner checks on a real Android phone and iPhone before going live.

## 15. Risks and notes

- **Moment 05 is the hardest piece** (projected-quad overlay sync). Prototype it at the start of phase 4. Fallback: the lines expand as an overlay with a crossfade instead of exact alignment.
- **StringTune is young** (1.2.x, frequent releases). Pin the exact version and keep it behind `motion/string-tune.ts`.
- **Headless GPU tests aren't real phones.** The owner must check on real devices before launch.
- **The model is an iPhone 18 Pro Max design** while the hero sells the iPhone 17 Pro. They're visually near-identical, and the owner has accepted this.
- **Data hygiene (owner action):** the test product "Srijit Gyawali" (Rs 2,95,895) is active in the iPhone category and would appear in the rail and tabs. MacBooks have no category.
- **iPhone 17 Pro stock is 2.** The hero automatically falls back to the 17 Pro Max.
- **React Compiler is enabled.** Keep per-frame mutation inside `useFrame` and refs, and smoke-test R3F under the compiler in phase 1.

## 16. Out of scope

- Redesign of other pages;
- real maps or real payment flows;
- Apple Pay;
- AR;
- admin changes;
- new categories or data changes (owner actions);
- i18n.
