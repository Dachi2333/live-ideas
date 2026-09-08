# Live Lyrics V0 — Setup

This document contains key names and setup steps only. Never paste real Miro credentials into tracked files, prompts, issue comments, or PR descriptions.

## 1. Miro destination

Prepare one fixed Miro Board for Live Lyrics.

The runtime needs:

```text
MIRO_ACCESS_TOKEN
MIRO_BOARD_ID
```

The token must be able to create Sticky Notes on that Board. The app does not need unrelated Miro data.

## 2. Owner identity

Live Lyrics V0 is private dogfood. Keep the deployed Site limited to the owner while validating it.

Configure:

```text
OWNER_EMAIL
```

Use the same email identity with which you access the owner-only ChatGPT Site. The server compares this against the Sites-authenticated user email header before calling Miro.

## 3. ChatGPT Sites runtime values

After the project builds successfully:

1. Open **Sites** in ChatGPT.
2. Create/prepare a Site from this compatible project.
3. Keep access limited to **Owner and workspace admins** during V0 acceptance.
4. Open the Site’s **Settings**.
5. Add hosted environment values/secrets using exactly these keys:

```text
MIRO_ACCESS_TOKEN
MIRO_BOARD_ID
OWNER_EMAIL
```

6. Save a version first and review it before deploying.
7. After adding or changing hosted runtime values, redeploy the approved saved version.

Do not put these values in `.openai/hosting.json`. That file only contains non-secret Sites hosting metadata/bindings.

## 4. Local environment

For local development only, copy the key names from `.env.example` into an ignored `.env` file if needed by the chosen local runner.

`.env.example` must remain blank after the equals signs.

## 5. Build gate

Before Sites deployment:

```bash
npm test
npm run build
```

Required artifacts:

```text
dist/server/index.js
dist/.openai/hosting.json
```

The tracked repository must contain no populated Miro token or private Board ID.

## 6. Deployment gate

Every Sites deployment URL is a production deployment. For V0:

1. save a version;
2. review the preview;
3. deploy only after the preview is accepted;
4. keep access owner-only;
5. then execute `docs/DEVICE_ACCEPTANCE.md` on the real iPhone.
