/**
 * Runs `tick` on every animation frame, but only while `target` is on screen. When it leaves,
 * the loop stops after one last tick, so whatever it draws is left in its final state.
 */
export function loopWhileInView(target: Element, tick: () => void): () => void {
  let frame = 0;
  const loop = () => {
    tick();
    frame = requestAnimationFrame(loop);
  };
  const observer = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !frame) frame = requestAnimationFrame(loop);
    if (!entry.isIntersecting && frame) {
      cancelAnimationFrame(frame);
      frame = 0;
      tick();
    }
  });
  observer.observe(target);
  return () => {
    observer.disconnect();
    cancelAnimationFrame(frame);
  };
}
