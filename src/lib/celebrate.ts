import confetti from 'canvas-confetti'

const MASCOT_ORIGIN = { x: 0.85, y: 0.8 }
const WARM_PALETTE = ['#f7b955', '#f08a55', '#fbd58b', '#4f915b']

interface CelebrateOptions {
  particleCount: number
  spread: number
}

export function celebrate(options: CelebrateOptions): void {
  confetti({
    ...options,
    origin: MASCOT_ORIGIN,
    colors: WARM_PALETTE,
    startVelocity: 30,
    gravity: 0.8,
    ticks: 200,
  })
}

export const celebrateTaskComplete = (): void =>
  celebrate({ particleCount: 30, spread: 50 })

export const celebrateMoodLog = (): void =>
  celebrate({ particleCount: 20, spread: 40 })

export const celebrateRedemption = (): void =>
  celebrate({ particleCount: 90, spread: 68 })

export const celebrateStreakMilestone = (): void =>
  celebrate({ particleCount: 120, spread: 80 })
