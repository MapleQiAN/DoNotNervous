import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, desc, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { pointLedger } from '../db/schema.js'
import { authMiddleware } from '../middleware/auth.js'

type Variables = {
  userId: string
}

const route = new Hono<{ Variables: Variables }>()
route.use('*', authMiddleware)

const ledgerCreateSchema = z.object({
  id: z.string().uuid().optional(),
  amount: z.number().int(),
  type: z.enum(['task_complete', 'streak_bonus', 'reward_spent', 'adjustment']),
  reason: z.string().optional().default(''),
  taskId: z.string().uuid().nullable().optional(),
  streakLength: z.number().int().optional().default(0),
  multiplier: z.number().int().optional().default(1),
  createdAt: z.string().datetime().optional(),
})

route.get('/', async (c) => {
  const userId = c.get('userId')
  const result = await db.select().from(pointLedger).where(eq(pointLedger.userId, userId)).orderBy(desc(pointLedger.createdAt))
  return c.json({ data: result })
})

route.post('/', zValidator('json', ledgerCreateSchema), async (c) => {
  const userId = c.get('userId')
  const input = c.req.valid('json')
  const { createdAt: createdAtStr, ...rest } = input
  const values = {
    ...rest,
    userId,
    updatedAt: new Date(),
    ...(createdAtStr ? { createdAt: new Date(createdAtStr) } : {}),
  }
  const [entry] = await db.insert(pointLedger).values(values).returning()
  return c.json({ data: entry }, 201)
})

route.get('/balance', async (c) => {
  const userId = c.get('userId')
  const [result] = await db.select({ balance: sql<number>`coalesce(sum(${pointLedger.amount}), 0)` })
    .from(pointLedger).where(eq(pointLedger.userId, userId))
  return c.json({ data: { balance: Number(result.balance) } })
})

export default route
