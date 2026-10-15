import { useEffect, useRef } from 'react'
import type { Logo } from '../data/logos'

/** Seconds for the strip to auto-scroll one full set of logos. */
const LOOP_S = 55

/**
 * Endless logo strip. Each logo sits in its 1000×600 Figma frame, so spacing
 * stays equal no matter the logo's shape. The list is rendered twice and the
 * position wraps by exactly one copy, so the loop has no seam.
 *
 * It drifts right → left on its own, and can be grabbed and flung (mouse or touch)
 * or scrolled sideways with a trackpad; after a fling it eases back to its own pace.
 */
export function LogoMarquee({ logos }: { logos: Logo[] }) {
  const root = useRef<HTMLDivElement>(null)
  const track = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current!
    const tr = track.current!
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let half = tr.scrollWidth / 2
    const ro = new ResizeObserver(() => { half = tr.scrollWidth / 2 })
    ro.observe(tr)

    const autoSpeed = () => (reduce ? 0 : -half / LOOP_S) // px/s, negative = leftward
    let x = 0
    let v = autoSpeed()
    let drag: { id: number; x: number; t: number } | null = null
    let frame = 0
    let last = 0

    // Keep x within one copy's width, so the two copies always cover the strip.
    const wrap = () => { if (half > 0) x = ((x % half) - half) % half }
    const paint = () => { tr.style.transform = `translate3d(${x}px, 0, 0)` }

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!drag) {
        v += (autoSpeed() - v) * (1 - Math.exp(-dt * 1.5)) // ease back to the idle pace
        x += v * dt
      }
      wrap()
      paint()
      frame = requestAnimationFrame(tick)
    }
    const start = () => {
      cancelAnimationFrame(frame)
      last = performance.now()
      frame = requestAnimationFrame(tick)
    }

    // Only animate while on screen.
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start()
      else cancelAnimationFrame(frame)
    })
    io.observe(el)

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return
      drag = { id: e.pointerId, x: e.clientX, t: performance.now() }
      v = 0
      el.setPointerCapture(e.pointerId)
      el.classList.add('is-dragging')
    }
    const onMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return
      const now = performance.now()
      const dx = e.clientX - drag.x
      const dt = Math.max(1, now - drag.t) / 1000
      x += dx
      v = v * 0.6 + (dx / dt) * 0.4 // smoothed fling velocity
      drag.x = e.clientX
      drag.t = now
      wrap()
      paint()
    }
    const onUp = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return
      if (performance.now() - drag.t > 80) v = 0 // held still before letting go: no fling
      drag = null
      el.classList.remove('is-dragging')
    }
    // Sideways trackpad / shift-wheel scrolling moves the strip instead of the page.
    const onWheel = (e: WheelEvent) => {
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0
      if (!dx) return
      e.preventDefault()
      x -= dx
      wrap()
      paint()
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      cancelAnimationFrame(frame)
      io.disconnect()
      ro.disconnect()
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      el.removeEventListener('wheel', onWheel)
    }
  }, [])

  const frames = (copy: number) =>
    logos.map((l) => (
      <div className="marquee__frame" key={`${copy}-${l.name}`} aria-hidden={copy > 0 || undefined}>
        <img
          src={l.src}
          alt={copy === 0 ? l.name : ''}
          width={l.w}
          height={l.h}
          draggable={false}
          style={{ left: `${l.frame.x / 10}%`, top: `${l.frame.y / 6}%`, width: `${l.w / 10}%` }}
        />
      </div>
    ))

  return (
    <div className="marquee" ref={root}>
      <div className="marquee__track" ref={track}>
        {frames(0)}
        {frames(1)}
      </div>
    </div>
  )
}
