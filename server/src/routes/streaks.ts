import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { streakRecords } from '../db/schema.js'
import { authMiddleware } from '../middleware/auth.js'

type Variables = {
  userId: string
}

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

route.get('/', async (c) => {
  const userId = c.get('userId')
  const result = await db.select().from(streakRecords).where(eq(streakRecords.userId, userId)).orderBy(desc(streakRecords.date))
  return c.json({ data: result })
})

route.put('/:date', zValidator('json', streakUpsertSchema), async (c) => {
  const userId = c.get('userId')
  const date = c.req.param('date')
  const input = c.req.valid('json')
  const { createdAt: createdAtStr, ...rest } = input
  const values = {
    ...rest,
    userId,
    date,
    updatedAt: new Date(),
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
