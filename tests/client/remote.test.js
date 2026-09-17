import test from "node:test";
import assert from "node:assert/strict";
import { createRemoteClient } from "../../src/client/remote.js";

test("browser remote posts fragment text and position to same-origin API", async () => {
  const seen = [];
  const remote = createRemoteClient(async (url, init) => {
    seen.push({ url, init });
    return new Response(JSON.stringify({ ok: true, itemId: "sticky-1" }), { status: 201, headers: { "content-type": "application/json" } });
  });
  const result = await remote.createSticky({ text: "  月\n🌙  ", position: { x: 320, y: 0 } });
  assert.deepEqual(result, { ok: true, itemId: "sticky-1" });
  assert.equal(seen[0].url, "/api/fragments");
  assert.equal(seen[0].init.method, "POST");
  assert.deepEqual(JSON.parse(seen[0].init.body), { text: "  月\n🌙  ", position: { x: 320, y: 0 } });
  assert.equal(seen[0].init.credentials, "same-origin");
});

test("browser remote includes existing Miro item ID on repair request", async () => {
  const seen = [];
  const remote = createRemoteClient(async (url, init) => {
    seen.push({ url, init });
    return new Response(JSON.stringify({ ok: true, itemId: "sticky-existing" }), { status: 201, headers: { "content-type": "application/json" } });
  });

  const result = await remote.createSticky({
    text: "repair",
    position: { x: 0, y: 0 },
    miroItemId: "sticky-existing",
  });

  assert.deepEqual(result, { ok: true, itemId: "sticky-existing" });
  assert.deepEqual(JSON.parse(seen[0].init.body), {
    text: "repair",
    position: { x: 0, y: 0 },
    miroItemId: "sticky-existing",
  });
});

test("browser remote preserves recoverable item ID on API failure", async () => {
  const remote = createRemoteClient(async () => new Response(JSON.stringify({
    ok: false,
    error: "origin_tag_failed",
    itemId: "sticky-partial",
  }), { status: 502, headers: { "content-type": "application/json" } }));

  assert.deepEqual(
    await remote.createSticky({ text: "x", position: { x: 0, y: 0 } }),
    { ok: false, statusCode: 502, error: "origin_tag_failed", itemId: "sticky-partial" },
  );
});

test("browser remote returns sanitized API error and status", async () => {
  const remote = createRemoteClient(async () => new Response(JSON.stringify({ ok: false, error: "miro_create_failed" }), { status: 429 }));
  assert.deepEqual(await remote.createSticky({ text: "x", position: { x: 0, y: 0 } }), { ok: false, statusCode: 429, error: "miro_create_failed" });
});

test("browser remote normalizes network failure", async () => {
  const remote = createRemoteClient(async () => { throw new Error("offline details"); });
  assert.deepEqual(await remote.createSticky({ text: "x", position: { x: 0, y: 0 } }), { ok: false, error: "network_error" });
});
