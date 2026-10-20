import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { BookingPanel, HoneyPot, useModalBehaviour } from '../booking/BookingModal'
import { HOST } from '../../lib/bookingApi'
import {
  BUDGETS,
  ROLES,
  SERVICES,
  STAGES,
  TIMELINES,
  submitInquiry,
  summarise,
  type ProjectInquiry,
} from '../../lib/inquiryApi'
import '../booking/booking.css'
import './inquiry.css'

const ease = [0.22, 1, 0.36, 1] as const
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())

type State = 'fork' | 'p1' | 'p2' | 'p3' | 'calendar' | 'quick' | 'sent'
const ORDER: State[] = ['fork', 'p1', 'p2', 'p3', 'calendar', 'quick', 'sent']
const PROGRESS: Partial<Record<State, number>> = { p1: 1, p2: 2, p3: 3 }

const empty: ProjectInquiry = {
  kind: 'project',
  role: '',
  services: [],
  stages: [],
  budget: '',
  timeline: '',
  name: '',
  email: '',
  context: '',
  wantsCall: true,
}

/**
 * "How would you like to connect?" — a fork between a quick message and a 3-step project brief
 * (role & scope → stage & investment → context & contact). Project answers unlock the calendar
 * with the visitor's details already filled in.
 */
export function InquiryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useModalBehaviour(open, onClose)
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="iq-backdrop"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease }}
          data-lenis-prevent
        >
          <Flow onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

/** Answers survive an accidental close or reload for the rest of the browser session. */
const DRAFT_KEY = 'inquiry-draft'
type Draft = { state: State; data: ProjectInquiry }
const RESUMABLE: State[] = ['fork', 'p1', 'p2', 'p3', 'quick']

function loadDraft(): Draft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const d = JSON.parse(raw) as Draft
    return RESUMABLE.includes(d.state) ? { state: d.state, data: { ...empty, ...d.data } } : null
  } catch {
    return null
  }
}
function saveDraft(d: Draft | null) {
  try {
    if (d) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d))
    else sessionStorage.removeItem(DRAFT_KEY)
  } catch {
    /* private mode / storage off: nothing to keep */
  }
}

/** Time left, by step — the effort stays visible as it shrinks. */
const TIME_LEFT: Record<number, string> = { 1: 'about a minute', 2: 'about 40 seconds left', 3: 'last step' }

function Flow({ onClose }: { onClose: () => void }) {
  const [initial] = useState(loadDraft)
  const [state, setState] = useState<State>(initial?.state ?? 'fork')
  const [dir, setDir] = useState(1)
  const [data, setData] = useState<ProjectInquiry>(initial?.data ?? empty)

  // Keep the draft while answering; forget it once it's been sent.
  useEffect(() => {
    saveDraft(RESUMABLE.includes(state) ? { state, data } : null)
  }, [state, data])
  const go = (next: State) => {
    setDir(ORDER.indexOf(next) >= ORDER.indexOf(state) ? 1 : -1)
    setState(next)
  }
  const set = <K extends keyof ProjectInquiry>(key: K, value: ProjectInquiry[K]) => setData((d) => ({ ...d, [key]: value }))

  // The calendar needs room: swap the narrow dialog for the full booking layout.
  if (state === 'calendar') {
    return (
      <motion.div
        key="wide"
        className="bk iq-wide"
        role="dialog"
        aria-modal="true"
        aria-label="Pick a time"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
      >
        <BookingPanel
          onClose={onClose}
          prefill={{ name: data.name.trim(), email: data.email, notes: summarise(data) }}
          heading="Got it. Pick a time."
          subheading="20 minutes on a video call. I’ll read your answers before we talk."
          note="Rather not book now? Close this – I’ll email you within 24 hours."
        />
      </motion.div>
    )
  }

  const step = PROGRESS[state]

  return (
    <motion.div
      className="iq"
      role="dialog"
      aria-modal="true"
      aria-label="Get in touch"
      onClick={(e) => e.stopPropagation()}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.45, ease }}
    >
      <header className="iq__head">
        {step ? (
          <div className="iq__progress" aria-label={`Step ${step} of 3`}>
            <span className="label">{step} of 3</span>
            <span className="iq__bars" aria-hidden>
              {[1, 2, 3].map((n) => (
                <i key={n} className={n <= step ? 'is-done' : ''} />
              ))}
            </span>
            <span className="iq__eta">{TIME_LEFT[step]}</span>
          </div>
        ) : (
          <span />
        )}
        <button className="iq__close" onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </header>

      <div className="iq__body">
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={state}
            custom={dir}
            className="iq__step"
            variants={{
              enter: (d: number) => ({ opacity: 0, x: 24 * d }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: -24 * d }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {state === 'fork' && <Fork onProject={() => go('p1')} onQuick={() => go('quick')} />}
            {state === 'p1' && <ScopeStep data={data} set={set} onBack={() => go('fork')} onNext={() => go('p2')} />}
            {state === 'p2' && <StageStep data={data} set={set} onBack={() => go('p1')} onNext={() => go('p3')} />}
            {state === 'p3' && (
              <ContactStep
                data={data}
                set={set}
                onBack={() => go('p2')}
                onSent={(wantsCall) => go(wantsCall ? 'calendar' : 'sent')}
              />
            )}
            {state === 'quick' && <QuickStep onBack={() => go('fork')} onSent={(email) => { set('email', email); go('sent') }} />}
            {state === 'sent' && <Sent email={data.email} onClose={onClose} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

/* ── State 0 ───────────────────────────────── */

function Fork({ onProject, onQuick }: { onProject: () => void; onQuick: () => void }) {
  return (
    <>
      <h2 className="iq__title">How would you like to connect?</h2>
      <div className="iq__cards">
        <button className="iq__card iq__card--primary" onClick={onProject}>
          <span className="iq__card-title">Start a project</span>
          <span className="iq__card-text">Three short questions, then a 20-minute intro call.</span>
          <Arrow />
        </button>
        <button className="iq__card" onClick={onQuick}>
          <span className="iq__card-title">Quick message</span>
          <span className="iq__card-text">A question or a hello. I reply within a day.</span>
          <Arrow />
        </button>
      </div>
      <p className="iq__foot">
        Prefer email? <a href={`mailto:${HOST.email}`}>{HOST.email}</a>
      </p>
    </>
  )
}

/* ── Project track ─────────────────────────── */

type StepProps = {
  data: ProjectInquiry
  set: <K extends keyof ProjectInquiry>(key: K, value: ProjectInquiry[K]) => void
  onBack: () => void
  onNext: () => void
}

/** ms of no further picks before step 1 moves on by itself (long enough to add more services). */
const AUTO_ADVANCE_MS = 1400

function ScopeStep({ data, set, onBack, onNext }: StepProps) {
  // Only after a pick on this visit — coming Back to a finished step must not bounce forward.
  const [picks, setPicks] = useState(0)
  const ready = !!data.role && data.services.length > 0
  const next = useRef(onNext)
  useEffect(() => {
    next.current = onNext
  })
  useEffect(() => {
    if (!picks || !ready) return
    const t = window.setTimeout(() => next.current(), AUTO_ADVANCE_MS)
    return () => window.clearTimeout(t)
  }, [picks, ready])

  return (
    <>
      <h2 className="iq__title">You and the project</h2>
      <Question label="Your role">
        <Chips
          options={ROLES}
          value={[data.role]}
          onChange={(v) => {
            set('role', v[0] ?? '')
            setPicks((n) => n + 1)
          }}
        />
      </Question>
      <Question label="What needs designing?" hint="pick any">
        <Chips
          options={SERVICES}
          value={data.services}
          onChange={(v) => {
            set('services', v)
            setPicks((n) => n + 1)
          }}
          multi
        />
      </Question>
      <Actions onBack={onBack} next={{ label: 'Continue', disabled: !data.role || !data.services.length, onClick: onNext }} />
    </>
  )
}

function StageStep({ data, set, onBack, onNext }: StepProps) {
  return (
    <>
      <h2 className="iq__title">Stage and budget</h2>
      <p className="iq__sub">So the scope I suggest fits where you are.</p>
      <Question label="Business stage" hint="pick any">
        <Chips options={STAGES} value={data.stages} onChange={(v) => set('stages', v)} multi />
      </Question>
      <Question label="Budget">
        <Chips options={BUDGETS} value={[data.budget]} onChange={(v) => set('budget', v[0] ?? '')} />
      </Question>
      <Question label="When do you want to start?">
        <Chips options={TIMELINES} value={[data.timeline]} onChange={(v) => set('timeline', v[0] ?? '')} />
      </Question>
      <Actions
        onBack={onBack}
        next={{ label: 'Continue', disabled: !data.stages.length || !data.budget || !data.timeline, onClick: onNext }}
      />
    </>
  )
}

function ContactStep({
  data,
  set,
  onBack,
  onSent,
}: Omit<StepProps, 'onNext'> & { onSent: (wantsCall: boolean) => void }) {
  const [touched, setTouched] = useState(false)
  const [sending, setSending] = useState<null | 'call' | 'message'>(null)
  const [website, setWebsite] = useState('') // hidden spam trap
  const [error, setError] = useState<string | null>(null)
  const emailOk = isEmail(data.email)

  const send = async (wantsCall: boolean) => {
    setTouched(true)
    if (!emailOk || sending) return
    setSending(wantsCall ? 'call' : 'message')
    setError(null)
    try {
      await submitInquiry({ ...data, name: data.name.trim(), email: data.email.trim(), wantsCall, website })
      onSent(wantsCall)
    } catch (err) {
      setError(err instanceof Error ? err.message : `That didn’t go through. Try again, or email ${HOST.email}.`)
      setSending(null)
    }
  }

  return (
    <form
      onSubmit={(e: FormEvent) => {
        e.preventDefault()
        send(true)
      }}
      noValidate
    >
      <h2 className="iq__title">Where can I reach you?</h2>
      <HoneyPot value={website} onChange={setWebsite} />
      {/* Email first: if someone stops here, there's still a way to follow up. Name is optional. */}
      <div className="iq__row">
        <Field label="Work email" error={touched && !emailOk ? 'Check your email' : null}>
          <input type="email" value={data.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" />
        </Field>
        <Field label="Name (optional)">
          <input value={data.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" />
        </Field>
      </div>
      <Field label="What are you building?">
        <textarea
          rows={4}
          value={data.context}
          onChange={(e) => set('context', e.target.value)}
          placeholder="A link to your site or deck, or two sentences about the product."
        />
      </Field>
      {error && <p className="iq__error">{error}</p>}
      <div className="iq__actions">
        <BackButton onClick={onBack} />
        <button type="submit" className="btn" disabled={!!sending}>
          {sending === 'call' ? 'Sending…' : 'Pick a time'} <Arrow />
        </button>
      </div>
      <button type="button" className="iq__alt" onClick={() => send(false)} disabled={!!sending}>
        {sending === 'message' ? 'Sending…' : 'Send without booking a call'}
      </button>
    </form>
  )
}

/* ── Quick inquiry ─────────────────────────── */

function QuickStep({ onBack, onSent }: { onBack: () => void; onSent: (email: string) => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [website, setWebsite] = useState('') // hidden spam trap
  const [touched, setTouched] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ok = name.trim().length > 1 && isEmail(email) && message.trim().length > 1

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTouched(true)
    if (!ok || sending) return
    setSending(true)
    try {
      await submitInquiry({ kind: 'quick', name: name.trim(), email: email.trim(), message: message.trim(), website })
      onSent(email.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : `That didn’t go through. Try again, or email ${HOST.email}.`)
      setSending(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <h2 className="iq__title">Quick message</h2>
      <HoneyPot value={website} onChange={setWebsite} />
      <div className="iq__row">
        <Field label="Name" error={touched && name.trim().length < 2 ? 'Add your name' : null}>
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </Field>
        <Field label="Email" error={touched && !isEmail(email) ? 'Check your email' : null}>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </Field>
      </div>
      <Field label="Message" error={touched && message.trim().length < 2 ? 'Add a short message' : null}>
        <textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} />
      </Field>
      {error && <p className="iq__error">{error}</p>}
      <div className="iq__actions">
        <BackButton onClick={onBack} />
        <button type="submit" className="btn" disabled={sending}>
          {sending ? 'Sending…' : 'Send message'}
        </button>
      </div>
    </form>
  )
}

function Sent({ email, onClose }: { email: string; onClose: () => void }) {
  return (
    <div className="iq__sent">
      <span className="iq__check" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
      </span>
      <h2 className="iq__title">Sent</h2>
      <p className="iq__sub">I’ll reply to {email || 'you'} within 24 hours.</p>
      <button className="btn" onClick={onClose}>Done</button>
    </div>
  )
}

/* ── Building blocks ───────────────────────── */

function Question({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="iq__q">
      <legend className="label label--muted">
        {label}
        {hint && <span className="iq__hint"> · {hint}</span>}
      </legend>
      {children}
    </fieldset>
  )
}

/** Pill grid. Single-select toggles one value; multi-select toggles each. */
function Chips({
  options,
  value,
  onChange,
  multi = false,
}: {
  options: readonly string[]
  value: string[]
  onChange: (v: string[]) => void
  multi?: boolean
}) {
  const toggle = (o: string) => {
    if (multi) onChange(value.includes(o) ? value.filter((v) => v !== o) : [...value, o])
    else onChange(value.includes(o) ? [] : [o])
  }
  return (
    <div className="iq__chips">
      {options.map((o) => (
        <button key={o} type="button" className="iq__chip" aria-pressed={value.includes(o)} onClick={() => toggle(o)}>
          {o}
        </button>
      ))}
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string | null; children: ReactNode }) {
  return (
    <label className="iq__field">
      <span className="label label--muted">{label}</span>
      {children}
      {error && <span className="iq__error">{error}</span>}
    </label>
  )
}

function Actions({ onBack, next }: { onBack: () => void; next: { label: string; disabled: boolean; onClick: () => void } }) {
  return (
    <div className="iq__actions">
      <BackButton onClick={onBack} />
      <button type="button" className="btn" disabled={next.disabled} onClick={next.onClick}>
        {next.label} <Arrow />
      </button>
    </div>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="label iq__back" onClick={onClick}>
      ← Back
    </button>
  )
}

function Arrow() {
  return (
    <svg className="iq__arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}
