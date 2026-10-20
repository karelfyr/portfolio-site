import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

export const EMAIL = 'karelfyrbach@gmail.com'
/** LinkedIn profile (footer and Contact page). */
export const LINKEDIN = 'https://www.linkedin.com/in/karelfyrbach/'
const ease = [0.22, 1, 0.36, 1] as const

/** Copies text; falls back to a hidden textarea where the async clipboard API isn't allowed. */
async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    ta.remove()
    return ok
  }
}

/** How long "Copied" stays before easing back (ms). */
const COPIED_MS = 2200

/** "Copied" for a while after copying. */
function useCopy(onChange?: (copied: boolean) => void) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const reset = useRef(0)
  useEffect(() => () => window.clearTimeout(reset.current), [])
  const run = async () => {
    if (!(await copy(EMAIL))) return
    window.clearTimeout(timer.current)
    window.clearTimeout(reset.current)
    setCopied(true)
    onChange?.(true)
    // First let the buttons ease away, then quietly reset the label once they're gone.
    timer.current = window.setTimeout(() => {
      onChange?.(false)
      reset.current = window.setTimeout(() => setCopied(false), 500)
    }, COPIED_MS)
  }
  return { copied, run }
}

/**
 * The email address as text. Hover (or tap, or focus) opens a small menu above it:
 * open it in the mail app, or copy it.
 */
export function EmailMenu({ className = 'label' }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const { copied, run } = useCopy()
  const closeTimer = useRef(0)
  const root = useRef<HTMLSpanElement>(null)

  const show = () => {
    window.clearTimeout(closeTimer.current)
    setOpen(true)
  }
  // A short grace period, so moving the mouse from the address up into the menu doesn't close it.
  const hide = () => {
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setOpen(false), 160)
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onDown = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false)
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
    }
  }, [open])
  useEffect(() => () => window.clearTimeout(closeTimer.current), [])

  return (
    <span
      ref={root}
      className="email-menu"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && hide()}
    >
      <button
        type="button"
        className={`${className} email-menu__address`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {EMAIL}
      </button>
      <AnimatePresence>
        {open && (
          <motion.span
            className="email-menu__pop"
            role="menu"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2, ease }}
          >
            <a role="menuitem" className="email-menu__item" href={`mailto:${EMAIL}`} onClick={() => setOpen(false)}>
              Open in email app
              <Icon name="out" />
            </a>
            <button role="menuitem" type="button" className="email-menu__item" onClick={run}>
              {copied ? 'Copied' : 'Copy to clipboard'}
              <Icon name={copied ? 'check' : 'copy'} />
            </button>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

/**
 * The same two actions as buttons (Contact page). Neither is primary; they're hidden until the
 * email block is hovered or focused, then slide in one after the other (always shown on touch).
 */
export function EmailButtons({ onCopied }: { onCopied?: (copied: boolean) => void }) {
  const { copied, run } = useCopy(onCopied)
  return (
    <div className="email-buttons">
      <button type="button" className="btn btn--ghost email-buttons__copy" onClick={run} aria-live="polite">
        {/* "Copy email" ⇄ "Copied" cross-fade with the site's blur, instead of snapping */}
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={copied ? 'copied' : 'copy'}
            className="email-buttons__label"
            initial={{ opacity: 0, filter: 'blur(4px)', y: 4 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            exit={{ opacity: 0, filter: 'blur(4px)', y: -4 }}
            transition={{ duration: 0.35, ease }}
          >
            <Icon name={copied ? 'check' : 'copy'} /> {copied ? 'Copied' : 'Copy email'}
          </motion.span>
        </AnimatePresence>
      </button>
      <a className="btn btn--ghost" href={`mailto:${EMAIL}`}>
        <Icon name="out" /> Open email app
      </a>
    </div>
  )
}

export function Icon({ name }: { name: 'out' | 'copy' | 'check' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" strokeLinejoin="miter" aria-hidden>
      {name === 'out' && <path d="M7 17 17 7M9 7h8v8" />}
      {name === 'copy' && (
        <>
          <rect x="9" y="9" width="11" height="11" />
          <path d="M5 15V4h11" />
        </>
      )}
      {name === 'check' && <path d="m5 12.5 4.5 4.5L19 7.5" />}
    </svg>
  )
}
