import { useState, useCallback, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { MoreVertical, Pencil, Trash2, Archive, RotateCcw } from 'lucide-react'
import { completeTask, deleteTask, updateTask, archiveTask, unarchiveTask } from '../../hooks/useTaskActions'
import { DifficultyBadge } from '../common/DifficultyBadge'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { Input } from '../common/Input'
import { SubtaskList } from './SubtaskList'
import type { Task } from '../../domain/types'

interface TaskItemProps {
  task: Task
}

export function TaskItem({ task }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  const isCompleted = task.status === 'completed'
  const isArchived = task.status === 'archived'

  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [isEditing])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const handleComplete = useCallback(async () => {
    setIsCompleting(true)
    try {
      await completeTask(task.id)
    } catch {
      setIsCompleting(false)
    }
  }, [task.id])

  const handleDelete = useCallback(async () => {
    setShowDeleteConfirm(false)
    await deleteTask(task.id)
  }, [task.id])

  const handleEditSave = useCallback(async () => {
    const trimmed = editTitle.trim()
    if (trimmed.length === 0) return
    if (trimmed !== task.title) {
      await updateTask(task.id, { title: trimmed })
    }
    setIsEditing(false)
  }, [editTitle, task.id, task.title])

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        void handleEditSave()
      }
      if (e.key === 'Escape') {
        setEditTitle(task.title)
        setIsEditing(false)
      }
    },
    [handleEditSave, task.title]
  )

  const handleArchive = useCallback(async () => {
    await archiveTask(task.id)
    setShowMenu(false)
  }, [task.id])

  const handleUnarchive = useCallback(async () => {
    await unarchiveTask(task.id)
    setShowMenu(false)
  }, [task.id])

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, height: 0, marginTop: 0, marginBottom: 0 }}
        transition={
          isCompleting
            ? { duration: 0.3 }
            : { type: 'spring', stiffness: 400, damping: 30 }
        }
        className="flex items-center gap-3 p-3 rounded-lg hover:bg-cream-100 transition-colors min-h-[44px]"
      >
        {/* Checkbox */}
        <button
          type="button"
          onClick={() => void handleComplete()}
          disabled={isCompleted || isArchived}
          className="flex-shrink-0 cursor-pointer"
          aria-label={isCompleted ? 'Task completed' : 'Complete task'}
        >
          <motion.div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              isCompleted
                ? 'bg-lavender-500 border-lavender-500'
                : 'border-border'
            }`}
            animate={
              isCompleting
                ? { scale: [1, 1.2, 1] }
                : { scale: 1 }
            }
            transition={{ duration: 0.3 }}
          >
            {isCompleted && (
              <svg
                className="w-3.5 h-3.5 text-white"
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
          </motion.div>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <Input
              ref={editInputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleEditKeyDown}
              onBlur={() => void handleEditSave()}
            />
          ) : (
            <div>
              <span
                className={`text-base text-text-primary transition-all duration-300 ${
                  isCompleted ? 'line-through opacity-60' : ''
                }`}
              >
                {task.title}
              </span>
              {task.description && (
                <p className="text-sm text-text-secondary truncate">
                  {task.description}
                </p>
              )}
            </div>
          )}
          <SubtaskList parentId={task.id} />
        </div>

        {/* Difficulty badge */}
        <DifficultyBadge difficulty={task.difficulty} />

        {/* Action menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-cream-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Task actions"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 bg-cream-50 border border-border rounded-lg shadow-lg z-10 py-1 min-w-[140px]">
              <button
                type="button"
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-cream-100 transition-colors cursor-pointer"
                onClick={() => {
                  setIsEditing(true)
                  setEditTitle(task.title)
                  setShowMenu(false)
                }}
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
              <button
                type="button"
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-coral-500 hover:bg-cream-100 transition-colors cursor-pointer"
                onClick={() => {
                  setShowDeleteConfirm(true)
                  setShowMenu(false)
                }}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              {isCompleted && (
                <button
                  type="button"
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-cream-100 transition-colors cursor-pointer"
                  onClick={() => void handleArchive()}
                >
                  <Archive className="w-4 h-4" />
                  Archive
                </button>
              )}
              {isArchived && (
                <button
                  type="button"
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-cream-100 transition-colors cursor-pointer"
                  onClick={() => void handleUnarchive()}
                >
                  <RotateCcw className="w-4 h-4" />
                  Restore
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete this task?"
          message="This cannot be undone. Subtasks will also be removed."
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={() => void handleDelete()}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  )
}
