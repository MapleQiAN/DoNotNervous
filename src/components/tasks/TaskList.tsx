import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { AnimatePresence } from 'framer-motion'
import { CalendarDays, ChevronDown, ChevronUp, Grid2X2, Leaf, ListChecks } from 'lucide-react'
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
      <div className="content-card">
        <EmptyState
          heading="今天还没有任务"
          body="先写下一件小事。慢慢来，也是在往前走。"
        />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <section className="hero-panel task-hero">
        <div className="hero-copy">
          <h1>今天也温柔地推进一下吧 <span>🌿</span></h1>
          <p>把大目标拆成小行动，给自己一点点成就感。</p>
        </div>
        <img className="hero-illustration notebook-illustration" src="/illustrations/task-hero.png" alt="" aria-hidden="true" />
      </section>

      <div className="section-title-row">
        <h2>我的任务清单</h2>
        <div className="view-toggle" aria-label="视图切换">
          <button type="button" className="is-active"><ListChecks size={18} /></button>
          <button type="button"><Grid2X2 size={17} /></button>
        </div>
      </div>

      {taskCount >= 3 && <CategoryFilter />}

      <section className="content-card grouped-list">
        <div className="group-title">
          <span><Leaf size={18} /> 今日任务（{filtered.length}）</span>
          <ChevronUp size={17} />
        </div>

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
          <p className="py-4 text-center text-sm text-text-secondary">
            这个分类暂时没有任务。
          </p>
        )}
      </section>

      {topLevelCompletedTasks.length > 0 && (
        <section className="content-card grouped-list">
          <button
            type="button"
            onClick={() => setShowCompleted(!showCompleted)}
            className="group-title w-full"
          >
            <span><CalendarDays size={18} /> 已完成（{topLevelCompletedTasks.length}）</span>
            {showCompleted ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
          </button>

          <AnimatePresence mode="popLayout">
            {showCompleted &&
              topLevelCompletedTasks.slice(0, 6).map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
          </AnimatePresence>
        </section>
      )}

      <div className="gentle-footer">
        <Leaf size={20} />
        <span>你正在成为更稳定、更温柔的自己。慢慢来，比较快。</span>
      </div>
    </div>
  )
}
