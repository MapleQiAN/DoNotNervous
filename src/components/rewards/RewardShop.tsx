import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, History, Zap } from 'lucide-react'
import confetti from 'canvas-confetti'
import { useRewards, useRedemptions, createReward, redeemReward, deleteReward } from '../../hooks/useRewards'
import { usePointBalance } from '../../hooks/usePoints'
import { RewardCard } from './RewardCard'
import { RedemptionHistory } from './RedemptionHistory'
import { ConfirmDialog } from '../common/ConfirmDialog'
import type { Reward } from '../../domain/types'

interface RewardShopProps {
  showToast: (message: string, type?: 'success' | 'error') => void
}

export function RewardShop({ showToast }: RewardShopProps) {
  const rewards = useRewards()
  const redemptions = useRedemptions()
  const balance = usePointBalance()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [redeemTarget, setRedeemTarget] = useState<Reward | null>(null)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newCost, setNewCost] = useState('')

  async function handleCreate() {
    const cost = parseInt(newCost, 10)
    if (!newName.trim() || isNaN(cost) || cost < 1) {
      showToast('Please fill in all fields', 'error')
      return
    }
    try {
      await createReward({ name: newName.trim(), description: newDesc.trim(), pointCost: cost })
      setNewName('')
      setNewDesc('')
      setNewCost('')
      setShowCreateForm(false)
      showToast('Reward created!')
    } catch {
      showToast('Could not create reward', 'error')
    }
  }

  async function handleRedeem() {
    if (!redeemTarget) return
    try {
      await redeemReward(redeemTarget.id)
      const redeemedName = redeemTarget.name
      setRedeemTarget(null)
      showToast(`Redeemed: ${redeemedName}!`)
      // Trigger confetti with warm palette per D-08
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#f59e0b', '#f97316', '#fbbf24', '#d97706', '#fcd34d'],
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Redemption failed'
      showToast(message, 'error')
      setRedeemTarget(null)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteReward(id)
      showToast('Reward deleted')
    } catch {
      showToast('Could not delete reward', 'error')
    }
  }

  function handleEdit(reward: Reward) {
    setNewName(reward.name)
    setNewDesc(reward.description)
    setNewCost(String(reward.pointCost))
    setShowCreateForm(true)
  }

  return (
    <div className="space-y-6">
      {/* Header with balance */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-text-primary">Reward Shop</h2>
        <span className="flex items-center gap-1.5 text-sm font-medium text-amber-600">
          <Zap size={16} /> {balance} pts available
        </span>
      </div>

      {/* Create button */}
      <button
        onClick={() => setShowCreateForm(!showCreateForm)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-sage-300 text-sage-600 hover:bg-sage-50 transition-colors w-full justify-center min-h-[44px] cursor-pointer text-sm font-medium"
      >
        <Plus size={18} /> Create New Reward
      </button>

      {/* Inline creation form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-xl p-4 border border-border space-y-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Reward name"
                maxLength={100}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white text-text-primary placeholder:text-text-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
              />
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description (optional)"
                maxLength={500}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white text-text-primary placeholder:text-text-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
              />
              <input
                type="number"
                value={newCost}
                onChange={(e) => setNewCost(e.target.value)}
                placeholder="Point cost"
                min={1}
                className="w-full px-3 py-2 rounded-lg border border-border bg-white text-text-primary placeholder:text-text-secondary/50 text-sm focus:outline-none focus:ring-2 focus:ring-sage-400"
              />
              <button onClick={handleCreate} className="w-full px-4 py-2.5 rounded-lg bg-sage-500 text-white font-medium hover:bg-sage-600 transition-colors min-h-[44px] cursor-pointer text-sm">
                Create Reward
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reward cards grid */}
      {rewards.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          <p>No rewards yet. Create one above!</p>
        </div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence mode="popLayout">
            {rewards.map((reward) => (
              <RewardCard
                key={reward.id}
                reward={reward}
                balance={balance}
                onRedeem={setRedeemTarget}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Redemption history toggle */}
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
      >
        <History size={16} />
        {showHistory ? 'Hide' : 'Show'} Redemption History ({redemptions.length})
      </button>

      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <RedemptionHistory />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Redemption confirmation dialog */}
      {redeemTarget && (
        <ConfirmDialog
          title="Redeem Reward?"
          message={`Spend ${redeemTarget.pointCost} points on "${redeemTarget.name}"?`}
          confirmLabel="Redeem"
          cancelLabel="Keep Saving"
          onConfirm={handleRedeem}
          onCancel={() => setRedeemTarget(null)}
        />
      )}
    </div>
  )
}
