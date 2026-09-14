import test from "node:test";
import assert from "node:assert/strict";
import { createFragment, markSending, markSent, markFailed } from "../../src/domain/fragment.js";

test("fragment transitions preserve exact text", () => {
  const text = "  我的真实是真的真实吗\nhello 🌙  ";
  const draft = createFragment({ id: "f-1", text, createdAt: "2026-09-08T10:00:00.000Z" });
  const sending = markSending(draft);
  const sent = markSent(sending, "2026-09-08T10:01:00.000Z");
  assert.deepEqual(draft, { id: "f-1", text, createdAt: "2026-09-08T10:00:00.000Z", sentAt: null, status: "draft" });
  assert.equal(sending.status, "sending");
  assert.equal(sent.status, "sent");
  assert.equal(sent.sentAt, "2026-09-08T10:01:00.000Z");
  assert.equal(sent.text, text);
});

test("failed transition keeps the exact safety copy", () => {
  const draft = createFragment({ id: "f-2", text: "<hook> & さよなら 😭", createdAt: "2026-09-08T10:00:00.000Z" });
  const failed = markFailed(markSending(draft));
  assert.equal(failed.status, "failed");
  assert.equal(failed.sentAt, null);
  assert.equal(failed.text, "<hook> & さよなら 😭");
});
