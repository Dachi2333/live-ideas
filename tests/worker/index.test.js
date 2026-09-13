import test from "node:test";
import assert from "node:assert/strict";
import worker from "../../worker/index.js";

function auth(password, username = "liveideas") {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

function env(overrides = {}) {
  return {
    SELF_HOST_PASSWORD: "correct horse",
    MIRO_ACCESS_TOKEN: "secret",
    MIRO_BOARD_ID: "board",
    ASSETS: {
      fetch: async () => new Response("asset", { status: 200 }),
    },
    ...overrides,
  };
}

test("self-host mode challenges unauthenticated page requests", async () => {
  const response = await worker.fetch(new Request("https://example.test/"), env());
  assert.equal(response.status, 401);
  assert.equal(response.headers.get("www-authenticate"), 'Basic realm="Live Ideas", charset="UTF-8"');
});

test("self-host mode serves assets after valid Basic authentication", async () => {
  const response = await worker.fetch(new Request("https://example.test/", {
    headers: { authorization: auth("correct horse") },
  }), env());
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "asset");
});

test("self-host mode gates API before routing and authenticated API requests still reach validation", async () => {
  const denied = await worker.fetch(new Request("https://example.test/api/fragments", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: "" }),
  }), env());
  assert.equal(denied.status, 401);

  const accepted = await worker.fetch(new Request("https://example.test/api/fragments", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: auth("correct horse") },
    body: JSON.stringify({ text: "", position: { x: 0, y: 0 } }),
  }), env());
  assert.equal(accepted.status, 400);
  assert.deepEqual(await accepted.json(), { ok: false, error: "invalid_fragment" });
});

test("ChatGPT Sites mode does not add a Worker-level Basic auth challenge", async () => {
  const sitesEnv = env({ SELF_HOST_PASSWORD: undefined });
  const response = await worker.fetch(new Request("https://example.test/"), sitesEnv);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "asset");
});
