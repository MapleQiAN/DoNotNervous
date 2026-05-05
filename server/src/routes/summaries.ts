import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { dailySummaries, weeklySummaries } from '../db/schema.js'
import { authMiddleware } from '../middleware/auth.js'

type Variables = {
  userId: string
}

const route = new Hono<{ Variables: Variables }>()
route.use('*', authMiddleware)

// --- Daily Summaries ---

const dailyUpsertSchema = z.object({
  tasksCompleted: z.number().optional().default(0),
  tasksCreated: z.number().optional().default(0),
  pointsEarned: z.number().optional().default(0),
  pointsSpent: z.number().optional().default(0),
  dominantMood: z.string().nullable().optional(),
  dominantMoodScore: z.number().optional().default(0),
  taskIds: z.array(z.string()).optional().default([]),
  moodEntryIds: z.array(z.string()).optional().default([]),
  ledgerEntryIds: z.array(z.string()).optional().default([]),
  redemptionIds: z.array(z.string()).optional().default([]),
  computedAt: z.string().datetime().optional(),
})

route.get('/daily', async (c) => {
  const userId = c.get('userId')
  const result = await db.select().from(dailySummaries).where(eq(dailySummaries.userId, userId)).orderBy(desc(dailySummaries.date))
  return c.json({ data: result })
})

route.put('/daily/:date', zValidator('json', dailyUpsertSchema), async (c) => {
  const userId = c.get('userId')
  const date = c.req.param('date')
  const input = c.req.valid('json')
  const { computedAt: computedAtStr, ...rest } = input
  const values = {
    ...rest,
    userId,
    date,
    updatedAt: new Date(),
    ...(computedAtStr ? { computedAt: new Date(computedAtStr) } : {}),
  }
  const [summary] = await db.insert(dailySummaries).values(values)
    .onConflictDoUpdate({ target: [dailySummaries.userId, dailySummaries.date], set: { ...values, updatedAt: new Date() } })
    .returning()
  return c.json({ data: summary })
})

route.get('/daily/:date', async (c) => {
  const userId = c.get('userId')
  const date = c.req.param('date')
  const [summary] = await db.select().from(dailySummaries).where(and(eq(dailySummaries.userId, userId), eq(dailySummaries.date, date))).limit(1)
  if (!summary) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: summary })
})

route.delete('/daily/:date', async (c) => {
  const userId = c.get('userId')
  const date = c.req.param('date')
  const [summary] = await db.delete(dailySummaries).where(and(eq(dailySummaries.userId, userId), eq(dailySummaries.date, date))).returning()
  if (!summary) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: summary })
})

// --- Weekly Summaries ---

const weeklyUpsertSchema = z.object({
  weekEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalTasksCompleted: z.number().optional().default(0),
  totalTasksCreated: z.number().optional().default(0),
  totalPointsEarned: z.number().optional().default(0),
  totalPointsSpent: z.number().optional().default(0),
  avgMoodScore: z.number().optional().default(0),
  streakDays: z.number().optional().default(0),
  completionRate: z.number().optional().default(0),
  bestDayDate: z.string().nullable().optional(),
  bestDayScore: z.number().optional().default(0),
  bestDayTaskCount: z.number().optional().default(0),
  userBestDayOverride: z.string().nullable().optional(),
  dailyBreakdown: z.array(z.object({
    date: z.string(), tasksCompleted: z.number(), pointsEarned: z.number(), moodScore: z.number(), compositeScore: z.number(),
  })).optional().default([]),
  computedAt: z.string().datetime().optional(),
})

route.get('/weekly', async (c) => {
  const userId = c.get('userId')
  const result = await db.select().from(weeklySummaries).where(eq(weeklySummaries.userId, userId)).orderBy(desc(weeklySummaries.weekStart))
  return c.json({ data: result })
})

route.put('/weekly/:weekStart', zValidator('json', weeklyUpsertSchema), async (c) => {
  const userId = c.get('userId')
  const weekStart = c.req.param('weekStart')
  const input = c.req.valid('json')
  const { computedAt: computedAtStr, bestDayDate: bestDayDateStr, userBestDayOverride: userBestDayOverrideStr, ...rest } = input
  const values = {
    ...rest,
    userId,
    weekStart,
    updatedAt: new Date(),
    ...(bestDayDateStr !== undefined ? { bestDayDate: bestDayDateStr } : {}),
    ...(userBestDayOverrideStr !== undefined ? { userBestDayOverride: userBestDayOverrideStr } : {}),
    ...(computedAtStr ? { computedAt: new Date(computedAtStr) } : {}),
  }
  const [summary] = await db.insert(weeklySummaries).values(values)
    .onConflictDoUpdate({ target: [weeklySummaries.userId, weeklySummaries.weekStart], set: { ...values, updatedAt: new Date() } })
    .returning()
  return c.json({ data: summary })
})

route.get('/weekly/:weekStart', async (c) => {
  const userId = c.get('userId')
  const weekStart = c.req.param('weekStart')
  const [summary] = await db.select().from(weeklySummaries).where(and(eq(weeklySummaries.userId, userId), eq(weeklySummaries.weekStart, weekStart))).limit(1)
  if (!summary) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: summary })
})

route.delete('/weekly/:weekStart', async (c) => {
  const userId = c.get('userId')
  const weekStart = c.req.param('weekStart')
  const [summary] = await db.delete(weeklySummaries).where(and(eq(weeklySummaries.userId, userId), eq(weeklySummaries.weekStart, weekStart))).returning()
  if (!summary) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: summary })
})

export default route
