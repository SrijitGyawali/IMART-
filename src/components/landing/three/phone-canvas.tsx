"use client";

import { Suspense, useSyncExternalStore } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import type { Finish } from "../data";
import { getSceneVisible, subscribeScene } from "../scene-store";
import { PhoneModel } from "./phone-model";

function StudioLights() {
  return (
    <>
      <ambientLight intensity={0.12} />
      <directionalLight position={[-2, 1.2, 1.5]} intensity={0.7} color="#3ddc84" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.4} position={[0, 2.6, 1.2]} scale={[4, 0.5, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.6} position={[-2.6, 0.2, 1]} scale={[0.35, 3.2, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.2} position={[2.6, 0.2, 1]} scale={[0.35, 3.2, 1]} rotation-y={-Math.PI / 2} />
        <Lightformer form="ring" intensity={0.9} color="#3ddc84" position={[0, 0, -3]} scale={2.2} />
      </Environment>
    </>
  );
}

export default function PhoneCanvas({
  tier,
  initialFinish,
  onReady,
}: {
  tier: "high" | "mid";
  initialFinish: Finish | null;
  onReady: () => void;
}) {
  const visible = useSyncExternalStore(subscribeScene, getSceneVisible, () => true);
  return (
    <Canvas
      frameloop={visible ? "always" : "never"}
      dpr={tier === "high" ? [1, 2] : [1, 1.5]}
      camera={{ fov: 24, position: [0, 0, 1.15], near: 0.01, far: 20 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <Suspense fallback={null}>
        <StudioLights />
        <PhoneModel tier={tier} initialFinish={initialFinish} onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
