import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '../db/index.js'
import {
  companionProfiles,
  cosmeticUnlocks,
  pointLedger,
  reminderPreferences,
  syncStates,
} from '../db/schema.js'
import { authMiddleware } from '../middleware/auth.js'
import {
  awardCompanionExperience,
  companionLevelFromExperience,
  getOrCreateCompanionProfile,
} from '../domain/companion.js'

type Variables = { userId: string }

const route = new Hono<{ Variables: Variables }>()
route.use('*', authMiddleware)

const profilePatchSchema = z.object({
  displayName: z.string().min(1).max(24).optional(),
  energy: z.number().int().min(0).max(100).optional(),
  mood: z.enum(['normal', 'happy', 'celebrating', 'tired', 'proud']).optional(),
  activeCosmeticIds: z.array(z.string().min(1)).max(12).optional(),
})

const experienceSchema = z.object({
  amount: z.number().int().min(0).max(1000),
  reason: z.string().max(120).optional(),
})

const unlockSchema = z.object({
  name: z.string().min(1).max(80),
  slot: z.enum(['hat', 'face', 'body', 'room', 'effect']),
  pointCost: z.number().int().min(0).default(0),
})

const equipSchema = z.object({
  equipped: z.boolean(),
})

const reminderSchema = z.object({
  enabled: z.boolean(),
  hour: z.number().int().min(0).max(23),
  minute: z.number().int().min(0).max(59),
  message: z.string().min(1).max(80),
  timezone: z.string().min(1).max(80).default('Asia/Shanghai'),
})

const syncStateSchema = z.object({
  deviceId: z.string().min(1).max(128),
  lastPulledAt: z.string().datetime().nullable().optional(),
  lastPushedAt: z.string().datetime().nullable().optional(),
  pendingLocalChangeCount: z.number().int().min(0).default(0),
})

route.get('/profile', async (c) => {
  const userId = c.get('userId')
  const profile = await getOrCreateCompanionProfile(userId)
  return c.json({ data: withLevelProgress(profile) })
})

route.patch('/profile', zValidator('json', profilePatchSchema), async (c) => {
  const userId = c.get('userId')
  await getOrCreateCompanionProfile(userId)

  const [profile] = await db
    .update(companionProfiles)
    .set({ ...c.req.valid('json'), updatedAt: new Date() })
    .where(eq(companionProfiles.userId, userId))
    .returning()

  return c.json({ data: withLevelProgress(profile) })
})

route.post('/experience', zValidator('json', experienceSchema), async (c) => {
  const userId = c.get('userId')
  const input = c.req.valid('json')
  const profile = await awardCompanionExperience(userId, input.amount)
  return c.json({ data: withLevelProgress(profile) })
})

route.get('/cosmetics', async (c) => {
  const userId = c.get('userId')
  const result = await db
    .select()
    .from(cosmeticUnlocks)
    .where(eq(cosmeticUnlocks.userId, userId))
    .orderBy(desc(cosmeticUnlocks.unlockedAt))

  return c.json({ data: result })
})

route.post('/cosmetics/:cosmeticId/unlock', zValidator('json', unlockSchema), async (c) => {
  const userId = c.get('userId')
  const cosmeticId = c.req.param('cosmeticId')
  const input = c.req.valid('json')

  const [existing] = await db
    .select()
    .from(cosmeticUnlocks)
    .where(and(eq(cosmeticUnlocks.userId, userId), eq(cosmeticUnlocks.cosmeticId, cosmeticId)))
    .limit(1)
  if (existing) return c.json({ data: existing })

  const [balanceResult] = await db
    .select({ balance: sql<number>`coalesce(sum(${pointLedger.amount}), 0)` })
    .from(pointLedger)
    .where(eq(pointLedger.userId, userId))
  const balance = Number(balanceResult.balance)

  if (balance < input.pointCost) {
    return c.json({ error: `积分不足，需要 ${input.pointCost}，当前 ${balance}` }, 400)
  }

  const now = new Date()
  const [unlock] = await db
    .insert(cosmeticUnlocks)
    .values({
      userId,
      cosmeticId,
      name: input.name,
      slot: input.slot,
      pointCost: input.pointCost,
      equipped: false,
      unlockedAt: now,
      updatedAt: now,
    })
    .returning()

  if (input.pointCost > 0) {
    await db.insert(pointLedger).values({
      userId,
      amount: -input.pointCost,
      type: 'cosmetic_unlock',
      reason: `解锁装扮：${input.name}`,
      streakLength: 0,
      multiplier: 100,
      updatedAt: now,
    })
  }

  return c.json({ data: unlock }, 201)
})

route.patch('/cosmetics/:cosmeticId', zValidator('json', equipSchema), async (c) => {
  const userId = c.get('userId')
  const cosmeticId = c.req.param('cosmeticId')
  const input = c.req.valid('json')

  const [unlock] = await db
    .select()
    .from(cosmeticUnlocks)
    .where(and(eq(cosmeticUnlocks.userId, userId), eq(cosmeticUnlocks.cosmeticId, cosmeticId)))
    .limit(1)

  if (!unlock) return c.json({ error: 'Not found' }, 404)

  if (input.equipped) {
    await db
      .update(cosmeticUnlocks)
      .set({ equipped: false, updatedAt: new Date() })
      .where(and(eq(cosmeticUnlocks.userId, userId), eq(cosmeticUnlocks.slot, unlock.slot)))
  }

  const [updated] = await db
    .update(cosmeticUnlocks)
    .set({ equipped: input.equipped, updatedAt: new Date() })
    .where(and(eq(cosmeticUnlocks.userId, userId), eq(cosmeticUnlocks.cosmeticId, cosmeticId)))
    .returning()

  const equippedIds = await db
    .select({ cosmeticId: cosmeticUnlocks.cosmeticId })
    .from(cosmeticUnlocks)
    .where(and(eq(cosmeticUnlocks.userId, userId), eq(cosmeticUnlocks.equipped, true)))

  await getOrCreateCompanionProfile(userId)
  await db
    .update(companionProfiles)
    .set({
      activeCosmeticIds: equippedIds.map((item) => item.cosmeticId),
      updatedAt: new Date(),
    })
    .where(eq(companionProfiles.userId, userId))

  return c.json({ data: updated })
})

route.get('/reminder-preference', async (c) => {
  const userId = c.get('userId')
  const [existing] = await db
    .select()
    .from(reminderPreferences)
    .where(eq(reminderPreferences.userId, userId))
    .limit(1)

  if (existing) return c.json({ data: existing })

  const [created] = await db
    .insert(reminderPreferences)
    .values({ userId, updatedAt: new Date() })
    .returning()

  return c.json({ data: created })
})

route.put('/reminder-preference', zValidator('json', reminderSchema), async (c) => {
  const userId = c.get('userId')
  const input = c.req.valid('json')
  const now = new Date()

  const [preference] = await db
    .insert(reminderPreferences)
    .values({ ...input, userId, updatedAt: now })
    .onConflictDoUpdate({
      target: reminderPreferences.userId,
      set: { ...input, updatedAt: now },
    })
    .returning()

  return c.json({ data: preference })
})

route.put('/sync-state', zValidator('json', syncStateSchema), async (c) => {
  const userId = c.get('userId')
  const input = c.req.valid('json')
  const now = new Date()
  const values = {
    ...input,
    userId,
    lastPulledAt: input.lastPulledAt ? new Date(input.lastPulledAt) : null,
    lastPushedAt: input.lastPushedAt ? new Date(input.lastPushedAt) : null,
    updatedAt: now,
  }

  const [state] = await db
    .insert(syncStates)
    .values(values)
    .onConflictDoUpdate({
      target: [syncStates.userId, syncStates.deviceId],
      set: {
        lastPulledAt: values.lastPulledAt,
        lastPushedAt: values.lastPushedAt,
        pendingLocalChangeCount: values.pendingLocalChangeCount,
        updatedAt: now,
      },
    })
    .returning()

  return c.json({ data: state })
})

function withLevelProgress<T extends { experience: number }>(profile: T) {
  return {
    ...profile,
    levelProgress: companionLevelFromExperience(profile.experience),
  }
}

export default route
