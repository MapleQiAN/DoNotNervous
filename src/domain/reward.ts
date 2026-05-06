import { z } from 'zod'

export const rewardCreateSchema = z.object({
  name: z.string().min(1, 'Reward name is required').max(100, 'Name too long'),
  description: z.string().max(500).default(''),
  pointCost: z.number().int('Point cost must be a whole number').min(1, 'Point cost must be at least 1'),
  icon: z.string().default('gift'),
})

export const rewardEditSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  pointCost: z.number().int().min(1).optional(),
  active: z.boolean().optional(),
})

export type RewardCreateInput = z.infer<typeof rewardCreateSchema>
export type RewardEditInput = z.infer<typeof rewardEditSchema>
