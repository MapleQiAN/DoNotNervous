import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  selectedTaskId: string | null
  isSettingsOpen: boolean
  isMoreOptionsOpen: boolean
  isPointsPopoverOpen: boolean
  showStreakCalendar: boolean
  moodPickerTaskId: string | null
  currentPage: 'home' | 'tasks' | 'rewards' | 'mood' | 'data'
  setSelectedTaskId: (id: string | null) => void
  setSettingsOpen: (open: boolean) => void
  setMoreOptionsOpen: (open: boolean) => void
  setPointsPopoverOpen: (open: boolean) => void
  setShowStreakCalendar: (show: boolean) => void
  setMoodPickerTaskId: (id: string | null) => void
  setCurrentPage: (page: 'home' | 'tasks' | 'rewards' | 'mood' | 'data') => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      selectedTaskId: null,
      isSettingsOpen: false,
      isMoreOptionsOpen: false,
      isPointsPopoverOpen: false,
      showStreakCalendar: false,
      moodPickerTaskId: null,
      currentPage: 'home' as const,
      setSelectedTaskId: (id) => set({ selectedTaskId: id }),
      setSettingsOpen: (open) => set({ isSettingsOpen: open }),
      setMoreOptionsOpen: (open) => set({ isMoreOptionsOpen: open }),
      setPointsPopoverOpen: (open) => set({ isPointsPopoverOpen: open }),
      setShowStreakCalendar: (show) => set({ showStreakCalendar: show }),
      setMoodPickerTaskId: (id) => set({ moodPickerTaskId: id }),
      setCurrentPage: (page) => set({ currentPage: page }),
    }),
    { name: 'donotnervous-ui', version: 2 }
  )
)
