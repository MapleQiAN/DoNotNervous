import { format, startOfDay } from 'date-fns'

export function toDayKey(date: Date): string {
  return format(startOfDay(date), 'yyyy-MM-dd')
}

export function daysAgo(n: number): string {
  return toDayKey(new Date(Date.now() - n * 86400000))
}
