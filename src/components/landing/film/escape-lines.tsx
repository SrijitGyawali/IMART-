"use client";

import { useEffect, useRef } from "react";
import { filmBeats } from "./film-timeline";
import { SCREEN_ASPECT, STREETS } from "./streets";
import { film } from "../scene-store";
import { loopWhileInView } from "./loop-in-view";

type Segment = [number, number, number, number];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function measureGuides(): Segment[] {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const edges: number[] = [];
  document.querySelectorAll<HTMLElement>(".rail-tile").forEach((tile) => {
    const r = tile.getBoundingClientRect();
    edges.push(r.left, r.right);
  });
  const guides: Segment[] = [];
  for (let i = 0; i < STREETS.length - 1; i++) {
    const x = edges.length ? edges[Math.min(i, edges.length - 1)] : (w * (i + 1)) / STREETS.length;
    guides.push([x, -h * 0.1, x, h * 1.1]);
  }
  guides.push([-w * 0.1, h * 0.82, w * 1.1, h * 0.82]);
  return guides;
}

function draw(svg: SVGSVGElement, lines: SVGLineElement[], guides: Segment[]) {
  const p = film.progress;
  const beats = filmBeats(p);
  const visible = beats.escape > 0 && p < 0.999;
  svg.style.visibility = visible ? "visible" : "hidden";
  if (!visible) return;
  const s = film.screen;
  const cx = (s.l + s.r) / 2;
  const cy = (s.t + s.b) / 2;
  const sw = s.r - s.l;
  const sh = s.b - s.t;
  const spread = 1 + beats.escape * 5;
  const toPx = (x: number, y: number): [number, number] => [cx + (x / SCREEN_ASPECT) * sw * spread, cy - y * sh * spread];
  lines.forEach((line, i) => {
    const [ax, ay, bx, by] = STREETS[i];
    const [x1, y1] = toPx(ax, ay);
    const [x2, y2] = toPx(bx, by);
    const g = guides[i];
    line.setAttribute("x1", lerp(x1, g[0], beats.guides).toFixed(1));
    line.setAttribute("y1", lerp(y1, g[1], beats.guides).toFixed(1));
    line.setAttribute("x2", lerp(x2, g[2], beats.guides).toFixed(1));
    line.setAttribute("y2", lerp(y2, g[3], beats.guides).toFixed(1));
  });
  svg.style.setProperty("--guide", beats.guides.toFixed(3));
}

export function EscapeLines() {
  const ref = useRef<SVGSVGElement>(null);
  useEffect(() => {
    const svg = ref.current;
    if (!svg) return;
    const lines = Array.from(svg.querySelectorAll<SVGLineElement>("line"));
    let guides = measureGuides();
    const onResize = () => {
      guides = measureGuides();
    };
    window.addEventListener("resize", onResize);
    const stop = loopWhileInView(svg.closest(".landing-film") ?? svg, () => draw(svg, lines, guides));
    return () => {
      window.removeEventListener("resize", onResize);
      stop();
    };
  }, []);
  return (
    <svg ref={ref} className="escape-lines" aria-hidden="true">
      {STREETS.map((_, i) => (
        <line key={i} />
      ))}
    </svg>
  );
}
