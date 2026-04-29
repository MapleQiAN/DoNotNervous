import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  selectedTaskId: string | null
  isSettingsOpen: boolean
  isMoreOptionsOpen: boolean
  setSelectedTaskId: (id: string | null) => void
  setSettingsOpen: (open: boolean) => void
  setMoreOptionsOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      selectedTaskId: null,
      isSettingsOpen: false,
      isMoreOptionsOpen: false,
      setSelectedTaskId: (id) => set({ selectedTaskId: id }),
      setSettingsOpen: (open) => set({ isSettingsOpen: open }),
      setMoreOptionsOpen: (open) => set({ isMoreOptionsOpen: open }),
    }),
    { name: 'donotnervous-ui' }
  )
)
