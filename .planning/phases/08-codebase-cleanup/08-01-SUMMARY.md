---
phase: 08-codebase-cleanup
plan: 01
status: complete
started: 2026-05-05
completed: 2026-05-05
---

## Objective

Resolve three tech-debt items: mock canvas-confetti globally, document Lottie placeholders, keep streaks.ts for v2.

## What Changed

### Task 1: Global canvas-confetti mock (D-02)
- Added `vi.mock('canvas-confetti')` to `src/test-setup.ts`
- Mock returns `{ default: vi.fn() }` matching celebrate.ts default import
- All 187 tests pass with zero confetti-related errors

### Task 2: Lottie placeholder documentation (D-03)
- Created `src/components/mascot/ANIMATIONS.md` (28 lines)
- Documents all 4 animation states: idle, celebrate, encourage, sleepy
- Includes technical details, replacement checklist, D-01 streaks reference

## Key Files

- `src/test-setup.ts` — Added canvas-confetti mock (7 lines total)
- `src/components/mascot/ANIMATIONS.md` — New file, placeholder status + replacement guidance

## Verification

- [x] 187 tests pass, 0 fail
- [x] `vi.mock('canvas-confetti')` present in test-setup.ts
- [x] ANIMATIONS.md contains all 4 animation filenames + Placeholder + Bodymovin + STRK-06
- [x] `domain/streaks.ts` untouched (D-01 honored)

## Self-Check: PASSED

All must_haves verified:
- canvas-confetti mocked globally — no test throws from celebrate.ts imports
- domain/streaks.ts and its test remain untouched
- Lottie placeholder status documented with replacement guidance
