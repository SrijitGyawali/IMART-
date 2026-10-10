"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { parseFinishes, type Finish } from "./data";
import { readCapture } from "./config";
import { useTier } from "./motion/use-tier";
import { acquireStringTune } from "./motion/string-tune";
import { bindHeroHandoff, playHeroEntrance, playStudioSweep, whenPhoneReady } from "./motion/hero-motion";
import { bindFilm } from "./motion/film";
import { bindStoreMotion } from "./motion/store-motion";
import {
  getSceneFinish, isBootDone, scene, setFilmTile, setSceneFinish, setSceneSlot, setSceneVisible, subscribeBoot,
} from "./scene-store";
import PhoneLayer from "./three/phone-layer";
import { PrecisionCursor } from "./cursor/precision-cursor";
import "./landing.css";

type Stage = "hero" | "film" | "light";
const noopSubscribe = () => () => {};

function trackPointer(root: HTMLElement): () => void {
  const smooth = { x: 0, y: 0 };
  let frame = 0;
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    scene.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    scene.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  // Depth planes read these; each plane multiplies by its own amplitude in CSS.
  const tick = () => {
    smooth.x += (scene.pointer.x - smooth.x) * 0.08;
    smooth.y += (scene.pointer.y - smooth.y) * 0.08;
    root.style.setProperty("--px", smooth.x.toFixed(4));
    root.style.setProperty("--py", smooth.y.toFixed(4));
    frame = requestAnimationFrame(tick);
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  frame = requestAnimationFrame(tick);
  return () => {
    window.removeEventListener("pointermove", onMove);
    cancelAnimationFrame(frame);
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
  const captureId = useSyncExternalStore(noopSubscribe, () => readCapture(window.location.search), () => null);
  const captureFinish = captureId ? (parseFinishes(captureId.replace(/-/g, " "))[0] ?? null) : null;

  // The device starts in the hero product's first finish.
  useEffect(() => {
    if (initialFinish && !getSceneFinish()) setSceneFinish(initialFinish);
  }, [initialFinish]);

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

  // The live phone sits exactly where the poster still sits.
  useEffect(() => {
    const slot = rootRef.current?.querySelector<HTMLElement>(".hero-device-slot");
    if (!slot) return;
    const root = rootRef.current;
    const measure = () => {
      measureSlot(slot);
      if (root) measureTile(root);
    };
    measure();
    let timer = 0;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(measure, 120);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      window.clearTimeout(timer);
    };
  }, []);

  // Smooth scroll on desktop with a fine pointer; native everywhere else.
  useEffect(() => {
    if (tier === null || captureId) return;
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
  }, [tier, captureId]);

  // Pointer: phone reaction + depth planes (desktop, high tier).
  useEffect(() => {
    const root = rootRef.current;
    if (tier !== "high" || !root || captureId) return;
    return trackPointer(root);
  }, [tier, captureId]);

  // Hero motion: entrance after the boot, first studio sweep once the phone is live, scroll hand-off.
  useEffect(() => {
    const root = rootRef.current;
    if (tier === null || !root || captureId) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: Array<() => void> = [];
    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      if (reduced) {
        document.documentElement.dataset.entrance = "done";
        return;
      }
      cleanups.push(playHeroEntrance(root));
      if (tier !== "low") cleanups.push(whenPhoneReady(root, () => playStudioSweep()));
    };
    const unsubscribe = subscribeBoot(start);
    if (isBootDone()) start();
    if (!reduced) cleanups.push(bindHeroHandoff(root));
    // The pinned film needs the live phone; Low tier keeps the stacked, server-rendered acts.
    if (!reduced && tier !== "low") cleanups.push(bindFilm(root));
    // The light store comes alive on every tier; it is DOM-only and cheap.
    if (!reduced) cleanups.push(bindStoreMotion(root));
    return () => {
      unsubscribe();
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [tier, captureId]);

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
      {/* White light for the big transition: under the canvas, so the phone stays on top of it. */}
      <div className="landing-flood" aria-hidden="true" />
      {tier !== null && (tier !== "low" || captureId) && (
        <PhoneLayer
          tier={tier === "low" ? "high" : tier}
          initialFinish={initialFinish}
          captureFinish={captureFinish}
          onReady={() => rootRef.current?.setAttribute("data-phone", "ready")}
          onError={() => rootRef.current?.setAttribute("data-phone", "failed")}
        />
      )}
      {tier !== null && !captureId && <PrecisionCursor />}
    </main>
  );
}
