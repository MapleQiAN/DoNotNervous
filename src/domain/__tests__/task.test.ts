import { describe, it, expect } from 'vitest'
import { taskCreateSchema } from '../task'

describe('taskCreateSchema', () => {
  it('accepts valid input with title only (defaults applied)', () => {
    const result = taskCreateSchema.parse({ title: 'Buy groceries' })
    expect(result.title).toBe('Buy groceries')
    expect(result.description).toBe('')
    expect(result.type).toBe('simple')
    expect(result.difficulty).toBe('medium')
    expect(result.category).toBe('')
  })

  it('rejects empty title', () => {
    expect(() => taskCreateSchema.parse({ title: '' })).toThrow()
  })

  it('rejects title longer than 200 characters', () => {
    const longTitle = 'a'.repeat(201)
    expect(() => taskCreateSchema.parse({ title: longTitle })).toThrow()
  })

  it('accepts optional description up to 1000 characters', () => {
    const result = taskCreateSchema.parse({
      title: 'Test task',
      description: 'a'.repeat(1000),
    })
    expect(result.description).toHaveLength(1000)
  })

  it('accepts all difficulty enum values', () => {
    const easy = taskCreateSchema.parse({ title: 'Test', difficulty: 'easy' })
    expect(easy.difficulty).toBe('easy')

    const medium = taskCreateSchema.parse({ title: 'Test', difficulty: 'medium' })
    expect(medium.difficulty).toBe('medium')

    const hard = taskCreateSchema.parse({ title: 'Test', difficulty: 'hard' })
    expect(hard.difficulty).toBe('hard')
  })

  it('rejects invalid difficulty value', () => {
    expect(() =>
      taskCreateSchema.parse({ title: 'Test', difficulty: 'extreme' })
    ).toThrow()
  })

  it('accepts category string up to 50 characters', () => {
    const result = taskCreateSchema.parse({
      title: 'Test task',
      category: 'Work',
    })
    expect(result.category).toBe('Work')

    const longCategory = taskCreateSchema.parse({
      title: 'Test task',
      category: 'a'.repeat(50),
    })
    expect(longCategory.category).toHaveLength(50)
  })

  it('accepts nullable parentId', () => {
    const withParent = taskCreateSchema.parse({
      title: 'Subtask',
      parentId: 'abc123',
    })
    expect(withParent.parentId).toBe('abc123')

    const withoutParent = taskCreateSchema.parse({
      title: 'Top task',
      parentId: null,
    })
    expect(withoutParent.parentId).toBeNull()
  })
})
