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
