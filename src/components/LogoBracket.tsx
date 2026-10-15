import { useEffect, useRef, type CSSProperties, type PointerEvent } from 'react'
import type { Logo } from '../data/logos'
import { Appear } from './Appear'

/** Logos sit a touch smaller than in the Figma cards. */
const LOGO_SCALE = 0.8
/** Card content box in cqw: 1117×640 card minus a 7.3cqw inset on every side. */
const PAD = 7.3
const CONTENT_W = 100 - 2 * PAD
const CONTENT_H = (640 / 1117) * 100 - 2 * PAD
/** How far the card drifts with the cursor while hovered (px, across the full card). */
const DRIFT_X = 8
const DRIFT_Y = 6
/** The card only starts following the cursor after this long on hover (ms). */
const DRIFT_DELAY = 500

/**
 * Bracket card. At rest the logo sits centred and slightly enlarged. On hover the card
 * reads which corner the cursor came in from: the logo glides to the corner on that
 * vertical side but the opposite horizontal side, and the caption rises in from the other
 * edge. The card drifts a few px with the cursor and a soft light follows it.
 */
export function LogoBracket({ logo }: { logo: Logo }) {
  const ref = useRef<HTMLDivElement>(null)
  const frame = useRef(0)
  const timer = useRef(0)
  const target = useRef({ x: 0.5, y: 0.5 })
  const current = useRef({ x: 0.5, y: 0.5 })

  const width = ((logo.bracketW * LOGO_SCALE) / 1117) * 100
  const height = width * (logo.h / logo.w)

  // No hover on touch screens: show the finished card (logo top-left, caption at the bottom).
  useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) ref.current?.classList.add('is-active')
    return () => {
      cancelAnimationFrame(frame.current)
      window.clearTimeout(timer.current)
    }
  }, [])

  const point = (e: PointerEvent) => {
    const r = ref.current!.getBoundingClientRect()
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }
  }

  const light = (p: { x: number; y: number }) => {
    ref.current!.style.setProperty('--mx', `${p.x * 100}%`)
    ref.current!.style.setProperty('--my', `${p.y * 100}%`)
  }

  // Ease the card toward the cursor every frame (lerp), like the reference button.
  const drift = () => {
    const el = ref.current
    if (!el) return
    const c = current.current
    const t = target.current
    c.x += (t.x - c.x) * 0.15
    c.y += (t.y - c.y) * 0.15
    el.style.transform = `translate(${(c.x - 0.5) * DRIFT_X}px, ${(c.y - 0.5) * DRIFT_Y}px)`
    frame.current = requestAnimationFrame(drift)
  }

  const onEnter = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    const el = ref.current!
    const p = point(e)
    // Logo: same vertical side the cursor entered from, opposite horizontal side.
    el.dataset.y = p.y < 0.5 ? 'top' : 'bottom'
    el.dataset.x = p.x < 0.5 ? 'right' : 'left'
    light(p)
    target.current = p
    current.current = { x: 0.5, y: 0.5 } // start from rest, so the drift eases in
    el.classList.add('is-active')
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cancelAnimationFrame(frame.current)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => {
        frame.current = requestAnimationFrame(drift)
      }, DRIFT_DELAY)
    }
  }

  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    const p = point(e)
    target.current = p
    light(p)
  }

  const onLeave = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    cancelAnimationFrame(frame.current)
    window.clearTimeout(timer.current)
    const el = ref.current!
    el.classList.remove('is-active')
    el.style.transform = '' // eases back via the CSS transition
  }

  return (
    <Appear y={24} className="bracket">
      <div
        ref={ref}
        className="bracket__inner"
        data-x="left"
        data-y="top"
        onPointerEnter={onEnter}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        style={{
          // Distance from the card centre to the corner positions, for this logo's size.
          '--lx': `${(CONTENT_W - width) / 2}cqw`,
          '--ly': `${(CONTENT_H - height) / 2}cqw`,
          '--lw': `${width}cqw`,
          '--lh': `${height}cqw`,
        } as CSSProperties}
      >
        <img
          className="bracket__logo"
          src={logo.src}
          alt={logo.name}
          width={logo.w}
          height={logo.h}
          draggable={false}
          style={{ width: `${width}cqw` }}
        />
        <p className="bracket__desc">{logo.description}</p>
      </div>
    </Appear>
  )
}
