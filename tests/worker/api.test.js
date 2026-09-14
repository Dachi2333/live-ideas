import test from "node:test";
import assert from "node:assert/strict";
import { authorizeOwner, handleCreateFragment } from "../../worker/api.js";

function request(body, email = "dachi@example.com", extraHeaders = {}) {
  const headers = { "content-type": "application/json", ...extraHeaders };
  if (email != null) headers["oai-authenticated-user-email"] = email;
  return new Request("https://example.test/api/fragments", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function basic(password, username = "liveideas") {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

test("owner authorization is case-insensitive and denies missing/mismatched identity", () => {
  assert.equal(authorizeOwner(new Request("https://x", { headers: { "oai-authenticated-user-email": "DACHI@EXAMPLE.COM" } }), "dachi@example.com"), true);
  assert.equal(authorizeOwner(new Request("https://x"), "dachi@example.com"), false);
  assert.equal(authorizeOwner(new Request("https://x", { headers: { "oai-authenticated-user-email": "other@example.com" } }), "dachi@example.com"), false);
});

test("API refuses missing hosted runtime config without touching Miro", async () => {
  let calls = 0;
  const response = await handleCreateFragment(request({ text: "x", position: { x: 0, y: 0 } }), { OWNER_EMAIL: "dachi@example.com" }, {
    createClient: () => { calls++; return {}; },
  });
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { ok: false, error: "runtime_not_configured" });
  assert.equal(calls, 0);
});

test("API denies non-owner before Miro call", async () => {
  let calls = 0;
  const env = { OWNER_EMAIL: "dachi@example.com", MIRO_ACCESS_TOKEN: "secret", MIRO_BOARD_ID: "board" };
  const response = await handleCreateFragment(request({ text: "x", position: { x: 0, y: 0 } }, "other@example.com"), env, {
    createClient: () => { calls++; return {}; },
  });
  assert.equal(response.status, 401);
  assert.equal(calls, 0);
});

test("API rejects invalid body and invalid position", async () => {
  const env = { OWNER_EMAIL: "dachi@example.com", MIRO_ACCESS_TOKEN: "secret", MIRO_BOARD_ID: "board" };
  const response = await handleCreateFragment(request({ text: "", position: { x: 0, y: 0 } }), env);
  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { ok: false, error: "invalid_fragment" });
});

test("API sends valid body through server client and returns sanitized success", async () => {
  const seen = [];
  const env = { OWNER_EMAIL: "dachi@example.com", MIRO_ACCESS_TOKEN: "secret", MIRO_BOARD_ID: "board" };
  const response = await handleCreateFragment(request({ text: "  月\n🌙  ", position: { x: 320, y: 0 } }), env, {
    createClient: (config) => {
      assert.equal(config.accessToken, "secret");
      assert.equal(config.boardId, "board");
      return { createSticky: async (payload) => { seen.push(payload); return { ok: true, itemId: "sticky-1" }; } };
    },
  });
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { ok: true, itemId: "sticky-1" });
  assert.deepEqual(seen, [{ text: "  月\n🌙  ", position: { x: 320, y: 0 } }]);
});

test("API preserves Miro 429 status without exposing upstream content", async () => {
  const env = { OWNER_EMAIL: "dachi@example.com", MIRO_ACCESS_TOKEN: "secret", MIRO_BOARD_ID: "board" };
  const response = await handleCreateFragment(request({ text: "x", position: { x: 0, y: 0 } }), env, {
    createClient: () => ({ createSticky: async () => ({ ok: false, statusCode: 429, error: "miro_create_failed" }) }),
  });
  assert.equal(response.status, 429);
  assert.deepEqual(await response.json(), { ok: false, error: "miro_create_failed" });
});

test("self-host mode accepts Basic auth without ChatGPT Sites owner email", async () => {
  const env = { SELF_HOST_PASSWORD: "correct horse", MIRO_ACCESS_TOKEN: "secret", MIRO_BOARD_ID: "board" };
  const response = await handleCreateFragment(
    request({ text: "self hosted", position: { x: 0, y: 0 } }, null, { authorization: basic("correct horse") }),
    env,
    { createClient: () => ({ createSticky: async () => ({ ok: true, itemId: "sticky-self" }) }) },
  );
  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), { ok: true, itemId: "sticky-self" });
});

test("self-host mode rejects missing or wrong Basic credentials before Miro", async () => {
  let calls = 0;
  const env = { SELF_HOST_PASSWORD: "correct horse", MIRO_ACCESS_TOKEN: "secret", MIRO_BOARD_ID: "board" };
  const deps = { createClient: () => { calls++; return {}; } };

  const missing = await handleCreateFragment(request({ text: "x", position: { x: 0, y: 0 } }, null), env, deps);
  const wrong = await handleCreateFragment(
    request({ text: "x", position: { x: 0, y: 0 } }, null, { authorization: basic("wrong") }),
    env,
    deps,
  );

  assert.equal(missing.status, 401);
  assert.equal(wrong.status, 401);
  assert.equal(calls, 0);
});
