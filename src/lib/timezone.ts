/** Small, dependency-free time-zone helpers built on Intl. */

/** The visitor's own time zone, e.g. "Europe/Prague". */
export const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

/** Minutes the zone is ahead of UTC at a given instant (handles daylight saving). */
function offsetMinutes(at: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(at)
  const get = (type: string) => Number(parts.find((p) => p.type === type)!.value)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return Math.round((asUtc - at.getTime()) / 60000)
}

/** The instant for a wall-clock time in a zone, e.g. 10:00 in New York on 2026-10-20. */
export function zonedTime(year: number, month: number, day: number, hour: number, minute: number, timeZone: string) {
  const guess = Date.UTC(year, month, day, hour, minute)
  let t = guess - offsetMinutes(new Date(guess), timeZone) * 60000
  const corrected = guess - offsetMinutes(new Date(t), timeZone) * 60000 // across a DST switch
  if (corrected !== t) t = corrected
  return new Date(t)
}

/** "YYYY-MM-DD" of an instant as seen in a zone. */
export function dayKey(at: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(at)
}

/** Clock time of an instant in a zone, 12h ("7:20pm") or 24h ("19:20"). */
export function clock(at: Date, timeZone: string, h24: boolean) {
  const s = new Intl.DateTimeFormat('en-US', { timeZone, hour: 'numeric', minute: '2-digit', hourCycle: h24 ? 'h23' : 'h12' }).format(at)
  return h24 ? s : s.replace(' ', '').toLowerCase()
}

/** A readable list of zones for the picker (the visitor's own first). */
export function timeZoneOptions() {
  const all: string[] =
    typeof Intl.supportedValuesOf === 'function'
      ? Intl.supportedValuesOf('timeZone')
      : ['Europe/Prague', 'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Asia/Bangkok']
  return [localTimeZone, ...all.filter((z) => z !== localTimeZone)]
}
