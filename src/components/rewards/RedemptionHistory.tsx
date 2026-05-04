import { useRedemptions } from '../../hooks/useRewards'

export function RedemptionHistory() {
  const redemptions = useRedemptions()

  if (redemptions.length === 0) {
    return <p className="text-sm text-text-secondary py-4 text-center">No redemptions yet</p>
  }

  return (
    <div className="space-y-2">
      {redemptions.map((r) => (
        <div key={r.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-cream-100">
          <div>
            <span className="text-sm font-medium text-text-primary">{r.rewardName}</span>
            <span className="text-xs text-text-secondary ml-2">
              {new Date(r.createdAt).toLocaleDateString()}
            </span>
          </div>
          <span className="text-sm font-medium text-amber-600">-{r.pointsSpent} pts</span>
        </div>
      ))}
    </div>
  )
}
