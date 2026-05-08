import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, desc, gte, lte } from 'drizzle-orm'
import { db } from '../db/index.js'
import { streakRecords } from '../db/schema.js'
import { authMiddleware } from '../middleware/auth.js'
import { computeCurrentStreak } from '../domain/streaks.js'

type Variables = { userId: string }

const route = new Hono<{ Variables: Variables }>()
route.use('*', authMiddleware)

const streakUpsertSchema = z.object({
  completedTaskIds: z.array(z.string()).optional().default([]),
  freezeUsed: z.boolean().optional().default(false),
  freezeCountRemaining: z.number().optional().default(0),
  recoveredFrom: z.boolean().optional().default(false),
  recoveryTaskId: z.string().uuid().nullable().optional(),
  createdAt: z.string().datetime().optional(),
})

// GET /streaks — optionally filter by date range
route.get('/', async (c) => {
  const userId = c.get('userId')
  const from = c.req.query('from')
  const to = c.req.query('to')

  const conditions = [eq(streakRecords.userId, userId)]
  if (from) conditions.push(gte(streakRecords.date, from))
  if (to) conditions.push(lte(streakRecords.date, to))

  const result = await db.select().from(streakRecords)
    .where(and(...conditions))
    .orderBy(desc(streakRecords.date))
  return c.json({ data: result })
})

// GET /streaks/current — compute current streak length
route.get('/current', async (c) => {
  const userId = c.get('userId')
  const streakLength = await computeCurrentStreak(userId)
  return c.json({ data: { streakLength } })
})

route.put('/:date', zValidator('json', streakUpsertSchema), async (c) => {
  const userId = c.get('userId')
  const date = c.req.param('date')
  const input = c.req.valid('json')
  const { createdAt: createdAtStr, ...rest } = input
  const values = {
    ...rest, userId, date, updatedAt: new Date(),
    ...(createdAtStr ? { createdAt: new Date(createdAtStr) } : {}),
  }
  const [record] = await db.insert(streakRecords).values(values)
    .onConflictDoUpdate({ target: [streakRecords.userId, streakRecords.date], set: { ...values, updatedAt: new Date() } })
    .returning()
  return c.json({ data: record })
})

route.get('/:date', async (c) => {
  const userId = c.get('userId')
  const date = c.req.param('date')
  const [record] = await db.select().from(streakRecords).where(and(eq(streakRecords.userId, userId), eq(streakRecords.date, date))).limit(1)
  if (!record) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: record })
})

route.delete('/:date', async (c) => {
  const userId = c.get('userId')
  const date = c.req.param('date')
  const [record] = await db.delete(streakRecords).where(and(eq(streakRecords.userId, userId), eq(streakRecords.date, date))).returning()
  if (!record) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: record })
})

export default route
