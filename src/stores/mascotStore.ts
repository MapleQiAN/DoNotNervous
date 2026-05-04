import { create } from 'zustand'

type MascotAnimation = 'idle' | 'celebrate' | 'encourage' | 'sleepy'

interface MascotState {
  animation: MascotAnimation
  showSpeechBubble: boolean
  speechMessage: string
  setAnimation: (anim: MascotAnimation) => void
  triggerSpeech: (message: string) => void
  dismissSpeech: () => void
}

let animationTimer: ReturnType<typeof setTimeout> | null = null
let speechTimer: ReturnType<typeof setTimeout> | null = null

function clearAnimationTimer(): void {
  if (animationTimer !== null) {
    clearTimeout(animationTimer)
    animationTimer = null
  }
}

function clearSpeechTimer(): void {
  if (speechTimer !== null) {
    clearTimeout(speechTimer)
    speechTimer = null
  }
}

export const useMascotStore = create<MascotState>()((set) => ({
  animation: 'idle' as MascotAnimation,
  showSpeechBubble: false,
  speechMessage: '',

  setAnimation: (anim: MascotAnimation) => {
    clearAnimationTimer()
    set({ animation: anim })

    if (anim === 'celebrate' || anim === 'encourage') {
      animationTimer = setTimeout(() => {
        set({ animation: 'idle' as MascotAnimation })
        animationTimer = null
      }, 3000)
    }
  },

  triggerSpeech: (message: string) => {
    clearSpeechTimer()
    set({ showSpeechBubble: true, speechMessage: message })

    speechTimer = setTimeout(() => {
      set({ showSpeechBubble: false, speechMessage: '' })
      speechTimer = null
    }, 3000)
  },

  dismissSpeech: () => {
    clearSpeechTimer()
    set({ showSpeechBubble: false, speechMessage: '' })
  },
}))

export type { MascotAnimation, MascotState }
