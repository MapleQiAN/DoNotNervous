import { useState, useCallback } from 'react'
import { ChevronDown, PlusCircle } from 'lucide-react'
import { createTask } from '../../hooks/useTaskActions'
import { taskCreateSchema } from '../../domain/task'
import { useUIStore } from '../../stores/uiStore'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { Textarea } from '../common/Textarea'
import type { TaskDifficulty } from '../../domain/types'

interface SubtaskDraft {
  id: number
  title: string
}

export function TaskInput() {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [difficulty, setDifficulty] = useState<TaskDifficulty>('medium')
  const [description, setDescription] = useState('')
  const [subtaskInput, setSubtaskInput] = useState('')
  const [subtasks, setSubtasks] = useState<readonly SubtaskDraft[]>([])
  const [error, setError] = useState('')

  const isMoreOptionsOpen = useUIStore((s) => s.isMoreOptionsOpen)
  const setMoreOptionsOpen = useUIStore((s) => s.setMoreOptionsOpen)

  const addSubtask = useCallback(() => {
    const trimmed = subtaskInput.trim()
    if (trimmed.length === 0) return
    setSubtasks((prev) => [
      ...prev,
      { id: Date.now(), title: trimmed },
    ])
    setSubtaskInput('')
  }, [subtaskInput])

  const removeSubtask = useCallback((id: number) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const handleSubmit = useCallback(async () => {
    const trimmedTitle = title.trim()
    if (trimmedTitle.length === 0) {
      setError('请先写下任务名称')
      return
    }

    try {
      const validated = taskCreateSchema.parse({
        title: trimmedTitle,
        description,
        category: category || undefined,
        difficulty,
      })

      const parentTask = await createTask(validated)

      for (const subtask of subtasks) {
        await createTask({
          ...validated,
          title: subtask.title,
          parentId: parentTask.id,
        })
      }

      setTitle('')
      setCategory('')
      setDifficulty('medium')
      setDescription('')
      setSubtasks([])
      setSubtaskInput('')
      setError('')
      setMoreOptionsOpen(false)
    } catch (err) {
      if (err && typeof err === 'object' && 'issues' in err) {
        const zodError = err as { issues: Array<{ message: string }> }
        setError(zodError.issues[0]?.message ?? '输入内容不完整')
      } else {
        setError('创建任务失败')
      }
    }
  }, [title, description, category, difficulty, subtasks, setMoreOptionsOpen])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        void handleSubmit()
      }
    },
    [handleSubmit]
  )

  const handleSubtaskKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        addSubtask()
      }
    },
    [addSubtask]
  )

  return (
    <div className="quick-card task-input-card">
      <h3>快速添加任务 ✨</h3>
      <div className="space-y-3">
        <div>
          <Input
            placeholder="输入任务名称..."
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (error) setError('')
            }}
            onKeyDown={handleKeyDown}
            error={error}
          />
        </div>

      <button
        type="button"
        className="flex min-h-[36px] items-center gap-1 text-sm text-text-secondary transition-colors hover:text-text-primary"
        onClick={() => setMoreOptionsOpen(!isMoreOptionsOpen)}
      >
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isMoreOptionsOpen ? 'rotate-180' : ''}`}
        />
        更多设置
      </button>

      {isMoreOptionsOpen && (
        <div className="mt-3 space-y-3">
          <Input
            placeholder="分类，例如：工作、健康"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <div>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <Button
                  key={level}
                  variant={difficulty === level ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setDifficulty(level)}
                >
                  {level === 'easy' ? '低优先级' : level === 'medium' ? '中优先级' : '高优先级'}
                </Button>
              ))}
            </div>
          </div>

          <Textarea
            placeholder="备注（可选）"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="添加子任务..."
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  onKeyDown={handleSubtaskKeyDown}
                />
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={addSubtask}
                type="button"
              >
                添加
              </Button>
            </div>
            {subtasks.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {subtasks.map((subtask) => (
                  <span
                    key={subtask.id}
                    className="inline-flex items-center gap-1 bg-cream-100 text-text-primary text-sm px-2 py-1 rounded-full"
                  >
                    {subtask.title}
                    <button
                      type="button"
                      className="text-text-secondary hover:text-coral-500 transition-colors cursor-pointer"
                      onClick={() => removeSubtask(subtask.id)}
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <Button variant="primary" onClick={() => void handleSubmit()} className="w-full bg-sage-500 hover:bg-sage-600">
        添加任务 <PlusCircle size={17} />
      </Button>
      </div>
    </div>
  )
}
