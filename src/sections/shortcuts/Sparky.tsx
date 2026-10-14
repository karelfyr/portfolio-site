import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from 'react'
import { edgeAt, gradientAt, sparkyAt, type SparkyFrame } from './sparkyTiming'
import './sparky.css'

/*
 * Sparky — vector port of the app's AnimatedPillView. Rendered imperatively each frame
 * (no React re-render per frame). All sizes are app points × `unit`.
 */

const STOPS = '#FEAE25, #FF915D, #F64174, #BE67E5, #46B7FD, #FEAE25, #FF915D, #F64174, #FEAE25'

// Stand-in for the SF Symbol "apple.intelligence": a looped, flower-like ring.
const ICON = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" stroke="#000" stroke-width="1.5">' +
    '<ellipse cx="8" cy="8" rx="6.4" ry="3.6"/>' +
    '<ellipse cx="8" cy="8" rx="6.4" ry="3.6" transform="rotate(60 8 8)"/>' +
    '<ellipse cx="8" cy="8" rx="6.4" ry="3.6" transform="rotate(120 8 8)"/>' +
    '</svg>',
)}")`

export type SparkyHandle = { render: (frame: SparkyFrame, globalMs: number) => void }

type Props = { sentence: string; unit?: number; ref?: Ref<SparkyHandle> }

export function Sparky({ sentence, unit = 1, ref }: Props) {
  const rootRef = useRef<HTMLDivElement>(null)
  const iconRef = useRef<HTMLDivElement>(null)
  const windowRef = useRef<HTMLDivElement>(null)
  const groupRef = useRef<HTMLDivElement>(null)
  const sharpRef = useRef<HTMLSpanElement>(null)
  const blurRef = useRef<HTMLSpanElement>(null)
  const measureRef = useRef<HTMLSpanElement>(null)
  const widthRef = useRef(0)
  const last = useRef<{ frame: SparkyFrame; t: number } | null>(null)

  const H = 36 * unit
  const ICON_W = 16 * unit
  const GAP = 8 * unit

  const render = (frame: SparkyFrame, t: number) => {
    last.current = { frame, t }
    const W = widthRef.current
    const { p, opacity, blur, angle } = frame
    const { zone, edgeBlur, edgeOpacity } = edgeAt(p)
    const shown = W * p
    const pillW = ICON_W + GAP + shown
    const g = gradientAt(t)
    const cx = pillW / 2 + g.offset * unit // gradient centre, pill coords
    const cy = H / 2

    windowRef.current!.style.width = `${shown}px`
    groupRef.current!.style.opacity = String(opacity)
    groupRef.current!.style.filter = blur ? `blur(${blur * unit}px)` : ''

    // Text layers: gradient centred on the pill, clipped to the glyphs.
    const textLeft = ICON_W + GAP + shown - W // span's left edge in pill coords
    const bg = `conic-gradient(from ${g.angle}deg at ${cx - textLeft}px ${cy}px, ${STOPS})`
    const lead = W - shown // leading (left) edge of the visible window, span coords
    const z = zone * unit
    for (const el of [sharpRef.current!, blurRef.current!]) el.style.backgroundImage = bg
    sharpRef.current!.style.maskImage = `linear-gradient(to right, transparent ${lead}px, rgba(0,0,0,.3) ${lead + z / 2}px, #000 ${lead + z}px)`
    blurRef.current!.style.maskImage = `linear-gradient(to right, #000 ${lead}px, rgba(0,0,0,.5) ${lead + z / 2}px, transparent ${lead + z}px)`
    blurRef.current!.style.filter = `blur(${edgeBlur * unit}px)`
    blurRef.current!.style.opacity = String(edgeOpacity)

    // Icon: rotates; its gradient is counter-rotated so the fill stays fixed to the pill.
    const rad = (-angle * Math.PI) / 180
    const vx = cx - ICON_W / 2
    const vy = cy - H / 2
    const lx = ICON_W / 2 + vx * Math.cos(rad) - vy * Math.sin(rad)
    const ly = ICON_W / 2 + vx * Math.sin(rad) + vy * Math.cos(rad)
    iconRef.current!.style.transform = `rotate(${angle}deg)`
    iconRef.current!.style.backgroundImage = `conic-gradient(from ${g.angle - angle}deg at ${lx}px ${ly}px, ${STOPS})`
  }

  useImperativeHandle(ref, () => ({ render }))

  // Measure the sentence's natural width (layout px, unaffected by any parent scale).
  useLayoutEffect(() => {
    widthRef.current = measureRef.current?.offsetWidth ?? 0
    if (last.current) render(last.current.frame, last.current.t)
  })

  const text = { fontSize: 12 * unit, letterSpacing: 0.1 * unit, lineHeight: `${H}px`, height: H }

  return (
    <div ref={rootRef} className="sp" style={{ height: H, gap: GAP }} aria-label={sentence} role="status">
      <div className="sp__icon" ref={iconRef} style={{ width: ICON_W, height: ICON_W, maskImage: ICON, WebkitMaskImage: ICON }} />
      <div className="sp__window" ref={windowRef} style={{ height: H }}>
        <div className="sp__group" ref={groupRef}>
          <span className="sp__text" ref={blurRef} style={text} aria-hidden>{sentence}</span>
          <span className="sp__text" ref={sharpRef} style={text} aria-hidden>{sentence}</span>
        </div>
      </div>
      <span className="sp__text sp__measure" ref={measureRef} style={text} aria-hidden>{sentence}</span>
    </div>
  )
}

/**
 * Self-running Sparky that cycles through `sentences` exactly like the app
 * (reveal → 3 s pause → fade → next). Pauses when off-screen.
 */
export function SparkyAuto({ sentences, unit = 1 }: { sentences: string[]; unit?: number }) {
  const handle = useRef<SparkyHandle>(null)
  const hostRef = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const indexRef = useRef(0)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      handle.current?.render({ p: 1, opacity: 1, blur: 0, angle: 0 }, 0)
      return
    }
    let raf = 0
    let elapsed = 0
    let prev = 0
    let visible = true
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    if (hostRef.current) io.observe(hostRef.current)
    const tick = (now: number) => {
      if (prev && visible) elapsed += Math.min(now - prev, 100)
      prev = now
      const frame = sparkyAt(elapsed, false)
      const i = frame.index % sentences.length
      if (i !== indexRef.current) {
        indexRef.current = i
        setIndex(i)
      }
      handle.current?.render(frame, elapsed)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [sentences])

  return (
    // A real box (not display: contents) so the IntersectionObserver can see it.
    <div ref={hostRef} style={{ display: 'flex', alignItems: 'center' }}>
      <Sparky ref={handle} sentence={sentences[index]} unit={unit} />
    </div>
  )
}
