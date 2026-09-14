import test from "node:test";
import assert from "node:assert/strict";
import { createFragmentStore } from "../../src/domain/store.js";

function memoryStore(initial = []) {
  let value = structuredClone(initial);
  return {
    read: () => structuredClone(value),
    write: (next) => { value = structuredClone(next); },
  };
}

test("store inserts, replaces, gets, and counts sent fragments", () => {
  const io = memoryStore();
  const store = createFragmentStore(io);
  const a = { id: "a", text: "A", createdAt: "1", sentAt: null, status: "draft" };
  store.insert(a);
  assert.deepEqual(store.get("a"), a);
  store.replace({ ...a, status: "sent", sentAt: "2026-09-08T11:00:00.000Z" });
  assert.equal(store.countSent(), 1);
});

test("listSent returns sent records newest first only", () => {
  const io = memoryStore([
    { id: "old", text: "old", createdAt: "1", sentAt: "2026-09-08T10:00:00.000Z", status: "sent" },
    { id: "draft", text: "draft", createdAt: "2", sentAt: null, status: "draft" },
    { id: "new", text: "new", createdAt: "3", sentAt: "2026-09-08T12:00:00.000Z", status: "sent" },
  ]);
  const store = createFragmentStore(io);
  assert.deepEqual(store.listSent().map((f) => f.id), ["new", "old"]);
});

test("remove deletes only the matching local fragment", () => {
  const io = memoryStore([
    { id: "keep", text: "keep", status: "sent", sentAt: "2026-09-08T10:00:00.000Z" },
    { id: "delete", text: "delete", status: "sent", sentAt: "2026-09-08T11:00:00.000Z" },
  ]);
  const store = createFragmentStore(io);
  assert.equal(store.remove("delete"), true);
  assert.equal(store.get("delete"), null);
  assert.equal(store.get("keep").text, "keep");
  assert.equal(store.remove("missing"), false);
});

test("store rejects duplicate insert and missing replace", () => {
  const io = memoryStore([{ id: "a", text: "A", createdAt: "1", sentAt: null, status: "draft" }]);
  const store = createFragmentStore(io);
  assert.throws(() => store.insert({ id: "a" }), /fragment_already_exists/);
  assert.throws(() => store.replace({ id: "missing" }), /fragment_not_found/);
});
