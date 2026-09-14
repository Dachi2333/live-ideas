# Live Ideas — Architecture

Live Ideas is intentionally split into a tiny browser Capture layer and a server-side Miro boundary.

The core rule is simple:

> The browser may contain the user's idea, but it must never contain the Miro credential that can write to the Board.

## 1. High-level flow

```text
Phone / browser
│
├─ Capture UI
├─ localStorage
│  ├─ current Draft
│  └─ sent Fragments history
│
└─ POST /api/fragments
        ↓
Same-origin Worker
│
├─ deployment-specific authorization
├─ request validation
├─ server-side Miro credentials
└─ Miro client
        ↓
Miro REST API
│
├─ read existing Sticky geometry
├─ resolve positions
├─ find the first free grid slot
└─ create Sticky
        ↓
Success response
        ↓
Browser persists Sent state
        ↓
Capture clears
```

## 2. Browser responsibilities

The browser owns interaction and device-local safety copies. It does not talk directly to Miro.

### `src/client/app.js`

Owns UI wiring:

- Capture input and Send / Retry states;
- short success feedback;
- Capture ↔ Fragments direct-manipulation swipe;
- Fragments swipe-to-delete interaction;
- formatting display times;
- iOS visual viewport height synchronization.

### `src/client/view-model.js`

Owns browser-facing state:

- current text;
- `sending`;
- current error;
- calls into the Capture service;
- only clears local Capture after the service grants clear permission;
- exposes sent Fragments and local deletion.

### `src/client/local-storage.js`

Owns device-local persistence:

```text
live-ideas:capture:v1
live-ideas:fragments:v1
```

It also contains the one-time migration path from legacy:

```text
live-lyrics:capture:v1
live-lyrics:fragments:v1
```

The migration writes the new key before removing the old key, so a failed write does not intentionally destroy the legacy copy.

### `src/client/remote.js`

Owns the same-origin browser request to:

```text
POST /api/fragments
```

The browser does not receive the Miro access token or call `api.miro.com` directly.

## 3. Domain responsibilities

### `src/domain/fragment.js`

Defines fragment state transitions and preserves exact user text.

### `src/domain/capture-service.js`

Owns the reliability-critical send orchestration:

```text
Draft
→ local fragment record
→ Sending
→ remote request
→ Sent or Failed
```

The key invariant is:

> Never grant permission to clear the Capture unless remote creation succeeded and local Sent persistence succeeded.

### `src/domain/store.js`

Owns the local fragment collection:

- insert / replace;
- newest-first sent list;
- local remove;
- sent count.

Removing a local record has no Miro side effect.

### `src/domain/positioning.js`

Contains the deterministic base grid-position primitive. The current Miro integration also validates actual Board geometry before choosing the placement.

## 4. Worker boundary

### `worker/index.js`

Owns top-level routing:

```text
/api/fragments → API handler
/api/*         → JSON 404
other paths    → static assets
```

In Cloudflare self-host mode, it also protects the whole app with HTTP Basic Authentication before either assets or APIs are served.

### `worker/api.js`

Owns:

- deployment-mode authorization;
- runtime configuration validation;
- request-size limits;
- JSON / fragment validation;
- construction of the Miro client;
- sanitized success/error responses.

There are two authorization modes.

#### ChatGPT Sites mode

When `SELF_HOST_PASSWORD` is absent:

```text
oai-authenticated-user-email
↕ compare
OWNER_EMAIL
```

#### Self-host mode

When `SELF_HOST_PASSWORD` is configured:

```text
HTTP Basic username: liveideas
HTTP Basic password: SELF_HOST_PASSWORD
```

Self-host mode takes precedence if its password exists.

## 5. Miro client and placement

`worker/miro.js` is the only layer that translates Live Ideas behavior into Miro REST operations.

For each new Sticky it:

1. Reads existing Sticky items on the configured Board.
2. Follows pagination when needed.
3. Resolves frame-relative positions into comparable canvas coordinates.
4. Treats Sticky Notes as geometry, not just exact center points.
5. Detects overlaps, including manually shifted existing Stickies.
6. Chooses the first available deterministic grid slot.
7. Creates the new Sticky using the server-side access token.

This matters because users may send from more than one device. Placement cannot safely be decided from one browser's local history alone; the Board itself is the authoritative placement state.

## 6. Fragments are not a Miro mirror

The local Fragments list is deliberately one-way historical context.

```text
successful send
→ Miro Sticky
→ local Sent record
```

There is no reverse synchronization from Miro back into Fragments.

Therefore:

- moving a Sticky in Miro does not change the local Fragment;
- editing a Sticky in Miro does not edit local history;
- deleting local history does not delete the Sticky;
- V1 does not attempt conflict resolution or cross-device Fragments sync.

Miro is the downstream workspace; Fragments is a device-local receipt.

## 7. Data boundary

### Browser

May contain:

- unsent Capture text;
- sent Fragment text;
- timestamps / fragment IDs.

Must not contain:

- Miro access token;
- self-host password;
- private deployment secrets.

### Worker runtime

Contains deployment-specific server-side values:

```text
MIRO_ACCESS_TOKEN
MIRO_BOARD_ID
OWNER_EMAIL            # ChatGPT Sites mode
SELF_HOST_PASSWORD     # self-host mode
```

### Miro

Receives successful Capture text as a Sticky Note on the configured Board.

## 8. Build / deployment architecture

Vite builds the browser and Cloudflare Worker environments together.

`@cloudflare/vite-plugin` reads `wrangler.jsonc` and generates a deployment-output `wrangler.json` that points to built artifacts.

`@openai/sites-vite-plugin` plus `build/sites-worker-plugin.js` preserves the additional ChatGPT Sites-compatible output:

```text
dist/server/index.js
dist/.openai/hosting.json
```

This lets the same Capture/domain code support the current private Sites deployment and the public Cloudflare self-host path without moving Miro credentials into the client.

## 9. Non-goals of the architecture

V1 deliberately avoids:

- a cloud database for Fragments;
- user accounts managed by Live Ideas;
- multi-board routing;
- OAuth board picker;
- offline queues / service workers;
- real-time Miro sync;
- image / audio storage;
- AI processing.

Those capabilities would add lifecycle and synchronization complexity to a product whose current value is low-friction Capture.
