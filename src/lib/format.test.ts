import { test } from "node:test";
import assert from "node:assert/strict";
import { formatColors, formatPrice, formatStorage, formatVariant } from "./format.ts";

test("prices use Nepali digit grouping", () => {
  assert.equal(formatPrice(257999), "Rs. 2,57,999");
  assert.equal(formatPrice(6500.4), "Rs. 6,500");
});

test("colour lists are spaced and capitalised", () => {
  assert.equal(formatColors("Black,White,Sage,Mist blue,Lavender"), "Black, White, Sage, Mist blue, Lavender");
  assert.equal(formatColors(" white "), "White");
  assert.equal(formatColors("Cosmic orange, ,Deep blue"), "Cosmic orange, Deep blue");
  assert.equal(formatColors(null), "");
});

test("storage always carries its unit", () => {
  assert.equal(formatStorage("128"), "128 GB");
  assert.equal(formatStorage("256GB"), "256 GB");
  assert.equal(formatStorage("256 GB"), "256 GB");
  assert.equal(formatStorage("1tb"), "1 TB");
  assert.equal(formatStorage("8GB / 256GB"), "8GB / 256GB");
  assert.equal(formatStorage(undefined), "");
});

test("a card's variant line joins whatever is present", () => {
  assert.equal(formatVariant("Black,White", "256"), "Black, White · 256 GB");
  assert.equal(formatVariant("white", null), "White");
  assert.equal(formatVariant(null, "128"), "128 GB");
  assert.equal(formatVariant(null, null), "");
});
