import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, addMonths, subMonths, getDay, isToday } from 'date-fns'
import { useMoodEntries, createMoodEntry } from '../../hooks/useMoodEntries'
import { MOODS } from '../../domain/mood'
import type { MoodEmoji } from '../../domain/types'

interface MoodCalendarProps {
  showToast: (message: string, type?: 'success' | 'error') => void
}

// Map mood emoji to background color (warm, positive palette)
const MOOD_COLORS: Record<MoodEmoji, string> = {
  '\u{1F60A}': 'bg-yellow-200',
  '\u{1F60C}': 'bg-green-200',
  '\u{1F610}': 'bg-gray-200',
  '\u{1F614}': 'bg-blue-200',
  '\u{1F630}': 'bg-purple-200',
  '\u{1F621}': 'bg-red-200',
  '\u{1F973}': 'bg-orange-200',
  '\u{1F4AA}': 'bg-amber-300',
}

function getDominantMood(entries: { emoji: MoodEmoji }[]): MoodEmoji | null {
  if (entries.length === 0) return null
  const counts: Record<string, number> = {}
  for (const e of entries) {
    counts[e.emoji] = (counts[e.emoji] || 0) + 1
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  return sorted[0][0] as MoodEmoji
}

export function MoodCalendar({ showToast }: MoodCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showStandalonePicker, setShowStandalonePicker] = useState(false)
  const [selectedEmoji, setSelectedEmoji] = useState<MoodEmoji | null>(null)
  const [journal, setJournal] = useState('')
  const allMoods = useMoodEntries()

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Pad start of month so first day aligns with weekday
  const startPad = getDay(monthStart) // 0=Sun

  // Group moods by dayKey
  const moodsByDay = useMemo(() => {
    const map: Record<string, { emoji: MoodEmoji }[]> = {}
    for (const m of allMoods) {
      const key = format(m.createdAt, 'yyyy-MM-dd')
      if (!map[key]) map[key] = []
      map[key].push(m)
    }
    return map
  }, [allMoods])

  const selectedDayMoods = selectedDate
    ? allMoods.filter((m) => format(m.createdAt, 'yyyy-MM-dd') === selectedDate)
    : []

  async function handleStandaloneSave() {
    if (!selectedEmoji) return
    try {
      await createMoodEntry({ emoji: selectedEmoji, journal, taskId: null })
      showToast('Mood logged!')
    } catch {
      showToast('Could not save mood', 'error')
    }
    setSelectedEmoji(null)
    setJournal('')
    setShowStandalonePicker(false)
  }

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-cream-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer" aria-label="Previous month">
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-lg font-semibold text-text-primary">{format(currentMonth, 'MMMM yyyy')}</h3>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-cream-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer" aria-label="Next month">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Standalone mood button (D-11) */}
      <button
        onClick={() => setShowStandalonePicker(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-sage-300 text-sage-600 hover:bg-sage-50 transition-colors w-full justify-center min-h-[44px] cursor-pointer text-sm font-medium"
      >
        <Plus size={18} /> Log Mood
      </button>

      {/* Standalone mood picker */}
      <AnimatePresence>
        {showStandalonePicker && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-xl p-4 border border-border space-y-3">
              <div className="grid grid-cols-4 gap-2">
                {MOODS.map(({ emoji, label }) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setSelectedEmoji(emoji)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all min-h-[44px] cursor-pointer ${
                      selectedEmoji === emoji ? 'bg-sage-100 ring-2 ring-sage-400 scale-110' : 'hover:bg-cream-100'
                    }`}
                    aria-label={label}
                  >
                    <span className="text-2xl">{emoji}</span>
                    <span className="text-[10px] text-text-secondary capitalize">{label}</span>
                  </button>
                ))}
              </div>
              <textarea
                value={journal}
                onChange={(e) => setJournal(e.target.value.slice(0, 280))}
                placeholder="What's on your mind? (optional)"
                maxLength={280}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white text-text-primary placeholder:text-text-secondary/50 resize-none text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
              />
              <button onClick={handleStandaloneSave} disabled={!selectedEmoji} className="w-full px-4 py-2.5 rounded-lg bg-sage-500 text-white font-medium hover:bg-sage-600 transition-colors min-h-[44px] cursor-pointer text-sm disabled:opacity-40 disabled:cursor-not-allowed">
                Save Mood
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-xs text-text-secondary py-1 font-medium">{d}</div>
        ))}
        {/* Empty cells for padding */}
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {/* Day cells */}
        {days.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd')
          const dayMoods = moodsByDay[dayKey] || []
          const dominant = getDominantMood(dayMoods)
          const isSelected = selectedDate === dayKey

          return (
            <button
              key={dayKey}
              onClick={() => setSelectedDate(isSelected ? null : dayKey)}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all min-h-[44px] cursor-pointer ${
                dominant ? MOOD_COLORS[dominant] : 'hover:bg-cream-100'
              } ${isSelected ? 'ring-2 ring-sage-400' : ''} ${isToday(day) ? 'font-bold' : ''}`}
            >
              <span>{format(day, 'd')}</span>
              {dominant && <span className="text-sm">{dominant}</span>}
            </button>
          )
        })}
      </div>

      {/* Selected day detail */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-xl p-4 border border-border">
              <h4 className="font-medium text-text-primary mb-2">{selectedDate}</h4>
              {selectedDayMoods.length === 0 ? (
                <p className="text-sm text-text-secondary">No mood entries for this day</p>
              ) : (
                <div className="space-y-2">
                  {selectedDayMoods.map((m) => (
                    <div key={m.id} className="flex items-start gap-2">
                      <span className="text-xl">{m.emoji}</span>
                      <div>
                        <span className="text-sm font-medium capitalize">{MOODS.find(mood => mood.emoji === m.emoji)?.label}</span>
                        {m.journal && <p className="text-sm text-text-secondary">{m.journal}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
