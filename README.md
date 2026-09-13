# Live Ideas

**English** · [简体中文](./README.zh-CN.md) · [日本語](./README.ja.md)

> **Capture now. Organize later.**

Live Ideas is a tiny mobile-first capture layer for Miro. Open it, type an idea or observation, tap Send, and a Sticky Note appears on your configured Miro Board. The phone is the pocket sticky note; Miro is the wall.

```text
idea appears
→ open Live Ideas
→ type
→ Send
→ Miro Sticky
→ organize later on the desktop
```

Live Ideas is intentionally **not** a notes app, project manager, or Miro replacement. V1 does one thing: reduce the friction between an idea happening and leaving a reliable trace.

## What V1 includes

- **Capture** — one focused text surface with a single send action.
- **Reliable delivery** — text is not cleared until Miro creation succeeds and the local sent state is persisted.
- **Failed → Retry** — network/API failures keep the original text available for retry.
- **Fragments** — device-local, newest-first history of successfully sent text.
- **Six-line preview** — long Fragments stay compact while the full text remains stored.
- **Local delete** — swipe a Fragment left to remove the local history record. This does **not** delete the Miro Sticky.
- **Direct-manipulation navigation** — Capture ↔ Fragments follows your horizontal drag.
- **Board-aware placement** — the server reads current Miro Sticky geometry and chooses a free grid position.
- **Server-side secrets** — the Miro access token is never shipped in browser JavaScript.

## Architecture

```text
Phone / browser
├─ Capture UI
├─ localStorage
│  ├─ current draft
│  └─ sent Fragments history
└─ POST /api/fragments
       ↓
Same-origin Worker
├─ authorization
├─ server-side Miro secrets
└─ Miro client + placement
       ↓
Configured Miro Board
└─ Sticky Note
```

See [Architecture](./docs/ARCHITECTURE.md) for the detailed boundaries and data flow.

## Quick start

Requirements:

- Node.js **22.13+**
- a Miro app/token with `boards:read` and `boards:write`
- one target Miro Board

```bash
git clone https://github.com/Dachi2333/live-ideas.git
cd live-ideas
npm ci
npm test
npm run build
```

For full configuration and deployment steps, read [Setup](./docs/SETUP.md).

## Deployment options

### ChatGPT Sites

The maintainer's private deployment uses ChatGPT Sites with server-side values:

```text
MIRO_ACCESS_TOKEN
MIRO_BOARD_ID
OWNER_EMAIL
```

`OWNER_EMAIL` is matched against the Sites-authenticated user email. This path is convenient for private dogfood and does not expose the Miro token to the browser.

### Cloudflare Workers self-host

The open-source self-host path uses Cloudflare Workers with:

```text
MIRO_ACCESS_TOKEN
MIRO_BOARD_ID
SELF_HOST_PASSWORD
```

When `SELF_HOST_PASSWORD` is configured, the whole app is protected with HTTP Basic authentication. The username is fixed to:

```text
liveideas
```

Use a long unique password and HTTPS only. See [Setup](./docs/SETUP.md) and [Security](./docs/SECURITY.md).

## How to use it

Full end-user guides:

- [English usage guide](./docs/USAGE.md)
- [简体中文使用教程](./docs/USAGE.zh-CN.md)
- [日本語の使い方](./docs/USAGE.ja.md)

The everyday flow is deliberately short:

1. Open **Capture**.
2. Type into `Type your idea...`.
3. Tap Send.
4. `Sending...` appears while the request is in flight.
5. On success, `Your idea was sent to Miro` appears briefly and Capture clears.
6. If sending fails, the text remains and `Failed to send. Tap to retry.` appears with the Retry action.

## Data and privacy

- Current draft and Fragments history live in this browser's `localStorage`.
- Fragments are device/browser-local; V1 does not provide cross-device sync.
- Successfully sent Capture text is sent through the same-origin Worker to the configured Miro Board.
- Local Fragment deletion never deletes the corresponding Miro Sticky.
- Live Ideas includes no analytics by default.
- Do not commit real Miro tokens, Board IDs, passwords, `.env`, or `.dev.vars` files.

See [Security](./docs/SECURITY.md) for the complete model.

## V1 scope

V1 is **text capture only**. It deliberately does not include AI, tags, folders, search, projects, multiple destinations, audio, camera/photo capture, native mobile apps, or complex cloud sync.

The leading V2 candidate is **Photo + Comment → Miro** for exhibitions, workshops, store visits, and field research.

## Development

```bash
npm run dev
npm test
npm run build
npm run preview
```

The test suite covers capture reliability, local persistence/migration, Fragments deletion, UI contracts, API authorization, Miro placement, and self-host authorization.

## Product docs

- [PRD](./docs/PRD.md)
- [Project outline](./docs/OUTLINE.md)
- [Setup](./docs/SETUP.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Security](./docs/SECURITY.md)
- [Real-device acceptance](./docs/DEVICE_ACCEPTANCE.md)

## License

Live Ideas is released under the [MIT License](./LICENSE).
