# AGENTS.md

## Project identity

Repository: `live-ideas`
Current product working name: **Live Lyrics**
Current V0 use case: **lyrics text capture only**
Current V0 runtime: **mobile Web App, ChatGPT Sites first**

`docs/PRD.md` is the locked V0 source of truth. `docs/OUTLINE.md` is the human-readable companion.

## Non-negotiable product rule

Before adding behavior, ask:

> Does this directly reduce friction between an idea appearing and leaving a reliable trace?

If not, do not add it to V0.

## V0 scope

V0 contains only:

- a mobile Capture surface;
- one `Fragments` entry;
- one primary send action `↗`;
- browser-local draft and fragment persistence;
- `draft | sending | sent | failed` state;
- delivery to one fixed Miro Board as one Sticky Note per successful fragment;
- predictable non-overlapping placement;
- retry without data loss;
- a same-origin server boundary that owns Miro credentials.

Explicitly out of scope:

- Drafts runtime;
- native iOS / Android apps;
- AI features;
- recording, Melody Fragment, speech-to-text;
- Song / project management;
- tags, folders, search, favorites;
- images;
- multiple boards or destinations;
- accounts, collaboration, social features;
- Widget, Lock Screen Control, Control Center, Action Button;
- board-side organization or smart layout;
- service-worker/offline-first architecture;
- complex cloud synchronization.

## Reliability invariant

Never clear or delete the current fragment until:

1. Miro has confirmed Sticky creation; and
2. the local `sent` state has persisted.

On any error:

- preserve the exact text locally when browser storage remains available;
- expose a short failure state;
- allow retry when appropriate;
- never silently discard or overwrite content.

## Architecture boundaries

Keep responsibilities isolated:

- domain fragment model owns state shape only;
- capture service owns send orchestration only;
- browser persistence owns local draft/history only;
- browser remote owns same-origin API calls only;
- worker API owns authorization and input validation only;
- Miro client owns Miro REST translation only;
- positioning owns deterministic coordinates only.

Do not let Miro access tokens, private Board IDs, or Miro request shapes leak into browser code.

## ChatGPT Sites boundary

ChatGPT Sites is the primary deployment target.

- Use `.openai/hosting.json` only for non-secret hosting metadata/bindings.
- Runtime values are configured in Site Settings, never committed.
- Required runtime keys: `MIRO_ACCESS_TOKEN`, `MIRO_BOARD_ID`, `OWNER_EMAIL`.
- Keep Site access owner-only during V0 dogfood and acceptance.
- Production authorization uses the Sites-authenticated user email header.
- If Sites cannot provide the required server-side secret/runtime behavior, STOP rather than expose credentials to the browser.

## Cloud-first workflow

GitHub is the source of truth.

For implementation work:

1. branch from `main`;
2. one coherent behavior change at a time;
3. tests before implementation when practical;
4. run focused tests, then full tests/build;
5. commit with a focused message;
6. open a PR;
7. never commit secrets.

## Secrets

Never commit:

- Miro access token;
- Miro client secret;
- private Miro Board ID;
- private account identifiers;
- populated `.env` files.

`.env.example` contains key names only.

## Device acceptance

Cloud tests do not replace real iPhone acceptance. Final V0 acceptance must include:

- Safari and Add-to-Home-Screen launch;
- keyboard/input readiness;
- Chinese, Japanese, English, emoji, multiline and whitespace;
- page refresh and background/restore draft survival;
- success path;
- weak/no network;
- Miro API/auth failure and 429 handling;
- retry;
- repeated taps;
- long text;
- Fragments ordering;
- confirmed real Sticky creation;
- clean Capture only after confirmed success;
- verification that Miro credentials are absent from browser source/network-readable configuration.

## Naming

Repository name stays broader (`live-ideas`) for future open-source flexibility.
Do not broaden V0 behavior to match the repository name.
Current product copy is **Live Lyrics**.
