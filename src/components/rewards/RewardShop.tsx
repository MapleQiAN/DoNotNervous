import { useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Gift, Plus, Wallet, Trophy, BadgeCheck, Coins } from 'lucide-react'
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

  async function handleCreate() {
    const cost = parseInt(newCost, 10)
    if (!newName.trim() || isNaN(cost) || cost < 1) {
      showToast('请填写完整信息', 'error')
      return
    }
    try {
      await createReward({ name: newName.trim(), description: newDesc.trim(), pointCost: cost })
      setNewName('')
      setNewDesc('')
      setNewCost('')
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
      confetti({
        particleCount: 90,
        spread: 68,
        origin: { y: 0.7 },
        colors: ['#f7b955', '#f08a55', '#fbd58b', '#4f915b'],
      })
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
  const weeklyGain = Math.max(95, Math.round((balance + totalSpent) * 0.08))

  return (
    <div className="dashboard-grid reward-route">
      <section className="main-column">
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

        <section className="stats-strip">
          <StatCard icon={<Trophy size={25} />} label="累计奖励" value={`¥ ${balance + totalSpent}`} note="总计获得的奖励金" />
          <StatCard icon={<Wallet size={25} />} label="可用余额" value={`¥ ${balance}`} note="可用于兑换奖励" />
          <StatCard icon={<Coins size={25} />} label="本周新增" value={`¥ ${weeklyGain}`} note="较上周 +40" accent="orange" />
          <StatCard icon={<Gift size={25} />} label="已兑现奖励" value={`¥ ${totalSpent}`} note={`已兑换 ${redemptions.length} 次奖励`} />
        </section>

        <div className="reward-columns">
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
                      onRedeem={setRedeemTarget}
                      onDelete={handleDelete}
                      onEdit={handleEdit}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </section>

          <section className="content-card">
            <div className="section-title-row">
              <div>
                <h2>奖励收入记录</h2>
                <p>每一份努力，都算作对自己的奖励</p>
              </div>
              <button type="button" onClick={() => setShowHistory(!showHistory)} className="small-select">
                {showHistory ? '收起' : '全部类型'}
              </button>
            </div>

            <div className="income-list">
              {incomeRows.map((row) => (
                <div key={row.title} className="income-row">
                  <span className={`income-icon ${row.tone}`}>{row.icon}</span>
                  <div>
                    <p>{row.title}</p>
                    <span>{row.tag}</span>
                  </div>
                  <strong>+ ¥{row.amount}</strong>
                </div>
              ))}
            </div>

            <AnimatePresence>
              {showHistory && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <RedemptionHistory />
                </motion.div>
              )}
            </AnimatePresence>
          </section>
        </div>
      </section>

      <aside className="right-column">
        <section className="side-panel form-panel">
          <h2>创建新奖励 ✨</h2>
          <label>
            <span>奖励名称</span>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="例如：买一束花" maxLength={20} />
            <em>{newName.length}/20</em>
          </label>
          <label>
            <span>需要金额</span>
            <input value={newCost} onChange={(e) => setNewCost(e.target.value)} placeholder="请输入金额" inputMode="numeric" />
          </label>
          <div className="category-cloud">
            {categories.map((category, index) => (
              <button key={category} type="button" className={index === 0 ? 'is-active' : ''}>{category}</button>
            ))}
          </div>
          <label>
            <span>奖励描述（可选）</span>
            <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value.slice(0, 100))} placeholder="描述一下这个奖励对你的意义吧～" rows={4} />
            <em>{newDesc.length}/100</em>
          </label>
          <button type="button" onClick={handleCreate} className="primary-wide">
            创建奖励 <Plus size={17} />
          </button>
        </section>

        <section className="quote-card reward-quote">
          <div>
            <h3>你值得所有美好 ✨</h3>
            <p>慢慢攒，开心换，生活会越来越甜甜。</p>
          </div>
          <BadgeCheck size={52} />
        </section>
      </aside>

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

function StatCard({ icon, label, value, note, accent }: { icon: ReactNode; label: string; value: string; note: string; accent?: 'orange' }) {
  return (
    <div className={`stat-card ${accent ?? ''}`}>
      <div className="stat-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <p>{note}</p>
      </div>
    </div>
  )
}

const incomeRows = [
  { icon: '🏃', title: '完成晨跑', tag: '习惯任务', amount: 15, tone: 'green' },
  { icon: '📖', title: '阅读 20 页', tag: '每日任务', amount: 10, tone: 'blue' },
  { icon: '🪷', title: '冥想 10 分钟', tag: '心情任务', amount: 10, tone: 'rose' },
  { icon: '✅', title: '完成项目方案初稿', tag: '专注任务', amount: 35, tone: 'green' },
]
