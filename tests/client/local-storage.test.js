import test from "node:test";
import assert from "node:assert/strict";
import { createBrowserPersistence, CAPTURE_KEY, FRAGMENTS_KEY } from "../../src/client/local-storage.js";

const LEGACY_CAPTURE_KEY = "live-lyrics:capture:v1";
const LEGACY_FRAGMENTS_KEY = "live-lyrics:fragments:v1";

function fakeStorage(initial = {}, options = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => {
      if (options.throwOnSet?.has(key)) throw new Error("quota");
      map.set(key, String(value));
    },
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

test("legacy Live Lyrics capture and Fragments migrate once to Live Ideas keys", () => {
  const capture = { id: "legacy-draft", text: "legacy draft", createdAt: "c" };
  const fragments = [{ id: "legacy-sent", text: "legacy sent", createdAt: "c", sentAt: "s", status: "sent" }];
  const storage = fakeStorage({
    [LEGACY_CAPTURE_KEY]: JSON.stringify(capture),
    [LEGACY_FRAGMENTS_KEY]: JSON.stringify(fragments),
  });

  const persistence = createBrowserPersistence(storage);

  assert.deepEqual(persistence.loadCapture(), capture);
  assert.deepEqual(persistence.fragments.read(), fragments);
  assert.deepEqual(JSON.parse(storage.getItem("live-ideas:capture:v1")), capture);
  assert.deepEqual(JSON.parse(storage.getItem("live-ideas:fragments:v1")), fragments);
  assert.equal(storage.getItem(LEGACY_CAPTURE_KEY), null);
  assert.equal(storage.getItem(LEGACY_FRAGMENTS_KEY), null);
});

test("new Live Ideas keys win when both new and legacy generations exist", () => {
  const newCapture = { id: "new", text: "new draft", createdAt: "n" };
  const legacyCapture = { id: "legacy", text: "old draft", createdAt: "l" };
  const newFragments = [{ id: "new-sent", text: "new sent", createdAt: "n", sentAt: "n", status: "sent" }];
  const legacyFragments = [{ id: "old-sent", text: "old sent", createdAt: "l", sentAt: "l", status: "sent" }];
  const storage = fakeStorage({
    "live-ideas:capture:v1": JSON.stringify(newCapture),
    "live-ideas:fragments:v1": JSON.stringify(newFragments),
    [LEGACY_CAPTURE_KEY]: JSON.stringify(legacyCapture),
    [LEGACY_FRAGMENTS_KEY]: JSON.stringify(legacyFragments),
  });

  const persistence = createBrowserPersistence(storage);

  assert.deepEqual(persistence.loadCapture(), newCapture);
  assert.deepEqual(persistence.fragments.read(), newFragments);
});

test("legacy data is not removed when migration cannot persist the new key", () => {
  const capture = { id: "legacy", text: "must survive", createdAt: "c" };
  const storage = fakeStorage(
    { [LEGACY_CAPTURE_KEY]: JSON.stringify(capture) },
    { throwOnSet: new Set(["live-ideas:capture:v1"]) },
  );

  assert.throws(() => createBrowserPersistence(storage), /quota/);
  assert.equal(storage.getItem(LEGACY_CAPTURE_KEY), JSON.stringify(capture));
});
