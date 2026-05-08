import { Hono } from 'hono'
import { eq, desc, sql, gte, lte, and } from 'drizzle-orm'
import { db } from '../db/index.js'
import { pointLedger } from '../db/schema.js'
import { authMiddleware } from '../middleware/auth.js'

type Variables = { userId: string }

const route = new Hono<{ Variables: Variables }>()
route.use('*', authMiddleware)

// GET /points — all ledger entries
route.get('/', async (c) => {
  const userId = c.get('userId')
  const date = c.req.query('date')

  if (date) {
    const start = new Date(`${date}T00:00:00.000`)
    const end = new Date(`${date}T23:59:59.999`)
    const result = await db.select().from(pointLedger).where(and(
      eq(pointLedger.userId, userId),
      gte(pointLedger.createdAt, start),
      lte(pointLedger.createdAt, end),
    )).orderBy(desc(pointLedger.createdAt))
    return c.json({ data: result })
  }

  const result = await db.select().from(pointLedger).where(eq(pointLedger.userId, userId)).orderBy(desc(pointLedger.createdAt))
  return c.json({ data: result })
})

// GET /points/balance
route.get('/balance', async (c) => {
  const userId = c.get('userId')
  const [result] = await db.select({ balance: sql<number>`coalesce(sum(${pointLedger.amount}), 0)` })
    .from(pointLedger).where(eq(pointLedger.userId, userId))
  return c.json({ data: { balance: Number(result.balance) } })
})

// GET /points/income-summary — this week vs last week income
route.get('/income-summary', async (c) => {
  const userId = c.get('userId')
  const now = new Date()

  const weekAgo = new Date(now)
  weekAgo.setDate(weekAgo.getDate() - 7)
  const twoWeeksAgo = new Date(now)
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)

  const [thisWeek] = await db.select({ total: sql<number>`coalesce(sum(${pointLedger.amount}), 0)` })
    .from(pointLedger).where(and(eq(pointLedger.userId, userId), gte(pointLedger.createdAt, weekAgo), sql`${pointLedger.amount} > 0`))

  const [lastWeek] = await db.select({ total: sql<number>`coalesce(sum(${pointLedger.amount}), 0)` })
    .from(pointLedger).where(and(eq(pointLedger.userId, userId), gte(pointLedger.createdAt, twoWeeksAgo), lte(pointLedger.createdAt, weekAgo), sql`${pointLedger.amount} > 0`))

  return c.json({ data: { thisWeek: Number(thisWeek.total), lastWeek: Number(lastWeek.total) } })
})

export default route
