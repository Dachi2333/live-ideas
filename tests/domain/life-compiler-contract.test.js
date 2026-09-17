import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createCaptureService } from "../../src/domain/capture-service.js";
import { createFragmentStore } from "../../src/domain/store.js";

const fixture = JSON.parse(readFileSync(new URL("../fixtures/life-compiler-origin-contract.json", import.meta.url), "utf8"));

function memoryStore() {
  let value = [];
  return createFragmentStore({
    read: () => structuredClone(value),
    write: (next) => { value = structuredClone(next); },
  });
}

test("Live Ideas sent receipt preserves the Life Compiler contract item identity", async () => {
  const store = memoryStore();
  const service = createCaptureService({
    store,
    remote: {
      createSticky: async ({ text, miroItemId }) => {
        assert.equal(text, fixture.text);
        assert.equal(miroItemId, null);
        return { ok: true, itemId: fixture.miroItemId };
      },
    },
    now: () => fixture.sentAt,
  });

  const result = await service.send({
    id: fixture.fragmentId,
    text: fixture.text,
    createdAt: fixture.createdAt,
  });

  assert.equal(result.ok, true);
  assert.equal(result.fragment.id, fixture.fragmentId);
  assert.equal(result.fragment.text, fixture.text);
  assert.equal(result.fragment.createdAt, fixture.createdAt);
  assert.equal(result.fragment.sentAt, fixture.sentAt);
  assert.equal(result.fragment.miroItemId, fixture.miroItemId);
});
