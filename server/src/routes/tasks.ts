import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, desc, gte, lte } from 'drizzle-orm'
import { db } from '../db/index.js'
import { tasks, pointLedger, streakRecords } from '../db/schema.js'
import { authMiddleware } from '../middleware/auth.js'
import { calculatePoints } from '../domain/points.js'
import { computeCurrentStreak } from '../domain/streaks.js'
import { computeAndStoreDailySummary, computeAndStoreWeeklySummary } from '../domain/summary.js'
import { awardCompanionExperience, experienceForDifficulty } from '../domain/companion.js'

type Variables = { userId: string }

const route = new Hono<{ Variables: Variables }>()
route.use('*', authMiddleware)

const taskCreateSchema = z.object({
  parentId: z.string().uuid().nullable().optional(),
  type: z.enum(['simple', 'category']),
  title: z.string().min(1),
  description: z.string().optional().default(''),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('easy'),
  category: z.string().optional().default(''),
  sortOrder: z.number().optional().default(0),
})

const taskUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'completed', 'archived']).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  category: z.string().optional(),
  sortOrder: z.number().optional(),
  completedAt: z.string().datetime().nullable().optional(),
  archivedAt: z.string().datetime().nullable().optional(),
})

route.get('/', async (c) => {
  const userId = c.get('userId')
  const status = c.req.query('status')
  const completedAfter = c.req.query('completedAfter')
  const completedBefore = c.req.query('completedBefore')

  const conditions = [eq(tasks.userId, userId)]
  if (status) conditions.push(eq(tasks.status, status))
  if (completedAfter) conditions.push(gte(tasks.completedAt, new Date(completedAfter)))
  if (completedBefore) conditions.push(lte(tasks.completedAt, new Date(completedBefore)))

  const result = await db.select().from(tasks)
    .where(and(...conditions))
    .orderBy(desc(tasks.createdAt))
  return c.json({ data: result })
})

route.post('/', zValidator('json', taskCreateSchema), async (c) => {
  const userId = c.get('userId')
  const input = c.req.valid('json')
  const values = { ...input, userId, updatedAt: new Date() }
  const [task] = await db.insert(tasks).values(values).returning()
  return c.json({ data: task }, 201)
})

route.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const [task] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).limit(1)
  if (!task) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: task })
})

route.patch('/:id', zValidator('json', taskUpdateSchema), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const input = c.req.valid('json')
  const { completedAt: completedAtStr, archivedAt: archivedAtStr, ...rest } = input
  const values = {
    ...rest, updatedAt: new Date(),
    ...(completedAtStr !== undefined ? { completedAt: completedAtStr ? new Date(completedAtStr) : null } : {}),
    ...(archivedAtStr !== undefined ? { archivedAt: archivedAtStr ? new Date(archivedAtStr) : null } : {}),
  }
  const [task] = await db.update(tasks).set(values)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId))).returning()
  if (!task) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: task })
})

route.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const [task] = await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).returning()
  if (!task) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: task })
})

// Thick endpoint: complete a task atomically
route.post('/:id/complete', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const now = new Date()

  const [task] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).limit(1)
  if (!task) return c.json({ error: 'Not found' }, 404)
  if (task.status === 'completed') return c.json({ error: 'Already completed' }, 400)

  const streakLength = await computeCurrentStreak(userId, now)
  const { base, bonus, multiplier } = calculatePoints(task.difficulty, streakLength)
  const companionExperience = experienceForDifficulty(task.difficulty)

  const todayKey = formatDateKey(now)

  // Update task
  await db.update(tasks).set({ status: 'completed', completedAt: now, updatedAt: now })
    .where(eq(tasks.id, id))

  // Create base point entry
  await db.insert(pointLedger).values({
    userId, amount: base, type: 'task_complete',
    reason: '完成任务：' + task.title, taskId: task.id,
    streakLength, multiplier: multiplier * 100, updatedAt: now,
  })

  // Create streak bonus if applicable
  if (bonus > 0) {
    await db.insert(pointLedger).values({
      userId, amount: bonus, type: 'streak_bonus',
      reason: `连续完成加成（${multiplier}x）`, taskId: task.id,
      streakLength, multiplier: multiplier * 100, updatedAt: now,
    })
  }

  // Upsert streak record
  const existing = await db.select().from(streakRecords)
    .where(and(eq(streakRecords.userId, userId), eq(streakRecords.date, todayKey))).limit(1)
  if (existing.length > 0) {
    const updatedIds = [...(existing[0].completedTaskIds as string[]), task.id]
    await db.update(streakRecords).set({ completedTaskIds: updatedIds, updatedAt: now })
      .where(and(eq(streakRecords.userId, userId), eq(streakRecords.date, todayKey)))
  } else {
    await db.insert(streakRecords).values({
      userId, date: todayKey, completedTaskIds: [task.id],
      freezeUsed: false, freezeCountRemaining: 0, updatedAt: now,
    })
  }

  const companion = await awardCompanionExperience(userId, companionExperience)

  // Non-blocking summary refresh
  computeAndStoreDailySummary(userId, todayKey).catch(() => {})
  const monday = getWeekMonday(now)
  computeAndStoreWeeklySummary(userId, formatDateKey(monday)).catch(() => {})

  const [updatedTask] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1)

  return c.json({
    data: {
      task: updatedTask,
      points: { base, bonus, multiplier },
      streakLength,
      companion: {
        ...companion,
        experienceGained: companionExperience,
      },
    },
  })
})

// Uncomplete a task
route.post('/:id/uncomplete', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')

  const [task] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId))).limit(1)
  if (!task) return c.json({ error: 'Not found' }, 404)

  await db.update(tasks).set({ status: 'active', completedAt: null, updatedAt: new Date() })
    .where(eq(tasks.id, id))

  const [updatedTask] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1)
  return c.json({ data: updatedTask })
})

function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getWeekMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d
}

export default route
