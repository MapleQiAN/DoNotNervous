import { differenceInCalendarDays, differenceInHours } from 'date-fns'
import { db } from '../db'
import { toDayKey } from '../lib/date-utils'

export const STREAK_MILESTONES = [
  { days: 7, label: '1 week streak!' },
  { days: 14, label: '2 week streak!' },
  { days: 30, label: '1 month streak!' },
] as const

export function getStreakMilestone(
  streakLength: number,
): { milestone: number; label: string } | null {
  for (const m of STREAK_MILESTONES) {
    if (streakLength === m.days) {
      return { milestone: m.days, label: m.label }
    }
  }
  return null
}

export const EARN_BACK_WINDOW_HOURS = 24

export interface EarnBackOpportunity {
  previousStreakLength: number
  gapDay: string               // YYYY-MM-DD of the first missed day
  deadline: Date               // when the 24h window expires
}

export async function detectEarnBackOpportunity(
  now: Date = new Date(),
): Promise<EarnBackOpportunity | null> {
  const todayKey = toDayKey(now)

  // If today already has a record with tasks, streak is active
  const todayRecord = await db.streakRecords.get(todayKey)
  if (todayRecord && todayRecord.completedTaskIds.length > 0) return null

  const allRecords = await db.streakRecords.orderBy('date').reverse().toArray()
  if (allRecords.length === 0) return null

  const lastRecord = allRecords[0]
  const gap = differenceInCalendarDays(now, new Date(lastRecord.date + 'T12:00:00'))

  // No gap or yesterday was active
  if (gap <= 1) return null

  // Count frozen and recovered days among gap
  const frozenDays = allRecords.filter(
    r => r.freezeUsed || r.recoveredFrom
      && r.date > lastRecord.date
      && r.date < todayKey
  ).length

  // Unfrozen gap days (exclude today)
  const unfrozenGap = gap - 1 - frozenDays
  if (unfrozenGap < 1) return null

  // Find the first unfrozen gap day
  const gapDayDate = new Date(new Date(lastRecord.date + 'T12:00:00').getTime() + 86400000)
  const gapDay = toDayKey(gapDayDate)

  // Check if 24h window expired
  const hoursSinceBreak = differenceInHours(now, new Date(gapDay + 'T12:00:00'))
  if (hoursSinceBreak > EARN_BACK_WINDOW_HOURS) return null

  // Walk backward to count previous streak length
  let previousStreakLength = 0
  const recordMap = new Map(allRecords.map(r => [r.date, r]))
  let offset = 0
  while (true) {
    const dayKey = toDayKey(new Date(new Date(lastRecord.date + 'T12:00:00').getTime() - offset * 86400000))
    if (recordMap.has(dayKey)) {
      previousStreakLength++
      offset++
    } else {
      break
    }
  }

  const deadline = new Date(new Date(gapDay + 'T12:00:00').getTime() + EARN_BACK_WINDOW_HOURS * 3600000)

  return { previousStreakLength, gapDay, deadline }
}

export async function applyEarnBackRecovery(
  recoveryTaskId: string,
  gapDayKey: string,
): Promise<void> {
  await db.transaction('rw', db.streakRecords, async () => {
    const existing = await db.streakRecords.get(gapDayKey)

    // Idempotent guard: already recovered
    if (existing?.recoveredFrom === true) return

    const record = {
      date: gapDayKey,
      completedTaskIds: existing
        ? [...existing.completedTaskIds, recoveryTaskId]
        : [recoveryTaskId],
      freezeUsed: existing?.freezeUsed ?? false,
      freezeCountRemaining: existing?.freezeCountRemaining ?? 0,
      createdAt: existing?.createdAt ?? new Date(),
      recoveredFrom: true as const,
      recoveryTaskId: recoveryTaskId,
    }

    await db.streakRecords.put(record)
  })
}
