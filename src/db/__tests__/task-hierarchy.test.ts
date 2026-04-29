import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../index'
import { createTask, deleteTask, completeTask } from '../../hooks/useTaskActions'

describe('task hierarchy', () => {
  beforeEach(async () => {
    await db.tasks.clear()
  })

  it('creates subtask with parentId referencing parent', async () => {
    const parent = await createTask({ title: 'Parent task', type: 'simple', difficulty: 'easy' })
    const subtask = await createTask({
      title: 'Subtask',
      type: 'simple',
      difficulty: 'easy',
      parentId: parent.id,
    })

    expect(subtask.parentId).toBe(parent.id)

    const children = await db.tasks.where('parentId').equals(parent.id).toArray()
    expect(children).toHaveLength(1)
    expect(children[0].id).toBe(subtask.id)
  })

  it('querying tasks by parentId returns only subtasks', async () => {
    const parent = await createTask({ title: 'Parent', type: 'simple', difficulty: 'easy' })
    await createTask({ title: 'Subtask 1', type: 'simple', difficulty: 'easy', parentId: parent.id })
    await createTask({ title: 'Subtask 2', type: 'simple', difficulty: 'easy', parentId: parent.id })
    await createTask({ title: 'Unrelated task', type: 'simple', difficulty: 'easy' })

    const children = await db.tasks.where('parentId').equals(parent.id).toArray()
    expect(children).toHaveLength(2)
    expect(children.every((c) => c.parentId === parent.id)).toBe(true)
  })

  it('deleting parent also deletes all child subtasks', async () => {
    const parent = await createTask({ title: 'Parent', type: 'simple', difficulty: 'easy' })
    await createTask({ title: 'Child 1', type: 'simple', difficulty: 'easy', parentId: parent.id })
    await createTask({ title: 'Child 2', type: 'simple', difficulty: 'easy', parentId: parent.id })

    await deleteTask(parent.id)

    const remaining = await db.tasks.toArray()
    expect(remaining).toHaveLength(0)
  })

  it('completing parent does not affect subtask status', async () => {
    const parent = await createTask({ title: 'Parent', type: 'simple', difficulty: 'easy' })
    const subtask = await createTask({
      title: 'Subtask',
      type: 'simple',
      difficulty: 'easy',
      parentId: parent.id,
    })

    await completeTask(parent.id)

    const updatedParent = await db.tasks.get(parent.id)
    const updatedSubtask = await db.tasks.get(subtask.id)

    expect(updatedParent?.status).toBe('completed')
    expect(updatedSubtask?.status).toBe('active')
  })

  it('querying top-level tasks (parentId === null) excludes subtasks', async () => {
    const parent = await createTask({ title: 'Parent', type: 'simple', difficulty: 'easy' })
    await createTask({ title: 'Subtask', type: 'simple', difficulty: 'easy', parentId: parent.id })
    await createTask({ title: 'Another top-level', type: 'simple', difficulty: 'easy' })

    const topLevel = await db.tasks
      .where('parentId').equals('')
      .toArray()

    const allTopLevel = (await db.tasks.toArray()).filter((t) => t.parentId === null)
    expect(allTopLevel).toHaveLength(2)
    expect(allTopLevel.every((t) => t.parentId === null)).toBe(true)
  })

  it('subtask has its own sortOrder independent of parent', async () => {
    const parent = await createTask({ title: 'Parent', type: 'simple', difficulty: 'easy' })
    const subtask = await createTask({
      title: 'Subtask',
      type: 'simple',
      difficulty: 'easy',
      parentId: parent.id,
    })

    expect(typeof subtask.sortOrder).toBe('number')
    expect(parent.sortOrder).toBeGreaterThanOrEqual(0)
    expect(subtask.sortOrder).toBeGreaterThanOrEqual(0)

    await db.tasks.update(subtask.id, { sortOrder: 99 })
    const updated = await db.tasks.get(subtask.id)
    expect(updated?.sortOrder).toBe(99)
  })
})
