import { CanvasTexture, Color, LinearFilter, type MeshStandardMaterial, type Texture } from "three";
import { glslStreets, SCREEN_ASPECT, STREETS } from "../film/streets";

export interface ScreenUniforms {
  uWelcome: { value: number };
  uWelcomeCollapse: { value: number };
  uFinishTint: { value: Color };
  uLBrand: { value: number[] };
  uLHello: { value: number[] };
  uLButwal: { value: number[] };
  uLAmarpath: { value: number[] };
  uPower: { value: number };
  uPayCard: { value: number };
  uPay: { value: number };
  uQr: { value: number };
  uQrCollapse: { value: number };
  uMorph: { value: number };
  uMap: { value: number };
  uNotify: { value: number };
  uTime: { value: number };
  uUi: { value: number };
  uAtlas: { value: Texture | null };
  uLCash: { value: number[] };
  uLQr: { value: number[] };
  uLReady: { value: number[] };
  uLHome: { value: number[] };
  uLPickup: { value: number[] };
  uLConfirmed: { value: number[] };
}

const LABELS = {
  uLCash: "CASH",
  uLQr: "QR",
  uLReady: "PAYMENT READY",
  uLHome: "HOME DELIVERY IN BUTWAL",
  uLPickup: "PICKUP AT AMARPATH",
  uLConfirmed: "ORDER CONFIRMED",
  uLBrand: "iMart.",
  uLHello: "Hello,",
  uLButwal: "Butwal.",
  uLAmarpath: "AMARPATH",
} as const;

const ATLAS_W = 1024;
const ATLAS_H = 1024;
const ROW = 64;
const disposed = new WeakSet<ScreenUniforms>();

function buildAtlas(uniforms: ScreenUniforms) {
  if (disposed.has(uniforms)) return;
  const canvas = document.createElement("canvas");
  canvas.width = ATLAS_W;
  canvas.height = ATLAS_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const family = getComputedStyle(document.body).fontFamily || "sans-serif";
  ctx.font = `600 40px ${family}`;
  if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "4px";
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  Object.entries(LABELS).forEach(([key, text], row) => {
    if ("letterSpacing" in ctx) ctx.letterSpacing = key === "uLHello" || key === "uLButwal" || key === "uLBrand" ? "-1px" : "4px";
    const width = Math.min(ctx.measureText(text).width + 8, ATLAS_W - 8);
    ctx.fillText(text, 4, row * ROW + ROW / 2);
    const rect = uniforms[key as keyof typeof LABELS].value;
    rect.splice(0, 4, 0, (row * ROW) / ATLAS_H, width / ATLAS_W, ROW / ATLAS_H);
  });
  const texture = new CanvasTexture(canvas);
  texture.flipY = false;
  texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  uniforms.uAtlas.value = texture;
}

export function createScreenUniforms(): ScreenUniforms {
  const rect = () => ({ value: [0, 0, 0, 0] });
  const uniforms: ScreenUniforms = {
    uWelcome: { value: 1 },
    uWelcomeCollapse: { value: 0 },
    uFinishTint: { value: new Color("#D86A2B") },
    uLBrand: rect(), uLHello: rect(), uLButwal: rect(), uLAmarpath: rect(),
    uPower: { value: 1 },
    uPayCard: { value: 0 },
    uPay: { value: 0 },
    uQr: { value: 0 },
    uQrCollapse: { value: 0 },
    uMorph: { value: 0 },
    uMap: { value: 0 },
    uNotify: { value: 0 },
    uTime: { value: 0 },
    uUi: { value: 0 },
    uAtlas: { value: null },
    uLCash: rect(),
    uLQr: rect(),
    uLReady: rect(),
    uLHome: rect(),
    uLPickup: rect(),
    uLConfirmed: rect(),
  };
  const draw = () => buildAtlas(uniforms);
  if (!document.fonts || document.fonts.status === "loaded") draw();
  else document.fonts.ready.then(draw);
  return uniforms;
}

const SCREEN_GLSL = `
uniform float uPower; uniform float uPayCard; uniform float uPay; uniform float uQr; uniform float uQrCollapse;
uniform float uMorph; uniform float uMap; uniform float uNotify; uniform float uTime; uniform float uUi;
uniform sampler2D uAtlas;
uniform float uWelcome; uniform float uWelcomeCollapse; uniform vec3 uFinishTint;
uniform vec4 uLBrand; uniform vec4 uLHello; uniform vec4 uLButwal; uniform vec4 uLAmarpath;
uniform vec4 uLCash; uniform vec4 uLQr; uniform vec4 uLReady; uniform vec4 uLHome; uniform vec4 uLPickup; uniform vec4 uLConfirmed;

#define SCREEN_ASPECT ${SCREEN_ASPECT}
#define ATLAS_ASPECT 1.0

float sdSegment(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
float sdRoundBox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float fillSd(float d) { return smoothstep(0.0025, -0.0025, d); }

float drawLabel(vec2 p, vec2 c, float h, vec4 r) {
  if (r.z <= 0.0) return 0.0;
  float w = h * (r.z / r.w) * ATLAS_ASPECT;
  vec2 t = (p - c) / vec2(w, h) + 0.5;
  if (t.x < 0.0 || t.x > 1.0 || t.y < 0.0 || t.y > 1.0) return 0.0;
  return texture2D(uAtlas, r.xy + vec2(t.x, 1.0 - t.y) * r.zw).a;
}

${glslStreets()}

vec3 screenUI(vec2 uv) {
  vec2 s = vec2(uv.x, 1.0 - uv.y);
  vec2 p = (s - 0.5) * vec2(SCREEN_ASPECT, 1.0);
  vec3 green = vec3(0.24, 0.86, 0.52);

  float r = length(p * vec2(1.0, 0.8));
  vec3 col = mix(vec3(0.025, 0.14, 0.085), vec3(0.003, 0.012, 0.008), smoothstep(0.0, 0.55, r));
  col += uFinishTint * exp(-length((p - vec2(0.20, -0.22)) * vec2(3.0, 1.2)) * 4.0) * 0.14 * uWelcome;
  col *= 1.0 - 0.82 * uUi;

  if (uWelcome > 0.001) {
    vec3 ivory = vec3(0.91, 0.94, 0.86);
    vec3 mint = vec3(0.46, 0.80, 0.61);
    float lettering = uWelcome * (1.0 - smoothstep(0.0, 0.48, uWelcomeCollapse));
    col = mix(col, mint, drawLabel(p, vec2(0.0, 0.32), 0.045, uLBrand) * lettering);
    col = mix(col, ivory, drawLabel(p, vec2(0.0, 0.15), 0.108, uLHello) * lettering);
    col = mix(col, ivory, drawLabel(p, vec2(0.0, 0.045), 0.108, uLButwal) * lettering);
    float extent = max(0.001, 1.0 - uWelcomeCollapse);
    vec2 origin = vec2(0.06, -0.20);
    vec2 a = origin + vec2(-0.20, 0.10) * extent;
    vec2 b = origin + vec2(-0.11, 0.10) * extent;
    vec2 c = origin + vec2(-0.11, 0.0) * extent;
    vec2 d = origin;
    float route = min(min(sdSegment(p, a, b), sdSegment(p, b, c)), sdSegment(p, c, d));
    col = mix(col, mint * 0.85, (1.0 - smoothstep(0.001, 0.003, route)) * uWelcome);
    float dot = length(p - origin);
    col = mix(col, ivory, (1.0 - smoothstep(0.008, 0.012, dot)) * uWelcome);
    col += mint * exp(-dot * 65.0) * 0.15 * uWelcome;
    col = mix(col, mint, drawLabel(p, vec2(0.0, -0.31), 0.028, uLAmarpath) * lettering);
  }

  if (uPayCard > 0.001) {
    float card = sdRoundBox(p - vec2(0.0, -0.18), vec2(0.17, 0.11), 0.03);
    col = mix(col, vec3(0.03, 0.06, 0.05), fillSd(card) * 0.85 * uPayCard);
    float hl = sdRoundBox(p - vec2(0.0, mix(-0.13, -0.23, uPay)), vec2(0.15, 0.038), 0.03);
    col = mix(col, green * 0.85, fillSd(hl) * uPayCard);
    col = mix(col, vec3(1.0), drawLabel(p, vec2(0.0, -0.13), 0.034, uLCash) * uPayCard);
    col = mix(col, vec3(1.0), drawLabel(p, vec2(0.0, -0.23), 0.034, uLQr) * uPayCard);
  }

  vec2 q = p - vec2(0.0, 0.08);
  if (uQr > 0.001 && uQrCollapse < 0.999) {
    float size = 0.17 * (1.0 - uQrCollapse);
    vec2 cell = floor((q / max(size, 1e-4) + 0.5) * 21.0);
    float inside = step(abs(q.x), size * 0.5) * step(abs(q.y), size * 0.5);
    float on = step(0.5, hash2(cell)) * inside;
    col = mix(col, vec3(0.92), on * uQr * (1.0 - uQrCollapse));
  }

  float shapeOn = max(smoothstep(0.6, 1.0, uQrCollapse), step(0.001, uMorph));
  if (shapeOn > 0.0) {
    float dDot = length(q) - 0.035;
    float dCheck = min(sdSegment(q, vec2(-0.05, 0.0), vec2(-0.012, -0.04)), sdSegment(q, vec2(-0.012, -0.04), vec2(0.06, 0.05))) - 0.012;
    vec2 pq = q - vec2(0.0, 0.02);
    float dHead = length(pq) - 0.045;
    float dTail = max(abs(pq.x) - (pq.y + 0.09) * 0.5, max(-(pq.y + 0.09), pq.y));
    float dPin = max(min(dHead, dTail), -(length(pq) - 0.016));
    float d = uMorph < 1.0 ? mix(dDot, dCheck, uMorph) : mix(dCheck, dPin, uMorph - 1.0);
    col = mix(col, green, fillSd(d) * shapeOn);
    col += green * exp(-max(d, 0.0) * 38.0) * 0.35 * shapeOn;
    float ready = smoothstep(0.7, 1.0, uMorph) * (1.0 - smoothstep(1.2, 1.5, uMorph));
    col = mix(col, vec3(1.0), drawLabel(p, vec2(0.0, -0.05), 0.028, uLReady) * ready);
  }

  if (uMap > 0.001) {
    float lines = 0.0;
    for (int i = 0; i < ${STREETS.length}; i++) {
      float f = clamp(uMap * ${STREETS.length}.0 - float(i), 0.0, 1.0);
      if (f <= 0.0) continue;
      vec2 a = STREETS[i].xy;
      vec2 b = mix(a, STREETS[i].zw, f);
      lines = max(lines, smoothstep(0.004, 0.0, sdSegment(p, a, b)));
    }
    col = mix(col, green * 0.9, lines * 0.85);
    float pulse = fract(uTime * 0.7);
    float ring = abs(length(q - vec2(0.0, -0.07)) - pulse * 0.12) - 0.003;
    col += green * fillSd(ring) * (1.0 - pulse) * smoothstep(0.3, 0.6, uMap);
    float labels = smoothstep(0.5, 1.0, uMap);
    float plate = sdRoundBox(p - vec2(0.0, -0.295), vec2(0.205, 0.05), 0.02);
    col = mix(col, vec3(0.02, 0.04, 0.03), fillSd(plate) * 0.9 * labels);
    col = mix(col, vec3(1.0), drawLabel(p, vec2(0.0, -0.27), 0.026, uLHome) * labels);
    col = mix(col, vec3(0.75), drawLabel(p, vec2(0.0, -0.32), 0.022, uLPickup) * labels);
  }

  if (uNotify > 0.001) {
    vec2 c = vec2(0.0, mix(0.58, 0.41, uNotify));
    float banner = sdRoundBox(p - c, vec2(0.2, 0.034), 0.02);
    col = mix(col, vec3(0.06, 0.09, 0.08), fillSd(banner) * 0.92);
    col = mix(col, green, fillSd(length(p - c - vec2(-0.165, 0.0)) - 0.008));
    col = mix(col, vec3(1.0), drawLabel(p, c + vec2(0.02, 0.0), 0.024, uLConfirmed));
  }
  return col * uPower;
}
`;

export function patchScreen(material: MeshStandardMaterial, uniforms: ScreenUniforms) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${SCREEN_GLSL}`)
      .replace("#include <emissivemap_fragment>", "totalEmissiveRadiance = screenUI( vEmissiveMapUv );");
  };
  material.customProgramCacheKey = () => "imart-screen";
  material.needsUpdate = true;
}

export function disposeScreen(uniforms: ScreenUniforms) {
  disposed.add(uniforms);
  uniforms.uAtlas.value?.dispose();
}
