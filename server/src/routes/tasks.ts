import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, and, desc } from 'drizzle-orm'
import { db } from '../db/index.js'
import { tasks } from '../db/schema.js'
import { authMiddleware } from '../middleware/auth.js'

type Variables = {
  userId: string
}

const route = new Hono<{ Variables: Variables }>()
route.use('*', authMiddleware)

const taskCreateSchema = z.object({
  id: z.string().uuid().optional(),
  parentId: z.string().uuid().nullable().optional(),
  type: z.enum(['simple', 'category']),
  title: z.string().min(1),
  description: z.string().optional().default(''),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('easy'),
  category: z.string().optional().default(''),
  sortOrder: z.number().optional().default(0),
  createdAt: z.string().datetime().optional(),
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
  const conditions = [eq(tasks.userId, userId)]
  if (status) conditions.push(eq(tasks.status, status))

  const result = await db.select().from(tasks)
    .where(and(...conditions))
    .orderBy(desc(tasks.createdAt))
  return c.json({ data: result })
})

route.post('/', zValidator('json', taskCreateSchema), async (c) => {
  const userId = c.get('userId')
  const input = c.req.valid('json')
  const { createdAt: createdAtStr, ...rest } = input
  const values = {
    ...rest,
    userId,
    updatedAt: new Date(),
    ...(createdAtStr ? { createdAt: new Date(createdAtStr) } : {}),
  }
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
    ...rest,
    updatedAt: new Date(),
    ...(completedAtStr !== undefined ? { completedAt: completedAtStr ? new Date(completedAtStr) : null } : {}),
    ...(archivedAtStr !== undefined ? { archivedAt: archivedAtStr ? new Date(archivedAtStr) : null } : {}),
  }
  const [task] = await db.update(tasks).set(values)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
    .returning()
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

export default route
