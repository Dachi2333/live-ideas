# Live Lyrics V0 Design

**Status:** Proposed architecture for locked V0  
**Date:** 2026-09-08  
**Source:** `docs/PRD.md`

## 1. Goal

Build the smallest reliable iPhone capture flow that lets the user type a lyric fragment, tap one send action, and have that fragment appear as a Sticky Note on one fixed Miro Board while retaining a local history copy.

The defining property is not feature richness. It is low-friction capture with no data loss.

## 2. Recommended approach

Use a **Drafts-first V0** rather than building a native iOS application immediately.

The repository will contain plain JavaScript domain logic plus a thin Drafts integration layer. Pure logic must remain runnable and testable in Node so Codex Cloud can implement and verify most behavior without an iPhone. Drafts-specific APIs are isolated at the edge and verified later through device acceptance.

This approach is preferred because:

- it minimizes V0 implementation cost;
- it keeps capture available on iPhone;
- it allows the Miro transport, state machine, and placement logic to be tested in Cloud;
- it creates evidence before deciding whether a native app is worth building;
- it matches the PRD requirement not to pre-build a full app for hypothetical future needs.

A native iOS app is a later decision only if real dogfood demonstrates that Drafts creates unacceptable friction or cannot provide the required interaction.

## 3. System boundaries

```text
Drafts / iPhone UI
        │
        ▼
Capture Orchestrator
   │             │
   ▼             ▼
Fragment Store   Miro Adapter
                     │
                     ▼
               Miro REST API
                     │
                     ▼
              Fixed Miro Board
```

### Capture Orchestrator

Responsibilities:

- accept the exact fragment text;
- create/update local fragment state;
- move `draft → sending`;
- request Sticky creation through the Miro adapter;
- move to `sent` only after confirmed success;
- move to `failed` on any failure;
- return a result that tells the UI whether it is safe to clear the input.

It must not know HTTP request details or Drafts APIs.

### Fragment Store

Responsibilities:

- persist fragment records locally;
- retain `id`, `text`, `createdAt`, `sentAt`, and `status`;
- return sent fragments in reverse chronological order for the Fragments view;
- preserve failed text for retry.

It is a safety/history layer, not a note-management system.

### Miro Adapter

Responsibilities:

- translate a fragment plus coordinates into the official Miro Sticky Note request;
- send the request to one configured Board;
- normalize Miro success/failure into a small result interface;
- never read unrelated board content.

No access token, client secret, or real private Board ID may exist in the repository.

### Positioning

Responsibilities:

- produce deterministic coordinates from a simple sequence/index;
- avoid total overlap;
- remain intentionally dumb.

No smart layout, collision engine, content analysis, or board reading is allowed in V0.

### Drafts Integration

Responsibilities:

- expose the minimal capture interaction;
- read the current text;
- invoke the pure capture orchestrator;
- clear the editor only when the result confirms success;
- provide the minimal Fragments entry/view supported by the chosen Drafts implementation.

Drafts-specific APIs must remain outside pure domain modules.

## 4. Core domain model

```ts
type FragmentStatus = "draft" | "sending" | "sent" | "failed";

type Fragment = {
  id: string;
  text: string;
  createdAt: string;
  sentAt: string | null;
  status: FragmentStatus;
};
```

The text is treated as opaque user content. Chinese, Japanese, English, line breaks, and emoji must be preserved without transformation unless Miro's official API requires transport escaping.

## 5. Send contract

The capture flow must obey this invariant:

```text
input exists locally
      ↓
status = sending
      ↓
request Miro Sticky creation
      ├── confirmed success → status = sent → sentAt set → UI may clear input
      └── any failure       → status = failed → input/text preserved → retry allowed
```

A network timeout, malformed response, authentication problem, rate limit, or unknown response must never be interpreted as permission to discard the local text.

## 6. Configuration and secrets

Repository-safe configuration may define names only, for example:

```text
MIRO_ACCESS_TOKEN=
MIRO_BOARD_ID=
```

Real values stay outside Git. V0 should use the smallest practical configuration surface: one destination Board only.

## 7. Repository structure

Initial implementation should converge on:

```text
live-ideas/
├─ AGENTS.md
├─ README.md
├─ .gitignore
├─ .env.example
├─ docs/
│  ├─ PRD.md
│  ├─ OUTLINE.md
│  └─ superpowers/
│     ├─ specs/
│     └─ plans/
├─ src/
│  ├─ capture/
│  ├─ fragments/
│  ├─ miro/
│  └─ positioning/
├─ drafts/
└─ tests/
```

Actual files inside these directories should be introduced only when a concrete task needs them; empty architecture scaffolding is unnecessary.

## 8. Testing strategy

Cloud tests should cover pure behavior first:

- success changes a fragment to `sent`;
- failure changes a fragment to `failed`;
- failure preserves exact text;
- retry is possible;
- success returns explicit permission for the UI to clear input;
- failure never returns clear permission;
- multilingual and emoji text round-trips unchanged;
- positioning produces predictable non-overlapping coordinates;
- Miro adapter sends the expected Sticky Note payload using mocked HTTP.

Real token / real Board integration is not required for the unit suite.

## 9. Device acceptance

The V0 is not accepted solely because Node tests pass. The PRD's iPhone acceptance list remains mandatory, especially keyboard readiness, weak/no network, repeated taps, actual Sticky creation, and input clearing only after confirmed success.

## 10. Explicit non-goals

The architecture must not be extended in V0 for:

- generalized destination plugins;
- multi-board selection;
- accounts or OAuth product flows;
- sync engines;
- cloud databases;
- AI processing;
- generalized knowledge capture;
- a native iOS app;
- Android or Web clients.

The repository name `live-ideas` is future-flexible naming only. It is not permission to broaden V0.

## 11. Success criterion

The system is successful when the real user behavior becomes:

```text
open → type → ↗ → leave
```

and later the successfully sent fragments are already waiting as Miro Sticky Notes, while failed sends remain safely recoverable on the phone.
