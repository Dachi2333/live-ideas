# AGENTS.md

## Project identity

Repository: `live-ideas`
Current product working name: **Live Lyrics**
Current V0 use case: **lyrics capture only**

`docs/PRD.md` is the locked V0 source of truth. `docs/OUTLINE.md` is a human-readable companion.

## Non-negotiable product rule

Before adding any behavior, ask:

> Does this directly reduce friction between an idea appearing and leaving a reliable trace?

If not, do not add it to V0.

Do not add features merely because they may be useful for a future open-source audience.

## V0 scope

V0 contains only:

- a Capture surface;
- one `Fragments` entry;
- one primary send action `↗`;
- local fragment persistence;
- a send state machine: `draft | sending | sent | failed`;
- delivery to one fixed Miro Board as one Sticky Note per successful fragment;
- predictable non-overlapping placement;
- retry without data loss.

Explicitly out of scope:

- AI features;
- tags, folders, search, favorites;
- song/project management;
- Verse/Hook/Bridge classification;
- recording or speech-to-text;
- images;
- multiple boards or destinations;
- Android or Web App;
- collaboration, accounts, social features;
- board-side organization or smart layout.

## Reliability invariant

Never clear or delete the current fragment until Miro creation has been confirmed successful.

On any error:

- preserve the exact text locally;
- mark the attempt failed;
- allow retry;
- do not silently discard or overwrite content.

## Architecture boundaries

Keep responsibilities isolated:

- capture orchestration owns the send flow only;
- fragment storage owns local state and history only;
- Miro adapter owns HTTP/API translation only;
- positioning owns deterministic coordinates only;
- device integration owns Drafts/iPhone-specific APIs only.

Do not let Miro-specific request shapes leak into fragment domain logic.
Do not let Drafts-specific APIs leak into pure domain modules.

## Cloud-first workflow

GitHub is the source of truth.
Primary implementation environment is Codex Cloud.

For implementation work:

1. branch from `main`;
2. make one coherent change at a time;
3. add or update tests before implementation when practical;
4. run the relevant test suite;
5. commit with a focused message;
6. open a PR for review;
7. never commit secrets.

## Secrets

Never commit any of the following:

- Miro access token;
- Miro client secret;
- private Board ID;
- private account identifiers;
- any real `.env` file.

Only commit templates such as `.env.example` with placeholder values.

## Device acceptance

Cloud tests do not replace iPhone acceptance. Final acceptance must include:

- keyboard/input readiness;
- Chinese, Japanese, English, and emoji;
- success path;
- weak/no network;
- Miro API failure;
- retry;
- repeated taps;
- long text;
- Fragments ordering;
- confirmed Sticky creation;
- clean Capture state only after confirmed success.

## Naming

Repository name is intentionally broader (`live-ideas`) for future open-source flexibility.
Do not broaden V0 behavior to match the repository name.
Current product copy may use **Live Lyrics** until explicitly changed.
