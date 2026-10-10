import { actOpacity, activeAct, filmBeats } from "../film/film-timeline";
import { holdEnvironment, scene, setFilmProgress } from "../scene-store";
import { getGsap } from "./gsap";

/** One scrubbed tween drives the whole film; the DOM and the 3D both read film.progress. */
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
    // The lens highlight in act 01 borrows the studio sweep strip.
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
