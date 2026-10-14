import { BoxGeometry, Group, Matrix4, Mesh, MeshStandardMaterial, Quaternion, Vector3, type Material } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { LAYER_ORDER, type LayerName } from "../film/film-timeline";

const MEMBERSHIP: Record<string, LayerName> = {
  Glass: "display",
  OLED: "display",
  "OLED off": "display",
  "Display Frame": "display",
  "Frosted glass": "backGlass",
  "Tinted glass": "backGlass",
};

function layerOf(material: Material | Material[]): LayerName {
  const m = Array.isArray(material) ? material[0] : material;
  return MEMBERSHIP[m?.name ?? ""] ?? "frame";
}

export interface LayerRig {
  parts: Array<{ mesh: Mesh; layer: number; base: Vector3; axis: Vector3 }>;
  internals: Group;
  battery: Mesh;
  logic: Group;
}

const OFFSETS = [-3, -2, -1, 0, 1.2];

export function buildLayers(model: Group, correction: Quaternion, width: number, height: number): LayerRig {
  model.updateMatrixWorld(true);
  const toModel = new Matrix4().copy(model.matrixWorld).invert();
  const uprightZInModel = new Vector3(0, 0, 1).applyQuaternion(correction.clone().invert());
  const parts: LayerRig["parts"] = [];
  model.traverse((o) => {
    if (!(o instanceof Mesh) || !o.parent) return;
    const parentRel = new Matrix4().multiplyMatrices(toModel, o.parent.matrixWorld);
    const inverseLinear = new Matrix4().copy(parentRel).setPosition(0, 0, 0).invert();
    const axis = uprightZInModel.clone().applyMatrix4(inverseLinear);
    o.userData.basePosition ??= o.position.clone();
    parts.push({
      mesh: o,
      layer: LAYER_ORDER.indexOf(layerOf(o.material)),
      base: o.userData.basePosition as Vector3,
      axis,
    });
  });

  const internals = new Group();
  const battery = new Mesh(
    new RoundedBoxGeometry(width * 0.84, height * 0.56, 0.0045, 3, 0.004),
    new MeshStandardMaterial({ color: "#2b302d", roughness: 0.45, metalness: 0.4 }),
  );
  battery.position.set(0, -height * 0.14, -0.0015);
  const logic = new Group();
  logic.add(
    new Mesh(
      new RoundedBoxGeometry(width * 0.86, height * 0.3, 0.0014, 2, 0.003),
      new MeshStandardMaterial({ color: "#121815", roughness: 0.42, metalness: 0.35 }),
    ),
  );
  const chipMaterial = new MeshStandardMaterial({ color: "#2a332e", roughness: 0.28, metalness: 0.75 });
  for (const [x, y, w, h] of [[-0.18, 0.06, 0.26, 0.2], [0.14, 0.05, 0.2, 0.16], [-0.02, -0.1, 0.3, 0.12], [0.24, -0.11, 0.12, 0.1]]) {
    const chip = new Mesh(new BoxGeometry(width * w, height * 0.3 * h, 0.0012), chipMaterial);
    chip.position.set(width * x, height * 0.3 * y, 0.0012);
    logic.add(chip);
  }
  const traceMaterial = new MeshStandardMaterial({ color: "#0d3f29", emissive: "#3ddc84", emissiveIntensity: 1.8 });
  for (const [x, y, w] of [[-0.3, -0.02, 0.36], [0.05, 0.11, 0.42], [0.1, -0.03, 0.3], [-0.12, -0.13, 0.5], [0.32, 0.02, 0.14]]) {
    const trace = new Mesh(new BoxGeometry(width * w, 0.0012, 0.0008), traceMaterial);
    trace.position.set(width * x, height * 0.3 * y, 0.0009);
    logic.add(trace);
  }
  logic.position.set(0, height * 0.29, -0.0006);
  internals.add(battery, logic);
  internals.visible = false;
  return { parts, internals, battery, logic };
}

export function applyLayers(rig: LayerRig, explode: number[], gap: number) {
  for (const part of rig.parts) {
    const dz = OFFSETS[part.layer] * explode[part.layer] * gap;
    part.mesh.position.copy(part.base).addScaledVector(part.axis, dz);
  }
  rig.battery.position.z = -0.0015 + OFFSETS[1] * explode[1] * gap;
  rig.logic.position.z = -0.0006 + OFFSETS[2] * explode[2] * gap;
}

export function layerOffset(index: number, explode: number[], gap: number) {
  return OFFSETS[index] * explode[index] * gap;
}

export function disposeLayers(rig: LayerRig) {
  rig.internals.traverse((o) => {
    if (o instanceof Mesh) {
      o.geometry.dispose();
      (o.material as Material).dispose();
    }
  });
}
