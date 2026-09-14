# Live Ideas OSS Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the accepted Live Ideas V1 branch into a safe, understandable, self-hostable open-source release candidate with English, Simplified Chinese, and Japanese usage documentation.

**Architecture:** Preserve the current browser → same-origin Worker → Miro architecture and the existing ChatGPT Sites private deployment path. Add a generic self-host path on Cloudflare Workers using server-side Miro secrets and Worker-level HTTP Basic authentication, while keeping ChatGPT Sites owner-email authorization unchanged when self-host auth is not configured. Public documentation must describe both paths without exposing or requiring the maintainer's private deployment configuration.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Node.js test runner, Vite, Cloudflare Vite plugin / Wrangler, ChatGPT Sites plugin, Miro REST API.

**Spec:** `docs/PRD.md` and `docs/OUTLINE.md`, updated from the approved Live Ideas v4 source documents before release.

## Global Constraints

- Product name is **Live Ideas**; legacy `Live Lyrics` references are allowed only when explicitly documenting migration/history.
- V1 remains text-only: no image, audio, tags, folders, search, projects, AI, multi-board selector, or OAuth board picker.
- Never expose `MIRO_ACCESS_TOKEN`, Miro client secrets, or a private Board ID in browser code or tracked configuration.
- Current private ChatGPT Sites deployment remains owner-only and continues to support `OWNER_EMAIL` + `oai-authenticated-user-email` authorization.
- Public release must provide at least one reproducible self-host path that does not depend on the maintainer's ChatGPT Sites account.
- Capture text must never be cleared until Miro confirms creation and local `sent` persistence succeeds.
- Fragments deletion remains local-history-only; it must not delete the Miro Sticky.
- Existing `live-lyrics:*` localStorage data must migrate to `live-ideas:*` without data loss.
- Usage documentation must be available in English, Simplified Chinese, and Japanese.
- Do not change repository visibility or merge to `main` until the release candidate is verified and the license choice is explicitly approved.

---

### Task 1: Refresh source-of-truth product docs and repository identity

**Files:**
- Modify: `docs/PRD.md`
- Modify: `docs/OUTLINE.md`
- Modify: `AGENTS.md`
- Modify: `vite.config.js`
- Test: `tests/client/ui-shell.test.js`

**Interfaces:**
- Consumes: approved Live Ideas PRD v4 and Outline v4.
- Produces: repository-wide release language that consistently calls the product `Live Ideas`; Vite Worker name `live-ideas`.

- [ ] **Step 1: Add a failing release-identity assertion**

Update `tests/client/ui-shell.test.js` so the release gate reads `AGENTS.md` and `vite.config.js` and asserts:

```js
assert.doesNotMatch(agents, /Current product working name:\s*\*\*Live Lyrics\*\*/);
assert.match(agents, /Current product working name:\s*\*\*Live Ideas\*\*/);
assert.match(vite, /name:\s*"live-ideas"/);
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/client/ui-shell.test.js`

Expected: FAIL because the branch still contains old `Live Lyrics` repository guidance and Worker naming.

- [ ] **Step 3: Replace repo PRD/outline with the approved Live Ideas v4 versions and update AGENTS/Vite naming**

Keep legacy-name references only inside explicit migration/history sections.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `node --test tests/client/ui-shell.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `docs: align repository with Live Ideas v4`

---

### Task 2: Migrate browser storage keys without losing existing user data

**Files:**
- Modify: `src/client/local-storage.js`
- Modify: `tests/client/local-storage.test.js`

**Interfaces:**
- Produces constants `CAPTURE_KEY = "live-ideas:capture:v1"` and `FRAGMENTS_KEY = "live-ideas:fragments:v1"`.
- Reads legacy keys `live-lyrics:capture:v1` and `live-lyrics:fragments:v1` only as migration sources.

- [ ] **Step 1: Write failing migration tests**

Add tests that pre-populate only the legacy keys, construct `createBrowserPersistence(storage)`, and assert:

```js
assert.equal(persistence.loadCapture().text, "legacy draft");
assert.equal(JSON.parse(storage.getItem("live-ideas:capture:v1")).text, "legacy draft");
assert.equal(storage.getItem("live-lyrics:capture:v1"), null);

assert.equal(persistence.fragments.read()[0].text, "legacy sent");
assert.equal(JSON.parse(storage.getItem("live-ideas:fragments:v1"))[0].text, "legacy sent");
assert.equal(storage.getItem("live-lyrics:fragments:v1"), null);
```

Also verify existing new-key data wins when both generations exist.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/client/local-storage.test.js`

Expected: FAIL because only legacy keys currently exist in production code.

- [ ] **Step 3: Implement one-time, idempotent migration**

On persistence creation, copy valid legacy data into the new key only when the new key is absent, then remove the legacy key after the new value is written successfully. Do not delete legacy data if the new write throws.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `node --test tests/client/local-storage.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `fix: migrate Live Lyrics local data to Live Ideas`

---

### Task 3: Add a reproducible Cloudflare self-host mode without exposing Miro credentials

**Files:**
- Create: `wrangler.jsonc`
- Modify: `vite.config.js`
- Modify: `package.json`
- Modify: `.env.example`
- Modify: `.gitignore`
- Modify: `worker/api.js`
- Modify: `worker/index.js`
- Modify: `tests/worker/api.test.js`
- Create: `tests/worker/index.test.js`

**Interfaces:**
- ChatGPT Sites mode: `OWNER_EMAIL` + request header `oai-authenticated-user-email`.
- Self-host mode: `SELF_HOST_PASSWORD` enables HTTP Basic auth for the whole Worker; username is fixed to `liveideas`.
- Both modes require server-side `MIRO_ACCESS_TOKEN` and `MIRO_BOARD_ID`.

- [ ] **Step 1: Write failing API authorization tests**

Add tests showing:

```js
// Sites mode still works when SELF_HOST_PASSWORD is absent.
// Self-host mode accepts Authorization: Basic base64("liveideas:correct-password").
// Self-host mode rejects missing and wrong Basic credentials.
// Runtime is configured when MIRO secrets + SELF_HOST_PASSWORD are present even without OWNER_EMAIL.
```

- [ ] **Step 2: Write failing Worker-shell auth tests**

Create `tests/worker/index.test.js` and assert that with `SELF_HOST_PASSWORD` configured:

```js
// unauthenticated GET / returns 401
// response includes WWW-Authenticate: Basic realm="Live Ideas"
// authenticated GET / delegates to env.ASSETS.fetch
// authenticated POST /api/fragments reaches API handler path
```

- [ ] **Step 3: Run focused worker tests and verify RED**

Run: `node --test tests/worker/api.test.js tests/worker/index.test.js`

Expected: FAIL because self-host authentication does not yet exist.

- [ ] **Step 4: Implement dual deployment authorization**

In `worker/api.js`, keep Sites authorization and add Basic parsing for self-host mode. In `worker/index.js`, challenge all self-host requests before serving either assets or API responses. Never send Miro credentials to the browser.

- [ ] **Step 5: Add explicit Cloudflare Worker config and scripts**

Create `wrangler.jsonc` with:

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "live-ideas",
  "main": "./worker/index.js",
  "compatibility_date": "2026-09-01",
  "assets": {
    "binding": "ASSETS",
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/*"]
  }
}
```

Change the Cloudflare Vite plugin to use the checked-in Wrangler config rather than a private programmatic name. Add scripts:

```json
"dev": "vite dev",
"preview": "npm run build && vite preview",
"deploy:cloudflare": "npm run build && wrangler deploy"
```

Add `SELF_HOST_PASSWORD=` to `.env.example`; ensure `.dev.vars*` remains ignored.

- [ ] **Step 6: Run focused tests and full build**

Run:

```bash
node --test tests/worker/api.test.js tests/worker/index.test.js
npm run build
```

Expected: PASS and `dist/wrangler.json` exists alongside the Worker/client build output.

- [ ] **Step 7: Commit**

Commit message: `feat: add secure Cloudflare self-host mode`

---

### Task 4: Add a full-history credential release gate

**Files:**
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Produces a CI check that fetches full Git history and fails if populated Miro credentials or long bearer tokens appear in any commit diff.

- [ ] **Step 1: Make CI fetch full history**

Set checkout to:

```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
```

- [ ] **Step 2: Add a historical secret scan**

Add a step that runs a full-history patch scan, excluding the CI file itself to avoid regex self-matches:

```bash
if git log -p --all --no-color -- . ':!.github/workflows/ci.yml' | \
  grep -E '^[+-].*(MIRO_ACCESS_TOKEN=[^[:space:]]+|MIRO_CLIENT_SECRET=[^[:space:]]+|MIRO_BOARD_ID=[^[:space:]]+|Bearer [A-Za-z0-9._-]{20,})'; then
  echo 'Potential credential found in Git history.'
  exit 1
fi
```

Keep the existing current-tree scan as a second line of defense.

- [ ] **Step 3: Commit**

Commit message: `ci: scan full history for credentials`

- [ ] **Step 4: Let CI run before any public-release action**

Expected: CI must complete successfully. If this step fails, stop the release and rotate/rewrite any exposed credential before continuing.

---

### Task 5: Publish clear multilingual README and user guides

**Files:**
- Modify: `README.md`
- Create: `README.zh-CN.md`
- Create: `README.ja.md`
- Create: `docs/USAGE.md`
- Create: `docs/USAGE.zh-CN.md`
- Create: `docs/USAGE.ja.md`

**Interfaces:**
- English README is the default GitHub landing page.
- All README files cross-link `English | 简体中文 | 日本語`.
- All usage guides cover the same behavior and safety semantics.

- [ ] **Step 1: Rewrite the English README as the OSS landing page**

Include: one-line product description, `Capture now. Organize later.`, product flow, screenshot/GIF placeholder only if a real asset exists, feature list, architecture, quick start, deployment options, security model, language links, docs links, current V1 scope, roadmap note for Photo + Comment, and license status.

- [ ] **Step 2: Create natural Simplified Chinese and Japanese README versions**

Do not literal-machine-translate. Preserve product terminology: `Capture`, `Fragments`, `Miro`, `Sticky`, `Live Ideas`.

- [ ] **Step 3: Create the three full Usage guides**

Each guide must cover:

1. What Live Ideas is for.
2. First launch and the two main screens.
3. Capture → Send → Miro.
4. Sending / Success / Failed / Retry states.
5. Fragments history and six-line visual clamp.
6. Swipe-left local delete and the fact it does **not** delete the Miro Sticky.
7. Horizontal Capture ↔ Fragments swipe.
8. iPhone Safari Add to Home Screen flow.
9. Troubleshooting for network errors, missing Miro Sticky, authorization/config errors, retries, and device-local history.
10. Data/storage explanation: draft/history in browser localStorage; successful Capture text sent through same-origin server to the configured Miro Board.

- [ ] **Step 4: Review language consistency against actual UI copy**

Exact UI strings to preserve where referenced:

```text
Type your idea...
Sending...
Your idea was sent to Miro
Failed to send. Tap to retry.
Capture
Fragments
```

- [ ] **Step 5: Commit**

Commit message: `docs: add multilingual Live Ideas guides`

---

### Task 6: Publish setup, architecture, and security docs for maintainers

**Files:**
- Modify: `docs/SETUP.md`
- Create: `docs/ARCHITECTURE.md`
- Create: `docs/SECURITY.md`
- Modify: `.env.example`

**Interfaces:**
- Setup documents two deployment targets: private ChatGPT Sites and reproducible Cloudflare Workers self-host.
- Security explicitly says never put the Miro token in client-side JavaScript or public environment variables.

- [ ] **Step 1: Rewrite SETUP for public use**

Document prerequisites, Miro app scopes (`boards:read`, `boards:write`), environment keys, local `.dev.vars`, `npm ci`, `npm test`, `npm run build`, ChatGPT Sites deployment, Cloudflare Worker secret commands, and `npm run deploy:cloudflare`.

For Cloudflare, document:

```bash
npx wrangler secret put MIRO_ACCESS_TOKEN
npx wrangler secret put MIRO_BOARD_ID
npx wrangler secret put SELF_HOST_PASSWORD
npm run deploy:cloudflare
```

State that the self-host username is `liveideas` and the password is the configured `SELF_HOST_PASSWORD`.

- [ ] **Step 2: Add architecture doc**

Explain the browser/localStorage/domain/remote/Worker/Miro boundaries, deterministic Board-aware placement, local delete semantics, and why secrets stay server-side.

- [ ] **Step 3: Add security doc**

Cover secret handling, current ChatGPT Sites owner header mode, self-host Basic auth requirements (HTTPS only), localStorage privacy, no analytics by default, credential rotation, and what to do if a secret ever appears in Git history.

- [ ] **Step 4: Commit**

Commit message: `docs: publish setup architecture and security guidance`

---

### Task 7: Release verification and handoff

**Files:**
- No new production files unless verification finds a defect.

**Interfaces:**
- Produces a release-candidate SHA ready for license approval, merge/public visibility decisions, and final real-device smoke test.

- [ ] **Step 1: Run the full verification suite**

Run:

```bash
npm ci --no-audit --no-fund
npm test
npm run build
```

Expected: zero test failures and successful build.

- [ ] **Step 2: Verify release artifacts and naming**

Confirm:

```text
dist/server/index.js
dist/.openai/hosting.json
dist/wrangler.json
```

Search the release branch current tree for accidental `Live Lyrics` occurrences and allow only explicit migration/history mentions.

- [ ] **Step 3: Verify GitHub Actions on the release-candidate SHA**

Expected: tests, Sites build, artifact verification, current-tree secret scan, and full-history secret scan all PASS.

- [ ] **Step 4: Stop for the only legal/product decision**

Ask the maintainer to choose the release license explicitly:

- `MIT` for permissive reuse/forking; or
- `AGPL-3.0` if network-service derivatives should publish their source.

Do not create a LICENSE file until this choice is made.

- [ ] **Step 5: After license approval, add LICENSE and rerun CI**

Commit message: `docs: add open-source license`

- [ ] **Step 6: Present merge/public-release gate**

Do not merge to `main` or change repository visibility automatically. Present the verified release-candidate SHA and ask for explicit approval to merge and make the repository public.
