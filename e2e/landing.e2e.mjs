// Landing page browser checks. Needs `npm run build && npm run start` running.
// Never submits an order (that would write to the live database).
import fs from "node:fs";
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const EDGE = process.env.EDGE_PATH ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const OUT = "e2e/.artifacts";
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const problems = [];
const check = (name, ok, detail = "") => results.push(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`);

const browser = await chromium.launch({
  executablePath: EDGE,
  headless: true,
  args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist"],
});

function watch(page, label) {
  page.on("console", (m) => {
    if (m.type() === "error") problems.push(`[${label}] console.error: ${m.text().slice(0, 300)}`);
  });
  page.on("pageerror", (e) => problems.push(`[${label}] pageerror: ${e.message.slice(0, 300)}`));
  page.on("response", (r) => {
    if (r.status() >= 500) problems.push(`[${label}] HTTP ${r.status()} ${r.url()}`);
  });
}
const landing = (page) => page.locator("main.landing");
const attr = (page, name) => landing(page).getAttribute(name);
const htmlScroll = (page) => page.evaluate(() => document.documentElement.dataset.scroll ?? null);
const headerBg = (page) => page.locator(".store-header").evaluate((el) => getComputedStyle(el).backgroundColor);
const noHorizontalScroll = (page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

// ---------- Desktop, high tier ----------
const desk = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const d = await desk.newPage();
watch(d, "desktop");
await d.goto(BASE + "/", { waitUntil: "networkidle" });

check("hero headline", (await d.getByRole("heading", { level: 1 }).textContent())?.includes("Your next"));
const price = (await d.locator(".hero-price strong").textContent().catch(() => null))?.trim() ?? null;
check("hero shows a live price", /^Rs\. [\d,]+$/.test(price ?? ""), price ?? "none");
const ctaHref = await d.locator(".hero-ctas .landing-cta").first().getAttribute("href");
check("primary CTA links to the hero product", ctaHref?.startsWith("/products/") === true, ctaHref ?? "");
const radios = d.getByRole("radio");
const radioCount = await radios.count();
check("finish picker offers finishes", radioCount >= 1, String(radioCount));
if (radioCount > 1) {
  await radios.nth(1).click();
  check("picking a finish updates aria-checked", (await radios.nth(1).getAttribute("aria-checked")) === "true");
}
check("stage starts at hero", (await attr(d, "data-stage")) === "hero");
check("tier is high on desktop", (await attr(d, "data-tier")) === "high");
check("header is transparent over the dark stage", (await headerBg(d)) === "rgba(0, 0, 0, 0)", await headerBg(d));
check("topbar hidden on the landing page", !(await d.locator(".store-topbar").isVisible()));
await d.locator("main.landing[data-phone='ready']").waitFor({ timeout: 30000 }).catch(() => {});
check("3D phone becomes ready", (await attr(d, "data-phone")) === "ready", await attr(d, "data-phone"));
check("smooth scroll on desktop", (await htmlScroll(d)) === "smooth", String(await htmlScroll(d)));
check("no horizontal scroll (1440px)", await noHorizontalScroll(d));
await d.waitForTimeout(1200);
await d.screenshot({ path: `${OUT}/p1-hero-desktop.png` });

await d.mouse.move(720, 450);
await d.mouse.wheel(0, 900);
await d.waitForTimeout(1500);
check("wheel scrolling moves the page", (await d.evaluate(() => window.scrollY)) > 300, String(await d.evaluate(() => window.scrollY)));
await d.screenshot({ path: `${OUT}/p1-film-desktop.png` });

// Anchor navigation must work with smooth scroll on (navbar/footer link to /#help).
await d.locator('.store-footer a[href="/#help"]').first().click();
await d.waitForTimeout(2500);
const helpTop = await d.locator("#help").evaluate((el) => el.getBoundingClientRect().top);
check("footer anchor scrolls to #help", helpTop >= -5 && helpTop < 400, `#help top=${Math.round(helpTop)}`);
check("stage becomes light in the store", (await attr(d, "data-stage")) === "light");
check("header turns white in the store", (await headerBg(d)) === "rgb(255, 255, 255)", await headerBg(d));
for (const id of ["services", "help", "visit"]) check(`section #${id} exists`, (await d.locator(`#${id}`).count()) === 1);
check("rail starts with iPhone", (await d.locator(".rail-tile .rail-label").first().textContent())?.trim() === "iPhone");
const tabs = d.locator(".showcase-tabs button");
if ((await tabs.count()) > 1) {
  await tabs.nth(1).click();
  check("showcase tab switches", (await tabs.nth(1).getAttribute("aria-pressed")) === "true");
}
await d.locator(".showcase").screenshot({ path: `${OUT}/p1-showcase-desktop.png` });

// Leaving the landing turns smooth scroll off; coming back turns it on again.
await d.locator(".showcase-grid .shop-product").first().click();
await d.waitForURL(/\/products\//, { timeout: 15000 });
await d.waitForTimeout(500);
check("smooth scroll off after leaving the landing", (await htmlScroll(d)) === "native", String(await htmlScroll(d)));
await d.goBack({ waitUntil: "networkidle" });
await d.waitForTimeout(800);
check("smooth scroll back on after returning", (await htmlScroll(d)) === "smooth", String(await htmlScroll(d)));

// ---------- Low tier (forced) ----------
const low = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const l = await low.newPage();
watch(l, "low");
await l.goto(BASE + "/?tier=low", { waitUntil: "networkidle" });
check("low tier: no 3D layer", (await l.locator(".phone-layer").count()) === 0);
check("low tier: poster image visible", await l.locator(".hero-poster").isVisible());
check("low tier: native scroll", (await htmlScroll(l)) === "native", String(await htmlScroll(l)));

// ---------- Reduced motion ----------
const calm = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const r = await calm.newPage();
watch(r, "reduced-motion");
await r.goto(BASE + "/", { waitUntil: "networkidle" });
check("reduced motion: low tier", (await attr(r, "data-tier")) === "low");
check("reduced motion: no 3D layer", (await r.locator(".phone-layer").count()) === 0);

// ---------- Mobile ----------
const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const m = await mob.newPage();
watch(m, "mobile");
await m.goto(BASE + "/", { waitUntil: "networkidle" });
check("mobile: mid tier", (await attr(m, "data-tier")) === "mid", String(await attr(m, "data-tier")));
check("mobile: native scroll", (await htmlScroll(m)) === "native", String(await htmlScroll(m)));
check("mobile: no horizontal scroll", await noHorizontalScroll(m), String(await m.evaluate(() => document.documentElement.scrollWidth)));
await m.locator("main.landing[data-phone='ready']").waitFor({ timeout: 30000 }).catch(() => {});
check("mobile: 3D phone becomes ready", (await attr(m, "data-phone")) === "ready", await attr(m, "data-phone"));
await m.waitForTimeout(1200);
await m.screenshot({ path: `${OUT}/p1-hero-mobile.png` });

// ---------- Shopping regression (no order submitted) ----------
const shop = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const s = await shop.newPage();
watch(s, "shop");
await s.goto(BASE + "/products/apple-iphone-17-pro", { waitUntil: "networkidle" });
await s.getByRole("button", { name: "Add to Cart" }).click();
check("cart: bag count updates", (await s.locator(".cart-count").textContent())?.trim() === "1");
await s.goto(BASE + "/checkout", { waitUntil: "networkidle" });
check("checkout lists the product", (await s.getByText("Apple iPhone 17 Pro").count()) > 0);

await browser.close();
console.log(results.join("\n"));
const failed = results.filter((x) => x.startsWith("FAIL")).length;
console.log(`\n${failed} failed / ${results.length} checks`);
console.log(problems.length ? "\nBrowser problems:\n" + [...new Set(problems)].join("\n") : "\nNo console errors, page errors or 5xx responses.");
process.exit(failed || problems.length ? 1 : 0);
