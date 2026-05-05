# Phase 8: Codebase Cleanup - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-05
**Phase:** 8-Codebase Cleanup
**Areas discussed:** Orphaned streaks module, Canvas-confetti test noise, Lottie placeholder docs

---

## Orphaned Streaks Module

| Option | Description | Selected |
|--------|-------------|----------|
| Delete | Remove domain/streaks.ts + test — zero production imports | |
| Keep for future use | Reserve for v2 streak features (STRK-06/07) | ✓ |

**User's choice:** "保留以备用" — keep for future use
**Notes:** v2 requirements STRK-06 (earn-back recovery) and STRK-07 (calendar view) may reuse this module

---

## Canvas-Confetti Test Noise

| Option | Description | Selected |
|--------|-------------|----------|
| Global mock in test-setup.ts | Single fix covers all tests | |
| Per-test local mock | More granular control | |
| You decide | Claude picks best approach | ✓ |

**User's choice:** "由你决定" — Claude discretion
**Notes:** Global mock in test-setup.ts is simpler and covers all files. No downside since canvas-confetti has no test-worthy behavior in unit tests.

---

## Lottie Placeholder Documentation

| Option | Description | Selected |
|--------|-------------|----------|
| Inline comment | Document in Mascot.tsx | |
| Separate file | Dedicated ANIMATIONS.md or similar | ✓ |

**User's choice:** "单独文件" — separate file
**Notes:** Claude picks exact filename and format

---

## Claude's Discretion

- Canvas-confetti mock implementation in test-setup.ts
- Lottie documentation file location and format

## Deferred Ideas

None — discussion stayed within phase scope.
