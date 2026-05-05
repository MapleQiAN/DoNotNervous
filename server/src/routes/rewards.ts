import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { rewards, redemptions } from '../db/schema.js'
import { authMiddleware } from '../middleware/auth.js'

type Variables = {
  userId: string
}

const route = new Hono<{ Variables: Variables }>()
route.use('*', authMiddleware)

const rewardCreateSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  description: z.string().optional().default(''),
  pointCost: z.number().int().min(0),
  active: z.boolean().optional().default(true),
  createdAt: z.string().datetime().optional(),
})

const rewardUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  pointCost: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
})

route.get('/', async (c) => {
  const userId = c.get('userId')
  const result = await db.select().from(rewards).where(eq(rewards.userId, userId)).orderBy(desc(rewards.createdAt))
  return c.json({ data: result })
})

route.post('/', zValidator('json', rewardCreateSchema), async (c) => {
  const userId = c.get('userId')
  const input = c.req.valid('json')
  const { createdAt: createdAtStr, ...rest } = input
  const values = {
    ...rest,
    userId,
    updatedAt: new Date(),
    ...(createdAtStr ? { createdAt: new Date(createdAtStr) } : {}),
  }
  const [reward] = await db.insert(rewards).values(values).returning()
  return c.json({ data: reward }, 201)
})

route.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const [reward] = await db.select().from(rewards).where(and(eq(rewards.id, id), eq(rewards.userId, userId))).limit(1)
  if (!reward) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: reward })
})

route.patch('/:id', zValidator('json', rewardUpdateSchema), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const input = c.req.valid('json')
  const [reward] = await db.update(rewards).set({ ...input, updatedAt: new Date() })
    .where(and(eq(rewards.id, id), eq(rewards.userId, userId))).returning()
  if (!reward) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: reward })
})

route.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const [reward] = await db.delete(rewards).where(and(eq(rewards.id, id), eq(rewards.userId, userId))).returning()
  if (!reward) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: reward })
})

route.post('/:id/redeem', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const [reward] = await db.select().from(rewards).where(and(eq(rewards.id, id), eq(rewards.userId, userId))).limit(1)
  if (!reward) return c.json({ error: 'Reward not found' }, 404)
  if (!reward.active) return c.json({ error: 'Reward is not active' }, 400)

  const [redemption] = await db.insert(redemptions).values({
    userId,
    rewardId: reward.id,
    rewardName: reward.name,
    pointsSpent: reward.pointCost,
    updatedAt: new Date(),
  }).returning()
  return c.json({ data: redemption }, 201)
})

export default route
