# Live Lyrics V0 Device Acceptance

Run this checklist on the real iPhone and real target Miro Board before calling V0 complete.

- [ ] Open capture: editor ready and keyboard/input available quickly.
- [ ] Chinese fragment: exact visible text appears on Miro.
- [ ] Japanese fragment: exact visible text appears on Miro.
- [ ] English fragment: exact visible text appears on Miro.
- [ ] Emoji: preserved.
- [ ] Multiline text: line breaks remain visually correct.
- [ ] Leading/trailing characters: not trimmed or rewritten.
- [ ] Normal success: one Sticky created, local status `sent`, fresh blank editor opens.
- [ ] No network: original draft remains, local status `failed`, no blank editor.
- [ ] Miro auth failure: original draft remains, local status `failed`.
- [ ] Miro 429/rate limit: original draft remains, local status `failed`.
- [ ] Retry after failure: same fragment becomes `sent` and only one local record exists.
- [ ] Repeated action on already-sent Draft UUID: no second Sticky request.
- [ ] Long text: no silent truncation by our code; observe Miro behavior.
- [ ] Fragments view: sent records appear newest first.
- [ ] Fragments view: no editing/organizing controls.
- [ ] Positioning: multiple successful sends do not completely overlap.
- [ ] Final dogfood: `open → type → ↗ → leave` feels acceptable.

## Acceptance rule

Cloud/unit tests verify logic, but they do not replace this checklist. V0 is accepted only after the real iPhone + real Miro path has been exercised.
