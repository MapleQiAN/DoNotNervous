import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '../../db'
import { createMoodEntry } from '../useMoodEntries'

describe('createMoodEntry', () => {
  beforeEach(async () => {
    await db.moodEntries.clear()
  })

  it('writes a MoodEntry to db.moodEntries with valid input', async () => {
    const entry = await createMoodEntry({
      emoji: '😊',
      journal: 'Feeling great!',
      taskId: 'task-123',
    })

    expect(entry.id).toBeDefined()
    expect(entry.emoji).toBe('😊')
    expect(entry.label).toBe('happy')
    expect(entry.journal).toBe('Feeling great!')
    expect(entry.taskId).toBe('task-123')
    expect(entry.createdAt).toBeInstanceOf(Date)

    const stored = await db.moodEntries.get(entry.id)
    expect(stored).toBeDefined()
    expect(stored!.emoji).toBe('😊')
  })

  it('throws Zod error for invalid emoji', async () => {
    await expect(
      createMoodEntry({ emoji: '🤖', journal: '' })
    ).rejects.toThrow()
  })

  it('succeeds with taskId=null for standalone mood entries', async () => {
    const entry = await createMoodEntry({
      emoji: '😌',
      journal: 'Calm morning',
      taskId: null,
    })

    expect(entry.taskId).toBeNull()
  })

  it('succeeds with empty journal', async () => {
    const entry = await createMoodEntry({
      emoji: '😐',
      journal: '',
    })

    expect(entry.journal).toBe('')
  })

  it('throws when journal exceeds 280 characters', async () => {
    const longJournal = 'a'.repeat(281)

    await expect(
      createMoodEntry({ emoji: '😊', journal: longJournal })
    ).rejects.toThrow()
  })

  it('defaults taskId to null when omitted', async () => {
    const entry = await createMoodEntry({
      emoji: '🥳',
      journal: '',
    })

    expect(entry.taskId).toBeNull()
  })

  it('derives label from MOODS lookup', async () => {
    const entry = await createMoodEntry({
      emoji: '💪',
      journal: '',
    })

    expect(entry.label).toBe('strong')
  })
})
