import { describe, it, expect, beforeAll } from 'vitest'

const BASE = 'http://localhost:3001'
let accessToken: string
let taskId: string

describe('tasks CRUD', () => {
  beforeAll(async () => {
    const email = `tasks-test-${Date.now()}@example.com`
    const res = await fetch(`${BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: 'password123' }),
    })
    expect(res.status).toBe(201)
    const data = await res.json()
    accessToken = data.accessToken
  })

  it('creates a task', async () => {
    const res = await fetch(`${BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ type: 'simple', title: 'Test task', difficulty: 'medium' }),
    })
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.data.title).toBe('Test task')
    expect(data.data.difficulty).toBe('medium')
    taskId = data.data.id
  })

  it('lists tasks', async () => {
    const res = await fetch(`${BASE}/tasks`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.data.length).toBeGreaterThan(0)
  })

  it('gets a task by id', async () => {
    const res = await fetch(`${BASE}/tasks/${taskId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.data.id).toBe(taskId)
  })

  it('updates a task', async () => {
    const res = await fetch(`${BASE}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` },
      body: JSON.stringify({ title: 'Updated task', status: 'completed' }),
    })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.data.title).toBe('Updated task')
    expect(data.data.status).toBe('completed')
  })

  it('deletes a task', async () => {
    const res = await fetch(`${BASE}/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })
    expect(res.status).toBe(200)
  })

  it('rejects unauthenticated requests', async () => {
    const res = await fetch(`${BASE}/tasks`)
    expect(res.status).toBe(401)
  })

  it('returns 404 for missing task', async () => {
    const res = await fetch(`${BASE}/tasks/00000000-0000-0000-0000-000000000000`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    })
    expect(res.status).toBe(404)
  })
})
