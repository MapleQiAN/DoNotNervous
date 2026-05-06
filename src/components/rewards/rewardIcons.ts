export const rewardIconKeys = [
  'book', 'clapperboard', 'coffee', 'gift',
  'lotus', 'piggy_bank', 'suitcase', 'team',
] as const

export type RewardIconKey = typeof rewardIconKeys[number]

export const rewardIconLabel: Record<RewardIconKey, string> = {
  book: '学习',
  clapperboard: '娱乐',
  coffee: '生活',
  gift: '礼物',
  lotus: '健康',
  piggy_bank: '储蓄',
  suitcase: '旅行',
  team: '社交',
}

export function getRewardIconSrc(key: string): string {
  return `/icons/${key}.png`
}

export const incomeTypeIcon: Record<string, RewardIconKey> = {
  task_complete: 'coffee',
  streak_bonus: 'gift',
  reward_spent: 'piggy_bank',
}
