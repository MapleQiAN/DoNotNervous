import { useState } from 'react'
import {
  CalendarCheck,
  CalendarClock,
  ChevronUp,
  Check,
  CheckCircle2,
  Grid2X2,
  Leaf,
  ListChecks,
  Sun,
} from 'lucide-react'
import { useActiveTasks, useCompletedTasksForDate } from '../../hooks/useTaskQueries'
import { completeTask } from '../../hooks/useTaskActions'
import { useFilterStore } from '../../stores/filterStore'
import { useTaskCount } from '../../hooks/useTaskCount'
import { useUIStore } from '../../stores/uiStore'
import type { Task, TaskDifficulty } from '../../domain/types'

type RowTone = 'tone-focus' | 'tone-hope' | 'tone-energy' | 'tone-calm' | 'tone-relax'

interface TaskRowModel {
  id: string
  title: string
  difficulty: TaskDifficulty
  deadline: string
  reward: number
  mood: string
  tone: RowTone
  completed?: boolean
  task?: Task
}

const fallbackToday: TaskRowModel[] = [
  { id: 'demo-today-1', title: '完成项目方案初稿', difficulty: 'hard', deadline: '今天 10:00 截止', reward: 35, mood: '专注', tone: 'tone-focus' },
  { id: 'demo-today-2', title: '与团队同步需求', difficulty: 'medium', deadline: '今天 14:00 截止', reward: 20, mood: '期待', tone: 'tone-hope' },
  { id: 'demo-today-3', title: '阅读 20 页', difficulty: 'easy', deadline: '今天 21:30 截止', reward: 10, mood: '平静', tone: 'tone-calm' },
  { id: 'demo-today-4', title: '睡前记录心情', difficulty: 'easy', deadline: '今天 22:30 截止', reward: 10, mood: '放松', tone: 'tone-relax' },
]

const weeklyPlan: TaskRowModel[] = [
  { id: 'demo-week-1', title: '健身 30 分钟（每周 ≥ 3 次）', difficulty: 'hard', deadline: '本周日 截止', reward: 15, mood: '活力', tone: 'tone-energy' },
  { id: 'demo-week-2', title: '整理桌面和文件', difficulty: 'medium', deadline: '本周六 截止', reward: 10, mood: '期待', tone: 'tone-hope' },
  { id: 'demo-week-3', title: '学习心理学课程一节', difficulty: 'easy', deadline: '本周日 截止', reward: 15, mood: '平静', tone: 'tone-calm' },
]

const fallbackCompleted: TaskRowModel[] = [
  { id: 'demo-done-1', title: '喝够 8 杯水', difficulty: 'easy', deadline: '今天 09:00 完成', reward: 5, mood: '活力', tone: 'tone-energy', completed: true },
  { id: 'demo-done-2', title: '冥想 10 分钟', difficulty: 'easy', deadline: '今天 08:30 完成', reward: 5, mood: '平静', tone: 'tone-calm', completed: true },
]

function difficultyLabel(difficulty: TaskDifficulty) {
  if (difficulty === 'hard') return '高优先级'
  if (difficulty === 'medium') return '中优先级'
  return '低优先级'
}

function difficultyTone(difficulty: TaskDifficulty) {
  if (difficulty === 'hard') return 'tone-danger'
  if (difficulty === 'medium') return 'tone-blue'
  return 'tone-green'
}

function rewardFor(task: Task) {
  if (task.difficulty === 'hard') return 35
  if (task.difficulty === 'medium') return 20
  return 10
}

function taskToRow(task: Task, index: number, completed = false): TaskRowModel {
  const moods: Array<Pick<TaskRowModel, 'mood' | 'tone'>> = [
    { mood: '专注', tone: 'tone-focus' },
    { mood: '期待', tone: 'tone-hope' },
    { mood: '平静', tone: 'tone-calm' },
    { mood: '放松', tone: 'tone-relax' },
  ]
  return {
    id: task.id,
    title: task.title,
    difficulty: task.difficulty,
    deadline: completed ? `今天 ${index === 0 ? '09:00' : '08:30'} 完成` : `今天 ${['10:00', '14:00', '21:30', '22:30'][index % 4]} 截止`,
    reward: completed ? 5 : rewardFor(task),
    mood: task.category || moods[index % moods.length].mood,
    tone: task.category ? 'tone-focus' : moods[index % moods.length].tone,
    completed,
    task,
  }
}

interface TaskRowProps {
  row: TaskRowModel
  selected: boolean
  onSelect: () => void
}

function TaskRow({ row, selected, onSelect }: TaskRowProps) {
  const handleComplete = async () => {
    onSelect()
    if (row.task && !row.completed) await completeTask(row.task.id)
  }

  return (
    <div className={`task-row screenshot-row ${row.completed ? 'is-completed' : ''} ${selected ? 'is-selected' : ''}`} onClick={onSelect}>
      <button
        type="button"
        className={row.completed || selected ? 'check-active' : 'check-muted clickable'}
        aria-label={row.completed ? 'Task completed' : 'Complete task'}
        onClick={(event) => {
          event.stopPropagation()
          void handleComplete()
        }}
      >
        {row.completed || selected ? <Check size={15} strokeWidth={3} /> : <span />}
      </button>
      <span className="task-title">{row.title}</span>
      <span className={`soft-pill ${difficultyTone(row.difficulty)}`}>{difficultyLabel(row.difficulty)}</span>
      <span className="row-time"><CalendarClock size={15} /> {row.deadline}</span>
      <span className="reward-text">+ ¥{row.reward}</span>
      <span className={`status-pill ${row.tone}`}>{row.mood}</span>
    </div>
  )
}

export function TaskList() {
  const [showCompleted, setShowCompleted] = useState(true)
  const activeCategory = useFilterStore((s) => s.activeCategory)
  const taskCount = useTaskCount()
  const selectedTaskId = useUIStore((s) => s.selectedTaskId)
  const setSelectedTaskId = useUIStore((s) => s.setSelectedTaskId)

  const activeTasks = useActiveTasks()
  const todayKey = new Date().toISOString().slice(0, 10)
  const completedTasks = useCompletedTasksForDate(todayKey)

  const topLevelActiveTasks = activeTasks.filter((t) => t.parentId === null)
  const topLevelCompletedTasks = completedTasks.filter((t) => t.parentId === null)

  const filtered = activeCategory
    ? topLevelActiveTasks.filter((t) => t.category === activeCategory)
    : topLevelActiveTasks

  const todayRows = filtered.length > 0
    ? filtered.slice(0, 4).map((task, index) => taskToRow(task, index))
    : fallbackToday

  const completedRows = topLevelCompletedTasks.length > 0
    ? topLevelCompletedTasks.slice(0, 6).map((task, index) => taskToRow(task, index, true))
    : fallbackCompleted

  const firstRowId = todayRows[0]?.id ?? null
  const activeSelectedId = selectedTaskId ?? firstRowId

  return (
    <div className="task-page">
      <section className="hero-panel task-hero">
        <div className="hero-copy">
          <h1>今天也温柔地推进一下吧 <span><Leaf size={32} /></span></h1>
          <p>把大目标拆成小行动，给自己一点点成就感。</p>
        </div>
        <img className="hero-illustration notebook-illustration" src="/illustrations/task-hero.png" alt="" aria-hidden="true" />
      </section>

      <div className="section-title-row task-list-heading">
        <h2>我的任务清单</h2>
        <div className="view-toggle" aria-label="视图切换">
          <button type="button" className="is-active"><ListChecks size={18} /></button>
          <button type="button"><Grid2X2 size={17} /></button>
        </div>
      </div>

      {taskCount >= 3 && <div className="task-category-spacer" />}

      <section className="content-card grouped-list task-group-card">
        <div className="group-title">
          <span><Sun size={18} /> 今日任务（{todayRows.length}）</span>
          <ChevronUp size={17} />
        </div>
        <div className="table-list">
          {todayRows.map((row) => (
            <TaskRow
              key={row.id}
              row={row}
              selected={activeSelectedId === row.id}
              onSelect={() => setSelectedTaskId(row.task ? row.task.id : null)}
            />
          ))}
        </div>
      </section>

      <section className="content-card grouped-list task-group-card">
        <div className="group-title">
          <span><CalendarCheck size={18} /> 本周计划（{weeklyPlan.length}）</span>
          <ChevronUp size={17} />
        </div>
        <div className="table-list">
          {weeklyPlan.map((row) => (
            <TaskRow
              key={row.id}
              row={row}
              selected={false}
              onSelect={() => setSelectedTaskId(null)}
            />
          ))}
        </div>
      </section>

      <section className="content-card grouped-list task-group-card">
        <button
          type="button"
          onClick={() => setShowCompleted(!showCompleted)}
          className="group-title w-full"
        >
          <span><CheckCircle2 size={18} /> 已完成（{completedRows.length}）</span>
          <ChevronUp size={17} className={showCompleted ? '' : 'rotate-180'} />
        </button>
        {showCompleted && (
          <div className="table-list">
            {completedRows.map((row) => (
              <TaskRow
                key={row.id}
                row={row}
                selected={false}
                onSelect={() => setSelectedTaskId(row.task ? row.task.id : null)}
              />
            ))}
          </div>
        )}
      </section>

      <div className="gentle-footer task-gentle-footer">
        <Leaf size={20} />
        <span>你正在成为更稳定、更温柔的自己。慢慢来，比较快。</span>
        <span className="heart-mark">♥</span>
      </div>
    </div>
  )
}
