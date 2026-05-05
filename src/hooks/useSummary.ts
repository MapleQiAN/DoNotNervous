import { useLiveQuery } from 'dexie-react-hooks'
import { computeDailySummary, computeWeeklySummary, getWeekRange } from '../domain/summary'
import type { DailySummary, WeeklySummary } from '../domain/types'
import { toDayKey, daysAgo } from '../lib/date-utils'
import { db } from '../db'

/**
 * Compute daily summary for a given day and write to db.dailySummaries (upsert).
 * Also triggers weekly summary refresh for the week containing this day (D-02 eager).
 */
export async function refreshDailySummary(dayKey: string): Promise<void> {
  const daily = await computeDailySummary(dayKey)
  await db.dailySummaries.put(daily)

  // Eager weekly refresh for the week containing this day
  const weekDate = new Date(`${dayKey}T12:00:00`)
  const { startDayKey } = getWeekRange(weekDate)
  await refreshWeeklySummary(startDayKey)
}

/**
 * Compute weekly summary for a given week start date and write to db.weeklySummaries (upsert).
 */
export async function refreshWeeklySummary(weekStartDate: string): Promise<void> {
  const weekly = await computeWeeklySummary(weekStartDate)
  await db.weeklySummaries.put(weekly)
}

/**
 * Convenience helper: refresh daily summary for today.
 */
export async function refreshDailySummaryForToday(): Promise<void> {
  await refreshDailySummary(toDayKey(new Date()))
}

/**
 * Reactive hook: read DailySummary for a given dayKey.
 * Returns null if no summary has been computed yet.
 */
export function useDailySummary(dayKey: string): DailySummary | null {
  return useLiveQuery(
    () => db.dailySummaries.get(dayKey),
    [dayKey],
    null,
  )
}

/**
 * Reactive hook: read WeeklySummary for a given week start date.
 * Returns null if no summary has been computed yet.
 */
export function useWeeklySummary(weekStart: string): WeeklySummary | null {
  return useLiveQuery(
    () => db.weeklySummaries.get(weekStart),
    [weekStart],
    null,
  )
}

/**
 * Reactive hook: returns array of {date, moodScore} for the last N days.
 * Used by the Recharts area chart (D-08, D-10).
 * Days with no summary or no mood entry get moodScore 0.
 * Array is sorted by date ascending.
 */
export function useMoodChartDays(days: number): Array<{ date: string; moodScore: number }> {
  return useLiveQuery(
    async () => {
      const results: Array<{ date: string; moodScore: number }> = []

      for (let i = days - 1; i >= 0; i--) {
        const dayKey = daysAgo(i)
        const summary = await db.dailySummaries.get(dayKey)
        results.push({
          date: dayKey,
          moodScore: summary?.dominantMoodScore ?? 0,
        })
      }

      return results
    },
    [days],
    [],
  )
}
