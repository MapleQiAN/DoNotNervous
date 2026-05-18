import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, desc, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import { rewards, redemptions, pointLedger } from '../db/schema.js'
import { authMiddleware } from '../middleware/auth.js'

type Variables = { userId: string }

const route = new Hono<{ Variables: Variables }>()
route.use('*', authMiddleware)

const rewardCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(''),
  pointCost: z.number().int().min(0),
  icon: z.string().optional().default('gift'),
  active: z.boolean().optional().default(true),
})

const rewardUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  pointCost: z.number().int().min(0).optional(),
  icon: z.string().optional(),
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
  const values = { ...input, userId, updatedAt: new Date() }
  const [reward] = await db.insert(rewards).values(values).returning()
  return c.json({ data: reward }, 201)
})

route.get('/redemptions', async (c) => {
  const userId = c.get('userId')
  const result = await db
    .select()
    .from(redemptions)
    .where(eq(redemptions.userId, userId))
    .orderBy(desc(redemptions.createdAt))
  return c.json({ data: result })
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

// Redeem with server-side balance check
route.post('/:id/redeem', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const [reward] = await db.select().from(rewards).where(and(eq(rewards.id, id), eq(rewards.userId, userId))).limit(1)
  if (!reward) return c.json({ error: 'Reward not found' }, 404)
  if (!reward.active) return c.json({ error: 'Reward is not active' }, 400)

  // Check balance
  const [balanceResult] = await db.select({ balance: sql<number>`coalesce(sum(${pointLedger.amount}), 0)` })
    .from(pointLedger).where(eq(pointLedger.userId, userId))
  const balance = Number(balanceResult.balance)
  if (balance < reward.pointCost) {
    return c.json({ error: `Not enough points. Need ${reward.pointCost}, have ${balance}` }, 400)
  }

  const now = new Date()
  const [redemption] = await db.insert(redemptions).values({
    userId, rewardId: reward.id, rewardName: reward.name,
    pointsSpent: reward.pointCost, updatedAt: now,
  }).returning()

  // Create negative ledger entry
  await db.insert(pointLedger).values({
    userId, amount: -reward.pointCost, type: 'reward_spent',
    reason: `兑换奖励：${reward.name}`, streakLength: 0, multiplier: 100, updatedAt: now,
  })

  return c.json({ data: redemption }, 201)
})

export default route
