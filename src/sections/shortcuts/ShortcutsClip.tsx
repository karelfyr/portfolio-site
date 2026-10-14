import { useEffect, useMemo, useRef, useState } from 'react'
import { ScaledFrame } from '../../components/ScaledFrame'
import { figmaShortcuts } from './data'
import { buildColumns, matches, parseKeys, type ColumnSlice } from './layout'
import { Sparky, type SparkyHandle } from './Sparky'
import { sparkyAt } from './sparkyTiming'
import './shortcuts-clip.css'

/*
 * Shortcuts HUD — a 15 s looping, non-interactive "web clip" (3840 × 2700).
 * Stage: 1920 × 1350 pt rendered at 2×. The HUD sits centred like the hero, on the
 * hero's gradient. One master clock drives everything; every frame is a pure function
 * of time, so each loop is identical.
 *
 * Story: ⌘J → HUD reveals → diagonal zoom to search → type "bold" → slide onto Sparky →
 * click clears → zoom out → type "auto layout" → list auto-scrolls to the match (not in
 * the real app — created for the film) → Sparky reacts → pull back → Esc → loop.
 */

const W = 1920
const H = 1350
const LOOP = 15

// ── Layout of the centred window (stage points) ─────────────────────
const WIN = { x: 273.5, y: 290, w: 1373, h: 770 }
const SCROLL_MAX = 1636 // columns content (8 × 324 + 7 × 47) − visible width (1285)

// ── Timeline (seconds) ──────────────────────────────────────────────
const T = {
  cmdIn: 0.35, jIn: 0.47, cmdDown: 1.05, jDown: 1.2, open: 1.3, jUp: 1.38, cmdUp: 1.45, keysOut: 1.4,
  colsIn: 1.5, colStep: 0.08, colDur: 0.75,
  sparkyStart: 1.6,
  bold: { start: 4.4, step: 0.22, word: 'bold' },
  cursor: { in: 7.15, arrive: 7.8, click: 7.85, out: 8.15 },
  clear: 7.9,
  auto: { start: 9.2, step: 0.2, word: 'auto layout' },
  scroll: [9.95, 11.15],
  escIn: 14.0, escDown: 14.3, close: 14.33, escUp: 14.42, escOut: 14.55,
}
const DEBOUNCE = 0.3
const FIRST_SENTENCE = 'Move tool: Back to basics. Something needs to move.'
const AFTER_CLEAR_SENTENCE = 'Select all: You really are rolling today.'

// ── Camera keyframes: (scale, view-centre x, view-centre y) ─────────
type Cam = { s: number; x: number; y: number }
const HOME: Cam = { s: 1, x: W / 2, y: H / 2 }
const ZOOM1: Cam = { s: 1.8, x: 1335, y: 520 } // search, Sparky and the Bold row
// Pure zoom about a fixed anchor (top-right), so the first push-in only grows diagonally.
const ANCHOR = { x: (ZOOM1.x - HOME.x / ZOOM1.s) / (1 - 1 / ZOOM1.s), y: (ZOOM1.y - HOME.y / ZOOM1.s) / (1 - 1 / ZOOM1.s) }
const MOVES: [number, number, Cam][] = [
  [5.5, 6.5, { s: 2.1, x: 1240, y: 470 }], // slide left onto Sparky (Bold row still in frame)
  [8.0, 9.0, { s: 1.45, x: 1300, y: 560 }], // ease out, slightly right
  [10.0, 11.2, { s: 1.3, x: 1150, y: 650 }], // ease left with the auto-scrolling list
  [11.6, 12.4, { s: 1.75, x: 1180, y: 615 }], // push in on Sparky + matches
  [13.0, 13.9, HOME], // pull back to the whole interface
]

// ── Easing ──────────────────────────────────────────────────────────
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const prog = (t: number, a: number, b: number) => clamp01((t - a) / (b - a))
const inOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const outQuint = (x: number) => 1 - Math.pow(1 - x, 5)
const outCubic = (x: number) => 1 - Math.pow(1 - x, 3)
const inCubic = (x: number) => x * x * x
const lerp = (a: number, b: number, k: number) => a + (b - a) * k

function cameraAt(t: number): Cam {
  // 1) diagonal zoom about the anchor
  const z = inOut(prog(t, 3.0, 4.2))
  const s1 = lerp(1, ZOOM1.s, z)
  let cam: Cam = { s: s1, x: ANCHOR.x + (HOME.x - ANCHOR.x) / s1, y: ANCHOR.y + (HOME.y - ANCHOR.y) / s1 }
  // 2) subsequent moves: centre lerps, scale lerps in log space (feels even)
  for (const [a, b, to] of MOVES) {
    const k = inOut(prog(t, a, b))
    if (k <= 0) break
    cam = { s: Math.exp(lerp(Math.log(cam.s), Math.log(to.s), k)), x: lerp(cam.x, to.x, k), y: lerp(cam.y, to.y, k) }
  }
  return cam
}

const typed = (t: number, w: { start: number; step: number; word: string }) =>
  w.word.slice(0, Math.max(0, Math.min(w.word.length, Math.floor((t - w.start) / w.step) + 1)))

function queryAt(t: number) {
  if (t < T.open || t >= T.close) return ''
  if (t >= T.auto.start) return typed(t, T.auto)
  if (t >= T.clear) return ''
  return typed(t, T.bold)
}

/** Keycap state: rise in, press, blur out. */
function keyState(t: number, k: { in: number; down: number; up: number; out: number }) {
  const a = outQuint(prog(t, k.in, k.in + 0.6))
  const e = inCubic(prog(t, k.out, k.out + 0.35))
  const press = outCubic(prog(t, k.down, k.down + 0.08)) * (1 - outCubic(prog(t, k.up, k.up + 0.18)))
  return { opacity: a * (1 - e), scale: (0.88 + 0.12 * a) * (1 + 0.05 * e) * (1 - 0.05 * press), blur: 12 * (1 - a) + 10 * e, y: 18 * (1 - a) + 5 * press, press }
}

export function ShortcutsClip() {
  const columns = useMemo(() => buildColumns(figmaShortcuts), [])
  const sentencesFor = useMemo(() => {
    const all = figmaShortcuts.flatMap((c) => c.shortcuts)
    return (q: string) => all.filter((s) => matches(s, q) && s.comment).map((s) => `${s.action}: ${s.comment}`)
  }, [])

  // Sparky segments, as the app would show them (search is debounced 300 ms)
  const segments = useMemo(() => {
    const boldEnd = T.bold.start + (T.bold.word.length - 1) * T.bold.step + DEBOUNCE
    const autoEnd = T.auto.start + (T.auto.word.length - 1) * T.auto.step + DEBOUNCE
    const bold = sentencesFor(T.bold.word)
    const auto = sentencesFor(T.auto.word)
    return [
      { start: T.sparkyStart, sentences: [FIRST_SENTENCE], freeze: false },
      { start: boldEnd, sentences: bold, freeze: bold.length === 1 },
      { start: T.clear + DEBOUNCE, sentences: [AFTER_CLEAR_SENTENCE], freeze: false },
      { start: autoEnd, sentences: auto, freeze: auto.length === 1 },
    ]
  }, [sentencesFor])

  const hostRef = useRef<HTMLDivElement>(null)
  const cameraRef = useRef<HTMLDivElement>(null)
  const winRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const colRefs = useRef<(HTMLDivElement | null)[]>([])
  const divRefs = useRef<(HTMLDivElement | null)[]>([])
  const caretRef = useRef<HTMLSpanElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const keyRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const sparky = useRef<SparkyHandle>(null)

  const [query, setQuery] = useState('')
  const [pill, setPill] = useState({ key: 0, sentence: FIRST_SENTENCE })
  const discrete = useRef({ query: '', key: -1, sentence: '' })

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const frame = (t: number) => {
      const open = t >= T.open && t < T.close + 0.45

      // Search text (instant) and Sparky segment (debounced)
      const q = queryAt(t)
      if (q !== discrete.current.query) {
        discrete.current.query = q
        setQuery(q)
      }
      let segIndex = 0
      segments.forEach((s, i) => t >= s.start && (segIndex = i))
      const seg = segments[segIndex]
      const sf = sparkyAt((t - seg.start) * 1000, seg.freeze)
      const sentence = seg.sentences[sf.index % seg.sentences.length] ?? 'Type to search shortcuts'
      if (segIndex !== discrete.current.key || sentence !== discrete.current.sentence) {
        discrete.current.key = segIndex
        discrete.current.sentence = sentence
        setPill({ key: segIndex, sentence })
      }
      if (open && t >= T.sparkyStart) sparky.current?.render(sf, (t - seg.start) * 1000)

      // Camera
      const cam = cameraAt(t)
      cameraRef.current!.style.transform = `translate(${W / 2}px, ${H / 2}px) scale(${cam.s}) translate(${-cam.x}px, ${-cam.y}px)`

      // Window: elegant reveal (fade, settle, de-blur) and a soft exit
      const wi = outQuint(prog(t, T.open, T.open + 0.9))
      const wo = inCubic(prog(t, T.close, T.close + 0.4))
      const w = winRef.current!
      w.style.opacity = String(wi * (1 - wo))
      w.style.transform = `scale(${(0.965 + 0.035 * wi) * (1 - 0.02 * wo)})`
      const wb = 14 * (1 - wi) + 10 * wo
      w.style.filter = wb > 0.05 ? `blur(${wb}px)` : ''
      w.style.visibility = wi * (1 - wo) > 0.001 ? 'visible' : 'hidden'

      // Columns cascade in (fade + rise), left to right
      colRefs.current.forEach((el, i) => {
        if (!el) return
        const k = outCubic(prog(t, T.colsIn + i * T.colStep, T.colsIn + i * T.colStep + T.colDur))
        el.style.opacity = String(k)
        el.style.transform = `translateY(${14 * (1 - k)}px)`
        const d = divRefs.current[i]
        if (d) d.style.opacity = String(k)
      })

      // List auto-scrolls to the "auto layout" matches
      const sc = inOut(prog(t, T.scroll[0], T.scroll[1]))
      listRef.current!.style.transform = `translateX(${-SCROLL_MAX * sc}px)`

      // Caret: focused shortly after open, blinks, solid while typing
      const typing = (t >= T.bold.start && t < T.bold.start + 1.2) || (t >= T.auto.start && t < T.auto.start + 2.6)
      const blinkOn = typing || Math.floor((t - T.open) / 0.53) % 2 === 0
      caretRef.current!.style.opacity = open && t >= T.open + 0.3 && blinkOn ? '1' : '0'

      // Cursor: glides in, clicks empty space (clears search), fades away
      const ci = outCubic(prog(t, T.cursor.in, T.cursor.in + 0.3))
      const co = inCubic(prog(t, T.cursor.out, T.cursor.out + 0.3))
      const mv = inOut(prog(t, T.cursor.in, T.cursor.arrive))
      const click = Math.sin(Math.PI * prog(t, T.cursor.click - 0.05, T.cursor.click + 0.15))
      const c = cursorRef.current!
      c.style.opacity = String(ci * (1 - co))
      c.style.transform = `translate(${lerp(1120, 900, mv)}px, ${lerp(560, 346, mv)}px) scale(${1 - 0.15 * click})`
      c.style.setProperty('--ripple', String(prog(t, T.cursor.click, T.cursor.click + 0.45)))

      // Keycaps
      const keys = {
        cmd: keyState(t, { in: T.cmdIn, down: T.cmdDown, up: T.cmdUp, out: T.keysOut }),
        j: keyState(t, { in: T.jIn, down: T.jDown, up: T.jUp, out: T.keysOut + 0.04 }),
        esc: keyState(t, { in: T.escIn, down: T.escDown, up: T.escUp, out: T.escOut }),
      }
      for (const [id, k] of Object.entries(keys)) {
        const el = keyRefs.current[id]
        if (!el) continue
        el.style.opacity = String(k.opacity)
        el.style.transform = `translateY(${k.y}px) scale(${k.scale})`
        el.style.filter = k.blur > 0.05 ? `blur(${k.blur}px)` : ''
        el.style.setProperty('--press', String(k.press))
      }
    }

    // Debug: ?clip=6.2 freezes the clip at that second (for reviewing individual moments).
    const pinned = parseFloat(new URLSearchParams(window.location.search).get('clip') ?? '')
    if (reduce || !Number.isNaN(pinned)) {
      const at = Number.isNaN(pinned) ? 6.4 : pinned // reduced motion: "bold" found, Sparky revealed
      frame(at)
      const id = requestAnimationFrame(() => frame(at))
      return () => cancelAnimationFrame(id)
    }

    let raf = 0
    let elapsed = 0
    let prev = 0
    let visible = true
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: '200px' })
    if (hostRef.current) io.observe(hostRef.current)
    const tick = (now: number) => {
      if (prev && visible) elapsed += Math.min(now - prev, 100) / 1000
      prev = now
      if (visible) frame(elapsed % LOOP)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
    }
  }, [segments])

  return (
    <div
      ref={hostRef}
      className="sc-host"
      role="img"
      aria-label="Animation: pressing ⌘J opens the Shortcuts HUD. Searching “bold” highlights the shortcut while Sparky comments; then searching “auto layout” scrolls the list to the match. Esc closes it."
    >
      <ScaledFrame width={W} height={H} className="sc">
        <div className="sc__bg" />

        <div className="sc__camera" ref={cameraRef}>
          <div className="sc__window" ref={winRef} style={{ left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h }}>
            <div className="sc__navbar">
              <div className="sc__brand">
                <span className="sc__brand-for">Shortcuts for</span>
                <span className="sc__brand-app">Figma</span>
              </div>
              <div className="sc__tools">
                <Sparky key={pill.key} ref={sparky} sentence={pill.sentence} />
                <div className="sc__glass sc__mic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#ebedf0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="9" y="2.5" width="6" height="12" rx="3" />
                    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
                  </svg>
                </div>
                <div className="sc__glass sc__search">
                  <svg className="sc__search-icon" viewBox="0 0 24 24" fill="none" stroke="#ebedf0" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                    <circle cx="10.5" cy="10.5" r="6.5" />
                    <path d="m15.5 15.5 5 5" />
                  </svg>
                  <span className="sc__search-field">
                    {query ? <span className="sc__search-text">{query}</span> : <span className="sc__search-placeholder">Search</span>}
                    <span className="sc__caret" ref={caretRef} />
                  </span>
                </div>
              </div>
            </div>
            <div className="sc__viewport">
              <div className="sc__columns" ref={listRef}>
                {columns.map((column, i) => (
                  <div key={i} className="sc__col-wrap">
                    {i > 0 && <div className="sc__divider" ref={(el) => void (divRefs.current[i] = el)} />}
                    <div className="sc__col" ref={(el) => void (colRefs.current[i] = el)}>
                      {column.map((slice) => <Section key={slice.id} slice={slice} query={query} />)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="sc__cursor" ref={cursorRef}>
            <span className="sc__ripple" />
            <svg viewBox="0 0 20 28" aria-hidden>
              <path d="M2 2v20.5l5.2-5.1 3.3 7.7 3.4-1.5-3.3-7.5H17.6L2 2Z" fill="#000" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div className="sc__keys">
          <div className="sc__keyrow">
            <Key id="cmd" refs={keyRefs} glyph="⌘" label="command" />
            <Key id="j" refs={keyRefs} glyph="J" />
          </div>
          <div className="sc__keyrow">
            <Key id="esc" refs={keyRefs} glyph="esc" wide />
          </div>
        </div>
      </ScaledFrame>
    </div>
  )
}

function Section({ slice, query }: { slice: ColumnSlice; query: string }) {
  const any = slice.shortcuts.some((s) => matches(s, query))
  return (
    <div className="sc__section">
      <div className="sc__keys-col">
        {slice.shortcuts.map((s, i) => (
          <div key={i} className="sc__row" style={{ opacity: matches(s, query) ? 1 : 0.2 }}>
            {parseKeys(s.keys).map((p, j) => <span key={j} className={p.separator ? 'sc__sep' : undefined}>{p.text}</span>)}
          </div>
        ))}
      </div>
      <div className="sc__actions-col">
        <div className="sc__title" style={{ opacity: any ? 1 : 0.2 }}>{slice.categoryName}</div>
        {slice.shortcuts.map((s, i) => (
          <div key={i} className="sc__row" style={{ opacity: matches(s, query) ? 1 : 0.2 }}>{s.action}</div>
        ))}
      </div>
    </div>
  )
}

function Key({ id, refs, glyph, label, wide }: { id: string; refs: React.RefObject<Record<string, HTMLDivElement | null>>; glyph: string; label?: string; wide?: boolean }) {
  return (
    <div className={`sc__key${wide ? ' sc__key--wide' : ''}`} ref={(el) => void (refs.current[id] = el)}>
      <span className="sc__key-glyph">{glyph}</span>
      {label && <span className="sc__key-label">{label}</span>}
    </div>
  )
}
