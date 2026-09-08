import test from "node:test";
import assert from "node:assert/strict";
import { escapeMiroContent, createMiroClient } from "../../worker/miro.js";

test("escapeMiroContent escapes HTML and preserves visual line breaks", () => {
  assert.equal(escapeMiroContent("<a> & x\r\ny\rz"), "&lt;a&gt; &amp; x<br>y<br>z");
});

test("Miro client sends one sanitized Sticky request and accepts only 201 with id", async () => {
  const seen = [];
  const client = createMiroClient({
    accessToken: "secret-token",
    boardId: "board/a b",
    fetchImpl: async (url, init) => {
      seen.push({ url, init });
      return new Response(JSON.stringify({ id: "sticky-1" }), { status: 201, headers: { "content-type": "application/json" } });
    },
  });
  const result = await client.createSticky({ text: "<hook>\n月", position: { x: 320, y: 0 } });
  assert.deepEqual(result, { ok: true, itemId: "sticky-1" });
  assert.equal(seen[0].url, "https://api.miro.com/v2/boards/board%2Fa%20b/sticky_notes");
  assert.equal(seen[0].init.method, "POST");
  assert.equal(seen[0].init.headers.Authorization, "Bearer secret-token");
  assert.deepEqual(JSON.parse(seen[0].init.body), {
    data: { content: "&lt;hook&gt;<br>月", shape: "square" },
    position: { x: 320, y: 0 },
  });
});

test("Miro client sanitizes upstream failure and preserves status", async () => {
  const client = createMiroClient({ accessToken: "secret", boardId: "board", fetchImpl: async () => new Response("PRIVATE UPSTREAM BODY", { status: 429 }) });
  const result = await client.createSticky({ text: "x", position: { x: 0, y: 0 } });
  assert.deepEqual(result, { ok: false, statusCode: 429, error: "miro_create_failed" });
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE/);
});

test("Miro client sanitizes thrown network errors", async () => {
  const client = createMiroClient({ accessToken: "s", boardId: "b", fetchImpl: async () => { throw new Error("token=s"); } });
  const result = await client.createSticky({ text: "x", position: { x: 0, y: 0 } });
  assert.deepEqual(result, { ok: false, error: "miro_request_failed" });
});
