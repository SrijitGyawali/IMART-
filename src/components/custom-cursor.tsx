"use client";

import { useEffect, useRef } from "react";

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let x = -100;
    let y = -100;
    let ringX = -100;
    let ringY = -100;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      const target = e.target as Element | null;
      const interactive = target?.closest("a, button, [role='button'], input, select, textarea, summary");
      ring.classList.toggle("is-active", !!interactive);
    };

    const loop = () => {
      // Ring trails the dot for a soft feel
      ringX += (x - ringX) * 0.18;
      ringY += (y - ringY) * 0.18;
      dot.style.transform = `translate(${x - 3}px, ${y - 3}px)`;
      ring.style.transform = `translate(${ringX - ring.offsetWidth / 2}px, ${ringY - ring.offsetHeight / 2}px)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot hidden lg:block" aria-hidden />
      <div ref={ringRef} className="cursor-ring hidden lg:block" aria-hidden />
    </>
  );
}
