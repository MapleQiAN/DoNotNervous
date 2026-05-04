import { motion } from 'framer-motion'
import { Trash2, Edit2, Zap } from 'lucide-react'
import type { Reward } from '../../domain/types'

interface RewardCardProps {
  reward: Reward
  balance: number
  onRedeem: (reward: Reward) => void
  onDelete: (id: string) => void
  onEdit: (reward: Reward) => void
}

export function RewardCard({ reward, balance, onRedeem, onDelete, onEdit }: RewardCardProps) {
  const canAfford = balance >= reward.pointCost

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-xl p-4 shadow-sm border border-border hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-text-primary truncate">{reward.name}</h3>
          {reward.description && (
            <p className="text-sm text-text-secondary mt-1 line-clamp-2">{reward.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2">
          <button onClick={() => onEdit(reward)} className="text-text-secondary hover:text-text-primary p-1 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer" aria-label="Edit reward">
            <Edit2 size={16} />
          </button>
          <button onClick={() => onDelete(reward.id)} className="text-text-secondary hover:text-coral-500 p-1 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer" aria-label="Delete reward">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="flex items-center gap-1 text-sm font-medium text-amber-600">
          <Zap size={14} /> {reward.pointCost} pts
        </span>
        <button
          onClick={() => canAfford && onRedeem(reward)}
          disabled={!canAfford}
          className={`px-4 py-2 rounded-lg text-sm font-medium min-h-[44px] cursor-pointer transition-colors ${
            canAfford
              ? 'bg-sage-500 text-white hover:bg-sage-600'
              : 'bg-cream-100 text-text-secondary cursor-not-allowed'
          }`}
        >
          Redeem
        </button>
      </div>
    </motion.div>
  )
}
