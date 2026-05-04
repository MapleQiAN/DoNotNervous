import { useCallback, useEffect, useState } from 'react'
import Lottie from 'lottie-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLiveQuery } from 'dexie-react-hooks'
import { useMascotStore } from '../../stores/mascotStore'
import { toDayKey } from '../../lib/date-utils'
import { db } from '../../db'
import './mascot.css'

const SPEECH_MESSAGES = [
  '你今天好棒！ 🎉',
  '慢慢来～ 🌿',
  '又完成一个！ 💪',
  '休息一下也不错哦 ☕',
  '每一步都算数 ✨',
  '你正在变好的路上 🌱',
  '今天辛苦了，抱抱 🤗',
  '相信自己，你可以的 💚',
  '不急，慢慢来 🐱',
  '小进步也是进步 🌟',
]

type AnimationData = Record<string, unknown>

const ANIMATION_FILES = [
  'cat-idle',
  'cat-celebrate',
  'cat-encourage',
  'cat-sleepy',
] as const

export function Mascot() {
  const animation = useMascotStore((s) => s.animation)
  const showSpeechBubble = useMascotStore((s) => s.showSpeechBubble)
  const speechMessage = useMascotStore((s) => s.speechMessage)
  const triggerSpeech = useMascotStore((s) => s.triggerSpeech)
  const dismissSpeech = useMascotStore((s) => s.dismissSpeech)

  const [animations, setAnimations] = useState<Record<string, AnimationData>>({})

  const todayCompletedTasks = useLiveQuery(
    () => db.tasks.where('status').equals('completed').toArray(),
    []
  )

  const hasCompletedToday = todayCompletedTasks
    ? todayCompletedTasks.some(
        (task) =>
          task.completedAt !== null &&
          toDayKey(task.completedAt) === toDayKey(new Date())
      )
    : true

  const activeAnimation = hasCompletedToday ? animation : 'sleepy'

  useEffect(() => {
    async function loadAnimations() {
      const loaded: Record<string, AnimationData> = {}
      for (const name of ANIMATION_FILES) {
        const response = await fetch(`/animations/${name}.json`)
        loaded[name] = await response.json()
      }
      setAnimations(loaded)
    }
    loadAnimations()
  }, [])

  const handleTap = useCallback(() => {
    if (showSpeechBubble) {
      dismissSpeech()
      return
    }
    const randomIndex = Math.floor(Math.random() * SPEECH_MESSAGES.length)
    triggerSpeech(SPEECH_MESSAGES[randomIndex])
  }, [showSpeechBubble, dismissSpeech, triggerSpeech])

  return (
    <div className="mascot-container" onClick={handleTap}>
      <AnimatePresence>
        {showSpeechBubble && (
          <motion.div
            className="mascot-speech-bubble"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            {speechMessage}
          </motion.div>
        )}
      </AnimatePresence>
      {animations[activeAnimation] && (
        <Lottie
          animationData={animations[activeAnimation]}
          loop={true}
          className="mascot-lottie"
        />
      )}
    </div>
  )
}
