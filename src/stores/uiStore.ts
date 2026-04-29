import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  selectedTaskId: string | null
  isSettingsOpen: boolean
  isMoreOptionsOpen: boolean
  isPointsPopoverOpen: boolean
  setSelectedTaskId: (id: string | null) => void
  setSettingsOpen: (open: boolean) => void
  setMoreOptionsOpen: (open: boolean) => void
  setPointsPopoverOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      selectedTaskId: null,
      isSettingsOpen: false,
      isMoreOptionsOpen: false,
      isPointsPopoverOpen: false,
      setSelectedTaskId: (id) => set({ selectedTaskId: id }),
      setSettingsOpen: (open) => set({ isSettingsOpen: open }),
      setMoreOptionsOpen: (open) => set({ isMoreOptionsOpen: open }),
      setPointsPopoverOpen: (open) => set({ isPointsPopoverOpen: open }),
    }),
    { name: 'donotnervous-ui' }
  )
)
