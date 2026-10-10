"use client";

import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Box3, Color, Group, MathUtils, Matrix4, Mesh, MeshStandardMaterial, Quaternion, Vector3 } from "three";
import { MODEL_URL } from "../config";
import type { Finish } from "../data";
import { FALLBACK_FINISH } from "../data";
import { scene as sceneState } from "../scene-store";

const ALUMINIUM = ["Anodized aluminum", "Metal tint"];
const ANTENNA = ["Plastic antena"];
const BACK_GLASS = ["Frosted glass"];
const BASE_YAW = -0.32;
const BASE_PITCH = 0.04;

useGLTF.preload(MODEL_URL, false, true);

interface FinishMaterials {
  aluminium: MeshStandardMaterial[];
  antenna: MeshStandardMaterial[];
  glass: MeshStandardMaterial[];
}

interface FinishTarget {
  aluminium: Color;
  antenna: Color;
  glass: Color;
  metalness: number;
  roughness: number;
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
 * the rotation that stands it upright with the screen facing +Z, its centre and its height.
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
  const size = box.getSize(new Vector3());
  return { correction, center: box.getCenter(new Vector3()), height: Math.max(size.x, size.y, size.z) };
}

function toTarget(finish: Omit<Finish, "id" | "label">, target: FinishTarget) {
  target.aluminium.set(finish.aluminium);
  target.antenna.set(finish.aluminium).multiplyScalar(0.55);
  target.glass.set(finish.glass);
  target.metalness = finish.metalness;
  target.roughness = finish.roughness;
}

function applyFinish(materials: FinishMaterials, target: FinishTarget, k: number) {
  for (const m of materials.aluminium) {
    m.color.lerp(target.aluminium, k);
    m.metalness += (target.metalness - m.metalness) * k;
    m.roughness += (target.roughness - m.roughness) * k;
  }
  for (const m of materials.antenna) m.color.lerp(target.antenna, k);
  for (const m of materials.glass) m.color.lerp(target.glass, k);
}

export function PhoneModel({
  tier,
  initialFinish,
  onReady,
}: {
  tier: "high" | "mid";
  initialFinish: Finish | null;
  onReady: () => void;
}) {
  const { scene: model } = useGLTF(MODEL_URL, false, true);
  const place = useRef<Group>(null);
  const orient = useRef<Group>(null);
  const centre = useRef<Group>(null);
  const height = useRef(0.1634);
  const materials = useRef<FinishMaterials | null>(null);
  const target = useRef<FinishTarget>({
    aluminium: new Color(), antenna: new Color(), glass: new Color(), metalness: 0.45, roughness: 0.35,
  });
  const appliedFinish = useRef<string | null>(null);
  const smoothed = useRef({ x: 0, y: 0 });
  const readyFired = useRef(false);

  useLayoutEffect(() => {
    const o = orient.current;
    const c = centre.current;
    if (!o || !c) return;
    const { correction, center, height: modelHeight } = measure(model);
    o.quaternion.copy(correction);
    c.position.copy(center).negate();
    height.current = modelHeight;
    materials.current = {
      aluminium: materialsNamed(model, ALUMINIUM),
      antenna: materialsNamed(model, ANTENNA),
      glass: materialsNamed(model, BACK_GLASS),
    };
    toTarget(initialFinish ?? FALLBACK_FINISH, target.current);
    applyFinish(materials.current, target.current, 1);
    appliedFinish.current = initialFinish?.id ?? null;
  }, [model, initialFinish]);

  useFrame((state, delta) => {
    const p = place.current;
    const mats = materials.current;
    if (!p || !mats) return;
    const { width: vw, height: vh } = state.viewport;
    const mobile = vw / vh < 0.9;
    p.scale.setScalar((vh * (mobile ? 0.5 : 0.74)) / height.current);

    const sm = smoothed.current;
    sm.x = MathUtils.damp(sm.x, tier === "high" ? sceneState.pointer.x : 0, 2.5, delta);
    sm.y = MathUtils.damp(sm.y, tier === "high" ? sceneState.pointer.y : 0, 2.5, delta);
    const t = state.clock.elapsedTime;
    p.position.x = mobile ? 0 : vw * 0.17;
    p.position.y = (mobile ? vh * 0.2 : -vh * 0.01) + Math.sin(t * 0.35) * vh * 0.0025;
    p.rotation.y = BASE_YAW + Math.sin(t * 0.21) * 0.012 + sm.x * 0.05;
    p.rotation.x = BASE_PITCH + Math.sin(t * 0.17) * 0.006 + sm.y * 0.025;

    const picked = sceneState.finish;
    if (picked && picked.id !== appliedFinish.current) {
      toTarget(picked, target.current);
      appliedFinish.current = picked.id;
    }
    applyFinish(mats, target.current, 1 - Math.exp(-delta * 6));

    if (!readyFired.current) {
      readyFired.current = true;
      onReady();
    }
  });

  return (
    <group ref={place}>
      <group ref={orient}>
        <group ref={centre}>
          <primitive object={model} />
        </group>
      </group>
    </group>
  );
}
