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
