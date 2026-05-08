import { motion, AnimatePresence } from 'framer-motion'
import { useSubtasks } from '../../hooks/useTaskQueries'
import { completeTask, deleteTask } from '../../hooks/useTaskActions'
import type { Task } from '../../domain/types'

interface SubtaskListProps {
  parentId: string
}

export function SubtaskList({ parentId }: SubtaskListProps) {
  const subtasks = useSubtasks(parentId)

  if (subtasks.length === 0) return null

  return (
    <div className="ml-6 space-y-1 mt-1">
      <AnimatePresence mode="popLayout">
        {subtasks.map((subtask: Task) => (
          <SubtaskItem key={subtask.id} subtask={subtask} />
        ))}
      </AnimatePresence>
    </div>
  )
}

interface SubtaskItemProps {
  subtask: Task
}

function SubtaskItem({ subtask }: SubtaskItemProps) {
  const isCompleted = subtask.status === 'completed'

  const handleComplete = async () => {
    await completeTask(subtask.id)
  }

  const handleDelete = async () => {
    await deleteTask(subtask.id)
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, height: 0, marginTop: 0, marginBottom: 0 }}
      className="flex items-center gap-2 p-2 rounded-lg hover:bg-cream-100 transition-colors min-h-[44px]"
    >
      <button
        type="button"
        onClick={() => void handleComplete()}
        disabled={isCompleted}
        className="flex-shrink-0 cursor-pointer"
        aria-label={isCompleted ? 'Subtask completed' : 'Complete subtask'}
      >
        <div
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
            isCompleted
              ? 'bg-lavender-500 border-lavender-500'
              : 'border-border'
          }`}
        >
          {isCompleted && (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      </button>

      <span
        className={`flex-1 text-sm text-text-primary transition-all duration-300 ${
          isCompleted ? 'line-through opacity-60' : ''
        }`}
      >
        {subtask.title}
      </span>

      <button
        type="button"
        onClick={() => void handleDelete()}
        className="text-text-secondary hover:text-coral-500 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
        aria-label="Delete subtask"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </motion.div>
  )
}
