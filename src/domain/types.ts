export type TaskType = 'simple' | 'category'
export type TaskStatus = 'active' | 'completed' | 'archived'
export type TaskDifficulty = 'easy' | 'medium' | 'hard'

export interface Task {
  id: string
  type: TaskType
  parentId: string | null
  title: string
  description: string
  status: TaskStatus
  difficulty: TaskDifficulty
  category: string
  sortOrder: number
  createdAt: Date
  completedAt: Date | null
  archivedAt: Date | null
}

export type PointTransactionType = 'task_complete' | 'streak_bonus' | 'reward_spent' | 'adjustment'

export interface PointLedgerEntry {
  id: string
  amount: number
  type: PointTransactionType
  reason: string
  taskId: string | null
  streakLength: number
  multiplier: number
  createdAt: Date
}

export interface StreakRecord {
  date: string // YYYY-MM-DD format, primary key
  completedTaskIds: string[]
  freezeUsed: boolean
  freezeCountRemaining: number
  createdAt: Date
  recoveredFrom?: boolean       // true if this gap day was recovered via earn-back
  recoveryTaskId?: string | null // taskId of the extra task that triggered recovery
}

export type MoodEmoji = '😊' | '😌' | '😐' | '😔' | '😰' | '😡' | '🥳' | '💪'

export interface MoodEntry {
  id: string
  emoji: MoodEmoji
  label: string
  journal: string
  taskId: string | null
  createdAt: Date
}

export interface Reward {
  id: string
  name: string
  description: string
  pointCost: number
  icon: string
  active: boolean
  createdAt: Date
}

export interface Redemption {
  id: string
  rewardId: string
  rewardName: string
  pointsSpent: number
  createdAt: Date
}

export interface DailySummary {
  id: string
  date: string // YYYY-MM-DD, primary key
  tasksCompleted: number
  tasksCreated: number
  pointsEarned: number
  pointsSpent: number
  dominantMood: MoodEmoji | null
  dominantMoodScore: number
  taskIds: string[]
  moodEntryIds: string[]
  ledgerEntryIds: string[]
  redemptionIds: string[]
  computedAt: Date
}

export interface WeeklySummary {
  id: string
  weekStart: string // YYYY-MM-DD Monday, primary key
  weekEnd: string // YYYY-MM-DD Sunday
  totalTasksCompleted: number
  totalTasksCreated: number
  totalPointsEarned: number
  totalPointsSpent: number
  avgMoodScore: number
  streakDays: number
  completionRate: number
  bestDayDate: string | null
  bestDayScore: number
  bestDayTaskCount: number
  userBestDayOverride: string | null
  dailyBreakdown: Array<{
    date: string
    tasksCompleted: number
    pointsEarned: number
    moodScore: number
    compositeScore: number
  }>
  computedAt: Date
}

export interface SyncQueueEntry {
  id: string
  tableName: string
  operation: 'insert' | 'update' | 'delete'
  data: unknown
  updatedAt: string
}
