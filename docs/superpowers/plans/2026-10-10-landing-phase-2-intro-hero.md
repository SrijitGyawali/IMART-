# Landing Phase 2 (Intro + Hero + Cursor) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build signature moments 01 and 02 and the living hero:

- **Boot:** a green dot → "iMart." → green light reveals the phone → hero.
- **Finish change:** a studio-light wipe re-colours the device.
- **Hero:** GLSL emerald atmosphere, first-load light sweep along the frame, character-by-character headline entrance, magnetic CTA, pointer depth planes.
- **Scroll hand-off:** the scrubbed hand-off to the film.
- **Cursor:** precision ring.
- **Stills:** rendered from the live scene, used as the LCP poster and the Low tier.

**Architecture:**
- **Scene store:** GSAP, Anime.js and DOM code write plain fields on `scene` (wipe, sweep, intro, handoff, slot); the R3F scene reads them every frame.
- **Shaders:** finish materials get an `onBeforeCompile` wipe patch. The atmosphere is a full-screen, premultiplied-alpha shader quad behind the phone.
- **Boot gating:** an inline script (Next's "preventing flash before hydration" pattern) decides before first paint whether the boot plays.
- **Header:** the navbar marks itself `data-landing` on `/` during SSR, so the dark header has no flash.

**Tech Stack:** as Phase 1 (three 0.186.1, R3F 9.8.1, Drei 10.7.9, GSAP 3.15.0, Anime.js 4.5.0, StringTune 1.2.6).

**Spec:** `docs/superpowers/specs/2026-10-10-cinematic-landing-design.md` §4.0, §4.1, §4.4, §6.4–6.5, §7 (moments 01–02).

## Global Constraints

Phase 1's constraints still apply. In addition:

- **Boot** plays on the first visit per session only (`sessionStorage["imart-boot"]`). It has a hard 1.2 s timeline plus a 1.4 s safety cap, finishes on any pointer, key, wheel or touch, and never plays under reduced motion.
- **Boot reveal** uses the live 3D phone only if `data-phone="ready"` at reveal time; otherwise it reveals the still.
- **Finish change** totals about 500 ms: dim → wipe band crosses the device → environment strip sweep → settle. Rapid clicks finish the previous change first.
- **Magnetic CTA** moves 3–5 px with the arrow moving further. Desktop mouse only (StringTune `data-string="magnetic"`).
- **Cursor:** 24 px ring with labels `View`, `Select`, `Chat ↗`, `Map ↗`. Only for `(pointer: fine)`; the native pointer always shows.
- **Stills:** `public/renders/hero-<finish>.v1.webp` for `cosmic-orange`, `deep-blue`, `silver`, `fallback`, each ≤ 120 KB, rendered from the live scene (`?capture=1`). The live phone sits exactly where the still sits: device-slot centre, height = slot height × 0.86.
- **Mutation rule:** components never assign to `scene` directly (React Compiler lint). Mutation happens in module functions or inside GSAP/Anime tweens.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/components/landing/scene-store.ts` | (rewrite) scene fields + visibility/finish/environment/boot channels |
| `src/components/landing/config.ts` | (modify) stills URL, `STILL_FILL`, `BOOT_KEY`, `readCapture` |
| `src/components/landing/config.test.ts` | unit tests for `stillUrl`, `readCapture` |
| `src/components/landing/three/finish-wipe.ts` | `onBeforeCompile` wipe patch + uniform factories |
| `src/components/landing/three/atmosphere.tsx` | full-screen GLSL atmosphere |
| `src/components/landing/three/studio-lights.tsx` | lights, environment, moving sweep strip |
| `src/components/landing/three/phone-model.tsx` | (rewrite) slot placement, hand-off, wipe rig, exposure, intro light, capture |
| `src/components/landing/three/phone-canvas.tsx` | (rewrite) atmosphere, live environment, capture hook |
| `src/components/landing/three/phone-layer.tsx` | (modify) pass `captureFinish` |
| `src/components/landing/motion/finish-change.ts` | Anime.js finish-change sequence |
| `src/components/landing/motion/hero-motion.ts` | entrance, studio sweep, GSAP hand-off |
| `src/components/landing/intro/inline-script.tsx` | Next's inline-script helper |
| `src/components/landing/intro/boot-intro.tsx`, `play-boot.ts` | boot overlay + timeline |
| `src/components/landing/hero/hero-poster.tsx` | still poster following the finish |
| `src/components/landing/hero/hero-stage.tsx`, `finish-picker.tsx` | (modify) poster, magnetic, cursor labels, swipe |
| `src/components/landing/cursor/precision-cursor.tsx`, `bind-cursor.ts` | cursor ring |
| `src/components/landing/landing-experience.tsx` | (rewrite) orchestration |
| `src/components/landing/landing.css` | (modify) header, boot, entrance, magnetic, cursor, depth |
| `src/components/navbar.tsx` | (modify) `data-landing` + no topbar on `/` |
| `src/app/layout.tsx` | (modify) `suppressHydrationWarning` on `<html>` |
| `src/app/(store)/page.tsx` | (modify) render `<BootIntro/>` |
| `src/components/landing/store/*.tsx`, `src/components/product-card.tsx` | (modify) `data-cursor` labels, magnetic on Visit CTA |
| `scripts/render-stills.mjs` | stills renderer; `public/renders/*.webp` |
| `e2e/landing.e2e.mjs` | (modify) boot, entrance, finish, magnetic, cursor, hand-off, SSR header |

---

### Task 1: Scene store + config

**Files:** rewrite `scene-store.ts`; modify `config.ts`; create `config.test.ts`.

**Interfaces:**
- **Produces from `scene-store.ts`:**
  - `scene` fields: `wipe`, `dim`, `sweep`, `intro`, `handoff`, `slot`, `phoneUv`
  - Visibility: `setSceneVisible`, `subscribeScene`, `getSceneVisible`
  - Finish: `setSceneFinish`, `subscribeFinish`, `getSceneFinish`
  - Layout: `setSceneSlot`, `setPhoneUv`
  - Environment: `holdEnvironment(): () => void`, `subscribeEnvironment`, `getEnvironmentLive`
  - Boot: `markBootDone`, `isBootDone`, `subscribeBoot`
- **Produces from `config.ts`:** `stillUrl(id)`, `STILL_FILL = 0.86`, `BOOT_KEY`, `readCapture(search): string | null`.

- [ ] **Step 1: Failing tests** — `src/components/landing/config.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { readCapture, stillUrl } from "./config.ts";

test("stillUrl maps rendered finishes and falls back", () => {
  assert.equal(stillUrl("deep-blue"), "/renders/hero-deep-blue.v1.webp");
  assert.equal(stillUrl("sage"), "/renders/hero-fallback.v1.webp");
  assert.equal(stillUrl(null), "/renders/hero-fallback.v1.webp");
});

test("readCapture only activates with capture=1", () => {
  assert.equal(readCapture("?capture=1&finish=silver"), "silver");
  assert.equal(readCapture("?capture=1"), "fallback");
  assert.equal(readCapture("?finish=silver"), null);
});
```

- [ ] **Step 2: Run** `npm test`. Expected: FAIL (`readCapture` / `stillUrl` not exported).

- [ ] **Step 3: Append to `src/components/landing/config.ts`**

```ts
export const STILL_VERSION = "v1";
export const RENDERED_FINISHES = ["cosmic-orange", "deep-blue", "silver"];

/** Pre-rendered still of the hero phone in a finish (poster, intro fallback, Low tier). */
export function stillUrl(finishId: string | null | undefined): string {
  const id = finishId && RENDERED_FINISHES.includes(finishId) ? finishId : "fallback";
  return `/renders/hero-${id}.${STILL_VERSION}.webp`;
}

/** Phone height as a share of the still's frame — the live phone uses the same share of the slot. */
export const STILL_FILL = 0.86;

export const BOOT_KEY = "imart-boot";

/** `?capture=1&finish=<id>` renders the bare phone for the stills script. */
export function readCapture(search: string): string | null {
  const params = new URLSearchParams(search);
  return params.get("capture") === "1" ? (params.get("finish") ?? "fallback") : null;
}
```

- [ ] **Step 4: Rewrite `src/components/landing/scene-store.ts`**

```ts
import type { Finish } from "./data";

export interface SceneState {
  /** Pointer position, -1..1 on both axes (desktop only). */
  pointer: { x: number; y: number };
  /** Whether the 3D layer should be rendering. */
  visible: boolean;
  /** The finish on the device (the target of any running wipe). */
  finish: Finish | null;
  /** Finish wipe across the device: progress -0.05..1.05, glowing band 0..1. */
  wipe: { from: Finish | null; progress: number; band: number };
  /** Lighting dip while a finish changes, 0..1. */
  dim: number;
  /** Studio strip light travelling across the environment, 0..1; -1 when idle. */
  sweep: number;
  /** Boot reveal: scene exposure 0..1 and the green reveal light 0..1. */
  intro: { exposure: number; light: number };
  /** Hero → film hand-off, 0..1 (scrubbed by scroll). */
  handoff: number;
  /** Hero device slot in viewport fractions at scroll 0. */
  slot: { cx: number; cy: number; h: number } | null;
  /** Phone centre projected to the viewport, 0..1 with y down. */
  phoneUv: { x: number; y: number };
}

// GSAP/Anime/DOM code writes these fields; the 3D scene reads them every frame.
export const scene: SceneState = {
  pointer: { x: 0, y: 0 },
  visible: true,
  finish: null,
  wipe: { from: null, progress: 1.05, band: 0 },
  dim: 0,
  sweep: -1,
  intro: { exposure: 1, light: 0 },
  handoff: 0,
  slot: null,
  phoneUv: { x: 0.67, y: 0.5 },
};

function channel() {
  const listeners = new Set<() => void>();
  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    emit() {
      listeners.forEach((listener) => listener());
    },
  };
}

const visibility = channel();
const finishes = channel();
const environment = channel();
const boot = channel();

export function setSceneVisible(visible: boolean) {
  if (scene.visible === visible) return;
  scene.visible = visible;
  visibility.emit();
}
export const subscribeScene = visibility.subscribe;
export function getSceneVisible() {
  return scene.visible;
}

export function setSceneFinish(finish: Finish) {
  if (scene.finish?.id === finish.id) return;
  scene.finish = finish;
  finishes.emit();
}
export const subscribeFinish = finishes.subscribe;
export function getSceneFinish() {
  return scene.finish;
}

export function setSceneSlot(slot: SceneState["slot"]) {
  scene.slot = slot;
}

export function setPhoneUv(x: number, y: number) {
  scene.phoneUv.x = x;
  scene.phoneUv.y = y;
}

let environmentHolds = 0;
/** Keeps the studio environment re-rendering (for moving lights) until released. */
export function holdEnvironment(): () => void {
  environmentHolds += 1;
  if (environmentHolds === 1) environment.emit();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    environmentHolds -= 1;
    if (environmentHolds === 0) environment.emit();
  };
}
export const subscribeEnvironment = environment.subscribe;
export function getEnvironmentLive() {
  return environmentHolds > 0;
}

let bootDone = false;
export function markBootDone() {
  if (bootDone) return;
  bootDone = true;
  boot.emit();
}
export function isBootDone() {
  return bootDone;
}
export const subscribeBoot = boot.subscribe;
```

- [ ] **Step 5: Run** `npm test && npx tsc --noEmit`. Expected: all pass (14 tests).
- [ ] **Step 6: Commit** — `feat(landing): scene store channels for wipe, sweep, intro, hand-off; stills config`

---

### Task 2: Moment 02 — finish wipe, studio sweep, atmosphere

**Files:**
- Create: `three/finish-wipe.ts`, `three/atmosphere.tsx`, `three/studio-lights.tsx`, `motion/finish-change.ts`
- Rewrite: `three/phone-model.tsx`, `three/phone-canvas.tsx`
- Modify: `three/phone-layer.tsx`, `hero/finish-picker.tsx`

**Interfaces:**
- **Consumes:** Task 1.
- **Produces:**
  - `playFinishChange(next: Finish): void`
  - `PhoneCanvas` / `PhoneLayer` take `captureFinish: Finish | null`
  - `window.__imartCapture(): string` (capture mode only)
  - Exports `BASE_YAW`, `BASE_PITCH`

- [ ] **Step 1: `src/components/landing/three/finish-wipe.ts`**

```ts
import { Color, Matrix4, Vector2, type MeshStandardMaterial } from "three";

/** Uniforms shared by every finish material: where the wipe is and the phone's own frame. */
export interface SharedWipe {
  uWipe: { value: number };
  uBand: { value: number };
  uPhoneInv: { value: Matrix4 };
  uWidth: { value: Vector2 };
}

/** Per material group: the finish being replaced and the one being revealed. */
export interface WipeColors {
  uFrom: { value: Color };
  uTo: { value: Color };
}

export function createSharedWipe(minX: number, maxX: number): SharedWipe {
  return {
    uWipe: { value: 1.05 },
    uBand: { value: 0 },
    uPhoneInv: { value: new Matrix4() },
    uWidth: { value: new Vector2(minX, maxX) },
  };
}

export function createWipeColors(): WipeColors {
  return { uFrom: { value: new Color() }, uTo: { value: new Color() } };
}

/**
 * The new finish is revealed behind a thin vertical light that travels across the device
 * (left → right in the phone's own upright frame).
 */
export function patchWipe(material: MeshStandardMaterial, shared: SharedWipe, colors: WipeColors) {
  material.color.set("#ffffff");
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, shared, colors);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform mat4 uPhoneInv;\nvarying float vPhoneX;")
      .replace(
        "#include <project_vertex>",
        "#include <project_vertex>\nvPhoneX = (uPhoneInv * modelMatrix * vec4(transformed, 1.0)).x;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform vec3 uFrom;\nuniform vec3 uTo;\nuniform float uWipe;\nuniform float uBand;\nuniform vec2 uWidth;\nvarying float vPhoneX;",
      )
      .replace(
        "vec4 diffuseColor = vec4( diffuse, opacity );",
        "float wipeS = clamp((vPhoneX - uWidth.x) / (uWidth.y - uWidth.x), 0.0, 1.0);\n" +
          "vec4 diffuseColor = vec4( diffuse * mix(uTo, uFrom, step(uWipe, wipeS)), opacity );",
      )
      .replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\n" +
          "totalEmissiveRadiance += vec3(0.82, 1.0, 0.9) * uBand * smoothstep(0.06, 0.0, abs(wipeS - uWipe));",
      );
  };
  material.customProgramCacheKey = () => "imart-wipe";
  material.needsUpdate = true;
}
```

- [ ] **Step 2: `src/components/landing/three/atmosphere.tsx`**

```tsx
"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, ShaderMaterial } from "three";
import type { Finish } from "../data";
import { scene as sceneState } from "../scene-store";

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.9999, 1.0);
}`;

// Emerald aurora, a light pool behind the device and fine grain — almost invisible until you look.
const fragmentShader = /* glsl */ `
uniform float uTime;
uniform vec2 uRes;
uniform vec3 uTint;
uniform float uDark;
uniform vec2 uCenter;
varying vec2 vUv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < OCTAVES; i++) {
    v += a * noise(p);
    p = p * 2.03 + 17.1;
    a *= 0.5;
  }
  return v;
}
void main() {
  float aspect = uRes.x / uRes.y;
  vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
  float t = uTime * 0.035;
  float warp = fbm(p * 1.4 + vec2(t, -t * 0.7));
  float bands = fbm(vec2(p.x * 0.8 + t * 0.6, p.y * 2.4 - warp * 1.2));
  float aurora = smoothstep(0.42, 0.95, bands) * smoothstep(0.9, -0.2, p.y + 0.15);
  vec3 col = vec3(0.03, 0.26, 0.15) * aurora * 0.7;
  vec2 c = (uCenter - 0.5) * vec2(aspect, 1.0);
  vec2 d = (p - c) * vec2(1.25, 0.75);
  float glow = exp(-dot(d, d) * mix(2.6, 7.0, uDark));
  col += mix(vec3(0.07, 0.45, 0.27), uTint, 0.22) * glow * 0.42;
  col *= 1.0 - uDark * 0.6;
  float grain = (hash(vUv * uRes + fract(uTime * 0.71) * 311.0) - 0.5) * 0.035;
  col = max(col + grain, 0.0);
  float alpha = clamp(max(col.r, max(col.g, col.b)) * 1.8, 0.0, 0.85);
  gl_FragColor = vec4(min(col, vec3(alpha)), alpha);
}`;

const tintTarget = new Color();

function tick(material: ShaderMaterial, elapsed: number, width: number, height: number, finish: Finish | null) {
  const u = material.uniforms;
  u.uTime.value = elapsed;
  u.uRes.value[0] = width;
  u.uRes.value[1] = height;
  u.uDark.value = sceneState.handoff;
  u.uCenter.value[0] = sceneState.phoneUv.x;
  u.uCenter.value[1] = 1 - sceneState.phoneUv.y;
  tintTarget.set(finish?.aluminium ?? "#3A3B3E");
  (u.uTint.value as Color).lerp(tintTarget, 0.04);
}

export function Atmosphere({ quality, initialFinish }: { quality: "high" | "mid"; initialFinish: Finish | null }) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        defines: { OCTAVES: quality === "high" ? 4 : 2 },
        uniforms: {
          uTime: { value: 0 },
          uRes: { value: [1, 1] },
          uTint: { value: new Color(initialFinish?.aluminium ?? "#3A3B3E") },
          uDark: { value: 0 },
          uCenter: { value: [0.67, 0.5] },
        },
        transparent: true,
        premultipliedAlpha: true,
        depthWrite: false,
        depthTest: false,
      }),
    [quality, initialFinish],
  );

  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    tick(material, state.clock.elapsedTime, state.size.width * state.viewport.dpr, state.size.height * state.viewport.dpr, sceneState.finish ?? initialFinish);
  });

  return (
    <mesh frustumCulled={false} renderOrder={-10} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
```

- [ ] **Step 3: `src/components/landing/three/studio-lights.tsx`**

```tsx
"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import type { Mesh } from "three";
import { scene as sceneState } from "../scene-store";

function placeSweep(strip: Mesh | null) {
  if (!strip) return;
  const s = sceneState.sweep;
  strip.visible = s >= 0;
  strip.position.x = -3.2 + Math.max(s, 0) * 6.4;
}

/** A narrow studio strip that travels in front of the phone; its reflection runs along the frame. */
function SweepStrip() {
  const ref = useRef<Mesh>(null);
  useFrame(() => placeSweep(ref.current));
  return (
    <Lightformer ref={ref} form="rect" intensity={7} position={[-3.2, 0.3, 1.6]} scale={[0.22, 4.2, 1]} rotation-y={Math.PI} />
  );
}

export function StudioLights({ live }: { live: boolean }) {
  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight position={[2.5, 3, 2]} intensity={1.1} />
      <directionalLight position={[-2, 1.2, 1.5]} intensity={0.9} color="#3ddc84" />
      <Environment resolution={256} frames={live ? Infinity : 1}>
        <Lightformer form="rect" intensity={2.6} position={[0, 2.6, 1.2]} scale={[4, 0.5, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={2.2} position={[-2.6, 0.2, 1]} scale={[0.35, 3.2, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.6} position={[2.6, 0.2, 1]} scale={[0.35, 3.2, 1]} rotation-y={-Math.PI / 2} />
        <Lightformer form="rect" intensity={0.5} position={[0, 0.4, 3.5]} scale={[4, 2.6, 1]} rotation-y={Math.PI} />
        <Lightformer form="ring" intensity={1.2} color="#3ddc84" position={[0, 0, -3]} scale={2.2} />
        <SweepStrip />
      </Environment>
    </>
  );
}
```

- [ ] **Step 4: Rewrite `src/components/landing/three/phone-model.tsx`**

```tsx
"use client";

import { useLayoutEffect, useRef } from "react";
import { useFrame, type RootState } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  Box3, CanvasTexture, Group, MathUtils, Matrix4, Mesh, MeshStandardMaterial, PointLight,
  Quaternion, SRGBColorSpace, Vector3,
} from "three";
import { MODEL_URL, STILL_FILL } from "../config";
import { FALLBACK_FINISH, type Finish } from "../data";
import { scene as sceneState, setPhoneUv } from "../scene-store";
import { createSharedWipe, createWipeColors, patchWipe, type SharedWipe, type WipeColors } from "./finish-wipe";

const ALUMINIUM = ["Anodized aluminum", "Metal tint"];
const ANTENNA = ["Plastic antena"];
const BACK_GLASS = ["Frosted glass"];
const ANTENNA_SHADE = 0.55;
export const BASE_YAW = -0.32;
export const BASE_PITCH = 0.04;
const FILM_YAW = -0.1;

useGLTF.preload(MODEL_URL, false, true);

type Look = Omit<Finish, "id" | "label">;

interface Rig {
  shared: SharedWipe;
  aluminium: WipeColors;
  antenna: WipeColors;
  glass: WipeColors;
  metals: MeshStandardMaterial[];
  height: number;
  smoothed: { x: number; y: number };
  ready: boolean;
}

function materialsNamed(root: Group, names: string[]): MeshStandardMaterial[] {
  const found = new Set<MeshStandardMaterial>();
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const list = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of list) {
      if (material instanceof MeshStandardMaterial && names.includes(material.name)) found.add(material);
    }
  });
  return [...found];
}

/**
 * Measures the model in its own space (independent of our wrapper groups, so re-running is safe):
 * the rotation that stands it upright with the screen facing +Z, its centre, its height and its
 * width range in that upright frame.
 */
function measure(model: Group) {
  model.updateMatrixWorld(true);
  const toModel = new Matrix4().copy(model.matrixWorld).invert();
  const relative = (mesh: Mesh) => new Matrix4().multiplyMatrices(toModel, mesh.matrixWorld);
  const meshes: Mesh[] = [];
  model.traverse((o) => {
    if (o instanceof Mesh) meshes.push(o);
  });
  const oled = meshes.find((m) => !Array.isArray(m.material) && m.material.name === "OLED");
  if (!oled) throw new Error("Phone model has no OLED mesh");

  // In the mesh's own space the long axis is Z (top at -Z) and the back faces +Y.
  const oledMatrix = relative(oled);
  const up = new Vector3(0, 0, -1).transformDirection(oledMatrix);
  const front = new Vector3(0, -1, 0).transformDirection(oledMatrix);
  const right = new Vector3().crossVectors(up, front).normalize();
  const trueFront = new Vector3().crossVectors(right, up).normalize();
  const correction = new Quaternion()
    .setFromRotationMatrix(new Matrix4().makeBasis(right, up, trueFront))
    .invert();

  const box = new Box3();
  for (const mesh of meshes) {
    mesh.geometry.computeBoundingBox();
    const bounds = mesh.geometry.boundingBox;
    if (bounds) box.union(bounds.clone().applyMatrix4(relative(mesh)));
  }
  const center = box.getCenter(new Vector3());
  const size = box.getSize(new Vector3());
  const upright = box.clone().applyMatrix4(
    new Matrix4().makeRotationFromQuaternion(correction).multiply(new Matrix4().makeTranslation(-center.x, -center.y, -center.z)),
  );
  return {
    correction,
    center,
    height: Math.max(size.x, size.y, size.z),
    width: [upright.min.x, upright.max.x] as const,
  };
}

let wallpaper: CanvasTexture | null = null;

/** iMart's own idle screen: a soft emerald glow, centred so UV orientation doesn't matter. */
function getWallpaper(): CanvasTexture | null {
  if (wallpaper) return wallpaper;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const glow = ctx.createRadialGradient(256, 512, 16, 256, 512, 640);
  glow.addColorStop(0, "#1f8a5b");
  glow.addColorStop(0.32, "#0d3f29");
  glow.addColorStop(0.68, "#04140d");
  glow.addColorStop(1, "#010403");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  wallpaper = new CanvasTexture(canvas);
  wallpaper.colorSpace = SRGBColorSpace;
  return wallpaper;
}

function applyWallpaper(screens: MeshStandardMaterial[]) {
  const texture = getWallpaper();
  if (!texture) return;
  for (const m of screens) {
    m.map = null;
    m.color.set("#000000");
    m.emissive.set("#ffffff");
    m.emissiveMap = texture;
    m.emissiveIntensity = 0.85;
    m.needsUpdate = true;
  }
}

function buildRig(model: Group, orient: Group, centre: Group): Rig {
  const { correction, center, height, width } = measure(model);
  orient.quaternion.copy(correction);
  centre.position.copy(center).negate();
  const rig: Rig = {
    shared: createSharedWipe(width[0], width[1]),
    aluminium: createWipeColors(),
    antenna: createWipeColors(),
    glass: createWipeColors(),
    metals: materialsNamed(model, ALUMINIUM),
    height,
    smoothed: { x: 0, y: 0 },
    ready: false,
  };
  for (const m of rig.metals) patchWipe(m, rig.shared, rig.aluminium);
  for (const m of materialsNamed(model, ANTENNA)) patchWipe(m, rig.shared, rig.antenna);
  for (const m of materialsNamed(model, BACK_GLASS)) patchWipe(m, rig.shared, rig.glass);
  applyWallpaper(materialsNamed(model, ["OLED"]));
  return rig;
}

const projected = new Vector3();

interface FrameInput {
  state: RootState;
  delta: number;
  place: Group;
  light: PointLight | null;
  rig: Rig;
  tier: "high" | "mid";
  look: Look;
  capture: boolean;
}

function frame({ state, delta, place, light, rig, tier, look, capture }: FrameInput) {
  const { width: vw, height: vh } = state.viewport;
  const mobile = vw / vh < 0.9;
  const t = state.clock.elapsedTime;
  const k = capture ? 0 : sceneState.handoff;
  const motion = capture ? 0 : 1;

  // Placement: where the poster still sits (device slot), easing to centre during the hand-off.
  let x = vw * 0.17;
  let y = 0;
  let h = vh * 0.72;
  const slot = sceneState.slot;
  if (capture) {
    x = 0;
    h = vh * STILL_FILL;
  } else if (slot) {
    x = (slot.cx - 0.5) * vw;
    y = (0.5 - slot.cy) * vh;
    h = slot.h * vh * STILL_FILL;
  }
  x = MathUtils.lerp(x, 0, k);
  y = MathUtils.lerp(y, 0, k);
  h = MathUtils.lerp(h, vh * (mobile ? 0.5 : 0.78), k);
  place.scale.setScalar(h / rig.height);

  const sm = rig.smoothed;
  const follow = tier === "high" && !capture;
  sm.x = MathUtils.damp(sm.x, follow ? sceneState.pointer.x : 0, 2.5, delta);
  sm.y = MathUtils.damp(sm.y, follow ? sceneState.pointer.y : 0, 2.5, delta);
  place.position.set(x, y + Math.sin(t * 0.35) * vh * 0.0025 * motion, 0);
  place.rotation.y = MathUtils.lerp(BASE_YAW, FILM_YAW, k) + Math.sin(t * 0.21) * 0.012 * motion + sm.x * 0.05;
  place.rotation.x = BASE_PITCH + Math.sin(t * 0.17) * 0.006 * motion + sm.y * 0.025;

  // Finish wipe: old finish ahead of the band, new finish behind it.
  const from = capture ? look : (sceneState.wipe.from ?? look);
  rig.aluminium.uFrom.value.set(from.aluminium);
  rig.aluminium.uTo.value.set(look.aluminium);
  rig.antenna.uFrom.value.set(from.aluminium).multiplyScalar(ANTENNA_SHADE);
  rig.antenna.uTo.value.set(look.aluminium).multiplyScalar(ANTENNA_SHADE);
  rig.glass.uFrom.value.set(from.glass);
  rig.glass.uTo.value.set(look.glass);
  rig.shared.uWipe.value = capture ? 1.05 : sceneState.wipe.progress;
  rig.shared.uBand.value = capture ? 0 : sceneState.wipe.band;
  place.updateMatrixWorld();
  rig.shared.uPhoneInv.value.copy(place.matrixWorld).invert();
  const mix = MathUtils.clamp(rig.shared.uWipe.value, 0, 1);
  for (const m of rig.metals) {
    m.metalness = MathUtils.lerp(from.metalness, look.metalness, mix);
    m.roughness = MathUtils.lerp(from.roughness, look.roughness, mix);
  }

  // Boot reveal and the finish-change dip.
  state.gl.toneMappingExposure = (capture ? 1 : sceneState.intro.exposure) * (1 - 0.3 * sceneState.dim);
  if (light) light.intensity = capture ? 0 : sceneState.intro.light * 3;

  projected.copy(place.position).project(state.camera);
  setPhoneUv((projected.x + 1) / 2, (1 - projected.y) / 2);
}

export function PhoneModel({
  tier,
  initialFinish,
  captureFinish,
  onReady,
}: {
  tier: "high" | "mid";
  initialFinish: Finish | null;
  captureFinish: Finish | null;
  onReady: () => void;
}) {
  const { scene: model } = useGLTF(MODEL_URL, false, true);
  const place = useRef<Group>(null);
  const orient = useRef<Group>(null);
  const centre = useRef<Group>(null);
  const light = useRef<PointLight>(null);
  const rig = useRef<Rig | null>(null);

  useLayoutEffect(() => {
    if (!orient.current || !centre.current) return;
    rig.current = buildRig(model, orient.current, centre.current);
  }, [model]);

  useFrame((state, delta) => {
    const r = rig.current;
    if (!place.current || !r) return;
    const look = captureFinish ?? sceneState.finish ?? initialFinish ?? FALLBACK_FINISH;
    frame({ state, delta, place: place.current, light: light.current, rig: r, tier, look, capture: captureFinish !== null });
    if (!r.ready) {
      r.ready = true;
      onReady();
    }
  });

  return (
    <group ref={place}>
      {/* The green light from the boot dot, at the phone's front-left edge. */}
      <pointLight ref={light} color="#3ddc84" intensity={0} distance={0} decay={2} position={[-0.07, 0.05, 0.1]} />
      <group ref={orient}>
        <group ref={centre}>
          <primitive object={model} />
        </group>
      </group>
    </group>
  );
}
```

- [ ] **Step 5: Rewrite `src/components/landing/three/phone-canvas.tsx`**

```tsx
"use client";

import { Suspense, useSyncExternalStore } from "react";
import { Canvas } from "@react-three/fiber";
import type { Finish } from "../data";
import { getEnvironmentLive, getSceneVisible, subscribeEnvironment, subscribeScene } from "../scene-store";
import { Atmosphere } from "./atmosphere";
import { PhoneModel } from "./phone-model";
import { StudioLights } from "./studio-lights";

function exposeCapture(canvas: HTMLCanvasElement) {
  (window as Window & { __imartCapture?: () => string }).__imartCapture = () => canvas.toDataURL("image/png");
}

export default function PhoneCanvas({
  tier,
  initialFinish,
  captureFinish,
  onReady,
}: {
  tier: "high" | "mid";
  initialFinish: Finish | null;
  captureFinish: Finish | null;
  onReady: () => void;
}) {
  const visible = useSyncExternalStore(subscribeScene, getSceneVisible, () => true);
  const live = useSyncExternalStore(subscribeEnvironment, getEnvironmentLive, () => false);
  const capture = captureFinish !== null;
  return (
    <Canvas
      frameloop={visible ? "always" : "never"}
      dpr={capture ? 2 : tier === "high" ? [1, 2] : [1, 1.5]}
      camera={{ fov: 24, position: [0, 0, 1.15], near: 0.01, far: 20 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: capture }}
      onCreated={capture ? ({ gl }) => exposeCapture(gl.domElement) : undefined}
    >
      <Suspense fallback={null}>
        {!capture && <Atmosphere quality={tier} initialFinish={initialFinish} />}
        <StudioLights live={live} />
        <PhoneModel tier={tier} initialFinish={initialFinish} captureFinish={captureFinish} onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
```

- [ ] **Step 6: `three/phone-layer.tsx`** — add `captureFinish: Finish | null` to the props type and pass it through: `<PhoneCanvas tier={tier} initialFinish={initialFinish} captureFinish={captureFinish} onReady={onReady} />`.

- [ ] **Step 7: `src/components/landing/motion/finish-change.ts`**

```ts
import { createTimeline, type Timeline } from "animejs";
import type { Finish } from "../data";
import { holdEnvironment, scene, setSceneFinish } from "../scene-store";

let running: Timeline | null = null;

/** Moment 02: lighting dims, a thin light crosses the device revealing the new finish, it settles. */
export function playFinishChange(next: Finish) {
  const current = scene.finish;
  if (current?.id === next.id) return;
  running?.complete();
  scene.wipe.from = current;
  setSceneFinish(next);

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || current === null) {
    scene.wipe.progress = 1.05;
    scene.wipe.band = 0;
    return;
  }

  const release = holdEnvironment();
  scene.wipe.progress = -0.05;
  scene.sweep = 0;
  running = createTimeline({
    onComplete: () => {
      scene.sweep = -1;
      scene.dim = 0;
      release();
      running = null;
    },
  })
    .add(scene, { dim: [0, 0.22], duration: 120, ease: "outQuad" }, 0)
    .add(scene.wipe, { progress: [-0.05, 1.05], duration: 420, ease: "inOutQuad" }, 80)
    .add(scene.wipe, { band: [0, 1], duration: 160, ease: "outQuad" }, 80)
    .add(scene.wipe, { band: [1, 0], duration: 260, ease: "inQuad" }, 240)
    .add(scene, { sweep: [0, 1], duration: 420, ease: "inOutQuad" }, 80)
    .add(scene, { dim: [0.22, 0], duration: 200, ease: "outQuad" }, 380);
}
```

- [ ] **Step 8: `hero/finish-picker.tsx`.** Replace `setSceneFinish(finishes[index])` with `playFinishChange(finishes[index])`; import from `../motion/finish-change`. Add `data-cursor="select"` to each option button. Add mobile swipe: an effect that binds touch swipes on `.hero-device-slot`.

```tsx
  useEffect(() => {
    const slot = document.querySelector<HTMLElement>(".hero-device-slot");
    if (!slot || finishes.length < 2) return;
    let startX: number | null = null;
    const down = (e: PointerEvent) => {
      if (e.pointerType === "touch") startX = e.clientX;
    };
    const up = (e: PointerEvent) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) < 40) return;
      setSelected((current) => {
        const next = (current + (dx < 0 ? 1 : -1) + finishes.length) % finishes.length;
        playFinishChange(finishes[next]);
        return next;
      });
    };
    slot.addEventListener("pointerdown", down);
    slot.addEventListener("pointerup", up);
    return () => {
      slot.removeEventListener("pointerdown", down);
      slot.removeEventListener("pointerup", up);
    };
  }, [finishes]);
```

The slot needs `touch-action: pan-y` (CSS, Task 5) so horizontal swipes reach the handler.

- [ ] **Step 9: Verify.** Add `captureFinish={null}` to the `<PhoneLayer …/>` in `landing-experience.tsx`; Task 3 wires the real value. Then run `npx tsc --noEmit && npx eslint src/components/landing && npx next build`, all exit 0.
- [ ] **Step 10: Commit** — `feat(landing): finish wipe shader, studio sweep, GLSL atmosphere (moment 02)`

---

### Task 3: Stills, poster and slot-anchored placement

**Files:**
- Create: `scripts/render-stills.mjs`, `hero/hero-poster.tsx`
- Modify: `hero/hero-stage.tsx`, `landing-experience.tsx`, `landing.css`, `package.json`

- [ ] **Step 1: `src/components/landing/hero/hero-poster.tsx`**

```tsx
"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";
import { stillUrl } from "../config";
import type { Finish } from "../data";
import { getSceneFinish, subscribeFinish } from "../scene-store";

/** A still of the same phone, rendered from the live scene; follows the picked finish. */
export function HeroPoster({ finishes, alt }: { finishes: Finish[]; alt: string }) {
  const picked = useSyncExternalStore(subscribeFinish, getSceneFinish, () => null);
  const id = picked?.id ?? finishes[0]?.id ?? null;
  return <Image className="hero-poster" src={stillUrl(id)} alt={alt} fill priority sizes="(max-width: 760px) 90vw, 640px" />;
}
```

- [ ] **Step 2: `hero-stage.tsx`.** Replace the `<Image className="hero-poster" …/>` block with `{hero && <HeroPoster finishes={hero.finishes} alt={hero.name} />}` and drop the `next/image` import. On the primary CTA add `data-string="magnetic" data-string-strength="0.12" data-string-radius="150"` and wrap its icon as `<span className="cta-arrow"><StoreIcon name="arrow" width={18} /></span>`. On the WhatsApp CTA add `data-cursor="chat"`.

- [ ] **Step 3: `landing-experience.tsx`** — slot measurement and capture (the full file is rewritten in Task 5; this task adds):

```tsx
  const captureId = useSyncExternalStore(noopSubscribe, () => readCapture(window.location.search), () => null);
  const captureFinish = captureId ? (parseFinishes(captureId.replace(/-/g, " "))[0] ?? null) : null;

  useEffect(() => {
    const slot = rootRef.current?.querySelector<HTMLElement>(".hero-device-slot");
    if (!slot) return;
    const measureSlot = () => {
      const r = slot.getBoundingClientRect();
      setSceneSlot({
        cx: (r.left + r.width / 2) / window.innerWidth,
        cy: (r.top + window.scrollY + r.height / 2) / window.innerHeight,
        h: r.height / window.innerHeight,
      });
    };
    measureSlot();
    let timer = 0;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(measureSlot, 120);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(timer);
    };
  }, []);
```

`noopSubscribe` is `() => () => {}`. Pass `captureFinish` to `PhoneLayer`, and render `data-capture` on `<main>` when `captureId` is set.

- [ ] **Step 4: `landing.css`**

```css
/* Capture mode (stills script): only the canvas matters. */
.landing[data-capture] > :not(.phone-layer) { visibility: hidden; }
.landing[data-capture] .phone-layer { opacity: 1; }
```

Change the mobile `.hero-device-slot` height to `54vh`, and the mobile `.landing-hero` padding-top to `calc(var(--header-h) + 56vh)`.

- [ ] **Step 5: `scripts/render-stills.mjs`**

```js
// Renders the hero phone in each finish from the live scene (needs `npm run start`).
// Run: npm run stills:render
import fs from "node:fs";
import { chromium } from "playwright-core";
import sharp from "sharp";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const EDGE = process.env.EDGE_PATH ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const FINISHES = ["cosmic-orange", "deep-blue", "silver", "fallback"];
const VERSION = "v1";
const MAX_KB = 120;

fs.mkdirSync("public/renders", { recursive: true });
const browser = await chromium.launch({
  executablePath: EDGE,
  headless: true,
  args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"],
});
const context = await browser.newContext({ viewport: { width: 700, height: 1100 } });
// Skip the boot intro so the scene is fully lit.
await context.addInitScript(() => {
  try {
    sessionStorage.setItem("imart-boot", "1");
  } catch {}
});

let failed = false;
for (const id of FINISHES) {
  const page = await context.newPage();
  await page.goto(`${BASE}/?tier=high&capture=1&finish=${id}`, { waitUntil: "networkidle" });
  await page.waitForFunction(
    () => document.querySelector("main.landing")?.getAttribute("data-phone") === "ready" && typeof window.__imartCapture === "function",
    null,
    { timeout: 30000 },
  );
  await page.waitForTimeout(800);
  const dataUrl = await page.evaluate(() => window.__imartCapture());
  const png = Buffer.from(dataUrl.split(",")[1], "base64");
  const out = `public/renders/hero-${id}.${VERSION}.webp`;
  await sharp(png).resize({ height: 1100 }).webp({ quality: 82, alphaQuality: 90 }).toFile(out);
  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log(`${out}  ${kb} KB`);
  if (kb > MAX_KB) failed = true;
  await page.close();
}
await browser.close();
if (failed) {
  console.error(`FAILED: a still is over ${MAX_KB} KB`);
  process.exit(1);
}
```

Add `"stills:render": "node scripts/render-stills.mjs"` to `package.json` scripts.

- [ ] **Step 6: Build, start, render.** Run `npx next build && (npx next start -p 3000 &) && npm run stills:render`. Expected: 4 lines, each ≤ 120 KB. Open one WebP and check it shows the phone in its finish on a transparent background.
- [ ] **Step 7: Commit** — `feat(landing): stills rendered from the live scene; poster + phone share the device slot`

---

### Task 4: Moment 01 — boot intro

**Files:**
- Create: `intro/inline-script.tsx`, `intro/boot-intro.tsx`, `intro/play-boot.ts`
- Modify: `src/app/(store)/page.tsx`, `src/app/layout.tsx`, `src/components/navbar.tsx`, `landing.css`

- [ ] **Step 1: `src/components/landing/intro/inline-script.tsx`** (from Next's "preventing flash before hydration" guide)

```tsx
/** Runs during HTML parsing on hard loads; ignored (text/plain) on client renders. */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
```

- [ ] **Step 2: `src/components/landing/intro/play-boot.ts`**

```ts
import { createTimeline, utils } from "animejs";
import { BOOT_KEY } from "../config";
import { markBootDone, scene } from "../scene-store";

const SKIP_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart"] as const;

/** Moment 01: dot → signal → "iMart." → the dot's green light reveals the phone. */
export function playBoot(root: HTMLElement): () => void {
  const html = document.documentElement;
  const curtain = root.querySelector<HTMLElement>(".boot-curtain");
  const glow = root.querySelector<HTMLElement>(".boot-glow");
  const logo = root.querySelector<HTMLElement>(".boot-logo");
  const dot = root.querySelector<HTMLElement>(".boot-dot");
  const signal = root.querySelector<HTMLElement>(".boot-signal");
  const letters = root.querySelectorAll<HTMLElement>(".boot-letter");
  if (!curtain || !glow || !logo || !dot || !signal) {
    markBootDone();
    return () => {};
  }

  scene.intro.exposure = 0.04;
  scene.intro.light = 0;
  let finished = false;
  let cap = 0;

  const finish = () => {
    if (finished) return;
    finished = true;
    window.clearTimeout(cap);
    SKIP_EVENTS.forEach((type) => window.removeEventListener(type, finish));
    tl.complete();
    scene.intro.exposure = 1;
    scene.intro.light = 0;
    html.dataset.boot = "done";
    try {
      sessionStorage.setItem(BOOT_KEY, "1");
    } catch {}
    markBootDone();
  };

  // The light opens from wherever the logo's dot actually is.
  const reveal = () => {
    const r = dot.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    utils.set(curtain, { "--bx": `${x}px`, "--by": `${y}px` });
    utils.set(glow, { left: `${x}px`, top: `${y}px` });
  };

  const radius = Math.hypot(window.innerWidth, window.innerHeight);
  const tl = createTimeline({ onComplete: finish });
  tl.add(signal, { scale: [0, 1], opacity: [0, 1], duration: 140, ease: "outExpo" }, 0)
    .add(signal, { scale: [1, 1.9], duration: 70, ease: "outQuad" }, 140)
    .add(signal, { scale: [1.9, 1], duration: 70, ease: "inQuad" }, 210)
    .add(signal, { scaleX: [1, 26], opacity: [1, 0], duration: 160, ease: "inOutQuad" }, 280)
    .add(letters, { y: ["60%", "0%"], opacity: [0, 1], rotateX: [40, 0], filter: ["blur(6px)", "blur(0px)"], duration: 320, delay: (_el: HTMLElement, i: number) => i * 45, ease: "outQuart" }, 330)
    .add(dot, { scale: [2.2, 1], opacity: [0, 1], duration: 90, ease: "outExpo" }, 620)
    .add(dot, { boxShadow: ["0 0 28px 6px rgba(61,220,132,0.9)", "0 0 0px 0px rgba(61,220,132,0)"], duration: 140, ease: "outQuad" }, 640)
    .call(reveal, 700)
    .add(glow, { opacity: [0, 0.9], scale: [0.2, 1], duration: 220, ease: "outQuad" }, 700)
    .add(glow, { opacity: [0.9, 0], scale: [1, 1.8], duration: 300, ease: "inQuad" }, 920)
    .add(logo, { scale: [1, 1.18], duration: 500, ease: "inQuad" }, 700)
    .add(letters, { x: (_el: HTMLElement, i: number) => (i - 2) * window.innerWidth * 0.22, opacity: 0, filter: "blur(8px)", duration: 480, ease: "inQuad" }, 720)
    .add(dot, { scale: [1, 5], opacity: [1, 0], duration: 400, ease: "inQuad" }, 720)
    .add(curtain, { "--r": [0, radius], duration: 500, ease: "inQuad" }, 700)
    // 3D side, always scheduled: if the phone isn't live yet its canvas is still hidden, and it
    // simply appears fully lit later (the reveal then shows the still underneath).
    .add(scene.intro, { light: [0, 1], duration: 220, ease: "outQuad" }, 700)
    .add(scene.intro, { exposure: [0.04, 1], duration: 480, ease: "inQuad" }, 720)
    .add(scene.intro, { light: [1, 0], duration: 320, ease: "inQuad" }, 920);

  SKIP_EVENTS.forEach((type) => window.addEventListener(type, finish, { passive: true }));
  cap = window.setTimeout(finish, 1400);
  return () => {
    if (!finished) finish();
  };
}
```

- [ ] **Step 3: `src/components/landing/intro/boot-intro.tsx`**

```tsx
"use client";

import { useEffect, useRef } from "react";
import { BOOT_KEY } from "../config";
import { markBootDone } from "../scene-store";
import { InlineScript } from "./inline-script";
import { playBoot } from "./play-boot";

// Decides before first paint: play the boot (first visit this session) or skip it.
const GATE = `(function(){var d=document.documentElement;try{var calm=window.matchMedia("(prefers-reduced-motion: reduce)").matches;var seen=sessionStorage.getItem("${BOOT_KEY}")==="1";d.setAttribute("data-boot",calm||seen?"skip":"play");if(!calm)d.setAttribute("data-entrance","pending");}catch(e){d.setAttribute("data-boot","skip");}})()`;

const LETTERS = ["i", "M", "a", "r", "t"];

export function BootIntro() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || document.documentElement.dataset.boot !== "play") {
      markBootDone();
      return;
    }
    return playBoot(root);
  }, []);

  return (
    <>
      <div ref={rootRef} className="boot" aria-hidden="true">
        <div className="boot-curtain" />
        <div className="boot-glow" />
        <div className="boot-logo">
          {LETTERS.map((letter, i) => (
            <span key={i} className="boot-letter">{letter}</span>
          ))}
          <span className="boot-dot" />
        </div>
        <span className="boot-signal" />
      </div>
      <InlineScript html={GATE} />
    </>
  );
}
```

- [ ] **Step 4: `src/app/(store)/page.tsx`.** Render `<BootIntro />` as the first child of `<LandingExperience>`. In `src/app/layout.tsx`, add `suppressHydrationWarning` to `<html>` (the gate script sets `data-boot`/`data-entrance` on it before hydration).

- [ ] **Step 5: `src/components/navbar.tsx`** — SSR-correct landing header

```tsx
import { usePathname } from "next/navigation";
// …inside Navbar:
  const onLanding = usePathname() === "/";
// topbar: render only when !onLanding
// header: <header className="store-header" data-landing={onLanding ? "" : undefined}>
```

- [ ] **Step 6: `landing.css`.** Replace the whole "Header on the landing page" block with the following. Also remove `data-active` from `landing-experience.tsx`; nothing reads it now.

```css
/* ---------- Header on the landing page ----------
   The navbar marks itself data-landing on "/" during SSR, so the dark header is right before the
   landing markup is parsed (no flash). :has() only follows the scroll stage. */
.store-header[data-landing] {
  position: fixed;
  inset: 0 0 auto;
  transition: background-color .5s cubic-bezier(.16, 1, .3, 1), border-color .5s, color .5s;
}
.store-header[data-landing] :is(.store-navigation, .store-search, .header-help) {
  transition: opacity .4s cubic-bezier(.16, 1, .3, 1), visibility .4s;
}
.storefront:not(:has(.landing[data-stage="light"])) .store-header[data-landing] { background: transparent; border-bottom-color: transparent; color: #eef3ef; }
.storefront:not(:has(.landing[data-stage="light"])) .store-header[data-landing] :is(.store-logo, .store-navigation a, .header-cart, .header-help, .mobile-menu-toggle) { color: #eef3ef; }
.storefront:not(:has(.landing[data-stage="light"])) .store-header[data-landing] .store-logo > span { color: #3ddc84; }
.storefront:not(:has(.landing[data-stage="light"])) .store-header[data-landing] .header-help small { color: rgba(238, 243, 239, .6); }
.storefront:not(:has(.landing[data-stage="light"])) .store-header[data-landing] .store-navigation { border-top-color: rgba(255, 255, 255, .08); }
.storefront:not(:has(.landing[data-stage="light"])) .store-header[data-landing] .store-navigation .browse-all { border-right-color: rgba(255, 255, 255, .14); }
.storefront:not(:has(.landing[data-stage="light"])) .store-header[data-landing] .store-navigation .nav-visit { color: #3ddc84; }
.storefront:not(:has(.landing[data-stage="light"])) .store-header[data-landing] .store-search { background: rgba(255, 255, 255, .06); border-color: rgba(255, 255, 255, .14); }
.storefront:not(:has(.landing[data-stage="light"])) .store-header[data-landing] .store-search input { color: #eef3ef; }
.storefront:not(:has(.landing[data-stage="light"])) .store-header[data-landing] .store-search input::placeholder { color: rgba(238, 243, 239, .55); }
.storefront:has(.landing[data-stage="film"]) .store-header[data-landing] :is(.store-navigation:not(.is-open), .store-search, .header-help) { opacity: 0; visibility: hidden; }

/* ---------- Boot (moment 01) ---------- */
.boot { display: none; position: fixed; inset: 0; z-index: 90; pointer-events: none; }
html[data-boot="play"] .boot { display: block; }
.boot-curtain {
  --r: 0;
  --bx: 50%;
  --by: 50%;
  position: absolute;
  inset: 0;
  background: #030504;
  -webkit-mask-image: radial-gradient(circle at var(--bx) var(--by), transparent calc(var(--r) * 1px), #000 calc(var(--r) * 1px + 18vmax));
  mask-image: radial-gradient(circle at var(--bx) var(--by), transparent calc(var(--r) * 1px), #000 calc(var(--r) * 1px + 18vmax));
}
.boot-glow { position: absolute; left: 50%; top: 50%; width: 70vmax; height: 70vmax; translate: -50% -50%; border-radius: 50%; background: radial-gradient(circle, rgba(61, 220, 132, .5), rgba(61, 220, 132, 0) 60%); opacity: 0; }
.boot-logo { position: absolute; left: 50%; top: 50%; translate: -50% -50%; display: flex; align-items: baseline; font-size: clamp(56px, 9vw, 120px); font-weight: 600; letter-spacing: -.06em; color: #eef3ef; perspective: 600px; }
.boot-letter { display: inline-block; opacity: 0; }
.boot-letter:not(:first-child) { color: #3ddc84; }
.boot-dot { display: inline-block; width: .14em; height: .14em; margin-left: .05em; border-radius: 50%; background: #3ddc84; opacity: 0; }
.boot-signal { position: absolute; left: 50%; top: 50%; width: 8px; height: 8px; margin: -4px 0 0 -4px; border-radius: 4px; background: #3ddc84; box-shadow: 0 0 16px #3ddc84; opacity: 0; }
```

- [ ] **Step 7: Verify** with `npx tsc --noEmit && npx eslint src/components src/app && npx next build`.
- [ ] **Step 8: Commit** — `feat(landing): boot intro — green dot becomes the light that reveals the phone (moment 01)`

---

### Task 5: Hero entrance, studio sweep, pointer depth, hand-off, orchestration

**Files:**
- Create: `motion/hero-motion.ts`
- Rewrite: `landing-experience.tsx`
- Modify: `landing.css`

- [ ] **Step 1: `src/components/landing/motion/hero-motion.ts`**

```ts
import { animate, createTimeline, splitText, stagger, utils } from "animejs";
import { holdEnvironment, scene } from "../scene-store";
import { getGsap } from "./gsap";

/** Characters rise from just below the baseline while tracking tightens; then the rest. */
export function playHeroEntrance(root: HTMLElement): () => void {
  const html = document.documentElement;
  const lines = Array.from(root.querySelectorAll<HTMLElement>(".hero-line"));
  const rest = Array.from(root.querySelectorAll<HTMLElement>(".hero-copy > :not(.hero-title)"));
  if (lines.length < 2) {
    html.dataset.entrance = "done";
    return () => {};
  }
  const splits = lines.map((line) => splitText(line, { chars: true, accessible: true }));
  utils.set(splits.flatMap((s) => s.chars), { opacity: 0 });
  utils.set(rest, { opacity: 0 });
  html.dataset.entrance = "running";

  const tl = createTimeline({
    onComplete: () => {
      html.dataset.entrance = "done";
    },
  })
    .add(splits[0].chars, { y: ["0.42em", "0em"], opacity: [0, 1], duration: 720, delay: stagger(22), ease: "outQuart" }, 0)
    .add(lines[0], { letterSpacing: ["0.03em", "-0.035em"], duration: 900, ease: "outQuart" }, 0)
    .add(splits[1].chars, { y: ["0.5em", "0em"], opacity: [0, 1], duration: 900, delay: stagger(28), ease: "outQuart" }, 420)
    .add(lines[1], { letterSpacing: ["0.04em", "-0.035em"], duration: 1100, ease: "outQuart" }, 420)
    .add(rest, { y: [14, 0], opacity: [0, 1], duration: 600, delay: stagger(70), ease: "outQuart" }, 300);

  return () => {
    tl.revert();
    splits.forEach((s) => s.revert());
    html.dataset.entrance = "done";
  };
}

/** The first "wow": a narrow studio light travels along the frame, then disappears. */
export function playStudioSweep(duration = 1600): () => void {
  const release = holdEnvironment();
  scene.sweep = 0;
  const animation = animate(scene, {
    sweep: [0, 1],
    duration,
    ease: "inOutSine",
    onComplete: () => {
      scene.sweep = -1;
      release();
    },
  });
  return () => {
    animation.cancel();
    scene.sweep = -1;
    release();
  };
}

/** Scroll start: headline recedes, PRO grows, the phone moves to centre, the stage darkens. */
export function bindHeroHandoff(root: HTMLElement): () => void {
  const { gsap } = getGsap();
  const hero = root.querySelector(".landing-hero");
  if (!hero) return () => {};
  const ctx = gsap.context(() => {
    gsap
      .timeline({ scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 0.6 } })
      .to(".hero-copy", { scale: 0.92, yPercent: -8, opacity: 0.12, filter: "blur(3px)", ease: "none" }, 0)
      .to(".hero-word", { scale: 1.55, opacity: 1, ease: "none" }, 0)
      .to(".hero-scroll-cue", { opacity: 0, duration: 0.3, ease: "none" }, 0)
      .to(scene, { handoff: 1, ease: "none" }, 0);
  }, root);
  return () => ctx.revert();
}

/** Runs `fn` once the 3D phone is ready (data-phone="ready" on the landing root). */
export function whenPhoneReady(root: HTMLElement, fn: () => () => void): () => void {
  let cleanup: (() => void) | null = null;
  const run = () => {
    if (cleanup === null && root.dataset.phone === "ready") cleanup = fn();
  };
  const observer = new MutationObserver(run);
  observer.observe(root, { attributes: true, attributeFilter: ["data-phone"] });
  run();
  return () => {
    observer.disconnect();
    cleanup?.();
  };
}
```

- [ ] **Step 2: Rewrite `src/components/landing/landing-experience.tsx`**

```tsx
"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { parseFinishes, type Finish } from "./data";
import { readCapture } from "./config";
import { useTier } from "./motion/use-tier";
import { acquireStringTune } from "./motion/string-tune";
import { bindHeroHandoff, playHeroEntrance, playStudioSweep, whenPhoneReady } from "./motion/hero-motion";
import {
  getSceneFinish, isBootDone, scene, setSceneFinish, setSceneSlot, setSceneVisible, subscribeBoot,
} from "./scene-store";
import PhoneLayer from "./three/phone-layer";
import { PrecisionCursor } from "./cursor/precision-cursor";
import "./landing.css";

type Stage = "hero" | "film" | "light";
const noopSubscribe = () => () => {};

function trackPointer(root: HTMLElement): () => void {
  const smooth = { x: 0, y: 0 };
  let frame = 0;
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    scene.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    scene.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  // Depth planes read these; each plane multiplies by its own amplitude in CSS.
  const tick = () => {
    smooth.x += (scene.pointer.x - smooth.x) * 0.08;
    smooth.y += (scene.pointer.y - smooth.y) * 0.08;
    root.style.setProperty("--px", smooth.x.toFixed(4));
    root.style.setProperty("--py", smooth.y.toFixed(4));
    frame = requestAnimationFrame(tick);
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  frame = requestAnimationFrame(tick);
  return () => {
    window.removeEventListener("pointermove", onMove);
    cancelAnimationFrame(frame);
    scene.pointer.x = 0;
    scene.pointer.y = 0;
  };
}

export function LandingExperience({
  initialFinish,
  children,
}: {
  initialFinish: Finish | null;
  children: React.ReactNode;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const tier = useTier();
  const captureId = useSyncExternalStore(noopSubscribe, () => readCapture(window.location.search), () => null);
  const captureFinish = captureId ? (parseFinishes(captureId.replace(/-/g, " "))[0] ?? null) : null;

  // The device starts in the hero product's first finish.
  useEffect(() => {
    if (initialFinish && !getSceneFinish()) setSceneFinish(initialFinish);
  }, [initialFinish]);

  // Stage = the section under the viewport's centre line.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const stage = (entry.target as HTMLElement).dataset.stageSection as Stage;
          root.dataset.stage = stage;
          setSceneVisible(stage !== "light");
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    root.querySelectorAll<HTMLElement>("[data-stage-section]").forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      setSceneVisible(true);
    };
  }, []);

  // The live phone sits exactly where the poster still sits.
  useEffect(() => {
    const slot = rootRef.current?.querySelector<HTMLElement>(".hero-device-slot");
    if (!slot) return;
    const measureSlot = () => {
      const r = slot.getBoundingClientRect();
      setSceneSlot({
        cx: (r.left + r.width / 2) / window.innerWidth,
        cy: (r.top + window.scrollY + r.height / 2) / window.innerHeight,
        h: r.height / window.innerHeight,
      });
    };
    measureSlot();
    let timer = 0;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(measureSlot, 120);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(timer);
    };
  }, []);

  // Smooth scroll on desktop with a fine pointer; native everywhere else.
  useEffect(() => {
    if (tier === null || captureId) return;
    const smooth = tier !== "low" && window.matchMedia("(pointer: fine)").matches;
    let release: (() => void) | null = null;
    let cancelled = false;
    acquireStringTune(smooth).then((r) => {
      if (cancelled) r();
      else release = r;
    });
    return () => {
      cancelled = true;
      release?.();
    };
  }, [tier, captureId]);

  // Pointer: phone reaction + depth planes (desktop, high tier).
  useEffect(() => {
    const root = rootRef.current;
    if (tier !== "high" || !root || captureId) return;
    return trackPointer(root);
  }, [tier, captureId]);

  // Hero motion: entrance after the boot, first studio sweep once the phone is live, scroll hand-off.
  useEffect(() => {
    const root = rootRef.current;
    if (tier === null || !root || captureId) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: Array<() => void> = [];
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      if (reduced) {
        document.documentElement.dataset.entrance = "done";
        return;
      }
      cleanups.push(playHeroEntrance(root));
      if (tier !== "low") cleanups.push(whenPhoneReady(root, () => playStudioSweep()));
    };
    const unsubscribe = subscribeBoot(start);
    if (isBootDone()) start();
    if (!reduced) cleanups.push(bindHeroHandoff(root));
    return () => {
      unsubscribe();
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [tier, captureId]);

  return (
    <main
      ref={rootRef}
      className="landing"
      data-stage="hero"
      data-phone="poster"
      data-tier={tier ?? undefined}
      data-capture={captureId ? "" : undefined}
    >
      {children}
      {tier !== null && (tier !== "low" || captureId) && (
        <PhoneLayer
          tier={tier === "low" ? "high" : tier}
          initialFinish={initialFinish}
          captureFinish={captureFinish}
          onReady={() => rootRef.current?.setAttribute("data-phone", "ready")}
          onError={() => rootRef.current?.setAttribute("data-phone", "failed")}
        />
      )}
      {tier !== null && !captureId && <PrecisionCursor />}
    </main>
  );
}
```

- [ ] **Step 3: `landing.css` additions**

```css
/* ---------- Hero entrance (pre-paint state set by the boot gate; 3 s safety reveal without JS) ---------- */
html[data-entrance="pending"] .hero-copy > * { opacity: 0; animation: landing-reveal-fallback 0s linear 3s forwards; }
@keyframes landing-reveal-fallback { to { opacity: 1; } }

/* ---------- Depth planes (pointer, desktop high tier) ----------
   GSAP folds CSS `translate` into its own transforms on elements it tweens (.hero-word, .hero-copy),
   so depth offsets live on children GSAP never touches. */
.hero-word { opacity: .56; color: rgba(255, 255, 255, .05); }
.hero-word-inner { display: block; translate: calc(var(--px, 0) * -6px) calc(var(--py, 0) * -4px); }
.hero-copy { transform-origin: left center; }
.hero-copy > * { translate: calc(var(--px, 0) * 2px) calc(var(--py, 0) * 2px); }
.hero-device-slot { touch-action: pan-y; }

/* ---------- Magnetic CTA (StringTune writes --magnetic-x/y in px) ---------- */
.landing-cta[data-string="magnetic"] { translate: calc(var(--magnetic-x, 0) * 1px) calc(var(--magnetic-y, 0) * 1px); }
.landing-cta[data-string="magnetic"] .cta-arrow { display: inline-flex; translate: calc(var(--magnetic-x, 0) * .6px) calc(var(--magnetic-y, 0) * .6px); }
```

In the existing `.hero-word` rule, remove the `color` line (it moves to the rule above). In `hero-stage.tsx`, wrap the word: `<p className="hero-word" aria-hidden="true"><span className="hero-word-inner">{hero?.word ?? "iPhone"}</span></p>`.

- [ ] **Step 4: Verify** — `npx tsc --noEmit && npx eslint src/components && npx next build`.
- [ ] **Step 5: Commit** — `feat(landing): headline entrance, studio sweep, pointer depth, scroll hand-off`

---

### Task 6: Precision cursor

**Files:**
- Create: `cursor/bind-cursor.ts`, `cursor/precision-cursor.tsx`
- Modify: `landing.css`, `product-card.tsx`, `store/category-rail.tsx`, `store/visit-imart.tsx`

- [ ] **Step 1: `src/components/landing/cursor/bind-cursor.ts`**

```ts
import { createAnimatable, utils } from "animejs";

const LABELS: Record<string, string> = { view: "View", select: "Select", chat: "Chat ↗", map: "Map ↗" };

/** A 24 px precision ring that trails the (always visible) native pointer. */
export function bindCursor(ring: HTMLElement): () => void {
  const label = ring.querySelector<HTMLElement>(".cursor-label");
  const follow = createAnimatable(ring, { x: 160, y: 160, ease: "out(3)" });
  let shown = false;

  const move = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    if (!shown) {
      utils.set(ring, { x: e.clientX, y: e.clientY });
      ring.dataset.visible = "";
      shown = true;
    }
    follow.x(e.clientX);
    follow.y(e.clientY);
  };
  const over = (e: PointerEvent) => {
    const target = (e.target as Element | null)?.closest<HTMLElement>("[data-cursor], a, button");
    const kind = target?.dataset.cursor;
    ring.dataset.state = kind ? "label" : target ? "link" : "idle";
    if (label) label.textContent = kind ? (LABELS[kind] ?? "") : "";
  };
  const leave = () => {
    delete ring.dataset.visible;
    shown = false;
  };

  window.addEventListener("pointermove", move, { passive: true });
  document.addEventListener("pointerover", over, { passive: true });
  document.documentElement.addEventListener("pointerleave", leave);
  return () => {
    window.removeEventListener("pointermove", move);
    document.removeEventListener("pointerover", over);
    document.documentElement.removeEventListener("pointerleave", leave);
    follow.revert();
  };
}
```

- [ ] **Step 2: `src/components/landing/cursor/precision-cursor.tsx`**

```tsx
"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { bindCursor } from "./bind-cursor";

const QUERY = "(pointer: fine)";
function subscribe(onChange: () => void) {
  const query = window.matchMedia(QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Desktop only; never rendered for touch. */
export function PrecisionCursor() {
  const fine = useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!fine || !ref.current) return;
    return bindCursor(ref.current);
  }, [fine]);
  if (!fine) return null;
  return (
    <div ref={ref} className="cursor-ring" aria-hidden="true">
      <span className="cursor-label" />
    </div>
  );
}
```

- [ ] **Step 3: `landing.css`**

```css
/* ---------- Precision cursor ---------- */
.cursor-ring {
  position: fixed;
  left: 0;
  top: 0;
  z-index: 85;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  margin: -12px 0 0 -12px;
  border: 1px solid rgba(238, 243, 239, .6);
  border-radius: 999px;
  pointer-events: none;
  opacity: 0;
  transition: width .18s var(--ease-ui), height .18s var(--ease-ui), margin .18s var(--ease-ui), opacity .2s, background-color .18s, border-color .3s;
}
.cursor-ring[data-visible] { opacity: 1; }
.cursor-ring[data-state="link"] { width: 34px; height: 34px; margin: -17px 0 0 -17px; }
.cursor-ring[data-state="label"] { width: 64px; height: 64px; margin: -32px 0 0 -32px; background: #eef3ef; border-color: #eef3ef; }
.cursor-label { font-size: 9px; font-weight: 600; letter-spacing: .14em; text-transform: uppercase; white-space: nowrap; color: #050706; opacity: 0; transition: opacity .15s; }
.cursor-ring[data-state="label"] .cursor-label { opacity: 1; }
.landing[data-stage="light"] .cursor-ring { border-color: rgba(17, 22, 19, .45); }
.landing[data-stage="light"] .cursor-ring[data-state="label"] { background: #111613; border-color: #111613; }
.landing[data-stage="light"] .cursor-label { color: #fff; }
```

- [ ] **Step 4: Labels.**
  - `data-cursor="view"` on the `.shop-product` link in `product-card.tsx` and on `.rail-tile` in `category-rail.tsx`.
  - On the Visit section's "Find our store" link: `data-cursor="map"` plus `data-string="magnetic" data-string-strength="0.12" data-string-radius="150"`.
  - `data-cursor="chat"` on its WhatsApp link.
- [ ] **Step 5: Verify** with tsc, eslint and build. **Commit:** `feat(landing): precision cursor with contextual labels`

---

### Task 7: Browser checks + review

**Files:** modify `e2e/landing.e2e.mjs`.

- [ ] **Step 1: Add checks** (desktop context unless noted).
  - **SSR header:** fetch `/` HTML, which contains `data-landing` on the header and no `store-topbar`.
  - **Boot:** on first load `html[data-boot]` is `play` and `.boot` is visible. It reaches `done` within 2000 ms and `sessionStorage["imart-boot"]==="1"`. After a reload it's `skip`.
  - **Skip:** in a fresh context, clicking at 150 ms makes `data-boot` `done` within 400 ms.
  - **Reduced motion:** `data-boot="skip"` and no `data-entrance="pending"`.
  - **Entrance:** `data-entrance` reaches `done` within 3500 ms and the h1 has opacity 1.
  - **Poster:** `.hero-poster` `src` contains `/renders/hero-`.
  - **Magnetic:** moving the mouse 40 px right of the primary CTA's centre makes `--magnetic-x` > 0 within 600 ms.
  - **Cursor:** `.cursor-ring` exists. Hovering `.rail-tile` sets its label to `View`. On mobile there is no `.cursor-ring`.
  - **Hand-off:** scrolling 50 % of the hero makes `.hero-copy` computed opacity < 0.9.
  - **Screenshots:** boot at about 500 ms, hero after the entrance, about 250 ms into a finish change, and the hand-off at 50 %.
- [ ] **Step 2:** Build, start, run `npm run e2e`. Expected: 0 failed and no console errors. Review the screenshots.
- [ ] **Step 3:** Fix, re-run, commit — `test(landing): boot, entrance, finish, magnetic, cursor, hand-off checks`.
