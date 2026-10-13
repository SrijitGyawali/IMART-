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
const htmlAttr = (page, name) => page.evaluate((n) => document.documentElement.getAttribute(n), name);
const htmlScroll = (page) => htmlAttr(page, "data-scroll");
const headerBg = (page) => page.locator(".store-header").evaluate((el) => getComputedStyle(el).backgroundColor);
// Compare with the device width: on phones an overflowing page widens the layout viewport itself.
const noHorizontalScroll = (page) => page.evaluate((w) => window.innerWidth === w && document.documentElement.scrollWidth <= w + 1, page.viewportSize().width);
const bootSettled = (page) => page.waitForFunction(() => document.documentElement.getAttribute("data-boot") !== "play", null, { timeout: 5000 });
const entranceDone = (page) => page.waitForFunction(() => document.documentElement.getAttribute("data-entrance") === "done", null, { timeout: 6000 }).catch(() => {});

// ---------- Server HTML: the landing header is dark from the first byte ----------
const html = await (await fetch(BASE + "/")).text();
check("SSR: header marked data-landing", /<header class="store-header" data-landing=""/.test(html));
check("SSR: no topbar on the landing page", !html.includes("store-topbar"));
check("SSR: boot gate script present", html.includes('data-boot'));

// ---------- Desktop, high tier, first visit (boot plays) ----------
const desk = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const d = await desk.newPage();
watch(d, "desktop");
await d.goto(BASE + "/", { waitUntil: "domcontentloaded" });
check("boot: plays on the first visit", (await htmlAttr(d, "data-boot")) === "play");
await d.waitForTimeout(500);
await d.screenshot({ path: `${OUT}/p2-boot-500ms.png` });
const bootStart = Date.now();
await bootSettled(d).catch(() => {});
check("boot: finishes within the cap", (await htmlAttr(d, "data-boot")) === "done", `${Date.now() - bootStart + 500} ms`);
check("boot: remembered for the session", (await d.evaluate(() => sessionStorage.getItem("imart-boot"))) === "1");
await entranceDone(d);
check("entrance: completes", (await htmlAttr(d, "data-entrance")) === "done");
check("entrance: headline visible", (await d.locator(".hero-title").evaluate((el) => getComputedStyle(el).opacity)) === "1");

check("hero headline", (await d.getByRole("heading", { level: 1 }).textContent())?.includes("Your next"));
const price = (await d.locator(".hero-price strong").textContent().catch(() => null))?.trim() ?? null;
check("hero shows a live price", /^Rs\. [\d,]+$/.test(price ?? ""), price ?? "none");
const ctaHref = await d.locator(".hero-ctas .landing-cta").first().getAttribute("href");
check("primary CTA links to the hero product", ctaHref?.startsWith("/products/") === true, ctaHref ?? "");
check("poster is a rendered still", (await d.locator(".hero-poster").getAttribute("src"))?.includes("renders%2Fhero-") === true);
check("stage starts at hero", (await attr(d, "data-stage")) === "hero");
check("tier is high on desktop", (await attr(d, "data-tier")) === "high");
check("header is transparent over the dark stage", (await headerBg(d)) === "rgba(0, 0, 0, 0)", await headerBg(d));
await d.locator("main.landing[data-phone='ready']").waitFor({ timeout: 30000 }).catch(() => {});
check("3D phone becomes ready", (await attr(d, "data-phone")) === "ready", await attr(d, "data-phone"));
// Scrolling is native everywhere (compositor-driven); StringTune only runs magnetic + parallax.
check("native scroll on desktop", (await htmlScroll(d)) === "native", String(await htmlScroll(d)));
check("no horizontal scroll (1440px)", await noHorizontalScroll(d));
await d.waitForTimeout(1800);
await d.screenshot({ path: `${OUT}/p2-hero-desktop.png` });

// Finish change (moment 02)
const radios = d.getByRole("radio");
const radioCount = await radios.count();
check("finish picker offers finishes", radioCount >= 1, String(radioCount));
if (radioCount > 2) {
  await radios.nth(2).click();
  await d.waitForTimeout(250);
  await d.screenshot({ path: `${OUT}/p2-finish-wipe-250ms.png` });
  check("picking a finish updates aria-checked", (await radios.nth(2).getAttribute("aria-checked")) === "true");
  check("poster follows the finish", (await d.locator(".hero-poster").getAttribute("src"))?.includes("silver") === true);
}

// Magnetic CTA
const cta = d.locator(".hero-ctas .landing-cta").first();
const box = await cta.boundingBox();
if (box) {
  await d.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2, { steps: 4 });
  await d.waitForTimeout(600);
  const mx = await cta.evaluate((el) => parseFloat(getComputedStyle(el).getPropertyValue("--magnetic-x")) || 0);
  check("magnetic CTA leans toward the pointer", mx > 0.5 && mx < 12, `--magnetic-x=${mx.toFixed(2)}`);
}

// Cursor
check("cursor ring present on desktop", (await d.locator(".cursor-ring").count()) === 1);

// Scroll hand-off
await d.mouse.move(720, 450);
await d.mouse.wheel(0, 450);
await d.waitForTimeout(1600);
const copyOpacity = await d.locator(".hero-copy").evaluate((el) => parseFloat(getComputedStyle(el).opacity));
check("hand-off: headline recedes on scroll", copyOpacity < 0.9, `opacity=${copyOpacity.toFixed(2)}`);
await d.screenshot({ path: `${OUT}/p2-handoff-desktop.png` });

await d.mouse.wheel(0, 900);
await d.waitForTimeout(1500);
check("wheel scrolling moves the page", (await d.evaluate(() => window.scrollY)) > 600, String(await d.evaluate(() => window.scrollY)));

// The pinned product film (moments 03–04)
check("film: pinned when motion is allowed", (await attr(d, "data-film")) === "pinned");
const scrollFilm = (f) =>
  d.evaluate((f) => {
    const s = document.querySelector(".landing-film");
    const top = s.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, top + f * (s.offsetHeight - window.innerHeight));
  }, f);
for (const [f, act] of [[0.14, 1], [0.36, 2], [0.73, 3], [0.89, 4]]) {
  await scrollFilm(f);
  await d.waitForTimeout(1400);
  const shown = await d.locator(".landing-film").getAttribute("data-act");
  const opacity = await d.locator(`.film-act[data-act="${act}"]`).evaluate((el) => parseFloat(getComputedStyle(el).opacity));
  check(`film: act 0${act} on screen at ${f}`, shown === String(act) && opacity > 0.5, `act=${shown} opacity=${opacity.toFixed(2)}`);
  if (act === 2) {
    const labels = await d.locator(".film-labels").evaluate((el) => parseFloat(getComputedStyle(el).opacity));
    check("film: layer labels shown while open", labels > 0.4, `opacity=${labels.toFixed(2)}`);
  }
  await d.screenshot({ path: `${OUT}/p3-film-act${act}.png` });
}
check("no horizontal scroll inside the film (1440px)", await noHorizontalScroll(d));

// The big transition (moment 05): the map's lines escape, white light floods, the lines become the store's guides.
await scrollFilm(0.93);
await d.waitForTimeout(1400);
await d.screenshot({ path: `${OUT}/p4-escape-93.png` });
await scrollFilm(0.97);
await d.waitForTimeout(1400);
const floodOpacity = await d.locator(".landing-flood").evaluate((el) => parseFloat(getComputedStyle(el).opacity));
check("transition: white flood covers the stage", floodOpacity > 0.9, `opacity=${floodOpacity.toFixed(2)}`);
const escape = await d.locator(".escape-lines").evaluate((el) => ({ shown: getComputedStyle(el).visibility === "visible", lines: el.querySelectorAll("line").length }));
check("transition: escaping lines on screen", escape.shown && escape.lines === 9, JSON.stringify(escape));
check("transition: header switches to its light look", (await attr(d, "data-flooded")) !== null);
await d.screenshot({ path: `${OUT}/p4-flood-97.png` });
await scrollFilm(0.995);
await d.waitForTimeout(1600);
const guide = await d.evaluate(() => ({
  x1: parseFloat(document.querySelector(".escape-lines line").getAttribute("x1")),
  tile: document.querySelector(".rail-tile").getBoundingClientRect().left,
}));
check("transition: lines land on the rail's edges", Math.abs(guide.x1 - guide.tile) < 2, `x1=${guide.x1} tile=${guide.tile.toFixed(1)}`);
await d.screenshot({ path: `${OUT}/p4-guides-100.png` });

// Anchor navigation (navbar/footer link to /#help).
await d.locator('.store-footer a[href="/#help"]').first().click();
await d.waitForTimeout(2500);
const helpTop = await d.locator("#help").evaluate((el) => el.getBoundingClientRect().top);
check("footer anchor scrolls to #help", helpTop >= -5 && helpTop < 400, `#help top=${Math.round(helpTop)}`);
check("stage becomes light in the store", (await attr(d, "data-stage")) === "light");
check("header turns white in the store", (await headerBg(d)) === "rgb(255, 255, 255)", await headerBg(d));
for (const id of ["services", "help", "visit"]) check(`section #${id} exists`, (await d.locator(`#${id}`).count()) === 1);
check("rail starts with iPhone", (await d.locator(".rail-tile .rail-label").first().textContent())?.trim() === "iPhone");
await d.locator(".rail-tile").first().hover();
await d.waitForTimeout(300);
check("cursor shows View over products", (await d.locator(".cursor-label").textContent()) === "View");

// The living store
const opacities = (sel) => d.locator(sel).evaluateAll((els) => els.map((el) => parseFloat(getComputedStyle(el).opacity)));
const reveal = async (sel, wait = 1600) => {
  await d.locator(sel).first().evaluate((el) => el.scrollIntoView({ block: "center" }));
  await d.waitForTimeout(wait);
};
await reveal(".rail-track");
check("store: rail tiles enter", (await opacities(".rail-tile")).every((o) => o === 1), (await opacities(".rail-tile")).join(","));
const tileBox = await d.locator(".rail-tile").first().boundingBox();
await d.mouse.move(tileBox.x + tileBox.width * 0.9, tileBox.y + tileBox.height * 0.2);
await d.waitForTimeout(250);
const lean = await d.locator(".rail-tile").first().evaluate((el) => el.style.getPropertyValue("--rx"));
check("store: rail tile leans toward the cursor", parseFloat(lean) > 0.5, `--rx=${lean}`);
await d.screenshot({ path: `${OUT}/p4-rail.png` });
await reveal(".showcase-grid");
check("store: product cards enter", (await opacities(".showcase-grid .shop-product")).every((o) => o === 1));
const tabs = d.locator(".showcase-tabs button");
if ((await tabs.count()) > 1) {
  await reveal(".showcase-tabs", 300);
  await tabs.nth(1).click();
  await d.waitForTimeout(1200);
  check("showcase tab switches", (await tabs.nth(1).getAttribute("aria-pressed")) === "true");
  const swapped = await opacities(".showcase-grid .shop-product");
  check("store: swapped shelf fully visible", swapped.length > 0 && swapped.every((o) => o === 1), swapped.join(","));
  await d.screenshot({ path: `${OUT}/p4-showcase.png` });
}
await reveal(".benefits");
check("store: benefits drawn in", (await opacities(".benefit > span")).every((o) => o === 1));
await reveal(".service-list", 2200);
const nums = (await d.locator(".service-num").allTextContents()).join(" ");
check("store: service numbers roll to 01 02 03", nums === "01 02 03", nums);
check("store: service lines drawn", await d.locator(".service-list").evaluate((el) => el.classList.contains("is-in")));
await reveal("#help", 600);
const firstFaq = d.locator(".faq-list details").first();
await firstFaq.locator("summary").click();
await d.waitForTimeout(700);
const opened = await firstFaq.evaluate((el) => ({ open: el.open, h: el.querySelector(".faq-answer").getBoundingClientRect().height }));
check("store: FAQ opens smoothly", opened.open && opened.h > 20, JSON.stringify(opened));
await d.screenshot({ path: `${OUT}/p4-faq.png` });
await firstFaq.locator("summary").click();
await d.waitForTimeout(700);
check("store: FAQ closes", !(await firstFaq.evaluate((el) => el.open)));
await reveal(".visit-body", 2200);
check("store: visit pin drawn", (await opacities(".visit-pin-dot"))[0] === 1);

// Leaving the landing and coming back keeps scrolling native and the landing working.
await d.locator(".showcase-grid .shop-product").first().click();
await d.waitForURL(/\/products\//, { timeout: 15000 });
await d.waitForTimeout(500);
check("other pages keep the normal header", (await d.locator(".store-header[data-landing]").count()) === 0);
await d.goBack({ waitUntil: "networkidle" });
await d.waitForTimeout(800);
check("native scroll after returning", (await htmlScroll(d)) === "native", String(await htmlScroll(d)));

// Second visit in the same session: no boot.
await d.goto(BASE + "/", { waitUntil: "domcontentloaded" });
check("boot: skipped on the second visit", (await htmlAttr(d, "data-boot")) === "skip");

await desk.close();

// ---------- Skip the boot with a click ----------
const skipCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const k = await skipCtx.newPage();
watch(k, "skip");
await k.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await k.waitForTimeout(150);
await k.mouse.click(200, 400);
await k.waitForTimeout(400);
check("boot: a click finishes it immediately", (await htmlAttr(k, "data-boot")) === "done");

await skipCtx.close();

// ---------- Low tier (forced) ----------
const low = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const l = await low.newPage();
watch(l, "low");
await l.goto(BASE + "/?tier=low", { waitUntil: "networkidle" });
await bootSettled(l).catch(() => {});
check("low tier: no 3D layer", (await l.locator(".phone-layer").count()) === 0);
check("low tier: poster image visible", await l.locator(".hero-poster").isVisible());
check("low tier: native scroll", (await htmlScroll(l)) === "native", String(await htmlScroll(l)));

await low.close();

// ---------- Reduced motion ----------
const calm = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
const r = await calm.newPage();
watch(r, "reduced-motion");
await r.goto(BASE + "/", { waitUntil: "networkidle" });
check("reduced motion: no boot", (await htmlAttr(r, "data-boot")) === "skip");
check("reduced motion: content never hidden", (await htmlAttr(r, "data-entrance")) !== "pending");
check("reduced motion: low tier", (await attr(r, "data-tier")) === "low");
check("reduced motion: no 3D layer", (await r.locator(".phone-layer").count()) === 0);
check("reduced motion: film stays a stacked story", (await attr(r, "data-film")) === null);
check("reduced motion: every act readable", (await r.locator(".film-act").evaluateAll((els) => els.every((el) => getComputedStyle(el).opacity === "1"))) === true);

await calm.close();

// ---------- Mobile ----------
const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const m = await mob.newPage();
watch(m, "mobile");
await m.goto(BASE + "/", { waitUntil: "networkidle" });
await bootSettled(m).catch(() => {});
check("mobile: mid tier", (await attr(m, "data-tier")) === "mid", String(await attr(m, "data-tier")));
// StringTune loads lazily; wait for it to report its mode rather than racing it.
await m.waitForFunction(() => document.documentElement.dataset.scroll !== undefined, null, { timeout: 8000 }).catch(() => {});
check("mobile: native scroll", (await htmlScroll(m)) === "native", String(await htmlScroll(m)));
check("mobile: no cursor ring", (await m.locator(".cursor-ring").count()) === 0);
check("mobile: no horizontal scroll", await noHorizontalScroll(m), String(await m.evaluate(() => document.documentElement.scrollWidth)));
await m.locator("main.landing[data-phone='ready']").waitFor({ timeout: 30000 }).catch(() => {});
check("mobile: 3D phone becomes ready", (await attr(m, "data-phone")) === "ready", await attr(m, "data-phone"));
await entranceDone(m);
await m.waitForTimeout(1200);
await m.screenshot({ path: `${OUT}/p2-hero-mobile.png` });
check("mobile: film pinned", (await attr(m, "data-film")) === "pinned");
for (const f of [0.36, 0.89]) {
  await m.evaluate((f) => {
    const s = document.querySelector(".landing-film");
    const top = s.getBoundingClientRect().top + window.scrollY;
    window.scrollTo(0, top + f * (s.offsetHeight - window.innerHeight));
  }, f);
  await m.waitForTimeout(1400);
  await m.screenshot({ path: `${OUT}/p3-film-mobile-${Math.round(f * 100)}.png` });
}
check("mobile: no horizontal scroll in the film", await noHorizontalScroll(m));

await mob.close();

// ---------- Shopping regression (no order submitted) ----------
const shop = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const s = await shop.newPage();
watch(s, "shop");
await s.goto(BASE + "/products/apple-iphone-17-pro", { waitUntil: "networkidle" });
check("product page keeps the topbar", await s.locator(".store-topbar").isVisible());
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
