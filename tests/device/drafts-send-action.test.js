import test from "node:test";
import assert from "node:assert/strict";
import { runDraftsSendAction } from "../../src/device/drafts-send-action.js";

test("successful send retires the source draft and opens a new blank draft", () => {
  const events = [];
  const currentDraft = {
    uuid: "d-1",
    content: "line",
    createdAt: new Date("2026-09-08T10:00:00.000Z"),
  };

  const result = runDraftsSendAction({
    currentDraft,
    createService: () => ({
      send: (input) => {
        assert.deepEqual(input, {
          id: "d-1",
          text: "line",
          createdAt: "2026-09-08T10:00:00.000Z",
        });
        return { ok: true, clearInput: true, fragment: { id: "d-1" } };
      },
    }),
    onSuccess: () => events.push("success"),
    onFailure: () => events.push("failure"),
  });

  assert.equal(result.clearInput, true);
  assert.deepEqual(events, ["success"]);
});

test("failed send leaves the current input surface untouched", () => {
  const events = [];
  const result = runDraftsSendAction({
    currentDraft: {
      uuid: "d-2",
      content: "keep me",
      createdAt: new Date("2026-09-08T10:00:00.000Z"),
    },
    createService: () => ({
      send: () => ({ ok: false, clearInput: false, fragment: { id: "d-2" }, error: "offline" }),
    }),
    onSuccess: () => events.push("success"),
    onFailure: (error) => events.push(error),
  });

  assert.equal(result.clearInput, false);
  assert.deepEqual(events, ["offline"]);
});

test("clear permission is required even if a service accidentally reports ok", () => {
  const events = [];
  const result = runDraftsSendAction({
    currentDraft: { uuid: "d-3", content: "keep", createdAt: new Date("2026-09-08T10:00:00.000Z") },
    createService: () => ({
      send: () => ({ ok: true, clearInput: false, fragment: { id: "d-3" }, error: "not_persisted" }),
    }),
    onSuccess: () => events.push("success"),
    onFailure: (error) => events.push(error),
  });

  assert.equal(result.clearInput, false);
  assert.deepEqual(events, ["not_persisted"]);
});
