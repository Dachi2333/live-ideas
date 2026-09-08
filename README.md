# Live Lyrics

Live Lyrics V0 is a deliberately tiny mobile Web App for capturing lyric fragments and sending each successful fragment to one fixed Miro Board as a Sticky Note.

The locked product flow is:

```text
open Live Lyrics
→ write
→ ↗
→ Miro Sticky
```

Daily UI contains only **Fragments**, the capture surface, and **↗**.

## V0 architecture

```text
browser
├─ Capture UI
├─ localStorage draft + sent history
└─ POST /api/fragments
        ↓
ChatGPT Sites server runtime
├─ authenticated-owner check
├─ hosted runtime values
└─ Miro REST API
        ↓
fixed Miro Board
```

Miro credentials are never shipped in the browser bundle.

## Local verification

Requires Node.js 22.13+ (CI uses Node 24).

```bash
npm install
npm test
npm run build
```

The Sites build must contain:

```text
dist/server/index.js
dist/.openai/hosting.json
```

## Runtime values

Only configure these as local environment values or ChatGPT Sites hosted environment values:

```text
MIRO_ACCESS_TOKEN
MIRO_BOARD_ID
OWNER_EMAIL
```

Do not commit real values. See `docs/SETUP.md`.

## Source of truth

- `docs/PRD.md` — locked V0 source
- `docs/OUTLINE.md` — compact project outline
- `docs/DEVICE_ACCEPTANCE.md` — real-iPhone final gate

Drafts-first work is historical prototype work and is not part of the Web App runtime.
