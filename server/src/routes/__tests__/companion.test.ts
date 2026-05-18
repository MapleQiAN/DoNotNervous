import { describe, it, expect, beforeAll } from 'vitest'

const RUN_INTEGRATION = Boolean(process.env.TEST_BASE_URL || process.env.RUN_SERVER_TESTS)
const describeIntegration = RUN_INTEGRATION ? describe : describe.skip
const BASE = process.env.TEST_BASE_URL ?? 'http://localhost:5052'
let accessToken: string

describeIntegration('companion', () => {
  beforeAll(async () => {
    const email = `companion-test-${Date.now()}@example.com`
    const res = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123' }),
    })
    expect(res.status).toBe(201)
    const data = await res.json()
    accessToken = data.accessToken
  })

  it('creates a default companion profile on demand', async () => {
    const res = await fetch(`${BASE}/companion/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.data.displayName).toBe('圆圆')
    expect(data.data.level).toBe(1)
    expect(data.data.levelProgress.nextLevelExperience).toBe(100)
  })

  it('awards companion experience without requiring an existing profile', async () => {
    const res = await fetch(`${BASE}/companion/experience`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ amount: 125, reason: '测试成长' }),
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.data.level).toBe(2)
    expect(data.data.experience).toBeGreaterThanOrEqual(125)
  })

  it('stores gentle reminder preferences', async () => {
    const res = await fetch(`${BASE}/companion/reminder-preference`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({
        enabled: true,
        hour: 20,
        minute: 30,
        message: '如果愿意，可以回来看看今天的小进步。',
        timezone: 'Asia/Shanghai',
      }),
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.data.enabled).toBe(true)
    expect(data.data.message).toContain('小进步')
  })
})
