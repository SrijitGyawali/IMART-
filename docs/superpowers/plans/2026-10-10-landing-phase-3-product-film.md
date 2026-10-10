# Landing Phase 3 (Pinned Product Film) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The four-act product film, pinned for 400 vh (desktop) / 250 vh (touch). It includes moments 03 (the phone opens into labelled layers and the camera passes between them) and 04 (payment ✓ morphs into the Butwal pin), with the act copy, the 01–04 rail, a scan line, an outline light, reassembly locks and the phone-screen UI.

**Architecture:**
- **One number drives everything:** `scene.film.progress` (0..1) is scrubbed by a single GSAP ScrollTrigger tween. Every beat and camera pose is a pure function of it in `film/film-timeline.ts`, which is unit tested.
- **Pinning:** the film section pins with CSS `position: sticky` inside a 500 vh / 350 vh section. ScrollTrigger only measures progress, so no pin-spacer DOM is needed.
- **3D side:** the phone moves model parts along its thickness axis (precomputed per-mesh axis, base positions kept on `userData`). It adds a procedural battery and logic board, extends the shell shader with a dithered scan, and draws the screen UI in the OLED material's emissive term (distance fields + a text atlas).
- **Fallback:** Low tier and reduced motion keep the server-rendered stacked acts (no pin).

**Spec:** §4.2, §6.2, §6.3, §6.6, §6.7, §7 (moments 03–04).

## Global Constraints

Phases 1–2 still apply. In addition:

- **Timeline:** follows the spec's §6.7 ranges, defined once in `film-timeline.ts`; the DOM and the 3D both read them from there.
- **Layer order (back → front):** back glass · battery · logic board · frame · display. The gap is 13 mm desktop / 9 mm touch, which is about 20–50 px on screen.
- **Logic board:** the only coloured internal part, with iMart signal-green traces.
- **Screen UI:** CASH and QR only (no Apple Pay); an abstract, non-scannable QR; `PAYMENT READY` (a neutral state); `ORDER CONFIRMED` shown as a demonstration; labels `HOME DELIVERY IN BUTWAL` / `PICKUP AT AMARPATH`.
- **Screen UV:** u runs left→right and v runs top→bottom (from the source data); the shader uses `vec2(u, 1.0 - v)` for "up".
- **Layer labels** show on desktop only. Mobile keeps the assembly, screen transformation and map.
- The **big transition** (p 0.90–1.00) is Phase 4. Phase 3 holds the final frame.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/components/landing/film/film-timeline.ts` | Pure beats, poses, act opacities (tested) |
| `src/components/landing/film/film-timeline.test.ts` | Unit tests |
| `src/components/landing/scene-store.ts` | (modify) `film` progress + label anchors |
| `src/components/landing/three/finish-wipe.ts` | (modify) add vertical frame + dithered scan |
| `src/components/landing/three/layers.ts` | Layer membership, per-mesh axes, offsets, internals |
| `src/components/landing/three/screen-ui.ts` | OLED emissive UI patch + text atlas |
| `src/components/landing/three/phone-model.tsx` | (modify) film pose, explode, internals, labels, screen, outline light |
| `src/components/landing/film/product-film.tsx` | (rewrite) stage, rail, acts, labels |
| `src/components/landing/film/film-labels.tsx` | Leader-line labels tracking the 3D anchors |
| `src/components/landing/motion/film.ts` | ScrollTrigger binding → progress, CSS vars, env/sweep |
| `src/components/landing/landing-experience.tsx` | (modify) bind the film |
| `src/components/landing/landing.css` | (modify) pinned film, rail, labels |
| `e2e/landing.e2e.mjs` | (modify) film checks + screenshots |

---

### Task 1: Film timeline (pure, tested)

**Interfaces — Produces:**
- `ramp(p, a, b)`, `window4(p, a, b, c, d)`, `activeAct(p): 1|2|3|4`
- `actOpacity(p): { a1, a2, a2body, a3, a4, labels }`
- `filmPose(p): { yaw, pitch, scale, exposure, gap }`
- `filmBeats(p): { explode: number[5], scan, scanFade, sweep, outline, envLive, power, payCard, pay, qr, qrCollapse, morph, map, notify }`
- `LAYER_ORDER = ["backGlass", "battery", "logic", "frame", "display"]`

- [ ] **Step 1: Failing tests** — `src/components/landing/film/film-timeline.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { actOpacity, activeAct, filmBeats, filmPose, ramp, window4 } from "./film-timeline.ts";

const close = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;

test("ramp and window4 shapes", () => {
  assert.equal(ramp(0.1, 0.2, 0.4), 0);
  assert.equal(ramp(0.5, 0.2, 0.4), 1);
  assert.ok(close(ramp(0.3, 0.2, 0.4), 0.5));
  assert.equal(window4(0.5, 0.1, 0.2, 0.6, 0.7), 1);
  assert.equal(window4(0.05, 0.1, 0.2, 0.6, 0.7), 0);
  assert.equal(window4(0.75, 0.1, 0.2, 0.6, 0.7), 0);
});

test("acts follow the spec ranges", () => {
  assert.equal(activeAct(0), 1);
  assert.equal(activeAct(0.3), 2);
  assert.equal(activeAct(0.6), 3);
  assert.equal(activeAct(0.8), 4);
  assert.ok(actOpacity(0.14).a1 > 0.99);
  assert.ok(actOpacity(0.33).labels > 0.5);
  assert.ok(actOpacity(0.7).a3 > 0.99);
  assert.ok(actOpacity(0.86).a4 > 0.99);
  assert.equal(actOpacity(0.86).a1, 0);
});

test("pose is continuous and starts where the hero hand-off ends", () => {
  const start = filmPose(0);
  assert.ok(close(start.yaw, -0.1) && close(start.scale, 1) && close(start.exposure, 1));
  for (let p = 0; p < 1; p += 0.001) {
    const a = filmPose(p);
    const b = filmPose(p + 0.001);
    assert.ok(Math.abs(a.yaw - b.yaw) < 0.08, `yaw jump at ${p}`);
    assert.ok(Math.abs(a.scale - b.scale) < 0.08, `scale jump at ${p}`);
  }
  assert.ok(filmPose(0.45).exposure < 0.3, "dark while passing between layers");
});

test("layers open, then lock one by one; the frame never moves", () => {
  assert.deepEqual(filmBeats(0).explode, [0, 0, 0, 0, 0]);
  const open = filmBeats(0.4).explode;
  assert.ok(open[0] > 0.99 && open[1] > 0.99 && open[2] > 0.99 && open[4] > 0.99);
  assert.equal(open[3], 0);
  const locking = filmBeats(0.53).explode;
  assert.ok(locking[0] < 0.01 && locking[4] > 0.99, "back glass locks before the display");
  assert.deepEqual(filmBeats(0.6).explode.map((v) => Math.round(v)), [0, 0, 0, 0, 0]);
});

test("screen story runs in order", () => {
  assert.ok(filmBeats(0.3).power < 0.01, "screen off while open");
  assert.ok(filmBeats(0.6).power > 0.99, "screen on after the display connects");
  const m = [0.7, 0.72, 0.74, 0.76, 0.78].map((p) => filmBeats(p).morph);
  for (let i = 1; i < m.length; i++) assert.ok(m[i] >= m[i - 1]);
  assert.ok(close(filmBeats(0.8).morph, 2));
  assert.ok(filmBeats(0.88).map > 0.99 && filmBeats(0.89).notify > 0.5);
});
```

- [ ] **Step 2:** Run `npm test`. Expected: FAIL (module missing).

- [ ] **Step 3: `src/components/landing/film/film-timeline.ts`**

```ts
/** The product film, p = film progress 0..1 (spec §6.7). Everything here is a pure function of p. */

export const LAYER_ORDER = ["backGlass", "battery", "logic", "frame", "display"] as const;
export type LayerName = (typeof LAYER_ORDER)[number];

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** 0 before a, 1 after b, smooth in between. */
export function ramp(p: number, a: number, b: number): number {
  const t = clamp01((p - a) / (b - a));
  return t * t * (3 - 2 * t);
}

/** Rises over [a, b], holds, falls over [c, d]. */
export function window4(p: number, a: number, b: number, c: number, d: number): number {
  return Math.min(ramp(p, a, b), 1 - ramp(p, c, d));
}

export function activeAct(p: number): 1 | 2 | 3 | 4 {
  return p < 0.24 ? 1 : p < 0.55 ? 2 : p < 0.775 ? 3 : 4;
}

export function actOpacity(p: number) {
  return {
    a1: window4(p, 0.06, 0.1, 0.18, 0.22),
    // Act 02's title dims while the camera passes between the layers.
    a2: window4(p, 0.29, 0.33, 0.5, 0.54) * (1 - 0.85 * window4(p, 0.38, 0.4, 0.44, 0.46)),
    a2body: window4(p, 0.45, 0.48, 0.5, 0.54),
    a3: window4(p, 0.6, 0.63, 0.74, 0.77),
    a4: window4(p, 0.79, 0.82, 0.95, 0.99),
    labels: window4(p, 0.31, 0.35, 0.37, 0.4),
  };
}

export interface Pose {
  /** Rotation about the vertical axis; π shows the back. */
  yaw: number;
  pitch: number;
  /** Multiplier on the film's base phone height. */
  scale: number;
  exposure: number;
  /** 0..1 — how much to centre the gap between the logic board and the frame (fly-through). */
  gap: number;
}

const KEYS: Array<[number, Pose]> = [
  [0, { yaw: -0.1, pitch: 0.04, scale: 1, exposure: 1, gap: 0 }],
  [0.08, { yaw: 0.9, pitch: 0.06, scale: 1, exposure: 1, gap: 0 }],
  [0.15, { yaw: 2.75, pitch: 0.08, scale: 1.06, exposure: 1, gap: 0 }],
  [0.21, { yaw: 2.85, pitch: 0.06, scale: 1.06, exposure: 1, gap: 0 }],
  [0.27, { yaw: 2.85, pitch: 0.05, scale: 1, exposure: 1, gap: 0 }],
  [0.35, { yaw: 2.15, pitch: 0.14, scale: 0.92, exposure: 1, gap: 0 }],
  [0.41, { yaw: 1.62, pitch: 0.02, scale: 2.8, exposure: 0.35, gap: 1 }],
  [0.45, { yaw: 1.45, pitch: 0, scale: 3.4, exposure: 0.12, gap: 1 }],
  [0.5, { yaw: 0.45, pitch: 0.06, scale: 1, exposure: 1, gap: 0 }],
  [0.58, { yaw: 0.22, pitch: 0.04, scale: 1, exposure: 1, gap: 0 }],
  [0.645, { yaw: 0, pitch: 0, scale: 1.32, exposure: 1, gap: 0 }],
  [1, { yaw: 0, pitch: 0, scale: 1.32, exposure: 1, gap: 0 }],
];

export function filmPose(p: number): Pose {
  const x = clamp01(p);
  let i = 0;
  while (i < KEYS.length - 2 && x > KEYS[i + 1][0]) i++;
  const [t0, a] = KEYS[i];
  const [t1, b] = KEYS[i + 1];
  const t = ramp(x, t0, t1);
  const mix = (u: number, v: number) => u + (v - u) * t;
  return {
    yaw: mix(a.yaw, b.yaw),
    pitch: mix(a.pitch, b.pitch),
    scale: mix(a.scale, b.scale),
    exposure: mix(a.exposure, b.exposure),
    gap: mix(a.gap, b.gap),
  };
}

// Locks happen back → front, each snapping in with an accelerating ease.
const LOCKS: Record<LayerName, [number, number] | null> = {
  backGlass: [0.5, 0.52],
  battery: [0.52, 0.535],
  logic: [0.535, 0.55],
  frame: null,
  display: [0.555, 0.57],
};

export function filmBeats(p: number) {
  const open = ramp(p, 0.26, 0.32);
  const explode = LAYER_ORDER.map((name) => {
    const lock = LOCKS[name];
    if (!lock) return 0;
    const t = clamp01((p - lock[0]) / (lock[1] - lock[0]));
    return open * (1 - t * t * t);
  });
  const sweepOn = p >= 0.1 && p <= 0.17;
  return {
    explode,
    scan: ramp(p, 0.21, 0.27),
    scanFade: window4(p, 0.205, 0.215, 0.3, 0.34),
    sweep: sweepOn ? ramp(p, 0.1, 0.17) : -1,
    outline: window4(p, 0.165, 0.175, 0.19, 0.205),
    envLive: p >= 0.095 && p <= 0.175,
    power: 1 - window4(p, 0.18, 0.22, 0.56, 0.585),
    payCard: window4(p, 0.59, 0.61, 0.69, 0.71),
    pay: ramp(p, 0.62, 0.66),
    qr: ramp(p, 0.655, 0.68),
    qrCollapse: ramp(p, 0.685, 0.71),
    morph: ramp(p, 0.71, 0.735) + ramp(p, 0.745, 0.77),
    map: ramp(p, 0.77, 0.83),
    notify: ramp(p, 0.85, 0.88),
  };
}

export type Beats = ReturnType<typeof filmBeats>;
```

- [ ] **Step 4:** Run `npm test`. Expected: all pass (19 tests).
- [ ] **Step 5: Commit** — `feat(landing): film timeline — beats, poses and act opacities as pure functions`

---

### Task 2: Scene store additions

Append to `src/components/landing/scene-store.ts`:

```ts
export interface FilmLabel {
  x: number;
  y: number;
  visible: boolean;
}

/** Film progress 0..1 and the projected anchors of the five layer labels (CSS px). */
export const film = {
  progress: 0,
  labels: Array.from({ length: 5 }, (): FilmLabel => ({ x: 0, y: 0, visible: false })),
};

export function setFilmProgress(p: number) {
  film.progress = p;
}

export function setFilmLabel(i: number, x: number, y: number, visible: boolean) {
  const label = film.labels[i];
  label.x = x;
  label.y = y;
  label.visible = visible;
}
```

---

### Task 3: Shell scan, layers, internals, screen UI (3D)

- [ ] **Step 1: Extend `three/finish-wipe.ts` with the vertical frame and scan.**
  - Add to `SharedWipe`: `uHeight: { value: Vector2 }`, `uScan: { value: number }`, `uScanFade: { value: number }`.
  - `createSharedWipe(minX, maxX, minY, maxY)` initialises them to `new Vector2(minY, maxY)`, `0`, `0`.
  - In the vertex patch, replace `varying float vPhoneX;` / the `vPhoneX = …` line with:

```glsl
varying vec2 vPhone;
// …after #include <project_vertex>:
vPhone = (uPhoneInv * modelMatrix * vec4(transformed, 1.0)).xy;
```

In the fragment patch, declare `uniform vec2 uHeight; uniform float uScan; uniform float uScanFade; varying vec2 vPhone;` (replacing `varying float vPhoneX;`). Replace the diffuse line's injected code with:

```glsl
float wipeS = clamp((vPhone.x - uWidth.x) / (uWidth.y - uWidth.x), 0.0, 1.0);
float scanS = clamp((uHeight.y - vPhone.y) / (uHeight.y - uHeight.x), 0.0, 1.0);
// Screen-door transparency where the scan has passed (no transparent-sort artefacts).
float scanned = step(scanS, uScan) * uScanFade;
float dither = mod(floor(gl_FragCoord.x) + floor(gl_FragCoord.y) * 2.0, 4.0) / 4.0;
if (dither < 0.55 * scanned) discard;
vec4 diffuseColor = vec4( diffuse * mix(uTo, uFrom, step(uWipe, wipeS)), opacity );
```

and append to the emissive injection:

```glsl
totalEmissiveRadiance += vec3(0.24, 0.86, 0.52) * 1.6 * step(0.001, uScanFade) * smoothstep(0.012, 0.0, abs(scanS - uScan));
```

  - `measure()` in `phone-model.tsx` also returns `heightRange: [upright.min.y, upright.max.y]`.

- [ ] **Step 2: `src/components/landing/three/layers.ts`**

```ts
import {
  BoxGeometry, Group, Matrix4, Mesh, MeshStandardMaterial, Quaternion, Vector3, type Material,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { LAYER_ORDER, type LayerName } from "../film/film-timeline";

const MEMBERSHIP: Record<string, LayerName> = {
  Glass: "display", OLED: "display", "OLED off": "display", "Display Frame": "display",
  "Frosted glass": "backGlass", "Tinted glass": "backGlass",
};

function layerOf(material: Material | Material[]): LayerName {
  const m = Array.isArray(material) ? material[0] : material;
  return MEMBERSHIP[m?.name ?? ""] ?? "frame";
}

export interface LayerRig {
  /** Model meshes with their base position and the parent-space vector for +1 upright-Z. */
  parts: Array<{ mesh: Mesh; layer: number; base: Vector3; axis: Vector3 }>;
  internals: Group;
  battery: Mesh;
  logic: Group;
}

/** Precomputes, per mesh, how to move it along the phone's thickness axis (upright +Z). */
export function buildLayers(model: Group, correction: Quaternion, width: number, height: number): LayerRig {
  model.updateMatrixWorld(true);
  const toModel = new Matrix4().copy(model.matrixWorld).invert();
  const uprightZInModel = new Vector3(0, 0, 1).applyQuaternion(correction.clone().invert());
  const parts: LayerRig["parts"] = [];
  model.traverse((o) => {
    if (!(o instanceof Mesh) || !o.parent) return;
    const parentRel = new Matrix4().multiplyMatrices(toModel, o.parent.matrixWorld);
    // The linear part of the parent's inverse maps a model-space displacement into parent space
    // (translation excluded; non-uniform dequantisation scale included).
    const inverseLinear = new Matrix4().copy(parentRel).setPosition(0, 0, 0).invert();
    const axis = uprightZInModel.clone().applyMatrix4(inverseLinear);
    o.userData.basePosition ??= o.position.clone();
    parts.push({
      mesh: o,
      layer: LAYER_ORDER.indexOf(layerOf(o.material)),
      base: o.userData.basePosition as Vector3,
      axis,
    });
  });

  // Procedural internals, hidden inside the shell until the device opens.
  const internals = new Group();
  const battery = new Mesh(
    new RoundedBoxGeometry(width * 0.84, height * 0.56, 0.0045, 3, 0.004),
    new MeshStandardMaterial({ color: "#1b1e1c", roughness: 0.62, metalness: 0.25 }),
  );
  battery.position.set(0, -height * 0.14, -0.0015);
  const logic = new Group();
  const board = new Mesh(
    new RoundedBoxGeometry(width * 0.86, height * 0.3, 0.0014, 2, 0.003),
    new MeshStandardMaterial({ color: "#0c100e", roughness: 0.48, metalness: 0.35 }),
  );
  logic.add(board);
  const chipMaterial = new MeshStandardMaterial({ color: "#151a17", roughness: 0.3, metalness: 0.7 });
  for (const [x, y, w, h] of [[-0.18, 0.06, 0.26, 0.2], [0.14, 0.05, 0.2, 0.16], [-0.02, -0.1, 0.3, 0.12], [0.24, -0.11, 0.12, 0.1]]) {
    const chip = new Mesh(new BoxGeometry(width * w, height * 0.3 * h, 0.0012), chipMaterial);
    chip.position.set(width * x, height * 0.3 * y, 0.0012);
    logic.add(chip);
  }
  // iMart signal green — the only coloured element inside the phone.
  const traceMaterial = new MeshStandardMaterial({ color: "#0d3f29", emissive: "#3ddc84", emissiveIntensity: 0.9 });
  for (const [x, y, w] of [[-0.3, -0.02, 0.36], [0.05, 0.11, 0.42], [0.1, -0.03, 0.3], [-0.12, -0.13, 0.5], [0.32, 0.02, 0.14]]) {
    const trace = new Mesh(new BoxGeometry(width * w, 0.0006, 0.0004), traceMaterial);
    trace.position.set(width * x, height * 0.3 * y, 0.0009);
    logic.add(trace);
  }
  logic.position.set(0, height * 0.29, -0.0006);
  internals.add(battery, logic);
  internals.visible = false;
  return { parts, internals, battery, logic };
}

/** Places every layer `explode[i] * gap` along upright Z (back layers negative). */
export function applyLayers(rig: LayerRig, explode: number[], gap: number) {
  const offsets = [-3, -2, -1, 0, 1.2]; // back glass, battery, logic board, frame, display
  for (const part of rig.parts) {
    const dz = offsets[part.layer] * explode[part.layer] * gap;
    part.mesh.position.copy(part.base).addScaledVector(part.axis, dz);
  }
  rig.battery.position.z = -0.0015 + offsets[1] * explode[1] * gap;
  rig.logic.position.z = -0.0006 + offsets[2] * explode[2] * gap;
}
```

- [ ] **Step 3: `src/components/landing/three/screen-ui.ts`** — the OLED's emissive term becomes the screen UI.

```ts
import { CanvasTexture, LinearFilter, type MeshStandardMaterial, type Texture } from "three";

export interface ScreenUniforms {
  uPower: { value: number };
  uPayCard: { value: number };
  uPay: { value: number };
  uQr: { value: number };
  uQrCollapse: { value: number };
  uMorph: { value: number };
  uMap: { value: number };
  uNotify: { value: number };
  uTime: { value: number };
  uAtlas: { value: Texture | null };
  uLCash: { value: number[] };
  uLQr: { value: number[] };
  uLReady: { value: number[] };
  uLHome: { value: number[] };
  uLPickup: { value: number[] };
  uLConfirmed: { value: number[] };
}

const LABELS = {
  uLCash: "CASH",
  uLQr: "QR",
  uLReady: "PAYMENT READY",
  uLHome: "HOME DELIVERY IN BUTWAL",
  uLPickup: "PICKUP AT AMARPATH",
  uLConfirmed: "ORDER CONFIRMED",
} as const;

const ATLAS_W = 1024;
const ATLAS_H = 512;
const ROW = 64;

/** White labels on transparent, drawn once in the site font. Rects are [x, y(top), w, h] in 0..1. */
function buildAtlas(uniforms: ScreenUniforms) {
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_W;
  canvas.height = ATLAS_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const family = getComputedStyle(document.body).fontFamily || "sans-serif";
  ctx.font = `600 40px ${family}`;
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "4px";
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  Object.entries(LABELS).forEach(([key, text], row) => {
    const width = Math.min(ctx.measureText(text).width + 8, ATLAS_W - 8);
    ctx.fillText(text, 4, row * ROW + ROW / 2);
    (uniforms[key as keyof typeof LABELS].value as number[]).splice(0, 4, 0, (row * ROW) / ATLAS_H, width / ATLAS_W, ROW / ATLAS_H);
  });
  const texture = new CanvasTexture(canvas);
  texture.flipY = false;
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  uniforms.uAtlas.value = texture;
}

export function createScreenUniforms(): ScreenUniforms {
  const rect = () => ({ value: [0, 0, 0, 0] });
  const uniforms: ScreenUniforms = {
    uPower: { value: 1 }, uPayCard: { value: 0 }, uPay: { value: 0 }, uQr: { value: 0 },
    uQrCollapse: { value: 0 }, uMorph: { value: 0 }, uMap: { value: 0 }, uNotify: { value: 0 },
    uTime: { value: 0 }, uAtlas: { value: null },
    uLCash: rect(), uLQr: rect(), uLReady: rect(), uLHome: rect(), uLPickup: rect(), uLConfirmed: rect(),
  };
  const draw = () => buildAtlas(uniforms);
  if (document.fonts?.status === "loaded") draw();
  else document.fonts?.ready.then(draw);
  return uniforms;
}

const SCREEN_GLSL = /* glsl */ `
uniform float uPower; uniform float uPayCard; uniform float uPay; uniform float uQr; uniform float uQrCollapse;
uniform float uMorph; uniform float uMap; uniform float uNotify; uniform float uTime;
uniform sampler2D uAtlas;
uniform vec4 uLCash; uniform vec4 uLQr; uniform vec4 uLReady; uniform vec4 uLHome; uniform vec4 uLPickup; uniform vec4 uLConfirmed;

#define SCREEN_ASPECT 0.4605
#define ATLAS_ASPECT 2.0

float sdSegment(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
float sdRoundBox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float fill(float d) { return smoothstep(0.0025, -0.0025, d); }

// Draws an atlas label centred at c, h tall (screen units); returns coverage.
float label(vec2 p, vec2 c, float h, vec4 r) {
  if (r.z <= 0.0) return 0.0;
  float w = h * (r.z / r.w) * ATLAS_ASPECT;
  vec2 t = (p - c) / vec2(w, h) + 0.5;
  if (t.x < 0.0 || t.x > 1.0 || t.y < 0.0 || t.y > 1.0) return 0.0;
  return texture2D(uAtlas, r.xy + vec2(t.x, 1.0 - t.y) * r.zw).a;
}

const vec4 STREETS[9] = vec4[9](
  vec4(-0.23, 0.30, 0.23, 0.24), vec4(-0.23, 0.02, 0.23, 0.10), vec4(-0.23, -0.16, 0.23, -0.10),
  vec4(-0.12, 0.38, -0.06, -0.30), vec4(0.10, 0.40, 0.04, -0.30), vec4(-0.23, 0.19, 0.0, 0.08),
  vec4(0.0, 0.08, 0.23, -0.02), vec4(-0.18, -0.30, 0.18, -0.22), vec4(0.18, 0.40, 0.23, 0.20)
);

vec3 screenUI(vec2 uv) {
  vec2 s = vec2(uv.x, 1.0 - uv.y);
  vec2 p = (s - 0.5) * vec2(SCREEN_ASPECT, 1.0);
  vec3 green = vec3(0.24, 0.86, 0.52);

  // iMart idle wallpaper: an emerald glow.
  float r = length(p * vec2(1.0, 0.8));
  vec3 col = mix(vec3(0.12, 0.54, 0.36), vec3(0.004, 0.016, 0.012), smoothstep(0.0, 0.55, r));
  col *= 1.0 - 0.75 * max(uPayCard, uMap);

  // Payment: CASH / QR rows with a highlight that moves with scroll.
  if (uPayCard > 0.001) {
    float card = sdRoundBox(p - vec2(0.0, -0.18), vec2(0.17, 0.11), 0.03);
    col = mix(col, vec3(0.03, 0.06, 0.05), fill(card) * 0.85 * uPayCard);
    float hl = sdRoundBox(p - vec2(0.0, mix(-0.13, -0.23, uPay)), vec2(0.15, 0.038), 0.03);
    col = mix(col, green * 0.85, fill(hl) * uPayCard);
    col = mix(col, vec3(1.0), label(p, vec2(0.0, -0.13), 0.034, uLCash) * uPayCard);
    col = mix(col, vec3(1.0), label(p, vec2(0.0, -0.23), 0.034, uLQr) * uPayCard);
  }

  // Abstract QR (not scannable), collapsing into the green dot.
  vec2 q = p - vec2(0.0, 0.08);
  if (uQr > 0.001 && uQrCollapse < 0.999) {
    float size = 0.17 * (1.0 - uQrCollapse);
    vec2 cell = floor((q / max(size, 1e-4) + 0.5) * 21.0);
    float inside = step(abs(q.x), size * 0.5) * step(abs(q.y), size * 0.5);
    float on = step(0.5, hash2(cell)) * inside;
    col = mix(col, vec3(0.92), on * uQr * (1.0 - uQrCollapse));
  }

  // One shape: dot → check → pin (distance fields blended, not swapped).
  float shapeOn = max(smoothstep(0.6, 1.0, uQrCollapse), step(0.001, uMorph));
  if (shapeOn > 0.0) {
    float dDot = length(q) - 0.035;
    float dCheck = min(sdSegment(q, vec2(-0.05, 0.0), vec2(-0.012, -0.04)), sdSegment(q, vec2(-0.012, -0.04), vec2(0.06, 0.05))) - 0.012;
    vec2 pq = q - vec2(0.0, 0.02);
    float dHead = length(pq) - 0.045;
    float dTail = max(abs(pq.x) - (pq.y + 0.09) * 0.5, max(-(pq.y + 0.09), pq.y));
    float dPin = max(min(dHead, dTail), -(length(pq) - 0.016));
    float d = uMorph < 1.0 ? mix(dDot, dCheck, uMorph) : mix(dCheck, dPin, uMorph - 1.0);
    col = mix(col, green, fill(d) * shapeOn);
    col += green * exp(-max(d, 0.0) * 38.0) * 0.35 * shapeOn;
    float ready = smoothstep(0.7, 1.0, uMorph) * (1.0 - smoothstep(1.2, 1.5, uMorph));
    col = mix(col, vec3(1.0), label(p, vec2(0.0, -0.05), 0.028, uLReady) * ready);
  }

  // Delivery map: streets drawn by light, the pin pulsing at the store.
  if (uMap > 0.001) {
    float lines = 0.0;
    for (int i = 0; i < 9; i++) {
      float f = clamp(uMap * 9.0 - float(i), 0.0, 1.0);
      if (f <= 0.0) continue;
      vec2 a = STREETS[i].xy;
      vec2 b = mix(a, STREETS[i].zw, f);
      lines = max(lines, smoothstep(0.004, 0.0, sdSegment(p, a, b)));
    }
    col = mix(col, green * 0.9, lines * 0.85);
    float pulse = fract(uTime * 0.7);
    float ring = abs(length(q - vec2(0.0, 0.0)) - pulse * 0.14) - 0.003;
    col += green * fill(ring) * (1.0 - pulse) * smoothstep(0.3, 0.6, uMap);
    float labels = smoothstep(0.5, 1.0, uMap);
    col = mix(col, vec3(1.0), label(p, vec2(0.0, -0.27), 0.026, uLHome) * labels);
    col = mix(col, vec3(0.75), label(p, vec2(0.0, -0.32), 0.022, uLPickup) * labels);
  }

  // "Order confirmed" — a restrained demonstration notification.
  if (uNotify > 0.001) {
    vec2 c = vec2(0.0, mix(0.58, 0.41, uNotify));
    float banner = sdRoundBox(p - c, vec2(0.2, 0.034), 0.02);
    col = mix(col, vec3(0.06, 0.09, 0.08), fill(banner) * 0.92);
    col = mix(col, green, fill(length(p - c - vec2(-0.165, 0.0)) - 0.008));
    col = mix(col, vec3(1.0), label(p, c + vec2(0.02, 0.0), 0.024, uLConfirmed));
  }
  return col * uPower;
}
`;

/** Replaces the OLED's emissive with the screen UI (keeps its emissive map so the UV varying exists). */
export function patchScreen(material: MeshStandardMaterial, uniforms: ScreenUniforms) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${SCREEN_GLSL}`)
      .replace("#include <emissivemap_fragment>", "totalEmissiveRadiance = screenUI( vEmissiveMapUv );");
  };
  material.customProgramCacheKey = () => "imart-screen";
  material.needsUpdate = true;
}
```

- [ ] **Step 4: `phone-model.tsx` integration.** In `buildRig`:
  - Pass `heightRange` to `createSharedWipe`.
  - `const layers = buildLayers(model, correction, width[1]-width[0], heightRange[1]-heightRange[0])`.
  - Add `screen = createScreenUniforms()` and patch the OLED material(s) with `patchScreen`. Keep `applyWallpaper` so the emissive map, and therefore `vEmissiveMapUv`, exists.
  - Store `layers` and `screen` on the rig.

In `PhoneModel`:
  - Add the internals to the `place` group in the layout effect (`place.current.add(rig.layers.internals)`), and remove them in the cleanup.
  - Add an `outline` point-light ref inside `place`.

In `frame()` (after the hero placement):

```ts
  // ---- Film ----
  const fp = film.progress;
  const pose = filmPose(fp);
  const beats = filmBeats(fp);
  const filmH = vh * (mobile ? 0.42 : 0.78);
  const filmY = mobile ? vh * 0.17 : 0;
  // (hero placement above lerps x/y/h toward 0 / filmY / filmH with k; replace the old targets.)
  place.scale.setScalar((h * MathUtils.lerp(1, pose.scale, k)) / rig.height);
  place.rotation.y = MathUtils.lerp(BASE_YAW, pose.yaw, k) + idleYaw;
  place.rotation.x = MathUtils.lerp(BASE_PITCH, pose.pitch, k) + idlePitch;

  const gapSize = mobile ? 0.009 : 0.013;
  applyLayers(rig.layers, beats.explode, gapSize);
  rig.layers.internals.visible = beats.explode.some((e) => e > 0.002) || beats.scanFade > 0.01;

  // Fly-through: centre the gap between logic board and frame on screen.
  if (pose.gap > 0) {
    place.updateMatrixWorld();
    const mid = scratch.set(0, 0, -0.5 * gapSize * beats.explode[2]).applyMatrix4(place.matrixWorld);
    place.position.x -= (mid.x - place.position.x) * pose.gap;
  }

  rig.shared.uScan.value = beats.scan;
  rig.shared.uScanFade.value = beats.scanFade;
  const sc = rig.screen;
  sc.uPower.value = beats.power; sc.uPayCard.value = beats.payCard; sc.uPay.value = beats.pay;
  sc.uQr.value = beats.qr; sc.uQrCollapse.value = beats.qrCollapse; sc.uMorph.value = beats.morph;
  sc.uMap.value = beats.map; sc.uNotify.value = beats.notify; sc.uTime.value = t;
  exposure *= pose.exposure;
  if (outline) {
    outline.intensity = beats.outline * 2.5;
    const a = ramp(fp, 0.165, 0.205) * Math.PI * 2;
    outline.position.set(Math.cos(a) * 0.045, Math.sin(a) * 0.085, -0.012);
  }
  // Leader-line anchors: right edge of each layer, staggered vertically.
  for (let i = 0; i < 5; i++) {
    const z = [-3, -2, -1, 0, 1.2][i] * beats.explode[i] * gapSize;
    scratch.set(0.042, 0.06 - i * 0.03, z).applyMatrix4(place.matrixWorld).project(state.camera);
    setFilmLabel(i, ((scratch.x + 1) / 2) * state.size.width, ((1 - scratch.y) / 2) * state.size.height, scratch.z < 1);
  }
```

`frame()`'s hero placement targets for `k → 1` become `x → 0`, `y → filmY`, `h → filmH`. The idle drift multiplies by `(1 - k)`.

- [ ] **Step 5: Verify** — `npx tsc --noEmit && npx eslint src/components/landing && npx next build`.
- [ ] **Step 6: Commit** — `feat(landing): film 3D — layers + internals, scan, outline light, screen UI shader`

---

### Task 4: Film DOM, binding, styles

- [ ] **Step 1: `src/components/landing/film/film-labels.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { film } from "../scene-store";

const NAMES = ["Back glass", "Battery", "Logic board", "Frame", "Display"];

function track(root: HTMLElement): () => void {
  const items = Array.from(root.querySelectorAll<HTMLElement>(".film-label"));
  let frame = 0;
  const tick = () => {
    items.forEach((el, i) => {
      const a = film.labels[i];
      el.style.transform = `translate3d(${a.x}px, ${a.y}px, 0)`;
      el.style.visibility = a.visible ? "visible" : "hidden";
    });
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}

/** Editorial labels with leader lines, following each layer's projected edge. */
export function FilmLabels() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    return track(ref.current);
  }, []);
  return (
    <div ref={ref} className="film-labels" aria-hidden="true">
      {NAMES.map((name) => (
        <span key={name} className="film-label">
          <i />
          {name}
        </span>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Rewrite `src/components/landing/film/product-film.tsx`.** Keep `ACTS` from Phase 1. Render:

```tsx
export function ProductFilm() {
  return (
    <section className="landing-film" data-stage-section="film" aria-label="Inside iMart">
      <div className="film-stage">
        <ol className="film-rail" aria-hidden="true">
          {[1, 2, 3, 4].map((n) => (
            <li key={n} data-n={n}>0{n}</li>
          ))}
        </ol>
        <div className="landing-container film-acts">
          {ACTS.map((act, i) => (
            <article key={act.id} className="film-act" data-act={i + 1} aria-labelledby={`act-${act.id}`}>
              <p className="landing-label landing-label-signal">0{i + 1}</p>
              <h2 id={`act-${act.id}`}>
                {act.title.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </h2>
              <p className="film-act-body">{act.body}</p>
              <ul className="film-act-meta">
                {act.meta.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <FilmLabels />
      </div>
    </section>
  );
}
```

- [ ] **Step 3: `src/components/landing/motion/film.ts`**

```ts
import { actOpacity, activeAct, filmBeats } from "../film/film-timeline";
import { holdEnvironment, scene, setFilmProgress } from "../scene-store";
import { getGsap } from "./gsap";

/** One scrubbed tween drives the whole film; DOM and 3D both read film.progress. */
export function bindFilm(root: HTMLElement): () => void {
  const { gsap, ScrollTrigger } = getGsap();
  const section = root.querySelector<HTMLElement>(".landing-film");
  if (!section) return () => {};
  root.dataset.film = "pinned";
  let release: (() => void) | null = null;

  const apply = (p: number) => {
    setFilmProgress(p);
    const o = actOpacity(p);
    section.style.setProperty("--a1", o.a1.toFixed(3));
    section.style.setProperty("--a2", o.a2.toFixed(3));
    section.style.setProperty("--a2b", o.a2body.toFixed(3));
    section.style.setProperty("--a3", o.a3.toFixed(3));
    section.style.setProperty("--a4", o.a4.toFixed(3));
    section.style.setProperty("--labels", o.labels.toFixed(3));
    section.dataset.act = String(activeAct(p));
    const beats = filmBeats(p);
    if (p > 0 && p < 1) scene.sweep = beats.sweep;
    if (beats.envLive && !release) release = holdEnvironment();
    if (!beats.envLive && release) {
      release();
      release = null;
    }
  };

  const proxy = { p: 0 };
  apply(0);
  ScrollTrigger.refresh();
  const tween = gsap.to(proxy, {
    p: 1,
    ease: "none",
    scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: 0.5 },
    onUpdate: () => apply(proxy.p),
  });

  return () => {
    tween.scrollTrigger?.kill();
    tween.kill();
    release?.();
    delete root.dataset.film;
    setFilmProgress(0);
  };
}
```

- [ ] **Step 4: `landing-experience.tsx`.** Inside the hero-motion effect, after the hand-off binding, add `cleanups.push(bindFilm(root))` when `!reduced && tier !== "low"`.

- [ ] **Step 5: `landing.css`**

```css
/* ---------- Pinned product film (only when data-film="pinned") ---------- */
.film-rail, .film-labels { display: none; }
.landing[data-film="pinned"] .landing-film { height: 500vh; padding: 0; }
.landing[data-film="pinned"] .film-stage { position: sticky; top: 0; height: 100vh; height: 100svh; overflow: hidden; }
.landing[data-film="pinned"] .film-acts { position: relative; height: 100%; }
.landing[data-film="pinned"] .film-act {
  position: absolute;
  inset: 0 auto 0 0;
  min-height: 0;
  max-width: 460px;
  opacity: 0;
  translate: 0 calc((1 - var(--o, 0)) * 24px);
  will-change: opacity, translate;
}
.landing[data-film="pinned"] .film-act[data-act="1"] { --o: var(--a1); opacity: var(--a1); }
.landing[data-film="pinned"] .film-act[data-act="2"] { --o: var(--a2); opacity: var(--a2); }
.landing[data-film="pinned"] .film-act[data-act="2"] .film-act-body,
.landing[data-film="pinned"] .film-act[data-act="2"] .film-act-meta { opacity: var(--a2b); }
.landing[data-film="pinned"] .film-act[data-act="3"] { --o: var(--a3); opacity: var(--a3); }
.landing[data-film="pinned"] .film-act[data-act="4"] { --o: var(--a4); opacity: var(--a4); }
.landing[data-film="pinned"] .film-rail {
  position: absolute;
  right: 40px;
  top: 50%;
  translate: 0 -50%;
  z-index: 2;
  display: grid;
  gap: 14px;
  list-style: none;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: .18em;
  color: rgba(238, 243, 239, .28);
}
.landing[data-film="pinned"] .film-rail li { transition: color .4s cubic-bezier(.16, 1, .3, 1); }
.landing-film[data-act="1"] .film-rail li[data-n="1"],
.landing-film[data-act="2"] .film-rail li[data-n="2"],
.landing-film[data-act="3"] .film-rail li[data-n="3"],
.landing-film[data-act="4"] .film-rail li[data-n="4"] { color: #3ddc84; }
.landing[data-film="pinned"] .film-labels { display: block; position: absolute; inset: 0; z-index: 2; pointer-events: none; opacity: var(--labels, 0); }
.film-label { position: absolute; left: 0; top: 0; display: flex; align-items: center; gap: 10px; font-size: 10px; font-weight: 600; letter-spacing: .2em; text-transform: uppercase; color: rgba(238, 243, 239, .8); white-space: nowrap; }
.film-label i { display: block; width: 56px; height: 1px; background: linear-gradient(90deg, rgba(61, 220, 132, .9), rgba(238, 243, 239, .35)); }

@media (max-width: 760px) {
  .landing[data-film="pinned"] .landing-film { height: 350vh; }
  .landing[data-film="pinned"] .film-act { inset: auto 0 9vh 0; max-width: none; }
  .landing[data-film="pinned"] .film-act h2 { font-size: clamp(34px, 10vw, 46px); }
  .landing[data-film="pinned"] .film-rail { right: 16px; top: calc(var(--header-h) + 12px); translate: none; grid-auto-flow: column; }
  .landing[data-film="pinned"] .film-labels { display: none; }
}
```

- [ ] **Step 6: Verify** with tsc, eslint and build. **Commit:** `feat(landing): pinned four-act film — DOM acts, rail, labels, scroll binding`

---

### Task 5: Browser checks + review

- [ ] **Step 1: Add film checks to `e2e/landing.e2e.mjs`** (desktop context, after the hand-off checks).
  - `main.landing[data-film="pinned"]` is present.
  - Scroll to film progress 0.14, 0.33, 0.7 and 0.86, using `film.offsetTop + p * (film.offsetHeight - innerHeight)` and `window.scrollTo`, then wait 1200 ms.
  - At each point, assert `.landing-film[data-act]` is 1/2/3/4 and the matching act's computed opacity > 0.5.
  - At 0.33, assert `.film-labels` opacity > 0.4.
  - Screenshot each point (`p3-film-14.png` … `p3-film-86.png`) plus mobile at 0.33 and 0.86.
- [ ] **Step 2:** Run. Expected: 0 failed, no console errors. Review the screenshots: back reveal; open layers with labels; payment screen; map + ORDER CONFIRMED.
- [ ] **Step 3:** Fix and tune, re-run, commit — `test(landing): film acts, rail, labels, screen states`.
