import { useLiveQuery } from 'dexie-react-hooks'
import { differenceInCalendarDays } from 'date-fns'
import { db } from '../db'
import { toDayKey } from '../lib/date-utils'
import { useMascotStore } from '../stores/mascotStore'
import { celebrateStreakMilestone } from '../lib/celebrate'

/**
 * Compute the current streak length by walking backward from today
 * through streakRecords. Counts consecutive days with records
 * (including frozen days). Stops at the first gap with no record.
 */
export async function computeCurrentStreak(now: Date = new Date()): Promise<number> {
  const allRecords = await db.streakRecords.toArray()
  const recordMap = new Map(allRecords.map((r) => [r.date, r]))

  let streak = 0
  let dayOffset = 0

  while (true) {
    const dayKey = toDayKey(new Date(now.getTime() - dayOffset * 86400000))
    const record = recordMap.get(dayKey)

    if (record) {
      streak++
      dayOffset++
    } else {
      break
    }
  }

  return streak
}

const STREAK_MILESTONES = [7, 14, 30]

/**
 * Check if the current streak hits a milestone (7, 14, or 30 days).
 * If so, trigger mascot encourage animation and streak milestone confetti.
 * Returns true if a milestone was hit.
 */
export async function checkStreakMilestone(now: Date = new Date()): Promise<boolean> {
  const streak = await computeCurrentStreak(now)
  if (STREAK_MILESTONES.includes(streak)) {
    useMascotStore.getState().setAnimation('encourage')
    celebrateStreakMilestone()
    return true
  }
  return false
}

/**
 * Reactive hook for current streak length.
 */
export function useCurrentStreak(): number {
  return useLiveQuery(
    async () => computeCurrentStreak(),
    [],
    0
  )
}

/**
 * Reactive hook for remaining freeze count.
 * Reads the most recent streakRecord's freezeCountRemaining.
 * Defaults to 2 if no records exist.
 */
export function useStreakFreezes(): number {
  return useLiveQuery(
    async () => {
      const allRecords = await db.streakRecords
        .orderBy('date')
        .reverse()
        .limit(1)
        .toArray()

      if (allRecords.length === 0) return 2
      return allRecords[0].freezeCountRemaining
    },
    [],
    2
  )
}

/**
 * Check for gap days between the last streak record and today.
 * Auto-apply streak freezes for up to 2 gap days.
 * Uses positive messaging only -- no punitive language.
 */
export async function checkAndApplyFreezes(
  showToast: (message: string) => void,
  now: Date = new Date(),
): Promise<void> {
  const todayKey = toDayKey(now)

  // Get the most recent streak record date
  const allRecords = await db.streakRecords.orderBy('date').reverse().toArray()
  if (allRecords.length === 0) return

  const lastRecord = allRecords[0]
  const lastDate = lastRecord.date

  // Calculate gap days between last record and today
  const gap = differenceInCalendarDays(now, new Date(lastDate + 'T12:00:00'))

  // No gap or today already has a record -- nothing to do
  if (gap <= 1) return

  // Determine how many freezes to apply (max 2)
  const freezesAvailable = 2
  const freezesToApply = Math.min(gap - 1, freezesAvailable)

  if (freezesToApply <= 0) return

  // Create freeze records for the gap days, starting from the day after the last record
  let freezesUsed = 0
  for (let i = 1; i <= gap - 1 && freezesUsed < freezesAvailable; i++) {
    const freezeDate = new Date(new Date(lastDate + 'T12:00:00').getTime() + i * 86400000)
    const freezeDayKey = toDayKey(freezeDate)

    // Skip if today (today is still in progress)
    if (freezeDayKey === todayKey) continue

    // Skip if a record already exists for this day
    const existing = await db.streakRecords.get(freezeDayKey)
    if (existing) continue

    freezesUsed++
    const remaining = freezesAvailable - freezesUsed

    await db.streakRecords.put({
      date: freezeDayKey,
      completedTaskIds: [],
      freezeUsed: true,
      freezeCountRemaining: remaining,
      createdAt: new Date(),
    })
  }

  if (freezesUsed > 0) {
    const remaining = freezesAvailable - freezesUsed
    showToast(`Your streak is safe! (${remaining} freeze${remaining !== 1 ? 's' : ''} remaining)`)
  }
}
