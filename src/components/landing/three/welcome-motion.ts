const smooth = (x: number, start: number, end: number) => {
  const t = Math.max(0, Math.min(1, (x - start) / (end - start)));
  return t * t * (3 - 2 * t);
};

/** Welcome lettering clears before the route folds into the film's light source. */
export function welcomeMotion(handoff: number) {
  return { opacity: 1 - smooth(handoff, 0.4, 0.85), collapse: smooth(handoff, 0.04, 0.65) };
}
