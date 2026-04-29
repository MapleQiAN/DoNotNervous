import { useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { Zap } from 'lucide-react'
import { usePointBalance } from '../../hooks/usePoints'
import { useUIStore } from '../../stores/uiStore'

function AnimatedNumber({ value }: { value: number }) {
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, { stiffness: 100, damping: 20 })
  const display = useTransform(spring, (v: number) => Math.round(v))

  useEffect(() => {
    motionValue.set(value)
  }, [motionValue, value])

  return <motion.span>{display}</motion.span>
}

export function PointBadge() {
  const balance = usePointBalance()
  const setPointsPopoverOpen = useUIStore((s) => s.setPointsPopoverOpen)

  return (
    <button
      type="button"
      onClick={() => setPointsPopoverOpen(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 transition-colors min-h-[44px] cursor-pointer"
      aria-label={`Points: ${balance}`}
    >
      <Zap size={18} className="text-amber-500" />
      <span className="text-sm font-semibold text-amber-700">
        <AnimatedNumber value={balance} />
      </span>
    </button>
  )
}
