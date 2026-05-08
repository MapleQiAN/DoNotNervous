import { useCategories } from '../../hooks/useTaskQueries'
import { useFilterStore } from '../../stores/filterStore'
import { Button } from '../common/Button'

export function CategoryFilter() {
  const activeCategory = useFilterStore((s) => s.activeCategory)
  const setActiveCategory = useFilterStore((s) => s.setActiveCategory)

  const categories = useCategories()

  if (categories.length === 0) return null

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
      <Button
        variant={activeCategory === null ? 'primary' : 'ghost'}
        size="sm"
        className="rounded-full whitespace-nowrap"
        onClick={() => setActiveCategory(null)}
      >
        All
      </Button>
      {categories.map((category) => (
        <Button
          key={category}
          variant={activeCategory === category ? 'primary' : 'ghost'}
          size="sm"
          className={`rounded-full whitespace-nowrap ${
            activeCategory === category
              ? 'bg-lavender-500 text-white'
              : 'bg-cream-100 text-text-primary'
          }`}
          onClick={() => setActiveCategory(category)}
        >
          {category}
        </Button>
      ))}
    </div>
  )
}
