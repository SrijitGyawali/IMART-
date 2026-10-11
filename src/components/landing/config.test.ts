import { test } from "node:test";
import assert from "node:assert/strict";
import { readCapture, stillUrl } from "./config.ts";

test("stillUrl maps rendered finishes and falls back", () => {
  assert.equal(stillUrl("deep-blue"), "/renders/hero-deep-blue.v2.webp");
  assert.equal(stillUrl("sage"), "/renders/hero-fallback.v2.webp");
  assert.equal(stillUrl(null), "/renders/hero-fallback.v2.webp");
});

test("readCapture only activates with capture=1", () => {
  assert.equal(readCapture("?capture=1&finish=silver"), "silver");
  assert.equal(readCapture("?capture=1"), "fallback");
  assert.equal(readCapture("?finish=silver"), null);
});
