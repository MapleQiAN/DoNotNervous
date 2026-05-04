import { z } from 'zod'
import type { MoodEmoji } from './types'

export const MOODS: readonly { emoji: MoodEmoji; label: string }[] = [
  { emoji: '😊', label: 'happy' },
  { emoji: '😌', label: 'calm' },
  { emoji: '😐', label: 'neutral' },
  { emoji: '😔', label: 'sad' },
  { emoji: '😰', label: 'anxious' },
  { emoji: '😡', label: 'angry' },
  { emoji: '🥳', label: 'excited' },
  { emoji: '💪', label: 'strong' },
] as const

export const moodCreateSchema = z.object({
  emoji: z.enum(['😊', '😌', '😐', '😔', '😰', '😡', '🥳', '💪']),
  journal: z.string().max(280).default(''),
  taskId: z.string().nullable().optional(),
})

export type MoodCreateInput = z.infer<typeof moodCreateSchema>
