import { describe, it, expect } from 'vitest'
import type { MoodEntry, MoodEmoji } from '../types'
import { moodCreateSchema, MOODS } from '../mood'

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

describe('MOODS constant', () => {
  it('has exactly 8 entries', () => {
    expect(MOODS).toHaveLength(8)
  })

  it('contains emoji and label for each mood', () => {
    for (const mood of MOODS) {
      expect(mood.emoji).toBeTruthy()
      expect(mood.label).toBeTruthy()
    }
  })

  it('includes happy, calm, neutral, sad, anxious, angry, excited, strong labels', () => {
    const labels = MOODS.map((m) => m.label)
    expect(labels).toContain('happy')
    expect(labels).toContain('calm')
    expect(labels).toContain('neutral')
    expect(labels).toContain('sad')
    expect(labels).toContain('anxious')
    expect(labels).toContain('angry')
    expect(labels).toContain('excited')
    expect(labels).toContain('strong')
  })
})

describe('moodCreateSchema', () => {
  it('accepts valid emoji with all fields', () => {
    const result = moodCreateSchema.parse({
      emoji: '😊',
      journal: 'Feeling great!',
      taskId: 'task-123',
    })
    expect(result.emoji).toBe('😊')
    expect(result.journal).toBe('Feeling great!')
    expect(result.taskId).toBe('task-123')
  })

  it('accepts valid emoji with default journal and no taskId', () => {
    const result = moodCreateSchema.parse({ emoji: '😌' })
    expect(result.emoji).toBe('😌')
    expect(result.journal).toBe('')
    expect(result.taskId).toBeUndefined()
  })

  it('accepts taskId as null', () => {
    const result = moodCreateSchema.parse({
      emoji: '😐',
      journal: '',
      taskId: null,
    })
    expect(result.taskId).toBeNull()
  })

  it('accepts journal with exactly 280 characters', () => {
    const result = moodCreateSchema.parse({
      emoji: '😊',
      journal: 'a'.repeat(280),
    })
    expect(result.journal).toHaveLength(280)
  })

  it('rejects journal exceeding 280 characters', () => {
    expect(() =>
      moodCreateSchema.parse({
        emoji: '😊',
        journal: 'a'.repeat(281),
      })
    ).toThrow()
  })

  it('rejects invalid emoji', () => {
    expect(() =>
      moodCreateSchema.parse({
        emoji: '🤡',
        journal: '',
      })
    ).toThrow()
  })

  it('rejects missing emoji', () => {
    expect(() =>
      moodCreateSchema.parse({
        journal: 'test',
      })
    ).toThrow()
  })
})
