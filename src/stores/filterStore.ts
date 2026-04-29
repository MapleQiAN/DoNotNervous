import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FilterState {
  activeCategory: string | null
  showCompleted: boolean
  setActiveCategory: (category: string | null) => void
  setShowCompleted: (show: boolean) => void
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      activeCategory: null,
      showCompleted: true,
      setActiveCategory: (category) => set({ activeCategory: category }),
      setShowCompleted: (show) => set({ showCompleted: show }),
    }),
    { name: 'donotnervous-filters' }
  )
)
