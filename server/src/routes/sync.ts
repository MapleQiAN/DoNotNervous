import { Hono } from 'hono'
import { authMiddleware } from '../middleware/auth.js'
import { pushChanges, pullChanges } from '../domain/sync.js'

type Variables = {
  userId: string
}

const route = new Hono<{ Variables: Variables }>()
route.use('*', authMiddleware)

route.post('/', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json<{
    lastSyncTimestamp: string
    changes: Record<string, unknown[]>
  }>()

  await pushChanges(userId, body.changes ?? {})

  const serverChanges = await pullChanges(
    userId,
    body.lastSyncTimestamp ?? '1970-01-01T00:00:00Z',
  )

  return c.json({
    serverTimestamp: new Date().toISOString(),
    changes: serverChanges,
  })
})

route.post('/initial', async (c) => {
  const userId = c.get('userId')
  const body = await c.req.json<{ changes: Record<string, unknown[]> }>()

  await pushChanges(userId, body.changes ?? {})

  const serverChanges = await pullChanges(userId, '1970-01-01T00:00:00Z')

  return c.json({
    serverTimestamp: new Date().toISOString(),
    changes: serverChanges,
  })
})

export default route
