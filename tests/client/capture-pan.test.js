import test from "node:test";
import assert from "node:assert/strict";
import { shouldPreventCapturePan } from "../../src/client/capture-pan.js";

test("capture pan guard blocks page panning outside the textarea", () => {
  assert.equal(shouldPreventCapturePan({ isInput: false, deltaY: -20 }), true);
});

test("capture pan guard blocks panning when the textarea has no internal scroll range", () => {
  assert.equal(shouldPreventCapturePan({
    isInput: true,
    scrollTop: 0,
    scrollHeight: 300,
    clientHeight: 300,
    deltaY: -20,
  }), true);
});

test("capture pan guard allows textarea scrolling only while content can move in that direction", () => {
  assert.equal(shouldPreventCapturePan({
    isInput: true,
    scrollTop: 0,
    scrollHeight: 600,
    clientHeight: 300,
    deltaY: -20,
  }), false);

  assert.equal(shouldPreventCapturePan({
    isInput: true,
    scrollTop: 120,
    scrollHeight: 600,
    clientHeight: 300,
    deltaY: 20,
  }), false);

  assert.equal(shouldPreventCapturePan({
    isInput: true,
    scrollTop: 0,
    scrollHeight: 600,
    clientHeight: 300,
    deltaY: 20,
  }), true);

  assert.equal(shouldPreventCapturePan({
    isInput: true,
    scrollTop: 300,
    scrollHeight: 600,
    clientHeight: 300,
    deltaY: -20,
  }), true);
});
