import { useState, useCallback } from 'react'
import { ChevronDown } from 'lucide-react'
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
      setError('Task title is required')
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
        setError(zodError.issues[0]?.message ?? 'Invalid input')
      } else {
        setError('Failed to create task')
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
    <div className="bg-cream-50 rounded-xl p-4 mb-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="What would you like to do?"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              if (error) setError('')
            }}
            onKeyDown={handleKeyDown}
            error={error}
          />
        </div>
        <Button variant="primary" onClick={() => void handleSubmit()}>
          Add Task
        </Button>
      </div>

      <button
        type="button"
        className="flex items-center gap-1 mt-2 text-sm text-text-secondary hover:text-text-primary transition-colors min-h-[44px] cursor-pointer"
        onClick={() => setMoreOptionsOpen(!isMoreOptionsOpen)}
      >
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isMoreOptionsOpen ? 'rotate-180' : ''}`}
        />
        More options
      </button>

      {isMoreOptionsOpen && (
        <div className="mt-3 space-y-3">
          <Input
            placeholder="Type a category name..."
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
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <Textarea
            placeholder="Add a note (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Add a subtask..."
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
                Add
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
    </div>
  )
}
