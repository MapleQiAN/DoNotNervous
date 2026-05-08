import { useState } from 'react'
import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Gift, Plus, Wallet, Trophy, Coins, Sparkles,
  ArrowRight, ChevronDown,
} from 'lucide-react'
import { rewardIconKeys, rewardIconLabel, incomeTypeIcon, type RewardIconKey } from './rewardIcons'
import { useMascotStore } from '../../stores/mascotStore'
import { celebrateRedemption } from '../../lib/celebrate'
import { useRewards, useRedemptions, createReward, redeemReward, deleteReward } from '../../hooks/useRewards'
import { usePointBalance, useRecentTransactions } from '../../hooks/usePoints'
import { api } from '../../lib/api'
import { useAuthStore } from '../../stores/authStore'
import { RewardCard } from './RewardCard'
import { RedemptionHistory } from './RedemptionHistory'
import { ConfirmDialog } from '../common/ConfirmDialog'
import type { Reward } from '../../domain/types'

interface RewardShopProps {
  showToast: (message: string, type?: 'success' | 'error') => void
}

const categories = ['生活享受', '学习成长', '旅行体验', '健康身心', '兴趣爱好', '其他']

export function RewardShop({ showToast }: RewardShopProps) {
  const rewards = useRewards()
  const redemptions = useRedemptions()
  const balance = usePointBalance()
  const [showHistory, setShowHistory] = useState(false)
  const [redeemTarget, setRedeemTarget] = useState<Reward | null>(null)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newCost, setNewCost] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('生活享受')
  const [selectedIcon, setSelectedIcon] = useState<RewardIconKey>('gift')

  async function handleCreate() {
    const cost = parseInt(newCost, 10)
    if (!newName.trim() || isNaN(cost) || cost < 1) {
      showToast('请填写完整信息', 'error')
      return
    }
    try {
      await createReward({ name: newName.trim(), description: selectedCategory, pointCost: cost, icon: selectedIcon })
      setNewName('')
      setNewDesc('')
      setNewCost('')
      setSelectedIcon('gift')
      showToast('奖励创建成功')
    } catch {
      showToast('创建失败', 'error')
    }
  }

  async function handleRedeem() {
    if (!redeemTarget) return
    try {
      await redeemReward(redeemTarget.id)
      const redeemedName = redeemTarget.name
      setRedeemTarget(null)
      showToast(`兑换成功：${redeemedName}`)
      useMascotStore.getState().setAnimation('celebrate')
      celebrateRedemption()
    } catch (err) {
      const message = err instanceof Error ? err.message : '兑换失败'
      showToast(message, 'error')
      setRedeemTarget(null)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteReward(id)
      showToast('已删除')
    } catch {
      showToast('删除失败', 'error')
    }
  }

  function handleEdit(reward: Reward) {
    setNewName(reward.name)
    setNewDesc(reward.description)
    setNewCost(String(reward.pointCost))
  }

  const totalSpent = redemptions.reduce((sum, r) => sum + r.pointsSpent, 0)

  const recentTransactions = useRecentTransactions(6)
  const recentIncome = recentTransactions.filter((e) => e.amount > 0)

  const token = useAuthStore((s) => s.accessToken)
  const incomeData = useQuery({
    queryKey: ['points', 'income-summary'],
    queryFn: () =>
      api.get<{ data: { thisWeek: number; lastWeek: number } }>('/points/income-summary', token!).then((r) => r.data),
    enabled: !!token,
  }).data
  const thisWeekIncome = incomeData?.thisWeek ?? 0
  const lastWeekIncome = incomeData?.lastWeek ?? 0

  const weeklyDiff = thisWeekIncome - lastWeekIncome

  return (
    <div className="dashboard-grid reward-route">
      <section className="main-column">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="hero-panel reward-hero"
        >
          <div className="hero-copy">
            <h1>认真生活的人，值得<span>被奖励</span> ✨</h1>
            <p>把每一次努力，变成看得见的美好。</p>
          </div>
          <img className="hero-illustration pig-illustration" src="/illustrations/reward-pig.png" alt="" aria-hidden="true" />
        </motion.section>

        {/* Stat Cards */}
        <motion.section className="stats-strip" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <StatCard
            icon={<Trophy size={24} strokeWidth={1.8} />}
            label="累计奖励"
            value={`¥${balance + totalSpent}`}
            note="总计获得的奖励金"
            tone="coral"
          />
          <StatCard
            icon={<Wallet size={24} strokeWidth={1.8} />}
            label="可用余额"
            value={`¥${balance}`}
            note="可用于兑换奖励"
            tone="purple"
          />
          <StatCard
            icon={<Coins size={24} strokeWidth={1.8} />}
            label="本周新增"
            value={`¥${thisWeekIncome}`}
            note={weeklyDiff >= 0 ? `较上周 +¥${weeklyDiff}` : `较上周 ${weeklyDiff}`}
            tone="orange"
          />
          <StatCard
            icon={<Gift size={24} strokeWidth={1.8} />}
            label="已兑现奖励"
            value={`¥${totalSpent}`}
            note={`已兑换 ${redemptions.length} 次奖励`}
            tone="rose"
          />
        </motion.section>

        {/* Two-column content */}
        <motion.div className="reward-columns" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {/* Reward List */}
          <section className="content-card">
            <div className="section-title-row">
              <div>
                <h2>我的奖励清单 🌿</h2>
                <p>为自己设定小目标，解锁更多快乐</p>
              </div>
            </div>

            {rewards.length === 0 ? (
              <div className="empty-soft">
                <Gift size={34} />
                <p>还没有奖励，先创建一个想要的小美好。</p>
              </div>
            ) : (
              <div className="reward-list">
                <AnimatePresence mode="popLayout">
                  {rewards.map((reward) => (
                    <RewardCard
                      key={reward.id}
                      reward={reward}
                      balance={balance}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            <button type="button" className="create-reward-inline">
              <Plus size={16} strokeWidth={2.2} />
              创建新奖励
            </button>
          </section>

          {/* Income Records */}
          <section className="content-card">
            <div className="section-title-row">
              <div>
                <h2>奖励收入记录</h2>
                <p>每一份努力，都算作对自己的奖励</p>
              </div>
              <button type="button" onClick={() => setShowHistory(!showHistory)} className="small-select">
                {showHistory ? '收起' : '全部类型'} <ChevronDown size={14} />
              </button>
            </div>

            <div className="income-list">
              {recentIncome?.length === 0 ? (
                <p style={{ color: 'var(--color-muted)', fontSize: '14px', textAlign: 'center', padding: '16px 0' }}>
                  完成任务后，奖励收入会出现在这里
                </p>
              ) : (
                recentIncome?.map((row) => (
                  <div key={row.id} className="income-row">
                    <span className="income-icon green">
                      <img src={`/icons/${incomeTypeIcon[row.type] ?? 'piggy_bank'}.png`} alt="" />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="income-title-row">
                        <p>{row.reason}</p>
                        <span className="task-tag">{row.type === 'task_complete' ? '任务奖励' : row.type === 'streak_bonus' ? '连续奖励' : '积分'}</span>
                      </div>
                      <span className="income-time">{new Intl.DateTimeFormat('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(row.createdAt)}</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong className="income-amount">+¥{row.amount}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>

            <AnimatePresence>
              {showHistory && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <RedemptionHistory />
                </motion.div>
              )}
            </AnimatePresence>

            <button type="button" className="view-all-link">
              查看全部记录 <ArrowRight size={15} />
            </button>
          </section>
        </motion.div>
      </section>

      {/* Right Panel */}
      <motion.aside className="right-column" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
        <section className="side-panel form-panel">
          <h2>创建新奖励 <Sparkles size={18} className="inline ml-1 text-amber-500" /></h2>
          <label>
            <span>奖励名称</span>
            <div className="input-with-count">
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="例如：买一束花" maxLength={20} />
              <em>{newName.length}/20</em>
            </div>
          </label>
          <label>
            <span>需要金额</span>
            <div className="amount-input-wrap">
              <span className="amount-prefix">¥</span>
              <input value={newCost} onChange={(e) => setNewCost(e.target.value)} placeholder="请输入金额" inputMode="numeric" />
            </div>
          </label>
          <label>
            <span>分类</span>
          </label>
          <div className="category-cloud">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={selectedCategory === cat ? 'is-active' : ''}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
          <label>
            <span>选择图标</span>
          </label>
          <div className="icon-picker-grid">
            {rewardIconKeys.map((key) => (
              <button
                key={key}
                type="button"
                className={`icon-picker-item${selectedIcon === key ? ' is-active' : ''}`}
                onClick={() => setSelectedIcon(key)}
                title={rewardIconLabel[key]}
              >
                <img src={`/icons/${key}.png`} alt={rewardIconLabel[key]} />
              </button>
            ))}
          </div>
          <label>
            <span>奖励描述（可选）</span>
            <div className="input-with-count">
              <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value.slice(0, 100))} placeholder="描述一下这个奖励对你的意义吧～" rows={4} />
              <em>{newDesc.length}/100</em>
            </div>
          </label>
          <button type="button" onClick={handleCreate} className="primary-wide">
            创建奖励 <Plus size={17} />
          </button>
        </section>

        <section className="quote-card reward-quote">
          <div>
            <h3>你值得所有美好 ✨</h3>
            <p>慢慢攒，开心换，生活会越来越甜～</p>
          </div>
          <Gift size={52} strokeWidth={1.2} className="text-sage-300 shrink-0" />
        </section>
      </motion.aside>

      {redeemTarget && (
        <ConfirmDialog
          title="确认兑换？"
          message={`花费 ${redeemTarget.pointCost} 奖励金兑换「${redeemTarget.name}」？`}
          confirmLabel="确认兑换"
          cancelLabel="再攒攒"
          onConfirm={handleRedeem}
          onCancel={() => setRedeemTarget(null)}
        />
      )}
    </div>
  )
}

/* ─── Stat Card ─── */
function StatCard({ icon, label, value, note, tone }: {
  icon: ReactNode; label: string; value: string; note: string; tone: string
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon tone-${tone}`}>{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <p>{note}</p>
      </div>
    </div>
  )
}
