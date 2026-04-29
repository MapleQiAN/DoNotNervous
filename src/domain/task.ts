import { z } from 'zod'

export const taskCreateSchema = z.object({
  title: z.string().min(1, 'Task title is required').max(200, 'Title too long'),
  description: z.string().max(1000).default(''),
  type: z.enum(['simple', 'category']).default('simple'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  category: z.string().max(50).default(''),
  parentId: z.string().nullable().optional(),
})

export type TaskCreateInput = z.infer<typeof taskCreateSchema>
