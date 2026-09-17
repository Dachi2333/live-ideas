# Life Compiler Origin Tag Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mark every Live Ideas-created Miro Sticky with the reserved `live-ideas-origin` tag, persist returned `miroItemId` in the local Fragment receipt, and recover partial tag failures without creating duplicate Stickies.

**Architecture:** Extend the existing Miro client with tag resolution/creation, tag attachment, and repair-by-item-id. Extend the fragment/capture-service contract so a remote failure may still preserve `miroItemId`; retries with an existing `miroItemId` call repair-only logic instead of creating a new Sticky. No database or reverse sync is added.

**Tech Stack:** Node.js >=22.13, ESM, built-in `node:test`, existing Worker + domain architecture.

**Spec:** Cross-repository design in `Dachi2333/Life-Compiler/docs/superpowers/specs/2026-09-17-live-ideas-origin-sync-design.md`

## Global Constraints

- Reserved tag title is exactly `live-ideas-origin`.
- Browser must never receive Miro token or board secret.
- Exactly one matching origin tag is valid; duplicate same-title tags fail as `ambiguous_origin_tag`.
- Sticky creation and tag attachment are separate Miro REST operations.
- If Sticky creation succeeds and tag attachment fails, retain `itemId`; retry must repair the same Sticky and must not create another.
- Capture clears only after Sticky exists and origin tag attachment succeeds.
- Local Fragments remain device-local and one-way; no reverse Miro sync.
- No cloud DB/KV/D1 is introduced.

---

### Task 1: Extend Fragment provenance state

**Files:**
- Modify: `src/domain/fragment.js`
- Modify: `tests/domain/fragment.test.js`

**Interfaces:**
- `createFragment({ id, text, createdAt })` returns `miroItemId: null`.
- `markFailed(fragment, { miroItemId = fragment.miroItemId ?? null } = {})` preserves provenance.
- `markSent(fragment, sentAt, miroItemId)` sets status `sent`, `sentAt`, and `miroItemId`.

- [ ] **Step 1: Write failing tests**

Prove a fresh fragment starts with `miroItemId: null`, a failed fragment can retain `"item-123"`, and a sent fragment retains the same item ID.

- [ ] **Step 2: Run RED**

```bash
node --test tests/domain/fragment.test.js
```

Expected: assertions fail because current fragment shape has no Miro provenance.

- [ ] **Step 3: Implement minimal state changes**

Keep all existing fields/semantics unchanged except the optional provenance field.

- [ ] **Step 4: Run GREEN**

Run the same targeted test.

---

### Task 2: Add origin-tag operations to Miro client

**Files:**
- Modify: `worker/miro.js`
- Modify: `tests/worker/miro.test.js`

**Interfaces:**
- `ensureOriginTag() -> { ok: true, tagId } | { ok: false, statusCode?, error }`.
- `attachOriginTag({ itemId, tagId }) -> { ok: true } | { ok: false, statusCode?, error }`.
- `verifyRepairTarget(itemId) -> { ok: true } | { ok: false, statusCode?, error }`.
- Existing `createSticky({ text }) -> { ok: true, itemId } | failure` remains.

- [ ] **Step 1: Write failing Miro API tests**

Using fake fetch responses, cover:

1. list `GET /v2/boards/{board}/tags?limit=50&offset=0`, reuse exactly one matching tag;
2. create `POST /v2/boards/{board}/tags` when no match exists, body title `live-ideas-origin`;
3. paginate board tags with offset until a page has fewer than 50 entries;
4. duplicate matching titles -> `ambiguous_origin_tag` without creating another tag;
5. attach tag via `POST /v2/boards/{board}/items/{item}?tag_id={tag}` and require 204;
6. repair verification reads `GET /v2/boards/{board}/sticky_notes/{item}` and succeeds only for a real Sticky response.

- [ ] **Step 2: Run RED**

```bash
node --test tests/worker/miro.test.js
```

Expected: new methods are missing.

- [ ] **Step 3: Implement the Miro calls**

Use current authorization headers. Exact REST operations:

```text
GET  /v2/boards/{board_id}/tags?limit=50&offset=N
POST /v2/boards/{board_id}/tags
POST /v2/boards/{board_id}/items/{item_id}?tag_id={tag_id}
GET  /v2/boards/{board_id}/sticky_notes/{item_id}
```

Create tag payload:

```json
{"title":"live-ideas-origin"}
```

Treat 429 distinctly; otherwise return sanitized errors.

- [ ] **Step 4: Run GREEN**

Run targeted Miro tests, then existing Miro tests together.

---

### Task 3: Worker create-or-repair flow

**Files:**
- Modify: `worker/api.js`
- Modify: `tests/worker/api.test.js`

**Interfaces:**
- Request body accepts optional `miroItemId: string`.
- New send path without `miroItemId`: ensure tag -> create Sticky -> attach tag.
- Repair path with `miroItemId`: ensure tag -> verify target -> attach tag only.
- Full success response: `{ ok: true, itemId }`.
- Recoverable attach failure response: `{ ok: false, error: "origin_tag_failed", itemId }`.

- [ ] **Step 1: Write failing API tests**

Cover:

1. normal send calls ensure tag, create Sticky, attach tag, returns 201 + itemId;
2. attach failure after creation returns non-201 recoverable payload with same itemId;
3. repair request with `miroItemId` calls verify + attach and never calls createSticky;
4. ambiguous tag failure returns sanitized error and no Sticky creation;
5. invalid repair target fails and no new Sticky is created.

- [ ] **Step 2: Run RED**

```bash
node --test tests/worker/api.test.js
```

- [ ] **Step 3: Implement orchestration**

Keep auth/body-size/runtime checks intact. Permit body shape:

```js
{ text, position, miroItemId? }
```

`text` and `position` remain required so repair cannot retarget arbitrary content silently.

- [ ] **Step 4: Run GREEN**

Run worker API tests and then all worker tests.

---

### Task 4: Browser remote and Capture-service recovery

**Files:**
- Modify: `src/client/remote.js`
- Modify: `src/domain/capture-service.js`
- Modify: `tests/domain/capture-service.test.js`
- Add or modify the relevant client remote test under `tests/client/`.

**Interfaces:**
- `remote.createSticky({ text, position, miroItemId = null })` sends optional repair ID.
- Remote failure may return `{ ok: false, error, itemId }`.
- Capture service persists partial `itemId` on failed fragment.
- Retry passes existing `fragment.miroItemId` back to remote.

- [ ] **Step 1: Write failing tests**

Capture-service tests must prove:

```text
first call: remote returns {ok:false,error:"origin_tag_failed",itemId:"item-123"}
→ stored fragment status=failed, miroItemId="item-123", clearInput=false
retry
→ remote called with miroItemId="item-123"
→ success returns same item ID, fragment becomes sent
```

Also prove already-sent behavior remains idempotent.

Remote client test must prove failure payload itemId is preserved when server returns it.

- [ ] **Step 2: Run RED**

Run targeted domain/client tests and confirm missing provenance propagation.

- [ ] **Step 3: Implement minimal propagation**

Do not add UI fields. The existing retry button/state is reused.

- [ ] **Step 4: Run GREEN**

Run targeted tests, then `npm test`.

---

### Task 5: Cross-repository contract and final verification

**Files:**
- Create: `tests/fixtures/life-compiler-origin-contract.json`
- Modify: relevant domain/worker test to consume fixture if practical.

**Interfaces:**
- Synthetic fixture contains one stable `miroItemId`, text, and timestamps; no credentials.

- [ ] **Step 1: Add fixture**

```json
{
  "fragmentId": "fragment-contract-1",
  "miroItemId": "3458764512345",
  "text": "A synthetic Live Ideas fragment",
  "createdAt": "2026-09-17T10:04:30Z",
  "sentAt": "2026-09-17T10:05:00Z"
}
```

- [ ] **Step 2: Assert receipt identity**

Test that successful/repair flow stores exactly the fixture's `miroItemId` in the sent Fragment.

- [ ] **Step 3: Run full verification**

```bash
npm test
npm run build
```

Both must pass.

- [ ] **Step 4: Diff audit**

Compare feature branch against `main`; only origin-tag/provenance/recovery code, tests, fixture, and plan may change.

- [ ] **Step 5: Open PR and link issue #5 / DAC-143**

Do not close DAC-143 until Life Compiler's companion adapter PR is also green and both fixtures agree on the same Miro item identity.
