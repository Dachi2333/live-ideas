# Live Lyrics V0 Setup

This V0 uses **Drafts on iPhone** as the capture surface and Miro as the destination wall.

## One-time setup

1. Install Drafts on iPhone.
2. Create/configure a Miro developer app or access token with **`boards:write` only**.
3. Obtain the ID of the one fixed target Miro Board.
4. In a Cloud/local development environment, run:

```bash
npm ci
npm run build
```

This creates:

```text
dist/live-lyrics-send.js
dist/live-lyrics-fragments.js
```

5. In Drafts, create an action named **`↗`** with one Script step containing the built `dist/live-lyrics-send.js` code.
6. Create a second Drafts action named **`Fragments`** with one Script step containing `dist/live-lyrics-fragments.js`.
7. Put `↗` and `Fragments` in the same minimal Drafts action bar/group used for capture. Do not add extra V0 actions.
8. On the first send, the Drafts Credential prompt asks for:
   - Miro access token
   - Miro Board ID

   Enter the real values in Drafts Credential storage only. **Never paste them into this repository, `.env.example`, source code, issues, or PRs.**
9. Verify a successful send creates exactly one Miro Sticky Note and then opens a fresh blank Drafts editor.
10. Verify a failed send leaves the current Drafts text untouched.

## Daily V0 flow

```text
open Drafts
→ type fragment
→ tap ↗
→ leave
```

Use **Fragments** only to review successfully sent items. It is intentionally read-only.

## V0 status

Drafts is the deliberate V0 dogfood shell. This setup does **not** commit the project to a permanent native iOS app or permanently rule one out. We first test whether this low-friction capture flow is good enough in real use.
