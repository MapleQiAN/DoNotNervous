import { describe, it, expect } from 'vitest'
import type { MoodEntry, MoodEmoji } from '../types'

// Type-level test helper: forces compile error if type doesn't match
function expectType<T>(_value: T): void {}

describe('MoodEmoji type', () => {
  it('accepts all 8 valid emoji values', () => {
    const emojis: MoodEmoji[] = ['😊', '😌', '😐', '😔', '😰', '😡', '🥳', '💪']
    expect(emojis).toHaveLength(8)
  })
})

describe('MoodEntry type', () => {
  it('compiles with all required fields', () => {
    const entry: MoodEntry = {
      id: 'test-id',
      emoji: '😊',
      label: 'happy',
      journal: 'Feeling great today!',
      taskId: null,
      createdAt: new Date(),
    }
    expectType<MoodEntry>(entry)
    expect(entry.emoji).toBe('😊')
    expect(entry.taskId).toBeNull()
  })

  it('accepts taskId=null for standalone mood entries', () => {
    const entry: MoodEntry = {
      id: 'test-id',
      emoji: '😌',
      label: 'calm',
      journal: '',
      taskId: null,
      createdAt: new Date(),
    }
    expect(entry.taskId).toBeNull()
  })

  it('accepts a taskId string for task-linked mood entries', () => {
    const entry: MoodEntry = {
      id: 'test-id',
      emoji: '💪',
      label: 'strong',
      journal: '',
      taskId: 'task-123',
      createdAt: new Date(),
    }
    expect(entry.taskId).toBe('task-123')
  })

  it('accepts empty journal string', () => {
    const entry: MoodEntry = {
      id: 'test-id',
      emoji: '😐',
      label: 'neutral',
      journal: '',
      taskId: null,
      createdAt: new Date(),
    }
    expect(entry.journal).toBe('')
  })

  it('accepts journal with exactly 280 characters', () => {
    const entry: MoodEntry = {
      id: 'test-id',
      emoji: '😊',
      label: 'happy',
      journal: 'a'.repeat(280),
      taskId: null,
      createdAt: new Date(),
    }
    expect(entry.journal).toHaveLength(280)
  })
})
