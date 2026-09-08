import test from "node:test";
import assert from "node:assert/strict";
import { createDraftsHttp } from "../../src/device/drafts-http.js";

test("Drafts HTTP adapter forces JSON encoding and preserves request options", () => {
  let captured;
  const http = {
    request: (options) => {
      captured = options;
      return { success: true, statusCode: 201, responseData: { id: "s" } };
    },
  };
  const request = createDraftsHttp(http);
  const response = request({
    url: "https://example.test",
    method: "POST",
    headers: { Authorization: "Bearer x" },
    data: { hello: "世界" },
  });

  assert.equal(captured.encoding, "json");
  assert.equal(captured.url, "https://example.test");
  assert.equal(captured.method, "POST");
  assert.deepEqual(captured.headers, { Authorization: "Bearer x" });
  assert.deepEqual(captured.data, { hello: "世界" });
  assert.equal(response.statusCode, 201);
});
