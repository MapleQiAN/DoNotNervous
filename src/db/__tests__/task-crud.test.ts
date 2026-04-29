import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../index'
import {
  createTask,
  completeTask,
  uncompleteTask,
  deleteTask,
  archiveTask,
  unarchiveTask,
  updateTask,
} from '../../hooks/useTaskActions'

describe('Task CRUD integration', () => {
  beforeEach(async () => {
    await db.tasks.clear()
  })

  it('createTask persists a task with correct defaults', async () => {
    const task = await createTask({ title: 'Test task' })

    expect(task.id).toBeDefined()
    expect(task.title).toBe('Test task')
    expect(task.status).toBe('active')
    expect(task.difficulty).toBe('medium')
    expect(task.type).toBe('simple')
    expect(task.description).toBe('')
    expect(task.category).toBe('')
    expect(task.parentId).toBeNull()
    expect(task.completedAt).toBeNull()
    expect(task.archivedAt).toBeNull()

    const stored = await db.tasks.get(task.id)
    expect(stored).toBeDefined()
    expect(stored!.title).toBe('Test task')
  })

  it('completeTask updates status to completed and sets completedAt', async () => {
    const task = await createTask({ title: 'Complete me' })

    await completeTask(task.id)

    const stored = await db.tasks.get(task.id)
    expect(stored!.status).toBe('completed')
    expect(stored!.completedAt).toBeInstanceOf(Date)
  })

  it('uncompleteTask reverts status to active and clears completedAt', async () => {
    const task = await createTask({ title: 'Uncomplete me' })
    await completeTask(task.id)

    await uncompleteTask(task.id)

    const stored = await db.tasks.get(task.id)
    expect(stored!.status).toBe('active')
    expect(stored!.completedAt).toBeNull()
  })

  it('deleteTask removes the task from the database', async () => {
    const task = await createTask({ title: 'Delete me' })

    await deleteTask(task.id)

    const stored = await db.tasks.get(task.id)
    expect(stored).toBeUndefined()
  })

  it('deleteTask also removes all subtasks', async () => {
    const parent = await createTask({ title: 'Parent task' })
    await createTask({ title: 'Subtask 1', parentId: parent.id })
    await createTask({ title: 'Subtask 2', parentId: parent.id })

    await deleteTask(parent.id)

    const remaining = await db.tasks.toArray()
    expect(remaining).toHaveLength(0)
  })

  it('archiveTask updates status to archived and sets archivedAt', async () => {
    const task = await createTask({ title: 'Archive me' })

    await archiveTask(task.id)

    const stored = await db.tasks.get(task.id)
    expect(stored!.status).toBe('archived')
    expect(stored!.archivedAt).toBeInstanceOf(Date)
  })

  it('unarchiveTask reverts status to active and clears archivedAt', async () => {
    const task = await createTask({ title: 'Unarchive me' })
    await archiveTask(task.id)

    await unarchiveTask(task.id)

    const stored = await db.tasks.get(task.id)
    expect(stored!.status).toBe('active')
    expect(stored!.archivedAt).toBeNull()
  })

  it('updateTask modifies specified fields', async () => {
    const task = await createTask({ title: 'Original title' })

    await updateTask(task.id, { title: 'Updated title', description: 'New desc' })

    const stored = await db.tasks.get(task.id)
    expect(stored!.title).toBe('Updated title')
    expect(stored!.description).toBe('New desc')
  })
})
