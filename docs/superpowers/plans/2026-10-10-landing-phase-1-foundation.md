# Landing Phase 1 (Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the new landing page's foundation in place:
- the dark-stage → light-store page structure, with every word server-rendered;
- the optimized phone model rendering live in the hero;
- the motion infrastructure (tiers, StringTune smooth scroll, GSAP registration, scene store);
- header stages.

Phases 2–5 (signature moments) build on this.

**Architecture:**
- `src/app/(store)/page.tsx` stays a server component. It builds plain props with pure functions from `src/components/landing/data.ts` and renders server sections inside a client `LandingExperience`.
- `LandingExperience` owns the quality tier (`useSyncExternalStore`), StringTune, the stage observer and pointer tracking.
- It lazy-loads a fixed `PhoneLayer` that renders the meshopt-compressed GLB with React Three Fiber.
- Header restyling uses CSS `:has()`, so it's correct in the server HTML (no layout shift).

**Tech Stack:**
- Next.js 16.2.9 (App Router, Turbopack, React Compiler), React 19.2.4
- three 0.186.1, @react-three/fiber 9.8.1, @react-three/drei 10.7.9
- gsap 3.15.0 + @gsap/react 2.1.2, animejs 4.5.0, @fiddle-digital/string-tune 1.2.6
- Pipeline: @gltf-transform 4.5.0, meshoptimizer 1.3.0, sharp 0.35.4
- Tests: Node's built-in test runner (TypeScript type stripping) and playwright-core 1.63.0 driving installed Edge

**Spec:** `docs/superpowers/specs/2026-10-10-cinematic-landing-design.md`

**Scope note:** the spec lists the rendered stills under Phase 1. They're moved to Phase 2, because the stills must be rendered from the real hero scene (lighting and finishes), which Phase 2 builds. Until then the hero poster is the hero product's photo.

## Global Constraints

- **Allowed claims only:** genuine products · sealed / new in box (phones) · warranty included. Never "authorized", "Apple Authorized Reseller", stats, reviews, ratings, offers or guarantees.
- **Prices** come from the database only; if missing, nothing is shown. No fallback amounts anywhere.
- **Hero product** = first active, in-stock product with images among `apple-iphone-17-pro`, `apple-iphone-17-pro-max`; else the first such product in category `iphone`.
- **CTA label** = product name without a leading "Apple ".
- **Rail and tabs:** categories with active products, plus "Mac" by `/macbook/i`. Order: iPhone, Mac, then the rest by name.
- **Phone screen:** the model's third-party wallpaper is removed. Blade animation is removed and the blades stay static.
- **Model:** `public/models/iphone.v1.glb`, ≤ 2.5 MB; the original lives in git-ignored `assets-src/`.
- **Caching:** `/models/*` and `/renders/*` are served `Cache-Control: public, max-age=31536000, immutable`.
- **One scroll system:** StringTune `smooth` on desktop fine pointers, native (`default`) elsewhere. Started once per page load and never destroyed; release switches it to native.
- **Tiers:** `low` = no WebGL2, reduced motion, Save-Data or deviceMemory < 4. `mid` = coarse pointer, < 4 cores or deviceMemory < 8. Else `high`. `?tier=` overrides.
- **Client props:** only public catalogue fields cross into client components (`toPublicProduct`).
- **Existing anchors** `#services`, `#help` and `#visit` keep working (navbar and footer link to them).
- **Teardown:** all setup lives in effects, and the cleanups undo it.

---

## File Structure

| File | Responsibility |
|---|---|
| `scripts/build-phone-model.mjs` | Source GLB → `public/models/iphone.v1.glb` with assertions |
| `src/components/landing/data.ts` | Pure data rules: hero, finishes, rail, shelves, promos, public product |
| `src/components/landing/data.test.ts` | Unit tests for `data.ts` |
| `src/components/landing/config.ts` | Model URL and motion tokens |
| `src/components/landing/motion/tier.ts` | Pure tier decision and browser input reader |
| `src/components/landing/motion/tier.test.ts` | Unit tests for `tier.ts` |
| `src/components/landing/motion/use-tier.ts` | `useTier()` via `useSyncExternalStore` |
| `src/components/landing/motion/gsap.ts` | One-time GSAP + ScrollTrigger registration |
| `src/components/landing/motion/string-tune.ts` | StringTune acquire/release adapter |
| `src/components/landing/scene-store.ts` | Mutable scene state shared with the 3D scene |
| `src/components/landing/landing-experience.tsx` | Client root: tier, scroll, stages, pointer, phone layer |
| `src/components/landing/landing.css` | All landing styles, including header stage overrides |
| `src/components/landing/hero/hero-stage.tsx` | Server hero markup |
| `src/components/landing/hero/finish-picker.tsx` | Client radiogroup writing `scene.finish` |
| `src/components/landing/film/product-film.tsx` | Server four-act copy (unpinned in Phase 1) |
| `src/components/landing/store/*.tsx` | Rail, showcase (client), benefits, promos, services, FAQ, visit |
| `src/components/landing/three/phone-layer.tsx` | Fixed layer + error boundary + lazy canvas |
| `src/components/landing/three/phone-canvas.tsx` | R3F Canvas, studio lighting |
| `src/components/landing/three/phone-model.tsx` | GLB load, orientation, placement, finish, idle |
| `e2e/landing.e2e.mjs` | Browser checks against `next start` |
| Removed | `store-hero`, `home-products`, `smooth-scroll`, `scroll-progress`, `custom-cursor`, `magnetic`, `reveal`, `ripple`, `tilt-card`, `stats-counter`, `phone-trio`; deps `lenis`, `framer-motion` |

---

### Task 0: Feature branch

- [ ] **Step 1: Create the branch**

```bash
git switch -c cinematic-landing
```
Expected: `Switched to a new branch 'cinematic-landing'`

---

### Task 1: Dependencies, configuration, cleanup

**Files:**
- Modify: `package.json`, `tsconfig.json`, `next.config.ts`, `.gitignore`, `src/app/layout.tsx`, `src/app/globals.css`
- Delete: `src/components/{smooth-scroll,scroll-progress,custom-cursor,magnetic,reveal,ripple,tilt-card,stats-counter,phone-trio}.tsx`
- Move: `src/components/iphone-18-pro-max/` → `assets-src/iphone-18-pro-max/`

**Interfaces:** Produces the `test`, `e2e` and `model:build` npm scripts, plus `allowImportingTsExtensions` (test files import `./x.ts`).

- [ ] **Step 1: Install and remove packages**

```bash
npm i --save-exact three@0.186.1 @react-three/fiber@9.8.1 @react-three/drei@10.7.9 gsap@3.15.0 @gsap/react@2.1.2 animejs@4.5.0 @fiddle-digital/string-tune@1.2.6
npm i -D --save-exact @types/three@0.186.0 @gltf-transform/core@4.5.0 @gltf-transform/extensions@4.5.0 @gltf-transform/functions@4.5.0 meshoptimizer@1.3.0 sharp@0.35.4 playwright-core@1.63.0
npm uninstall lenis framer-motion
```

- [ ] **Step 2: Add scripts to `package.json`** (inside `"scripts"`, after `"lint"`)

```json
    "test": "node --test \"src/**/*.test.ts\"",
    "e2e": "node e2e/landing.e2e.mjs",
    "model:build": "node scripts/build-phone-model.mjs"
```

- [ ] **Step 3: `tsconfig.json`** — add to `compilerOptions` after `"noEmit": true,`

```json
    "allowImportingTsExtensions": true,
```

- [ ] **Step 4: `next.config.ts`** — full file

```ts
import type { NextConfig } from "next";

const immutable = [
  { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
];

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Model and stills use versioned file names, so they can be cached forever.
  async headers() {
    return [
      { source: "/models/:path*", headers: immutable },
      { source: "/renders/:path*", headers: immutable },
    ];
  },
};

export default nextConfig;
```

- [ ] **Step 5: `.gitignore`** — append

```
# 3D source assets (large originals; optimized outputs live in public/)
/assets-src/

# e2e screenshots
/e2e/.artifacts/
```

- [ ] **Step 6: Move the source model and delete dead components**

```bash
mkdir -p assets-src && mv src/components/iphone-18-pro-max assets-src/
git rm -q src/components/smooth-scroll.tsx src/components/scroll-progress.tsx src/components/custom-cursor.tsx src/components/magnetic.tsx src/components/reveal.tsx src/components/ripple.tsx src/components/tilt-card.tsx src/components/stats-counter.tsx src/components/phone-trio.tsx
```

- [ ] **Step 7: Fix the false "authorized" claim** in `src/app/layout.tsx` — replace the `description` value

```ts
  description:
    "iMart in Amarpath, Butwal: genuine iPhones, Mac, accessories and repairs. Home delivery in Butwal or pickup from our store.",
```

- [ ] **Step 8: Remove landing-only globals that are now unused.** For each of `glass`, `hero-glow`, `fade-up`, `float`, `reveal`, `iridescent-line`, run `grep -rn "\b<name>\b" src --include=*.tsx`. Delete the rule (and its `@keyframes`) from `src/app/globals.css` only when there are zero hits outside `globals.css`.

- [ ] **Step 9: Verify**

Run: `npx tsc --noEmit && npx next build`
Expected: exit 0; route list printed (the home page still uses the old hero until Task 5).

- [ ] **Step 10: Commit**

```bash
git add -A package.json package-lock.json tsconfig.json next.config.ts .gitignore src/app/layout.tsx src/app/globals.css src/components
git commit -m "chore(landing): add 3D/motion deps, cache headers, remove unused animation components"
```

---

### Task 2: Web model pipeline

**Files:**
- Create: `scripts/build-phone-model.mjs`
- Create (generated, committed): `public/models/iphone.v1.glb`

**Interfaces:** Produces `/models/iphone.v1.glb`. Materials keep their source names (`Anodized aluminum`, `Frosted glass`, `OLED`, …), and Phase 3 relies on them.

- [ ] **Step 1: Write the script** — `scripts/build-phone-model.mjs`

```js
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
  prune(),
  dedup(),
  textureCompress({ encoder: sharp, targetFormat: "webp", resize: [1024, 1024], quality: 88, pattern: /Anodized/ }),
  textureCompress({ encoder: sharp, targetFormat: "webp", resize: [256, 256], quality: 88, pattern: /^(?!Anodized)/ }),
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
```

- [ ] **Step 2: Run it**

Run: `npm run model:build`
Expected: the line `model: public/models/iphone.v1.glb  X.XX MB` with X.XX ≤ 2.50, four WebP textures listed, final line `OK`.

- [ ] **Step 3: Commit**

```bash
git add scripts/build-phone-model.mjs public/models/iphone.v1.glb
git commit -m "feat(landing): optimized web phone model pipeline (23.6 MB -> web GLB)"
```

---

### Task 3: Landing data rules

**Files:**
- Create: `src/components/landing/data.ts`
- Test: `src/components/landing/data.test.ts`

**Interfaces:**
- Consumes: `Product` and `Category` from `@/lib/types` (type-only).
- Produces:
  - **Constants:** `HERO_SLUGS: string[]`; `FALLBACK_FINISH: Omit<Finish,"id"|"label">`.
  - **Types:**
    - `Finish {id,label,aluminium,glass,metalness,roughness}`
    - `HeroData {name,displayName,slug,price:number|null,image:string|null,finishes:Finish[],isPro:boolean,word:string}`
    - `RailItem {key,label,href,image:string|null}`
    - `Shelf {key,label,productIds:string[]}`
    - `Promo {key,eyebrow,title,body,href,linkLabel,image:string|null,alt}`
  - **Functions:**
    - `displayName(name)`, `parseFinishes(color)`
    - `pickHeroProduct(products, categories)`, `buildHero(product)`
    - `buildRail(categories, products, hero)`, `buildShelves(categories, products)`
    - `buildPromos(products)`, `toPublicProduct(p)`

- [ ] **Step 1: Write the failing tests** — `src/components/landing/data.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Category, Product } from "@/lib/types";
import {
  buildHero, buildPromos, buildRail, buildShelves, displayName,
  parseFinishes, pickHeroProduct, toPublicProduct,
} from "./data.ts";

const product = (o: Partial<Product>): Product => ({
  id: "id", name: "", slug: "", price: 0, description: "", category_id: null,
  images: ["https://x.supabase.co/a.jpg"], stock: 5, featured: false, active: true,
  created_at: "2026-01-01", ...o,
});

const categories: Category[] = [
  { id: "c-acc", name: "Accessories", slug: "accessories" },
  { id: "c-cases", name: "Cases", slug: "cases" },
  { id: "c-chg", name: "Chargers", slug: "chargers" },
  { id: "c-iph", name: "iPhone", slug: "iphone" },
];

const products: Product[] = [
  product({ id: "p16", name: "Apple iPhone 16", slug: "apple-iphone-16", price: 146599, category_id: "c-iph" }),
  product({ id: "pro", name: "Apple iPhone 17 Pro", slug: "apple-iphone-17-pro", price: 236899, category_id: "c-iph", color: "Cosmic Orange, Deep Blue, Silver" }),
  product({ id: "max", name: "Apple iPhone 17 Pro Max", slug: "apple-iphone-17-pro-max", price: 257999, category_id: "c-iph", color: "Cosmic orange,Deep blue,Silver" }),
  product({ id: "air", name: "Apple iPhone Air", slug: "apple-iphone-air", price: 190699, category_id: "c-iph" }),
  product({ id: "mac", name: 'Apple MacBook Neo 13"', slug: "apple-macbook-neo-13", price: 135000, category_id: null }),
  product({ id: "adp", name: "Apple USB-C 20W Power Adapter", slug: "apple-usb-c-20w-power-adapter", price: 4500, category_id: "c-chg" }),
  product({ id: "jack", name: "Apple USB-C to 3.5 mm Headphone Jack Adapter", slug: "jack", price: 2500, category_id: "c-acc" }),
];

test("displayName strips a leading Apple", () => {
  assert.equal(displayName("Apple iPhone 17 Pro"), "iPhone 17 Pro");
  assert.equal(displayName("Srijit Gyawali"), "Srijit Gyawali");
});

test("parseFinishes normalises names and maps the palette", () => {
  const finishes = parseFinishes("Cosmic orange,Deep blue, Silver ,silver");
  assert.deepEqual(finishes.map((f) => f.label), ["Cosmic Orange", "Deep Blue", "Silver"]);
  assert.deepEqual(finishes.map((f) => f.id), ["cosmic-orange", "deep-blue", "silver"]);
  assert.equal(finishes[0].aluminium, "#D86A2B");
  assert.equal(parseFinishes("Sage")[0].aluminium, "#3A3B3E");
  assert.deepEqual(parseFinishes(undefined), []);
  assert.deepEqual(parseFinishes(" , "), []);
});

test("pickHeroProduct prefers the 17 Pro, then the Pro Max, then any iPhone", () => {
  assert.equal(pickHeroProduct(products, categories)?.id, "pro");
  const proGone = products.map((p) => (p.id === "pro" ? { ...p, stock: 0 } : p));
  assert.equal(pickHeroProduct(proGone, categories)?.id, "max");
  const bothGone = proGone.map((p) => (p.id === "max" ? { ...p, active: false } : p));
  assert.equal(pickHeroProduct(bothGone, categories)?.id, "p16");
  const noImages = products.map((p) => ({ ...p, images: [] }));
  assert.equal(pickHeroProduct(noImages, categories), null);
});

test("buildHero exposes display data and hides missing prices", () => {
  const hero = buildHero(products[1]);
  assert.equal(hero?.displayName, "iPhone 17 Pro");
  assert.equal(hero?.price, 236899);
  assert.equal(hero?.isPro, true);
  assert.equal(hero?.word, "Pro");
  assert.equal(hero?.finishes.length, 3);
  assert.equal(buildHero(product({ name: "Apple iPhone Air", price: 0 }))?.price, null);
  assert.equal(buildHero(product({ name: "Apple iPhone Air" }))?.word, "Air");
  assert.equal(buildHero(null), null);
});

test("buildRail orders iPhone, Mac, then the rest by name, skipping empty categories", () => {
  const hero = products[1];
  const rail = buildRail(categories, products, hero);
  assert.deepEqual(rail.map((r) => r.key), ["iphone", "mac", "accessories", "chargers"]);
  assert.equal(rail[0].image, hero.images[0]);
  assert.equal(rail[1].href, "/products?q=MacBook");
  assert.equal(rail[2].href, "/products?category=accessories");
});

test("buildShelves mirrors the rail groups", () => {
  const shelves = buildShelves(categories, products);
  assert.deepEqual(shelves.map((s) => s.label), ["iPhone", "Mac", "Accessories", "Chargers"]);
  assert.deepEqual(shelves[0].productIds, ["p16", "pro", "max", "air"]);
});

test("buildPromos uses real products only", () => {
  const promos = buildPromos(products);
  assert.deepEqual(promos.map((p) => p.key), ["air", "essentials"]);
  assert.equal(promos[0].href, "/products/apple-iphone-air");
  assert.deepEqual(buildPromos([]), []);
});

test("toPublicProduct drops internal fields", () => {
  const pub = toPublicProduct({ ...products[0], purchase_price: 100000, supplier_id: "s1", sku: "X" });
  assert.equal("purchase_price" in pub, false);
  assert.equal("supplier_id" in pub, false);
  assert.equal("sku" in pub, false);
  assert.equal(pub.name, "Apple iPhone 16");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL. Cannot find module `./data.ts`.

- [ ] **Step 3: Implement** — `src/components/landing/data.ts`

```ts
import type { Category, Product } from "@/lib/types";

/** Product slugs the hero features, in order of preference. */
export const HERO_SLUGS = ["apple-iphone-17-pro", "apple-iphone-17-pro-max"];

export interface Finish {
  id: string;
  label: string;
  aluminium: string;
  glass: string;
  metalness: number;
  roughness: number;
}

const FINISH_PALETTE: Record<string, Omit<Finish, "id" | "label">> = {
  "cosmic orange": { aluminium: "#D86A2B", glass: "#E58A55", metalness: 0.45, roughness: 0.35 },
  "deep blue": { aluminium: "#2E3B55", glass: "#3B4A68", metalness: 0.45, roughness: 0.35 },
  silver: { aluminium: "#D5D7DA", glass: "#E4E6E8", metalness: 0.65, roughness: 0.28 },
};

export const FALLBACK_FINISH: Omit<Finish, "id" | "label"> = {
  aluminium: "#3A3B3E", glass: "#4A4C50", metalness: 0.45, roughness: 0.35,
};

export interface HeroData {
  name: string;
  displayName: string;
  slug: string;
  price: number | null;
  image: string | null;
  finishes: Finish[];
  isPro: boolean;
  /** The huge, barely visible background word behind the phone. */
  word: string;
}

export interface RailItem { key: string; label: string; href: string; image: string | null; }
export interface Shelf { key: string; label: string; productIds: string[]; }
export interface Promo {
  key: string; eyebrow: string; title: string; body: string;
  href: string; linkLabel: string; image: string | null; alt: string;
}

const MAC_PATTERN = /macbook/i;
const GROUP_PRIORITY = ["iphone", "mac"];

export function displayName(name: string): string {
  return name.replace(/^apple\s+/i, "").trim();
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function parseFinishes(color: string | null | undefined): Finish[] {
  if (!color) return [];
  const seen = new Set<string>();
  const finishes: Finish[] = [];
  for (const raw of color.split(",")) {
    const key = raw.trim().toLowerCase().replace(/\s+/g, " ");
    if (!key) continue;
    const id = key.replace(/ /g, "-");
    if (seen.has(id)) continue;
    seen.add(id);
    finishes.push({ id, label: titleCase(key), ...(FINISH_PALETTE[key] ?? FALLBACK_FINISH) });
  }
  return finishes;
}

function isShowable(p: Product): boolean {
  return p.active && p.stock > 0 && p.images.length > 0;
}

export function pickHeroProduct(products: Product[], categories: Category[]): Product | null {
  for (const slug of HERO_SLUGS) {
    const match = products.find((p) => p.slug === slug && isShowable(p));
    if (match) return match;
  }
  const iphone = categories.find((c) => c.slug === "iphone");
  if (!iphone) return null;
  return products.find((p) => p.category_id === iphone.id && isShowable(p)) ?? null;
}

export function buildHero(product: Product | null): HeroData | null {
  if (!product) return null;
  const name = displayName(product.name);
  const isPro = /\bpro\b/i.test(name);
  return {
    name: product.name,
    displayName: name,
    slug: product.slug,
    price: Number.isFinite(product.price) && product.price > 0 ? product.price : null,
    image: product.images[0] ?? null,
    finishes: parseFinishes(product.color),
    isPro,
    word: isPro ? "Pro" : (name.split(" ").pop() ?? name),
  };
}

interface Group { key: string; label: string; href: string; products: Product[]; }

function groupProducts(categories: Category[], products: Product[]): Group[] {
  const active = products.filter((p) => p.active);
  const groups: Group[] = categories
    .map((c) => ({
      key: c.slug,
      label: c.name,
      href: `/products?category=${c.slug}`,
      products: active.filter((p) => p.category_id === c.id),
    }))
    .filter((g) => g.products.length > 0);
  const macs = active.filter((p) => MAC_PATTERN.test(p.name));
  if (macs.length > 0 && !groups.some((g) => g.key === "mac")) {
    groups.push({ key: "mac", label: "Mac", href: "/products?q=MacBook", products: macs });
  }
  const rank = (key: string) => {
    const i = GROUP_PRIORITY.indexOf(key);
    return i === -1 ? GROUP_PRIORITY.length : i;
  };
  return groups.sort((a, b) => rank(a.key) - rank(b.key) || a.label.localeCompare(b.label));
}

export function buildRail(categories: Category[], products: Product[], hero: Product | null): RailItem[] {
  return groupProducts(categories, products).map((g) => {
    const preferred = hero && g.products.some((p) => p.id === hero.id)
      ? hero
      : g.products.find((p) => p.images.length > 0);
    return { key: g.key, label: g.label, href: g.href, image: preferred?.images[0] ?? null };
  });
}

export function buildShelves(categories: Category[], products: Product[]): Shelf[] {
  return groupProducts(categories, products).map((g) => ({
    key: g.key,
    label: g.label,
    productIds: g.products.map((p) => p.id),
  }));
}

export function buildPromos(products: Product[]): Promo[] {
  const active = products.filter((p) => p.active);
  const air = active.find((p) => /iphone air/i.test(p.name));
  const charger = active.find((p) => /power adapter/i.test(p.name));
  const promos: Promo[] = [];
  if (air) {
    promos.push({
      key: "air", eyebrow: "Less weight. More possibility.", title: "Easy to carry. Hard to put down.",
      body: `Take a closer look at ${displayName(air.name)}.`, href: `/products/${air.slug}`,
      linkLabel: "Explore iPhone", image: air.images[0] ?? null, alt: air.name,
    });
  }
  if (charger) {
    promos.push({
      key: "essentials", eyebrow: "The everyday essentials", title: "A perfect match for your tech.",
      body: "Power up. Plug in. Keep going.", href: "/products?category=chargers",
      linkLabel: "Shop accessories", image: charger.images[0] ?? null, alt: charger.name,
    });
  }
  return promos;
}

/** Only public catalogue fields may cross into client components. */
export function toPublicProduct(p: Product): Product {
  return {
    id: p.id, name: p.name, slug: p.slug, price: p.price, description: p.description,
    category_id: p.category_id, images: p.images, stock: p.stock, featured: p.featured,
    active: p.active, created_at: p.created_at, color: p.color, storage: p.storage,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: `# pass 8`, `# fail 0`

- [ ] **Step 5: Commit**

```bash
git add src/components/landing/data.ts src/components/landing/data.test.ts
git commit -m "feat(landing): data rules for hero product, finishes, rail, shelves, promos"
```

---

### Task 4: Motion foundation (tiers, scene store, GSAP, StringTune)

**Files:**
- Create: `src/components/landing/config.ts`
- Create: `src/components/landing/motion/tier.ts`, `src/components/landing/motion/tier.test.ts`
- Create: `src/components/landing/motion/use-tier.ts`, `src/components/landing/motion/gsap.ts`, `src/components/landing/motion/string-tune.ts`
- Create: `src/components/landing/scene-store.ts`

**Interfaces:**
- Produces:
  - **From `tier.ts`:** `type Tier = "high"|"mid"|"low"`, `TierInput`, `decideTier(input): Tier`, `readTierOverride(search): Tier|null`, `readTierInput(win): TierInput`.
  - **`useTier(): Tier|null`** (`null` during SSR/hydration).
  - **`getGsap(): { gsap, ScrollTrigger }`.**
  - **`acquireStringTune(smooth: boolean): Promise<() => void>`.** Sets `<html data-scroll="smooth|native">`.
  - **From `scene-store.ts`:** `scene: { pointer:{x,y}, visible, finish: Finish|null }`, `setSceneVisible(v)`, `subscribeScene(fn)`, `getSceneVisible()`.
  - **From `config.ts`:** `MODEL_URL`, `MOTION`.

- [ ] **Step 1: Write the failing tests** — `src/components/landing/motion/tier.test.ts`

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { decideTier, readTierOverride, type TierInput } from "./tier.ts";

const desktop: TierInput = {
  webgl2: true, reducedMotion: false, saveData: false, deviceMemory: 8, cores: 8, coarsePointer: false,
};

test("capable desktop is high", () => {
  assert.equal(decideTier(desktop), "high");
  assert.equal(decideTier({ ...desktop, deviceMemory: null, cores: null }), "high");
});

test("anything that rules out motion or WebGL is low", () => {
  assert.equal(decideTier({ ...desktop, webgl2: false }), "low");
  assert.equal(decideTier({ ...desktop, reducedMotion: true }), "low");
  assert.equal(decideTier({ ...desktop, saveData: true }), "low");
  assert.equal(decideTier({ ...desktop, deviceMemory: 2 }), "low");
});

test("phones and weaker machines are mid", () => {
  assert.equal(decideTier({ ...desktop, coarsePointer: true }), "mid");
  assert.equal(decideTier({ ...desktop, cores: 2 }), "mid");
  assert.equal(decideTier({ ...desktop, deviceMemory: 4 }), "mid");
});

test("?tier= overrides for testing", () => {
  assert.equal(readTierOverride("?tier=low"), "low");
  assert.equal(readTierOverride("?x=1&tier=high"), "high");
  assert.equal(readTierOverride("?tier=ultra"), null);
  assert.equal(readTierOverride(""), null);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL. Cannot find module `./tier.ts`.

- [ ] **Step 3: Implement `src/components/landing/motion/tier.ts`**

```ts
export type Tier = "high" | "mid" | "low";

export interface TierInput {
  webgl2: boolean;
  reducedMotion: boolean;
  saveData: boolean;
  /** navigator.deviceMemory (GB, Chromium only); null when unknown. */
  deviceMemory: number | null;
  cores: number | null;
  coarsePointer: boolean;
}

export function decideTier(input: TierInput): Tier {
  if (!input.webgl2 || input.reducedMotion || input.saveData) return "low";
  if (input.deviceMemory !== null && input.deviceMemory < 4) return "low";
  if (input.coarsePointer) return "mid";
  if (input.cores !== null && input.cores < 4) return "mid";
  if (input.deviceMemory !== null && input.deviceMemory < 8) return "mid";
  return "high";
}

export function readTierOverride(search: string): Tier | null {
  const value = new URLSearchParams(search).get("tier");
  return value === "high" || value === "mid" || value === "low" ? value : null;
}

interface NavigatorHints {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

export function readTierInput(win: Window): TierInput {
  const nav = win.navigator as Navigator & NavigatorHints;
  let webgl2 = false;
  try {
    const gl = win.document.createElement("canvas").getContext("webgl2");
    webgl2 = gl !== null;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webgl2 = false;
  }
  return {
    webgl2,
    reducedMotion: win.matchMedia("(prefers-reduced-motion: reduce)").matches,
    saveData: nav.connection?.saveData === true,
    deviceMemory: typeof nav.deviceMemory === "number" ? nav.deviceMemory : null,
    cores: typeof nav.hardwareConcurrency === "number" ? nav.hardwareConcurrency : null,
    coarsePointer: win.matchMedia("(pointer: coarse)").matches,
  };
}
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: all pass (12 tests).

- [ ] **Step 5: `src/components/landing/motion/use-tier.ts`**

```ts
"use client";

import { useSyncExternalStore } from "react";
import { decideTier, readTierInput, readTierOverride, type Tier } from "./tier";

let cached: Tier | null = null;

function compute(): Tier {
  return readTierOverride(window.location.search) ?? decideTier(readTierInput(window));
}

function subscribe(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  const handler = () => {
    cached = compute();
    onChange();
  };
  query.addEventListener("change", handler);
  return () => query.removeEventListener("change", handler);
}

function getSnapshot(): Tier {
  if (cached === null) cached = compute();
  return cached;
}

function getServerSnapshot(): Tier | null {
  return null;
}

/** The device's quality tier; null during server rendering and hydration. */
export function useTier(): Tier | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
```

- [ ] **Step 6: `src/components/landing/motion/gsap.ts`**

```ts
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

/** GSAP with ScrollTrigger registered exactly once. */
export function getGsap() {
  if (!registered) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });
    registered = true;
  }
  return { gsap, ScrollTrigger };
}
```

- [ ] **Step 7: `src/components/landing/motion/string-tune.ts`**

```ts
import type { StringTune } from "@fiddle-digital/string-tune";
import { getGsap } from "./gsap";

// StringTune is a singleton whose destroy() tears down its scroll engine for good,
// so it is started once per page load and only switched between smooth and native.
let instance: StringTune | null = null;
let booting: Promise<StringTune> | null = null;
let users = 0;

async function boot(): Promise<StringTune> {
  const mod = await import("@fiddle-digital/string-tune");
  const st = mod.StringTune.getInstance();
  st.use(mod.StringParallax);
  st.use(mod.StringMagnetic);
  st.use(mod.StringSplit);
  st.use(mod.StringCursor);
  st.use(mod.StringSpotlight);
  st.use(mod.StringTilt);
  st.use(mod.StringProgress);
  st.scrollMobileMode = "default";
  st.scrollDesktopMode = "default";
  // StringTune writes the real scroll position; keep ScrollTrigger in the same frame.
  const { ScrollTrigger } = getGsap();
  st.on("scroll", () => ScrollTrigger.update());
  st.start(0);
  return st;
}

/** Turns smooth scrolling on (desktop) for as long as the caller holds it. */
export async function acquireStringTune(smooth: boolean): Promise<() => void> {
  users += 1;
  if (!instance) {
    booting ??= boot();
    instance = await booting;
  }
  const st = instance;
  st.scrollDesktopMode = smooth ? "smooth" : "default";
  document.documentElement.dataset.scroll = smooth ? "smooth" : "native";

  let released = false;
  return () => {
    if (released) return;
    released = true;
    users -= 1;
    if (users === 0) {
      st.scrollDesktopMode = "default";
      document.documentElement.dataset.scroll = "native";
    }
  };
}
```

- [ ] **Step 8: `src/components/landing/scene-store.ts`**

```ts
import type { Finish } from "./data";

export interface SceneState {
  /** Pointer position, -1..1 on both axes (desktop only). */
  pointer: { x: number; y: number };
  /** Whether the 3D layer should be rendering. */
  visible: boolean;
  /** The finish the visitor picked; null until they pick one. */
  finish: Finish | null;
}

// A plain mutable object: GSAP/Anime write it, the 3D scene reads it every frame.
// Nothing here triggers React renders except the visibility subscription.
export const scene: SceneState = { pointer: { x: 0, y: 0 }, visible: true, finish: null };

const listeners = new Set<() => void>();

export function setSceneVisible(visible: boolean) {
  if (scene.visible === visible) return;
  scene.visible = visible;
  listeners.forEach((listener) => listener());
}

export function subscribeScene(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSceneVisible() {
  return scene.visible;
}
```

- [ ] **Step 9: `src/components/landing/config.ts`**

```ts
/** Versioned so it can be cached immutably; bump when the model changes. */
export const MODEL_URL = "/models/iphone.v1.glb";

/** The spec's three motion speeds (ms) and their easings. */
export const MOTION = {
  fast: { min: 100, max: 250, ease: "cubic-bezier(.2,.7,.2,1)" },
  normal: { min: 400, max: 700, ease: "cubic-bezier(.16,1,.3,1)" },
  cinematic: { min: 900, max: 1800, ease: "power3.inOut" },
} as const;
```

- [ ] **Step 10: Verify types**

Run: `npx tsc --noEmit && npm test`
Expected: exit 0; all tests pass.

- [ ] **Step 11: Commit**

```bash
git add src/components/landing/config.ts src/components/landing/scene-store.ts src/components/landing/motion
git commit -m "feat(landing): quality tiers, scene store, GSAP and StringTune adapters"
```

---

### Task 5: Server-rendered landing skeleton + header stages

**Files:**
- Create: `src/components/landing/landing-experience.tsx`, `src/components/landing/landing.css`
- Create: `src/components/landing/hero/hero-stage.tsx`, `src/components/landing/hero/finish-picker.tsx`
- Create: `src/components/landing/film/product-film.tsx`
- Create: `src/components/landing/store/{category-rail,product-showcase,benefits,promo-panels,services,faq,visit-imart}.tsx`
- Modify (rewrite): `src/app/(store)/page.tsx`
- Delete: `src/components/store-hero.tsx`, `src/components/home-products.tsx`

**Interfaces:**
- Consumes: Task 3 (`data.ts`), Task 4 (`useTier`, `acquireStringTune`, `scene`, `setSceneVisible`).
- Produces:
  - **`<LandingExperience initialFinish: Finish|null>`**, which renders `<main class="landing" data-stage data-active data-phone data-tier>`.
  - **Section markers:** sections carry `data-stage-section="hero|film|light"`.
  - **Phone readiness:** `data-phone` takes `"poster" | "ready" | "failed"`.

- [ ] **Step 1: `src/components/landing/landing-experience.tsx`** (the `PhoneLayer` import is added in Task 6; for now render none)

```tsx
"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type { Finish } from "./data";
import { useTier } from "./motion/use-tier";
import { acquireStringTune } from "./motion/string-tune";
import { scene, setSceneVisible } from "./scene-store";
import "./landing.css";

type Stage = "hero" | "film" | "light";

export function LandingExperience({
  initialFinish,
  children,
}: {
  initialFinish: Finish | null;
  children: React.ReactNode;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const tier = useTier();

  // Header styles key off [data-active]; drop it whenever this page is hidden or unmounted.
  useLayoutEffect(() => {
    const root = rootRef.current;
    root?.setAttribute("data-active", "");
    return () => root?.removeAttribute("data-active");
  }, []);

  // Stage = the section under the viewport's centre line.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const stage = (entry.target as HTMLElement).dataset.stageSection as Stage;
          root.dataset.stage = stage;
          setSceneVisible(stage !== "light");
        }
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    root.querySelectorAll<HTMLElement>("[data-stage-section]").forEach((el) => observer.observe(el));
    return () => {
      observer.disconnect();
      setSceneVisible(true);
    };
  }, []);

  // Smooth scroll on desktop with a fine pointer; native everywhere else.
  useEffect(() => {
    if (tier === null) return;
    const smooth = tier !== "low" && window.matchMedia("(pointer: fine)").matches;
    let release: (() => void) | null = null;
    let cancelled = false;
    acquireStringTune(smooth).then((r) => {
      if (cancelled) r();
      else release = r;
    });
    return () => {
      cancelled = true;
      release?.();
    };
  }, [tier]);

  // Pointer drives the phone's subtle reaction (desktop, high tier only).
  useEffect(() => {
    if (tier !== "high") return;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      scene.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      scene.pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      scene.pointer.x = 0;
      scene.pointer.y = 0;
    };
  }, [tier]);

  return (
    <main
      ref={rootRef}
      className="landing"
      data-stage="hero"
      data-active=""
      data-phone="poster"
      data-tier={tier ?? undefined}
    >
      {children}
    </main>
  );
}
```

- [ ] **Step 2: `src/components/landing/hero/finish-picker.tsx`**

```tsx
"use client";

import { useState, type KeyboardEvent } from "react";
import type { Finish } from "../data";
import { scene } from "../scene-store";

export function FinishPicker({ finishes }: { finishes: Finish[] }) {
  const [selected, setSelected] = useState(0);

  function choose(index: number) {
    setSelected(index);
    scene.finish = finishes[index];
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const step = e.key === "ArrowRight" ? 1 : -1;
    const next = (selected + step + finishes.length) % finishes.length;
    choose(next);
    e.currentTarget.querySelectorAll<HTMLButtonElement>("[role=radio]")[next]?.focus();
  }

  return (
    <div className="finish-picker">
      <p id="finish-label" className="landing-label">Pick your finish</p>
      <div className="finish-options" role="radiogroup" aria-labelledby="finish-label" onKeyDown={onKeyDown}>
        {finishes.map((finish, i) => (
          <button
            key={finish.id}
            type="button"
            role="radio"
            aria-checked={i === selected}
            tabIndex={i === selected ? 0 : -1}
            className="finish-option"
            onClick={() => choose(i)}
          >
            <span className="finish-swatch" style={{ background: finish.aluminium }} aria-hidden="true" />
            {finish.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: `src/components/landing/hero/hero-stage.tsx`**

```tsx
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { StoreIcon } from "@/components/store-icon";
import type { HeroData } from "../data";
import { FinishPicker } from "./finish-picker";

export function HeroStage({ hero, whatsapp }: { hero: HeroData | null; whatsapp: string }) {
  const shopHref = hero ? `/products/${hero.slug}` : "/products?category=iphone";
  const shopLabel = hero ? `Shop ${hero.displayName}` : "Shop iPhone";

  return (
    <>
      {/* Mid-back plane: lives outside the hero so the 3D phone renders in front of it. */}
      <p className="hero-word" aria-hidden="true">{hero?.word ?? "iPhone"}</p>
      <section className="landing-hero" data-stage-section="hero" aria-labelledby="hero-title">
      <div className="landing-container hero-grid">
        <div className="hero-copy">
          <p className="landing-label landing-label-signal">New</p>
          <h1 id="hero-title" className="hero-title">
            <span className="hero-line hero-line-1">Your next<br />upgrade.</span>
            <span className="hero-line hero-line-2">
              {hero?.isPro === false ? <>Make it<br />yours.</> : <>Make it<br />a Pro.</>}
            </span>
          </h1>
          {hero?.price != null && (
            <p className="hero-price">
              <span className="landing-label">From</span>
              <strong>{formatPrice(hero.price)}</strong>
            </p>
          )}
          <div className="hero-ctas">
            <Link className="landing-cta" href={shopHref}>
              {shopLabel}
              <StoreIcon name="arrow" width={18} />
            </Link>
            {whatsapp && (
              <a
                className="landing-cta landing-cta-ghost"
                href={`https://wa.me/977${whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Talk to us <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
          {hero && hero.finishes.length > 0 && <FinishPicker finishes={hero.finishes} />}
        </div>
        <div className="hero-device-slot">
          {hero?.image && (
            <Image
              className="hero-poster"
              src={hero.image}
              alt={hero.name}
              fill
              priority
              sizes="(max-width: 760px) 90vw, 560px"
            />
          )}
        </div>
      </div>
      <div className="hero-scroll-cue" aria-hidden="true">
        <span>Scroll to explore</span>
        <span>01</span>
        <i />
      </div>
      </section>
    </>
  );
}
```

- [ ] **Step 4: `src/components/landing/film/product-film.tsx`**

```tsx
const ACTS = [
  {
    id: "genuine",
    title: ["Genuine.", "Sealed.", "Yours."],
    body: "Every phone is genuine, sealed and new in the box, with warranty included.",
    meta: ["Genuine Apple product", "Sealed · new in box", "Warranty included"],
  },
  {
    id: "inside",
    title: ["We know it", "inside out."],
    body: "Repairs and after-sales care, right here at our Amarpath store.",
    meta: ["Back glass", "Battery", "Logic board", "Frame", "Display"],
  },
  {
    id: "pay",
    title: ["Pay", "your way."],
    body: "Pay cash on delivery or at pickup, or by QR after you order.",
    meta: ["Cash", "QR"],
  },
  {
    id: "delivery",
    title: ["Delivered", "in Butwal."],
    body: "Home delivery within Butwal, or pick up from our store in Amarpath.",
    meta: ["Home delivery in Butwal", "Pickup at Amarpath"],
  },
];

export function ProductFilm() {
  return (
    <section className="landing-film" data-stage-section="film" aria-label="Inside iMart">
      <div className="landing-container">
        {ACTS.map((act, i) => (
          <article key={act.id} className="film-act" aria-labelledby={`act-${act.id}`}>
            <p className="landing-label landing-label-signal">0{i + 1}</p>
            <h2 id={`act-${act.id}`}>
              {act.title.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h2>
            <p className="film-act-body">{act.body}</p>
            <ul className="film-act-meta">
              {act.meta.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Store sections**

`src/components/landing/store/category-rail.tsx`
```tsx
import Image from "next/image";
import Link from "next/link";
import { StoreIcon } from "@/components/store-icon";
import type { RailItem } from "../data";

export function CategoryRail({ items }: { items: RailItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="rail" aria-labelledby="rail-heading">
      <div className="landing-container store-row-head">
        <h2 id="rail-heading">Shop by category</h2>
        <Link href="/products" className="store-text-link">
          Browse all <StoreIcon name="arrow" width={16} />
        </Link>
      </div>
      <div className="rail-track">
        {items.map((item) => (
          <Link key={item.key} href={item.href} className="rail-tile">
            <span className="rail-image">
              {item.image ? (
                <Image src={item.image} alt="" fill sizes="(max-width: 760px) 45vw, 260px" />
              ) : (
                <StoreIcon name="bag" width={40} height={40} />
              )}
            </span>
            <span className="rail-label">{item.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

`src/components/landing/store/product-showcase.tsx`
```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { StoreIcon } from "@/components/store-icon";
import type { Product } from "@/lib/types";
import type { Shelf } from "../data";

export function ProductShowcase({ shelves, products }: { shelves: Shelf[]; products: Product[] }) {
  const [active, setActive] = useState(shelves[0]?.key ?? "");
  if (shelves.length === 0) return null;
  const shelf = shelves.find((s) => s.key === active) ?? shelves[0];
  const byId = new Map(products.map((p) => [p.id, p]));
  const shown = shelf.productIds
    .map((id) => byId.get(id))
    .filter((p): p is Product => p !== undefined)
    .slice(0, 8);

  return (
    <section className="showcase" aria-labelledby="showcase-heading">
      <div className="landing-container">
        <div className="store-row-head">
          <div>
            <h2 id="showcase-heading">Find your next favourite</h2>
            <p>Good tech. Great choices. All in one place.</p>
          </div>
          <Link className="store-text-link" href="/products">
            View all products <StoreIcon name="arrow" width={16} />
          </Link>
        </div>
        <div className="showcase-tabs" role="group" aria-label="Product collections">
          {shelves.map((s) => (
            <button key={s.key} type="button" aria-pressed={s.key === shelf.key} onClick={() => setActive(s.key)}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="showcase-grid">
          {shown.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

`src/components/landing/store/benefits.tsx`
```tsx
import { StoreIcon } from "@/components/store-icon";

const BENEFITS = [
  { icon: "shield", title: "Genuine products", body: "Shop with confidence" },
  { icon: "check", title: "Warranty included", body: "Peace of mind after you buy" },
  { icon: "truck", title: "Delivery in Butwal", body: "Right to your door" },
  { icon: "headset", title: "After-sales support", body: "Repairs at our Amarpath store" },
] as const;

export function Benefits() {
  return (
    <section className="benefits" aria-label="Why shop at iMart">
      <div className="landing-container benefits-grid">
        {BENEFITS.map((b) => (
          <div key={b.title} className="benefit">
            <StoreIcon name={b.icon} width={28} height={28} />
            <span>
              <strong>{b.title}</strong>
              <small>{b.body}</small>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
```

`src/components/landing/store/promo-panels.tsx`
```tsx
import Image from "next/image";
import Link from "next/link";
import { StoreIcon } from "@/components/store-icon";
import type { Promo } from "../data";

export function PromoPanels({ promos }: { promos: Promo[] }) {
  if (promos.length === 0) return null;
  return (
    <section className="promos landing-container" aria-label="Collections">
      {promos.map((promo) => (
        <article key={promo.key} className={`promo promo-${promo.key}`}>
          <div className="promo-copy">
            <p className="landing-label landing-label-brand">{promo.eyebrow}</p>
            <h3>{promo.title}</h3>
            <p>{promo.body}</p>
            <Link href={promo.href} className="store-text-link">
              {promo.linkLabel} <StoreIcon name="arrow" width={18} />
            </Link>
          </div>
          <div className="promo-media">
            {promo.image && <Image src={promo.image} alt={promo.alt} fill sizes="(max-width: 760px) 90vw, 640px" />}
          </div>
        </article>
      ))}
    </section>
  );
}
```

`src/components/landing/store/services.tsx`
```tsx
import { StoreIcon } from "@/components/store-icon";

const SERVICES = [
  ["01", "Find your fit", "Tell us what matters to you. We'll help you compare your options."],
  ["02", "Repairs & after-sales", "Get hands-on help with your device at our Amarpath store."],
  ["03", "Phone exchange", "Bring in your current phone and ask our team about upgrading."],
] as const;

export function Services({ contact }: { contact: string }) {
  return (
    <section id="services" className="services landing-container" aria-labelledby="services-heading">
      <div className="store-row-head">
        <div>
          <p className="landing-label landing-label-brand">The human side of tech</p>
          <h2 id="services-heading">A real store. People you can count on.</h2>
        </div>
        <a href={contact} className="store-text-link">
          Talk to our team <StoreIcon name="arrow" width={16} />
        </a>
      </div>
      <ol className="service-list">
        {SERVICES.map(([number, title, body]) => (
          <li key={number} className="service-row">
            <span className="service-num">{number}</span>
            <div>
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
            <span className="service-line" aria-hidden="true">
              <StoreIcon name="arrow" width={20} />
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
```

`src/components/landing/store/faq.tsx`
```tsx
import { StoreIcon } from "@/components/store-icon";

const FAQS = [
  ["Can I collect my order from the store?", "Yes. Choose store pickup at checkout and collect your order from iMart in Amarpath, Butwal. Our team will call to confirm the details."],
  ["How can I pay for my order?", "Choose cash on delivery or pickup, or pay using the QR code shown after ordering. For QR payments, send your payment screenshot to our team on WhatsApp."],
  ["Where do you deliver?", "Home delivery is available within Butwal. For nearby areas, contact our team before ordering so we can confirm delivery options."],
  ["Can you help with repairs or an exchange?", "Visit us with your device or message us on WhatsApp. Our team can discuss the condition, repair options, and availability before you decide."],
] as const;

export function Faq({ contact }: { contact: string }) {
  return (
    <section id="help" className="faq landing-container" aria-labelledby="faq-heading">
      <div>
        <h2 id="faq-heading">A little help before you shop.</h2>
        <p>Everything you need for an easier purchase.</p>
        <a className="store-text-link" href={contact}>
          Ask us on WhatsApp <StoreIcon name="arrow" width={17} />
        </a>
      </div>
      <div className="faq-list">
        {FAQS.map(([question, answer]) => (
          <details key={question}>
            <summary>
              {question}
              <span className="faq-icon" aria-hidden="true"><i /><i /></span>
            </summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
```

`src/components/landing/store/visit-imart.tsx`
```tsx
import { StoreIcon } from "@/components/store-icon";

const MARQUEE = "Amarpath · Butwal · Rupandehi · ";

export function VisitIMart({ whatsapp }: { whatsapp: string }) {
  return (
    <section id="visit" className="visit" aria-labelledby="visit-heading">
      <div className="visit-marquee" aria-hidden="true">
        <div className="visit-marquee-track">
          <span>{MARQUEE.repeat(3)}</span>
          <span>{MARQUEE.repeat(3)}</span>
        </div>
      </div>
      <div className="landing-container visit-body">
        <svg className="visit-pin" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="20" cy="96" r="4" />
          <path d="M20 96 C 40 96, 44 70, 60 70 S 80 52, 84 40" fill="none" />
          <path d="M84 12 a14 14 0 0 1 14 14 c0 10 -14 24 -14 24 s-14 -14 -14 -24 a14 14 0 0 1 14 -14 z" />
          <circle cx="84" cy="26" r="4.5" className="visit-pin-dot" />
        </svg>
        <div>
          <p className="landing-label landing-label-brand">Visit iMart</p>
          <h2 id="visit-heading">Online convenience. Local connection.</h2>
          <p>Amarpath, Butwal, Rupandehi · Sunday to Friday 9am–8pm · Saturday 10am–6pm</p>
        </div>
        <div className="visit-actions">
          <a className="landing-cta" href="https://maps.google.com/?q=Amarpath,Butwal" target="_blank" rel="noopener noreferrer">
            Find our store <span aria-hidden="true">↗</span>
          </a>
          {whatsapp && (
            <a className="store-text-link" href={`https://wa.me/977${whatsapp}`} target="_blank" rel="noopener noreferrer">
              Chat on WhatsApp <StoreIcon name="arrow" width={16} />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: `src/app/(store)/page.tsx`** — full rewrite

```tsx
import { getAllProducts, getCategories } from "@/lib/queries";
import { LandingExperience } from "@/components/landing/landing-experience";
import { HeroStage } from "@/components/landing/hero/hero-stage";
import { ProductFilm } from "@/components/landing/film/product-film";
import { CategoryRail } from "@/components/landing/store/category-rail";
import { ProductShowcase } from "@/components/landing/store/product-showcase";
import { Benefits } from "@/components/landing/store/benefits";
import { PromoPanels } from "@/components/landing/store/promo-panels";
import { Services } from "@/components/landing/store/services";
import { Faq } from "@/components/landing/store/faq";
import { VisitIMart } from "@/components/landing/store/visit-imart";
import {
  buildHero, buildPromos, buildRail, buildShelves, pickHeroProduct, toPublicProduct,
} from "@/components/landing/data";

export const revalidate = 60;

export default async function HomePage() {
  const [products, categories] = await Promise.all([getAllProducts(), getCategories()]);
  const heroProduct = pickHeroProduct(products, categories);
  const hero = buildHero(heroProduct);
  const whatsapp = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
  const contact = whatsapp ? `https://wa.me/977${whatsapp}` : "#visit";

  return (
    <LandingExperience initialFinish={hero?.finishes[0] ?? null}>
      <div className="landing-dark">
        <HeroStage hero={hero} whatsapp={whatsapp} />
        <ProductFilm />
      </div>
      <div className="landing-store" data-stage-section="light">
        <CategoryRail items={buildRail(categories, products, heroProduct)} />
        <ProductShowcase shelves={buildShelves(categories, products)} products={products.map(toPublicProduct)} />
        <Benefits />
        <PromoPanels promos={buildPromos(products)} />
        <Services contact={contact} />
        <Faq contact={contact} />
        <VisitIMart whatsapp={whatsapp} />
      </div>
    </LandingExperience>
  );
}
```

- [ ] **Step 7: `src/components/landing/landing.css`** — full file

```css
/* ============ Landing page (home) ============ */
.landing {
  --stage: #050706;
  --signal: #3ddc84;
  --brand: #176b48;
  --brand-hover: #1d8158;
  --paper: #ffffff;
  --paper-2: #f5f7f4;
  --ink: #111613;
  --line: #e4e8e3;
  --muted: #67716a;
  --on-dark: #eef3ef;
  --on-dark-muted: rgba(238, 243, 239, 0.62);
  --ease-ui: cubic-bezier(.2, .7, .2, 1);
  --ease-normal: cubic-bezier(.16, 1, .3, 1);
  --header-h: 138px;
  /* Positioned without a z-index: a containing block for the hero word, not a stacking context. */
  position: relative;
  display: block;
}
.landing-container { width: min(1280px, calc(100% - 80px)); margin-inline: auto; }
.landing-label { font-size: 11px; font-weight: 600; letter-spacing: .24em; text-transform: uppercase; }
.landing-label-signal { color: var(--signal); }
.landing-label-brand { color: var(--brand); }

/* ---------- Header on the landing page (server-correct via :has) ---------- */
.storefront:has(.landing[data-active]) .store-topbar { display: none; }
.storefront:has(.landing[data-active]) .store-header {
  position: fixed;
  inset: 0 0 auto;
  transition: background-color .5s cubic-bezier(.16, 1, .3, 1), border-color .5s, color .5s;
}
.storefront:has(.landing[data-active]) :is(.store-navigation, .store-search, .header-help) {
  transition: opacity .4s cubic-bezier(.16, 1, .3, 1), visibility .4s;
}
.storefront:has(.landing[data-active]:not([data-stage="light"])) .store-header {
  background: transparent;
  border-bottom-color: transparent;
  color: #eef3ef;
}
.storefront:has(.landing[data-active]:not([data-stage="light"])) :is(.store-logo, .store-navigation a, .header-cart, .header-help, .mobile-menu-toggle) { color: #eef3ef; }
.storefront:has(.landing[data-active]:not([data-stage="light"])) .store-logo > span { color: #3ddc84; }
.storefront:has(.landing[data-active]:not([data-stage="light"])) .header-help small { color: rgba(238, 243, 239, .6); }
.storefront:has(.landing[data-active]:not([data-stage="light"])) .store-navigation { border-top-color: rgba(255, 255, 255, .08); }
.storefront:has(.landing[data-active]:not([data-stage="light"])) .store-navigation .browse-all { border-right-color: rgba(255, 255, 255, .14); }
.storefront:has(.landing[data-active]:not([data-stage="light"])) .store-navigation .nav-visit { color: #3ddc84; }
.storefront:has(.landing[data-active]:not([data-stage="light"])) .store-search { background: rgba(255, 255, 255, .06); border-color: rgba(255, 255, 255, .14); }
.storefront:has(.landing[data-active]:not([data-stage="light"])) .store-search input { color: #eef3ef; }
.storefront:has(.landing[data-active]:not([data-stage="light"])) .store-search input::placeholder { color: rgba(238, 243, 239, .55); }
/* During the film the navigation simplifies to logo + bag. */
.storefront:has(.landing[data-active][data-stage="film"]) :is(.store-navigation:not(.is-open), .store-search, .header-help) {
  opacity: 0;
  visibility: hidden;
}

/* ---------- Dark stage ----------
   Paint order: .landing-dark background (in flow, static) → hero word (z 0)
   → fixed 3D layer (z 0, later in the DOM) → hero/film content (z 1) → light store (z 2). */
.landing-dark {
  color: var(--on-dark);
  background:
    radial-gradient(70% 55% at 72% 42%, rgba(23, 107, 72, .34) 0%, rgba(8, 26, 17, 0) 70%),
    radial-gradient(120% 90% at 50% 0%, #07120d 0%, var(--stage) 60%);
}

/* Fixed 3D layer: above the dark background, below all content. */
.phone-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity .9s var(--ease-normal), visibility .9s;
}
.landing[data-phone="ready"] .phone-layer { opacity: 1; }
.landing[data-stage="light"] .phone-layer { opacity: 0; visibility: hidden; }

.landing-hero {
  position: relative;
  z-index: 1;
  min-height: 100svh;
  display: grid;
  align-items: center;
  padding: calc(var(--header-h) + 24px) 0 110px;
  overflow: clip;
}
.hero-word {
  position: absolute;
  inset: 0 0 auto;
  z-index: 0;
  height: 100svh;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 4vh;
  overflow: hidden;
  white-space: nowrap;
  text-align: center;
  font-size: clamp(160px, 30vw, 460px);
  font-weight: 600;
  letter-spacing: -.06em;
  line-height: .8;
  text-transform: uppercase;
  color: rgba(255, 255, 255, .035);
  pointer-events: none;
  user-select: none;
}
.hero-grid { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); align-items: center; gap: 40px; }
.hero-title { margin-top: 20px; text-transform: uppercase; font-weight: 600; letter-spacing: -.035em; line-height: .95; }
.hero-line { display: block; }
.hero-line-1 { font-size: clamp(32px, 4vw, 60px); color: rgba(238, 243, 239, .78); }
.hero-line-2 { margin-top: 16px; font-size: clamp(46px, 6.4vw, 104px); color: #fff; }
.hero-price { margin-top: 30px; display: flex; flex-direction: column; gap: 6px; }
.hero-price .landing-label { color: var(--on-dark-muted); font-size: 10px; }
.hero-price strong { font-size: 22px; font-weight: 600; letter-spacing: -.01em; }
.hero-ctas { margin-top: 28px; display: flex; flex-wrap: wrap; gap: 12px; }
.landing-cta {
  display: inline-flex;
  align-items: center;
  gap: 14px;
  padding: 15px 22px;
  border-radius: 999px;
  border: 1px solid var(--brand);
  background: var(--brand);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: .12em;
  text-transform: uppercase;
  white-space: nowrap;
  transition: transform .18s var(--ease-ui), background-color .2s, border-color .2s;
}
.landing-cta:hover { background: var(--brand-hover); border-color: var(--brand-hover); }
.landing-cta:active { transform: scale(.97); }
.landing-cta svg { transition: transform .25s var(--ease-ui); }
.landing-cta:hover svg { transform: translateX(4px); }
.landing-cta-ghost { background: transparent; border-color: rgba(255, 255, 255, .22); }
.landing-cta-ghost:hover { background: rgba(255, 255, 255, .06); border-color: rgba(255, 255, 255, .4); }
.finish-picker { margin-top: 34px; }
.finish-picker .landing-label { color: var(--on-dark-muted); font-size: 10px; }
.finish-options { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.finish-option {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 8px 14px 8px 9px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, .14);
  color: rgba(238, 243, 239, .78);
  font-size: 12px;
  transition: border-color .2s, color .2s, background-color .2s;
}
.finish-option:hover { border-color: rgba(255, 255, 255, .32); }
.finish-option[aria-checked="true"] { border-color: rgba(255, 255, 255, .62); color: #fff; background: rgba(255, 255, 255, .06); }
.finish-swatch { width: 16px; height: 16px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, .28); }
.hero-device-slot { position: relative; height: min(72vh, 640px); }
.hero-poster { object-fit: contain; transition: opacity .6s var(--ease-normal); }
.landing[data-phone="ready"] .hero-poster { opacity: 0; }
.hero-scroll-cue {
  position: absolute;
  left: 50%;
  bottom: 26px;
  translate: -50% 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 10px;
  letter-spacing: .28em;
  text-transform: uppercase;
  color: var(--on-dark-muted);
}
.hero-scroll-cue i { width: 1px; height: 44px; background: linear-gradient(rgba(255, 255, 255, .55), transparent); }

/* ---------- Film (Phase 1: stacked, unpinned) ---------- */
.landing-film { position: relative; z-index: 1; padding: 6vh 0 16vh; }
.film-act { min-height: 88vh; display: grid; align-content: center; max-width: 540px; }
.film-act h2 { margin-top: 16px; font-size: clamp(40px, 5.4vw, 84px); font-weight: 600; letter-spacing: -.035em; line-height: .95; text-transform: uppercase; }
.film-act h2 span { display: block; }
.film-act-body { margin-top: 22px; max-width: 400px; color: var(--on-dark-muted); font-size: 15px; line-height: 1.8; }
.film-act-meta { margin-top: 26px; display: flex; flex-wrap: wrap; gap: 8px 18px; font-size: 10px; letter-spacing: .2em; text-transform: uppercase; color: rgba(238, 243, 239, .5); }

/* ---------- Light store ---------- */
.landing-store { position: relative; z-index: 2; background: var(--paper); color: var(--ink); }
.landing-store [id] { scroll-margin-top: calc(var(--header-h) + 16px); }
.store-row-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 32px; }
.store-row-head h2 { font-size: clamp(26px, 3vw, 42px); font-weight: 600; letter-spacing: -.03em; line-height: 1.08; }
.store-row-head h2 + p, .store-row-head p:not(.landing-label) { margin-top: 10px; color: var(--muted); font-size: 14px; }
.store-row-head .landing-label + h2 { margin-top: 12px; }

.rail { padding-block: 104px 48px; }
.rail-track { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(180px, 1fr); gap: 20px; width: min(1280px, calc(100% - 80px)); margin-inline: auto; }
.rail-tile { display: flex; flex-direction: column; align-items: center; gap: 18px; padding: 30px 18px 24px; border-radius: 22px; background: #f6f7f5; transition: background-color .3s var(--ease-normal); }
.rail-tile:hover { background: #eef3ec; }
.rail-image { position: relative; display: grid; place-items: center; width: 100%; aspect-ratio: 1; color: #b7c3b4; }
.rail-image img { object-fit: contain; mix-blend-mode: multiply; transition: transform .5s var(--ease-normal); }
.rail-tile:hover .rail-image img { transform: translateY(-4px) rotate(-1.5deg); }
.rail-label { font-size: 15px; font-weight: 600; letter-spacing: -.01em; }

.showcase { padding-block: 56px 80px; }
.showcase-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 28px; }
.showcase-tabs button { padding: 10px 18px; border-radius: 999px; border: 1px solid var(--line); font-size: 13px; color: var(--muted); transition: color .2s, border-color .2s, background-color .2s; }
.showcase-tabs button:hover { color: var(--ink); border-color: #c9d2c6; }
.showcase-tabs button[aria-pressed="true"] { color: #fff; background: var(--ink); border-color: var(--ink); }
.showcase-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }

.benefits { border-block: 1px solid var(--line); }
.benefits-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); }
.benefit { display: flex; align-items: center; gap: 14px; padding: 30px 24px; border-right: 1px solid var(--line); }
.benefit:first-child { padding-left: 0; }
.benefit:last-child { border-right: 0; }
.benefit svg { color: var(--brand); flex-shrink: 0; }
.benefit strong { display: block; font-size: 13px; font-weight: 600; }
.benefit small { display: block; margin-top: 4px; font-size: 12px; color: var(--muted); }

.promos { display: grid; gap: 20px; padding-block: 80px; }
.promo { position: relative; display: grid; grid-template-columns: .42fr .58fr; min-height: 460px; border-radius: 28px; overflow: hidden; background: #f3f5f2; }
.promo-essentials { grid-template-columns: .58fr .42fr; background: #f4f1ea; }
.promo-essentials .promo-copy { order: 2; }
.promo-copy { align-self: center; padding: 56px; }
.promo-copy h3 { margin-top: 16px; font-size: clamp(30px, 3.4vw, 52px); font-weight: 600; letter-spacing: -.035em; line-height: 1.02; }
.promo-copy p:not(.landing-label) { margin-top: 16px; color: var(--muted); font-size: 14px; }
.promo-copy .store-text-link { margin-top: 26px; }
.promo-media { position: relative; min-height: 320px; }
.promo-media img { object-fit: contain; padding: 40px; mix-blend-mode: multiply; }

.services { padding-block: 96px 64px; }
.service-list { list-style: none; border-top: 1px solid var(--line); }
.service-row { display: grid; grid-template-columns: 140px minmax(0, 1fr) auto; align-items: center; gap: 24px; padding-block: 32px; border-bottom: 1px solid var(--line); }
.service-num { font-size: clamp(44px, 6vw, 88px); font-weight: 600; letter-spacing: -.05em; line-height: 1; font-variant-numeric: tabular-nums; }
.service-row h3 { font-size: clamp(20px, 2.2vw, 30px); font-weight: 600; letter-spacing: -.02em; text-transform: uppercase; }
.service-row p { margin-top: 8px; color: var(--muted); font-size: 14px; max-width: 460px; }
.service-line { display: flex; align-items: center; gap: 10px; color: var(--brand); }
.service-line::before { content: ""; width: 48px; height: 1px; background: currentColor; transition: width .4s var(--ease-normal); }
.service-row:hover .service-line::before { width: 72px; }

.faq { display: grid; grid-template-columns: .8fr 1.2fr; gap: 80px; padding-block: 64px 96px; }
.faq h2 { font-size: clamp(28px, 3vw, 40px); font-weight: 600; letter-spacing: -.03em; line-height: 1.1; }
.faq h2 + p { margin-top: 12px; color: var(--muted); font-size: 14px; }
.faq .store-text-link { margin-top: 22px; }
.faq-list details { border-bottom: 1px solid var(--line); }
.faq-list summary { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-block: 22px; font-size: 15px; font-weight: 500; list-style: none; cursor: pointer; }
.faq-list summary::-webkit-details-marker { display: none; }
.faq-icon { position: relative; width: 14px; height: 14px; flex-shrink: 0; transition: transform .25s var(--ease-ui); }
.faq-icon i { position: absolute; inset: 6px 0 auto; height: 2px; border-radius: 1px; background: currentColor; transition: transform .25s var(--ease-ui); }
.faq-icon i:last-child { transform: rotate(90deg); }
.faq-list details[open] .faq-icon { transform: rotate(-6deg); }
.faq-list details[open] .faq-icon i:last-child { transform: rotate(90deg) scaleX(0); }
.faq-list details p { padding: 0 32px 22px 0; color: var(--muted); font-size: 14px; line-height: 1.8; }

.visit { padding-bottom: 104px; overflow: clip; }
.visit-marquee { padding-block: 36px; border-block: 1px solid var(--line); overflow: hidden; }
.visit-marquee-track { display: flex; width: max-content; animation: landing-marquee 42s linear infinite; }
.visit-marquee-track span { font-size: clamp(56px, 9vw, 140px); font-weight: 600; letter-spacing: -.04em; line-height: 1; text-transform: uppercase; white-space: nowrap; padding-right: .3em; }
@keyframes landing-marquee { to { transform: translateX(-50%); } }
.visit-body { display: grid; grid-template-columns: 120px minmax(0, 1fr) auto; align-items: center; gap: 40px; padding-top: 56px; }
.visit-pin { width: 120px; height: 120px; color: var(--brand); }
.visit-pin circle { fill: currentColor; }
.visit-pin path:first-of-type { stroke: currentColor; stroke-width: 1.5; stroke-dasharray: 3 4; }
.visit-pin path:last-of-type { fill: none; stroke: currentColor; stroke-width: 2; }
.visit-pin .visit-pin-dot { fill: var(--signal); }
.visit-body h2 { margin-top: 12px; font-size: clamp(28px, 3.4vw, 48px); font-weight: 600; letter-spacing: -.03em; line-height: 1.08; }
.visit-body h2 + p { margin-top: 12px; color: var(--muted); font-size: 14px; line-height: 1.7; }
.visit-actions { display: flex; flex-direction: column; align-items: flex-start; gap: 16px; }

/* ---------- Responsive ---------- */
@media (max-width: 1100px) {
  .landing-container, .rail-track { width: calc(100% - 48px); }
  .showcase-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .promo-copy { padding: 40px; }
  .faq { gap: 48px; }
}
@media (max-width: 760px) {
  .landing { --header-h: 119px; }
  .landing-container { width: calc(100% - 32px); }
  .landing-hero { align-items: start; padding: calc(var(--header-h) + 50vh) 0 96px; }
  .hero-grid { grid-template-columns: 1fr; }
  .hero-device-slot { position: absolute; top: var(--header-h); left: 0; right: 0; height: 48vh; }
  .hero-word { align-items: flex-start; padding: calc(var(--header-h) + 16vh) 0 0; font-size: 44vw; }
  .hero-title { margin-top: 14px; }
  .hero-line-2 { margin-top: 10px; }
  .landing-film { padding-bottom: 10vh; }
  .film-act { min-height: 80vh; align-content: end; padding-bottom: 8vh; }
  .rail { padding-block: 72px 32px; }
  .rail-track { width: auto; padding-inline: 16px; grid-auto-columns: 46%; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; }
  .rail-track::-webkit-scrollbar { display: none; }
  .rail-tile { scroll-snap-align: start; padding: 22px 12px 18px; border-radius: 18px; }
  .store-row-head { align-items: flex-start; flex-direction: column; gap: 12px; }
  .showcase-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .benefits-grid { grid-template-columns: 1fr 1fr; }
  .benefit { padding: 20px 8px 20px 0; border-right: 0; }
  .promos { padding-block: 48px; }
  .promo, .promo-essentials { grid-template-columns: 1fr; min-height: 0; border-radius: 20px; }
  .promo-essentials .promo-copy { order: 0; }
  .promo-copy { padding: 32px 24px 0; }
  .promo-media { min-height: 260px; }
  .services { padding-block: 64px 40px; }
  .service-row { grid-template-columns: 72px minmax(0, 1fr); gap: 16px; padding-block: 24px; }
  .service-line { display: none; }
  .faq { grid-template-columns: 1fr; gap: 24px; padding-block: 48px 64px; }
  .visit-body { grid-template-columns: 1fr; gap: 24px; padding-top: 40px; }
  .visit-pin { width: 88px; height: 88px; }
  .storefront:has(.landing[data-active]:not([data-stage="light"])) .store-navigation.is-open {
    background: rgba(5, 7, 6, .94);
    backdrop-filter: blur(12px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .visit-marquee-track { animation: none; }
  .landing *, .landing *::before, .landing *::after { transition-duration: 0s !important; }
}
```

- [ ] **Step 8: Delete the replaced components**

```bash
git rm -q src/components/store-hero.tsx src/components/home-products.tsx
```

- [ ] **Step 9: Verify**

Run: `npx tsc --noEmit && npm test && npx eslint src/components/landing "src/app/(store)/page.tsx" && npx next build`
Expected: all exit 0 (no ESLint output for the new files).

- [ ] **Step 10: Commit**

```bash
git add -A src/components/landing "src/app/(store)/page.tsx" src/components/store-hero.tsx src/components/home-products.tsx
git commit -m "feat(landing): server-rendered dark stage, film copy and light store sections with header stages"
```

---

### Task 6: Live 3D phone in the hero

**Files:**
- Create: `src/components/landing/three/phone-layer.tsx`, `src/components/landing/three/phone-canvas.tsx`, `src/components/landing/three/phone-model.tsx`
- Modify: `src/components/landing/landing-experience.tsx` (mount `PhoneLayer`)

**Interfaces:**
- Consumes: `MODEL_URL`, `scene`, `subscribeScene`, `getSceneVisible`, `Finish`, `Tier`.
- Produces: `PhoneLayer({ tier: "high"|"mid", initialFinish, onReady, onError })` (default export of `phone-layer.tsx`).

- [ ] **Step 1: `src/components/landing/three/phone-model.tsx`**

```tsx
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
```

- [ ] **Step 2: `src/components/landing/three/phone-canvas.tsx`**

```tsx
"use client";

import { Suspense, useSyncExternalStore } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import type { Finish } from "../data";
import { getSceneVisible, subscribeScene } from "../scene-store";
import { PhoneModel } from "./phone-model";

function StudioLights() {
  return (
    <>
      <ambientLight intensity={0.12} />
      <directionalLight position={[-2, 1.2, 1.5]} intensity={0.7} color="#3ddc84" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.4} position={[0, 2.6, 1.2]} scale={[4, 0.5, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.6} position={[-2.6, 0.2, 1]} scale={[0.35, 3.2, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.2} position={[2.6, 0.2, 1]} scale={[0.35, 3.2, 1]} rotation-y={-Math.PI / 2} />
        <Lightformer form="ring" intensity={0.9} color="#3ddc84" position={[0, 0, -3]} scale={2.2} />
      </Environment>
    </>
  );
}

export default function PhoneCanvas({
  tier,
  initialFinish,
  onReady,
}: {
  tier: "high" | "mid";
  initialFinish: Finish | null;
  onReady: () => void;
}) {
  const visible = useSyncExternalStore(subscribeScene, getSceneVisible, () => true);
  return (
    <Canvas
      frameloop={visible ? "always" : "never"}
      dpr={tier === "high" ? [1, 2] : [1, 1.5]}
      camera={{ fov: 24, position: [0, 0, 1.15], near: 0.01, far: 20 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
    >
      <Suspense fallback={null}>
        <StudioLights />
        <PhoneModel tier={tier} initialFinish={initialFinish} onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
```

- [ ] **Step 3: `src/components/landing/three/phone-layer.tsx`**

```tsx
"use client";

import { Component, type ReactNode } from "react";
import dynamic from "next/dynamic";
import type { Finish } from "../data";

const PhoneCanvas = dynamic(() => import("./phone-canvas"), { ssr: false });

class CanvasBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export default function PhoneLayer({
  tier,
  initialFinish,
  onReady,
  onError,
}: {
  tier: "high" | "mid";
  initialFinish: Finish | null;
  onReady: () => void;
  onError: () => void;
}) {
  return (
    <div className="phone-layer" aria-hidden="true">
      <CanvasBoundary onError={onError}>
        <PhoneCanvas tier={tier} initialFinish={initialFinish} onReady={onReady} />
      </CanvasBoundary>
    </div>
  );
}
```

- [ ] **Step 4: Mount it in `landing-experience.tsx`** — add the import

```tsx
import PhoneLayer from "./three/phone-layer";
```

Then render it as the last child of `<main>`, after `{children}`, so the fixed canvas paints above the hero word but below the hero content (see the paint-order note in `landing.css`):

```tsx
      {tier !== null && tier !== "low" && (
        <PhoneLayer
          tier={tier}
          initialFinish={initialFinish}
          onReady={() => rootRef.current?.setAttribute("data-phone", "ready")}
          onError={() => rootRef.current?.setAttribute("data-phone", "failed")}
        />
      )}
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npx eslint src/components/landing && npx next build`
Expected: exit 0. The build output's `/` route has no new errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/landing
git commit -m "feat(landing): live 3D phone in the hero (lazy R3F canvas, tiers, finishes, idle + pointer)"
```

---

### Task 7: Browser checks for Phase 1

**Files:**
- Create: `e2e/landing.e2e.mjs`

**Interfaces:** Consumes the DOM contract from Tasks 5 and 6:
- `main.landing[data-stage|data-phone|data-tier]`
- `html[data-scroll]`
- `.hero-price strong`, `.hero-ctas .landing-cta`, role `radio`
- `.rail-tile .rail-label`, `.showcase-tabs button`, `#services` / `#help` / `#visit`
- `.phone-layer`

- [ ] **Step 1: Write `e2e/landing.e2e.mjs`**

```js
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
await d.screenshot({ path: `${OUT}/p1-hero-desktop.png` });

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
```

- [ ] **Step 2: Build, start and run**

```bash
npx next build && (npx next start -p 3000 &) && sleep 3 && npm run e2e
```
Expected: `0 failed / N checks` and `No console errors, page errors or 5xx responses.` Then review the screenshots in `e2e/.artifacts/` (hero desktop, film, showcase, hero mobile).

- [ ] **Step 3: Fix anything that fails**, re-run until green, then stop the server.

- [ ] **Step 4: Commit**

```bash
git add e2e/landing.e2e.mjs
git commit -m "test(landing): browser checks for tiers, stages, smooth scroll, 3D readiness and shopping flow"
```
