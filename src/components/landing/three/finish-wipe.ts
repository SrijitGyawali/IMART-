import { Color, Matrix4, Vector2, type MeshStandardMaterial } from "three";

/** Uniforms shared by every finish material: where the wipe is and the phone's own frame. */
export interface SharedWipe {
  uWipe: { value: number };
  uBand: { value: number };
  uPhoneInv: { value: Matrix4 };
  uWidth: { value: Vector2 };
}

/** Per material group: the finish being replaced and the one being revealed. */
export interface WipeColors {
  uFrom: { value: Color };
  uTo: { value: Color };
}

export function createSharedWipe(minX: number, maxX: number): SharedWipe {
  return {
    uWipe: { value: 1.05 },
    uBand: { value: 0 },
    uPhoneInv: { value: new Matrix4() },
    uWidth: { value: new Vector2(minX, maxX) },
  };
}

export function createWipeColors(): WipeColors {
  return { uFrom: { value: new Color() }, uTo: { value: new Color() } };
}

/**
 * The new finish is revealed behind a thin vertical light that travels across the device
 * (left → right in the phone's own upright frame).
 */
export function patchWipe(material: MeshStandardMaterial, shared: SharedWipe, colors: WipeColors) {
  material.color.set("#ffffff");
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, shared, colors);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform mat4 uPhoneInv;\nvarying float vPhoneX;")
      .replace(
        "#include <project_vertex>",
        "#include <project_vertex>\nvPhoneX = (uPhoneInv * modelMatrix * vec4(transformed, 1.0)).x;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform vec3 uFrom;\nuniform vec3 uTo;\nuniform float uWipe;\nuniform float uBand;\nuniform vec2 uWidth;\nvarying float vPhoneX;",
      )
      .replace(
        "vec4 diffuseColor = vec4( diffuse, opacity );",
        "float wipeS = clamp((vPhoneX - uWidth.x) / (uWidth.y - uWidth.x), 0.0, 1.0);\n" +
          "vec4 diffuseColor = vec4( diffuse * mix(uTo, uFrom, step(uWipe, wipeS)), opacity );",
      )
      .replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\n" +
          "totalEmissiveRadiance += vec3(0.82, 1.0, 0.9) * uBand * smoothstep(0.06, 0.0, abs(wipeS - uWipe));",
      );
  };
  material.customProgramCacheKey = () => "imart-wipe";
  material.needsUpdate = true;
}
