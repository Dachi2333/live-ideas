# Live Ideas — Usage Guide

[English](./USAGE.md) · [简体中文](./USAGE.zh-CN.md) · [日本語](./USAGE.ja.md)

Live Ideas is designed for one moment: **you notice or think of something and want it safely on your Miro wall before the thought disappears.**

It is intentionally small. You do not need to name, tag, classify, or organize anything while capturing it.

## 1. The two screens

Live Ideas has two everyday screens:

- **Capture** — write and send a new idea.
- **Fragments** — check what this device successfully sent before.

Tap the tabs at the bottom, or swipe horizontally between the two screens.

The horizontal transition follows your finger. If you release before crossing the completion threshold, the page returns to where it started.

## 2. Capture an idea

1. Open **Capture**.
2. Tap the large input area if the keyboard is not already open.
3. Type into the field labeled:

   ```text
   Type your idea...
   ```

4. Tap the round Send button in the lower-right corner.

While the request is running, Live Ideas shows:

```text
Sending...
```

The text is kept until the send operation is confirmed. Repeated taps while a send is already in progress do not create additional requests.

## 3. What happens after Send

A successful send follows this sequence:

```text
Capture text
→ local safety copy
→ same-origin /api/fragments
→ server-side Miro API request
→ Miro Sticky created
→ local Sent state persisted
→ Capture cleared
```

On success you briefly see:

```text
Your idea was sent to Miro
```

Then the Capture field becomes empty and is ready for the next idea.

## 4. If sending fails

If the network is unavailable, the Miro request fails, or authorization/configuration is unavailable, **Live Ideas keeps your original text**.

The standard retry state shows:

```text
Failed to send. Tap to retry.
```

Tap the Retry icon to send the same preserved text again.

Some configuration errors use more specific messages, such as:

- `This Site isn’t authorized for sending.`
- `Miro setup is not configured yet.`
- `Couldn’t save locally. Keep this page open.`

If you see a local-save warning, keep the page open until you have copied the text somewhere safe or resolved the browser-storage problem.

## 5. Fragments

Open **Fragments** to see text that was successfully sent from this browser.

Fragments are:

- newest first;
- stored locally in the browser;
- a send-history view, not a second editing system.

Each item shows its text and sent time.

### Long text

A long Fragment is visually limited to **six lines** so one entry does not take over the whole list. The full text remains in local storage; the six-line rule is only a display clamp.

## 6. Delete a Fragment from local history

To remove a Fragment from this device:

1. Open **Fragments**.
2. Swipe one Fragment to the left.
3. The red delete area appears on the right.
4. Tap the trash icon.

Only one delete action can remain open at a time. Opening another Fragment closes the previous one.

**Important:** this deletes only the browser-local Fragments history record. It does **not** delete, edit, or move the Sticky that was already created in Miro.

## 7. Capture ↔ Fragments swipe

You can change pages in two ways:

- tap **Capture** or **Fragments** at the bottom;
- drag horizontally across the page.

During a horizontal drag, the pages and the orange active indicator move with your finger. Vertical scrolling inside long text / the Fragments list remains separate from horizontal navigation.

## 8. Add Live Ideas to the iPhone Home Screen

For the most app-like workflow on iPhone:

1. Open the deployed Live Ideas URL in **Safari**.
2. Tap Safari's **Share** button.
3. Choose **Add to Home Screen**.
4. Confirm the name and tap **Add**.
5. Launch Live Ideas from the new Home Screen icon.

The app uses standalone web-app metadata, so launching from the Home Screen removes most normal browser chrome.

## 9. Where your data lives

### Draft

The current unsent Capture text is stored in browser `localStorage` so it can survive common page refresh / background-and-return cases.

### Fragments history

Successfully sent Fragments are also stored in browser `localStorage`.

V1 does **not** sync this history between devices or browsers. For example, Safari on your iPhone and Chrome on your computer can have different Fragments histories even when both send to the same Miro Board.

### Miro

When you send successfully, the text is posted to the app's same-origin server endpoint. The server uses the configured Miro credentials to create a Sticky on the target Board.

The Miro access token is not stored in browser JavaScript.

## 10. Migrating from the old Live Lyrics build

Older private builds used local-storage keys beginning with `live-lyrics:`.

The Live Ideas release migrates valid legacy Capture and Fragments data to the new `live-ideas:` keys the first time it sees them. New-format data takes priority if both generations exist.

The migration writes the new value before removing the old key, so a failed write does not intentionally discard the legacy copy.

## 11. Troubleshooting

### I tap Send and nothing reaches Miro

Check these in order:

1. Wait for the current `Sending...` state to finish.
2. If a Retry icon appears, retry once after confirming your network connection.
3. Confirm the deployment has a valid `MIRO_ACCESS_TOKEN` and `MIRO_BOARD_ID`.
4. Confirm the token still has `boards:read` and `boards:write`.
5. Confirm the configured Board still exists and the token can access it.

### `This Site isn’t authorized for sending.`

In ChatGPT Sites mode, the signed-in Sites user must match the configured `OWNER_EMAIL`.

In Cloudflare self-host mode, open the app with the configured HTTP Basic credentials instead; the username is `liveideas` and the password is the server-side `SELF_HOST_PASSWORD`.

### `Miro setup is not configured yet.`

The server is missing one or more required runtime values. See [SETUP.md](./SETUP.md).

### The page asks for a username/password

That is expected in Cloudflare self-host mode. Use:

```text
username: liveideas
password: your SELF_HOST_PASSWORD
```

Do not reuse your Miro password or Miro token as the Basic-auth password.

### My Fragments history is missing on another device

That is expected in V1. Fragments is intentionally device/browser-local. Miro is the shared downstream wall; the local Fragments list is only a convenience history for the current browser.

### I deleted a Fragment but it is still in Miro

That is expected. Local delete deliberately does not remove the Miro Sticky.

### My draft disappeared after clearing browser data / using private browsing

`localStorage` belongs to the browser profile. Clearing website data, some private-browsing lifecycles, or browser storage restrictions can remove it. Live Ideas is failure-resistant, not a cloud backup service.

## 12. Good use cases

Live Ideas works best when you want to capture first and interpret later, for example:

- personal ideas and writing fragments;
- exhibition / trade-show observations;
- workshop notes;
- store visits and competitor research;
- CMF / product-design observations;
- field research.

For now, V1 is text-only. Photo + Comment capture is a future direction rather than part of the current release.
