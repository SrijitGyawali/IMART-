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
