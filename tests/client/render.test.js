import test from "node:test";
import assert from "node:assert/strict";
import { renderFragments, escapeHtml } from "../../src/client/render.js";

test("fragment rendering escapes user text and keeps supplied newest-first order", () => {
  const html = renderFragments([
    { id: "new", text: "<new> & 🌙\nline", sentAt: "2026-09-08T12:00:00.000Z", status: "sent" },
    { id: "old", text: "old", sentAt: "2026-09-08T11:00:00.000Z", status: "sent" },
  ], { formatTime: (value) => value.slice(11, 16) });
  assert.match(html, /&lt;new&gt; &amp; 🌙<br>line/);
  assert.ok(html.indexOf("&lt;new&gt;") < html.indexOf("old"));
  assert.doesNotMatch(html, /<input|contenteditable|<button/i);
});

test("escapeHtml handles quotes and angle brackets", () => {
  assert.equal(escapeHtml(`<>&"'`), "&lt;&gt;&amp;&quot;&#39;");
});
