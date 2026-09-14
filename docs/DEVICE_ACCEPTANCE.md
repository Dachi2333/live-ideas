# Live Lyrics V0 — Real iPhone Acceptance

V0 is not complete until these checks are run against the deployed owner-only ChatGPT Site and the real target Miro Board.

Record PASS / FAIL for each item.

## A. Launch and capture

- [ ] Open the production Site in iPhone Safari.
- [ ] Add it to the Home Screen and launch from the Home Screen icon.
- [ ] Opening lands directly on Capture, not a marketing/setup page.
- [ ] The text area becomes usable quickly enough for real capture.
- [ ] Daily Capture controls are only `Fragments`, input, and `↗` plus minimal status feedback.
- [ ] Swiping on the Capture page does not move/bounce the whole page.
- [ ] Opening and closing the iOS keyboard keeps the Capture shell fixed to the visible viewport and keeps `↗` usable.

## B. Text integrity

Send separate fragments containing:

- [ ] Chinese.
- [ ] Japanese.
- [ ] English.
- [ ] emoji.
- [ ] multiple lines.
- [ ] leading/trailing spaces.
- [ ] `<`, `>`, `&` characters.
- [ ] a long fragment.

For every successful send:

- [ ] the Miro Sticky visually preserves the intended text/line breaks;
- [ ] the fragment appears in local Fragments history;
- [ ] Capture clears only after success.

## C. Local safety

Before sending a fragment:

- [ ] type text, refresh Safari, and confirm the exact draft survives;
- [ ] type text, background the Web App, return, and confirm the draft survives;
- [ ] close/reopen the Home Screen Web App and confirm the last unsent draft survives when iOS has not purged site storage.

## D. Failure and retry

- [ ] Turn off connectivity and tap `↗`: the exact text remains.
- [ ] Restore connectivity and tap `↗`: the fragment sends successfully.
- [ ] Trigger/observe an API authorization failure: text remains.
- [ ] Trigger/observe a Miro failure: text remains.
- [ ] Trigger/observe Miro 429 handling if practical: text remains and retry remains possible.
- [ ] Tap `↗` repeatedly while one request is in flight: only one Sticky is created.

## E. Fragments

- [ ] Open `Fragments` without opening Miro.
- [ ] Only successfully sent fragments are shown.
- [ ] Newest successfully sent fragment is first.
- [ ] Text and time render correctly.
- [ ] No edit, delete, tag, search, folder, Song, or organization controls appear.

## F. Miro destination

- [ ] Every successful capture creates exactly one Sticky on the fixed target Board.
- [ ] Successive Stickies use the deterministic non-overlapping grid.
- [ ] Send from desktop and then from iPhone: the second device reads current Board positions and uses the next open grid slot instead of overlapping the first device’s Sticky.
- [ ] No destination picker appears during normal Capture.

## G. Secret boundary

Using Safari Web Inspector or equivalent inspection when available:

- [ ] `MIRO_ACCESS_TOKEN` is not present in page source or browser JavaScript bundles.
- [ ] the private Board ID is not embedded in browser source/configuration.
- [ ] browser requests go only to same-origin `/api/fragments`; the browser does not call Miro with a Bearer token.
- [ ] the deployed Site remains owner-only during V0 dogfood.

## Final acceptance

V0 is accepted only if all critical Capture, reliability, Miro, and secret-boundary checks pass.

Expected real-world flow:

```text
open Live Lyrics
↓
write
↓
↗
↓
lock phone
```

Later:

```text
open Miro
↓
fragment is already on the wall
```
