"use client";

import { useLayoutEffect, useRef } from "react";
import { useFrame, type RootState } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  Box3, CanvasTexture, Group, MathUtils, Matrix4, Mesh, MeshStandardMaterial, PointLight,
  Quaternion, SRGBColorSpace, Vector3,
} from "three";
import { MODEL_URL, STILL_FILL } from "../config";
import { FALLBACK_FINISH, type Finish } from "../data";
import { scene as sceneState, setPhoneUv } from "../scene-store";
import { createSharedWipe, createWipeColors, patchWipe, type SharedWipe, type WipeColors } from "./finish-wipe";

const ALUMINIUM = ["Anodized aluminum", "Metal tint"];
const ANTENNA = ["Plastic antena"];
const BACK_GLASS = ["Frosted glass"];
const ANTENNA_SHADE = 0.55;
export const BASE_YAW = -0.32;
export const BASE_PITCH = 0.04;
const FILM_YAW = -0.1;

useGLTF.preload(MODEL_URL, false, true);

type Look = Omit<Finish, "id" | "label">;

interface Rig {
  shared: SharedWipe;
  aluminium: WipeColors;
  antenna: WipeColors;
  glass: WipeColors;
  metals: MeshStandardMaterial[];
  height: number;
  smoothed: { x: number; y: number };
  ready: boolean;
}

function materialsNamed(root: Group, names: string[]): MeshStandardMaterial[] {
  const found = new Set<MeshStandardMaterial>();
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    const list = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of list) {
      if (material instanceof MeshStandardMaterial && names.includes(material.name)) found.add(material);
    }
  });
  return [...found];
}

/**
 * Measures the model in its own space (independent of our wrapper groups, so re-running is safe):
 * the rotation that stands it upright with the screen facing +Z, its centre, its height and its
 * width range in that upright frame.
 */
function measure(model: Group) {
  model.updateMatrixWorld(true);
  const toModel = new Matrix4().copy(model.matrixWorld).invert();
  const relative = (mesh: Mesh) => new Matrix4().multiplyMatrices(toModel, mesh.matrixWorld);
  const meshes: Mesh[] = [];
  model.traverse((o) => {
    if (o instanceof Mesh) meshes.push(o);
  });
  const oled = meshes.find((m) => !Array.isArray(m.material) && m.material.name === "OLED");
  if (!oled) throw new Error("Phone model has no OLED mesh");

  // In the mesh's own space the long axis is Z (top at -Z) and the back faces +Y.
  const oledMatrix = relative(oled);
  const up = new Vector3(0, 0, -1).transformDirection(oledMatrix);
  const front = new Vector3(0, -1, 0).transformDirection(oledMatrix);
  const right = new Vector3().crossVectors(up, front).normalize();
  const trueFront = new Vector3().crossVectors(right, up).normalize();
  const correction = new Quaternion()
    .setFromRotationMatrix(new Matrix4().makeBasis(right, up, trueFront))
    .invert();

  const box = new Box3();
  for (const mesh of meshes) {
    mesh.geometry.computeBoundingBox();
    const bounds = mesh.geometry.boundingBox;
    if (bounds) box.union(bounds.clone().applyMatrix4(relative(mesh)));
  }
  const center = box.getCenter(new Vector3());
  const size = box.getSize(new Vector3());
  const upright = box.clone().applyMatrix4(
    new Matrix4()
      .makeRotationFromQuaternion(correction)
      .multiply(new Matrix4().makeTranslation(-center.x, -center.y, -center.z)),
  );
  return {
    correction,
    center,
    height: Math.max(size.x, size.y, size.z),
    width: [upright.min.x, upright.max.x] as const,
  };
}

let wallpaper: CanvasTexture | null = null;

/** iMart's own idle screen: a soft emerald glow, centred so UV orientation doesn't matter. */
function getWallpaper(): CanvasTexture | null {
  if (wallpaper) return wallpaper;
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const glow = ctx.createRadialGradient(256, 512, 16, 256, 512, 640);
  glow.addColorStop(0, "#1f8a5b");
  glow.addColorStop(0.32, "#0d3f29");
  glow.addColorStop(0.68, "#04140d");
  glow.addColorStop(1, "#010403");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  wallpaper = new CanvasTexture(canvas);
  wallpaper.colorSpace = SRGBColorSpace;
  return wallpaper;
}

function applyWallpaper(screens: MeshStandardMaterial[]) {
  const texture = getWallpaper();
  if (!texture) return;
  for (const m of screens) {
    m.map = null;
    m.color.set("#000000");
    m.emissive.set("#ffffff");
    m.emissiveMap = texture;
    m.emissiveIntensity = 0.85;
    m.needsUpdate = true;
  }
}

function buildRig(model: Group, orient: Group, centre: Group): Rig {
  const { correction, center, height, width } = measure(model);
  orient.quaternion.copy(correction);
  centre.position.copy(center).negate();
  const rig: Rig = {
    shared: createSharedWipe(width[0], width[1]),
    aluminium: createWipeColors(),
    antenna: createWipeColors(),
    glass: createWipeColors(),
    metals: materialsNamed(model, ALUMINIUM),
    height,
    smoothed: { x: 0, y: 0 },
    ready: false,
  };
  for (const m of rig.metals) patchWipe(m, rig.shared, rig.aluminium);
  for (const m of materialsNamed(model, ANTENNA)) patchWipe(m, rig.shared, rig.antenna);
  for (const m of materialsNamed(model, BACK_GLASS)) patchWipe(m, rig.shared, rig.glass);
  applyWallpaper(materialsNamed(model, ["OLED"]));
  return rig;
}

const projected = new Vector3();

interface FrameInput {
  state: RootState;
  delta: number;
  place: Group;
  light: PointLight | null;
  rig: Rig;
  tier: "high" | "mid";
  look: Look;
  capture: boolean;
}

function frame({ state, delta, place, light, rig, tier, look, capture }: FrameInput) {
  const { width: vw, height: vh } = state.viewport;
  const mobile = vw / vh < 0.9;
  const t = state.clock.elapsedTime;
  const k = capture ? 0 : sceneState.handoff;
  const motion = capture ? 0 : 1;

  // Placement: where the poster still sits (device slot), easing to centre during the hand-off.
  let x = vw * 0.17;
  let y = 0;
  let h = vh * 0.72;
  const slot = sceneState.slot;
  if (capture) {
    x = 0;
    h = vh * STILL_FILL;
  } else if (slot) {
    x = (slot.cx - 0.5) * vw;
    y = (0.5 - slot.cy) * vh;
    h = slot.h * vh * STILL_FILL;
  }
  x = MathUtils.lerp(x, 0, k);
  y = MathUtils.lerp(y, 0, k);
  h = MathUtils.lerp(h, vh * (mobile ? 0.5 : 0.78), k);
  place.scale.setScalar(h / rig.height);

  const sm = rig.smoothed;
  const follow = tier === "high" && !capture;
  sm.x = MathUtils.damp(sm.x, follow ? sceneState.pointer.x : 0, 2.5, delta);
  sm.y = MathUtils.damp(sm.y, follow ? sceneState.pointer.y : 0, 2.5, delta);
  place.position.set(x, y + Math.sin(t * 0.35) * vh * 0.0025 * motion, 0);
  place.rotation.y = MathUtils.lerp(BASE_YAW, FILM_YAW, k) + Math.sin(t * 0.21) * 0.012 * motion + sm.x * 0.05;
  place.rotation.x = BASE_PITCH + Math.sin(t * 0.17) * 0.006 * motion + sm.y * 0.025;

  // Finish wipe: old finish ahead of the band, new finish behind it.
  const from = capture ? look : (sceneState.wipe.from ?? look);
  rig.aluminium.uFrom.value.set(from.aluminium);
  rig.aluminium.uTo.value.set(look.aluminium);
  rig.antenna.uFrom.value.set(from.aluminium).multiplyScalar(ANTENNA_SHADE);
  rig.antenna.uTo.value.set(look.aluminium).multiplyScalar(ANTENNA_SHADE);
  rig.glass.uFrom.value.set(from.glass);
  rig.glass.uTo.value.set(look.glass);
  rig.shared.uWipe.value = capture ? 1.05 : sceneState.wipe.progress;
  rig.shared.uBand.value = capture ? 0 : sceneState.wipe.band;
  place.updateMatrixWorld();
  rig.shared.uPhoneInv.value.copy(place.matrixWorld).invert();
  const mix = MathUtils.clamp(rig.shared.uWipe.value, 0, 1);
  for (const m of rig.metals) {
    m.metalness = MathUtils.lerp(from.metalness, look.metalness, mix);
    m.roughness = MathUtils.lerp(from.roughness, look.roughness, mix);
  }

  // Boot reveal and the finish-change dip.
  state.gl.toneMappingExposure = (capture ? 1 : sceneState.intro.exposure) * (1 - 0.3 * sceneState.dim);
  if (light) light.intensity = capture ? 0 : sceneState.intro.light * 3;

  projected.copy(place.position).project(state.camera);
  setPhoneUv((projected.x + 1) / 2, (1 - projected.y) / 2);
}

export function PhoneModel({
  tier,
  initialFinish,
  captureFinish,
  onReady,
}: {
  tier: "high" | "mid";
  initialFinish: Finish | null;
  captureFinish: Finish | null;
  onReady: () => void;
}) {
  const { scene: model } = useGLTF(MODEL_URL, false, true);
  const place = useRef<Group>(null);
  const orient = useRef<Group>(null);
  const centre = useRef<Group>(null);
  const light = useRef<PointLight>(null);
  const rig = useRef<Rig | null>(null);

  useLayoutEffect(() => {
    if (!orient.current || !centre.current) return;
    rig.current = buildRig(model, orient.current, centre.current);
  }, [model]);

  useFrame((state, delta) => {
    const r = rig.current;
    if (!place.current || !r) return;
    const look = captureFinish ?? sceneState.finish ?? initialFinish ?? FALLBACK_FINISH;
    frame({ state, delta, place: place.current, light: light.current, rig: r, tier, look, capture: captureFinish !== null });
    if (!r.ready) {
      r.ready = true;
      onReady();
    }
  });

  return (
    <group ref={place}>
      {/* The green light from the boot dot, at the phone's front-left edge. */}
      <pointLight ref={light} color="#3ddc84" intensity={0} distance={0} decay={2} position={[-0.07, 0.05, 0.1]} />
      <group ref={orient}>
        <group ref={centre}>
          <primitive object={model} />
        </group>
      </group>
    </group>
  );
}
