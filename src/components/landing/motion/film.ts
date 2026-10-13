import { actOpacity, activeAct, filmBeats } from "../film/film-timeline";
import { film, holdEnvironment, scene, setFilmProgress } from "../scene-store";
import { getGsap } from "./gsap";

/** Sets CSS custom properties on one element, skipping writes that would not change anything. */
function cssWriter(el: HTMLElement) {
  const last = new Map<string, string>();
  return (name: string, value: string) => {
    if (last.get(name) === value) return;
    last.set(name, value);
    el.style.setProperty(name, value);
  };
}

/** One scrubbed tween drives the whole film; the DOM and the 3D both read film.progress. */
export function bindFilm(root: HTMLElement): () => void {
  const { gsap, ScrollTrigger } = getGsap();
  const section = root.querySelector<HTMLElement>(".landing-film");
  if (!section) return () => {};
  root.dataset.film = "pinned";
  let release: (() => void) | null = null;
  // Act opacities live on the film section; the flood's values on the flood layer itself, so a
  // scroll update restyles only what reads them rather than the whole page under the root.
  const flood = root.querySelector<HTMLElement>(".landing-flood") ?? root;
  const setActVar = cssWriter(section);
  const setFloodVar = cssWriter(flood);

  const apply = (p: number) => {
    setFilmProgress(p);
    const o = actOpacity(p);
    setActVar("--a1", o.a1.toFixed(3));
    setActVar("--a2", o.a2.toFixed(3));
    setActVar("--a2b", o.a2body.toFixed(3));
    setActVar("--a3", o.a3.toFixed(3));
    setActVar("--a4", o.a4.toFixed(3));
    setActVar("--labels", o.labels.toFixed(3));
    const act = String(activeAct(p));
    if (section.dataset.act !== act) section.dataset.act = act;
    const beats = filmBeats(p);
    // White light floods out from behind the phone's screen (moment 05).
    setFloodVar("--flood", beats.flood.toFixed(3));
    if (beats.flood > 0) {
      setFloodVar("--fx", `${((film.screen.l + film.screen.r) / 2).toFixed(0)}px`);
      setFloodVar("--fy", `${((film.screen.t + film.screen.b) / 2).toFixed(0)}px`);
    }
    // Once the page is mostly white the header and cursor switch to their light-store look.
    root.toggleAttribute("data-flooded", beats.flood > 0.45);
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
    for (const name of ["--flood", "--fx", "--fy"]) flood.style.removeProperty(name);
    root.removeAttribute("data-flooded");
    setFilmProgress(0);
    // Unpinning changes the page height (e.g. the 3D failed and the film falls back to stacked acts).
    if (section.isConnected) ScrollTrigger.refresh();
  };
}
