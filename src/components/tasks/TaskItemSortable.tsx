import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { TaskItem } from './TaskItem'
import type { Task } from '../../domain/types'

interface TaskItemSortableProps {
  task: Task
}

export function TaskItemSortable({ task }: TaskItemSortableProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-0 rounded-lg ${
        isDragging ? 'shadow-md scale-[1.02] opacity-90 z-50 bg-cream-50' : ''
      }`}
    >
      <div
        className="flex items-center justify-center cursor-grab active:cursor-grabbing text-text-secondary opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity min-h-[44px] min-w-[44px] w-6 h-6"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <TaskItem task={task} />
      </div>
    </div>
  )
}
