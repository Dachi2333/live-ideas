import test from "node:test";
import assert from "node:assert/strict";
import { createFragmentStore } from "../../src/fragments/store.js";

function makeMemoryPersistence(initial = []) {
  let value = structuredClone(initial);
  return {
    readJson: () => structuredClone(value),
    writeJson: (next) => {
      value = structuredClone(next);
      return true;
    },
    value: () => structuredClone(value),
  };
}

test("store saves and replaces one fragment by id", () => {
  const persistence = makeMemoryPersistence();
  const store = createFragmentStore(persistence);
  const draft = {
    id: "a",
    text: "line",
    createdAt: "2026-09-08T10:00:00.000Z",
    sentAt: null,
    status: "draft",
  };

  store.insert(draft);
  store.replace({ ...draft, status: "failed" });

  assert.equal(store.get("a").status, "failed");
  assert.equal(persistence.value().length, 1);
});

test("listSent returns only sent fragments newest first", () => {
  const persistence = makeMemoryPersistence([
    { id: "1", text: "old", createdAt: "2026-09-08T10:00:00.000Z", sentAt: "2026-09-08T10:01:00.000Z", status: "sent" },
    { id: "2", text: "failed", createdAt: "2026-09-08T10:02:00.000Z", sentAt: null, status: "failed" },
    { id: "3", text: "new", createdAt: "2026-09-08T10:03:00.000Z", sentAt: "2026-09-08T10:04:00.000Z", status: "sent" },
  ]);
  const store = createFragmentStore(persistence);

  assert.deepEqual(store.listSent().map((item) => item.id), ["3", "1"]);
  assert.equal(store.countSent(), 2);
});

test("write failures surface instead of pretending persistence succeeded", () => {
  const store = createFragmentStore({
    readJson: () => [],
    writeJson: () => false,
  });

  assert.throws(
    () => store.insert({ id: "x", text: "x", createdAt: "now", sentAt: null, status: "draft" }),
    /fragment_store_write_failed/,
  );
});
