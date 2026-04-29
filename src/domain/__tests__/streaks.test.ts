import { describe, it, expect } from 'vitest'
import { getStreakMilestone, STREAK_MILESTONES } from '../streaks'
import { toDayKey, daysAgo } from '../../lib/date-utils'

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
