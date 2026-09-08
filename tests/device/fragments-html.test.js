import test from "node:test";
import assert from "node:assert/strict";
import { renderFragmentsHtml } from "../../src/device/fragments-html.js";

test("Fragments view escapes text and keeps supplied newest-first order", () => {
  const html = renderFragmentsHtml([
    {
      id: "2",
      text: "<new> & 🌙",
      createdAt: "2026-09-08T10:00:00.000Z",
      sentAt: "2026-09-08T12:00:00.000Z",
      status: "sent",
    },
    {
      id: "1",
      text: "old",
      createdAt: "2026-09-08T09:00:00.000Z",
      sentAt: "2026-09-08T11:00:00.000Z",
      status: "sent",
    },
  ]);

  assert.match(html, /&lt;new&gt; &amp; 🌙/);
  assert.ok(html.indexOf("&lt;new&gt;") < html.indexOf("old"));
  assert.doesNotMatch(html, /contenteditable/);
  assert.doesNotMatch(html, /<input/i);
});

test("Fragments view preserves multiline text visually and has no organizing controls", () => {
  const html = renderFragmentsHtml([
    {
      id: "1",
      text: "line 1\nline 2",
      createdAt: "2026-09-08T09:00:00.000Z",
      sentAt: "2026-09-08T11:00:00.000Z",
      status: "sent",
    },
  ]);

  assert.match(html, /line 1<br>line 2/);
  assert.doesNotMatch(html, /search|filter|tag|delete|edit/i);
});
