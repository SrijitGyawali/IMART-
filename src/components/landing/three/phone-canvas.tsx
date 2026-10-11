"use client";

import { Suspense, useSyncExternalStore } from "react";
import { Canvas } from "@react-three/fiber";
import type { Finish } from "../data";
import { getEnvironmentLive, getSceneVisible, subscribeEnvironment, subscribeScene } from "../scene-store";
import { Atmosphere } from "./atmosphere";
import { PhoneModel } from "./phone-model";
import { StudioLights } from "./studio-lights";
import { ContextGuard, FrameBudget } from "./runtime-guards";
import { isTierForced } from "../motion/use-tier";

function exposeCapture(canvas: HTMLCanvasElement) {
  (window as Window & { __imartCapture?: () => string }).__imartCapture = () => canvas.toDataURL("image/png");
}

export default function PhoneCanvas({
  tier,
  initialFinish,
  captureFinish,
  onReady,
  onLost,
}: {
  tier: "high" | "mid";
  initialFinish: Finish | null;
  captureFinish: Finish | null;
  onReady: () => void;
  onLost: () => void;
}) {
  const visible = useSyncExternalStore(subscribeScene, getSceneVisible, () => true);
  const live = useSyncExternalStore(subscribeEnvironment, getEnvironmentLive, () => false);
  const capture = captureFinish !== null;
  // ?tier= pins the tier for testing, and capture renders stills: neither should change quality mid-run.
  const monitor = !capture && !isTierForced();
  return (
    <Canvas
      frameloop={visible ? "always" : "never"}
      dpr={capture ? 2 : tier === "high" ? [1, 2] : [1, 1.5]}
      camera={{ fov: 24, position: [0, 0, 1.15], near: 0.01, far: 20 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: capture }}
      onCreated={capture ? ({ gl }) => exposeCapture(gl.domElement) : undefined}
    >
      <ContextGuard onLost={onLost} />
      {monitor && <FrameBudget key={tier} visible={visible} />}
      <Suspense fallback={null}>
        {!capture && <Atmosphere quality={tier} initialFinish={initialFinish} />}
        <StudioLights live={tier === "high" && live} />
        <PhoneModel tier={tier} initialFinish={initialFinish} captureFinish={captureFinish} onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
