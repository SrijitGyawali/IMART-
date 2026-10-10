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

export interface FilmLabel {
  x: number;
  y: number;
  visible: boolean;
}

/** Film progress 0..1 and the projected anchors of the five layer labels (CSS px). */
export const film = {
  progress: 0,
  labels: Array.from({ length: 5 }, (): FilmLabel => ({ x: 0, y: 0, visible: false })),
  /** The phone screen's projected rectangle in CSS px: left, top, right, bottom. */
  screen: { l: 0, t: 0, r: 0, b: 0 },
  /** The first store tile's horizontal position in viewport px (scroll-independent). */
  tile: { x: 0, w: 0 },
};

export function setFilmScreen(l: number, t: number, r: number, b: number) {
  Object.assign(film.screen, { l, t, r, b });
}

export function setFilmTile(x: number, w: number) {
  film.tile.x = x;
  film.tile.w = w;
}

export function setFilmProgress(p: number) {
  film.progress = p;
}

export function setFilmLabel(i: number, x: number, y: number, visible: boolean) {
  const label = film.labels[i];
  label.x = x;
  label.y = y;
  label.visible = visible;
}
