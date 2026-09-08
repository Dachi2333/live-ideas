# Live Lyrics Web App V0 Design

**Status:** Approved
**Date:** 2026-09-08
**Source:** `docs/PRD.md` / uploaded PRD v3 and OUTLINE v3

## Goal

Build Live Lyrics V0 as a minimal mobile-first Web App, hosted primarily on ChatGPT Sites, where the daily path is only `Fragments` + text capture + `↗` and every confirmed send creates one Sticky Note on one fixed Miro Board.

## Architecture

The browser owns the capture draft, local fragment history, UI state, and deterministic placement index. A same-origin server endpoint owns Miro credentials and the Miro REST request. Miro credentials must never be present in browser code, browser storage, repository files, prompts, or attached files.

ChatGPT Sites is the primary deployment target. The source project uses a Sites-compatible Vite + Cloudflare Worker shape with `.openai/hosting.json`, a static browser client, and a server worker. Hosted runtime values are configured in Sites settings.

## Components

- `src/domain/fragment.js`: fragment model and state transitions.
- `src/domain/store.js`: storage semantics independent of localStorage.
- `src/domain/positioning.js`: deterministic 4-column grid.
- `src/domain/capture-service.js`: send orchestration and reliability invariant.
- `src/client/local-storage.js`: browser localStorage adapter for current draft and fragments.
- `src/client/app.js`: minimal DOM UI, view switching, input persistence, send/retry behavior.
- `worker/miro.js`: Miro content escaping and remote Sticky creation.
- `worker/index.js`: same-origin API boundary, runtime-secret checks, owner-only identity guard, and static asset fallback.

## Runtime configuration

Hosted Sites settings provide:

- `MIRO_ACCESS_TOKEN` — secret
- `MIRO_BOARD_ID` — environment value or secret
- `OWNER_EMAIL` — secret/environment value used to protect the Miro write endpoint

The Site should remain owner-only during V0 dogfood. The server additionally requires the authenticated ChatGPT user email to match `OWNER_EMAIL` before a Miro write is allowed.

## Local data

V0 uses browser localStorage only. No D1/R2 is required.

- Current draft key: `live-lyrics:capture:v1`
- Fragment history key: `live-lyrics:fragments:v1`

No cross-device synchronization is part of V0.

## Reliability invariant

`Draft -> Sending -> Sent | Failed`.

The browser must not clear the current text until the Miro request succeeds and the local `sent` state has persisted. Any network, auth, rate-limit, validation, or local persistence failure keeps the exact original text available for retry.

Repeated send activation while a request is in flight is ignored. A fragment already stored as `sent` is never sent again by the client.

## UI

Capture is the default view. The viewport contains only:

- `Fragments` in the upper-left;
- a large plain textarea;
- `↗` as the primary lower-right action;
- a tiny failure/status line only when required.

Fragments is read-only, newest-first, text + timestamp, with one back action. It has no edit, delete, search, tag, filter, folder, project, Song, or compose controls.

The visual language is quiet, mobile-first, system-font, high-contrast, no decorative shadows or marketing shell.

## Sites / mobile shape

The app includes a web manifest and iOS web-app meta tags so Safari can add it to the Home Screen and run it in a standalone-like window where supported. V0 does not add a service worker or offline-first subsystem.

## Security

- Secrets never enter Git.
- Browser requests only the same-origin `/api/fragments` endpoint.
- The server performs the Miro request.
- The server checks `OWNER_EMAIL` against the ChatGPT Sites authenticated-user email header.
- API responses never echo credentials or Miro upstream bodies.
- Request body size is capped.

## Testing

Pure domain behavior is covered with Node built-in tests. Worker request construction and authorization are tested without real credentials. CI runs tests, a production Sites-compatible build, and a tracked-file secret scan.

Real iPhone acceptance remains mandatory for Safari/Home Screen behavior and real Miro Sticky creation.

## Explicitly not V0

Drafts, native iOS, AI, tags, folders, search, Song/Project, recording, Melody Fragment, speech-to-text, images, multiple Boards, collaboration, accounts, Android native, Widget, Lock Screen Control, Control Center Control, Action Button, complex sync, intelligent layout.