import { describe, it, expect, beforeEach } from 'vitest'
import { getStreakMilestone, STREAK_MILESTONES, detectEarnBackOpportunity, applyEarnBackRecovery } from '../streaks'
import { toDayKey, daysAgo } from '../../lib/date-utils'
import { db } from '../../db'

describe('getStreakMilestone', () => {
  it('returns null for day 6 (not a milestone)', () => {
    expect(getStreakMilestone(6)).toBeNull()
  })

  it('returns milestone for day 7 (1 week)', () => {
    expect(getStreakMilestone(7)).toEqual({
      milestone: 7,
      label: '1 week streak!',
    })
  })

  it('returns null for day 13 (not a milestone)', () => {
    expect(getStreakMilestone(13)).toBeNull()
  })

  it('returns milestone for day 14 (2 weeks)', () => {
    expect(getStreakMilestone(14)).toEqual({
      milestone: 14,
      label: '2 week streak!',
    })
  })

  it('returns null for day 29 (not a milestone)', () => {
    expect(getStreakMilestone(29)).toBeNull()
  })

  it('returns milestone for day 30 (1 month)', () => {
    expect(getStreakMilestone(30)).toEqual({
      milestone: 30,
      label: '1 month streak!',
    })
  })

  it('returns null for day 31 (milestone fires on exact day only)', () => {
    expect(getStreakMilestone(31)).toBeNull()
  })
})

describe('STREAK_MILESTONES', () => {
  it('has 3 milestones defined', () => {
    expect(STREAK_MILESTONES).toHaveLength(3)
  })

  it('contains milestone for day 7', () => {
    expect(STREAK_MILESTONES.find((m) => m.days === 7)).toBeDefined()
  })

  it('contains milestone for day 14', () => {
    expect(STREAK_MILESTONES.find((m) => m.days === 14)).toBeDefined()
  })

  it('contains milestone for day 30', () => {
    expect(STREAK_MILESTONES.find((m) => m.days === 30)).toBeDefined()
  })
})

describe('toDayKey', () => {
  it('normalizes time component to date-only string', () => {
    const morning = new Date('2026-04-29T08:00:00')
    const evening = new Date('2026-04-29T23:59:59')
    expect(toDayKey(morning)).toBe(toDayKey(evening))
  })

  it('returns YYYY-MM-DD format', () => {
    const date = new Date('2026-04-29T12:00:00')
    expect(toDayKey(date)).toBe('2026-04-29')
  })
})

describe('daysAgo', () => {
  it('returns today key for daysAgo(0)', () => {
    const todayKey = toDayKey(new Date())
    expect(daysAgo(0)).toBe(todayKey)
  })

  it('returns yesterday key for daysAgo(1)', () => {
    const yesterday = new Date(Date.now() - 86400000)
    const expected = toDayKey(yesterday)
    expect(daysAgo(1)).toBe(expected)
  })
})

describe('detectEarnBackOpportunity', () => {
  beforeEach(async () => {
    await db.streakRecords.clear()
  })

  it('returns null when streak is active (no gap)', async () => {
    const now = new Date('2026-01-10T14:00:00')
    // Today has a record with tasks
    await db.streakRecords.put({
      date: toDayKey(now),
      completedTaskIds: ['task-1'],
      freezeUsed: false,
      freezeCountRemaining: 2,
      createdAt: new Date(),
    })

    const result = await detectEarnBackOpportunity(now)
    expect(result).toBeNull()
  })

  it('returns null when freezes still available (gap days < 2)', async () => {
    const now = new Date('2026-01-10T14:00:00')
    // 2 days ago was last active, freezes should cover 1 gap day
    await db.streakRecords.put({
      date: '2026-01-08',
      completedTaskIds: ['task-1'],
      freezeUsed: false,
      freezeCountRemaining: 2,
      createdAt: new Date(),
    })
    // Yesterday has a freeze record
    await db.streakRecords.put({
      date: '2026-01-09',
      completedTaskIds: [],
      freezeUsed: true,
      freezeCountRemaining: 1,
      createdAt: new Date(),
    })

    const result = await detectEarnBackOpportunity(now)
    expect(result).toBeNull()
  })

  it('returns opportunity with correct data when gap exists within 24h window', async () => {
    const now = new Date('2026-01-10T06:00:00') // 18h after gap day noon, within 24h

    await db.streakRecords.put({
      date: '2026-01-08',
      completedTaskIds: ['task-1'],
      freezeUsed: false,
      freezeCountRemaining: 0,
      createdAt: new Date(),
    })

    const result = await detectEarnBackOpportunity(now)
    expect(result).not.toBeNull()
    expect(result!.gapDay).toBe('2026-01-09')
    expect(result!.previousStreakLength).toBeGreaterThanOrEqual(1)
  })

  it('returns null when 24h window has expired', async () => {
    const now = new Date('2026-01-10T14:00:00') // >24h after Jan 9 noon

    await db.streakRecords.put({
      date: '2026-01-08',
      completedTaskIds: ['task-1'],
      freezeUsed: false,
      freezeCountRemaining: 0,
      createdAt: new Date(),
    })

    const result = await detectEarnBackOpportunity(now)
    expect(result).toBeNull()
  })

  it('returns null when no streak records exist at all', async () => {
    const now = new Date('2026-01-10T14:00:00')
    const result = await detectEarnBackOpportunity(now)
    expect(result).toBeNull()
  })
})

describe('applyEarnBackRecovery', () => {
  beforeEach(async () => {
    await db.streakRecords.clear()
  })

  it('creates a streakRecord with recoveredFrom=true and correct recoveryTaskId', async () => {
    await applyEarnBackRecovery('task-recovery-1', '2026-01-09')

    const record = await db.streakRecords.get('2026-01-09')
    expect(record).toBeDefined()
    expect(record!.recoveredFrom).toBe(true)
    expect(record!.recoveryTaskId).toBe('task-recovery-1')
    expect(record!.completedTaskIds).toContain('task-recovery-1')
  })

  it('is idempotent -- calling twice does not create duplicate records', async () => {
    await applyEarnBackRecovery('task-recovery-1', '2026-01-09')
    await applyEarnBackRecovery('task-recovery-2', '2026-01-09')

    const record = await db.streakRecords.get('2026-01-09')
    expect(record).toBeDefined()
    expect(record!.recoveredFrom).toBe(true)
    // Second call should be blocked by idempotent guard
    expect(record!.recoveryTaskId).toBe('task-recovery-1')
    expect(record!.completedTaskIds).toEqual(['task-recovery-1'])
  })

  it('recovery record is counted by computeCurrentStreak as a valid day', async () => {
    const now = new Date('2026-01-10T14:00:00')

    // Build a streak: Jan 7, 8 active, Jan 9 recovered, Jan 10 (today) active
    await db.streakRecords.put({
      date: '2026-01-07',
      completedTaskIds: ['t1'],
      freezeUsed: false,
      freezeCountRemaining: 0,
      createdAt: new Date(),
    })
    await db.streakRecords.put({
      date: '2026-01-08',
      completedTaskIds: ['t2'],
      freezeUsed: false,
      freezeCountRemaining: 0,
      createdAt: new Date(),
    })
    await applyEarnBackRecovery('task-recovery', '2026-01-09')
    await db.streakRecords.put({
      date: '2026-01-10',
      completedTaskIds: ['t3'],
      freezeUsed: false,
      freezeCountRemaining: 0,
      createdAt: new Date(),
    })

    // Dynamic import to get computeCurrentStreak from useStreaks
    const { computeCurrentStreak } = await import('../../hooks/useStreaks')
    const streak = await computeCurrentStreak(now)
    // Should count all 4 days including the recovered one
    expect(streak).toBe(4)
  })
})
