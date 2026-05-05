import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../index'

describe('Database', () => {
  beforeEach(async () => {
    await db.tasks.clear()
  })

  it('opens without error', () => {
    expect(db).toBeDefined()
    expect(db.name).toBe('DoNotNervousDB')
  })

  it('tasks table exists with correct indexes', () => {
    expect(db.tasks).toBeDefined()

    const schema = db.tasks.schema
    expect(schema.primKey.keyPath).toBe('id')

    const indexNames = schema.indexes.map((idx) => idx.keyPath)
    expect(indexNames).toContain('parentId')
    expect(indexNames).toContain('type')
    expect(indexNames).toContain('status')
    expect(indexNames).toContain('category')
    expect(indexNames).toContain('sortOrder')
    expect(indexNames).toContain('createdAt')
    expect(indexNames).toContain('completedAt')
  })

  describe('version 5 migration', () => {
    beforeEach(async () => {
      await db.streakRecords.clear()
    })

    it('accepts streak records with recovery fields', async () => {
      await db.streakRecords.put({
        date: '2026-01-15',
        completedTaskIds: ['task-1'],
        freezeUsed: false,
        freezeCountRemaining: 2,
        createdAt: new Date(),
        recoveredFrom: true,
        recoveryTaskId: 'task-recovery',
      })

      const record = await db.streakRecords.get('2026-01-15')
      expect(record).toBeDefined()
      expect(record!.recoveredFrom).toBe(true)
      expect(record!.recoveryTaskId).toBe('task-recovery')
    })

    it('accepts streak records without recovery fields (backward compatible)', async () => {
      await db.streakRecords.put({
        date: '2026-01-16',
        completedTaskIds: ['task-a', 'task-b'],
        freezeUsed: true,
        freezeCountRemaining: 1,
        createdAt: new Date('2026-01-16T10:00:00'),
      })

      const record = await db.streakRecords.get('2026-01-16')
      expect(record).toBeDefined()
      expect(record!.completedTaskIds).toEqual(['task-a', 'task-b'])
      expect(record!.freezeUsed).toBe(true)
      expect(record!.recoveredFrom).toBeUndefined()
      expect(record!.recoveryTaskId).toBeUndefined()
    })
  })

  it('data survives close/reopen', async () => {
    await db.tasks.add({
      id: 'test-persist-1',
      type: 'simple',
      parentId: null,
      title: 'Persistent task',
      description: '',
      status: 'active',
      difficulty: 'medium',
      category: '',
      sortOrder: 0,
      createdAt: new Date(),
      completedAt: null,
      archivedAt: null,
    })

    await db.close()

    const reopenedDb = new (db.constructor as new () => typeof db)()
    try {
      const task = await reopenedDb.tasks.get('test-persist-1')
      expect(task).toBeDefined()
      expect(task!.title).toBe('Persistent task')
    } finally {
      await reopenedDb.close()
    }
  })
})
