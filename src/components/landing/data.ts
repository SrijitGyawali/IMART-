import type { Category, Product } from "@/lib/types";

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

export function toPublicProduct(p: Product): Product {
  return {
    id: p.id, name: p.name, slug: p.slug, price: p.price, description: p.description,
    category_id: p.category_id, images: p.images, stock: p.stock, featured: p.featured,
    active: p.active, created_at: p.created_at, color: p.color, storage: p.storage,
  };
}
