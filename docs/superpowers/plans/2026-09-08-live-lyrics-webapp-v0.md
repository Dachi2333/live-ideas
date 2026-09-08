# Live Lyrics Web App V0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the locked Live Lyrics V0 as a ChatGPT Sites-compatible mobile Web App that safely captures text fragments and sends confirmed Miro Sticky Notes.

**Architecture:** A dependency-light browser client owns capture UI and local fragment persistence. A same-origin Cloudflare/Sites worker owns Miro credentials and Miro REST translation. The build follows the OpenAI Sites Vite/Worker shape and keeps all runtime credentials in hosted environment values.

**Tech Stack:** JavaScript ES modules, Node.js >=22.13, built-in `node:test`, Vite 8, `@cloudflare/vite-plugin`, ChatGPT Sites runtime, browser localStorage, Miro REST API v2.

**Spec:** `docs/superpowers/specs/2026-09-08-live-lyrics-webapp-v0-design.md`

## Global Constraints

- `docs/PRD.md` remains the locked V0 source of truth.
- Daily UI contains only Capture, `Fragments`, and `↗` plus minimal failure/status feedback.
- Never clear text before confirmed Miro success and persisted local `sent` state.
- Miro credentials and private Board ID never enter tracked source or browser bundles.
- One fixed Miro Board only.
- No Drafts runtime, native iOS, AI, recording, Melody, Song, tags, folders, search, multiple Boards, accounts, collaboration, Widget, Lock Screen Control, Control Center, or Action Button in V0.
- ChatGPT Sites is the primary deployment target.

---

### Task 1: Source pivot and Sites-compatible project shell

**Files:**
- Modify: `docs/PRD.md`
- Modify: `docs/OUTLINE.md`
- Modify: `AGENTS.md`
- Create: `package.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `.openai/hosting.json`
- Create: `vite.config.js`
- Create: `build/sites-vite-plugin.js`
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Produces `npm test` and `npm run build` entry points.
- Build emits browser assets, `dist/server/index.js`, and `dist/.openai/hosting.json`.

- [ ] Update source docs to Web App + ChatGPT Sites V0.
- [ ] Add Node/Vite/Sites build metadata with no secret values.
- [ ] Add CI using Node 24, `npm install`, tests, build, and secret-pattern scan.
- [ ] Commit as `chore: pivot V0 to ChatGPT Sites web app`.

### Task 2: Fragment domain and deterministic position

**Files:**
- Create: `tests/domain/fragment.test.js`
- Create: `tests/domain/store.test.js`
- Create: `tests/domain/positioning.test.js`
- Create: `src/domain/fragment.js`
- Create: `src/domain/store.js`
- Create: `src/domain/positioning.js`

**Interfaces:**
- `createFragment({id,text,createdAt})`
- `markSending(fragment)` / `markSent(fragment,sentAt)` / `markFailed(fragment)`
- `createFragmentStore({read,write})` with `get`, `insert`, `replace`, `listSent`, `countSent`
- `getStickyPosition(index)`

- [ ] Write tests first for exact-text preservation and state transitions.
- [ ] Run focused tests and confirm RED because modules do not exist.
- [ ] Implement minimal fragment model; run GREEN.
- [ ] Write store tests, verify RED, implement store, verify GREEN.
- [ ] Write grid tests for indices 0,1,3,4 and invalid indices; verify RED, implement 4-column/320-unit grid, verify GREEN.
- [ ] Commit as `feat: add web fragment core`.

### Task 3: Capture send state machine

**Files:**
- Create: `tests/domain/capture-service.test.js`
- Create: `src/domain/capture-service.js`

**Interfaces:**
- `createCaptureService({store,remote,now})`
- `await service.send({id,text,createdAt}) -> {ok,clearInput,fragment,error?}`
- `remote.createSticky({text,position}) -> Promise<{ok,itemId?|error?}>`

- [ ] Write failing tests for empty input, success, remote failure, retry preserving exact stored text, already-sent dedupe, and local persistence failure.
- [ ] Verify RED.
- [ ] Implement async send state machine.
- [ ] Verify focused and full domain tests GREEN.
- [ ] Commit as `feat: add reliable web capture flow`.

### Task 4: Secure Miro server boundary

**Files:**
- Create: `tests/worker/miro.test.js`
- Create: `tests/worker/api.test.js`
- Create: `worker/miro.js`
- Create: `worker/api.js`
- Create: `worker/index.js`

**Interfaces:**
- `escapeMiroContent(text)`
- `createMiroClient({fetchImpl,accessToken,boardId})`
- `authorizeOwner(request, ownerEmail)` compares `oai-authenticated-user-email` case-insensitively.
- `handleCreateFragment(request, env, deps?)`

- [ ] Test Miro HTML escaping, exact endpoint, Bearer header, 201 success contract, and sanitized failures; verify RED then GREEN.
- [ ] Test missing runtime config, owner mismatch, invalid body, and successful proxy response; verify RED then GREEN.
- [ ] Worker routes only `POST /api/fragments` to API logic and serves all other paths through `ASSETS`.
- [ ] Commit as `feat: add secure Miro proxy`.

### Task 5: Browser persistence and Capture UI

**Files:**
- Create: `tests/client/local-storage.test.js`
- Create: `tests/client/view-model.test.js`
- Create: `src/client/local-storage.js`
- Create: `src/client/view-model.js`
- Create: `src/client/app.js`
- Create: `src/client/styles.css`
- Create: `index.html`
- Create: `public/manifest.webmanifest`

**Interfaces:**
- `createBrowserPersistence(storage)` stores current capture and fragments under versioned keys.
- `createCaptureViewModel(...)` owns text, fragment id, sending guard, send/retry, and sent history.
- UI renders Capture by default and read-only Fragments newest-first.

- [ ] Write persistence tests for refresh survival, exact whitespace/multiline text, and sent ordering; verify RED then GREEN.
- [ ] Write view-model tests for repeated-tap suppression, success clear, failure retain, and retry; verify RED then GREEN.
- [ ] Implement the minimal mobile DOM UI after behavior tests pass.
- [ ] Add manifest and iOS web-app metadata; no service worker.
- [ ] Commit as `feat: add mobile capture web UI`.

### Task 6: Verification, docs, and deployment handoff

**Files:**
- Modify: `README.md`
- Create: `docs/SETUP.md`
- Create: `docs/DEVICE_ACCEPTANCE.md`

**Interfaces:**
- Setup documents only runtime key names; never values.
- Acceptance covers Safari, Home Screen, language/emoji, refresh/background, network failures, retry, repeated tap, Fragments order, real Miro Sticky, and secret exposure.

- [ ] Run `npm test`.
- [ ] Run `npm run build`.
- [ ] Verify `dist/server/index.js` and `dist/.openai/hosting.json` exist.
- [ ] Scan tracked source for populated Miro credentials/Board IDs.
- [ ] Add setup and acceptance docs.
- [ ] Open Draft PR from `feat/webapp-v0` to `main`.
- [ ] Confirm CI success on exact PR head.
- [ ] Mark old Drafts PR superseded but retain history.
- [ ] Stop at ChatGPT Sites owner-settings gate for `MIRO_ACCESS_TOKEN`, `MIRO_BOARD_ID`, and `OWNER_EMAIL`; secret values are entered only by the owner in Sites Settings.
- [ ] Save a Sites version, deploy owner-only, and execute real iPhone acceptance before declaring V0 complete.
