import test from "node:test";
import assert from "node:assert/strict";
import { getStickyPosition } from "../../src/positioning/grid.js";

test("positioning uses a predictable 4-column grid", () => {
  assert.deepEqual(getStickyPosition(0), { x: 0, y: 0 });
  assert.deepEqual(getStickyPosition(1), { x: 320, y: 0 });
  assert.deepEqual(getStickyPosition(3), { x: 960, y: 0 });
  assert.deepEqual(getStickyPosition(4), { x: 0, y: 320 });
  assert.deepEqual(getStickyPosition(5), { x: 320, y: 320 });
});

test("first 20 positions do not duplicate coordinates", () => {
  const positions = Array.from({ length: 20 }, (_, index) => getStickyPosition(index));
  const keys = positions.map(({ x, y }) => `${x}:${y}`);
  assert.equal(new Set(keys).size, 20);
});

test("invalid indexes are rejected", () => {
  assert.throws(() => getStickyPosition(-1), /invalid_position_index/);
  assert.throws(() => getStickyPosition(1.2), /invalid_position_index/);
});
