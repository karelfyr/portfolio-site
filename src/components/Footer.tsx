import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { TextEffect } from './TextEffect'
import { EmailReveal, LinkedInLink } from './EmailActions'

/** How long the row stays widened after the mouse leaves it (ms). */
const SETTLE_MS = 2000

export function Footer({ compact = false }: { compact?: boolean }) {
  // Hovering the email widens the row to fit its buttons, which moves LinkedIn aside. It stays
  // that way while the mouse is anywhere on the row – so LinkedIn doesn't slide back while you
  // reach for it – and only settles back 2 s after the mouse has left.
  const [wide, setWide] = useState(false)
  const timer = useRef(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  // The resting width is the address's own width (--rest-w), so the glide back runs its whole
  // ease-out over the distance you actually see, instead of mostly animating below the content.
  const email = useRef<HTMLDivElement>(null)
  const [restW, setRestW] = useState(0)
  useEffect(() => {
    const address = email.current?.querySelector<HTMLElement>('.email-reveal__address')
    if (!address) return
    const ro = new ResizeObserver(() => setRestW(address.offsetWidth))
    ro.observe(address)
    return () => ro.disconnect()
  }, [])
  const widen = () => {
    window.clearTimeout(timer.current)
    setWide(true)
  }
  const settle = () => {
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setWide(false), SETTLE_MS)
  }

  return (
    <footer className={`footer${compact ? ' footer--compact' : ''}`}>
      <div className="container footer__inner">
        <TextEffect as="h2" className="h2" text="Reach out" trigger="inView" per="line" delay={0.2} />
        <div className="footer__row">
          <div
            className={`footer__links${wide ? ' is-wide' : ''}`}
            style={restW ? ({ '--rest-w': `${restW}px` } as CSSProperties) : undefined}
            onPointerEnter={() => window.clearTimeout(timer.current)}
            onPointerLeave={(e) => e.pointerType === 'mouse' && settle()}
            onBlur={(e) => !e.currentTarget.contains(e.relatedTarget as Node) && settle()}
          >
            <div ref={email} className="footer__email" onPointerEnter={(e) => e.pointerType === 'mouse' && widen()} onFocus={widen}>
              <EmailReveal />
            </div>
            <LinkedInLink />
          </div>
          <p className="label">©2026</p>
        </div>
      </div>
    </footer>
  )
}
