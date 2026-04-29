import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { db } from '../../db'
import { useFilterStore } from '../../stores/filterStore'
import { useTaskCount } from '../../hooks/useTaskCount'
import { TaskItem } from './TaskItem'
import { TaskItemSortable } from './TaskItemSortable'
import { CategoryFilter } from './CategoryFilter'
import { EmptyState } from '../common/EmptyState'

export function TaskList() {
  const [showCompleted, setShowCompleted] = useState(true)
  const activeCategory = useFilterStore((s) => s.activeCategory)
  const taskCount = useTaskCount()

  const activeTasks = useLiveQuery(
    () => db.tasks
      .where('status').equals('active')
      .sortBy('sortOrder'),
    [],
    []
  )

  const completedTasks = useLiveQuery(
    () => db.tasks
      .where('status').equals('completed')
      .reverse()
      .sortBy('completedAt'),
    [],
    []
  )

  const topLevelActiveTasks = activeTasks.filter((t) => t.parentId === null)
  const topLevelCompletedTasks = completedTasks.filter((t) => t.parentId === null)

  const filtered = activeCategory
    ? topLevelActiveTasks.filter((t) => t.category === activeCategory)
    : topLevelActiveTasks

  const hasNoTasks = topLevelActiveTasks.length === 0 && topLevelCompletedTasks.length === 0

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = filtered.findIndex((t) => t.id === active.id)
    const newIndex = filtered.findIndex((t) => t.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(filtered, oldIndex, newIndex)

    await db.transaction('rw', db.tasks, async () => {
      for (let i = 0; i < reordered.length; i++) {
        await db.tasks.update(reordered[i].id, { sortOrder: i })
      }
    })
  }

  if (hasNoTasks) {
    return (
      <EmptyState
        heading="Nothing here yet"
        body="Add your first task to get started. One small step counts."
      />
    )
  }

  return (
    <div>
      {taskCount >= 3 && <CategoryFilter />}

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={filtered.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((task) => (
              <TaskItemSortable key={task.id} task={task} />
            ))}
          </AnimatePresence>
        </SortableContext>
      </DndContext>

      {filtered.length === 0 && topLevelActiveTasks.length > 0 && (
        <p className="text-sm text-text-secondary text-center py-4">
          No tasks in this category.
        </p>
      )}

      {topLevelCompletedTasks.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors min-h-[44px] cursor-pointer"
          >
            {showCompleted ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            Completed ({topLevelCompletedTasks.length})
          </button>

          <AnimatePresence mode="popLayout">
            {showCompleted &&
              topLevelCompletedTasks.map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
