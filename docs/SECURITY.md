# Live Ideas — Security

Live Ideas sends private user text to a configured Miro Board, so the most important security boundary is keeping Miro credentials out of the browser and out of Git.

## 1. Threat model

The V1 security model is designed to prevent the most damaging simple failure modes:

- a Miro access token embedded in browser JavaScript;
- a token / Board credential committed to a public repository;
- an unauthenticated self-host deployment that anyone can use to write to the configured Board;
- a failed send silently discarding the user's original text.

It is not an enterprise identity platform. V1 uses small deployment-specific authorization gates appropriate to a personal / small-team self-hosted capture tool.

## 2. Secrets that must stay server-side

Never commit or expose:

```text
MIRO_ACCESS_TOKEN
MIRO_CLIENT_SECRET
MIRO_BOARD_ID
SELF_HOST_PASSWORD
```

`OWNER_EMAIL` is also deployment-specific and should be treated as private configuration even though it is not a bearer credential.

Do not place real values in:

- client JavaScript;
- `index.html`;
- `wrangler.jsonc` vars;
- `.openai/hosting.json`;
- README examples;
- screenshots / issue comments / PR descriptions;
- tracked `.env` or `.dev.vars` files.

The repository intentionally keeps `.env.example` value-free.

## 3. Miro token boundary

Browser requests go only to the same-origin endpoint:

```text
POST /api/fragments
```

The Worker reads `MIRO_ACCESS_TOKEN` from server-side runtime bindings and makes the Miro request itself.

The browser should never need to know the token.

Use the minimum Miro scopes required by V1:

```text
boards:read
boards:write
```

`boards:read` is needed for Board-aware placement; `boards:write` is needed to create the Sticky.

## 4. ChatGPT Sites authorization

In the private Sites mode, configure:

```text
MIRO_ACCESS_TOKEN
MIRO_BOARD_ID
OWNER_EMAIL
```

Do not configure `SELF_HOST_PASSWORD`.

The Worker compares `OWNER_EMAIL` with the authenticated-user email supplied by the Sites runtime before allowing `/api/fragments` to call Miro.

Keep the Site owner-only while using this mode for private dogfood.

## 5. Cloudflare self-host authorization

For public self-host code, configure:

```text
MIRO_ACCESS_TOKEN
MIRO_BOARD_ID
SELF_HOST_PASSWORD
```

When `SELF_HOST_PASSWORD` exists, the Worker challenges **all routes** with HTTP Basic Authentication before serving either the UI or API.

Credentials are:

```text
username: liveideas
password: SELF_HOST_PASSWORD
```

### Requirements

- Use HTTPS only. Basic authentication is only an encoding of credentials; transport encryption is what protects them on the network.
- Use a long, unique, randomly generated `SELF_HOST_PASSWORD`.
- Do not reuse your Miro password, email password, or Miro token.
- Do not put the Basic credentials into public URLs, QR codes, screenshots, or source code.
- If the deployment is shared with multiple people, anyone who knows this password can use the configured Board-writing capability. Rotate it when access should change.

This is intentionally a small V1 self-host gate, not a replacement for SSO / OAuth / enterprise access control.

## 6. Browser-local data

Live Ideas stores:

- the current unsent Draft;
- successfully sent Fragments history;

in browser `localStorage`.

Implications:

- anyone who can access the unlocked browser profile may be able to inspect this local text;
- clearing site data can remove local history / drafts;
- private browsing can have a shorter storage lifetime;
- V1 does not encrypt localStorage itself;
- V1 does not sync Fragments to a Live Ideas cloud database.

Use the tool accordingly for the sensitivity of your content.

## 7. Miro is the downstream data processor/workspace

A successful send intentionally transfers the Capture text to the configured Miro Board.

After that:

- Miro's access controls govern the Sticky on the Board;
- Live Ideas local deletion does **not** remove that Miro copy;
- deleting browser localStorage does **not** remove Miro content.

If a text should no longer exist in Miro, remove it in Miro itself.

## 8. Failure safety

Security includes avoiding accidental data loss.

Live Ideas does not clear the Capture until:

1. the Miro request succeeds; and
2. local `sent` persistence succeeds.

On an API or network failure, the original text remains available for Retry.

If browser-local persistence itself fails, the UI warns the user to keep the page open rather than pretending the text is safely stored.

## 9. No analytics by default

The V1 repository does not include analytics, advertising trackers, or a separate Live Ideas telemetry backend by default.

Your hosting provider and Miro may still produce their own infrastructure logs according to their services and your configuration.

## 10. Git release gate

Before the repository becomes public, CI performs two credential-pattern checks:

1. the current tracked tree;
2. full Git history.

A clean current file is **not enough** if a real secret existed in an older commit.

Automated scans are a guardrail, not proof that every possible credential format has been detected.

## 11. If a credential was committed

Treat it as exposed even if the repository was private at the time.

1. **Rotate / revoke the credential first.**
2. Identify every commit / branch / tag containing it.
3. Rewrite the affected Git history before public release.
4. Remove or rotate cached deployment credentials where applicable.
5. Force-update only after understanding the impact on collaborators / PRs.
6. Run the full-history scan again.
7. Verify the browser build does not contain the replacement secret.

Do not rely on a normal follow-up commit that simply deletes the visible line; the old value remains in Git history.

## 12. Reporting a vulnerability

Until a dedicated private security-reporting channel is configured, avoid posting active secrets or exploit details in a public issue.

If you discover a security problem in a private copy of this project, first revoke any exposed credentials and then contact the repository maintainer through an appropriate private channel.

A future public release can add GitHub Private Vulnerability Reporting / a formal `SECURITY.md` contact policy when the maintainer chooses the preferred contact route.
