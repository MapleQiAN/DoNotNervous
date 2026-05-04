import { motion } from 'framer-motion'
import type { Reward } from '../../domain/types'

const CARD_ICONS = ['📅', '✅', '📖', '🏃', '🎯', '⭐', '🎵', '🧘']

function getCardIcon(index: number): string {
  return CARD_ICONS[index % CARD_ICONS.length]
}

interface RewardCardProps {
  reward: Reward
  balance: number
  onRedeem: (reward: Reward) => void
  onDelete: (id: string) => void
  onEdit: (reward: Reward) => void
}

export function RewardCard({ reward, balance, onRedeem, onDelete, onEdit }: RewardCardProps) {
  const canAfford = balance >= reward.pointCost
  const progressPercent = Math.min(100, Math.round((balance / reward.pointCost) * 100))
  const icon = getCardIcon(Math.abs(hashCode(reward.id)) % CARD_ICONS.length)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="reward-item group"
    >
      {/* Action buttons - top right on hover */}
      <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(reward) }}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-cream-50 text-[10px] text-text-secondary hover:text-text-primary"
          aria-label="编辑"
        >
          ✎
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(reward.id) }}
          className="flex h-6 w-6 items-center justify-center rounded-full bg-cream-50 text-[10px] text-text-secondary hover:text-coral-500"
          aria-label="删除"
        >
          ✕
        </button>
      </div>

      {/* Icon */}
      <div className="reward-icon">
        <span className="text-lg">{icon}</span>
      </div>

      {/* Title */}
      <h3 className="reward-name">
        {reward.name}
      </h3>

      {/* Description */}
      {reward.description && (
        <p className="reward-desc">
          {reward.description}
        </p>
      )}

      {/* Points */}
      <div className="reward-progress">
        <div className="flex items-baseline gap-0.5">
          <span className="text-xs text-warm-500 font-semibold">¥</span>
          <span className="text-base font-bold text-warm-500">{reward.pointCost}</span>
        </div>

        {/* Progress bar */}
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-cream-100">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progressPercent >= 100 ? 'bg-sage-500' : 'bg-warm-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="mt-1 text-[10px] text-text-secondary">
          {progressPercent >= 100 ? '可以兑换' : `还需 ¥${reward.pointCost - balance}`}
        </p>
      </div>

      {/* Redeem button */}
      <button
        onClick={() => canAfford && onRedeem(reward)}
        disabled={!canAfford}
        className={`mt-2 w-full rounded-xl py-1.5 text-xs font-semibold transition-colors ${
          canAfford
            ? 'bg-warm-500 text-white hover:bg-warm-400 cursor-pointer'
            : 'bg-cream-100 text-text-secondary cursor-not-allowed'
        }`}
      >
        {canAfford ? '兑换奖励' : '余额不足'}
      </button>
    </motion.div>
  )
}

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash |= 0
  }
  return hash
}
