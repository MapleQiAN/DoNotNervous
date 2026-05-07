import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { DailySummary } from './DailySummary'
import { WeeklySummary } from './WeeklySummary'
import { MoodTrendChart } from './MoodTrendChart'

type SummaryTab = 'daily' | 'weekly' | 'trend'

interface SummaryPageProps {
  showToast: (message: string, type?: 'success' | 'error') => void
}

const tabs: Array<{ key: SummaryTab; label: string }> = [
  { key: 'daily', label: '日总结' },
  { key: 'weekly', label: '周总结' },
  { key: 'trend', label: '心情趋势' },
]

export function SummaryPage({ showToast }: SummaryPageProps) {
  const [activeTab, setActiveTab] = useState<SummaryTab>('weekly')

  return (
    <div className="summary-page">
      <div className="top-tabs">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={activeTab === key ? 'is-active' : ''}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === 'daily' && <DailySummary showToast={showToast} />}
          {activeTab === 'weekly' && <WeeklySummary showToast={showToast} />}
          {activeTab === 'trend' && <MoodTrendChart />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
