import { cn } from '../../lib/cn'
import type { TaskDifficulty } from '../../domain/types'

interface DifficultyBadgeProps {
  difficulty: TaskDifficulty
}

const difficultyConfig: Record<TaskDifficulty, { label: string; english: string; className: string }> = {
  easy: {
    label: '低优先级',
    english: 'Easy',
    className: 'bg-green-50 text-green-700',
  },
  medium: {
    label: '中优先级',
    english: 'Medium',
    className: 'bg-orange-50 text-orange-600',
  },
  hard: {
    label: '高优先级',
    english: 'Hard',
    className: 'bg-red-50 text-red-600',
  },
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const config = difficultyConfig[difficulty]

  return (
    <span
      className={cn(
        'inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold',
        config.className
      )}
    >
      <span className="sr-only">{config.english}</span>
      {config.label}
    </span>
  )
}
