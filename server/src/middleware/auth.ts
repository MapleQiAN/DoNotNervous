import type { Context, Next } from 'hono'
import { verifyToken } from '../domain/auth.js'

export async function authMiddleware(c: Context, next: Next) {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing authorization header' }, 401)
  }

  const token = header.slice(7)
  try {
    const payload = verifyToken(token, 'access')
    c.set('userId', payload.sub)
    await next()
  } catch {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
}
