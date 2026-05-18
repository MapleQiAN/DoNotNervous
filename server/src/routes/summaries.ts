import { Hono } from 'hono'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { dailySummaries, weeklySummaries } from '../db/schema.js'
import { authMiddleware } from '../middleware/auth.js'
import { computeAndStoreDailySummary, computeAndStoreWeeklySummary } from '../domain/summary.js'

type Variables = { userId: string }

const route = new Hono<{ Variables: Variables }>()
route.use('*', authMiddleware)

// --- Daily Summaries ---

route.get('/daily', async (c) => {
  const userId = c.get('userId')
  const result = await db.select().from(dailySummaries).where(eq(dailySummaries.userId, userId)).orderBy(desc(dailySummaries.date))
  return c.json({ data: result })
})

// GET /daily/:date — compute-if-missing
route.get('/daily/:date', async (c) => {
  const userId = c.get('userId')
  const date = c.req.param('date')
  const [existing] = await db.select().from(dailySummaries).where(and(eq(dailySummaries.userId, userId), eq(dailySummaries.date, date))).limit(1)
  if (existing) return c.json({ data: existing })

  const summary = await computeAndStoreDailySummary(userId, date)
  return c.json({ data: summary })
})

// --- Weekly Summaries ---

route.get('/weekly', async (c) => {
  const userId = c.get('userId')
  const result = await db.select().from(weeklySummaries).where(eq(weeklySummaries.userId, userId)).orderBy(desc(weeklySummaries.weekStart))
  return c.json({ data: result })
})

// GET /weekly/:weekStart — compute-if-missing
route.get('/weekly/:weekStart', async (c) => {
  const userId = c.get('userId')
  const weekStart = c.req.param('weekStart')
  const [existing] = await db.select().from(weeklySummaries).where(and(eq(weeklySummaries.userId, userId), eq(weeklySummaries.weekStart, weekStart))).limit(1)
  if (existing) return c.json({ data: existing })

  const summary = await computeAndStoreWeeklySummary(userId, weekStart)
  return c.json({ data: summary })
})

export default route
