/** Turns the booking rules + busy times into bookable slot starts. */
import { config } from './config.ts'
import { zonedTime } from '../src/lib/timezone.ts'
import type { Interval } from './google.ts'

/** Every slot the rules allow from now to the horizon (ignores the calendar). */
export function ruleSlots(now = new Date()): Date[] {
  const r = config.booking
  const step = r.minutes
  const earliest = now.getTime() + r.noticeHours * 3600_000
  const slots: Date[] = []
  for (let d = 0; d <= r.horizonDays; d++) {
    const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + d))
    const y = day.getUTCFullYear()
    const m = day.getUTCMonth()
    const date = day.getUTCDate()
    // Weekday as seen in the host zone (noon avoids edge cases around midnight / DST).
    const weekday = new Date(zonedTime(y, m, date, 12, 0, r.timeZone)).getUTCDay()
    if (!r.weekdays.includes(weekday)) continue
    for (let minute = r.dayStart * 60; minute + step <= r.dayEnd * 60; minute += step) {
      const h = Math.floor(minute / 60)
      const endH = (minute + step) / 60
      if (h < r.lunch[1] && endH > r.lunch[0]) continue // overlaps lunch
      const at = zonedTime(y, m, date, h, minute % 60, r.timeZone)
      if (at.getTime() >= earliest) slots.push(at)
    }
  }
  return slots
}

/** Slots that don't touch a busy interval (with the buffer kept free on both sides). */
export function freeSlots(slots: Date[], busy: Interval[]): Date[] {
  const len = config.booking.minutes * 60_000
  const buffer = config.booking.bufferMinutes * 60_000
  return slots.filter((s) => {
    const start = s.getTime() - buffer
    const end = s.getTime() + len + buffer
    return !busy.some((b) => b.start < end && b.end > start)
  })
}
