import { getGsap } from "./gsap";

/** Base drift: half the track (one copy of the text) every 36 s. */
const BASE = 50 / 36;
const MAX_BOOST = 7;
const MAX_SKEW = 4;

/**
 * Moment 06: the Amarpath marquee follows scroll velocity. It cruises in the last scroll
 * direction, surges with a fast scroll, then eases back down, leaning slightly while it surges.
 */
function bindMarquee(root: HTMLElement): () => void {
  const { gsap, ScrollTrigger } = getGsap();
  const section = root.querySelector<HTMLElement>(".visit");
  const track = root.querySelector<HTMLElement>(".visit-marquee-track");
  if (!section || !track) return () => {};
  root.dataset.marquee = "";

  const wrap = gsap.utils.wrap(-50, 0);
  const clamp = gsap.utils.clamp(-MAX_SKEW, MAX_SKEW);
  const setX = gsap.quickSetter(track, "xPercent");
  const setSkew = gsap.quickSetter(track, "skewX", "deg");
  const motion = { speed: 1 };
  let dir = 1;
  let x = 0;
  let active = false;

  const tick = (_time: number, deltaMs: number) => {
    if (!active) return;
    x = wrap(x - BASE * motion.speed * Math.min(deltaMs, 64) / 1000);
    setX(x);
    setSkew(clamp((motion.speed - dir) * 0.8));
  };
  gsap.ticker.add(tick);

  const trigger = ScrollTrigger.create({
    trigger: section,
    start: "top bottom",
    end: "bottom top",
    onToggle: (self) => {
      active = self.isActive;
    },
    onUpdate: (self) => {
      dir = self.direction;
      const boost = Math.min(Math.abs(self.getVelocity()) / 250, MAX_BOOST);
      gsap.to(motion, {
        speed: dir * (1 + boost),
        duration: 0.3,
        ease: "power2.out",
        overwrite: true,
        onComplete: () => {
          gsap.to(motion, { speed: dir, duration: 1.4, ease: "power2.out" });
        },
      });
    },
  });
  active = trigger.isActive;

  return () => {
    trigger.kill();
    gsap.ticker.remove(tick);
    gsap.killTweensOf(motion);
    gsap.set(track, { clearProps: "transform" });
    delete root.dataset.marquee;
  };
}

/** On desktop the dashed route to the pin leans a few units toward the pointer, then settles. */
function bindRoutePointer(root: HTMLElement): () => void {
  const section = root.querySelector<HTMLElement>(".visit");
  const route = root.querySelector<SVGPathElement>(".visit-pin path:first-of-type");
  if (!section || !route || !window.matchMedia("(pointer: fine)").matches) return () => {};
  const target = { x: 0, y: 0 };
  const now = { x: 0, y: 0 };
  let frame = 0;

  const draw = () => {
    now.x += (target.x - now.x) * 0.12;
    now.y += (target.y - now.y) * 0.12;
    const mx = (60 + now.x).toFixed(2);
    const my = (70 + now.y).toFixed(2);
    route.setAttribute("d", `M20 96 C 40 96, ${(44 + now.x).toFixed(2)} ${my}, ${mx} ${my} S 80 52, 84 40`);
    const settled = Math.abs(target.x - now.x) < 0.01 && Math.abs(target.y - now.y) < 0.01;
    frame = settled ? 0 : requestAnimationFrame(draw);
  };
  const wake = () => {
    if (!frame) frame = requestAnimationFrame(draw);
  };
  const move = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const r = route.ownerSVGElement?.getBoundingClientRect();
    if (!r) return;
    // Direction from the route's midpoint to the pointer, capped at 6 units.
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const len = Math.hypot(dx, dy) || 1;
    const reach = Math.min(len / 120, 1) * 6;
    target.x = (dx / len) * reach;
    target.y = (dy / len) * reach;
    wake();
  };
  const leave = () => {
    target.x = 0;
    target.y = 0;
    wake();
  };
  section.addEventListener("pointermove", move);
  section.addEventListener("pointerleave", leave);
  return () => {
    section.removeEventListener("pointermove", move);
    section.removeEventListener("pointerleave", leave);
    cancelAnimationFrame(frame);
  };
}

export function bindVisit(root: HTMLElement): () => void {
  const cleanups = [bindMarquee(root), bindRoutePointer(root)];
  return () => cleanups.forEach((cleanup) => cleanup());
}
