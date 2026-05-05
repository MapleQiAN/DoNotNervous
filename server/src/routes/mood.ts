import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { moodEntries } from '../db/schema.js'
import { authMiddleware } from '../middleware/auth.js'

type Variables = {
  userId: string
}

const route = new Hono<{ Variables: Variables }>()
route.use('*', authMiddleware)

const moodCreateSchema = z.object({
  id: z.string().uuid().optional(),
  emoji: z.string().min(1),
  label: z.string().optional().default(''),
  journal: z.string().optional().default(''),
  taskId: z.string().uuid().nullable().optional(),
  createdAt: z.string().datetime().optional(),
})

const moodUpdateSchema = z.object({
  emoji: z.string().min(1).optional(),
  label: z.string().optional(),
  journal: z.string().optional(),
  taskId: z.string().uuid().nullable().optional(),
})

route.get('/', async (c) => {
  const userId = c.get('userId')
  const result = await db.select().from(moodEntries).where(eq(moodEntries.userId, userId)).orderBy(desc(moodEntries.createdAt))
  return c.json({ data: result })
})

route.post('/', zValidator('json', moodCreateSchema), async (c) => {
  const userId = c.get('userId')
  const input = c.req.valid('json')
  const { createdAt: createdAtStr, ...rest } = input
  const values = {
    ...rest,
    userId,
    updatedAt: new Date(),
    ...(createdAtStr ? { createdAt: new Date(createdAtStr) } : {}),
  }
  const [entry] = await db.insert(moodEntries).values(values).returning()
  return c.json({ data: entry }, 201)
})

route.get('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const [entry] = await db.select().from(moodEntries).where(and(eq(moodEntries.id, id), eq(moodEntries.userId, userId))).limit(1)
  if (!entry) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: entry })
})

route.patch('/:id', zValidator('json', moodUpdateSchema), async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const input = c.req.valid('json')
  const { taskId: taskIdStr, ...rest } = input
  const values = {
    ...rest,
    updatedAt: new Date(),
    ...(taskIdStr !== undefined ? { taskId: taskIdStr } : {}),
  }
  const [entry] = await db.update(moodEntries).set(values)
    .where(and(eq(moodEntries.id, id), eq(moodEntries.userId, userId))).returning()
  if (!entry) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: entry })
})

route.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const id = c.req.param('id')
  const [entry] = await db.delete(moodEntries).where(and(eq(moodEntries.id, id), eq(moodEntries.userId, userId))).returning()
  if (!entry) return c.json({ error: 'Not found' }, 404)
  return c.json({ data: entry })
})

export default route
