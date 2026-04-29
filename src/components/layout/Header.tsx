import { Settings } from 'lucide-react'

interface HeaderProps {
  onSettingsClick: () => void
}

export function Header({ onSettingsClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-cream-50/80 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <h1 className="text-xl font-semibold text-text-primary">DoNotNervous</h1>
        <button
          type="button"
          onClick={onSettingsClick}
          className="text-text-secondary hover:bg-cream-100 rounded-lg transition-all min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          aria-label="Settings"
        >
          <Settings size={20} />
        </button>
      </div>
    </header>
  )
}
