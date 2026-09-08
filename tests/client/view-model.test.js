import test from "node:test";
import assert from "node:assert/strict";
import { createCaptureViewModel } from "../../src/client/view-model.js";
import { createBrowserPersistence } from "../../src/client/local-storage.js";
import { createFragmentStore } from "../../src/domain/store.js";

function fakeStorage() {
  const map = new Map();
  return {
    getItem: (key) => map.has(key) ? map.get(key) : null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
  };
}

function setup(remote) {
  const persistence = createBrowserPersistence(fakeStorage());
  const store = createFragmentStore(persistence.fragments);
  let ids = 0;
  let times = 0;
  const vm = createCaptureViewModel({
    persistence,
    store,
    remote,
    makeId: () => `id-${++ids}`,
    now: () => `2026-09-08T10:00:0${++times}.000Z`,
  });
  return { vm, persistence, store };
}

test("typing persists current capture immediately", () => {
  const { vm, persistence } = setup({ createSticky: async () => ({ ok: true, itemId: "x" }) });
  vm.setText("  lyric\n🌙  ");
  assert.equal(vm.getState().text, "  lyric\n🌙  ");
  assert.equal(persistence.loadCapture().text, "  lyric\n🌙  ");
});

test("success clears current capture only after successful service completion", async () => {
  const { vm, persistence, store } = setup({ createSticky: async () => ({ ok: true, itemId: "sticky" }) });
  vm.setText("line");
  const result = await vm.send();
  assert.equal(result.ok, true);
  assert.equal(vm.getState().text, "");
  assert.equal(persistence.loadCapture(), null);
  assert.equal(store.listSent()[0].text, "line");
});

test("failure keeps current capture and exposes retry state", async () => {
  let calls = 0;
  const { vm, persistence } = setup({ createSticky: async () => { calls++; return calls === 1 ? { ok: false, error: "offline" } : { ok: true, itemId: "sticky" }; } });
  vm.setText("  keep me  ");
  const failed = await vm.send();
  assert.equal(failed.ok, false);
  assert.equal(vm.getState().text, "  keep me  ");
  assert.equal(vm.getState().error, "offline");
  assert.equal(persistence.loadCapture().text, "  keep me  ");
  const retried = await vm.send();
  assert.equal(retried.ok, true);
  assert.equal(vm.getState().text, "");
  assert.equal(calls, 2);
});

test("repeated send while request is in flight makes only one remote call", async () => {
  let release;
  let calls = 0;
  const gate = new Promise((resolve) => { release = resolve; });
  const { vm } = setup({ createSticky: async () => { calls++; await gate; return { ok: true, itemId: "sticky" }; } });
  vm.setText("line");
  const first = vm.send();
  const second = await vm.send();
  assert.equal(second.ok, false);
  assert.equal(second.error, "send_in_progress");
  assert.equal(calls, 1);
  release();
  await first;
});

test("sent fragments are exposed newest first", async () => {
  const { vm } = setup({ createSticky: async () => ({ ok: true, itemId: "sticky" }) });
  vm.setText("first");
  await vm.send();
  vm.setText("second");
  await vm.send();
  assert.deepEqual(vm.listSent().map((f) => f.text), ["second", "first"]);
});

test("local capture persistence failure keeps in-memory text and reports failure without sending", async () => {
  let calls = 0;
  const persistence = {
    loadCapture: () => null,
    saveCapture: () => { throw new Error("quota"); },
    clearCapture: () => {},
    fragments: { read: () => [], write: () => {} },
  };
  const store = createFragmentStore(persistence.fragments);
  const vm = createCaptureViewModel({
    persistence,
    store,
    remote: { createSticky: async () => { calls++; return { ok: true, itemId: "x" }; } },
    makeId: () => "id",
    now: () => "now",
  });
  const changed = vm.setText("must remain visible");
  assert.equal(changed, false);
  assert.equal(vm.getState().text, "must remain visible");
  assert.equal(vm.getState().error, "local_save_failed");
  const result = await vm.send();
  assert.equal(result.ok, false);
  assert.equal(result.error, "local_save_failed");
  assert.equal(calls, 0);
});
