import type { Finish } from "./data";

export interface SceneState {
  /** Pointer position, -1..1 on both axes (desktop only). */
  pointer: { x: number; y: number };
  /** Whether the 3D layer should be rendering. */
  visible: boolean;
  /** The finish the visitor picked; null until they pick one. */
  finish: Finish | null;
}

// A plain mutable object: GSAP/Anime write it, the 3D scene reads it every frame.
// Nothing here triggers React renders except the visibility subscription.
export const scene: SceneState = { pointer: { x: 0, y: 0 }, visible: true, finish: null };

const listeners = new Set<() => void>();

export function setSceneVisible(visible: boolean) {
  if (scene.visible === visible) return;
  scene.visible = visible;
  listeners.forEach((listener) => listener());
}

export function subscribeScene(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSceneVisible() {
  return scene.visible;
}
