// Runtime regressions against a running production build. Does not submit orders or messages.
// Run: BASE_URL=http://localhost:3000 node e2e/landing-runtime.e2e.mjs
import fs from "node:fs";
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = "e2e/.artifacts/welcome/runtime";
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const contexts = new Set();
const browser = await chromium.launch({
  channel: "msedge",
  headless: true,
  args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"],
});

function check(name, pass, detail = null) {
  const result = { name, pass: Boolean(pass), detail };
  results.push(result);
  console.log(`${result.pass ? "PASS" : "FAIL"} ${name}`);
  if (!result.pass && detail !== null) console.log(JSON.stringify(detail));
}

async function scenario(name, run) {
  console.log(`\n${name}`);
  try {
    await run();
  } catch (error) {
    check(`${name}: scenario completed`, false, error?.stack ?? String(error));
  } finally {
    for (const context of contexts) await context.close();
    contexts.clear();
  }
}

async function make({ forced = "", blocked = false, throttle = false, noGL = false, reducedMotion = "no-preference", failModel = false } = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion });
  contexts.add(context);
  await context.addInitScript(({ blocked, throttle, noGL }) => {
    sessionStorage.setItem("imart-boot", "1");
    if (blocked) {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === "imart-tier-cap") throw new DOMException("Audit denied storage", "SecurityError");
        return set.call(this, key, value);
      };
    }
    if (noGL) {
      const get = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        return /webgl/.test(type) ? null : get.call(this, type, ...args);
      };
    }
    if (throttle) {
      const native = requestAnimationFrame.bind(window);
      const cancel = cancelAnimationFrame.bind(window);
      let nextId = 0;
      const jobs = new Map();
      window.__auditDelay = 0;
      window.requestAnimationFrame = (callback) => {
        const id = ++nextId;
        const start = performance.now();
        const run = (time) => {
          if (!jobs.has(id)) return;
          if (time - start < window.__auditDelay) {
            jobs.set(id, native(run));
            return;
          }
          jobs.delete(id);
          callback(time);
        };
        jobs.set(id, native(run));
        return id;
      };
      window.cancelAnimationFrame = (id) => {
        cancel(jobs.get(id));
        jobs.delete(id);
      };
    }
  }, { blocked, throttle, noGL });
  const page = await context.newPage();
  if (failModel) await page.route("**/models/iphone.v1.glb", (route) => route.abort("failed"));
  await page.goto(`${BASE}/${forced}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.querySelector("main.landing")?.dataset.tier, null, { timeout: 10000 });
  return page;
}

const ready = (page) => page.waitForSelector('main[data-phone="ready"]', { timeout: 30000 });
const waitForTier = (page, tier, timeout = 15000) => page.waitForFunction(
  (expected) => document.querySelector("main.landing")?.dataset.tier === expected,
  tier,
  { timeout },
).catch(() => {});
const snap = (page) => page.evaluate(() => {
  const root = document.querySelector("main.landing");
  const poster = document.querySelector(".hero-poster");
  return {
    tier: root.dataset.tier,
    phone: root.dataset.phone,
    film: root.dataset.film ?? null,
    canvas: document.querySelectorAll(".phone-layer canvas").length,
    posterOpacity: getComputedStyle(poster).opacity,
    posterLoaded: poster.complete && poster.naturalWidth > 0,
    cap: sessionStorage.getItem("imart-tier-cap"),
    scroll: document.documentElement.dataset.scroll,
    entrance: document.documentElement.dataset.entrance,
    y: scrollY,
  };
});
const filmScroll = (page, fraction) => page.evaluate((progress) => {
  const section = document.querySelector(".landing-film");
  scrollTo(0, section.getBoundingClientRect().top + scrollY + progress * (section.offsetHeight - innerHeight));
}, fraction);
const loseContext = (page) => page.evaluate(() => {
  const canvas = document.querySelector(".phone-layer canvas");
  const extension = canvas?.getContext("webgl2")?.getExtension("WEBGL_lose_context");
  if (!extension) return false;
  extension.loseContext();
  return true;
});
const movement = (page) => page.evaluate(async () => {
  const track = document.querySelector(".visit-marquee-track");
  const x = () => new DOMMatrixReadOnly(getComputedStyle(track).transform).m41;
  const x1 = x();
  const start = performance.now();
  await new Promise((resolve) => setTimeout(resolve, 500));
  const x2 = x();
  // A seamless wrap is movement, not a sudden reversal or a speed spike.
  const wrapWidth = track.offsetWidth / 2;
  let distance = x2 - x1;
  if (distance > wrapWidth / 2) distance -= wrapWidth;
  if (distance < -wrapWidth / 2) distance += wrapWidth;
  return {
    x1, x2, distance,
    speed: distance / (performance.now() - start) * 1000,
    animation: getComputedStyle(track).animationName,
    marquee: document.querySelector("main.landing").hasAttribute("data-marquee"),
  };
});

try {
  await scenario("Marquee and local route", async () => {
    const page = await make({ forced: "?tier=high" });
    await ready(page);
    const route = page.locator(".visit-pin path").first();
    const originalRoute = await route.getAttribute("d");
    await page.locator(".visit").evaluate((element) => scrollTo(0, element.getBoundingClientRect().top + scrollY - innerHeight * 0.6));
    await page.waitForTimeout(2400);
    const idle = await movement(page);
    await page.mouse.wheel(0, 220);
    const burst = await movement(page);
    await page.waitForTimeout(2000);
    await page.mouse.wheel(0, -220);
    const reverse = await movement(page);
    check("marquee moves", Math.abs(idle.distance) > 1, idle);
    check("marquee connected to GSAP", idle.marquee && idle.animation === "none", idle);
    check("marquee accelerates after wheel", Math.abs(burst.speed) > Math.abs(idle.speed) * 1.2, { idle, burst });
    check("marquee reverses with scroll", Math.sign(reverse.speed) !== Math.sign(idle.speed), reverse);

    await page.waitForTimeout(1800);
    const before = await route.getAttribute("d");
    const visit = await page.locator(".visit").boundingBox();
    await page.mouse.move(1100, Math.max(150, visit.y + 250));
    await page.waitForTimeout(700);
    const after = await route.getAttribute("d");
    check("map reacts to desktop pointer", before !== after, { before, after });
    await page.mouse.move(0, 0);
    await page.waitForTimeout(1000);
    const settled = await route.getAttribute("d");
    check("map restores original route exactly after leave", settled === originalRoute, { originalRoute, settled });

    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(1500);
    const offscreen = await movement(page);
    check("marquee pauses offscreen", Math.abs(offscreen.distance) < 0.5, offscreen);
  });

  await scenario("Context loss and persistent failure cap", async () => {
    const page = await make();
    await ready(page);
    await filmScroll(page, 0.43);
    await page.waitForTimeout(1500);
    const before = await snap(page);
    check("context loss extension available", await loseContext(page));
    await page.waitForTimeout(2200);
    const after = await snap(page);
    check("context loss falls to Low and unpins", after.tier === "low" && after.film === null && after.canvas === 0, { before, after });
    check("context loss leaves opaque loaded poster", after.posterOpacity === "1" && after.posterLoaded, after);
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${OUT}/context-loss.png` });
    await page.reload({ waitUntil: "networkidle" });
    await waitForTier(page, "low");
    const reloaded = await snap(page);
    check("failure cap persists reload", reloaded.tier === "low", reloaded);
    await page.goto(`${BASE}/?tier=high`, { waitUntil: "networkidle" });
    await waitForTier(page, "high");
    const forced = await snap(page);
    check("query override pins High despite previous cap", forced.tier === "high", forced);
  });

  await scenario("Unavailable storage", async () => {
    const page = await make({ blocked: true });
    await ready(page);
    await filmScroll(page, 0.43);
    await page.waitForTimeout(900);
    check("storage fallback context loss extension available", await loseContext(page));
    await page.waitForTimeout(1800);
    const state = await snap(page);
    check("context fallback with unavailable storage", state.tier === "low" && state.film === null && state.canvas === 0, state);
  });

  await scenario("Sustained slow frames", async () => {
    const page = await make({ throttle: true });
    await ready(page);
    await page.waitForTimeout(4500);
    await page.evaluate(() => {
      window.__auditEvents = [];
      new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (["data-tier", "data-entrance", "data-boot"].includes(mutation.attributeName)) {
            window.__auditEvents.push({ attr: mutation.attributeName, value: mutation.target.getAttribute(mutation.attributeName), at: performance.now() });
          }
        }
      }).observe(document.documentElement, { subtree: true, attributes: true });
      window.__auditDelay = 50;
    });
    await waitForTier(page, "mid");
    const mid = await snap(page);
    check("slow frames step High to Mid", mid.tier === "mid", mid);
    await waitForTier(page, "low", 18000);
    await page.evaluate(() => { window.__auditDelay = 0; });
    await page.waitForTimeout(1200);
    const low = await snap(page);
    check("continued slow frames step Mid to Low", low.tier === "low" && low.canvas === 0 && low.film === null, low);
    check("performance downgrade restores poster", low.posterOpacity === "1" && low.posterLoaded, low);
    const events = await page.evaluate(() => window.__auditEvents);
    check("downgrade does not replay boot or entrance", !events.some((event) => event.attr === "data-boot" || event.attr === "data-entrance"), events);
    await page.screenshot({ path: `${OUT}/slow-frame-low.png` });
    await page.reload({ waitUntil: "networkidle" });
    await waitForTier(page, "low");
    const reloaded = await snap(page);
    check("performance cap persists reload", reloaded.tier === "low", reloaded);
  });

  for (const forced of [true, false]) {
    await scenario(forced ? "Forced tier monitoring exemption" : "Film monitoring exemption", async () => {
      const page = await make({ throttle: true, forced: forced ? "?tier=high" : "" });
      await ready(page);
      await page.waitForTimeout(4500);
      if (!forced) {
        await filmScroll(page, 0.43);
        await page.waitForTimeout(1500);
      }
      await page.evaluate(() => { window.__auditDelay = 50; });
      await page.waitForTimeout(10000);
      const state = await snap(page);
      check(forced ? "forced tier disables slow-frame monitor" : "film excludes slow-frame downgrade", state.tier === "high", state);
    });
  }

  await scenario("GLB load failure", async () => {
    const page = await make({ failModel: true });
    await page.waitForTimeout(3500);
    const state = await snap(page);
    check("GLB load failure uses Low poster", state.tier === "low" && state.film === null && state.canvas === 0 && state.posterOpacity === "1" && state.posterLoaded, state);
  });

  for (const settings of [{ noGL: true }, { reducedMotion: "reduce" }]) {
    const name = settings.noGL ? "No WebGL fallback" : "Initial reduced motion";
    await scenario(name, async () => {
      const page = await make(settings);
      await page.waitForTimeout(1500);
      const state = await snap(page);
      check(name, state.tier === "low" && state.canvas === 0 && state.film === null && state.posterOpacity === "1" && state.posterLoaded, state);
    });
  }

  await scenario("Live reduced motion", async () => {
    const page = await make();
    await ready(page);
    await page.waitForTimeout(2000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(1800);
    const state = await snap(page);
    check("live reduced motion restores poster", state.tier === "low" && state.canvas === 0 && state.film === null && state.posterOpacity === "1" && state.posterLoaded, state);
  });
} finally {
  await browser.close();
  fs.writeFileSync(`${OUT}/audit-results.json`, JSON.stringify(results, null, 2));
  const failed = results.filter((result) => !result.pass).length;
  console.log(`\n${results.length - failed}/${results.length} runtime checks passed; ${failed} failed.`);
  if (failed > 0) process.exitCode = 1;
}
