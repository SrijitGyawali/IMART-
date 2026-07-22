"use client";

import { useEffect, useRef, useState } from "react";

interface Stat {
  value: number;
  suffix: string;
  label: string;
  decimals?: number;
}

const STATS: Stat[] = [
  { value: 7, suffix: "+", label: "Years in Butwal" },
  { value: 5000, suffix: "+", label: "Happy customers" },
  { value: 4.9, suffix: "★", label: "Average rating", decimals: 1 },
  { value: 1500, suffix: "+", label: "Repairs completed" },
];

const DURATION_MS = 1400;

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function StatsCounter() {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setProgress(1);
      return;
    }

    let raf = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / DURATION_MS, 1);
          setProgress(easeOut(t));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="grid grid-cols-2 gap-6 rounded-3xl border border-border px-6 py-10 sm:grid-cols-4"
    >
      {STATS.map((stat) => {
        const current = stat.value * progress;
        const display =
          stat.decimals != null
            ? current.toFixed(stat.decimals)
            : Math.round(current).toLocaleString("en-IN");
        return (
          <div key={stat.label} className="text-center">
            <p
              className="text-3xl font-semibold tracking-tight sm:text-4xl"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {display}
              <span className="iridescent-text">{stat.suffix}</span>
            </p>
            <p className="mt-1 text-xs text-muted sm:text-sm">{stat.label}</p>
          </div>
        );
      })}
    </div>
  );
}
