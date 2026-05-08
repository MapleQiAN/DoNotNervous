import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { db } from '../db/index.js'
import { users } from '../db/schema.js'
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from '../domain/auth.js'

const auth = new Hono()

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

auth.post('/register', zValidator('json', registerSchema), async (c) => {
  const { email, password } = c.req.valid('json')

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
  if (existing.length > 0) {
    return c.json({ error: 'Email already registered' }, 409)
  }

  const passwordHash = await hashPassword(password)
  const [user] = await db.insert(users).values({ email, passwordHash }).returning()

  return c.json(
    {
      user: { id: user.id, email: user.email },
      accessToken: signAccessToken(user.id),
      refreshToken: signRefreshToken(user.id),
    },
    201,
  )
})

auth.post('/login', zValidator('json', registerSchema), async (c) => {
  const { email, password } = c.req.valid('json')

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) {
    return c.json({ error: 'Invalid credentials' }, 401)
  }

  return c.json({
    user: { id: user.id, email: user.email },
    accessToken: signAccessToken(user.id),
    refreshToken: signRefreshToken(user.id),
  })
})

auth.get('/me', async (c) => {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing authorization header' }, 401)
  }

  try {
    const payload = verifyToken(header.slice(7), 'access')
    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1)
    if (!user) return c.json({ error: 'User not found' }, 404)
    return c.json({ user })
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
})

auth.post('/refresh', async (c) => {
  const body = await c.req.json()
  const { refreshToken } = body
  if (!refreshToken) {
    return c.json({ error: 'Missing refresh token' }, 400)
  }

  try {
    const payload = verifyToken(refreshToken, 'refresh')
    return c.json({
      accessToken: signAccessToken(payload.sub),
      refreshToken: signRefreshToken(payload.sub),
    })
  } catch {
    return c.json({ error: 'Invalid refresh token' }, 401)
  }
})

export default auth
