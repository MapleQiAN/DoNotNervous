import { useState } from 'react'
import {
  CalendarClock,
  ChevronUp,
  Check,
  CheckCircle2,
  Grid2X2,
  Leaf,
  ListChecks,
  Pencil,
  Plus,
  Sun,
  Trash2,
  X,
} from 'lucide-react'
import { useActiveTasks, useCompletedTasksForDate } from '../../hooks/useTaskQueries'
import { completeTask, createTask, deleteTask, updateTask } from '../../hooks/useTaskActions'
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
  parentOptions: Task[]
}

const inputStyle: React.CSSProperties = {
  padding: '6px 10px', borderRadius: 8, border: '1px solid var(--color-border)',
  background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', fontSize: 14,
}
const selectStyle: React.CSSProperties = {
  padding: '6px 8px', borderRadius: 8, border: '1px solid var(--color-border)',
  background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)', fontSize: 13,
}

function TaskRow({ row, selected, onSelect }: TaskRowProps) {
  const [mode, setMode] = useState<'view' | 'edit' | 'delete'>('view')
  const [editTitle, setEditTitle] = useState(row.title)
  const [editDifficulty, setEditDifficulty] = useState(row.difficulty)
  const [editDescription, setEditDescription] = useState(row.task?.description ?? '')
  const [editCategory, setEditCategory] = useState(row.task?.category ?? '')
  const [saving, setSaving] = useState(false)

  const handleComplete = async () => {
    onSelect()
    if (row.task && !row.completed) await completeTask(row.task.id)
  }

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditTitle(row.title)
    setEditDifficulty(row.difficulty)
    setEditDescription(row.task?.description ?? '')
    setEditCategory(row.task?.category ?? '')
    setMode('edit')
  }

  const handleSave = async () => {
    if (!row.task || saving) return
    setSaving(true)
    try {
      await updateTask(row.task.id, {
        title: editTitle.trim(),
        difficulty: editDifficulty,
        description: editDescription,
        category: editCategory,
      })
      setMode('view')
    } catch {
      // keep edit open on error
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!row.task) return
    await deleteTask(row.task.id)
  }

  if (mode === 'delete') {
    return (
      <div className="task-row screenshot-row" style={{ justifyContent: 'center', gap: 12, padding: '10px 12px', background: 'var(--color-danger-bg, #fef2f2)' }}>
        <span style={{ color: 'var(--color-danger, #ef4444)', fontSize: 14 }}>确定删除「{row.title}」吗？此操作不可撤销。</span>
        <button
          type="button"
          onClick={handleDelete}
          style={{ padding: '4px 12px', borderRadius: 8, background: '#ef4444', color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}
        >
          确认删除
        </button>
        <button
          type="button"
          onClick={() => setMode('view')}
          style={{ padding: '4px 12px', borderRadius: 8, background: 'var(--color-border)', color: 'var(--color-text-primary)', fontSize: 13, border: 'none', cursor: 'pointer' }}
        >
          取消
        </button>
      </div>
    )
  }

  if (mode === 'edit') {
    return (
      <div className="task-row screenshot-row" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8, padding: '10px 12px' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ ...inputStyle, flex: 1 }} autoFocus />
          <select value={editDifficulty} onChange={(e) => setEditDifficulty(e.target.value as TaskDifficulty)} style={selectStyle}>
            <option value="easy">简单 +¥10</option>
            <option value="medium">中等 +¥20</option>
            <option value="hard">困难 +¥35</option>
          </select>
        </div>
        <input type="text" value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="描述（可选）" style={inputStyle} />
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="text" value={editCategory} onChange={(e) => setEditCategory(e.target.value)} placeholder="分类（可选，如：工作、学习）" style={{ ...inputStyle, flex: 1 }} />
          <button type="button" onClick={handleSave} disabled={saving || !editTitle.trim()} style={{
            padding: '6px 14px', borderRadius: 8, background: 'var(--color-accent)', color: '#fff',
            fontSize: 13, fontWeight: 600, border: 'none', cursor: saving ? 'wait' : 'pointer',
            opacity: saving || !editTitle.trim() ? 0.5 : 1,
          }}>
            {saving ? '...' : '保存'}
          </button>
          <button type="button" onClick={() => setMode('view')} style={{
            padding: '6px 14px', borderRadius: 8, background: 'var(--color-border)', color: 'var(--color-text-primary)',
            fontSize: 13, border: 'none', cursor: 'pointer',
          }}>
            取消
          </button>
        </div>
      </div>
    )
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
      {!row.completed && (
        <div className="task-row-actions">
          <button type="button" className="task-action-btn" aria-label="编辑任务" onClick={startEdit}>
            <Pencil size={14} />
          </button>
          <button
            type="button"
            className="task-action-btn task-action-danger"
            aria-label="删除任务"
            onClick={(e) => { e.stopPropagation(); setMode('delete') }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

export function TaskList() {
  const [showCompleted, setShowCompleted] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showExtraFields, setShowExtraFields] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDifficulty, setNewDifficulty] = useState<TaskDifficulty>('medium')
  const [newDescription, setNewDescription] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [newParentId, setNewParentId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
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

  const todayRows = filtered.map((task, index) => taskToRow(task, index))
  const completedRows = topLevelCompletedTasks.map((task, index) => taskToRow(task, index, true))

  const firstRowId = todayRows[0]?.id ?? null
  const activeSelectedId = selectedTaskId ?? firstRowId

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTitle.trim() || adding) return
    setAdding(true)
    try {
      await createTask({
        title: newTitle.trim(),
        difficulty: newDifficulty,
        description: newDescription,
        category: newCategory,
        parentId: newParentId,
      })
      setNewTitle('')
      setNewDescription('')
      setNewCategory('')
      setNewParentId(null)
      setShowAddForm(false)
      setShowExtraFields(false)
    } catch {
      // error handled silently, form stays open
    } finally {
      setAdding(false)
    }
  }

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
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="clickable"
            aria-label="添加任务"
            style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-accent)', fontSize: 14 }}
          >
            <Plus size={16} /> 添加
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddTask} style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="输入任务名称..."
                autoFocus
                style={{ ...inputStyle, flex: 1 }}
              />
              <select
                value={newDifficulty}
                onChange={(e) => setNewDifficulty(e.target.value as TaskDifficulty)}
                style={selectStyle}
              >
                <option value="easy">简单 +¥10</option>
                <option value="medium">中等 +¥20</option>
                <option value="hard">困难 +¥35</option>
              </select>
              <button
                type="submit"
                disabled={adding || !newTitle.trim()}
                style={{
                  padding: '6px 14px', borderRadius: 8, background: 'var(--color-accent)', color: '#fff',
                  fontSize: 13, fontWeight: 600, border: 'none', cursor: adding ? 'wait' : 'pointer',
                  opacity: adding || !newTitle.trim() ? 0.5 : 1,
                }}
              >
                {adding ? '...' : '添加'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                style={{
                  padding: '6px 8px', borderRadius: 8, background: 'var(--color-border)', color: 'var(--color-text-secondary)',
                  fontSize: 13, border: 'none', cursor: 'pointer',
                }}
                aria-label="关闭"
              >
                <X size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowExtraFields(!showExtraFields)}
              style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: 13, cursor: 'pointer', padding: '6px 0', marginTop: 4 }}
            >
              {showExtraFields ? '收起更多选项 ▲' : '更多选项 ▼'}
            </button>

            {showExtraFields && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="任务描述（可选）"
                  maxLength={1000}
                  rows={2}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="分类（可选，如：工作、学习）"
                    maxLength={50}
                    style={{ ...inputStyle, flex: 1 }}
                  />
                  <select
                    value={newParentId ?? ''}
                    onChange={(e) => setNewParentId(e.target.value || null)}
                    style={selectStyle}
                  >
                    <option value="">无父任务</option>
                    {topLevelActiveTasks.map((t) => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </form>
        )}

        <div className="table-list">
          {todayRows.length > 0 ? todayRows.map((row) => (
            <TaskRow
              key={row.id}
              row={row}
              selected={activeSelectedId === row.id}
              onSelect={() => setSelectedTaskId(row.task ? row.task.id : null)}
              parentOptions={topLevelActiveTasks}
            />
          )) : (
            <div className="summary-empty" style={{ padding: '20px 0', textAlign: 'center' }}>
              还没有任务，点击上方"添加"开始吧
            </div>
          )}
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
            {completedRows.length > 0 ? completedRows.map((row) => (
              <TaskRow
                key={row.id}
                row={row}
                selected={false}
                onSelect={() => setSelectedTaskId(row.task ? row.task.id : null)}
                parentOptions={topLevelActiveTasks}
              />
            )) : (
              <div className="summary-empty" style={{ padding: '20px 0', textAlign: 'center' }}>
                还没有完成的任务
              </div>
            )}
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
