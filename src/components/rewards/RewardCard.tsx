import { motion } from 'framer-motion'
import { Coffee, BookOpen, Luggage, Heart, Music, Star, type LucideIcon } from 'lucide-react'
import type { Reward } from '../../domain/types'

const categoryConfig: Record<string, { icon: LucideIcon; bg: string; color: string }> = {
  '生活享受': { icon: Coffee, bg: 'warm', color: '#c07a32' },
  '学习成长': { icon: BookOpen, bg: 'blue', color: '#4a82b8' },
  '旅行体验': { icon: Luggage, bg: 'orange', color: '#d08040' },
  '健康身心': { icon: Heart, bg: 'rose', color: '#c06060' },
  '兴趣爱好': { icon: Music, bg: 'purple', color: '#7c68b8' },
  '其他': { icon: Star, bg: 'sage', color: '#5a9060' },
}

const defaultConfig = { icon: Star, bg: 'sage', color: '#5a9060' }

interface RewardCardProps {
  reward: Reward
  balance: number
  onDelete: (id: string) => void
  onEdit: (reward: Reward) => void
}

export function RewardCard({ reward, balance, onDelete, onEdit }: RewardCardProps) {
  const progressPercent = Math.min(100, Math.round((balance / reward.pointCost) * 100))
  const currentSaved = Math.min(balance, reward.pointCost)
  const config = categoryConfig[reward.description] ?? defaultConfig
  const Icon = config.icon

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="reward-item group"
    >
      {/* Icon */}
      <div className={`reward-icon tone-${config.bg}`}>
        <Icon size={22} strokeWidth={1.8} style={{ color: config.color }} />
      </div>

      {/* Title & subtitle */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <h3 className="reward-name">{reward.name}</h3>
        <p className="reward-desc">需要 ¥{reward.pointCost}</p>
      </div>

      {/* Progress & amount */}
      <div className="reward-progress-inline">
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="reward-amount-row">
          <span className="reward-amount-current">¥{currentSaved}</span>
          <span className="reward-amount-divider"> / </span>
          <span className="reward-amount-total">¥{reward.pointCost}</span>
        </div>
      </div>

      {/* Hover actions */}
      <div className="reward-hover-actions">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(reward) }}
          className="reward-action-btn"
          aria-label="编辑"
        >
          ✎
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(reward.id) }}
          className="reward-action-btn reward-action-delete"
          aria-label="删除"
        >
          ✕
        </button>
      </div>
    </motion.div>
  )
}
