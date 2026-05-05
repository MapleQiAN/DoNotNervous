import { describe, it, expect } from 'vitest'
import { MOOD_SCORE, getWeekRange } from '../../domain/summary'
import type { MoodEmoji } from '../../domain/types'

describe('MOOD_SCORE', () => {
  it('maps each MoodEmoji to the correct numeric score per D-09', () => {
    expect(MOOD_SCORE['😊']).toBe(5)
    expect(MOOD_SCORE['🥳']).toBe(5)
    expect(MOOD_SCORE['😌']).toBe(4)
    expect(MOOD_SCORE['💪']).toBe(4)
    expect(MOOD_SCORE['😐']).toBe(3)
    expect(MOOD_SCORE['😔']).toBe(2)
    expect(MOOD_SCORE['😰']).toBe(1)
    expect(MOOD_SCORE['😡']).toBe(1)
  })

  it('has an entry for every MoodEmoji', () => {
    const emojis: MoodEmoji[] = ['😊', '😌', '😐', '😔', '😰', '😡', '🥳', '💪']
    for (const emoji of emojis) {
      expect(MOOD_SCORE[emoji]).toBeDefined()
      expect(typeof MOOD_SCORE[emoji]).toBe('number')
    }
  })
})

describe('getWeekRange', () => {
  it('returns correct {startDayKey, endDayKey} for a Wednesday', () => {
    // 2026-05-06 is a Wednesday
    const result = getWeekRange(new Date('2026-05-06T12:00:00'))
    expect(result.startDayKey).toBe('2026-05-04') // Monday
    expect(result.endDayKey).toBe('2026-05-10')   // Sunday
  })

  it('returns correct range when date is a Monday', () => {
    // 2026-05-04 is a Monday
    const result = getWeekRange(new Date('2026-05-04T12:00:00'))
    expect(result.startDayKey).toBe('2026-05-04') // Monday
    expect(result.endDayKey).toBe('2026-05-10')   // Sunday
  })

  it('returns correct range when date is a Sunday', () => {
    // 2026-05-10 is a Sunday
    const result = getWeekRange(new Date('2026-05-10T12:00:00'))
    expect(result.startDayKey).toBe('2026-05-04') // Monday
    expect(result.endDayKey).toBe('2026-05-10')   // Sunday
  })

  it('handles dates at start of month boundary', () => {
    // 2026-05-01 is a Friday
    const result = getWeekRange(new Date('2026-05-01T12:00:00'))
    expect(result.startDayKey).toBe('2026-04-27') // Monday (prev month)
    expect(result.endDayKey).toBe('2026-05-03')   // Sunday
  })

  it('handles dates at end of month boundary', () => {
    // 2026-05-31 is a Sunday
    const result = getWeekRange(new Date('2026-05-31T12:00:00'))
    expect(result.startDayKey).toBe('2026-05-25') // Monday
    expect(result.endDayKey).toBe('2026-05-31')   // Sunday
  })
})
