import { cn } from '../../lib/cn'
import type { TaskDifficulty } from '../../domain/types'

interface DifficultyBadgeProps {
  difficulty: TaskDifficulty
}

const difficultyConfig: Record<TaskDifficulty, { label: string; className: string }> = {
  easy: {
    label: 'Easy',
    className: 'bg-sage-100 text-sage-500',
  },
  medium: {
    label: 'Medium',
    className: 'bg-amber-500/20 text-amber-500',
  },
  hard: {
    label: 'Hard',
    className: 'bg-coral-500/20 text-coral-500',
  },
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const config = difficultyConfig[difficulty]

  return (
    <span
      className={cn(
        'inline-block text-sm font-semibold px-2 py-0.5 rounded-full',
        config.className
      )}
    >
      {config.label}
    </span>
  )
}
