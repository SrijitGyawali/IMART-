"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type { Finish } from "./data";
import { useTier } from "./motion/use-tier";
import { acquireStringTune } from "./motion/string-tune";
import { scene, setSceneVisible } from "./scene-store";
import PhoneLayer from "./three/phone-layer";
import "./landing.css";

type Stage = "hero" | "film" | "light";

export function LandingExperience({
  initialFinish,
  children,
}: {
  initialFinish: Finish | null;
  children: React.ReactNode;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const tier = useTier();

  // Header styles key off [data-active]; drop it whenever this page is hidden or unmounted.
  useLayoutEffect(() => {
    const root = rootRef.current;
    root?.setAttribute("data-active", "");
    return () => root?.removeAttribute("data-active");
  }, []);

  // Stage = the section under the viewport's centre line.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const stage = (entry.target as HTMLElement).dataset.stageSection as Stage;
          root.dataset.stage = stage;
          setSceneVisible(stage !== "light");
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    root.querySelectorAll<HTMLElement>("[data-stage-section]").forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      setSceneVisible(true);
    };
  }, []);

  // Smooth scroll on desktop with a fine pointer; native everywhere else.
  useEffect(() => {
    if (tier === null) return;
    const smooth = tier !== "low" && window.matchMedia("(pointer: fine)").matches;
    let release: (() => void) | null = null;
    let cancelled = false;
    acquireStringTune(smooth).then((r) => {
      if (cancelled) r();
      else release = r;
    });
    return () => {
      cancelled = true;
      release?.();
    };
  }, [tier]);

  // Pointer drives the phone's subtle reaction (desktop, high tier only).
  useEffect(() => {
    if (tier !== "high") return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      scene.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      scene.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      scene.pointer.x = 0;
      scene.pointer.y = 0;
    };
  }, [tier]);

  return (
    <main
      ref={rootRef}
      className="landing"
      data-stage="hero"
      data-active=""
      data-phone="poster"
      data-tier={tier ?? undefined}
    >
      {children}
      {tier !== null && tier !== "low" && (
        <PhoneLayer
          tier={tier}
          initialFinish={initialFinish}
          onReady={() => rootRef.current?.setAttribute("data-phone", "ready")}
          onError={() => rootRef.current?.setAttribute("data-phone", "failed")}
        />
      )}
    </main>
  );
}
