import { startOfWeek, endOfWeek, addDays, format, startOfDay } from 'date-fns'
import type { MoodEmoji, DailySummary, WeeklySummary } from './types'
import { toDayKey } from '../lib/date-utils'
import { generateId } from '../lib/id'
import { db } from '../db'
import { POINT_VALUES } from './points'

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

function getDayBounds(dayKey: string): { start: Date; end: Date } {
  const start = new Date(`${dayKey}T00:00:00.000`)
  const end = new Date(`${dayKey}T23:59:59.999`)
  return { start, end }
}

function findDominantMood(emojis: MoodEmoji[]): { emoji: MoodEmoji | null; score: number } {
  if (emojis.length === 0) {
    return { emoji: null, score: 0 }
  }

  const counts = new Map<MoodEmoji, number>()
  for (const emoji of emojis) {
    counts.set(emoji, (counts.get(emoji) ?? 0) + 1)
  }

  let dominant: MoodEmoji = emojis[0]
  let maxCount = 0
  for (const [emoji, count] of counts) {
    if (count > maxCount) {
      maxCount = count
      dominant = emoji
    }
  }

  return { emoji: dominant, score: MOOD_SCORE[dominant] }
}

export async function computeDailySummary(dayKey: string): Promise<DailySummary> {
  const { start, end } = getDayBounds(dayKey)

  // Completed tasks on this day
  const completedTasks = await db.tasks
    .where('completedAt')
    .between(start, end, true, true)
    .filter(task => task.status === 'completed')
    .toArray()

  // Tasks created on this day
  const createdTasks = await db.tasks
    .where('createdAt')
    .between(start, end, true, true)
    .toArray()

  // Point ledger entries on this day
  const ledgerEntries = await db.pointLedger
    .where('createdAt')
    .between(start, end, true, true)
    .toArray()

  const pointsEarned = ledgerEntries
    .filter(e => e.amount > 0)
    .reduce((sum, e) => sum + e.amount, 0)
  const pointsSpentFromLedger = ledgerEntries
    .filter(e => e.amount < 0)
    .reduce((sum, e) => sum + Math.abs(e.amount), 0)

  // Mood entries on this day
  const moodEntries = await db.moodEntries
    .where('createdAt')
    .between(start, end, true, true)
    .toArray()

  // Redemptions on this day
  const redemptions = await db.redemptions
    .where('createdAt')
    .between(start, end, true, true)
    .toArray()

  const { emoji: dominantMood, score: dominantMoodScore } = findDominantMood(
    moodEntries.map(m => m.emoji),
  )

  // Points spent includes both negative ledger entries and redemption amounts
  const pointsSpentFromRedemptions = redemptions.reduce((sum, r) => sum + r.pointsSpent, 0)
  const pointsSpent = pointsSpentFromLedger + pointsSpentFromRedemptions

  return {
    id: generateId(),
    date: dayKey,
    tasksCompleted: completedTasks.length,
    tasksCreated: createdTasks.length,
    pointsEarned,
    pointsSpent,
    dominantMood,
    dominantMoodScore,
    taskIds: completedTasks.map(t => t.id),
    moodEntryIds: moodEntries.map(m => m.id),
    ledgerEntryIds: ledgerEntries.map(l => l.id),
    redemptionIds: redemptions.map(r => r.id),
    computedAt: new Date(),
  }
}

// D-11: Composite score = tasksCompleted * 0.4 + (moodScore/5) * 0.3 + min(pointsEarned/50, 1) * 0.3
function calculateCompositeScore(
  tasksCompleted: number,
  moodScore: number,
  pointsEarned: number,
): number {
  const maxPointRef = POINT_VALUES.hard // 50
  return (
    tasksCompleted * 0.4 +
    (moodScore / 5) * 0.3 +
    Math.min(pointsEarned / maxPointRef, 1) * 0.3
  )
}

export async function computeWeeklySummary(weekStartDate: string): Promise<WeeklySummary> {
  const weekDate = new Date(`${weekStartDate}T12:00:00`)
  const { startDayKey, endDayKey } = getWeekRange(weekDate)

  const startDate = new Date(`${startDayKey}T00:00:00`)
  const endDate = new Date(`${endDayKey}T23:59:59.999`)

  // Compute daily summaries for each day in the week
  const dailyBreakdown: WeeklySummary['dailyBreakdown'] = []
  let totalTasksCompleted = 0
  let totalTasksCreated = 0
  let totalPointsEarned = 0
  let totalPointsSpent = 0
  const dailyMoodScores: number[] = []

  for (let i = 0; i < 7; i++) {
    const dayDate = addDays(startDate, i)
    const dayKey = format(startOfDay(dayDate), 'yyyy-MM-dd')

    const daily = await computeDailySummary(dayKey)

    totalTasksCompleted += daily.tasksCompleted
    totalTasksCreated += daily.tasksCreated
    totalPointsEarned += daily.pointsEarned
    totalPointsSpent += daily.pointsSpent

    if (daily.dominantMoodScore > 0) {
      dailyMoodScores.push(daily.dominantMoodScore)
    }

    const compositeScore = calculateCompositeScore(
      daily.tasksCompleted,
      daily.dominantMoodScore,
      daily.pointsEarned,
    )

    dailyBreakdown.push({
      date: dayKey,
      tasksCompleted: daily.tasksCompleted,
      pointsEarned: daily.pointsEarned,
      moodScore: daily.dominantMoodScore,
      compositeScore,
    })
  }

  // Streak records in this week range
  const streakRecords = await db.streakRecords
    .where('date')
    .between(startDayKey, endDayKey, true, true)
    .toArray()

  // D-13: Completion rate
  const completionRate = totalTasksCreated > 0
    ? totalTasksCompleted / totalTasksCreated
    : 0

  // Average mood score (excluding days with no mood)
  const avgMoodScore = dailyMoodScores.length > 0
    ? dailyMoodScores.reduce((a, b) => a + b, 0) / dailyMoodScores.length
    : 0

  // D-11: Find best day by composite score, ties broken by task count
  let bestDayDate: string | null = null
  let bestDayScore = 0
  let bestDayTaskCount = 0

  for (const day of dailyBreakdown) {
    if (
      day.compositeScore > bestDayScore ||
      (day.compositeScore === bestDayScore && day.tasksCompleted > bestDayTaskCount)
    ) {
      bestDayDate = day.date
      bestDayScore = day.compositeScore
      bestDayTaskCount = day.tasksCompleted
    }
  }

  // If no day had any activity, clear best day
  if (bestDayScore === 0) {
    bestDayDate = null
  }

  return {
    id: generateId(),
    weekStart: startDayKey,
    weekEnd: endDayKey,
    totalTasksCompleted,
    totalTasksCreated,
    totalPointsEarned,
    totalPointsSpent,
    avgMoodScore,
    streakDays: streakRecords.length,
    completionRate,
    bestDayDate,
    bestDayScore,
    bestDayTaskCount,
    userBestDayOverride: null,
    dailyBreakdown,
    computedAt: new Date(),
  }
}
