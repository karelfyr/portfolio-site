import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { setScrollLocked } from '../SmoothScroll'
import { EVENT, HOST, book, getAvailability } from '../../lib/bookingApi'
import { clock, dayKey, localTimeZone, timeZoneOptions } from '../../lib/timezone'
import './booking.css'

const ease = [0.22, 1, 0.36, 1] as const
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

type Step = 'pick' | 'details' | 'done'
type Month = { y: number; m: number }

const keyOf = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
const parseKey = (k: string) => {
  const [y, m, d] = k.split('-').map(Number)
  return { y, m: m - 1, d }
}
const ordinal = (d: number) => {
  const s = d % 100 >= 11 && d % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][d % 10] ?? 'th'
  return `${d}${s}`
}
/** "Tue" for a YYYY-MM-DD key. */
const weekdayOf = (k: string) => {
  const { y, m, d } = parseKey(k)
  return WEEKDAYS[new Date(Date.UTC(y, m, d)).getUTCDay()]
}
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())

/**
 * Booking popup: event info · month calendar · time slots, then a short details form and a
 * confirmation. Times are shown in the visitor's time zone (changeable), 12h or 24h.
 */
export function BookingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useModalBehaviour(open, onClose)
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="bk-backdrop"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease }}
          data-lenis-prevent
        >
          <motion.div
            className="bk"
            role="dialog"
            aria-modal="true"
            aria-label={`Book: ${EVENT.title}`}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.99 }}
            transition={{ duration: 0.5, ease }}
          >
            <BookingPanel onClose={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/** Locks page scroll and closes on Esc while a popup is open. */
export function useModalBehaviour(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    setScrollLocked(true)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      setScrollLocked(false)
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])
}

/** Someone we already know (e.g. from the project form): no details form, just confirm. */
export type Prefill = { name: string; email: string; notes: string }

type PanelProps = {
  onClose: () => void
  /** Known guest: picking a time goes straight to a one-click confirm. */
  prefill?: Prefill
  /** Replaces the event title / description in the left column. */
  heading?: string
  subheading?: string
  /** Small reassurance line at the bottom of the left column. */
  note?: string
  onBooked?: () => void
}

/**
 * The booking UI itself: event info · month calendar · time slots, then details (or a one-click
 * confirm for a prefilled guest) and a confirmation. Used by BookingModal and the project flow.
 */
export function BookingPanel({ onClose, prefill, heading, subheading, note, onBooked }: PanelProps) {
  const [slots, setSlots] = useState<string[] | null>(null)
  const [tz, setTz] = useState(localTimeZone)
  const [h24, setH24] = useState(false)
  const [month, setMonth] = useState<Month | null>(null)
  const [day, setDay] = useState<string | null>(null)
  const [slot, setSlot] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('pick')

  const [loadError, setLoadError] = useState(false)
  useEffect(() => {
    getAvailability()
      .then(setSlots)
      .catch(() => {
        setLoadError(true)
        setSlots([])
      })
  }, [])

  // Free slots grouped by day, as seen in the chosen time zone.
  const byDay = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const s of slots ?? []) {
      const k = dayKey(new Date(s), tz)
      map.set(k, [...(map.get(k) ?? []), s])
    }
    return map
  }, [slots, tz])
  const days = useMemo(() => [...byDay.keys()].sort(), [byDay])

  // Start on the first day with free time (and keep the selection valid when the zone changes).
  useEffect(() => {
    if (!days.length) return
    if (!day || !byDay.has(day)) {
      setDay(days[0])
      const { y, m } = parseKey(days[0])
      setMonth({ y, m })
    }
  }, [days, byDay, day])

  const today = dayKey(new Date(), tz)
  const first = days.length ? parseKey(days[0]) : null
  const last = days.length ? parseKey(days[days.length - 1]) : null
  const canPrev = !!month && !!first && (month.y > first.y || (month.y === first.y && month.m > first.m))
  const canNext = !!month && !!last && (month.y < last.y || (month.y === last.y && month.m < last.m))
  const shiftMonth = (by: number) =>
    setMonth((mo) => (mo ? { y: mo.y + Math.floor((mo.m + by) / 12), m: (((mo.m + by) % 12) + 12) % 12 } : mo))

  const pickSlot = (s: string) => {
    setSlot(s)
    setStep('details')
  }

  return (
    <div className={`bk__grid bk__grid--${step}`}>
      <button className="bk__close" onClick={onClose} aria-label="Close">
        <Icon name="close" />
      </button>

      {/* Event info */}
      <aside className="bk__info">
        <img className="bk__avatar" src={HOST.photo} alt="" />
        <p className="label label--muted bk__host">{HOST.name}</p>
        <h2 className="bk__title">{heading ?? EVENT.title}</h2>
        <p className="bk__desc">{subheading ?? EVENT.description}</p>
        {!note && (
          <p className="bk__desc">
            For quick questions email <a href={`mailto:${HOST.email}`}>{HOST.email}</a>
          </p>
        )}
        <ul className="bk__meta">
          <li>
            <Icon name="clock" /> {EVENT.minutes}m
          </li>
          <li>
            <Icon name="video" /> {EVENT.location}
          </li>
          <li>
            <Icon name="globe" />
            <label className="bk__tz">
              <span className="sr-only">Time zone</span>
              <select value={tz} onChange={(e) => setTz(e.target.value)}>
                {timeZoneOptions().map((z) => (
                  <option key={z} value={z}>
                    {z.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
              <Icon name="chevron-down" />
            </label>
          </li>
        </ul>
        {step !== 'pick' && slot && (
          <p className="bk__chosen">
            {weekdayOf(dayKey(new Date(slot), tz))}, {MONTHS[parseKey(dayKey(new Date(slot), tz)).m].slice(0, 3)}{' '}
            {parseKey(dayKey(new Date(slot), tz)).d} · {clock(new Date(slot), tz, h24)} –{' '}
            {clock(new Date(new Date(slot).getTime() + EVENT.minutes * 60000), tz, h24)}
          </p>
        )}
        {note && <p className="bk__desc bk__note">{note}</p>}
      </aside>

      <AnimatePresence mode="wait" initial={false}>
        {step === 'pick' && (
          <motion.div
            key="pick"
            className="bk__pick"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Calendar */}
            <section className="bk__cal" aria-label="Choose a date">
              <header className="bk__cal-head">
                <h3 className="bk__month">
                  {month ? (
                    <>
                      {MONTHS[month.m]} <span>{month.y}</span>
                    </>
                  ) : (
                    ' '
                  )}
                </h3>
                <div className="bk__nav">
                  <button onClick={() => shiftMonth(-1)} disabled={!canPrev} aria-label="Previous month">
                    <Icon name="chevron-left" />
                  </button>
                  <button onClick={() => shiftMonth(1)} disabled={!canNext} aria-label="Next month">
                    <Icon name="chevron-right" />
                  </button>
                </div>
              </header>
              <div className="bk__weekdays" aria-hidden>
                {WEEKDAYS.map((w) => (
                  <span key={w} className="label">{w}</span>
                ))}
              </div>
              {month ? (
                <div className="bk__days">
                  {Array.from({ length: new Date(month.y, month.m, 1).getDay() }, (_, i) => (
                    <span key={`pad-${i}`} />
                  ))}
                  {Array.from({ length: new Date(month.y, month.m + 1, 0).getDate() }, (_, i) => {
                    const k = keyOf(month.y, month.m, i + 1)
                    const free = byDay.has(k)
                    return (
                      <button
                        key={k}
                        className={`bk__day${free ? ' is-free' : ''}${k === day ? ' is-selected' : ''}${k === today ? ' is-today' : ''}`}
                        disabled={!free}
                        aria-pressed={k === day}
                        aria-label={`${weekdayOf(k)} ${i + 1} ${MONTHS[month.m]}${free ? '' : ', no free times'}`}
                        onClick={() => setDay(k)}
                      >
                        {i + 1}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="bk__days bk__days--loading" aria-busy="true" />
              )}
            </section>

            {/* Times for the selected day */}
            <section className="bk__times" aria-label="Choose a time">
              <header className="bk__times-head">
                <h3 className="bk__dayname">
                  {day ? (
                    <>
                      {weekdayOf(day)} <span>{ordinal(parseKey(day).d)}</span>
                    </>
                  ) : (
                    ' '
                  )}
                </h3>
                <div className="bk__toggle" role="group" aria-label="Clock format">
                  <button aria-pressed={!h24} onClick={() => setH24(false)}>12h</button>
                  <button aria-pressed={h24} onClick={() => setH24(true)}>24h</button>
                </div>
              </header>
              <div className="bk__slots">
                {slots === null && <p className="bk__empty">Loading times…</p>}
                {slots !== null && day && (byDay.get(day) ?? []).map((s) => (
                  <button key={s} className="bk__slot" onClick={() => pickSlot(s)}>
                    {clock(new Date(s), tz, h24)}
                  </button>
                ))}
                {slots !== null && !days.length && (
                  <p className="bk__empty">
                    {loadError ? 'Couldn’t load my calendar' : 'No free times right now'} – email{' '}
                    <a href={`mailto:${HOST.email}`}>{HOST.email}</a> instead.
                  </p>
                )}
              </div>
            </section>
          </motion.div>
        )}

        {step === 'details' && slot && (
          <motion.div
            key="details"
            className="bk__panel"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease }}
          >
            {prefill ? (
              <ConfirmGuest
                slot={slot}
                tz={tz}
                h24={h24}
                guest={prefill}
                onBack={() => setStep('pick')}
                onDone={() => {
                  setStep('done')
                  onBooked?.()
                }}
              />
            ) : (
              <DetailsForm
                slot={slot}
                tz={tz}
                onBack={() => setStep('pick')}
                onDone={() => {
                  setStep('done')
                  onBooked?.()
                }}
              />
            )}
          </motion.div>
        )}

        {step === 'done' && slot && (
          <motion.div
            key="done"
            className="bk__panel bk__done"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
          >
            <span className="bk__check" aria-hidden>
              <Icon name="check" />
            </span>
            <h3 className="bk__title">You’re booked</h3>
            <p className="bk__desc">The invite with the {EVENT.location} link is on its way to your inbox.</p>
            <button className="btn" onClick={onClose}>Done</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Prefilled guest: a summary and one Confirm button. */
function ConfirmGuest({
  slot,
  tz,
  h24,
  guest,
  onBack,
  onDone,
}: {
  slot: string
  tz: string
  h24: boolean
  guest: Prefill
  onBack: () => void
  onDone: () => void
}) {
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const at = new Date(slot)
  const k = dayKey(at, tz)
  const { m, d } = parseKey(k)

  const confirm = async () => {
    setSending(true)
    setError(null)
    try {
      await book({ start: slot, name: guest.name, email: guest.email, notes: guest.notes, timeZone: tz })
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : `That didn’t go through. Try again, or email ${HOST.email}.`)
      setSending(false)
    }
  }

  return (
    <div className="bk__form">
      <h3 className="bk__form-title">Confirm your call</h3>
      <dl className="bk__summary">
        <div>
          <dt className="label label--muted">When</dt>
          <dd>
            {weekdayOf(k)}, {MONTHS[m]} {d} · {clock(at, tz, h24)} – {clock(new Date(at.getTime() + EVENT.minutes * 60000), tz, h24)}
          </dd>
        </div>
        <div>
          <dt className="label label--muted">Guest</dt>
          <dd>
            {guest.name ? `${guest.name} · ${guest.email}` : guest.email}
          </dd>
        </div>
      </dl>
      {error && <p className="bk__error">{error}</p>}
      <div className="bk__actions">
        <button type="button" className="label bk__back" onClick={onBack}>
          <Icon name="chevron-left" /> Back
        </button>
        <button type="button" className="btn" onClick={confirm} disabled={sending}>
          {sending ? 'Booking…' : 'Confirm booking'}
        </button>
      </div>
    </div>
  )
}

function DetailsForm({ slot, tz, onBack, onDone }: { slot: string; tz: string; onBack: () => void; onDone: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [website, setWebsite] = useState('') // hidden spam trap
  const [touched, setTouched] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const valid = name.trim().length > 1 && isEmail(email)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!valid || sending) return
    setSending(true)
    setError(null)
    try {
      await book({ start: slot, name: name.trim(), email: email.trim(), notes: notes.trim(), timeZone: tz, website })
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : `That didn’t go through. Try again, or email ${HOST.email}.`)
      setSending(false)
    }
  }

  return (
    <form className="bk__form" onSubmit={submit} noValidate>
      <h3 className="bk__form-title">Your details</h3>
      <HoneyPot value={website} onChange={setWebsite} />
      <label className="bk__field">
        <span className="label label--muted">Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" autoFocus />
        {touched && name.trim().length < 2 && <span className="bk__error">Add your name</span>}
      </label>
      <label className="bk__field">
        <span className="label label--muted">Email</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        {touched && !isEmail(email) && <span className="bk__error">Check your email</span>}
      </label>
      <label className="bk__field">
        <span className="label label--muted">What are you working on? (optional)</span>
        <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      {error && <p className="bk__error">{error}</p>}
      <div className="bk__actions">
        <button type="button" className="label bk__back" onClick={onBack}>
          <Icon name="chevron-left" /> Back
        </button>
        <button type="submit" className="btn" disabled={sending}>
          {sending ? 'Booking…' : 'Confirm booking'}
        </button>
      </div>
    </form>
  )
}

/** Off-screen field people never see or fill; bots fill every field and get silently ignored. */
export function HoneyPot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      className="hp"
      name="website"
      tabIndex={-1}
      autoComplete="off"
      aria-hidden
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

type IconName = 'clock' | 'video' | 'globe' | 'chevron-left' | 'chevron-right' | 'chevron-down' | 'close' | 'check'

function Icon({ name }: { name: IconName }) {
  const common = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
  switch (name) {
    case 'clock':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
    case 'video':
      return <svg {...common}><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3" /></svg>
    case 'globe':
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>
    case 'chevron-left':
      return <svg {...common}><path d="m15 6-6 6 6 6" /></svg>
    case 'chevron-right':
      return <svg {...common}><path d="m9 6 6 6-6 6" /></svg>
    case 'chevron-down':
      return <svg {...common}><path d="m6 9 6 6 6-6" /></svg>
    case 'close':
      return <svg {...common}><path d="M6 6l12 12M18 6 6 18" /></svg>
    case 'check':
      return <svg {...common}><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
  }
}
