import { eq, and, gte, lte } from 'drizzle-orm'
import { db } from '../db/index.js'
import { tasks, pointLedger, moodEntries, redemptions, streakRecords, dailySummaries, weeklySummaries } from '../db/schema.js'

const MOOD_SCORE: Record<string, number> = {
  '😊': 5, '🥳': 5, '😌': 4, '💪': 4, '😐': 3, '😔': 2, '😰': 1, '😡': 1,
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86400000)
}

function getWeekMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function findDominantMood(emojis: string[]): { emoji: string | null; score: number } {
  if (emojis.length === 0) return { emoji: null, score: 0 }
  const counts = new Map<string, number>()
  for (const e of emojis) counts.set(e, (counts.get(e) ?? 0) + 1)
  let dominant = emojis[0]
  let max = 0
  for (const [e, c] of counts) { if (c > max) { max = c; dominant = e } }
  return { emoji: dominant, score: MOOD_SCORE[dominant] ?? 3 }
}

export async function computeAndStoreDailySummary(userId: string, dayKey: string) {
  const start = new Date(`${dayKey}T00:00:00.000`)
  const end = new Date(`${dayKey}T23:59:59.999`)

  const completedTasks = await db.select().from(tasks).where(and(
    eq(tasks.userId, userId), eq(tasks.status, 'completed'),
    gte(tasks.completedAt, start), lte(tasks.completedAt, end),
  ))

  const createdTasksResult = await db.select().from(tasks).where(and(
    eq(tasks.userId, userId),
    gte(tasks.createdAt, start), lte(tasks.createdAt, end),
  ))

  const ledger = await db.select().from(pointLedger).where(and(
    eq(pointLedger.userId, userId),
    gte(pointLedger.createdAt, start), lte(pointLedger.createdAt, end),
  ))

  const pointsEarned = ledger.filter(e => e.amount > 0).reduce((s, e) => s + e.amount, 0)
  const pointsSpentFromLedger = ledger.filter(e => e.amount < 0).reduce((s, e) => s + Math.abs(e.amount), 0)

  const moods = await db.select().from(moodEntries).where(and(
    eq(moodEntries.userId, userId),
    gte(moodEntries.createdAt, start), lte(moodEntries.createdAt, end),
  ))

  const redemptionList = await db.select().from(redemptions).where(and(
    eq(redemptions.userId, userId),
    gte(redemptions.createdAt, start), lte(redemptions.createdAt, end),
  ))

  const { emoji: dominantMood, score: dominantMoodScore } = findDominantMood(moods.map(m => m.emoji))
  const pointsSpent = pointsSpentFromLedger + redemptionList.reduce((s, r) => s + r.pointsSpent, 0)

  const values = {
    userId,
    date: dayKey,
    tasksCompleted: completedTasks.length,
    tasksCreated: createdTasksResult.length,
    pointsEarned,
    pointsSpent,
    dominantMood: dominantMood ?? null,
    dominantMoodScore,
    taskIds: completedTasks.map(t => t.id),
    moodEntryIds: moods.map(m => m.id),
    ledgerEntryIds: ledger.map(l => l.id),
    redemptionIds: redemptionList.map(r => r.id),
    computedAt: new Date(),
    updatedAt: new Date(),
  }

  const [summary] = await db.insert(dailySummaries).values(values)
    .onConflictDoUpdate({ target: [dailySummaries.userId, dailySummaries.date], set: { ...values, updatedAt: new Date() } })
    .returning()

  return summary
}

export async function computeAndStoreWeeklySummary(userId: string, weekStartKey: string) {
  const startDate = new Date(`${weekStartKey}T12:00:00`)
  const monday = getWeekMonday(startDate)
  const sunday = addDays(monday, 6)
  const startDayKey = formatDateKey(monday)
  const endDayKey = formatDateKey(sunday)

  const dailyBreakdown: Array<{ date: string; tasksCompleted: number; pointsEarned: number; moodScore: number; compositeScore: number }> = []
  let totalTasksCompleted = 0, totalTasksCreated = 0, totalPointsEarned = 0, totalPointsSpent = 0
  const dailyMoodScores: number[] = []

  for (let i = 0; i < 7; i++) {
    const dayKey = formatDateKey(addDays(monday, i))
    const daily = await computeAndStoreDailySummary(userId, dayKey)
    totalTasksCompleted += daily.tasksCompleted
    totalTasksCreated += daily.tasksCreated
    totalPointsEarned += daily.pointsEarned
    totalPointsSpent += daily.pointsSpent
    if (daily.dominantMoodScore > 0) dailyMoodScores.push(daily.dominantMoodScore)
    const compositeScore = daily.tasksCompleted * 0.4 + (daily.dominantMoodScore / 5) * 0.3 + Math.min(daily.pointsEarned / 50, 1) * 0.3
    dailyBreakdown.push({ date: dayKey, tasksCompleted: daily.tasksCompleted, pointsEarned: daily.pointsEarned, moodScore: daily.dominantMoodScore, compositeScore })
  }

  const streakRecordsResult = await db.select().from(streakRecords).where(and(
    eq(streakRecords.userId, userId),
    gte(streakRecords.date, startDayKey), lte(streakRecords.date, endDayKey),
  ))

  const completionRate = totalTasksCreated > 0 ? Math.round((totalTasksCompleted / totalTasksCreated) * 100) : 0
  const avgMoodScore = dailyMoodScores.length > 0 ? Math.round(dailyMoodScores.reduce((a, b) => a + b, 0) / dailyMoodScores.length) : 0

  let bestDayDate: string | null = null, bestDayScore = 0, bestDayTaskCount = 0
  for (const day of dailyBreakdown) {
    if (day.compositeScore > bestDayScore || (day.compositeScore === bestDayScore && day.tasksCompleted > bestDayTaskCount)) {
      bestDayDate = day.date; bestDayScore = day.compositeScore; bestDayTaskCount = day.tasksCompleted
    }
  }
  if (bestDayScore === 0) bestDayDate = null

  const values = {
    userId, weekStart: startDayKey, weekEnd: endDayKey,
    totalTasksCompleted, totalTasksCreated, totalPointsEarned, totalPointsSpent,
    avgMoodScore, streakDays: streakRecordsResult.length,
    completionRate, bestDayDate, bestDayScore, bestDayTaskCount,
    userBestDayOverride: null as string | null,
    dailyBreakdown, computedAt: new Date(), updatedAt: new Date(),
  }

  const [summary] = await db.insert(weeklySummaries).values(values)
    .onConflictDoUpdate({ target: [weeklySummaries.userId, weeklySummaries.weekStart], set: { ...values, updatedAt: new Date() } })
    .returning()

  return summary
}
