import test from "node:test";
import assert from "node:assert/strict";
import { getStickyPosition } from "../../src/domain/positioning.js";

test("sticky positions follow a deterministic four-column grid", () => {
  assert.deepEqual(getStickyPosition(0), { x: 0, y: 0 });
  assert.deepEqual(getStickyPosition(1), { x: 320, y: 0 });
  assert.deepEqual(getStickyPosition(3), { x: 960, y: 0 });
  assert.deepEqual(getStickyPosition(4), { x: 0, y: 320 });
});

test("sticky position rejects negative and non-integer indices", () => {
  assert.throws(() => getStickyPosition(-1), /invalid_position_index/);
  assert.throws(() => getStickyPosition(1.5), /invalid_position_index/);
});
