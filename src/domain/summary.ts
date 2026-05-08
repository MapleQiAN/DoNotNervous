export const MOOD_SCORE: Record<string, number> = {
  '😊': 4, '😌': 3, '🥳': 5, '💪': 5,
  '😐': 2, '😔': 1, '😰': 1, '😡': 1,
}

export function getWeekRange(date: Date): { startDayKey: string; endDayKey: string } {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  const startDayKey = d.toISOString().slice(0, 10)
  d.setDate(d.getDate() + 6)
  const endDayKey = d.toISOString().slice(0, 10)
  return { startDayKey, endDayKey }
}
