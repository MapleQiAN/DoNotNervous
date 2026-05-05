import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword, signAccessToken, signRefreshToken, verifyToken } from '../auth.js'

describe('auth domain', () => {
  it('hashes and verifies password', async () => {
    const hash = await hashPassword('secret123')
    expect(hash).not.toBe('secret123')
    expect(await verifyPassword('secret123', hash)).toBe(true)
    expect(await verifyPassword('wrong', hash)).toBe(false)
  })

  it('signs and verifies access token', () => {
    const token = signAccessToken('user-123')
    const payload = verifyToken(token, 'access')
    expect(payload.sub).toBe('user-123')
    expect(payload.type).toBe('access')
  })

  it('signs and verifies refresh token', () => {
    const token = signRefreshToken('user-123')
    const payload = verifyToken(token, 'refresh')
    expect(payload.sub).toBe('user-123')
    expect(payload.type).toBe('refresh')
  })

  it('rejects wrong token type', () => {
    const token = signAccessToken('user-123')
    expect(() => verifyToken(token, 'refresh')).toThrow()
  })
})
