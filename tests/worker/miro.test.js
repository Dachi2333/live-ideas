import test from "node:test";
import assert from "node:assert/strict";
import { escapeMiroContent, createMiroClient } from "../../worker/miro.js";

function gridPosition(index) {
  return { x: (index % 4) * 320, y: Math.floor(index / 4) * 320 };
}

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

test("Miro client follows item pagination before selecting a grid slot", async () => {
  const seen = [];
  const firstPage = Array.from({ length: 50 }, (_, index) => ({
    id: `sticky-${index}`,
    position: gridPosition(index),
  }));
  const client = createMiroClient({
    accessToken: "secret-token",
    boardId: "board",
    fetchImpl: async (url, init = {}) => {
      seen.push({ url, init });
      if ((init.method ?? "GET") === "GET" && url.includes("cursor=page-2")) {
        return new Response(JSON.stringify({
          data: [{ id: "sticky-50", position: gridPosition(50) }],
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      if ((init.method ?? "GET") === "GET") {
        return new Response(JSON.stringify({ data: firstPage, cursor: "page-2" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ id: "sticky-51" }), { status: 201, headers: { "content-type": "application/json" } });
    },
  });

  const result = await client.createSticky({ text: "page test", position: { x: 0, y: 0 } });

  assert.deepEqual(result, { ok: true, itemId: "sticky-51" });
  assert.equal(seen.length, 3);
  assert.equal(seen[1].url, "https://api.miro.com/v2/boards/board/items?type=sticky_note&limit=50&cursor=page-2");
  assert.deepEqual(JSON.parse(seen[2].init.body).position, gridPosition(51));
});

test("Miro client treats a manually shifted sticky as occupying any grid slot its geometry overlaps", async () => {
  const seen = [];
  const client = createMiroClient({
    accessToken: "secret-token",
    boardId: "board",
    fetchImpl: async (url, init = {}) => {
      seen.push({ url, init });
      if ((init.method ?? "GET") === "GET") {
        return new Response(JSON.stringify({
          data: [
            {
              id: "shifted-sticky",
              geometry: { width: 199, height: 228 },
              position: { x: 19.106737038390076, y: 34.119110065097196, relativeTo: "canvas_center" },
              parent: null,
            },
          ],
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response(JSON.stringify({ id: "sticky-new" }), { status: 201, headers: { "content-type": "application/json" } });
    },
  });

  const result = await client.createSticky({ text: "after freeform move" });

  assert.deepEqual(result, { ok: true, itemId: "sticky-new" });
  assert.deepEqual(JSON.parse(seen.at(-1).init.body).position, { x: 320, y: 0 });
});

test("Miro client converts frame-relative sticky coordinates before choosing an open grid slot", async () => {
  const seen = [];
  const client = createMiroClient({
    accessToken: "secret-token",
    boardId: "board",
    fetchImpl: async (url, init = {}) => {
      seen.push({ url, init });
      if ((init.method ?? "GET") === "GET" && url.endsWith("/items/frame-1")) {
        return new Response(JSON.stringify({
          id: "frame-1",
          type: "frame",
          geometry: { width: 1470.6817155594667, height: 794.2273389678111 },
          position: {
            x: 410.79598252518736,
            y: 112.70676513082634,
            relativeTo: "canvas_center",
          },
          parent: null,
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      if ((init.method ?? "GET") === "GET") {
        return new Response(JSON.stringify({
          data: [
            {
              id: "sticky-in-frame",
              position: {
                x: 324.544875254546,
                y: 284.4069043530792,
                relativeTo: "parent_top_left",
              },
              parent: { id: "frame-1" },
            },
            {
              id: "sticky-top-level",
              position: { x: 320, y: 0, relativeTo: "canvas_center" },
              parent: null,
            },
          ],
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response(JSON.stringify({ id: "sticky-new" }), { status: 201, headers: { "content-type": "application/json" } });
    },
  });

  const result = await client.createSticky({ text: "after manual move" });

  assert.deepEqual(result, { ok: true, itemId: "sticky-new" });
  assert.equal(seen[1].url, "https://api.miro.com/v2/boards/board/items/frame-1");
  assert.deepEqual(JSON.parse(seen.at(-1).init.body).position, { x: 640, y: 0 });
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

test("Miro client reuses the unique Live Ideas origin tag", async () => {
  const seen = [];
  const client = createMiroClient({
    accessToken: "secret-token",
    boardId: "board/a b",
    fetchImpl: async (url, init = {}) => {
      seen.push({ url, init });
      return new Response(JSON.stringify({
        data: [
          { id: "tag-other", title: "other" },
          { id: "tag-origin", title: "live-ideas-origin" },
        ],
      }), { status: 200, headers: { "content-type": "application/json" } });
    },
  });

  const result = await client.ensureOriginTag();

  assert.deepEqual(result, { ok: true, tagId: "tag-origin" });
  assert.equal(seen.length, 1);
  assert.equal(seen[0].url, "https://api.miro.com/v2/boards/board%2Fa%20b/tags?limit=50&offset=0");
  assert.equal(seen[0].init.method, "GET");
});

test("Miro client creates origin tag when absent", async () => {
  const seen = [];
  const client = createMiroClient({
    accessToken: "secret-token",
    boardId: "board",
    fetchImpl: async (url, init = {}) => {
      seen.push({ url, init });
      if ((init.method ?? "GET") === "GET") {
        return new Response(JSON.stringify({ data: [] }), { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response(JSON.stringify({ id: "tag-created", title: "live-ideas-origin" }), {
        status: 201,
        headers: { "content-type": "application/json" },
      });
    },
  });

  const result = await client.ensureOriginTag();

  assert.deepEqual(result, { ok: true, tagId: "tag-created" });
  assert.equal(seen.length, 2);
  assert.equal(seen[1].url, "https://api.miro.com/v2/boards/board/tags");
  assert.equal(seen[1].init.method, "POST");
  assert.deepEqual(JSON.parse(seen[1].init.body), { title: "live-ideas-origin" });
});

test("Miro client follows offset pagination while resolving origin tag", async () => {
  const seen = [];
  const firstPage = Array.from({ length: 50 }, (_, index) => ({ id: `tag-${index}`, title: `tag-${index}` }));
  const client = createMiroClient({
    accessToken: "secret-token",
    boardId: "board",
    fetchImpl: async (url, init = {}) => {
      seen.push({ url, init });
      if (url.includes("offset=50")) {
        return new Response(JSON.stringify({ data: [{ id: "tag-origin", title: "live-ideas-origin" }] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ data: firstPage }), { status: 200, headers: { "content-type": "application/json" } });
    },
  });

  const result = await client.ensureOriginTag();

  assert.deepEqual(result, { ok: true, tagId: "tag-origin" });
  assert.equal(seen.length, 2);
  assert.match(seen[0].url, /offset=0$/);
  assert.match(seen[1].url, /offset=50$/);
});

test("Miro client fails explicitly when origin tag title is ambiguous", async () => {
  let calls = 0;
  const client = createMiroClient({
    accessToken: "secret-token",
    boardId: "board",
    fetchImpl: async () => {
      calls += 1;
      return new Response(JSON.stringify({
        data: [
          { id: "tag-a", title: "live-ideas-origin" },
          { id: "tag-b", title: "live-ideas-origin" },
        ],
      }), { status: 200, headers: { "content-type": "application/json" } });
    },
  });

  const result = await client.ensureOriginTag();

  assert.deepEqual(result, { ok: false, error: "ambiguous_origin_tag" });
  assert.equal(calls, 1);
});

test("Miro client attaches origin tag to an existing item", async () => {
  const seen = [];
  const client = createMiroClient({
    accessToken: "secret-token",
    boardId: "board/a b",
    fetchImpl: async (url, init = {}) => {
      seen.push({ url, init });
      return new Response(null, { status: 204 });
    },
  });

  const result = await client.attachOriginTag({ itemId: "item/1", tagId: "tag/1" });

  assert.deepEqual(result, { ok: true });
  assert.equal(seen.length, 1);
  assert.equal(seen[0].url, "https://api.miro.com/v2/boards/board%2Fa%20b/items/item%2F1?tag_id=tag%2F1");
  assert.equal(seen[0].init.method, "POST");
});

test("Miro client verifies repair target through sticky-note endpoint", async () => {
  const seen = [];
  const client = createMiroClient({
    accessToken: "secret-token",
    boardId: "board",
    fetchImpl: async (url, init = {}) => {
      seen.push({ url, init });
      return new Response(JSON.stringify({ id: "item-1", type: "sticky_note", data: { content: "x" } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    },
  });

  const result = await client.verifyRepairTarget("item-1");

  assert.deepEqual(result, { ok: true });
  assert.equal(seen[0].url, "https://api.miro.com/v2/boards/board/sticky_notes/item-1");
  assert.equal(seen[0].init.method, "GET");
});
