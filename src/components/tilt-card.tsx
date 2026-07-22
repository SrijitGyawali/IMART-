"use client";

import { useRef } from "react";

const MAX_TILT = 6;

/** Perspective tilt-on-hover wrapper for product cards. Mouse only. */
export function TiltCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || e.pointerType !== "mouse") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(800px) rotateY(${px * MAX_TILT}deg) rotateX(${-py * MAX_TILT}deg)`;
  }

  function handleLeave() {
    const el = ref.current;
    if (el) el.style.transform = "";
  }

  return (
    <div
      ref={ref}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      className="transition-transform duration-300 ease-out will-change-transform"
    >
      {children}
    </div>
  );
}
