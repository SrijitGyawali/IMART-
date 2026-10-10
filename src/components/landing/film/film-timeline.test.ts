import { test } from "node:test";
import assert from "node:assert/strict";
import { actOpacity, activeAct, filmBeats, filmPose, ramp, window4 } from "./film-timeline.ts";

const close = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;

test("ramp and window4 shapes", () => {
  assert.equal(ramp(0.1, 0.2, 0.4), 0);
  assert.equal(ramp(0.5, 0.2, 0.4), 1);
  assert.ok(close(ramp(0.3, 0.2, 0.4), 0.5));
  assert.equal(window4(0.5, 0.1, 0.2, 0.6, 0.7), 1);
  assert.equal(window4(0.05, 0.1, 0.2, 0.6, 0.7), 0);
  assert.equal(window4(0.75, 0.1, 0.2, 0.6, 0.7), 0);
});

test("acts follow the spec ranges", () => {
  assert.equal(activeAct(0), 1);
  assert.equal(activeAct(0.3), 2);
  assert.equal(activeAct(0.6), 3);
  assert.equal(activeAct(0.8), 4);
  assert.ok(actOpacity(0.14).a1 > 0.99);
  assert.ok(actOpacity(0.33).labels > 0.5);
  assert.ok(actOpacity(0.7).a3 > 0.99);
  assert.ok(actOpacity(0.86).a4 > 0.99);
  assert.equal(actOpacity(0.86).a1, 0);
});

test("pose is continuous and starts where the hero hand-off ends", () => {
  const start = filmPose(0);
  assert.ok(close(start.yaw, -0.1) && close(start.scale, 1) && close(start.exposure, 1));
  for (let p = 0; p < 1; p += 0.001) {
    const a = filmPose(p);
    const b = filmPose(p + 0.001);
    assert.ok(Math.abs(a.yaw - b.yaw) < 0.08, `yaw jump at ${p}`);
    assert.ok(Math.abs(a.scale - b.scale) < 0.08, `scale jump at ${p}`);
  }
  assert.ok(filmPose(0.45).exposure < 0.3, "dark while passing between layers");
});

test("layers open, then lock one by one; the frame never moves", () => {
  assert.deepEqual(filmBeats(0).explode, [0, 0, 0, 0, 0]);
  const open = filmBeats(0.4).explode;
  assert.ok(open[0] > 0.99 && open[1] > 0.99 && open[2] > 0.99 && open[4] > 0.99);
  assert.equal(open[3], 0);
  const locking = filmBeats(0.53).explode;
  assert.ok(locking[0] < 0.01 && locking[4] > 0.99, "back glass locks before the display");
  assert.deepEqual(filmBeats(0.6).explode.map((v) => Math.round(v)), [0, 0, 0, 0, 0]);
});

test("screen story runs in order", () => {
  assert.ok(filmBeats(0.3).power < 0.01, "screen off while open");
  assert.ok(filmBeats(0.6).power > 0.99, "screen on after the display connects");
  const m = [0.7, 0.72, 0.74, 0.76, 0.78].map((p) => filmBeats(p).morph);
  for (let i = 1; i < m.length; i++) assert.ok(m[i] >= m[i - 1]);
  assert.ok(close(filmBeats(0.8).morph, 2));
  assert.ok(filmBeats(0.88).map > 0.99 && filmBeats(0.89).notify > 0.5);
});
