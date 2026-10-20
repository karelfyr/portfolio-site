/** The three endpoints: availability, booking, inquiry. */
import { calendarConnected, canMailGuests, config } from './config.ts'
import { busyBetween, createEvent, type Interval } from './google.ts'
import { layout, sendMail } from './mail.ts'
import { freeSlots, ruleSlots } from './slots.ts'

export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/* ── Availability ─────────────────────────── */

// Free/busy is cached briefly so a burst of visitors doesn't hit Google on every page view.
let busyCache: { at: number; busy: Interval[] } | null = null
const BUSY_TTL = 60_000

async function currentBusy(fresh = false): Promise<Interval[]> {
  if (!calendarConnected()) return []
  if (!fresh && busyCache && Date.now() - busyCache.at < BUSY_TTL) return busyCache.busy
  const now = new Date()
  const until = new Date(now.getTime() + (config.booking.horizonDays + 2) * 86_400_000)
  const busy = await busyBetween(now, until)
  busyCache = { at: Date.now(), busy }
  return busy
}

export async function availability() {
  const slots = freeSlots(ruleSlots(), await currentBusy())
  return { slots: slots.map((s) => s.toISOString()), minutes: config.booking.minutes, demo: !calendarConnected() }
}

/* ── Validation ───────────────────────────── */

const isEmail = (s: unknown): s is string => typeof s === 'string' && s.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const list = (v: unknown, max: number) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').map((x) => x.slice(0, 80)).slice(0, max) : []
/** Hidden "website" field: people never fill it, form-filling bots do. */
const isBot = (body: Record<string, unknown>) => typeof body.website === 'string' && body.website.trim() !== ''

const formatWhen = (d: Date, timeZone: string) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(d)

/* ── Booking ──────────────────────────────── */

// Two people clicking the same slot at once: only the first one gets it.
const inFlight = new Set<string>()

export async function book(body: Record<string, unknown>) {
  const email = text(body.email, 254)
  const name = text(body.name, 120)
  const notes = text(body.notes, 4000)
  const guestZone = text(body.timeZone, 64) || config.booking.timeZone
  const startIso = text(body.start, 40)
  if (!isEmail(email)) throw new HttpError(400, 'Check your email address.')
  if (isBot(body)) return { ok: true, demo: true } // pretend success, do nothing

  const start = new Date(startIso)
  if (Number.isNaN(start.getTime())) throw new HttpError(400, 'That time isn’t valid – pick another.')
  // Must be a slot the rules offer (right length, hours, notice and horizon) …
  if (!ruleSlots().some((s) => s.getTime() === start.getTime())) {
    throw new HttpError(409, 'That time isn’t available any more – pick another.')
  }
  if (inFlight.has(startIso)) throw new HttpError(409, 'Someone is booking that time right now – pick another.')
  inFlight.add(startIso)
  try {
    // … and still free in the calendar right now (fresh check, not the cache).
    if (!freeSlots([start], await currentBusy(true)).length) {
      throw new HttpError(409, 'That time was just taken – pick another.')
    }
    const end = new Date(start.getTime() + config.booking.minutes * 60_000)
    const who = name || email
    const summary = `${config.booking.title} – ${who}`
    const description = [`Booked via the portfolio site.`, '', name && `Name: ${name}`, `Email: ${email}`, notes && `\n${notes}`]
      .filter(Boolean)
      .join('\n')

    let meetLink: string | null = null
    let eventLink: string | null = null
    if (calendarConnected()) {
      const created = await createEvent({ start, end, summary, description, guest: { email, name } })
      meetLink = created.meetLink
      eventLink = created.htmlLink
      busyCache = null // the new event is busy time now
    } else {
      console.log(`[calendar:demo] would create "${summary}" at ${start.toISOString()}`)
    }

    // Tell you. Reply goes straight to the guest.
    const mail = layout(
      `New call booked: ${who}`,
      [
        ['When', `${formatWhen(start, config.booking.timeZone)}`],
        ['Their time', guestZone !== config.booking.timeZone ? formatWhen(start, guestZone) : null],
        ['Name', name],
        ['Email', email],
        ['Meet', meetLink],
        ['Calendar', eventLink],
        ['Details', notes],
      ],
      'Reply to this email to write to them directly.',
    )
    await sendMail({ to: config.mail.notify, replyTo: email, subject: `New call: ${who} – ${formatWhen(start, config.booking.timeZone)}`, ...mail }).catch(
      (err) => console.error('[mail] booking notification failed:', err), // the booking itself stands
    )
    return { ok: true, meetLink, demo: !calendarConnected() }
  } finally {
    inFlight.delete(startIso)
  }
}

/* ── Inquiry ──────────────────────────────── */

export async function inquiry(body: Record<string, unknown>) {
  const email = text(body.email, 254)
  const name = text(body.name, 120)
  if (!isEmail(email)) throw new HttpError(400, 'Check your email address.')
  if (isBot(body)) return { ok: true }

  if (body.kind === 'quick') {
    const message = text(body.message, 4000)
    if (message.length < 2) throw new HttpError(400, 'Add a short message.')
    const mail = layout(`New message from ${name || email}`, [
      ['Name', name],
      ['Email', email],
      ['Message', message],
    ], 'Reply to this email to answer them.')
    await sendMail({ to: config.mail.notify, replyTo: email, subject: `New message: ${name || email}`, ...mail })
    await acknowledge(email, name)
    return { ok: true }
  }

  // Project brief
  const role = text(body.role, 80)
  const budget = text(body.budget, 80)
  const timeline = text(body.timeline, 80)
  const services = list(body.services, 10)
  const stages = list(body.stages, 10)
  const context = text(body.context, 4000)
  const wantsCall = body.wantsCall === true
  const mail = layout(
    `New project inquiry: ${name || email}`,
    [
      ['Name', name],
      ['Email', email],
      ['Role', role],
      ['Needs', services.join(', ')],
      ['Stage', stages.join(', ')],
      ['Budget', budget],
      ['Timeline', timeline],
      ['Building', context],
      ['Next', wantsCall ? 'Picking a time on your calendar now – a booking email follows if they book.' : 'Sent without booking – they expect a reply within 24 hours.'],
    ],
    'Reply to this email to answer them.',
  )
  await sendMail({
    to: config.mail.notify,
    replyTo: email,
    subject: `New project: ${name || email} – ${budget || 'budget n/a'}, ${timeline || 'timeline n/a'}`,
    ...mail,
  })
  if (!wantsCall) await acknowledge(email, name)
  return { ok: true }
}

/** "Got your message" to the visitor — only when the sender address can mail anyone. */
async function acknowledge(email: string, name: string) {
  if (!canMailGuests()) return
  const mail = layout(
    `Thanks${name ? `, ${name.split(' ')[0]}` : ''} – your message is in`,
    [['What happens next', 'I read every message myself and reply within 24 hours.']],
    `— ${config.mail.notify}`,
  )
  await sendMail({ to: email, replyTo: config.mail.notify, subject: 'Got your message', ...mail }).catch((err) =>
    console.error('[mail] acknowledgement failed:', err),
  )
}
