# Live Lyrics V0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the locked Live Lyrics V0: type a fragment in Drafts on iPhone, tap one send action, create one Sticky Note on one fixed Miro Board, retain a local fragment record, and never lose text on failure.

**Architecture:** Plain JavaScript domain modules own fragment state, local store semantics, deterministic placement, and the send flow. Drafts-specific APIs and Miro HTTP transport stay at the edges. Codex Cloud verifies all pure behavior with Node tests; real iPhone/Miro behavior is accepted manually afterward.

**Tech Stack:** JavaScript (ES modules), Node.js 24+, built-in `node:test`, esbuild for Drafts single-file bundles, Drafts JavaScript runtime, Miro REST API v2.

**Spec:** `docs/superpowers/specs/2026-09-08-live-lyrics-v0-design.md`

## Global Constraints

- `docs/PRD.md` is the locked V0 source of truth.
- Current V0 use case is lyrics capture only; repository naming must not broaden scope.
- V0 UI intent remains only `Fragments` plus the primary send action `↗`.
- Never clear/delete the current fragment until Miro Sticky creation has been confirmed successful and the local `sent` state has been persisted.
- On any failure, preserve the exact text locally, mark the attempt `failed`, and allow retry.
- One fixed Miro Board only.
- Miro interaction is write-only for V0; do not read unrelated board content.
- Real Miro access token and private Board ID must never be committed.
- No AI, tags, folders, search, project/song management, recording, images, multi-board, accounts, collaboration, Android, Web App, smart layout, or native iOS app.
- Chinese, Japanese, English, emoji, line breaks, and leading/trailing characters must round-trip without semantic alteration.
- Use TDD for behavior: failing test first, verify red, minimal implementation, verify green.

---

## File Map

The completed V0 should contain these implementation files:

```text
package.json
package-lock.json
.gitignore
.env.example
scripts/build.mjs
src/
  fragments/
    fragment.js
    store.js
  positioning/
    grid.js
  miro/
    miro-adapter.js
  capture/
    send-fragment.js
  device/
    drafts-storage.js
    drafts-http.js
    drafts-send-action.js
    fragments-html.js
drafts/
  send-entry.js
  fragments-entry.js
tests/
  fragments/
    fragment.test.js
    store.test.js
  positioning/
    grid.test.js
  miro/
    miro-adapter.test.js
  capture/
    send-fragment.test.js
  device/
    drafts-storage.test.js
    drafts-http.test.js
    drafts-send-action.test.js
    fragments-html.test.js
docs/
  SETUP.md
  DEVICE_ACCEPTANCE.md
```

Generated `dist/` files are local build outputs and are ignored by Git. They are pasted/imported into Drafts during device setup.

---

### Task 1: Fragment model and minimal Node toolchain

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `src/fragments/fragment.js`
- Test: `tests/fragments/fragment.test.js`
- Generated: `package-lock.json`

**Interfaces:**
- Produces: `createFragment({ id, text, createdAt }) -> Fragment`
- Produces: `markSending(fragment) -> Fragment`
- Produces: `markSent(fragment, sentAt) -> Fragment`
- Produces: `markFailed(fragment) -> Fragment`
- `Fragment` shape remains `{ id, text, createdAt, sentAt, status }`.

- [ ] **Step 1: Create the minimal package metadata**

Create `package.json`:

```json
{
  "name": "live-ideas",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test",
    "build": "node scripts/build.mjs",
    "check": "npm test && npm run build"
  }
}
```

Create `.gitignore`:

```text
node_modules/
dist/
.env
.env.*
!.env.example
.DS_Store
```

Create `.env.example` with names only:

```text
MIRO_ACCESS_TOKEN=
MIRO_BOARD_ID=
```

Run:

```bash
npm install --save-dev esbuild
```

Expected: `package-lock.json` is created and `esbuild` appears only in `devDependencies`.

- [ ] **Step 2: Write the failing fragment-model test**

Create `tests/fragments/fragment.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  createFragment,
  markSending,
  markSent,
  markFailed,
} from "../../src/fragments/fragment.js";

test("fragment follows draft -> sending -> sent without changing text", () => {
  const text = "  我的真实是真的真实吗\nhello 🌙  ";
  const draft = createFragment({
    id: "f-1",
    text,
    createdAt: "2026-09-08T10:00:00.000Z",
  });
  const sending = markSending(draft);
  const sent = markSent(sending, "2026-09-08T10:01:00.000Z");

  assert.deepEqual(draft, {
    id: "f-1",
    text,
    createdAt: "2026-09-08T10:00:00.000Z",
    sentAt: null,
    status: "draft",
  });
  assert.equal(sending.status, "sending");
  assert.equal(sent.status, "sent");
  assert.equal(sent.sentAt, "2026-09-08T10:01:00.000Z");
  assert.equal(sent.text, text);
});

test("failed transition preserves the exact original text", () => {
  const fragment = createFragment({
    id: "f-2",
    text: "<hook> & さよなら 😭",
    createdAt: "2026-09-08T10:00:00.000Z",
  });

  const failed = markFailed(markSending(fragment));

  assert.equal(failed.status, "failed");
  assert.equal(failed.sentAt, null);
  assert.equal(failed.text, "<hook> & さよなら 😭");
});
```

- [ ] **Step 3: Run the test and verify RED**

Run:

```bash
node --test tests/fragments/fragment.test.js
```

Expected: FAIL because `src/fragments/fragment.js` does not exist.

- [ ] **Step 4: Implement the minimal fragment model**

Create `src/fragments/fragment.js`:

```js
export function createFragment({ id, text, createdAt }) {
  return {
    id,
    text,
    createdAt,
    sentAt: null,
    status: "draft",
  };
}

export function markSending(fragment) {
  return { ...fragment, status: "sending" };
}

export function markSent(fragment, sentAt) {
  return { ...fragment, status: "sent", sentAt };
}

export function markFailed(fragment) {
  return { ...fragment, status: "failed", sentAt: null };
}
```

Do not trim or normalize `text`.

- [ ] **Step 5: Run the test and verify GREEN**

Run:

```bash
node --test tests/fragments/fragment.test.js
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json .gitignore .env.example src/fragments/fragment.js tests/fragments/fragment.test.js
git commit -m "feat: add fragment state model"
```

---

### Task 2: Local fragment store semantics

**Files:**
- Create: `src/fragments/store.js`
- Test: `tests/fragments/store.test.js`

**Interfaces:**
- Consumes: `Fragment` objects from Task 1.
- Produces: `createFragmentStore({ readJson, writeJson })`.
- Store methods: `insert(fragment)`, `replace(fragment)`, `get(id)`, `listSent()`, `countSent()`.
- `readJson() -> array | undefined` and `writeJson(array) -> boolean` are injected persistence primitives.

- [ ] **Step 1: Write failing store tests**

Create `tests/fragments/store.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { createFragmentStore } from "../../src/fragments/store.js";

function makeMemoryPersistence(initial = []) {
  let value = structuredClone(initial);
  return {
    readJson: () => structuredClone(value),
    writeJson: (next) => {
      value = structuredClone(next);
      return true;
    },
    value: () => structuredClone(value),
  };
}

test("store saves and replaces one fragment by id", () => {
  const persistence = makeMemoryPersistence();
  const store = createFragmentStore(persistence);
  const draft = {
    id: "a",
    text: "line",
    createdAt: "2026-09-08T10:00:00.000Z",
    sentAt: null,
    status: "draft",
  };

  store.insert(draft);
  store.replace({ ...draft, status: "failed" });

  assert.equal(store.get("a").status, "failed");
  assert.equal(persistence.value().length, 1);
});

test("listSent returns only sent fragments newest first", () => {
  const persistence = makeMemoryPersistence([
    { id: "1", text: "old", createdAt: "2026-09-08T10:00:00.000Z", sentAt: "2026-09-08T10:01:00.000Z", status: "sent" },
    { id: "2", text: "failed", createdAt: "2026-09-08T10:02:00.000Z", sentAt: null, status: "failed" },
    { id: "3", text: "new", createdAt: "2026-09-08T10:03:00.000Z", sentAt: "2026-09-08T10:04:00.000Z", status: "sent" },
  ]);
  const store = createFragmentStore(persistence);

  assert.deepEqual(store.listSent().map((item) => item.id), ["3", "1"]);
  assert.equal(store.countSent(), 2);
});
```

- [ ] **Step 2: Run the test and verify RED**

```bash
node --test tests/fragments/store.test.js
```

Expected: FAIL because `src/fragments/store.js` does not exist.

- [ ] **Step 3: Implement the store**

Create `src/fragments/store.js`:

```js
export function createFragmentStore({ readJson, writeJson }) {
  function readAll() {
    const value = readJson();
    return Array.isArray(value) ? value : [];
  }

  function writeAll(items) {
    if (writeJson(items) !== true) {
      throw new Error("fragment_store_write_failed");
    }
  }

  return {
    insert(fragment) {
      const items = readAll();
      if (items.some((item) => item.id === fragment.id)) {
        throw new Error("fragment_already_exists");
      }
      writeAll([...items, fragment]);
      return fragment;
    },

    replace(fragment) {
      const items = readAll();
      const index = items.findIndex((item) => item.id === fragment.id);
      if (index < 0) throw new Error("fragment_not_found");
      const next = [...items];
      next[index] = fragment;
      writeAll(next);
      return fragment;
    },

    get(id) {
      return readAll().find((item) => item.id === id) ?? null;
    },

    listSent() {
      return readAll()
        .filter((item) => item.status === "sent")
        .sort((a, b) => b.sentAt.localeCompare(a.sentAt));
    },

    countSent() {
      return readAll().filter((item) => item.status === "sent").length;
    },
  };
}
```

- [ ] **Step 4: Run store and fragment tests**

```bash
node --test tests/fragments/fragment.test.js tests/fragments/store.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/fragments/store.js tests/fragments/store.test.js
git commit -m "feat: add local fragment store"
```

---

### Task 3: Deterministic Sticky placement

**Files:**
- Create: `src/positioning/grid.js`
- Test: `tests/positioning/grid.test.js`

**Interfaces:**
- Produces: `getStickyPosition(index) -> { x, y }`.
- Placement is a fixed 4-column grid with 320-unit spacing.

- [ ] **Step 1: Write the failing positioning test**

Create `tests/positioning/grid.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { getStickyPosition } from "../../src/positioning/grid.js";

test("positioning uses a predictable 4-column grid", () => {
  assert.deepEqual(getStickyPosition(0), { x: 0, y: 0 });
  assert.deepEqual(getStickyPosition(1), { x: 320, y: 0 });
  assert.deepEqual(getStickyPosition(3), { x: 960, y: 0 });
  assert.deepEqual(getStickyPosition(4), { x: 0, y: 320 });
  assert.deepEqual(getStickyPosition(5), { x: 320, y: 320 });
});

test("first 20 positions do not duplicate coordinates", () => {
  const positions = Array.from({ length: 20 }, (_, index) => getStickyPosition(index));
  const keys = positions.map(({ x, y }) => `${x}:${y}`);
  assert.equal(new Set(keys).size, 20);
});
```

- [ ] **Step 2: Verify RED**

```bash
node --test tests/positioning/grid.test.js
```

Expected: FAIL because `src/positioning/grid.js` does not exist.

- [ ] **Step 3: Implement the fixed grid**

Create `src/positioning/grid.js`:

```js
const COLUMNS = 4;
const GAP = 320;

export function getStickyPosition(index) {
  if (!Number.isInteger(index) || index < 0) {
    throw new Error("invalid_position_index");
  }

  return {
    x: (index % COLUMNS) * GAP,
    y: Math.floor(index / COLUMNS) * GAP,
  };
}
```

- [ ] **Step 4: Verify GREEN**

```bash
node --test tests/positioning/grid.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/positioning/grid.js tests/positioning/grid.test.js
git commit -m "feat: add deterministic sticky placement"
```

---

### Task 4: Miro REST adapter

**Files:**
- Create: `src/miro/miro-adapter.js`
- Test: `tests/miro/miro-adapter.test.js`

**Interfaces:**
- Produces: `createMiroAdapter({ request, accessToken, boardId })`.
- Adapter method: `createSticky({ text, position }) -> { ok, itemId?, statusCode?, error? }`.
- `request(options)` returns Drafts-like `{ success, statusCode, responseData, error }`.
- Uses only `POST https://api.miro.com/v2/boards/{board_id}/sticky_notes`.
- Required Miro scope: `boards:write` only.

- [ ] **Step 1: Write failing adapter tests**

Create `tests/miro/miro-adapter.test.js`:

```js
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

test("adapter treats any non-201 or malformed success as failure", () => {
  const miro = createMiroAdapter({
    request: () => ({ success: true, statusCode: 200, responseData: {}, error: null }),
    accessToken: "token",
    boardId: "board",
  });

  const result = miro.createSticky({ text: "x", position: { x: 0, y: 0 } });

  assert.equal(result.ok, false);
  assert.equal(result.statusCode, 200);
});
```

- [ ] **Step 2: Verify RED**

```bash
node --test tests/miro/miro-adapter.test.js
```

Expected: FAIL because `src/miro/miro-adapter.js` does not exist.

- [ ] **Step 3: Implement the adapter**

Create `src/miro/miro-adapter.js`:

```js
function escapeMiroContent(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\r\n", "\n")
    .replaceAll("\r", "\n")
    .replaceAll("\n", "<br>");
}

export function createMiroAdapter({ request, accessToken, boardId }) {
  return {
    createSticky({ text, position }) {
      try {
        const response = request({
          url: `https://api.miro.com/v2/boards/${encodeURIComponent(boardId)}/sticky_notes`,
          method: "POST",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          data: {
            data: {
              content: escapeMiroContent(text),
              shape: "square",
            },
            position,
          },
        });

        if (response?.success === true && response.statusCode === 201 && response.responseData?.id) {
          return { ok: true, itemId: response.responseData.id };
        }

        return {
          ok: false,
          statusCode: response?.statusCode ?? 0,
          error: response?.error ?? "miro_create_failed",
        };
      } catch (error) {
        return {
          ok: false,
          statusCode: 0,
          error: error instanceof Error ? error.message : "miro_request_failed",
        };
      }
    },
  };
}
```

This is transport escaping only; user text is not semantically rewritten.

- [ ] **Step 4: Verify GREEN and run all current tests**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/miro/miro-adapter.js tests/miro/miro-adapter.test.js
git commit -m "feat: add Miro sticky adapter"
```

---

### Task 5: Capture send state machine with retry and repeated-tap safety

**Files:**
- Create: `src/capture/send-fragment.js`
- Test: `tests/capture/send-fragment.test.js`

**Interfaces:**
- Consumes: fragment model, store, positioning, Miro adapter.
- Produces: `createCaptureService({ store, miro, now })`.
- Service method: `send({ id, text, createdAt }) -> { ok, clearInput, fragment, error? }`.
- Reusing the same `id` after failure retries the existing fragment instead of creating a second local record.
- Calling `send` for an already `sent` id returns success without another Miro call.

- [ ] **Step 1: Write failing state-machine tests**

Create `tests/capture/send-fragment.test.js` with these tests:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { createFragmentStore } from "../../src/fragments/store.js";
import { createCaptureService } from "../../src/capture/send-fragment.js";

function memoryStore() {
  let data = [];
  return createFragmentStore({
    readJson: () => structuredClone(data),
    writeJson: (next) => {
      data = structuredClone(next);
      return true;
    },
  });
}

test("confirmed Miro success marks sent and explicitly allows clearing input", () => {
  const store = memoryStore();
  let calls = 0;
  const service = createCaptureService({
    store,
    miro: {
      createSticky: ({ text, position }) => {
        calls += 1;
        assert.equal(text, "你好 🌙");
        assert.deepEqual(position, { x: 0, y: 0 });
        return { ok: true, itemId: "sticky-1" };
      },
    },
    now: () => "2026-09-08T10:01:00.000Z",
  });

  const result = service.send({
    id: "draft-1",
    text: "你好 🌙",
    createdAt: "2026-09-08T10:00:00.000Z",
  });

  assert.equal(result.ok, true);
  assert.equal(result.clearInput, true);
  assert.equal(store.get("draft-1").status, "sent");
  assert.equal(store.get("draft-1").sentAt, "2026-09-08T10:01:00.000Z");
  assert.equal(calls, 1);
});

test("Miro failure preserves exact text, marks failed, and forbids clearing", () => {
  const store = memoryStore();
  const service = createCaptureService({
    store,
    miro: { createSticky: () => ({ ok: false, statusCode: 429, error: "rate_limit" }) },
    now: () => "2026-09-08T10:01:00.000Z",
  });
  const text = "  <hook>\n壊れそう 😭  ";

  const result = service.send({
    id: "draft-2",
    text,
    createdAt: "2026-09-08T10:00:00.000Z",
  });

  assert.equal(result.ok, false);
  assert.equal(result.clearInput, false);
  assert.equal(store.get("draft-2").status, "failed");
  assert.equal(store.get("draft-2").text, text);
});

test("retry reuses the failed record and sends the same text", () => {
  const store = memoryStore();
  let attempts = 0;
  const service = createCaptureService({
    store,
    miro: {
      createSticky: ({ text }) => {
        attempts += 1;
        return attempts === 1
          ? { ok: false, statusCode: 0, error: "offline" }
          : { ok: true, itemId: "sticky-2" };
      },
    },
    now: () => "2026-09-08T10:02:00.000Z",
  });
  const input = {
    id: "draft-3",
    text: "same text",
    createdAt: "2026-09-08T10:00:00.000Z",
  };

  assert.equal(service.send(input).clearInput, false);
  assert.equal(service.send(input).clearInput, true);
  assert.equal(store.listSent().length, 1);
  assert.equal(store.get("draft-3").text, "same text");
});

test("already sent id is idempotent and does not create a duplicate sticky", () => {
  const store = memoryStore();
  let calls = 0;
  const service = createCaptureService({
    store,
    miro: {
      createSticky: () => {
        calls += 1;
        return { ok: true, itemId: "sticky" };
      },
    },
    now: () => "2026-09-08T10:01:00.000Z",
  });
  const input = {
    id: "draft-4",
    text: "once",
    createdAt: "2026-09-08T10:00:00.000Z",
  };

  service.send(input);
  const second = service.send(input);

  assert.equal(second.clearInput, true);
  assert.equal(calls, 1);
});
```

- [ ] **Step 2: Verify RED**

```bash
node --test tests/capture/send-fragment.test.js
```

Expected: FAIL because `src/capture/send-fragment.js` does not exist.

- [ ] **Step 3: Implement the capture service**

Create `src/capture/send-fragment.js`:

```js
import {
  createFragment,
  markFailed,
  markSending,
  markSent,
} from "../fragments/fragment.js";
import { getStickyPosition } from "../positioning/grid.js";

export function createCaptureService({ store, miro, now }) {
  return {
    send({ id, text, createdAt }) {
      if (text.length === 0) {
        return { ok: false, clearInput: false, fragment: null, error: "empty_fragment" };
      }

      let fragment = store.get(id);

      if (fragment?.status === "sent") {
        return { ok: true, clearInput: true, fragment };
      }

      if (!fragment) {
        fragment = createFragment({ id, text, createdAt });
        store.insert(fragment);
      }

      if (fragment.text !== text) {
        return { ok: false, clearInput: false, fragment, error: "draft_text_changed" };
      }

      fragment = markSending(fragment);
      store.replace(fragment);

      const position = getStickyPosition(store.countSent());
      const result = miro.createSticky({ text: fragment.text, position });

      if (!result.ok) {
        fragment = markFailed(fragment);
        store.replace(fragment);
        return {
          ok: false,
          clearInput: false,
          fragment,
          error: result.error ?? "miro_create_failed",
        };
      }

      fragment = markSent(fragment, now());
      store.replace(fragment);
      return { ok: true, clearInput: true, fragment };
    },
  };
}
```

The Drafts `draft.uuid` becomes the fragment id. A failed send keeps the same draft loaded, so retry naturally reuses the same id. A successful action creates a new blank Drafts draft, yielding a new id for the next fragment.

- [ ] **Step 4: Verify GREEN and run all tests**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/capture/send-fragment.js tests/capture/send-fragment.test.js
git commit -m "feat: add reliable capture send flow"
```

---

### Task 6: Drafts local-storage and HTTP adapters

**Files:**
- Create: `src/device/drafts-storage.js`
- Create: `src/device/drafts-http.js`
- Test: `tests/device/drafts-storage.test.js`
- Test: `tests/device/drafts-http.test.js`

**Interfaces:**
- Produces: `createDraftsStorage(fileManager, path?) -> { readJson, writeJson }`.
- Default path: `/live-ideas-fragments.json`.
- Produces: `createDraftsHttp(http) -> request(options)`.
- Drafts HTTP adapter adds `encoding: "json"` and otherwise preserves Miro request options.

- [ ] **Step 1: Write failing adapter tests**

Create `tests/device/drafts-storage.test.js`:

```js
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
```

Create `tests/device/drafts-http.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { createDraftsHttp } from "../../src/device/drafts-http.js";

test("Drafts HTTP wrapper sends JSON request data unchanged", () => {
  let captured;
  const http = {
    request: (options) => {
      captured = options;
      return { success: true, statusCode: 201, responseData: { id: "x" } };
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
  assert.deepEqual(captured.data, { hello: "世界" });
  assert.equal(response.statusCode, 201);
});
```

- [ ] **Step 2: Verify RED**

```bash
node --test tests/device/drafts-storage.test.js tests/device/drafts-http.test.js
```

Expected: FAIL because adapter files do not exist.

- [ ] **Step 3: Implement both adapters**

Create `src/device/drafts-storage.js`:

```js
export function createDraftsStorage(fileManager, path = "/live-ideas-fragments.json") {
  return {
    readJson() {
      return fileManager.readJSON(path);
    },
    writeJson(value) {
      return fileManager.writeJSON(path, value);
    },
  };
}
```

Create `src/device/drafts-http.js`:

```js
export function createDraftsHttp(http) {
  return function request(options) {
    return http.request({ ...options, encoding: "json" });
  };
}
```

- [ ] **Step 4: Verify GREEN**

```bash
npm test
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/device/drafts-storage.js src/device/drafts-http.js tests/device/drafts-storage.test.js tests/device/drafts-http.test.js
git commit -m "feat: add Drafts runtime adapters"
```

---

### Task 7: Drafts send action and build pipeline

**Files:**
- Create: `src/device/drafts-send-action.js`
- Create: `drafts/send-entry.js`
- Create: `scripts/build.mjs`
- Test: `tests/device/drafts-send-action.test.js`
- Modify: `package.json` only if build script command needs correction.

**Interfaces:**
- Produces: `runDraftsSendAction({ currentDraft, createService, onSuccess, onFailure })` for unit testing.
- Device entry uses Drafts globals: `draft`, `editor`, `FileManager`, `HTTP`, `Credential`, `context`.
- Credential identifier: `live-ideas-miro`.
- Credential fields: `accessToken` (password field) and `boardId` (text field).
- On successful persisted send: move the source Drafts draft to `trash`, save it, then call `editor.new()`.
- On failure: do not mutate or trash the current Drafts draft and do not call `editor.new()`.
- Build output: `dist/live-lyrics-send.js`.

- [ ] **Step 1: Write failing send-action test**

Create `tests/device/drafts-send-action.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { runDraftsSendAction } from "../../src/device/drafts-send-action.js";

test("successful send retires the source draft and opens a new blank draft", () => {
  const events = [];
  const currentDraft = {
    uuid: "d-1",
    content: "line",
    createdAt: new Date("2026-09-08T10:00:00.000Z"),
  };

  const result = runDraftsSendAction({
    currentDraft,
    createService: () => ({
      send: (input) => {
        assert.deepEqual(input, {
          id: "d-1",
          text: "line",
          createdAt: "2026-09-08T10:00:00.000Z",
        });
        return { ok: true, clearInput: true, fragment: { id: "d-1" } };
      },
    }),
    onSuccess: () => events.push("success"),
    onFailure: () => events.push("failure"),
  });

  assert.equal(result.clearInput, true);
  assert.deepEqual(events, ["success"]);
});

test("failed send leaves the current input surface untouched", () => {
  const events = [];
  const result = runDraftsSendAction({
    currentDraft: {
      uuid: "d-2",
      content: "keep me",
      createdAt: new Date("2026-09-08T10:00:00.000Z"),
    },
    createService: () => ({
      send: () => ({ ok: false, clearInput: false, fragment: { id: "d-2" }, error: "offline" }),
    }),
    onSuccess: () => events.push("success"),
    onFailure: (error) => events.push(error),
  });

  assert.equal(result.clearInput, false);
  assert.deepEqual(events, ["offline"]);
});
```

- [ ] **Step 2: Verify RED**

```bash
node --test tests/device/drafts-send-action.test.js
```

Expected: FAIL because `src/device/drafts-send-action.js` does not exist.

- [ ] **Step 3: Implement the testable send-action shell**

Create `src/device/drafts-send-action.js`:

```js
export function runDraftsSendAction({
  currentDraft,
  createService,
  onSuccess,
  onFailure,
}) {
  const service = createService();
  const result = service.send({
    id: currentDraft.uuid,
    text: currentDraft.content,
    createdAt: currentDraft.createdAt.toISOString(),
  });

  if (result.ok && result.clearInput) {
    onSuccess();
  } else {
    onFailure(result.error ?? "send_failed");
  }

  return result;
}
```

- [ ] **Step 4: Verify GREEN**

```bash
node --test tests/device/drafts-send-action.test.js
```

Expected: PASS.

- [ ] **Step 5: Create the actual Drafts entry**

Create `drafts/send-entry.js`:

```js
import { createCaptureService } from "../src/capture/send-fragment.js";
import { createFragmentStore } from "../src/fragments/store.js";
import { createMiroAdapter } from "../src/miro/miro-adapter.js";
import { createDraftsStorage } from "../src/device/drafts-storage.js";
import { createDraftsHttp } from "../src/device/drafts-http.js";
import { runDraftsSendAction } from "../src/device/drafts-send-action.js";

const credential = Credential.create(
  "live-ideas-miro",
  "Miro credentials for Live Lyrics. Requires boards:write access only."
);
credential.addPasswordField("accessToken", "Miro access token");
credential.addTextField("boardId", "Miro board ID");

if (!credential.authorize()) {
  context.fail("Miro credential setup cancelled");
} else {
  const accessToken = credential.getValue("accessToken");
  const boardId = credential.getValue("boardId");
  const fileManager = FileManager.createLocal();
  const http = HTTP.create();

  runDraftsSendAction({
    currentDraft: draft,
    createService: () => {
      const storage = createDraftsStorage(fileManager);
      const store = createFragmentStore(storage);
      const request = createDraftsHttp(http);
      const miro = createMiroAdapter({ request, accessToken, boardId });
      return createCaptureService({
        store,
        miro,
        now: () => new Date().toISOString(),
      });
    },
    onSuccess: () => {
      draft.folder = "trash";
      draft.update();
      editor.new();
    },
    onFailure: (error) => {
      context.fail(`Send failed: ${error}`);
    },
  });
}
```

The failure path must not modify `draft.content`, `draft.folder`, or call `editor.new()`.

- [ ] **Step 6: Add the esbuild script**

Create `scripts/build.mjs` initially with the send action only:

```js
import { build } from "esbuild";

await build({
  entryPoints: ["drafts/send-entry.js"],
  outfile: "dist/live-lyrics-send.js",
  bundle: true,
  format: "iife",
  platform: "neutral",
  target: "es2017",
  minify: false,
});
```

Run:

```bash
npm run build
```

Expected: `dist/live-lyrics-send.js` is generated with no unresolved-module error. Drafts globals remain runtime globals.

- [ ] **Step 7: Run full checks**

```bash
npm run check
```

Expected: all tests PASS and build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/device/drafts-send-action.js drafts/send-entry.js scripts/build.mjs tests/device/drafts-send-action.test.js package.json package-lock.json
git commit -m "feat: add Drafts send action"
```

---

### Task 8: Read-only Fragments view

**Files:**
- Create: `src/device/fragments-html.js`
- Create: `drafts/fragments-entry.js`
- Test: `tests/device/fragments-html.test.js`
- Modify: `scripts/build.mjs`

**Interfaces:**
- Produces: `renderFragmentsHtml(fragments) -> complete HTML document`.
- Input is `store.listSent()`; failed/draft/sending items are not shown in this V0 history view.
- View is read-only and newest-first.
- Build output: `dist/live-lyrics-fragments.js`.

- [ ] **Step 1: Write failing HTML-render test**

Create `tests/device/fragments-html.test.js`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { renderFragmentsHtml } from "../../src/device/fragments-html.js";

test("Fragments view escapes text and keeps supplied newest-first order", () => {
  const html = renderFragmentsHtml([
    {
      id: "2",
      text: "<new> & 🌙",
      createdAt: "2026-09-08T10:00:00.000Z",
      sentAt: "2026-09-08T12:00:00.000Z",
      status: "sent",
    },
    {
      id: "1",
      text: "old",
      createdAt: "2026-09-08T09:00:00.000Z",
      sentAt: "2026-09-08T11:00:00.000Z",
      status: "sent",
    },
  ]);

  assert.match(html, /&lt;new&gt; &amp; 🌙/);
  assert.ok(html.indexOf("&lt;new&gt;") < html.indexOf("old"));
  assert.doesNotMatch(html, /contenteditable/);
  assert.doesNotMatch(html, /<input/i);
});
```

- [ ] **Step 2: Verify RED**

```bash
node --test tests/device/fragments-html.test.js
```

Expected: FAIL because `src/device/fragments-html.js` does not exist.

- [ ] **Step 3: Implement minimal read-only rendering**

Create `src/device/fragments-html.js`:

```js
function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderFragmentsHtml(fragments) {
  const rows = fragments
    .map((fragment) => {
      const text = escapeHtml(fragment.text).replaceAll("\n", "<br>");
      const time = escapeHtml(fragment.sentAt);
      return `<article><div class="text">${text}</div><time>${time}</time></article>`;
    })
    .join("");

  return `<!doctype html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
body { font-family: -apple-system, sans-serif; margin: 24px; }
h1 { font-size: 14px; letter-spacing: .08em; }
article { padding: 16px 0; border-top: 1px solid currentColor; }
.text { white-space: normal; font-size: 18px; line-height: 1.45; }
time { display: block; margin-top: 8px; font-size: 12px; opacity: .55; }
</style>
</head>
<body><h1>FRAGMENTS</h1>${rows}</body>
</html>`;
}
```

No edit, delete, search, filter, tag, or organization controls.

- [ ] **Step 4: Verify GREEN**

```bash
node --test tests/device/fragments-html.test.js
```

Expected: PASS.

- [ ] **Step 5: Create the Drafts Fragments action**

Create `drafts/fragments-entry.js`:

```js
import { createFragmentStore } from "../src/fragments/store.js";
import { createDraftsStorage } from "../src/device/drafts-storage.js";
import { renderFragmentsHtml } from "../src/device/fragments-html.js";

const fileManager = FileManager.createLocal();
const storage = createDraftsStorage(fileManager);
const store = createFragmentStore(storage);
const html = renderFragmentsHtml(store.listSent());
const preview = HTMLPreview.create();
preview.show(html);
```

- [ ] **Step 6: Update build script to emit both actions**

Replace `scripts/build.mjs` with:

```js
import { build } from "esbuild";

const common = {
  bundle: true,
  format: "iife",
  platform: "neutral",
  target: "es2017",
  minify: false,
};

await build({
  ...common,
  entryPoints: ["drafts/send-entry.js"],
  outfile: "dist/live-lyrics-send.js",
});

await build({
  ...common,
  entryPoints: ["drafts/fragments-entry.js"],
  outfile: "dist/live-lyrics-fragments.js",
});
```

- [ ] **Step 7: Run full checks**

```bash
npm run check
```

Expected: all tests PASS and both files appear in `dist/`.

- [ ] **Step 8: Commit**

```bash
git add src/device/fragments-html.js drafts/fragments-entry.js tests/device/fragments-html.test.js scripts/build.mjs
git commit -m "feat: add read-only fragments view"
```

---

### Task 9: Setup documentation and device acceptance checklist

**Files:**
- Create: `docs/SETUP.md`
- Create: `docs/DEVICE_ACCEPTANCE.md`
- Modify: `README.md`

**Interfaces:**
- No new product behavior.
- Documentation must explain one-time Drafts setup, Miro credentials, and manual iPhone acceptance.

- [ ] **Step 1: Write `docs/SETUP.md`**

It must include this exact sequence:

1. Install Drafts on iPhone.
2. Create/configure a Miro developer app/token with `boards:write` access only.
3. Obtain the fixed target Board ID.
4. Run `npm ci && npm run build` in Cloud/local environment.
5. Create a Drafts action named `↗` with one Script step containing `dist/live-lyrics-send.js`.
6. Create a Drafts action named `Fragments` with one Script step containing `dist/live-lyrics-fragments.js`.
7. Put both actions in the same minimal Drafts action bar/group used for capture.
8. On first send, Drafts Credential prompts for the Miro access token and Board ID; enter them there. They must never be pasted into repo files.
9. Confirm a successful send produces one Miro Sticky and moves to a fresh blank Drafts editor.
10. Confirm a failed send leaves the current draft text untouched.

Also state that the Drafts implementation is V0 dogfood, not the final commitment to a native app.

- [ ] **Step 2: Write `docs/DEVICE_ACCEPTANCE.md`**

Use a manual checklist with expected results for every PRD-required case:

```text
[ ] Open capture: editor ready and keyboard/input available quickly.
[ ] Chinese fragment: exact visible text appears on Miro.
[ ] Japanese fragment: exact visible text appears on Miro.
[ ] English fragment: exact visible text appears on Miro.
[ ] Emoji: preserved.
[ ] Multiline text: line breaks remain visually correct.
[ ] Leading/trailing characters: not trimmed or rewritten.
[ ] Normal success: one Sticky created, local status sent, fresh blank editor opens.
[ ] No network: original draft remains, local status failed, no blank editor.
[ ] Miro auth failure: original draft remains, local status failed.
[ ] Miro 429/rate limit: original draft remains, local status failed.
[ ] Retry after failure: same fragment becomes sent and only one local record exists.
[ ] Repeated action on already-sent Draft UUID: no second Sticky request.
[ ] Long text: no silent truncation by our code; observe Miro behavior.
[ ] Fragments view: sent records appear newest first.
[ ] Fragments view: no editing/organizing controls.
[ ] Positioning: multiple successful sends do not completely overlap.
[ ] Final dogfood: open -> type -> ↗ -> leave feels acceptable.
```

- [ ] **Step 3: Replace README with a concise project entry point**

`README.md` must contain only a short project description, current V0 chain, links to `docs/PRD.md`, `docs/SETUP.md`, and `docs/DEVICE_ACCEPTANCE.md`, plus a warning that real credentials never belong in Git.

- [ ] **Step 4: Run verification**

```bash
npm run check
```

Expected: all tests PASS and both Drafts bundles build.

Also run:

```bash
git grep -n -E 'MIRO_ACCESS_TOKEN=.+|MIRO_BOARD_ID=.+' -- ':!docs/superpowers/plans/*'
```

Expected: no real populated secret assignments in tracked implementation/config files.

- [ ] **Step 5: Commit**

```bash
git add README.md docs/SETUP.md docs/DEVICE_ACCEPTANCE.md
git commit -m "docs: add Live Lyrics setup and acceptance"
```

---

## Final Cloud Verification

Before opening the implementation PR, run:

```bash
npm ci
npm run check
git status --short
```

Expected:

- all Node tests pass;
- both Drafts bundles build successfully;
- `git status --short` is clean after commits;
- no real Miro token or Board ID is committed;
- no V0-excluded feature has been added.

Then open one implementation PR against `main` with a summary grouped by:

1. local fragment safety;
2. Miro Sticky delivery;
3. Drafts capture integration;
4. read-only Fragments view;
5. tests/build result;
6. remaining manual iPhone acceptance.

Do not claim V0 complete until `docs/DEVICE_ACCEPTANCE.md` has been executed on the real iPhone and real target Miro Board.
