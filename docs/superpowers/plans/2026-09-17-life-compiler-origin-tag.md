# Life Compiler Origin Tag Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mark every Live Ideas-created Miro Sticky with the reserved `live-ideas-origin` tag, persist returned `miroItemId` in the local Fragment receipt, and recover partial tag failures without creating duplicate Stickies.

**Architecture:** Extend the existing Miro client with tag resolution/creation, tag attachment, and repair-by-item-id. Extend the fragment/capture-service contract so a remote failure may still preserve `miroItemId`; retries with an existing `miroItemId` call repair-only logic instead of creating a new Sticky. No database or reverse sync is added.

**Tech Stack:** Node.js >=22.13, ESM, built-in `node:test`, existing Worker + domain architecture.

**Spec:** Cross-repository design in `Dachi2333/Life-Compiler/docs/superpowers/specs/2026-09-17-live-ideas-origin-sync-design.md`

## Status

Executed on branch `feat/life-compiler-origin-tag`; PR #6 is fully green as of 2026-09-17. Full CI includes tests, build, artifact verification, and secret scans. Cross-repository fixture: `tests/fixtures/life-compiler-origin-contract.json`.

## Global Constraints

- Reserved tag title is exactly `live-ideas-origin`.
- Browser must never receive Miro token or board secret.
- Exactly one matching origin tag is valid; duplicate same-title tags fail as `ambiguous_origin_tag`.
- Sticky creation and tag attachment are separate Miro REST operations.
- If Sticky creation succeeds and tag attachment fails, retain `itemId`; retry must repair the same Sticky and must not create another.
- Capture clears only after Sticky exists and origin tag attachment succeeds.
- Local Fragments remain device-local and one-way; no reverse Miro sync.
- No cloud DB/KV/D1 is introduced.

---

### Completed deliverables

- [x] Fragment state includes `miroItemId` provenance.
- [x] Miro client resolves/creates unique `live-ideas-origin` tag.
- [x] Duplicate same-title origin tags fail explicitly.
- [x] Miro client attaches tag to an existing item.
- [x] Repair target verification uses Sticky endpoint.
- [x] Worker create path is ensure tag → create Sticky → attach tag.
- [x] Worker repair path is ensure tag → verify target → attach only; no new Sticky.
- [x] Partial tag failure returns recoverable `itemId`.
- [x] Browser remote propagates optional repair ID and preserves failure item ID.
- [x] Capture service persists partial provenance and retries with the same item ID.
- [x] Synthetic cross-repository fixture added and consumed by a receipt test.
- [x] Full `npm test`, build, artifact checks, and secret scans pass in PR CI.
- [x] Diff audit confirms only origin-tag/provenance/recovery files changed.
