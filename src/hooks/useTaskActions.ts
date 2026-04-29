import { db } from '../db'
import { generateId } from '../lib/id'
import { taskCreateSchema } from '../domain/task'
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

export async function completeTask(id: string): Promise<void> {
  await db.tasks.update(id, {
    status: 'completed',
    completedAt: new Date(),
  })
}

export async function uncompleteTask(id: string): Promise<void> {
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
