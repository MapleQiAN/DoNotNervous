export const taskKeys = {
  all: ['tasks'] as const,
  list: (filters?: Record<string, string>) => [...taskKeys.all, 'list', filters] as const,
  detail: (id: string) => [...taskKeys.all, 'detail', id] as const,
}

export const pointKeys = {
  all: ['points'] as const,
  balance: () => [...pointKeys.all, 'balance'] as const,
  transactions: (limit?: number) => [...pointKeys.all, 'transactions', limit] as const,
  recentIncome: (limit?: number) => [...pointKeys.all, 'recentIncome', limit] as const,
  weeklyIncome: () => [...pointKeys.all, 'weeklyIncome'] as const,
  forDate: (dayKey: string) => [...pointKeys.all, 'forDate', dayKey] as const,
}

export const streakKeys = {
  all: ['streaks'] as const,
  current: () => [...streakKeys.all, 'current'] as const,
  freezes: () => [...streakKeys.all, 'freezes'] as const,
  calendar: (year: number, month: number) => [...streakKeys.all, 'calendar', year, month] as const,
  earnBack: () => [...streakKeys.all, 'earnBack'] as const,
}

export const moodKeys = {
  all: ['mood'] as const,
  list: () => [...moodKeys.all, 'list'] as const,
  forDate: (dayKey: string) => [...moodKeys.all, 'forDate', dayKey] as const,
  forTask: (taskId: string) => [...moodKeys.all, 'forTask', taskId] as const,
  latest: () => [...moodKeys.all, 'latest'] as const,
}

export const rewardKeys = {
  all: ['rewards'] as const,
  active: () => [...rewardKeys.all, 'active'] as const,
  allRewards: () => [...rewardKeys.all, 'all'] as const,
  redemptions: () => [...rewardKeys.all, 'redemptions'] as const,
}

export const summaryKeys = {
  daily: (dayKey: string) => ['summary', 'daily', dayKey] as const,
  weekly: (weekStart: string) => ['summary', 'weekly', weekStart] as const,
  moodChart: (days: number) => ['summary', 'moodChart', days] as const,
}
