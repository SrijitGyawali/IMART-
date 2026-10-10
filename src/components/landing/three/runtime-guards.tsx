"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { judgeFrames, windowFps } from "../motion/frame-budget";
import { stepDownTier } from "../motion/use-tier";
import { film } from "../scene-store";

/** A lost WebGL context is a failure like any other: the page falls back to the Low presentation. */
export function ContextGuard({ onLost }: { onLost: () => void }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    // Removed on unmount, before R3F forces its own context loss while disposing the renderer.
    canvas.addEventListener("webglcontextlost", onLost);
    return () => canvas.removeEventListener("webglcontextlost", onLost);
  }, [gl, onLost]);
  return null;
}

const WINDOW_S = 1.5;
const WARMUP_S = 4;

/**
 * Steps the tier down once when frames stay under 50 fps for three windows in a row. It does not
 * sample during warm-up (shader compiles), inside the film (never change quality mid-scene), or
 * while the tab is hidden; any of those clears the history.
 */
export function FrameBudget() {
  const state = useRef({ age: 0, frames: 0, elapsed: 0, windows: [] as number[], done: false });
  useFrame((_, delta) => {
    const s = state.current;
    if (s.done) return;
    s.age += delta;
    const paused = s.age < WARMUP_S || document.hidden || (film.progress > 0 && film.progress < 1);
    if (paused || delta > 0.5) {
      s.frames = 0;
      s.elapsed = 0;
      s.windows.length = 0;
      return;
    }
    s.frames += 1;
    s.elapsed += delta;
    if (s.elapsed < WINDOW_S) return;
    s.windows.push(windowFps(s.frames, s.elapsed));
    s.frames = 0;
    s.elapsed = 0;
    if (s.windows.length > 6) s.windows.shift();
    if (judgeFrames(s.windows)) {
      s.done = true;
      stepDownTier();
    }
  });
  return null;
}
