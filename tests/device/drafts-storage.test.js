import test from "node:test";
import assert from "node:assert/strict";
import { createDraftsStorage } from "../../src/device/drafts-storage.js";

test("Drafts storage uses one local JSON file", () => {
  const calls = [];
  const fileManager = {
    readJSON: (path) => {
      calls.push(["read", path]);
      return [{ id: "1" }];
    },
    writeJSON: (path, value) => {
      calls.push(["write", path, value]);
      return true;
    },
  };
  const storage = createDraftsStorage(fileManager);

  assert.deepEqual(storage.readJson(), [{ id: "1" }]);
  assert.equal(storage.writeJson([{ id: "2" }]), true);
  assert.deepEqual(calls.map((call) => call[1]), [
    "/live-ideas-fragments.json",
    "/live-ideas-fragments.json",
  ]);
});

test("Drafts storage supports an injected path for tests/migration", () => {
  let usedPath;
  const storage = createDraftsStorage({
    readJSON: (path) => { usedPath = path; return undefined; },
    writeJSON: () => true,
  }, "/custom.json");
  storage.readJson();
  assert.equal(usedPath, "/custom.json");
});
