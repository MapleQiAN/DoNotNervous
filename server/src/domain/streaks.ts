import { eq, desc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { streakRecords } from '../db/schema.js'

export async function computeCurrentStreak(userId: string, now: Date = new Date()): Promise<number> {
  const allRecords = await db.select()
    .from(streakRecords)
    .where(eq(streakRecords.userId, userId))
    .orderBy(desc(streakRecords.date))

  if (allRecords.length === 0) return 0

  const recordMap = new Map(allRecords.map(r => [r.date, r]))

  let streak = 0
  let dayOffset = 0

  while (true) {
    const dayKey = formatDateKey(new Date(now.getTime() - dayOffset * 86400000))
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

function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
