"use client";

import { useEffect, useRef } from "react";
import { film } from "../scene-store";

const NAMES = ["Back glass", "Battery", "Logic board", "Frame", "Display"];

function track(root: HTMLElement): () => void {
  const items = Array.from(root.querySelectorAll<HTMLElement>(".film-label"));
  let frame = 0;
  const tick = () => {
    items.forEach((el, i) => {
      const a = film.labels[i];
      el.style.transform = `translate3d(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px, 0)`;
      el.style.visibility = a.visible ? "visible" : "hidden";
    });
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}

/** Editorial labels with leader lines, following each layer's projected edge. */
export function FilmLabels() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    return track(ref.current);
  }, []);
  return (
    <div ref={ref} className="film-labels" aria-hidden="true">
      {NAMES.map((name) => (
        <span key={name} className="film-label">
          <i />
          {name}
        </span>
      ))}
    </div>
  );
}
