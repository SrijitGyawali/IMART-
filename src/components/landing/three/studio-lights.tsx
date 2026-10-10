"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { MathUtils, type Mesh } from "three";
import { scene as sceneState } from "../scene-store";

function placeSweep(strip: Mesh | null) {
  if (!strip) return;
  strip.position.x = -3.2 + MathUtils.clamp(sceneState.sweep, 0, 1) * 6.4;
}

/**
 * A narrow studio strip that travels in front of the phone; its reflection runs along the frame.
 * Visibility follows `live` as a prop so it is hidden in the same commit that freezes the
 * environment — the final captured environment never contains the strip.
 */
function SweepStrip({ visible }: { visible: boolean }) {
  const ref = useRef<Mesh>(null);
  useFrame(() => placeSweep(ref.current));
  return (
    <Lightformer ref={ref} visible={visible} form="rect" intensity={7} position={[-3.2, 0.3, 1.6]} scale={[0.22, 4.2, 1]} rotation-y={Math.PI} />
  );
}

export function StudioLights({ live }: { live: boolean }) {
  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight position={[2.5, 3, 2]} intensity={1.1} />
      <directionalLight position={[-2, 1.2, 1.5]} intensity={0.9} color="#3ddc84" />
      <Environment resolution={256} frames={live ? Infinity : 1}>
        {/* Strip softboxes: they become the highlights running along the frame. */}
        <Lightformer form="rect" intensity={2.6} position={[0, 2.6, 1.2]} scale={[4, 0.5, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={2.2} position={[-2.6, 0.2, 1]} scale={[0.35, 3.2, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.6} position={[2.6, 0.2, 1]} scale={[0.35, 3.2, 1]} rotation-y={-Math.PI / 2} />
        {/* A soft box behind the camera gives the screen glass its studio sheen. */}
        <Lightformer form="rect" intensity={0.3} position={[0, 1.6, 3.5]} scale={[3, 0.9, 1]} rotation-y={Math.PI} />
        <Lightformer form="ring" intensity={1.2} color="#3ddc84" position={[0, 0, -3]} scale={2.2} />
        <SweepStrip visible={live} />
      </Environment>
    </>
  );
}
