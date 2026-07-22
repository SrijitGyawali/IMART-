"use client";

import { useRef } from "react";

/** Wraps a button/link and spawns a material-style ink ripple on click. */
export function Ripple({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);

  function handlePointerDown(e: React.PointerEvent<HTMLSpanElement>) {
    const host = ref.current;
    if (!host) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const rect = host.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ink = document.createElement("span");
    ink.className = "ripple-ink";
    ink.style.width = ink.style.height = `${size}px`;
    ink.style.left = `${e.clientX - rect.left - size / 2}px`;
    ink.style.top = `${e.clientY - rect.top - size / 2}px`;
    host.appendChild(ink);
    setTimeout(() => ink.remove(), 650);
  }

  return (
    <span
      ref={ref}
      onPointerDown={handlePointerDown}
      className="relative inline-block overflow-hidden rounded-full align-middle"
    >
      {children}
    </span>
  );
}
