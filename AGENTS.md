# AGENTS.md

## Project identity

Repository: `live-ideas`
Current product working name: **Live Ideas**
Current V1 use case: **low-friction text capture to one fixed Miro Board**
Current private runtime: **mobile Web App, ChatGPT Sites first**
Public release direction: **Web-first and self-hostable**

`docs/PRD.md` is the active V1 source of truth. `docs/OUTLINE.md` is the human-readable companion. Figma is the visual source of truth for UI dimensions, colors, typography, icons, states, and motion.

## Non-negotiable product rule

Before adding behavior, ask:

> Does this directly reduce friction between an idea or observation appearing and leaving a reliable trace?

If not, do not add it to V1.

## V1 scope

V1 contains only:

- a mobile Capture surface;
- one `Fragments` page;
- one primary send action;
- browser-local draft and sent-history persistence;
- `draft | sending | sent | failed` state;
- delivery to one fixed Miro Board as one Sticky Note per successful fragment;
- predictable non-overlapping placement;
- retry without data loss;
- a same-origin server boundary that owns Miro credentials;
- local Fragments deletion that never deletes the corresponding Miro Sticky;
- direct-manipulation Capture ↔ Fragments swipe;
- migration from legacy `live-lyrics:*` browser keys to `live-ideas:*` keys.

Explicitly out of scope for V1:

- native iOS / Android apps;
- AI features;
- recording, Melody Fragment, speech-to-text;
- project / folder / tag management;
- search, favorites, classification;
- images / camera / photo library;
- multiple boards or destinations;
- accounts, collaboration, social features;
- Widget, Lock Screen Control, Control Center, Action Button;
- board-side organization or smart layout;
- service-worker/offline-first architecture;
- complex cloud synchronization;
- OAuth + Board Picker.

Photo + Comment capture is a V2 candidate and must not leak into V1 implementation work.

## Reliability invariant

Never clear or delete the current Capture text until:

1. Miro has confirmed Sticky creation; and
2. the local `sent` state has persisted.

On any error:

- preserve the exact text locally when browser storage remains available;
- expose a short failure state;
- allow retry when appropriate;
- never silently discard or overwrite content.

## Fragments invariant

Fragments answers only:

> What did I successfully send before?

Deleting a Fragment removes the local browser-history record only. It must never delete or mutate the already-created Miro Sticky.

Long text may be visually clamped, but the full text must remain stored.

## Architecture boundaries

Keep responsibilities isolated:

- domain fragment model owns state shape only;
- capture service owns send orchestration only;
- browser persistence owns local draft/history only;
- browser remote owns same-origin API calls only;
- Worker API owns authorization and input validation only;
- Miro client owns Miro REST translation and Board-aware placement only;
- secrets never cross into browser code.

Do not let Miro access tokens, private Board IDs, or Miro request shapes leak into browser code.

## Deployment boundaries

### Private ChatGPT Sites mode

- Use `.openai/hosting.json` only for non-secret hosting metadata/bindings.
- Runtime values are configured in Site Settings, never committed.
- Required private deployment keys: `MIRO_ACCESS_TOKEN`, `MIRO_BOARD_ID`, `OWNER_EMAIL`.
- Keep the private Site owner-only during acceptance/dogfood.
- Production authorization uses the Sites-authenticated user email header.

### Public self-host direction

The open-source release must provide at least one reproducible self-host route that does not depend on the maintainer's ChatGPT Sites account.

- Miro credentials remain server-side secrets.
- Never solve self-hosting by embedding a Miro token in client JavaScript.
- The self-host auth path must be documented and secure over HTTPS.
- Deployment/auth concerns stay outside the Capture domain logic.

## Cloud-first workflow

GitHub is the source of truth.

For implementation work:

1. work on an isolated feature/release branch;
2. one coherent behavior change at a time;
3. tests before implementation for behavior changes;
4. run focused tests, then full tests/build;
5. commit with a focused message;
6. keep release PRs reviewable;
7. never commit secrets.

## Secrets

Never commit:

- Miro access token;
- Miro client secret;
- private Miro Board ID;
- authentication passwords;
- private account identifiers;
- populated `.env` or `.dev.vars` files.

`.env.example` contains key names only.

Before making the repository public, the release gate must scan both the current tree and full Git history for populated credentials.

## Device acceptance

Cloud tests do not replace real iPhone acceptance. V1 acceptance includes:

- Safari and Add-to-Home-Screen launch;
- keyboard/input readiness;
- Chinese, Japanese, English, emoji, multiline and whitespace;
- page refresh and background/restore draft survival;
- success path;
- weak/no network;
- Miro API/auth failure and 429 handling;
- retry;
- repeated taps;
- long text and six-line Fragments clamp;
- Fragments ordering and local deletion;
- direct-manipulation Capture ↔ Fragments swipe and indicator tracking;
- confirmed real Sticky creation;
- clean Capture only after confirmed success;
- legacy localStorage migration;
- verification that Miro credentials are absent from browser source/network-readable configuration.

## Naming

Public product copy is **Live Ideas**.

Legacy **Live Lyrics** references are allowed only where migration/history is explicitly being documented. Runtime names, README copy, deployment copy, tests, and public-facing documentation use **Live Ideas**.
