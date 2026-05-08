import { useState } from 'react'
import { useActiveTasks } from '../../hooks/useTaskQueries'
import { CalendarClock, CheckCircle2, ChevronDown, Leaf, X } from 'lucide-react'
import { completeTask } from '../../hooks/useTaskActions'
import { useUIStore } from '../../stores/uiStore'
import type { Task, TaskDifficulty } from '../../domain/types'

interface DetailModel {
  title: string
  difficulty: TaskDifficulty
  time: string
  reward: number
  mood: string
  note: string
  task?: Task
}

const fallbackDetail: DetailModel = {
  title: '完成项目方案初稿',
  difficulty: 'hard',
  time: '今天 10:00',
  reward: 35,
  mood: '专注',
  note: '先梳理核心思路，再完善细节和数据部分。',
}

const moods = [
  { icon: '😊', label: '开心' },
  { icon: '😌', label: '平静' },
  { icon: '😊', label: '专注' },
  { icon: '😆', label: '期待' },
  { icon: '☺️', label: '放松' },
  { icon: '😟', label: '低落' },
]

function rewardFor(task: Task) {
  if (task.difficulty === 'hard') return 35
  if (task.difficulty === 'medium') return 20
  return 10
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

function taskToDetail(task: Task): DetailModel {
  return {
    title: task.title,
    difficulty: task.difficulty,
    time: '今天 10:00',
    reward: rewardFor(task),
    mood: task.category || '专注',
    note: task.description || '先梳理核心思路，再完善细节和数据部分。',
    task,
  }
}

export function TaskDetailPanel() {
  const [activeMood, setActiveMood] = useState('专注')
  const selectedTaskId = useUIStore((s) => s.selectedTaskId)

  const activeTasks = useActiveTasks()

  const selectedTask = selectedTaskId
    ? activeTasks.find((task) => task.id === selectedTaskId)
    : activeTasks.find((task) => task.parentId === null)

  const detail = selectedTask ? taskToDetail(selectedTask) : fallbackDetail

  const handleComplete = async () => {
    if (detail.task) await completeTask(detail.task.id)
  }

  return (
    <div className="task-detail-stack">
      <section className="side-panel task-detail-panel">
        <div className="panel-heading-row">
          <h2>任务详情</h2>
          <button type="button" className="panel-icon-button" aria-label="关闭任务详情">
            <X size={18} />
          </button>
        </div>

        <dl className="detail-list">
          <div>
            <dt>任务名称</dt>
            <dd>{detail.title}</dd>
          </div>
          <div>
            <dt>优先级</dt>
            <dd><span className={`soft-pill ${difficultyTone(detail.difficulty)}`}>{difficultyLabel(detail.difficulty)}</span></dd>
          </div>
          <div>
            <dt>截止时间</dt>
            <dd className="detail-icon-value"><CalendarClock size={15} /> {detail.time}</dd>
          </div>
          <div>
            <dt>奖励金额</dt>
            <dd className="detail-reward">+ ¥{detail.reward}</dd>
          </div>
          <div>
            <dt>心情标签</dt>
            <dd>
              <button type="button" className="detail-select">
                {detail.mood} <ChevronDown size={15} />
              </button>
            </dd>
          </div>
          <div className="detail-note-row">
            <dt>备注</dt>
            <dd>{detail.note}</dd>
          </div>
        </dl>
      </section>

      <section className="side-panel mood-complete-panel">
        <h2>今天完成时的心情</h2>
        <p>记录此刻的心情，帮助自己更好地觉察与成长。</p>
        <div className="completion-mood-grid" aria-label="选择心情">
          {moods.map((mood) => (
            <button
              key={mood.label}
              type="button"
              className={activeMood === mood.label ? 'is-active' : ''}
              onClick={() => setActiveMood(mood.label)}
            >
              <span>{mood.icon}</span>
              <em>{mood.label}</em>
            </button>
          ))}
        </div>
        <label className="mood-note-field">
          <span>想对自己说点什么...</span>
          <textarea maxLength={200} />
          <em>0/200</em>
        </label>
        <button type="button" className="primary-wide task-complete-button" onClick={() => void handleComplete()}>
          <CheckCircle2 size={19} /> 完成任务
        </button>
      </section>

      <section className="quote-card task-quote-card">
        <Leaf size={34} />
        <div>
          <p>不必追赶别人的节奏，</p>
          <p>你有自己的时区，一切都刚刚好。</p>
          <span>— 温柔的自己</span>
        </div>
      </section>
    </div>
  )
}
