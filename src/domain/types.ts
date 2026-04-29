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
}
