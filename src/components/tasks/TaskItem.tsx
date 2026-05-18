import { useState, useCallback, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CalendarClock, MoreVertical, Pencil, Trash2, Archive, RotateCcw } from 'lucide-react'
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
  const rewardAmount = task.difficulty === 'hard' ? 35 : task.difficulty === 'medium' ? 20 : 10

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
        initial={{ opacity: 0, y: -10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, x: -30, scale: 0.95, height: 0, marginTop: 0, marginBottom: 0, transition: { duration: 0.3 } }}
        transition={
          isCompleting
            ? { duration: 0.4 }
            : { type: 'spring', stiffness: 400, damping: 30 }
        }
        className={`task-row ${isCompleted ? 'is-completed' : ''}`}
      >
        {/* Checkbox */}
        <button
          type="button"
          onClick={() => void handleComplete()}
          disabled={isCompleted || isArchived}
          className="flex-shrink-0 cursor-pointer"
          aria-label={isCompleted ? '任务已完成' : '完成任务'}
        >
          <motion.div
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              isCompleted
                ? 'bg-sage-500 border-sage-500'
                : 'border-border'
            }`}
            animate={
              isCompleting
                ? { scale: [1, 1.3, 0.9, 1.1, 1] }
                : { scale: 1 }
            }
            transition={{ duration: 0.4 }}
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
              <motion.span
                className={`task-title transition-all duration-300 ${
                  isCompleted ? 'line-through opacity-60' : ''
                }`}
                animate={isCompleted ? { opacity: 0.6 } : { opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                {task.title}
              </motion.span>
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
        <span className="row-time hidden md:inline-flex">
          <CalendarClock size={15} />
          {isCompleted ? '今天完成' : '今天截止'}
        </span>
        <span className="reward-text hidden sm:block">+ ¥{rewardAmount}</span>
        <span className={`soft-pill hidden lg:inline-flex ${task.category ? 'tone-blue' : 'tone-green'}`}>
          {task.category || (task.difficulty === 'hard' ? '专注' : '平静')}
        </span>

        {/* Action menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className="flex min-h-[38px] min-w-[38px] items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-cream-100 hover:text-text-primary"
            aria-label="任务操作"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full z-10 mt-1 min-w-[140px] rounded-lg border border-border bg-cream-50 py-1 shadow-lg">
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
                编辑
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
                删除
              </button>
              {isCompleted && (
                <button
                  type="button"
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-cream-100 transition-colors cursor-pointer"
                  onClick={() => void handleArchive()}
                >
                  <Archive className="w-4 h-4" />
                  归档
                </button>
              )}
              {isArchived && (
                <button
                  type="button"
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-primary hover:bg-cream-100 transition-colors cursor-pointer"
                  onClick={() => void handleUnarchive()}
                >
                  <RotateCcw className="w-4 h-4" />
                  恢复
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="删除这个任务？"
          message="此操作无法撤销，子任务也会一起删除。"
          legacyTitle="Delete this task?"
          legacyMessage="This cannot be undone. Subtasks will also be removed."
          confirmLabel="删除"
          cancelLabel="取消"
          onConfirm={() => void handleDelete()}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  )
}
