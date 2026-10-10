// Turns the owner's 23.6 MB source model into the web model the landing page loads.
// Run: npm run model:build
import fs from "node:fs";
import path from "node:path";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, meshopt, prune, textureCompress } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
import sharp from "sharp";

const SRC = "assets-src/iphone-18-pro-max/source/iPhone 18 Pro Max 8.glb";
const OUT = "public/models/iphone.v1.glb";
const MAX_BYTES = 2.5 * 1024 * 1024;
const REQUIRED_MATERIALS = [
  "Anodized aluminum", "Frosted glass", "Tinted glass", "Glass", "OLED", "OLED off",
  "Display Frame", "Plastic antena", "Metal tint", "Camera Lens", "Lens Blades",
];

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });

const doc = await io.read(SRC);
const root = doc.getRoot();

// Aperture blades stay static: variable aperture is an iPhone 18 feature and the hero sells the 17 Pro.
for (const animation of root.listAnimations()) animation.dispose();

// The screen gets our own shader UI; drop the bundled third-party wallpaper.
const oled = root.listMaterials().find((m) => m.getName() === "OLED");
if (!oled) throw new Error("OLED material missing from the source model");
oled
  .setBaseColorTexture(null)
  .setEmissiveTexture(null)
  .setEmissiveFactor([0, 0, 0])
  .setBaseColorFactor([0.012, 0.014, 0.013, 1]);

await doc.transform(
  // keepAttributes: the screen's UVs look unused once the wallpaper is gone, but our screen UI needs them.
  prune({ keepAttributes: true }),
  dedup(),
  textureCompress({ encoder: sharp, targetFormat: "webp", resize: [1024, 1024], quality: 88, pattern: /Anodized/ }),
  // `pattern` is tested against the texture's name *and* URI (often empty), so name the small ones explicitly.
  textureCompress({ encoder: sharp, targetFormat: "webp", resize: [256, 256], quality: 88, pattern: /^(Concentrico|mesh normal|mesh color)$/ }),
  meshopt({ encoder: MeshoptEncoder, level: "medium" }),
);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
await io.write(OUT, doc);

// ---- Verify the output ----
const bytes = fs.statSync(OUT).size;
const out = (await io.read(OUT)).getRoot();
const problems = [];
const names = new Set(out.listMaterials().map((m) => m.getName()));
const missing = REQUIRED_MATERIALS.filter((n) => !names.has(n));
if (bytes > MAX_BYTES) problems.push(`output is ${(bytes / 1048576).toFixed(2)} MB (max 2.5 MB)`);
if (missing.length) problems.push(`missing materials: ${missing.join(", ")}`);
if (out.listAnimations().length) problems.push("animations were not removed");
const oledOut = out.listMaterials().find((m) => m.getName() === "OLED");
if (oledOut?.getBaseColorTexture() || oledOut?.getEmissiveTexture()) problems.push("OLED still has a texture");
const oledPrims = out.listMeshes().flatMap((mesh) => mesh.listPrimitives()).filter((p) => p.getMaterial()?.getName() === "OLED");
if (!oledPrims.length || oledPrims.some((p) => !p.getAttribute("TEXCOORD_0"))) problems.push("OLED lost its UVs (TEXCOORD_0)");
const used = out.listExtensionsUsed().map((e) => e.extensionName);
for (const ext of ["EXT_meshopt_compression", "EXT_texture_webp"]) {
  if (!used.includes(ext)) problems.push(`missing ${ext}`);
}

console.log(`model: ${OUT}  ${(bytes / 1048576).toFixed(2)} MB`);
for (const t of out.listTextures()) {
  const kb = Math.round((t.getImage()?.byteLength ?? 0) / 1024);
  console.log(`  texture ${t.getName() || "(unnamed)"}: ${t.getMimeType()} ${kb} KB ${t.getSize()?.join("x") ?? "?"}`);
}
if (problems.length) {
  console.error("FAILED:\n- " + problems.join("\n- "));
  process.exit(1);
}
console.log("OK");
