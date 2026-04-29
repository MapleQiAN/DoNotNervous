---
phase: 2
slug: gamification-core-points-streaks
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-29
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.5 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `vitest run` |
| **Full suite command** | `vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `vitest run`
- **After every plan wave:** Run `vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | POINT-01, POINT-04 | T-02-01 | Zod validates point records before DB write | unit | `vitest run src/domain/__tests__/points.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | POINT-05 | — | Multiplier returns correct tiers | unit | `vitest run src/domain/__tests__/points.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | STRK-01, STRK-02 | — | Period record CRUD, consecutive day tracking | integration | `vitest run src/db/__tests__/streak-records.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | POINT-01 | — | completeTask awards correct points by difficulty | integration | `vitest run src/hooks/__tests__/useStreaks.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | STRK-03 | — | Auto-apply freeze on missed day | integration | `vitest run src/hooks/__tests__/useStreaks.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 2 | STRK-05 | — | Milestone detection at 7, 14, 30 days | unit | `vitest run src/domain/__tests__/streaks.test.ts` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | POINT-02 | — | Header badge renders point balance | integration | `vitest run src/components/gamification/__tests__/PointBadge.test.tsx` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 2 | POINT-03 | — | Popover shows last 10 transactions | integration | `vitest run src/components/gamification/__tests__/TransactionPopover.test.tsx` | ❌ W0 | ⬜ pending |
| 02-03-03 | 03 | 2 | STRK-04 | — | All messaging positive framing | N/A | manual-only | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/domain/__tests__/points.test.ts` — stubs for POINT-01, POINT-05
- [ ] `src/domain/__tests__/streaks.test.ts` — stubs for STRK-05
- [ ] `src/db/__tests__/point-ledger.test.ts` — stubs for POINT-04
- [ ] `src/db/__tests__/streak-records.test.ts` — stubs for STRK-01, STRK-02
- [ ] `src/hooks/__tests__/useStreaks.test.ts` — stubs for STRK-03
- [ ] `src/components/gamification/__tests__/PointBadge.test.tsx` — stubs for POINT-02
- [ ] `src/components/gamification/__tests__/TransactionPopover.test.tsx` — stubs for POINT-03

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| All messaging uses positive framing | STRK-04 | Requires visual review of UI copy | 1. Trigger streak freeze. 2. Verify toast says "Your streak is safe!" not "You lost your streak". 3. Verify no punitive language anywhere. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
