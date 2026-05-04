import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useUIStore } from '../../stores/uiStore'
import { useMascotStore } from '../../stores/mascotStore'
import { celebrateMoodLog } from '../../lib/celebrate'
import { createMoodEntry } from '../../hooks/useMoodEntries'
import { MOODS } from '../../domain/mood'
import type { MoodEmoji } from '../../domain/types'

interface MoodPickerProps {
  showToast: (message: string, type?: 'success' | 'error') => void
}

export function MoodPicker({ showToast }: MoodPickerProps) {
  const moodPickerTaskId = useUIStore((s) => s.moodPickerTaskId)
  const setMoodPickerTaskId = useUIStore((s) => s.setMoodPickerTaskId)
  const [selectedEmoji, setSelectedEmoji] = useState<MoodEmoji | null>(null)
  const [journal, setJournal] = useState('')

  const isOpen = moodPickerTaskId !== null

  function handleDismiss() {
    setSelectedEmoji(null)
    setJournal('')
    setMoodPickerTaskId(null)
  }

  async function handleSave() {
    if (!selectedEmoji) return
    try {
      await createMoodEntry({
        emoji: selectedEmoji,
        journal,
        taskId: moodPickerTaskId,
      })
      showToast('Mood logged!')
      useMascotStore.getState().setAnimation('celebrate')
      celebrateMoodLog()
    } catch {
      showToast('Could not save mood', 'error')
    }
    handleDismiss()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-text-primary/30 z-50 flex items-end sm:items-center justify-center"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-cream-50 rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md mx-0 sm:mx-4 shadow-xl border border-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">How are you feeling?</h2>
              <button onClick={handleDismiss} className="text-text-secondary hover:text-text-primary p-1 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer" aria-label="Dismiss">
                <X size={20} />
              </button>
            </div>

            {/* 4x2 emoji grid */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {MOODS.map(({ emoji, label }) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-h-[44px] cursor-pointer ${
                    selectedEmoji === emoji
                      ? 'bg-sage-100 ring-2 ring-sage-400 scale-110'
                      : 'hover:bg-cream-100'
                  }`}
                  aria-label={label}
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-[10px] text-text-secondary capitalize">{label}</span>
                </button>
              ))}
            </div>

            {/* Journal textarea — always visible per D-03 */}
            <textarea
              value={journal}
              onChange={(e) => setJournal(e.target.value.slice(0, 280))}
              placeholder="What's on your mind? (optional)"
              maxLength={280}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border bg-white text-text-primary placeholder:text-text-secondary/50 resize-none text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
            />
            <div className="text-right text-xs text-text-secondary mt-1">{journal.length}/280</div>

            <div className="flex gap-2 mt-4">
              <button onClick={handleDismiss} className="flex-1 px-4 py-2.5 rounded-lg border border-border text-text-secondary hover:bg-cream-100 transition-colors min-h-[44px] cursor-pointer text-sm">
                Skip
              </button>
              <button
                onClick={handleSave}
                disabled={!selectedEmoji}
                className="flex-1 px-4 py-2.5 rounded-lg bg-sage-500 text-white font-medium hover:bg-sage-600 transition-colors min-h-[44px] cursor-pointer text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
