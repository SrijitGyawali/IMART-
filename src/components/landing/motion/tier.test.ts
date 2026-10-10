import { test } from "node:test";
import assert from "node:assert/strict";
import { capTier, decideTier, lowerTier, readTierOverride, type TierInput } from "./tier.ts";

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

test("runtime step-downs go one tier at a time and stop at low", () => {
  assert.equal(lowerTier("high"), "mid");
  assert.equal(lowerTier("mid"), "low");
  assert.equal(lowerTier("low"), "low");
});

test("the session cap only ever lowers the tier", () => {
  assert.equal(capTier("high", null), "high");
  assert.equal(capTier("high", "mid"), "mid");
  assert.equal(capTier("mid", "low"), "low");
  assert.equal(capTier("mid", "high"), "mid");
  assert.equal(capTier("low", "mid"), "low");
});
