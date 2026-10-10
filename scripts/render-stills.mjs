// Renders the hero phone in each finish from the live scene (needs `npm run start`).
// Run: npm run stills:render
import fs from "node:fs";
import { chromium } from "playwright-core";
import sharp from "sharp";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const EDGE = process.env.EDGE_PATH ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const FINISHES = ["cosmic-orange", "deep-blue", "silver", "fallback"];
const VERSION = "v1";
const MAX_KB = 120;

fs.mkdirSync("public/renders", { recursive: true });
const browser = await chromium.launch({
  executablePath: EDGE,
  headless: true,
  args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"],
});
const context = await browser.newContext({ viewport: { width: 700, height: 1100 } });
// Skip the boot intro so the scene is fully lit.
await context.addInitScript(() => {
  try {
    sessionStorage.setItem("imart-boot", "1");
  } catch {}
});

let failed = false;
for (const id of FINISHES) {
  const page = await context.newPage();
  await page.goto(`${BASE}/?tier=high&capture=1&finish=${id}`, { waitUntil: "networkidle" });
  await page.waitForFunction(
    () => document.querySelector("main.landing")?.getAttribute("data-phone") === "ready" && typeof window.__imartCapture === "function",
    null,
    { timeout: 30000 },
  );
  await page.waitForTimeout(800);
  const dataUrl = await page.evaluate(() => window.__imartCapture());
  const png = Buffer.from(dataUrl.split(",")[1], "base64");
  const out = `public/renders/hero-${id}.${VERSION}.webp`;
  await sharp(png).resize({ height: 1100 }).webp({ quality: 82, alphaQuality: 90 }).toFile(out);
  const kb = Math.round(fs.statSync(out).size / 1024);
  console.log(`${out}  ${kb} KB`);
  if (kb > MAX_KB) failed = true;
  await page.close();
}
await browser.close();
if (failed) {
  console.error(`FAILED: a still is over ${MAX_KB} KB`);
  process.exit(1);
}
