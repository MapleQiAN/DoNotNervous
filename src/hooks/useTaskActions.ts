import { db } from '../db'
import { generateId } from '../lib/id'
import { taskCreateSchema } from '../domain/task'
import { calculatePoints } from '../domain/points'
import { computeCurrentStreak } from './useStreaks'
import { toDayKey } from '../lib/date-utils'
import { useUIStore } from '../stores/uiStore'
import type { Task } from '../domain/types'

export async function createTask(input: unknown): Promise<Task> {
  const validated = taskCreateSchema.parse(input)
  const task: Task = {
    id: generateId(),
    title: validated.title,
    description: validated.description ?? '',
    type: validated.type,
    difficulty: validated.difficulty,
    category: validated.category ?? '',
    parentId: validated.parentId ?? null,
    status: 'active',
    sortOrder: await db.tasks.where('status').equals('active').count(),
    createdAt: new Date(),
    completedAt: null,
    archivedAt: null,
  }
  await db.tasks.add(task)
  return task
}

export async function completeTask(id: string): Promise<Task> {
  const now = new Date()
  const task = await db.tasks.get(id)

  if (!task) {
    throw new Error(`Task not found: ${id}`)
  }

  // Compute current streak length before this completion
  const streakLength = await computeCurrentStreak(now)
  const { base, bonus, multiplier } = calculatePoints(task.difficulty, streakLength)
  const todayKey = toDayKey(now)

  await db.transaction('rw', [db.tasks, db.pointLedger, db.streakRecords], async () => {
    // 1. Update task status
    await db.tasks.update(id, {
      status: 'completed',
      completedAt: now,
    })

    // 2. Write base point ledger entry
    await db.pointLedger.add({
      id: generateId(),
      amount: base,
      type: 'task_complete',
      reason: 'Completed: ' + task.title,
      taskId: task.id,
      streakLength,
      multiplier,
      createdAt: now,
    })

    // 3. Write streak bonus ledger entry if multiplier > 1
    if (bonus > 0) {
      await db.pointLedger.add({
        id: generateId(),
        amount: bonus,
        type: 'streak_bonus',
        reason: `Streak bonus (${multiplier}x)`,
        taskId: task.id,
        streakLength,
        multiplier,
        createdAt: now,
      })
    }

    // 4. Upsert today's streak record (put, not add -- prevents duplicate key errors)
    const existingRecord = await db.streakRecords.get(todayKey)
    if (existingRecord) {
      const updatedTaskIds = [...existingRecord.completedTaskIds, task.id]
      await db.streakRecords.put({
        ...existingRecord,
        completedTaskIds: updatedTaskIds,
      })
    } else {
      await db.streakRecords.put({
        date: todayKey,
        completedTaskIds: [task.id],
        freezeUsed: false,
        freezeCountRemaining: 2,
        createdAt: now,
      })
    }
  })

  useUIStore.getState().setMoodPickerTaskId(task.id)
  return task
}

export async function uncompleteTask(id: string): Promise<void> {
  // Anti-anxiety principle: do NOT reverse point ledger entries
  await db.tasks.update(id, {
    status: 'active',
    completedAt: null,
  })
}

export async function archiveTask(id: string): Promise<void> {
  await db.tasks.update(id, {
    status: 'archived',
    archivedAt: new Date(),
  })
}

export async function unarchiveTask(id: string): Promise<void> {
  await db.tasks.update(id, {
    status: 'active',
    archivedAt: null,
  })
}

export async function deleteTask(id: string): Promise<void> {
  await db.transaction('rw', db.tasks, async () => {
    await db.tasks.where('parentId').equals(id).delete()
    await db.tasks.delete(id)
  })
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<void> {
  await db.tasks.update(id, updates)
}
