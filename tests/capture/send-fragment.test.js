import test from "node:test";
import assert from "node:assert/strict";
import { createFragmentStore } from "../../src/fragments/store.js";
import { createCaptureService } from "../../src/capture/send-fragment.js";

function memoryStore() {
  let data = [];
  return createFragmentStore({
    readJson: () => structuredClone(data),
    writeJson: (next) => {
      data = structuredClone(next);
      return true;
    },
  });
}

test("confirmed Miro success marks sent and explicitly allows clearing input", () => {
  const store = memoryStore();
  let calls = 0;
  const service = createCaptureService({
    store,
    miro: {
      createSticky: ({ text, position }) => {
        calls += 1;
        assert.equal(text, "你好 🌙");
        assert.deepEqual(position, { x: 0, y: 0 });
        return { ok: true, itemId: "sticky-1" };
      },
    },
    now: () => "2026-09-08T10:01:00.000Z",
  });

  const result = service.send({
    id: "f-1",
    text: "你好 🌙",
    createdAt: "2026-09-08T10:00:00.000Z",
  });

  assert.equal(result.ok, true);
  assert.equal(result.clearInput, true);
  assert.equal(result.fragment.status, "sent");
  assert.equal(result.fragment.sentAt, "2026-09-08T10:01:00.000Z");
  assert.equal(store.get("f-1").status, "sent");
  assert.equal(calls, 1);
});

test("Miro failure preserves exact text, marks failed, and forbids clearing", () => {
  const store = memoryStore();
  const service = createCaptureService({
    store,
    miro: { createSticky: () => ({ ok: false, statusCode: 429, error: "rate_limit" }) },
    now: () => "2026-09-08T10:01:00.000Z",
  });
  const text = "  <hook>\nさよなら 😭  ";

  const result = service.send({
    id: "f-2",
    text,
    createdAt: "2026-09-08T10:00:00.000Z",
  });

  assert.equal(result.ok, false);
  assert.equal(result.clearInput, false);
  assert.equal(result.error, "rate_limit");
  assert.equal(result.fragment.status, "failed");
  assert.equal(store.get("f-2").text, text);
});

test("retry reuses the failed record and sends the same text", () => {
  const store = memoryStore();
  let attempts = 0;
  const seen = [];
  const service = createCaptureService({
    store,
    miro: {
      createSticky: ({ text }) => {
        attempts += 1;
        seen.push(text);
        return attempts === 1
          ? { ok: false, error: "offline" }
          : { ok: true, itemId: "sticky-2" };
      },
    },
    now: () => "2026-09-08T10:02:00.000Z",
  });

  const input = {
    id: "retry-id",
    text: "same exact text 🫧",
    createdAt: "2026-09-08T10:00:00.000Z",
  };
  const first = service.send(input);
  const second = service.send(input);

  assert.equal(first.clearInput, false);
  assert.equal(second.clearInput, true);
  assert.deepEqual(seen, [input.text, input.text]);
  assert.equal(store.countSent(), 1);
  assert.equal(store.get(input.id).status, "sent");
});

test("already sent id is idempotent and does not create a duplicate sticky", () => {
  const store = memoryStore();
  let calls = 0;
  const service = createCaptureService({
    store,
    miro: {
      createSticky: () => {
        calls += 1;
        return { ok: true, itemId: "sticky" };
      },
    },
    now: () => "2026-09-08T10:01:00.000Z",
  });
  const input = { id: "same", text: "line", createdAt: "2026-09-08T10:00:00.000Z" };

  assert.equal(service.send(input).ok, true);
  const replay = service.send(input);

  assert.equal(replay.ok, true);
  assert.equal(replay.clearInput, true);
  assert.equal(calls, 1);
});

test("empty string is rejected without persistence or network work", () => {
  const store = memoryStore();
  let calls = 0;
  const service = createCaptureService({
    store,
    miro: { createSticky: () => { calls += 1; return { ok: true, itemId: "x" }; } },
    now: () => "now",
  });

  const result = service.send({ id: "empty", text: "", createdAt: "now" });
  assert.deepEqual(result, {
    ok: false,
    clearInput: false,
    fragment: null,
    error: "empty_fragment",
  });
  assert.equal(calls, 0);
  assert.equal(store.get("empty"), null);
});

test("local persistence failure never grants clear permission", () => {
  let writes = 0;
  let data = [];
  const store = createFragmentStore({
    readJson: () => structuredClone(data),
    writeJson: (next) => {
      writes += 1;
      if (writes === 3) return false;
      data = structuredClone(next);
      return true;
    },
  });
  const service = createCaptureService({
    store,
    miro: { createSticky: () => ({ ok: true, itemId: "remote-created" }) },
    now: () => "2026-09-08T10:01:00.000Z",
  });

  const result = service.send({ id: "persist", text: "keep me", createdAt: "2026-09-08T10:00:00.000Z" });
  assert.equal(result.ok, false);
  assert.equal(result.clearInput, false);
  assert.equal(result.error, "sent_state_persist_failed");
  assert.equal(store.get("persist").text, "keep me");
});
