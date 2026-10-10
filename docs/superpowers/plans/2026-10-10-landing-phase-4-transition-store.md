# Landing Phase 4 (Big Transition + Living Store) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build moment 05 and the store's motion.

Moment 05, at film p 0.90 → 1.00:
- the delivery map's lines escape the phone and spread across the viewport;
- white light floods in from behind the phone while the aurora fades;
- the lines straighten into the store's real column guides;
- the phone falls back and descends toward the first store tile.

The light store comes alive with:
- staggered entrances;
- tile tilt and cursor light;
- image → name → price → CTA reveals;
- shelf-like tab swaps;
- benefit icons drawing themselves;
- promo parallax;
- rolling service numbers;
- smooth FAQ height;
- the Visit pin drawing itself.

**Architecture:**
- **Escaping lines:** `film/streets.ts` is the single source for the map. The screen shader's GLSL array and the escaping SVG lines are both generated from it, so the hand-off is exact.
- **The phone:** publishes its projected screen rectangle each frame; `film/escape-lines.tsx` maps the streets onto it, then escapes and straightens them using the film timeline.
- **The flood:** a fixed layer *under* the canvas, so the phone stays visible on white.
- **Store motion:** lives in `motion/store-motion.ts`. Entrances fire once via IntersectionObserver (Anime.js); promo parallax uses StringTune `data-string="parallax"`. Hidden pre-entrance states are only applied by JavaScript, so content is never lost without it.

**Spec:** §4.2 (big transition), §4.3, §7 (moment 05), §8.

## Global Constraints

Phases 1–3 still apply. In addition:

- **Durations:** entrances 400–700 ms; tab swap with a 40–70 ms stagger and 3–4 px blur; tile tilt ≤ 2°; card image lift 5 px.
- **Reduced motion:** no entrance hiding, no tilt, instant FAQ. Content is always visible.
- **Map geometry:** streets are defined only in `film/streets.ts`.
- **Guides:** lines straighten into the rail's real tile edges, measured from the DOM.

---

### Task 1: Shared streets + timeline extension (tested)

- [ ] **Step 1: `src/components/landing/film/streets.ts`**

```ts
/** The stylised delivery map, in screen space: x ∈ [-0.23, 0.23], y ∈ [-0.5, 0.5] (y up). */
export const STREETS: ReadonlyArray<readonly [number, number, number, number]> = [
  [-0.23, 0.3, 0.23, 0.24], [-0.23, 0.02, 0.23, 0.1], [-0.23, -0.16, 0.23, -0.1],
  [-0.12, 0.38, -0.06, -0.3], [0.1, 0.4, 0.04, -0.3], [-0.23, 0.19, 0, 0.08],
  [0, 0.08, 0.23, -0.02], [-0.18, -0.3, 0.18, -0.22], [0.18, 0.4, 0.23, 0.2],
];

/** The phone screen's aspect (width / height); screen space spans [-ASPECT/2, ASPECT/2] × [-0.5, 0.5]. */
export const SCREEN_ASPECT = 0.4605;

export function glslStreets(): string {
  const items = STREETS.map((s) => `vec4(${s.map((v) => v.toFixed(3)).join(", ")})`).join(", ");
  return `const vec4 STREETS[${STREETS.length}] = vec4[${STREETS.length}](${items});`;
}
```

`screen-ui.ts` imports `glslStreets` and `SCREEN_ASPECT`. Its hard-coded `STREETS` array and `#define SCREEN_ASPECT` are replaced with the generated array and `#define SCREEN_ASPECT ${SCREEN_ASPECT}`, and the loop bound becomes `STREETS.length`.

- [ ] **Step 2: Extend the tests** — append to `film-timeline.test.ts`

```ts
test("the big transition: escape, flood, guides, landing — in that order", () => {
  const b = (p: number) => filmBeats(p);
  assert.equal(b(0.89).escape, 0);
  assert.ok(b(0.93).escape > 0 && b(0.93).flood < b(0.93).escape);
  assert.ok(b(0.97).guides > 0.4 && b(0.97).flood > 0.6);
  assert.ok(b(1).flood > 0.99 && b(1).guides > 0.99 && b(1).land > 0.99);
  assert.ok(b(0.95).power < b(0.9).power, "screen powers down as the lines leave it");
});

test("the phone falls back at the end of the film", () => {
  const end = filmPose(1);
  assert.ok(end.scale < 0.7 && end.pitch < -0.2);
});
```

- [ ] **Step 3: `film-timeline.ts` changes**
  - **Pose:** replace the last key `[1, …scale 1.1…]` with `[0.9, { yaw: 0, pitch: 0, scale: 1.1, exposure: 1, gap: 0, x: 0 }]` and `[1, { yaw: 0.12, pitch: -0.32, scale: 0.55, exposure: 1.15, gap: 0, x: 0 }]`.
  - **Beats:** add `escape: ramp(p, 0.9, 0.945)`, `flood: ramp(p, 0.92, 0.985)`, `guides: ramp(p, 0.945, 0.995)` and `land: ramp(p, 0.95, 1)`.
  - **Power:** change to `(1 - window4(p, 0.18, 0.22, 0.56, 0.585)) * (1 - ramp(p, 0.91, 0.95))`.

- [ ] **Step 4:** Run `npm test` (all pass), then commit — `feat(landing): shared street map; film timeline covers the big transition`.

---

### Task 2: Store the screen rect, the first tile and the flood (3D + scene)

- [ ] **Step 1: `scene-store.ts`** — extend `film`

```ts
export const film = {
  progress: 0,
  labels: Array.from({ length: 5 }, (): FilmLabel => ({ x: 0, y: 0, visible: false })),
  /** The phone screen's projected rectangle in CSS px: left, top, right, bottom. */
  screen: { l: 0, t: 0, r: 0, b: 0 },
  /** The first store tile's image rectangle in viewport px (measured; x is scroll-independent). */
  tile: { x: 0, w: 0 },
};

export function setFilmScreen(l: number, t: number, r: number, b: number) {
  Object.assign(film.screen, { l, t, r, b });
}

export function setFilmTile(x: number, w: number) {
  film.tile.x = x;
  film.tile.w = w;
}
```

- [ ] **Step 2: `phone-model.tsx` `frame()`.**
  - **Landing (after the film placement):** while `beats.land > 0`, move the phone toward the first tile's column and down toward the store:

```ts
  if (beats.land > 0 && film.tile.w > 0) {
    const tileX = ((film.tile.x + film.tile.w / 2) / state.size.width - 0.5) * vw;
    place.position.x = MathUtils.lerp(place.position.x, tileX, beats.land);
    place.position.y = MathUtils.lerp(place.position.y, -vh * 0.42, beats.land);
  }
```

  - **Screen rect:** after the labels, publish the projected screen rectangle (upright frame: half-width 0.0365 m, half-height 0.079 m, front face z 0.004):

```ts
  let l = Infinity, tp = Infinity, r = -Infinity, bt = -Infinity;
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    scratch.set(sx * 0.0365, sy * 0.079, 0.004).applyMatrix4(place.matrixWorld).project(state.camera);
    const px = ((scratch.x + 1) / 2) * state.size.width;
    const py = ((1 - scratch.y) / 2) * state.size.height;
    l = Math.min(l, px); r = Math.max(r, px); tp = Math.min(tp, py); bt = Math.max(bt, py);
  }
  setFilmScreen(l, tp, r, bt);
```

- [ ] **Step 3: `atmosphere.tsx`.** Add `uniform float uFlood;`, and at the end of `main()` before output: `col *= 1.0 - uFlood; alpha *= 1.0 - uFlood;`. In `tick()` set `u.uFlood.value = filmBeats(film.progress).flood`.
- [ ] **Step 4: `landing-experience.tsx`.**
  - Render `<div className="landing-flood" aria-hidden="true" />` just **before** `PhoneLayer` (same z-index 0, earlier in the DOM → under the canvas).
  - Measure the first rail tile on mount and resize: `setFilmTile(rect.left, rect.width)` of `.rail-tile`.
- [ ] **Step 5: `motion/film.ts` `apply()`.** Set `root.style --flood` to `beats.flood.toFixed(3)`. Also set `--fx` / `--fy` (phone screen centre in px, from `film.screen`).
- [ ] **Step 6: `landing.css`**

```css
/* White light floods in from behind the phone (under the canvas, so the phone stays on top). */
.landing-flood {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: min(1, calc(var(--flood, 0) * 4));
  background: radial-gradient(circle at var(--fx, 50%) var(--fy, 50%), #ffffff calc(var(--flood, 0) * 140vmax), rgba(255, 255, 255, 0) calc(var(--flood, 0) * 140vmax + 26vmax));
}
.landing[data-stage="light"] .landing-flood, .landing:not([data-film]) .landing-flood { display: none; }
```

---

### Task 3: Escaping lines → store guides (moment 05)

- [ ] **Step 1: `src/components/landing/film/escape-lines.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { filmBeats } from "./film-timeline";
import { SCREEN_ASPECT, STREETS } from "./streets";
import { film } from "../scene-store";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Guide targets: the rail tiles' left/right edges as vertical lines, plus one horizontal rule. */
function measureGuides(): Array<[number, number, number, number]> {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const edges: number[] = [];
  document.querySelectorAll<HTMLElement>(".rail-tile").forEach((tile) => {
    const r = tile.getBoundingClientRect();
    edges.push(r.left, r.right);
  });
  const guides: Array<[number, number, number, number]> = [];
  for (let i = 0; i < STREETS.length - 1; i++) {
    const x = edges.length ? edges[Math.min(i, edges.length - 1)] : (w * (i + 1)) / STREETS.length;
    guides.push([x, -h * 0.1, x, h * 1.1]);
  }
  guides.push([-w * 0.1, h * 0.82, w * 1.1, h * 0.82]);
  return guides;
}

function draw(svg: SVGSVGElement, lines: SVGLineElement[], guides: Array<[number, number, number, number]>) {
  const p = film.progress;
  const beats = filmBeats(p);
  const visible = beats.escape > 0 && p < 0.999;
  svg.style.visibility = visible ? "visible" : "hidden";
  if (!visible) return;
  const s = film.screen;
  const cx = (s.l + s.r) / 2;
  const cy = (s.t + s.b) / 2;
  const sw = s.r - s.l;
  const sh = s.b - s.t;
  const spread = 1 + beats.escape * 5;
  lines.forEach((line, i) => {
    const [ax, ay, bx, by] = STREETS[i];
    // Screen space → px on the phone, then pushed outward from the screen centre (escape).
    const toPx = (x: number, y: number) => [
      cx + (x / SCREEN_ASPECT) * sw * spread,
      cy - y * sh * spread,
    ];
    const [x1, y1] = toPx(ax, ay);
    const [x2, y2] = toPx(bx, by);
    const g = guides[i];
    line.setAttribute("x1", lerp(x1, g[0], beats.guides).toFixed(1));
    line.setAttribute("y1", lerp(y1, g[1], beats.guides).toFixed(1));
    line.setAttribute("x2", lerp(x2, g[2], beats.guides).toFixed(1));
    line.setAttribute("y2", lerp(y2, g[3], beats.guides).toFixed(1));
  });
  // Signal green while escaping, store-line grey once they are guides.
  svg.style.setProperty("--guide", beats.guides.toFixed(3));
}

/** Moment 05: the map's lines escape the screen and straighten into the store's guides. */
export function EscapeLines() {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const lines = Array.from(svg.querySelectorAll<SVGLineElement>("line"));
    let guides = measureGuides();
    const onResize = () => {
      guides = measureGuides();
    };
    let frame = 0;
    const tick = () => {
      draw(svg, lines, guides);
      frame = requestAnimationFrame(tick);
    };
    window.addEventListener("resize", onResize);
    frame = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <svg ref={ref} className="escape-lines" aria-hidden="true">
      {STREETS.map((_, i) => (
        <line key={i} />
      ))}
    </svg>
  );
}
```

- [ ] **Step 2:** Render `<EscapeLines />` inside `.film-stage` in `product-film.tsx`, after `<FilmLabels />`.

- [ ] **Step 3: `landing.css`**

```css
.escape-lines { display: none; }
.landing[data-film="pinned"] .escape-lines { display: block; position: fixed; inset: 0; width: 100vw; height: 100vh; z-index: 1; pointer-events: none; visibility: hidden; }
.escape-lines line {
  stroke: color-mix(in srgb, #3ddc84 calc((1 - var(--guide, 0)) * 100%), #dfe5de);
  stroke-width: calc(1.6px - var(--guide, 0) * 0.6px);
  stroke-linecap: round;
  filter: drop-shadow(0 0 calc((1 - var(--guide, 0)) * 6px) rgba(61, 220, 132, .7));
}
```

- [ ] **Step 4:** Verify (tsc, eslint, build), then commit — `feat(landing): moment 05 — lines escape the phone into the store's guides, white flood`.

---

### Task 4: The living store

- [ ] **Step 1: `src/components/landing/motion/store-motion.ts`**

```ts
import { animate, createTimeline, stagger, svg, utils } from "animejs";

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Hides `targets` now (JS only) and plays `play` once when `trigger` scrolls into view. */
function onEnter(trigger: Element | null, targets: Element[], play: () => void): () => void {
  if (!trigger || targets.length === 0) return () => {};
  utils.set(targets, { opacity: 0 });
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      observer.disconnect();
      play();
    },
    { threshold: 0.18 },
  );
  observer.observe(trigger);
  return () => {
    observer.disconnect();
    utils.set(targets, { opacity: 1 });
  };
}

/** Product cards: the image first, then name, price and CTA. */
export function revealCards(cards: Element[]) {
  cards.forEach((card, i) => {
    const parts = [
      card.querySelector(".shop-product-image"),
      card.querySelector("h3"),
      card.querySelector(".product-card-bottom"),
    ].filter((el): el is Element => el !== null);
    utils.set(card, { opacity: 1 });
    animate(parts, { opacity: [0, 1], y: [14, 0], duration: 560, delay: stagger(70, { start: i * 60 }), ease: "outQuart" });
  });
}

/** Tab switch: current shelf steps back and blurs out; the next comes forward and resolves. */
export function shelfOut(cards: Element[]): Promise<void> {
  if (reduced() || cards.length === 0) return Promise.resolve();
  return new Promise((resolve) => {
    animate(cards, {
      opacity: [1, 0],
      scale: [1, 0.97],
      filter: ["blur(0px)", "blur(4px)"],
      duration: 180,
      delay: stagger(25),
      ease: "inQuad",
      onComplete: () => resolve(),
    });
  });
}

export function shelfIn(cards: Element[]) {
  if (reduced() || cards.length === 0) return;
  animate(cards, {
    opacity: [0, 1],
    scale: [1.02, 1],
    filter: ["blur(4px)", "blur(0px)"],
    duration: 480,
    delay: stagger(55),
    ease: "outQuart",
  });
}

function tilt(track: HTMLElement): () => void {
  const move = (e: PointerEvent) => {
    const tile = (e.target as Element).closest<HTMLElement>(".rail-tile");
    if (!tile || e.pointerType !== "mouse") return;
    const r = tile.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    tile.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
    tile.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
    tile.style.setProperty("--rx", `${((x - 0.5) * 3).toFixed(2)}deg`);
    tile.style.setProperty("--ry", `${((0.5 - y) * 3).toFixed(2)}deg`);
  };
  const leave = (e: PointerEvent) => {
    const tile = (e.target as Element).closest<HTMLElement>(".rail-tile");
    tile?.style.setProperty("--rx", "0deg");
    tile?.style.setProperty("--ry", "0deg");
  };
  track.addEventListener("pointermove", move);
  track.addEventListener("pointerout", leave);
  return () => {
    track.removeEventListener("pointermove", move);
    track.removeEventListener("pointerout", leave);
  };
}

function smoothFaq(list: HTMLElement): () => void {
  const click = (e: MouseEvent) => {
    const summary = (e.target as Element).closest("summary");
    const details = summary?.parentElement as HTMLDetailsElement | null;
    const body = details?.querySelector<HTMLElement>("p");
    if (!summary || !details || !body || reduced()) return;
    e.preventDefault();
    if (details.open) {
      animate(body, {
        height: [body.offsetHeight, 0],
        opacity: [1, 0],
        duration: 320,
        ease: "inOutQuad",
        onComplete: () => {
          details.open = false;
          utils.set(body, { height: "", opacity: "" });
        },
      });
    } else {
      details.open = true;
      const h = body.offsetHeight;
      animate(body, {
        height: [0, h],
        opacity: [0, 1],
        duration: 420,
        ease: "outQuart",
        onComplete: () => utils.set(body, { height: "" }),
      });
    }
  };
  list.addEventListener("click", click);
  return () => list.removeEventListener("click", click);
}

/** Entrances (once), rail tilt + cursor light, smooth FAQ, rolling service numbers, drawn icons. */
export function bindStoreMotion(root: HTMLElement): () => void {
  if (reduced()) return () => {};
  const cleanups: Array<() => void> = [];
  const q = <T extends Element>(sel: string) => Array.from(root.querySelectorAll<T>(sel));

  const tiles = q<HTMLElement>(".rail-tile");
  cleanups.push(onEnter(root.querySelector(".rail"), tiles, () =>
    animate(tiles, { opacity: [0, 1], y: (_t: unknown, i: number) => [36 + (i % 3) * 14, 0], duration: 640, delay: stagger(70), ease: "outQuart" }),
  ));
  const track = root.querySelector<HTMLElement>(".rail-track");
  if (track) cleanups.push(tilt(track));

  const cards = q<HTMLElement>(".showcase-grid .shop-product");
  cleanups.push(onEnter(root.querySelector(".showcase-grid"), cards, () => revealCards(cards)));

  const benefits = q<HTMLElement>(".benefit");
  cleanups.push(onEnter(root.querySelector(".benefits"), benefits, () => {
    utils.set(benefits, { opacity: 1 });
    benefits.forEach((benefit, i) => {
      const paths = benefit.querySelectorAll("svg path, svg circle, svg rect");
      const text = benefit.querySelector("span");
      const tl = createTimeline({ delay: i * 120 });
      tl.add(svg.createDrawable(paths), { draw: ["0 0", "0 1"], duration: 700, ease: "inOutQuad" }, 0);
      if (text) tl.add(text, { opacity: [0, 1], x: [-8, 0], duration: 420, ease: "outQuart" }, 520);
    });
  }));

  const numbers = q<HTMLElement>(".service-num");
  cleanups.push(onEnter(root.querySelector(".service-list"), numbers, () => {
    utils.set(numbers, { opacity: 1 });
    numbers.forEach((el, i) => {
      const target = Number(el.textContent) || i + 1;
      const counter = { v: 0 };
      animate(counter, {
        v: target,
        duration: 650,
        delay: i * 110,
        ease: "outExpo",
        onUpdate: () => {
          el.textContent = String(Math.round(counter.v)).padStart(2, "0");
        },
      });
    });
    root.querySelector(".service-list")?.classList.add("is-in");
  }));

  const faq = root.querySelector<HTMLElement>(".faq-list");
  if (faq) cleanups.push(smoothFaq(faq));

  const pin = root.querySelectorAll(".visit-pin path, .visit-pin circle");
  cleanups.push(onEnter(root.querySelector(".visit-body"), Array.from(pin), () => {
    utils.set(Array.from(pin), { opacity: 1 });
    animate(svg.createDrawable(pin), { draw: ["0 0", "0 1"], duration: 1100, delay: stagger(160), ease: "inOutQuad" });
  }));

  return () => cleanups.forEach((c) => c());
}
```

- [ ] **Step 2:** In `landing-experience.tsx`'s hero-motion effect, add `cleanups.push(bindStoreMotion(root))` when `!reduced`.

- [ ] **Step 3: `product-showcase.tsx` tab swap.** Keep a `gridRef`. On a tab click:

```tsx
  async function switchTo(key: string) {
    if (key === shelf.key) return;
    const grid = gridRef.current;
    await shelfOut(grid ? Array.from(grid.children) : []);
    setActive(key);
  }
  useEffect(() => {
    const grid = gridRef.current;
    if (grid && swapped.current) shelfIn(Array.from(grid.children));
    swapped.current = true;
  }, [shelf.key]);
```

`swapped` is a ref initialised `false`, so the first render doesn't animate (the entrance handles it).

- [ ] **Step 4: Promo parallax.** In `promo-panels.tsx`, add `data-string="parallax" data-string-parallax="0.12"` to `.promo-media`.

- [ ] **Step 5: `landing.css`**

```css
/* ---------- Living store ---------- */
.rail-tile { position: relative; transform: perspective(900px) rotateX(var(--ry, 0deg)) rotateY(var(--rx, 0deg)); transition: transform .5s cubic-bezier(.16, 1, .3, 1), background-color .3s; }
.rail-tile::after { content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none; opacity: 0; transition: opacity .3s; background: radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), rgba(61, 220, 132, .14), transparent 60%); }
.rail-tile:hover::after { opacity: 1; }
.showcase-grid .shop-product { transition: border-color .2s, box-shadow .3s; }
.showcase-grid .shop-product-image img { transition: transform .45s cubic-bezier(.16, 1, .3, 1); }
.showcase-grid .shop-product:hover .shop-product-image img { transform: translateY(-5px); }
.showcase-grid .shop-product:hover { box-shadow: 0 14px 34px rgba(30, 74, 37, .1); }
.showcase-grid .shop-product .product-card-bottom > span { transition: transform .3s cubic-bezier(.2, .7, .2, 1); }
.showcase-grid .shop-product:hover .product-card-bottom > span { transform: translateX(4px); }
.service-list .service-line::before { width: 0; }
.service-list.is-in .service-line::before { width: 48px; transition-delay: .3s; }
.faq-list details p { overflow: hidden; }
@media (prefers-reduced-motion: reduce) { .rail-tile { transform: none; } .service-list .service-line::before { width: 48px; } }
```

- [ ] **Step 6:** Verify, then commit — `feat(landing): living store — entrances, tilt + cursor light, shelf tab swap, drawn icons, rolling numbers, smooth FAQ, visit pin`.

---

### Task 5: Browser checks + review

Add to `e2e/landing.e2e.mjs` (desktop):
- **Flood + escape:** at film 0.97, `.landing-flood` computed opacity > 0.9; `.escape-lines` visible with 9 `line`s.
- **Guides:** at 0.995 the first line's `x1` is within 2 px of the first `.rail-tile` left edge.
- **Rail:** after scrolling to `.rail`, tiles reach opacity 1 within 1500 ms.
- **Tab swap:** clicking the second tab ends with all cards at opacity 1.
- **FAQ:** opening the first item makes it `open` and its paragraph height > 0 after 600 ms; closing works.
- **Services:** numbers read `01 02 03` after their entrance.
- **Screenshots:** film 0.93 / 0.97 / 0.995, the rail, the showcase, the FAQ open.

Run until 0 failed with no console errors. Commit — `test(landing): transition and living-store checks`.
