"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { judgeFrames, windowFps } from "../motion/frame-budget";
import { stepDownTier } from "../motion/use-tier";
import { film } from "../scene-store";

export function ContextGuard({ onLost }: { onLost: () => void }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener("webglcontextlost", onLost);
    return () => canvas.removeEventListener("webglcontextlost", onLost);
  }, [gl, onLost]);
  return null;
}

const WINDOW_S = 1.5;
const WARMUP_S = 4;

export function FrameBudget({ visible }: { visible: boolean }) {
  const state = useRef({ age: 0, frames: 0, elapsed: 0, windows: [] as number[], done: false });
  useEffect(() => {
    const clear = () => {
      state.current.frames = 0;
      state.current.elapsed = 0;
      state.current.windows.length = 0;
    };
    clear();
    document.addEventListener("visibilitychange", clear);
    return () => document.removeEventListener("visibilitychange", clear);
  }, [visible]);
  useFrame((_, delta) => {
    const s = state.current;
    if (s.done) return;
    s.age += delta;
    const paused = !visible || s.age < WARMUP_S || document.hidden || (film.progress > 0 && film.progress < 1);
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
