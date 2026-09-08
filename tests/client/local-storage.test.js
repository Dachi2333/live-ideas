import test from "node:test";
import assert from "node:assert/strict";
import { createBrowserPersistence, CAPTURE_KEY, FRAGMENTS_KEY } from "../../src/client/local-storage.js";

function fakeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    snapshot: () => Object.fromEntries(map),
  };
}

test("capture survives recreation with exact whitespace and multiline text", () => {
  const storage = fakeStorage();
  const p1 = createBrowserPersistence(storage);
  const capture = { id: "a", text: "  中文\n🌙  ", createdAt: "2026-09-08T10:00:00.000Z" };
  p1.saveCapture(capture);
  const p2 = createBrowserPersistence(storage);
  assert.deepEqual(p2.loadCapture(), capture);
  assert.equal(JSON.parse(storage.snapshot()[CAPTURE_KEY]).text, capture.text);
});

test("capture can be explicitly cleared", () => {
  const storage = fakeStorage();
  const persistence = createBrowserPersistence(storage);
  persistence.saveCapture({ id: "a", text: "x", createdAt: "c" });
  persistence.clearCapture();
  assert.equal(persistence.loadCapture(), null);
});

test("fragment IO round-trips arrays and recovers from malformed local data", () => {
  const storage = fakeStorage();
  const persistence = createBrowserPersistence(storage);
  const items = [{ id: "a", text: "x", createdAt: "c", sentAt: "s", status: "sent" }];
  persistence.fragments.write(items);
  assert.deepEqual(persistence.fragments.read(), items);
  storage.setItem(FRAGMENTS_KEY, "not json");
  assert.deepEqual(persistence.fragments.read(), []);
});
