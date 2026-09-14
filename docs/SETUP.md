# Live Ideas — Setup & Deployment

This guide covers local development and the two supported V1 deployment modes:

1. **ChatGPT Sites** — useful for private owner-only dogfood.
2. **Cloudflare Workers self-host** — the reproducible open-source path.

Never put a real Miro token, private Board ID, or authentication password into tracked source files.

## 1. Prerequisites

- Node.js **22.13+** (CI uses Node 24)
- npm
- a Miro account
- a Miro app / access token with:

```text
boards:read
boards:write
```

`boards:write` creates the Sticky. `boards:read` is used on the configured Board so the server can inspect current Sticky geometry and choose a free placement position.

## 2. Get the project

```bash
git clone https://github.com/Dachi2333/live-ideas.git
cd live-ideas
npm ci
npm test
npm run build
```

Useful commands:

```bash
npm run dev
npm test
npm run build
npm run preview
```

The Vite / Cloudflare build produces the browser bundle, Worker bundle, and an output `wrangler.json` that Wrangler automatically uses for preview/deployment.

The ChatGPT Sites compatibility build also requires:

```text
dist/server/index.js
dist/.openai/hosting.json
```

## 3. Prepare Miro

Choose one Board that will receive Live Ideas Sticky Notes.

You need these runtime values:

```text
MIRO_ACCESS_TOKEN
MIRO_BOARD_ID
```

Do not place their real values in `.env.example`, `wrangler.jsonc`, frontend JavaScript, README examples, issues, or pull requests.

## 4. Local development

For local Worker development, create an ignored `.dev.vars` file in the project root.

For Cloudflare self-host mode:

```dotenv
MIRO_ACCESS_TOKEN=your-real-token
MIRO_BOARD_ID=your-real-board-id
SELF_HOST_PASSWORD=a-long-unique-password
```

Then run:

```bash
npm run dev
```

Open the local URL shown by Vite. In self-host mode the browser will prompt for HTTP Basic credentials:

```text
username: liveideas
password: the value of SELF_HOST_PASSWORD
```

`.dev.vars*` is ignored by Git. Do not force-add it.

## 5. Deployment A — ChatGPT Sites

This mode keeps the existing private Sites authorization behavior.

Configure these hosted runtime values in the Site settings:

```text
MIRO_ACCESS_TOKEN
MIRO_BOARD_ID
OWNER_EMAIL
```

Do **not** configure `SELF_HOST_PASSWORD` in this mode.

Authorization flow:

```text
Sites authenticated user email
↓
compare with OWNER_EMAIL
↓
allow /api/fragments only when they match
```

Recommended release flow:

1. Build and run tests.
2. Create a new saved Site version from the exact Git commit you intend to deploy.
3. Preserve the hosted runtime values above.
4. Keep access owner-only while dogfooding / accepting the build.
5. Deploy the new saved version.
6. Verify on a real iPhone and confirm a real Miro Sticky is created.

Never copy the Miro token into source code just to make a Sites build work.

## 6. Deployment B — Cloudflare Workers self-host

This is the public, reproducible self-host path.

### 6.1 Authenticate Wrangler

```bash
npx wrangler login
```

### 6.2 Build first

```bash
npm run build
```

The Cloudflare Vite plugin creates a deployment-ready output configuration during the build. Running `wrangler deploy` after the build automatically uses that output configuration.

### 6.3 First deploy: upload code and secrets together

To avoid temporarily publishing an unprotected Worker, create a local ignored file such as `.env.production`:

```dotenv
MIRO_ACCESS_TOKEN=your-real-token
MIRO_BOARD_ID=your-real-board-id
SELF_HOST_PASSWORD=a-long-unique-password
```

Then deploy the built application and secrets in the same operation:

```bash
npx wrangler deploy --secrets-file .env.production
```

`.env.production` is covered by the repository's `.env.*` ignore rule. Never commit it.

After the secrets exist on the Worker, normal code updates can use:

```bash
npm run deploy:cloudflare
```

Cloudflare keeps the existing Worker secrets across normal code deployments.

### 6.4 Alternative secret management

You can manage Worker secrets in the Cloudflare dashboard under the Worker's Variables and Secrets settings.

For an already-existing Worker you can also update them individually:

```bash
npx wrangler secret put MIRO_ACCESS_TOKEN
npx wrangler secret put MIRO_BOARD_ID
npx wrangler secret put SELF_HOST_PASSWORD
```

Be aware that `wrangler secret put` creates and deploys a new Worker version immediately. For a brand-new deployment, `--secrets-file` keeps initial code + secret setup together.

### 6.5 Self-host authentication

When `SELF_HOST_PASSWORD` is non-empty, Live Ideas protects **the whole app and its API** with HTTP Basic Authentication.

Use:

```text
username: liveideas
password: your SELF_HOST_PASSWORD
```

Use HTTPS only and choose a long unique password. Do not reuse your Miro password or Miro token.

## 7. Runtime mode selection

Live Ideas chooses the authorization mode from server-side runtime values.

### ChatGPT Sites mode

```text
MIRO_ACCESS_TOKEN
MIRO_BOARD_ID
OWNER_EMAIL
```

`SELF_HOST_PASSWORD` absent.

### Self-host mode

```text
MIRO_ACCESS_TOKEN
MIRO_BOARD_ID
SELF_HOST_PASSWORD
```

When `SELF_HOST_PASSWORD` exists, self-host Basic authentication takes precedence; `OWNER_EMAIL` is not required.

## 8. Build and verification gate

Before deploying any release candidate:

```bash
npm ci --no-audit --no-fund
npm test
npm run build
```

Verify the build contains:

```text
dist/server/index.js
dist/.openai/hosting.json
dist/live_ideas/wrangler.json
```

CI additionally scans the current tree and full Git history for patterns that look like populated Miro credentials or self-host passwords.

## 9. iPhone setup

After deployment:

1. Open the URL in Safari.
2. Confirm Capture → Send → Miro works.
3. Use Safari Share → **Add to Home Screen**.
4. Launch from the new Home Screen icon.
5. Run the checks in [DEVICE_ACCEPTANCE.md](./DEVICE_ACCEPTANCE.md).

For everyday operation, see the [Usage Guide](./USAGE.md), [中文教程](./USAGE.zh-CN.md), or [日本語ガイド](./USAGE.ja.md).

## 10. If a secret is ever exposed

Do not merely delete it from the current file.

1. Revoke / rotate the exposed credential immediately.
2. Assume every commit containing it is compromised.
3. Rewrite Git history before making the repository public.
4. Re-run the full-history credential scan.

See [SECURITY.md](./SECURITY.md) for the security model.
