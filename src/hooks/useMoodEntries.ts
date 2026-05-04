import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { generateId } from '../lib/id'
import { moodCreateSchema, MOODS } from '../domain/mood'
import type { MoodEntry } from '../domain/types'

export async function createMoodEntry(input: unknown): Promise<MoodEntry> {
  const validated = moodCreateSchema.parse(input)

  const moodMeta = MOODS.find((m) => m.emoji === validated.emoji)
  const label = moodMeta?.label ?? ''

  const entry: MoodEntry = {
    id: generateId(),
    emoji: validated.emoji,
    label,
    journal: validated.journal,
    taskId: validated.taskId ?? null,
    createdAt: new Date(),
  }

  await db.moodEntries.add(entry)
  return entry
}

export function useMoodEntries(): MoodEntry[] {
  return useLiveQuery(
    async () => db.moodEntries.orderBy('createdAt').reverse().toArray(),
    [],
    []
  )
}

export function useMoodEntriesForTask(taskId: string): MoodEntry[] {
  return useLiveQuery(
    async () => db.moodEntries.where('taskId').equals(taskId).toArray(),
    [taskId],
    []
  )
}

export function useMoodEntriesForDate(dayKey: string): MoodEntry[] {
  return useLiveQuery(
    async () => {
      const start = new Date(dayKey + 'T00:00:00')
      const end = new Date(dayKey + 'T23:59:59.999')
      const entries = await db.moodEntries
        .where('createdAt')
        .between(start, end, true, true)
        .toArray()
      return entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    },
    [dayKey],
    []
  )
}
