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
