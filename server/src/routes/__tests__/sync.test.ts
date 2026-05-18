import { describe, it, expect, beforeAll } from 'vitest'

const BASE = 'http://localhost:3001'
let accessToken: string
let serverTimestamp: string

describe('sync', () => {
  beforeAll(async () => {
    const email = `sync-test-${Date.now()}@example.com`
    const res = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123' }),
    })
    expect(res.status).toBe(201)
    const data = await res.json()
    accessToken = data.accessToken
  })

  it('pushes and pulls tasks', async () => {
    const res = await fetch(`${BASE}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({
        lastSyncTimestamp: '1970-01-01T00:00:00Z',
        changes: {
          tasks: [{ type: 'simple', title: 'Synced task', difficulty: 'easy', status: 'active' }],
        },
      }),
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.serverTimestamp).toBeDefined()
    expect(data.changes.tasks.length).toBe(1)
    expect(data.changes.tasks[0].title).toBe('Synced task')
    serverTimestamp = data.serverTimestamp
  })

  it('sync returns empty changes after full sync', async () => {
    const res = await fetch(`${BASE}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({
        lastSyncTimestamp: serverTimestamp,
        changes: {},
      }),
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    const totalChanges = Object.values(data.changes).reduce(
      (sum: number, arr: unknown) => sum + (arr as unknown[]).length,
      0,
    )
    expect(totalChanges).toBe(0)
  })

  it('initial sync pushes and returns all data', async () => {
    const res = await fetch(`${BASE}/sync/initial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({
        changes: {
          tasks: [{ type: 'simple', title: 'Initial sync task', difficulty: 'hard', status: 'active' }],
        },
      }),
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.changes.tasks.length).toBeGreaterThanOrEqual(2)
  })

  it('syncs iOS companion tables for local-first clients', async () => {
    const res = await fetch(`${BASE}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({
        lastSyncTimestamp: '1970-01-01T00:00:00Z',
        changes: {
          companionProfiles: [{
            displayName: '圆圆',
            level: 2,
            experience: 140,
            energy: 90,
            mood: 'happy',
            activeCosmeticIds: ['sprout-hat'],
          }],
          reminderPreferences: [{
            enabled: false,
            hour: 20,
            minute: 30,
            message: '如果愿意，可以回来看看今天的小进步。',
            timezone: 'Asia/Shanghai',
          }],
          syncStates: [{
            deviceId: 'ios-test-device',
            pendingLocalChangeCount: 0,
          }],
        },
      }),
    })

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.changes.companionProfiles[0].level).toBe(2)
    expect(data.changes.reminderPreferences[0].hour).toBe(20)
    expect(data.changes.syncStates[0].deviceId).toBe('ios-test-device')
  })

  it('isolates data between users', async () => {
    const email2 = `sync-test2-${Date.now()}@example.com`
    const res2 = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email2, password: 'password123' }),
    })
    const data2 = await res2.json()

    const syncRes = await fetch(`${BASE}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${data2.accessToken}` },
      body: JSON.stringify({ lastSyncTimestamp: '1970-01-01T00:00:00Z', changes: {} }),
    })
    const syncData = await syncRes.json()
    const totalChanges = Object.values(syncData.changes).reduce(
      (sum: number, arr: unknown) => sum + (arr as unknown[]).length,
      0,
    )
    expect(totalChanges).toBe(0)
  })
})
