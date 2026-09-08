import test from "node:test";
import assert from "node:assert/strict";
import { createCaptureService } from "../../src/domain/capture-service.js";
import { createFragmentStore } from "../../src/domain/store.js";

function memoryStore(initial = [], failWritesAt = []) {
  let value = structuredClone(initial);
  let writes = 0;
  const store = createFragmentStore({
    read: () => structuredClone(value),
    write: (next) => {
      writes += 1;
      if (failWritesAt.includes(writes)) throw new Error("disk_full");
      value = structuredClone(next);
    },
  });
  return { store, snapshot: () => structuredClone(value) };
}

test("empty exact string is rejected without remote call", async () => {
  const { store } = memoryStore();
  let calls = 0;
  const service = createCaptureService({ store, remote: { createSticky: async () => { calls++; } }, now: () => "now" });
  const result = await service.send({ id: "e", text: "", createdAt: "created" });
  assert.equal(result.ok, false);
  assert.equal(result.error, "empty_fragment");
  assert.equal(result.clearInput, false);
  assert.equal(calls, 0);
});

test("whitespace-only fragment is valid and success clears only after sent persists", async () => {
  const { store, snapshot } = memoryStore();
  const text = "  \n ";
  const calls = [];
  const service = createCaptureService({
    store,
    remote: { createSticky: async (input) => { calls.push(input); return { ok: true, itemId: "sticky-1" }; } },
    now: () => "2026-09-08T12:00:00.000Z",
  });
  const result = await service.send({ id: "a", text, createdAt: "2026-09-08T11:00:00.000Z" });
  assert.equal(result.ok, true);
  assert.equal(result.clearInput, true);
  assert.equal(result.fragment.status, "sent");
  assert.equal(snapshot()[0].text, text);
  assert.deepEqual(calls, [{ text, position: { x: 0, y: 0 } }]);
});

test("remote failure marks failed and preserves exact text", async () => {
  const { store, snapshot } = memoryStore();
  const text = "  中文\n<raw> 🌙  ";
  const service = createCaptureService({ store, remote: { createSticky: async () => ({ ok: false, error: "offline" }) }, now: () => "now" });
  const result = await service.send({ id: "a", text, createdAt: "created" });
  assert.equal(result.ok, false);
  assert.equal(result.clearInput, false);
  assert.equal(result.error, "offline");
  assert.equal(snapshot()[0].status, "failed");
  assert.equal(snapshot()[0].text, text);
});

test("retry reuses locally preserved text instead of transient caller text", async () => {
  const original = "  original\n🌙  ";
  const { store } = memoryStore([{ id: "a", text: original, createdAt: "created", sentAt: null, status: "failed" }]);
  const seen = [];
  const service = createCaptureService({ store, remote: { createSticky: async ({ text }) => { seen.push(text); return { ok: true, itemId: "x" }; } }, now: () => "sent" });
  const result = await service.send({ id: "a", text: "transient overwrite", createdAt: "later" });
  assert.equal(result.ok, true);
  assert.deepEqual(seen, [original]);
  assert.equal(result.fragment.text, original);
});

test("already-sent fragment is idempotent and makes no remote call", async () => {
  const { store } = memoryStore([{ id: "a", text: "sent", createdAt: "c", sentAt: "s", status: "sent" }]);
  let calls = 0;
  const service = createCaptureService({ store, remote: { createSticky: async () => { calls++; return { ok: true }; } }, now: () => "now" });
  const result = await service.send({ id: "a", text: "sent", createdAt: "c" });
  assert.equal(result.ok, true);
  assert.equal(result.clearInput, true);
  assert.equal(calls, 0);
});

test("local persistence failure never grants clear permission", async () => {
  const { store } = memoryStore([], [3]);
  const service = createCaptureService({ store, remote: { createSticky: async () => ({ ok: true, itemId: "remote-created" }) }, now: () => "sent" });
  const result = await service.send({ id: "a", text: "keep", createdAt: "created" });
  assert.equal(result.ok, false);
  assert.equal(result.clearInput, false);
  assert.equal(result.error, "sent_state_persist_failed");
});
