import { startOfWeek, endOfWeek } from 'date-fns'
import type { MoodEmoji } from './types'
import { toDayKey } from '../lib/date-utils'

// D-09: Mood emoji to numeric score mapping
export const MOOD_SCORE: Record<MoodEmoji, number> = {
  '😊': 5,
  '🥳': 5,
  '😌': 4,
  '💪': 4,
  '😐': 3,
  '😔': 2,
  '😰': 1,
  '😡': 1,
}

// Get Monday-to-Sunday week range for a given date
export function getWeekRange(date: Date): { startDayKey: string; endDayKey: string } {
  const monday = startOfWeek(date, { weekStartsOn: 1 })
  const sunday = endOfWeek(date, { weekStartsOn: 1 })
  return {
    startDayKey: toDayKey(monday),
    endDayKey: toDayKey(sunday),
  }
}
