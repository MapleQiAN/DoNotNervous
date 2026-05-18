import { describe, it, expect, beforeAll } from 'vitest'

const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:3001'
let accessToken: string

describe('rewards', () => {
  beforeAll(async () => {
    const email = `rewards-test-${Date.now()}@example.com`
    const res = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123' }),
    })
    expect(res.status).toBe(201)
    const data = await res.json()
    accessToken = data.accessToken
  })

  it('lists redemptions without matching the reward id route', async () => {
    const res = await fetch(`${BASE}/rewards/redemptions`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data.data)).toBe(true)
  })

  it('creates a reward with an icon', async () => {
    const res = await fetch(`${BASE}/rewards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        name: 'Coffee break',
        description: 'Small reward',
        pointCost: 10,
        icon: 'coffee',
      }),
    })

    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.data.icon).toBe('coffee')
  })
})
