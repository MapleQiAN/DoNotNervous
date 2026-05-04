import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  selectedTaskId: string | null
  isSettingsOpen: boolean
  isMoreOptionsOpen: boolean
  isPointsPopoverOpen: boolean
  moodPickerTaskId: string | null
  currentPage: 'tasks' | 'rewards'
  setSelectedTaskId: (id: string | null) => void
  setSettingsOpen: (open: boolean) => void
  setMoreOptionsOpen: (open: boolean) => void
  setPointsPopoverOpen: (open: boolean) => void
  setMoodPickerTaskId: (id: string | null) => void
  setCurrentPage: (page: 'tasks' | 'rewards') => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      selectedTaskId: null,
      isSettingsOpen: false,
      isMoreOptionsOpen: false,
      isPointsPopoverOpen: false,
      moodPickerTaskId: null,
      currentPage: 'tasks' as const,
      setSelectedTaskId: (id) => set({ selectedTaskId: id }),
      setSettingsOpen: (open) => set({ isSettingsOpen: open }),
      setMoreOptionsOpen: (open) => set({ isMoreOptionsOpen: open }),
      setPointsPopoverOpen: (open) => set({ isPointsPopoverOpen: open }),
      setMoodPickerTaskId: (id) => set({ moodPickerTaskId: id }),
      setCurrentPage: (page) => set({ currentPage: page }),
    }),
    { name: 'donotnervous-ui' }
  )
)
