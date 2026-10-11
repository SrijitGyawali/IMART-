"use client";

import { useEffect, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, ShaderMaterial } from "three";
import type { Finish } from "../data";
import { film, scene as sceneState } from "../scene-store";
import { filmBeats } from "../film/film-timeline";

const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.9999, 1.0);
}`;

// Emerald aurora, a light pool behind the device and fine grain — almost invisible until you look.
const fragmentShader = /* glsl */ `
uniform float uTime;
uniform vec2 uRes;
uniform vec3 uTint;
uniform float uDark;
uniform vec2 uCenter;
uniform float uFlood;
varying vec2 vUv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < OCTAVES; i++) {
    v += a * noise(p);
    p = p * 2.03 + 17.1;
    a *= 0.5;
  }
  return v;
}
void main() {
  float aspect = uRes.x / uRes.y;
  vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
  float t = uTime * 0.035;
  float warp = fbm(p * 1.4 + vec2(t, -t * 0.7));
  float bands = fbm(vec2(p.x * 0.8 + t * 0.6, p.y * 2.4 - warp * 1.2));
  float aurora = smoothstep(0.42, 0.95, bands) * smoothstep(0.9, -0.2, p.y + 0.15);
  vec3 col = vec3(0.03, 0.26, 0.15) * aurora * 0.42;
  vec2 c = (uCenter - 0.5) * vec2(aspect, 1.0);
  vec2 d = (p - c) * vec2(1.25, 0.75);
  float glow = exp(-dot(d, d) * mix(2.6, 7.0, uDark));
  col += mix(vec3(0.07, 0.45, 0.27), uTint, 0.22) * glow * 0.26;
  col *= 1.0 - uDark * 0.6;
  float grain = (hash(vUv * uRes) - 0.5) * 0.009;
  col = max(col + grain, 0.0);
  float alpha = clamp(max(col.r, max(col.g, col.b)) * 1.8, 0.0, 0.85);
  // The aurora disappears as white light takes over (moment 05).
  col *= 1.0 - uFlood;
  alpha *= 1.0 - uFlood;
  gl_FragColor = vec4(min(col, vec3(alpha)), alpha);
}`;

const tintTarget = new Color();

function tick(material: ShaderMaterial, elapsed: number, width: number, height: number, finish: Finish | null) {
  const u = material.uniforms;
  u.uTime.value = elapsed;
  u.uRes.value[0] = width;
  u.uRes.value[1] = height;
  u.uDark.value = sceneState.handoff;
  u.uFlood.value = filmBeats(film.progress).flood;
  u.uCenter.value[0] = sceneState.phoneUv.x;
  u.uCenter.value[1] = 1 - sceneState.phoneUv.y;
  tintTarget.set(finish?.aluminium ?? "#3A3B3E");
  (u.uTint.value as Color).lerp(tintTarget, 0.04);
}

export function Atmosphere({ quality, initialFinish }: { quality: "high" | "mid"; initialFinish: Finish | null }) {
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        defines: { OCTAVES: quality === "high" ? 4 : 2 },
        uniforms: {
          uTime: { value: 0 },
          uRes: { value: [1, 1] },
          uTint: { value: new Color(initialFinish?.aluminium ?? "#3A3B3E") },
          uDark: { value: 0 },
          uCenter: { value: [0.67, 0.5] },
          uFlood: { value: 0 },
        },
        transparent: true,
        premultipliedAlpha: true,
        depthWrite: false,
        depthTest: false,
      }),
    [quality, initialFinish],
  );

  useEffect(() => () => material.dispose(), [material]);

  useFrame((state) => {
    const dpr = state.viewport.dpr;
    tick(material, state.clock.elapsedTime, state.size.width * dpr, state.size.height * dpr, sceneState.finish ?? initialFinish);
  });

  return (
    <mesh frustumCulled={false} renderOrder={-10} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}
