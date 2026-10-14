"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { parseFinishes, type Finish } from "./data";
import { readCapture } from "./config";
import { dropToLowTier, useTier } from "./motion/use-tier";
import { startStringTune } from "./motion/string-tune";
import { bindHeroHandoff, playHeroEntrance, playStudioSweep, whenPhoneReady } from "./motion/hero-motion";
import { bindFilm } from "./motion/film";
import { bindStoreMotion } from "./motion/store-motion";
import {
  getSceneFinish, isBootDone, scene, setFilmTile, setSceneFinish, setSceneSlot, setSceneVisible, subscribeBoot,
} from "./scene-store";
import PhoneLayer from "./three/phone-layer";
import { PrecisionCursor } from "./cursor/precision-cursor";
import "./landing.css";
import "./hero/hero-welcome.css";

type Stage = "hero" | "film" | "light";
const noopSubscribe = () => () => {};
const readReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const subscribeReducedMotion = (notify: () => void) => {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};

function trackPointer(root: HTMLElement): () => void {
  const planes = [
    ...Array.from(root.querySelectorAll<HTMLElement>(".hero-word-inner"), (el) => ({ el, ax: -6, ay: -4 })),
    ...Array.from(root.querySelectorAll<HTMLElement>(".hero-copy > *"), (el) => ({ el, ax: 2, ay: 2 })),
  ];
  const smooth = { x: 0, y: 0 };
  let frame = 0;
  const tick = () => {
    smooth.x += (scene.pointer.x - smooth.x) * 0.08;
    smooth.y += (scene.pointer.y - smooth.y) * 0.08;
    for (const { el, ax, ay } of planes) {
      el.style.translate = `${(smooth.x * ax).toFixed(2)}px ${(smooth.y * ay).toFixed(2)}px`;
    }
    const settled = Math.abs(scene.pointer.x - smooth.x) < 0.001 && Math.abs(scene.pointer.y - smooth.y) < 0.001;
    frame = settled ? 0 : requestAnimationFrame(tick);
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    scene.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    scene.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    if (!frame) frame = requestAnimationFrame(tick);
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  return () => {
    window.removeEventListener("pointermove", onMove);
    cancelAnimationFrame(frame);
    for (const { el } of planes) el.style.removeProperty("translate");
    scene.pointer.x = 0;
    scene.pointer.y = 0;
  };
}

function measureTile(root: HTMLElement) {
  const tile = root.querySelector<HTMLElement>(".rail-tile");
  if (!tile) return;
  const r = tile.getBoundingClientRect();
  setFilmTile(r.left, r.width);
}

function measureSlot(slot: HTMLElement) {
  const r = slot.getBoundingClientRect();
  setSceneSlot({
    cx: (r.left + r.width / 2) / window.innerWidth,
    cy: (r.top + window.scrollY + r.height / 2) / window.innerHeight,
    h: r.height / window.innerHeight,
  });
}

export function LandingExperience({
  initialFinish,
  children,
}: {
  initialFinish: Finish | null;
  children: React.ReactNode;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const tier = useTier();
  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, readReducedMotion, () => false);
  const entrancePlayed = useRef(false);
  const captureId = useSyncExternalStore(noopSubscribe, () => readCapture(window.location.search), () => null);
  const captureFinish = captureId ? (parseFinishes(captureId.replace(/-/g, " "))[0] ?? null) : null;
  const ready = tier !== null;
  const live3d = tier !== null && tier !== "low";
  const depth = tier === "high";

  useEffect(() => {
    if (initialFinish && !getSceneFinish()) setSceneFinish(initialFinish);
  }, [initialFinish]);

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

  useEffect(() => {
    const slot = rootRef.current?.querySelector<HTMLElement>(".hero-device-slot");
    if (!slot) return;
    const root = rootRef.current;
    const measure = () => {
      measureSlot(slot);
      if (root) measureTile(root);
    };
    measure();
    const resize = new ResizeObserver(measure);
    resize.observe(slot);
    if (root) resize.observe(root.querySelector(".hero-grid") ?? root);
    let active = true;
    document.fonts.ready.then(() => { if (active) measure(); });
    let timer = 0;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(measure, 120);
    };
    window.addEventListener("resize", onResize);
    return () => {
      active = false;
      resize.disconnect();
      window.removeEventListener("resize", onResize);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!ready || captureId) return;
    startStringTune();
  }, [ready, captureId]);

  useEffect(() => {
    const root = rootRef.current;
    if (!depth || !root || captureId) return;
    return trackPointer(root);
  }, [depth, captureId]);

  useEffect(() => {
    const root = rootRef.current;
    if (!ready || !root || captureId) return;
    if (reducedMotion) {
      document.documentElement.dataset.entrance = "done";
      return;
    }
    const cleanups: Array<() => void> = [];
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      if (!entrancePlayed.current) {
        entrancePlayed.current = true;
        cleanups.push(playHeroEntrance(root));
      }
      cleanups.push(whenPhoneReady(root, () => playStudioSweep()));
    };
    const unsubscribe = subscribeBoot(start);
    if (isBootDone()) start();
    cleanups.push(bindHeroHandoff(root));
    cleanups.push(bindStoreMotion(root));
    return () => {
      unsubscribe();
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [ready, captureId, reducedMotion]);

  useEffect(() => {
    const root = rootRef.current;
    if (!live3d || !root || captureId || reducedMotion) return;
    return bindFilm(root);
  }, [live3d, captureId, reducedMotion]);

  return (
    <main
      ref={rootRef}
      className="landing"
      data-stage="hero"
      data-phone="poster"
      data-tier={tier ?? undefined}
      data-capture={captureId ? "" : undefined}
    >
      {children}
      <div className="landing-flood" aria-hidden="true" />
      {tier !== null && (tier !== "low" || captureId) && (
        <PhoneLayer
          tier={tier === "low" ? "high" : tier}
          initialFinish={initialFinish}
          captureFinish={captureFinish}
          onReady={() => rootRef.current?.setAttribute("data-phone", "ready")}
          onError={() => {
            rootRef.current?.setAttribute("data-phone", "failed");
            dropToLowTier();
          }}
        />
      )}
      {tier !== null && !captureId && <PrecisionCursor />}
    </main>
  );
}
