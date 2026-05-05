import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret'

const ACCESS_EXPIRY = '15m'
const REFRESH_EXPIRY = '7d'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

interface TokenPayload {
  sub: string
  type: 'access' | 'refresh'
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId, type: 'access' }, JWT_SECRET, { expiresIn: ACCESS_EXPIRY })
}

export function signRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, type: 'refresh' }, JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY })
}

export function verifyToken(token: string, type: 'access' | 'refresh'): TokenPayload {
  const secret = type === 'access' ? JWT_SECRET : JWT_REFRESH_SECRET
  const payload = jwt.verify(token, secret) as TokenPayload
  if (payload.type !== type) throw new Error(`Expected ${type} token, got ${payload.type}`)
  return payload
}
