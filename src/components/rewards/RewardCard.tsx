import { motion } from 'framer-motion'
import { Gift, Pencil, Trash2 } from 'lucide-react'
import type { Reward } from '../../domain/types'

const categoryTone: Record<string, string> = {
  '生活享受': 'warm',
  '学习成长': 'blue',
  '旅行体验': 'orange',
  '健康身心': 'rose',
  '兴趣爱好': 'purple',
  '其他': 'sage',
}

const defaultTone = 'sage'

interface RewardCardProps {
  reward: Reward
  balance: number
  onDelete: (id: string) => void
  onEdit: (reward: Reward) => void
  onRedeem: (reward: Reward) => void
}

export function RewardCard({ reward, balance, onDelete, onEdit, onRedeem }: RewardCardProps) {
  const progressPercent = Math.min(100, Math.round((balance / reward.pointCost) * 100))
  const currentSaved = Math.min(balance, reward.pointCost)
  const tone = categoryTone[reward.description] ?? defaultTone
  const canRedeem = balance >= reward.pointCost

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="reward-item group"
    >
      {/* Icon */}
      <div className={`reward-icon tone-${tone}`}>
        <img src={`/icons/${reward.icon || 'gift'}.png`} alt="" className="reward-icon-img" />
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

      <button
        type="button"
        className="reward-redeem-button"
        disabled={!canRedeem}
        onClick={(e) => { e.stopPropagation(); onRedeem(reward) }}
      >
        <Gift size={14} />
        {canRedeem ? '兑换' : '继续攒'}
      </button>

      <div className="reward-hover-actions">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onEdit(reward) }}
          className="reward-action-btn"
          aria-label="编辑"
        >
          <Pencil size={13} />
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(reward.id) }}
          className="reward-action-btn reward-action-delete"
          aria-label="删除"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </motion.div>
  )
}
