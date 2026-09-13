<p align="center">
  <img src="./docs/assets/readme/hero.webp" alt="Live Ideas — capture on your phone, send to Miro, organize later" width="100%" />
</p>

<p align="center">
  <strong>English</strong> · <a href="./README.zh-CN.md">简体中文</a> · <a href="./README.ja.md">日本語</a>
</p>

<p align="center">
  <strong>A capture layer for visual workspaces.</strong><br />
  Type on your phone. Send to Miro. Organize on the board later.
</p>

---

## How it works

| 01 — Capture | 02 — Send | 03 — Organize |
| --- | --- | --- |
| Open Live Ideas and type the thought before it disappears. | Tap once. The server safely sends it to your configured Miro Board. | A Sticky Note appears in Miro. Sort, cluster, discuss, or compose later. |

That is the entire daily workflow.

```text
idea appears
→ open Live Ideas
→ type
→ Send
→ Miro Sticky
→ keep moving
```

If sending fails, the original text stays in Capture and can be retried. Live Ideas does not clear the input until the Miro Sticky is confirmed **and** the local sent state is saved.

## Why it exists

The problem was never “where can I write this down?”

The problem was the extra work between **capturing something in the moment** and **getting it into the place where it will actually be used later**.

Live Ideas removes that handoff.

> **Capture now. Organize later.**

Your phone is the pocket sticky note. Miro is the wall.

## Made to disappear

Live Ideas is intentionally small. It is not trying to become another notes app.

- No folders, tags, projects, or search in V1.
- No board organization on the phone.
- No Miro access token in browser JavaScript.
- No requirement to classify an idea before capturing it.
- No cloud account system or cross-device sync in V1.

The Capture surface exists for one job: **leave a reliable trace with as little friction as possible.**

## Capture → Miro

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
├─ server-side Miro credentials
└─ board-aware Sticky placement
       ↓
Miro Board
└─ Sticky Note
```

The Worker reads the current board state and chooses a free grid position so new Stickies do not simply pile on top of each other.

## Fragments

**Fragments** answers one question only:

> What did I successfully send before?

It is a local history, newest first. Long text is visually clamped to six lines while the full text stays stored. Swipe left to delete a local history item; this **does not delete the corresponding Miro Sticky**.

## Use cases

Live Ideas started from personal writing, but the underlying pattern is broader:

- **Ideas / writing** — capture a line before it vanishes.
- **Exhibitions / trade shows** — leave a quick observation while walking.
- **Workshops** — capture first, cluster and discuss later.
- **Field research / store visits** — record observations in the field, analyze back at the desk.
- **Competitive / CMF research** — send useful fragments directly into the shared visual workspace.

V1 is text-only. The leading V2 direction is **Photo + Comment → Miro**.

## Use it

**Start here if you just want to understand or run the project:**

- [Usage guide →](./docs/USAGE.md)
- [Setup & deployment →](./docs/SETUP.md)
- [Architecture →](./docs/ARCHITECTURE.md)
- [Security model →](./docs/SECURITY.md)

Localized usage guides:

- [简体中文使用教程](./docs/USAGE.zh-CN.md)
- [日本語の使い方](./docs/USAGE.ja.md)

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

For a reproducible public deployment, follow the [Cloudflare Workers self-host guide](./docs/SETUP.md). The maintainer's private dogfood deployment uses ChatGPT Sites, but the open-source project does not depend on that environment.

## Self-host security

For Cloudflare Workers self-hosting, keep these values on the server:

```text
MIRO_ACCESS_TOKEN
MIRO_BOARD_ID
SELF_HOST_PASSWORD
```

When `SELF_HOST_PASSWORD` is configured, the whole app is protected with HTTP Basic authentication. Use HTTPS and a long unique password.

Never commit real tokens, Board IDs, passwords, `.env`, or `.dev.vars` files.

## Development

```bash
npm run dev
npm test
npm run build
npm run preview
```

The test suite covers capture reliability, local persistence and legacy-key migration, Fragments deletion, UI contracts, API authorization, Miro placement, self-host authentication, and secret scanning.

## Product docs

- [PRD](./docs/PRD.md)
- [Project outline](./docs/OUTLINE.md)
- [Real-device acceptance](./docs/DEVICE_ACCEPTANCE.md)

## License

MIT — see [LICENSE](./LICENSE).

---

<p align="center">
  <sub>Live Ideas is an independent open-source project and is not affiliated with Miro.</sub>
</p>
