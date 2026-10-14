import { Color, Matrix4, Vector2, type MeshStandardMaterial } from "three";

export interface SharedWipe {
  uWipe: { value: number };
  uBand: { value: number };
  uPhoneInv: { value: Matrix4 };
  uWidth: { value: Vector2 };
  uHeight: { value: Vector2 };
  uScan: { value: number };
  uScanFade: { value: number };
}

export interface WipeColors {
  uFrom: { value: Color };
  uTo: { value: Color };
}

export function createSharedWipe(minX: number, maxX: number, minY: number, maxY: number): SharedWipe {
  return {
    uWipe: { value: 1.05 },
    uBand: { value: 0 },
    uPhoneInv: { value: new Matrix4() },
    uWidth: { value: new Vector2(minX, maxX) },
    uHeight: { value: new Vector2(minY, maxY) },
    uScan: { value: 0 },
    uScanFade: { value: 0 },
  };
}

export function createWipeColors(): WipeColors {
  return { uFrom: { value: new Color() }, uTo: { value: new Color() } };
}

export function patchWipe(material: MeshStandardMaterial, shared: SharedWipe, colors: WipeColors) {
  material.color.set("#ffffff");
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, shared, colors);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform mat4 uPhoneInv;\nvarying vec2 vPhone;")
      .replace(
        "#include <project_vertex>",
        "#include <project_vertex>\nvPhone = (uPhoneInv * modelMatrix * vec4(transformed, 1.0)).xy;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform vec3 uFrom;\nuniform vec3 uTo;\nuniform float uWipe;\nuniform float uBand;\nuniform vec2 uWidth;\nuniform vec2 uHeight;\nuniform float uScan;\nuniform float uScanFade;\nvarying vec2 vPhone;",
      )
      .replace(
        "vec4 diffuseColor = vec4( diffuse, opacity );",
        "float wipeS = clamp((vPhone.x - uWidth.x) / (uWidth.y - uWidth.x), 0.0, 1.0);\n" +
          "float scanS = clamp((uHeight.y - vPhone.y) / (uHeight.y - uHeight.x), 0.0, 1.0);\n" +
          "float scanned = step(scanS, uScan) * uScanFade;\n" +
          "float dither = mod(floor(gl_FragCoord.x) + floor(gl_FragCoord.y) * 2.0, 4.0) / 4.0;\n" +
          "if (dither < 0.55 * scanned) discard;\n" +
          "vec4 diffuseColor = vec4( diffuse * mix(uTo, uFrom, step(uWipe, wipeS)), opacity );",
      )
      .replace(
        "#include <emissivemap_fragment>",
        "#include <emissivemap_fragment>\n" +
          "totalEmissiveRadiance += vec3(0.82, 1.0, 0.9) * uBand * smoothstep(0.06, 0.0, abs(wipeS - uWipe));\n" +
          "totalEmissiveRadiance += vec3(0.24, 0.86, 0.52) * 1.6 * step(0.001, uScanFade) * smoothstep(0.012, 0.0, abs(scanS - uScan));",
      );
  };
  material.customProgramCacheKey = () => "imart-wipe";
  material.needsUpdate = true;
}
