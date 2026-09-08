import test from "node:test";
import assert from "node:assert/strict";
import { createMiroAdapter } from "../../src/miro/miro-adapter.js";

test("adapter creates one sticky note with escaped visual text and coordinates", () => {
  let captured;
  const request = (options) => {
    captured = options;
    return {
      success: true,
      statusCode: 201,
      responseData: { id: "sticky-1" },
      error: null,
    };
  };
  const miro = createMiroAdapter({ request, accessToken: "token", boardId: "board" });

  const result = miro.createSticky({
    text: "<hook> & さよなら\n😭",
    position: { x: 320, y: 640 },
  });

  assert.deepEqual(result, { ok: true, itemId: "sticky-1" });
  assert.equal(captured.method, "POST");
  assert.equal(captured.url, "https://api.miro.com/v2/boards/board/sticky_notes");
  assert.equal(captured.headers.Authorization, "Bearer token");
  assert.deepEqual(captured.data, {
    data: {
      content: "&lt;hook&gt; &amp; さよなら<br>😭",
      shape: "square",
    },
    position: { x: 320, y: 640 },
  });
});

test("board id is URL encoded", () => {
  let captured;
  const miro = createMiroAdapter({
    request: (options) => {
      captured = options;
      return { success: true, statusCode: 201, responseData: { id: "s" }, error: null };
    },
    accessToken: "token",
    boardId: "a/b c",
  });
  miro.createSticky({ text: "x", position: { x: 0, y: 0 } });
  assert.equal(captured.url, "https://api.miro.com/v2/boards/a%2Fb%20c/sticky_notes");
});

test("adapter treats any non-201 or malformed success as failure", () => {
  const non201 = createMiroAdapter({
    request: () => ({ success: true, statusCode: 200, responseData: {}, error: null }),
    accessToken: "token",
    boardId: "board",
  });
  assert.deepEqual(non201.createSticky({ text: "x", position: { x: 0, y: 0 } }), {
    ok: false,
    statusCode: 200,
    error: "miro_create_failed",
  });

  const malformed = createMiroAdapter({
    request: () => ({ success: true, statusCode: 201, responseData: {}, error: null }),
    accessToken: "token",
    boardId: "board",
  });
  assert.deepEqual(malformed.createSticky({ text: "x", position: { x: 0, y: 0 } }), {
    ok: false,
    statusCode: 201,
    error: "miro_create_failed",
  });
});

test("adapter normalizes thrown request errors", () => {
  const miro = createMiroAdapter({
    request: () => { throw new Error("offline"); },
    accessToken: "token",
    boardId: "board",
  });
  const result = miro.createSticky({ text: "x", position: { x: 0, y: 0 } });
  assert.equal(result.ok, false);
  assert.equal(result.error, "offline");
});
