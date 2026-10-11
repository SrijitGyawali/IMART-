import { test } from "node:test";
import assert from "node:assert/strict";
import { welcomeMotion } from "./welcome-motion.ts";

test("welcome is present on arrival and completely clears before the film", () => {
  assert.deepEqual(welcomeMotion(0), { opacity: 1, collapse: 0 });
  assert.deepEqual(welcomeMotion(1), { opacity: 0, collapse: 1 });
  assert.deepEqual(welcomeMotion(-1), welcomeMotion(0));
  assert.deepEqual(welcomeMotion(2), welcomeMotion(1));
});
test("route contracts before the welcome disappears, smoothly in both scroll directions", () => {
  assert.ok(welcomeMotion(0.3).collapse > 0);
  assert.equal(welcomeMotion(0.3).opacity, 1);
  let previous = welcomeMotion(0);
  for (let i = 1; i <= 100; i++) {
    const next = welcomeMotion(i / 100);
    assert.ok(next.opacity <= previous.opacity && next.collapse >= previous.collapse);
    assert.ok(previous.opacity - next.opacity < 0.04 && next.collapse - previous.collapse < 0.04);
    previous = next;
  }
});
