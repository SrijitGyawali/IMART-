"use client";

import { useEffect, useRef } from "react";
import { film } from "../scene-store";
import { loopWhileInView } from "./loop-in-view";

const NAMES = ["Back glass", "Battery", "Logic board", "Frame", "Display"];

function track(root: HTMLElement): () => void {
  const items = Array.from(root.querySelectorAll<HTMLElement>(".film-label"));
  const last = items.map(() => "");
  const tick = () => {
    items.forEach((el, i) => {
      const a = film.labels[i];
      const next = a.visible ? `translate3d(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px, 0)` : "hidden";
      if (next === last[i]) return;
      last[i] = next;
      el.style.visibility = a.visible ? "visible" : "hidden";
      if (a.visible) el.style.transform = next;
    });
  };
  // Only while the film is on screen; elsewhere the labels are not shown at all.
  return loopWhileInView(root.closest(".landing-film") ?? root, tick);
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
