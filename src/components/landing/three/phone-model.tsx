"use client";

import { useLayoutEffect, useRef } from "react";
import { useFrame, type RootState } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import {
  Box3, CanvasTexture, DoubleSide, Group, MathUtils, Matrix4, Mesh, MeshStandardMaterial, PointLight,
  Quaternion, SRGBColorSpace, Vector3, type Material,
} from "three";
import { MODEL_URL, STILL_FILL } from "../config";
import { FALLBACK_FINISH, type Finish } from "../data";
import { filmBeats, filmPose, ramp } from "../film/film-timeline";
import { film, scene as sceneState, setFilmLabel, setFilmScreen, setPhoneUv } from "../scene-store";
import { createSharedWipe, createWipeColors, patchWipe, type SharedWipe, type WipeColors } from "./finish-wipe";
import { applyLayers, buildLayers, disposeLayers, layerOffset, type LayerRig } from "./layers";
import { createScreenUniforms, disposeScreen, patchScreen, type ScreenUniforms } from "./screen-ui";
import { welcomeMotion } from "./welcome-motion";

const ALUMINIUM = ["Anodized aluminum", "Metal tint"];
const ANTENNA = ["Plastic antena"];
const BACK_GLASS = ["Frosted glass"];
const ANTENNA_SHADE = 0.55;
export const BASE_YAW = -0.32;
export const BASE_PITCH = 0.04;

useGLTF.preload(MODEL_URL, false, true);

type Look = Omit<Finish, "id" | "label">;

interface Rig {
  shared: SharedWipe;
  aluminium: WipeColors;
  antenna: WipeColors;
  glass: WipeColors;
  metals: MeshStandardMaterial[];
  layers: LayerRig;
  screen: ScreenUniforms;
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
    heightRange: [upright.min.y, upright.max.y] as const,
  };
}

let wallpaper: CanvasTexture | null = null;

function getWallpaper(): CanvasTexture | null {
  if (wallpaper) return wallpaper;
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 4;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, 4, 4);
  wallpaper = new CanvasTexture(canvas);
  wallpaper.colorSpace = SRGBColorSpace;
  return wallpaper;
}

function prepareScreen(screens: MeshStandardMaterial[], uniforms: ScreenUniforms) {
  const texture = getWallpaper();
  if (!texture) return;
  for (const m of screens) {
    m.map = null;
    m.color.set("#000000");
    m.emissive.set("#ffffff");
    m.emissiveMap = texture;
    m.emissiveIntensity = 1;
    patchScreen(m, uniforms);
  }
}

function buildRig(model: Group, orient: Group, centre: Group): Rig {
  const { correction, center, height, width, heightRange } = measure(model);
  orient.quaternion.copy(correction);
  centre.position.copy(center).negate();
  const screen = createScreenUniforms();
  const rig: Rig = {
    shared: createSharedWipe(width[0], width[1], heightRange[0], heightRange[1]),
    aluminium: createWipeColors(),
    antenna: createWipeColors(),
    glass: createWipeColors(),
    metals: materialsNamed(model, ALUMINIUM),
    layers: buildLayers(model, correction, width[1] - width[0], heightRange[1] - heightRange[0]),
    screen,
    height,
    smoothed: { x: 0, y: 0 },
    ready: false,
  };
  for (const m of rig.metals) patchWipe(m, rig.shared, rig.aluminium);
  for (const m of materialsNamed(model, ANTENNA)) patchWipe(m, rig.shared, rig.antenna);
  for (const m of materialsNamed(model, BACK_GLASS)) patchWipe(m, rig.shared, rig.glass);
  prepareScreen(materialsNamed(model, ["OLED"]), screen);
  drawGlassInOnePass(model);
  return rig;
}

function drawGlassInOnePass(root: Group) {
  root.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    for (const material of ([] as Material[]).concat(object.material)) {
      if (material.transparent && material.side === DoubleSide) material.forceSinglePass = true;
    }
  });
}

const projected = new Vector3();
const scratch = new Vector3();
const other = new Vector3();
const CORNERS = [[-1, -1], [1, -1], [1, 1], [-1, 1]] as const;

interface FrameInput {
  state: RootState;
  delta: number;
  place: Group;
  light: PointLight | null;
  outline: PointLight | null;
  rig: Rig;
  tier: "high" | "mid";
  look: Look;
  capture: boolean;
}

function frame({ state, delta, place, light, outline, rig, tier, look, capture }: FrameInput) {
  const { width: vw, height: vh } = state.viewport;
  const mobile = vw / vh < 0.9;
  const t = state.clock.elapsedTime;
  const k = capture ? 0 : sceneState.handoff;
  const idle = capture ? 0 : 1 - k;
  const fp = capture ? 0 : film.progress;
  const pose = filmPose(fp);
  const beats = filmBeats(fp);

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
  x = MathUtils.lerp(x, mobile ? 0 : pose.x * vw, k);
  y = MathUtils.lerp(y, mobile ? vh * 0.17 : 0, k);
  h = MathUtils.lerp(h, vh * (mobile ? 0.38 : 0.78), k) * MathUtils.lerp(1, mobile ? Math.min(pose.scale, 1.14) : pose.scale, k);
  place.scale.setScalar(h / rig.height);

  const sm = rig.smoothed;
  const follow = tier === "high" && !capture;
  sm.x = MathUtils.damp(sm.x, follow ? sceneState.pointer.x : 0, 2.5, delta);
  sm.y = MathUtils.damp(sm.y, follow ? sceneState.pointer.y : 0, 2.5, delta);
  place.position.set(x, y + Math.sin(t * 0.35) * vh * 0.0025 * idle, 0);
  place.rotation.y = MathUtils.lerp(BASE_YAW, pose.yaw, k) + Math.sin(t * 0.21) * 0.012 * idle + sm.x * 0.05 * idle;
  place.rotation.x = MathUtils.lerp(BASE_PITCH, pose.pitch, k) + Math.sin(t * 0.17) * 0.006 * idle + sm.y * 0.025 * idle;

  if (beats.land > 0 && film.tile.w > 0) {
    const tileX = ((film.tile.x + film.tile.w / 2) / state.size.width - 0.5) * vw;
    place.position.x = MathUtils.lerp(place.position.x, tileX, beats.land);
    place.position.y = MathUtils.lerp(place.position.y, -vh * 0.42, beats.land);
  }

  const gapSize = mobile ? 0.009 : 0.013;
  applyLayers(rig.layers, beats.explode, gapSize);
  rig.layers.internals.visible = beats.explode.some((e) => e > 0.002) || beats.scanFade > 0.01;

  if (pose.gap > 0) {
    place.updateMatrixWorld();
    scratch.set(0, 0, 0.5 * layerOffset(2, beats.explode, gapSize)).applyMatrix4(place.matrixWorld);
    place.position.x -= (scratch.x - place.position.x) * pose.gap;
  }

  const from = capture ? look : (sceneState.wipe.from ?? look);
  rig.aluminium.uFrom.value.set(from.aluminium);
  rig.aluminium.uTo.value.set(look.aluminium);
  rig.antenna.uFrom.value.set(from.aluminium).multiplyScalar(ANTENNA_SHADE);
  rig.antenna.uTo.value.set(look.aluminium).multiplyScalar(ANTENNA_SHADE);
  rig.glass.uFrom.value.set(from.glass);
  rig.glass.uTo.value.set(look.glass);
  rig.shared.uWipe.value = capture ? 1.05 : sceneState.wipe.progress;
  rig.shared.uBand.value = capture ? 0 : sceneState.wipe.band;
  rig.shared.uScan.value = beats.scan;
  rig.shared.uScanFade.value = beats.scanFade;
  place.updateMatrixWorld();
  rig.shared.uPhoneInv.value.copy(place.matrixWorld).invert();
  const mix = MathUtils.clamp(rig.shared.uWipe.value, 0, 1);
  for (const m of rig.metals) {
    m.metalness = MathUtils.lerp(from.metalness, look.metalness, mix);
    m.roughness = MathUtils.lerp(from.roughness, look.roughness, mix);
  }

  const sc = rig.screen;
  const welcome = welcomeMotion(k);
  sc.uWelcome.value = capture ? 1 : welcome.opacity;
  sc.uWelcomeCollapse.value = capture ? 0 : welcome.collapse;
  sc.uFinishTint.value.set(from.aluminium).lerp(rig.aluminium.uTo.value, mix);
  sc.uPower.value = beats.power;
  sc.uPayCard.value = beats.payCard;
  sc.uPay.value = beats.pay;
  sc.uQr.value = beats.qr;
  sc.uQrCollapse.value = beats.qrCollapse;
  sc.uMorph.value = beats.morph;
  sc.uMap.value = beats.map;
  sc.uNotify.value = beats.notify;
  sc.uTime.value = t;
  sc.uUi.value = beats.ui;

  state.gl.toneMappingExposure = (capture ? 1 : sceneState.intro.exposure) * (1 - 0.3 * sceneState.dim) * pose.exposure;
  if (light) light.intensity = capture ? 0 : sceneState.intro.light * 3;
  if (outline) {
    outline.intensity = beats.outline * 2.5;
    const a = ramp(fp, 0.165, 0.205) * Math.PI * 2;
    outline.position.set(Math.cos(a) * 0.045, Math.sin(a) * 0.085, -0.012);
  }

  for (let i = 0; i < 5; i++) {
    const z = layerOffset(i, beats.explode, gapSize);
    const ay = 0.06 - i * 0.03;
    scratch.set(0.042, ay, z).applyMatrix4(place.matrixWorld).project(state.camera);
    other.set(-0.042, ay, z).applyMatrix4(place.matrixWorld).project(state.camera);
    const edge = other.x > scratch.x ? other : scratch;
    setFilmLabel(i, ((edge.x + 1) / 2) * state.size.width, ((1 - edge.y) / 2) * state.size.height, edge.z < 1);
  }

  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const [sx, sy] of CORNERS) {
    scratch.set(sx * 0.0365, sy * 0.079, 0.004).applyMatrix4(place.matrixWorld).project(state.camera);
    const px = ((scratch.x + 1) / 2) * state.size.width;
    const py = ((1 - scratch.y) / 2) * state.size.height;
    left = Math.min(left, px);
    right = Math.max(right, px);
    top = Math.min(top, py);
    bottom = Math.max(bottom, py);
  }
  setFilmScreen(left, top, right, bottom);

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
  const outline = useRef<PointLight>(null);
  const rig = useRef<Rig | null>(null);

  useLayoutEffect(() => {
    const p = place.current;
    if (!p || !orient.current || !centre.current) return;
    const built = buildRig(model, orient.current, centre.current);
    p.add(built.layers.internals);
    rig.current = built;
    return () => {
      p.remove(built.layers.internals);
      disposeLayers(built.layers);
      disposeScreen(built.screen);
    };
  }, [model]);

  useFrame((state, delta) => {
    const r = rig.current;
    if (!place.current || !r) return;
    const look = captureFinish ?? sceneState.finish ?? initialFinish ?? FALLBACK_FINISH;
    frame({
      state,
      delta,
      place: place.current,
      light: light.current,
      outline: outline.current,
      rig: r,
      tier,
      look,
      capture: captureFinish !== null,
    });
    if (!r.ready) {
      r.ready = true;
      onReady();
      state.gl.compileAsync(state.scene, state.camera).catch(() => {});
    }
  });

  return (
    <group ref={place}>
      <pointLight ref={light} color="#3ddc84" intensity={0} distance={0} decay={2} position={[-0.07, 0.05, 0.1]} />
      <pointLight ref={outline} color="#cfffe4" intensity={0} distance={0} decay={2} />
      <group ref={orient}>
        <group ref={centre}>
          <primitive object={model} />
        </group>
      </group>
    </group>
  );
}
