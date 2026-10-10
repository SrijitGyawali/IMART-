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
      .to(".hero-copy", { scale: 0.92, yPercent: -8, opacity: 0, filter: "blur(3px)", ease: "none" }, 0)
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
