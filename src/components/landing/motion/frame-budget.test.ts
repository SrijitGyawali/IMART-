import { test } from "node:test";
import assert from "node:assert/strict";
import { judgeFrames, windowFps } from "./frame-budget.ts";

test("window fps is frames over seconds", () => {
  assert.equal(windowFps(90, 1.5), 60);
  assert.equal(windowFps(0, 0), 60);
});

test("only a sustained shortfall steps down", () => {
  assert.equal(judgeFrames([]), false);
  assert.equal(judgeFrames([40, 41]), false);
  assert.equal(judgeFrames([40, 41, 42]), true);
  assert.equal(judgeFrames([40, 41, 55]), false);
  assert.equal(judgeFrames([60, 60, 45, 44, 43]), true);
  assert.equal(judgeFrames([49.9, 49, 48]), true);
  assert.equal(judgeFrames([50, 49, 48]), false);
});
