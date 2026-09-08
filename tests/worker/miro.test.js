import test from "node:test";
import assert from "node:assert/strict";
import { escapeMiroContent, createMiroClient } from "../../worker/miro.js";

test("escapeMiroContent escapes HTML and preserves visual line breaks", () => {
  assert.equal(escapeMiroContent("<a> & x\r\ny\rz"), "&lt;a&gt; &amp; x<br>y<br>z");
});

test("Miro client chooses the first open grid slot from current board stickies before creating", async () => {
  const seen = [];
  const client = createMiroClient({
    accessToken: "secret-token",
    boardId: "board/a b",
    fetchImpl: async (url, init = {}) => {
      seen.push({ url, init });
      if ((init.method ?? "GET") === "GET") {
        return new Response(JSON.stringify({
          data: [
            { id: "sticky-1", position: { x: 0, y: 0 } },
            { id: "sticky-3", position: { x: 640, y: 0 } },
          ],
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response(JSON.stringify({ id: "sticky-2" }), { status: 201, headers: { "content-type": "application/json" } });
    },
  });

  const result = await client.createSticky({ text: "<hook>\n月", position: { x: 999, y: 999 } });

  assert.deepEqual(result, { ok: true, itemId: "sticky-2" });
  assert.equal(seen.length, 2);
  assert.equal(seen[0].url, "https://api.miro.com/v2/boards/board%2Fa%20b/items?type=sticky_note&limit=50");
  assert.equal(seen[0].init.method, "GET");
  assert.equal(seen[0].init.headers.Authorization, "Bearer secret-token");
  assert.equal(seen[1].url, "https://api.miro.com/v2/boards/board%2Fa%20b/sticky_notes");
  assert.equal(seen[1].init.method, "POST");
  assert.equal(seen[1].init.headers.Authorization, "Bearer secret-token");
  assert.deepEqual(JSON.parse(seen[1].init.body), {
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
