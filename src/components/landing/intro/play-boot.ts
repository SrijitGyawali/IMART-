import { createTimeline, stagger, utils } from "animejs";
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
    .add(letters, { y: ["60%", "0%"], opacity: [0, 1], rotateX: [40, 0], filter: ["blur(6px)", "blur(0px)"], duration: 320, delay: stagger(45), ease: "outQuart" }, 330)
    .add(dot, { scale: [2.2, 1], opacity: [0, 1], duration: 90, ease: "outExpo" }, 620)
    .add(dot, { boxShadow: ["0 0 28px 6px rgba(61,220,132,0.9)", "0 0 0px 0px rgba(61,220,132,0)"], duration: 140, ease: "outQuad" }, 640)
    .call(reveal, 700)
    .add(glow, { opacity: [0, 0.9], scale: [0.2, 1], duration: 220, ease: "outQuad" }, 700)
    .add(glow, { opacity: [0.9, 0], scale: [1, 1.8], duration: 300, ease: "inQuad" }, 920)
    .add(logo, { scale: [1, 1.18], duration: 500, ease: "inQuad" }, 700)
    // Letters part from the centre: -0.44w … +0.44w across the five of them.
    .add(letters, { x: stagger(window.innerWidth * 0.22, { start: -window.innerWidth * 0.44 }), opacity: 0, filter: "blur(8px)", duration: 480, ease: "inQuad" }, 720)
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
