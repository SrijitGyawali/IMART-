import { animate, createTimeline, stagger, svg, utils } from "animejs";

const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Drops the inline transform anime leaves behind, so CSS transforms (tilt, hover) apply again. */
const clearTransform = (els: Element[]) => els.forEach((el) => (el as HTMLElement).style.removeProperty("transform"));

/** Hides `targets` now (JS only, so no-JS and reduced motion keep everything visible) and plays `play` once on entry. */
function onEnter(trigger: Element | null, targets: Element[], play: () => void): () => void {
  if (!trigger || targets.length === 0) return () => {};
  utils.set(targets, { opacity: 0 });
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      observer.disconnect();
      play();
    },
    { threshold: 0.18 },
  );
  observer.observe(trigger);
  return () => {
    observer.disconnect();
    targets.forEach((el) => (el as HTMLElement).style.removeProperty("opacity"));
    clearTransform(targets);
  };
}

/** Product cards: the image first, then name, then price. */
function revealCards(cards: Element[]) {
  cards.forEach((card, i) => {
    const parts = [
      card.querySelector(".shop-product-image"),
      card.querySelector("h3"),
      card.querySelector(".product-card-bottom"),
    ].filter((el): el is Element => el !== null);
    utils.set(parts, { opacity: 0 });
    utils.set(card, { opacity: 1 });
    animate(parts, {
      opacity: [0, 1],
      y: [14, 0],
      duration: 560,
      delay: stagger(70, { start: i * 60 }),
      ease: "outQuart",
      onComplete: () => clearTransform(parts),
    });
  });
}

/** Tab switch: the current shelf steps back and blurs out… */
export function shelfOut(cards: Element[]): Promise<void> {
  if (reduced() || cards.length === 0) return Promise.resolve();
  return new Promise((resolve) => {
    animate(cards, {
      opacity: 0,
      scale: 0.97,
      filter: "blur(4px)",
      duration: 180,
      delay: stagger(25),
      ease: "inQuad",
      onComplete: () => resolve(),
    });
  });
}

/** …and the next one comes forward and resolves. */
export function shelfIn(cards: Element[]) {
  if (cards.length === 0) return;
  if (reduced()) {
    utils.set(cards, { opacity: 1 });
    return;
  }
  utils.set(cards, { opacity: 0 });
  animate(cards, {
    opacity: [0, 1],
    scale: [1.02, 1],
    filter: ["blur(4px)", "blur(0px)"],
    duration: 480,
    delay: stagger(55),
    ease: "outQuart",
    onComplete: () => {
      clearTransform(cards);
      cards.forEach((el) => (el as HTMLElement).style.removeProperty("filter"));
    },
  });
}

/** Rail tiles lean toward the cursor; a soft green light follows it (CSS reads --mx/--my/--rx/--ry). */
function tilt(track: HTMLElement): () => void {
  const move = (e: PointerEvent) => {
    const tile = (e.target as Element).closest<HTMLElement>(".rail-tile");
    if (!tile || e.pointerType !== "mouse") return;
    const r = tile.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    tile.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
    tile.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
    tile.style.setProperty("--rx", `${((x - 0.5) * 6).toFixed(2)}deg`);
    tile.style.setProperty("--ry", `${((0.5 - y) * 6).toFixed(2)}deg`);
  };
  const leave = (e: PointerEvent) => {
    const tile = (e.target as Element).closest<HTMLElement>(".rail-tile");
    if (!tile || tile.contains(e.relatedTarget as Node | null)) return;
    tile.style.setProperty("--rx", "0deg");
    tile.style.setProperty("--ry", "0deg");
  };
  track.addEventListener("pointermove", move);
  track.addEventListener("pointerout", leave);
  return () => {
    track.removeEventListener("pointermove", move);
    track.removeEventListener("pointerout", leave);
  };
}

/** FAQ answers open and close by height instead of snapping. */
function smoothFaq(list: HTMLElement): () => void {
  const click = (e: MouseEvent) => {
    const summary = (e.target as Element).closest("summary");
    const details = summary?.parentElement as HTMLDetailsElement | null;
    const answer = details?.querySelector<HTMLElement>(".faq-answer");
    if (!summary || !details || !answer || reduced()) return;
    e.preventDefault();
    const closing = details.dataset.faq === "closing";
    if (details.open && !closing) {
      details.dataset.faq = "closing";
      animate(answer, {
        height: [answer.offsetHeight, 0],
        opacity: 0,
        duration: 320,
        ease: "inOutQuad",
        onComplete: () => {
          // A click while closing re-opens instead; only finish if we are still closing.
          if (details.dataset.faq !== "closing") return;
          delete details.dataset.faq;
          details.open = false;
          answer.style.removeProperty("height");
          answer.style.removeProperty("opacity");
        },
      });
      return;
    }
    const from = details.open ? answer.offsetHeight : 0;
    delete details.dataset.faq;
    details.open = true;
    answer.style.removeProperty("height");
    const to = answer.offsetHeight;
    animate(answer, {
      height: [from, to],
      opacity: [from ? Number(getComputedStyle(answer).opacity) : 0, 1],
      duration: 420,
      ease: "outQuart",
      onComplete: () => answer.style.removeProperty("height"),
    });
  };
  list.addEventListener("click", click);
  return () => list.removeEventListener("click", click);
}

/** Service numbers roll through the digits like a counter and settle on their own value. */
function rollNumbers(numbers: HTMLElement[]) {
  numbers.forEach((el, i) => {
    const target = Number(el.dataset.n ?? el.textContent) || i + 1;
    el.dataset.n = String(target);
    const counter = { v: 0 };
    el.textContent = "00";
    animate(counter, {
      v: 10 + target,
      duration: 900,
      delay: i * 120,
      ease: "outExpo",
      onUpdate: () => {
        el.textContent = String(Math.round(counter.v) % 10).padStart(2, "0");
      },
      onComplete: () => {
        el.textContent = String(target).padStart(2, "0");
      },
    });
  });
}

/** Entrances (once), rail tilt + cursor light, smooth FAQ, rolling service numbers, drawn icons and pin. */
export function bindStoreMotion(root: HTMLElement): () => void {
  if (reduced()) return () => {};
  const cleanups: Array<() => void> = [];
  const q = <T extends Element>(sel: string) => Array.from(root.querySelectorAll<T>(sel));

  const tiles = q<HTMLElement>(".rail-tile");
  cleanups.push(
    onEnter(root.querySelector(".rail-track"), tiles, () =>
      animate(tiles, {
        opacity: [0, 1],
        y: [stagger([36, 64]), 0],
        duration: 700,
        delay: stagger(70),
        ease: "outQuart",
        onComplete: () => clearTransform(tiles),
      }),
    ),
  );
  const track = root.querySelector<HTMLElement>(".rail-track");
  if (track && window.matchMedia("(pointer: fine)").matches) cleanups.push(tilt(track));

  const cards = q<HTMLElement>(".showcase-grid .shop-product");
  cleanups.push(onEnter(root.querySelector(".showcase-grid"), cards, () => revealCards(cards)));

  const benefits = q<HTMLElement>(".benefit");
  cleanups.push(
    onEnter(root.querySelector(".benefits"), benefits, () => {
      // Start values first: a delayed tween does not apply its "from" until it begins.
      const plans = benefits.map((benefit) => {
        const lines = svg.createDrawable(benefit.querySelectorAll("svg path, svg circle, svg rect"));
        const text = benefit.querySelector("span");
        utils.set(lines, { draw: "0 0" });
        if (text) utils.set(text, { opacity: 0 });
        return { lines, text };
      });
      utils.set(benefits, { opacity: 1 });
      plans.forEach(({ lines, text }, i) => {
        const tl = createTimeline({ delay: i * 120 });
        tl.add(lines, { draw: ["0 0", "0 1"], duration: 760, ease: "inOutQuad" }, 0);
        if (text) tl.add(text, { opacity: [0, 1], x: [-8, 0], duration: 440, ease: "outQuart" }, 480);
      });
    }),
  );

  const list = root.querySelector(".service-list");
  const numbers = q<HTMLElement>(".service-num");
  cleanups.push(
    onEnter(list, numbers, () => {
      utils.set(numbers, { opacity: 1 });
      rollNumbers(numbers);
      list?.classList.add("is-in");
    }),
  );
  cleanups.push(() => {
    list?.classList.remove("is-in");
    numbers.forEach((el) => {
      if (el.dataset.n) el.textContent = el.dataset.n.padStart(2, "0");
    });
  });

  const faq = root.querySelector<HTMLElement>(".faq-list");
  if (faq) cleanups.push(smoothFaq(faq));

  // The visit pin: the start dot lands, the dashed route marches in, the pin outline draws, the dot pops.
  const pin = root.querySelector<SVGSVGElement>(".visit-pin");
  if (pin) {
    const [start, route, outline, dot] = [
      pin.querySelector("circle:not(.visit-pin-dot)"),
      pin.querySelector("path:first-of-type"),
      pin.querySelector("path:last-of-type"),
      pin.querySelector(".visit-pin-dot"),
    ];
    const parts = [start, route, outline, dot].filter((el): el is Element => el !== null);
    cleanups.push(
      onEnter(root.querySelector(".visit-body"), parts, () => {
        const tl = createTimeline({ defaults: { ease: "outQuart" } });
        if (start) tl.add(start, { opacity: [0, 1], scale: [0, 1], duration: 360 }, 0);
        if (route) tl.add(route, { opacity: [0, 1], strokeDashoffset: [70, 0], duration: 900, ease: "inOutQuad" }, 120);
        if (outline) {
          const drawn = svg.createDrawable(outline);
          utils.set(drawn, { draw: "0 0" });
          utils.set(outline, { opacity: 1 });
          tl.add(drawn, { draw: ["0 0", "0 1"], duration: 800, ease: "inOutQuad" }, 700);
        }
        if (dot) tl.add(dot, { opacity: [0, 1], scale: [0, 1], duration: 420, ease: "outBack(2)" }, 1350);
      }),
    );
  }

  return () => cleanups.forEach((c) => c());
}
