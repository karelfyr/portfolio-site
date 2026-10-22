import { useEffect, useRef, useState } from 'react'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import { ScaledFrame } from '../../components/ScaledFrame'
import { ACTIVE_LETTERS, FITNESS_COLUMNS, LETTERS, PICK_LETTER, PICK_SPORT, PICKED, SECTIONS, SPORTS } from './data'
import sportIcon from './assets/sport-icon.svg'
import arrow from './assets/arrow.svg'
import beh from './assets/beh.svg'
import raketove from './assets/raketove.svg'
import vodni from './assets/vodni.svg'
import zimni from './assets/zimni.svg'
import kolektivni from './assets/kolektivni.svg'
import vyziva from './assets/vyziva.svg'
import mapRental from './assets/map-rental.svg'
import mapInfo from './assets/map-info.svg'
import mapHanger from './assets/map-hanger.svg'
import toalety from './assets/toalety.svg'
import turistika from './assets/turistika.svg'
import fitnessOff from './assets/fitness-off.svg'
import fitnessOn from './assets/fitness-on.svg'
import cyklistika from './assets/cyklistika.svg'
import priroda from './assets/priroda.svg'
import mapRepair from './assets/map-repair.svg'
import routeInitial from './assets/route-initial.svg'
import routeSelectSvg from './assets/route-select.svg?raw'
import legendInfo from './assets/legend-info.svg'
import legendPickup from './assets/legend-pickup.svg'
import legendFunding from './assets/legend-funding.svg'
import legendHanger from './assets/legend-hanger.svg'
import legendRepair from './assets/legend-repair.svg'
import legendRental from './assets/legend-rental.svg'
import legendRestroom from './assets/legend-restroom.svg'
import youAreHere from './assets/you-are-here.svg'
import './decathlon-clip.css'

/*
 * Decathlon navigation kiosk — a looping, non-interactive "web clip", built like the Shortcuts
 * clip: one master clock, every frame a pure function of time, so each loop is identical. Initial
 * and Select states are the Figma frames; everything between is animated.
 *
 * Desktop (see `classicLayout`): the whole kiosk → one straight push in on the ad
 * → glide to the search → a finger drags the slider (sports stream by), taps P (only P sports stay,
 * packed left), taps Pilates → pull back as everything answers in order: Fitness lights up, the
 * panel's blur clears and its list drops in, the route rolls out to Fitness and the point lands →
 * the ad rolls out last → long hold → it sits back while everything eases back to the start,
 * straight into the next loop (one take).
 * Desktop (3840 × 2700) pulls back to the whole kiosk for the answer.
 * Phone (2160 × 3456, portrait, see `phoneLayout`) tells the same story close up, centred on every
 * step: one camera that never stops, landing on each beat in turn.
 */

// ── Easing ──────────────────────────────────────────────────────────
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const prog = (t: number, a: number, b: number) => clamp01((t - a) / (b - a))
const inOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const outCubic = (x: number) => 1 - Math.pow(1 - x, 3)
const outQuint = (x: number) => 1 - Math.pow(1 - x, 5)
const inCubic = (x: number) => x * x * x
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
const inOutSine = (x: number) => (1 - Math.cos(Math.PI * x)) / 2
const logLerp = (a: number, b: number, k: number) => Math.exp(lerp(Math.log(a), Math.log(b), k))
/** A CSS-style cubic-bezier easing (x → y), solved with a few Newton steps. */
const bezier = (x1: number, y1: number, x2: number, y2: number) => {
  const at = (t: number, a: number, b: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3
  const slope = (t: number, a: number, b: number) => 3 * a * (1 - t) ** 2 + 6 * (b - a) * t * (1 - t) + 3 * (1 - b) * t * t
  return (x: number) => {
    if (x <= 0 || x >= 1) return clamp01(x)
    let t = x
    for (let i = 0; i < 6; i++) t -= (at(t, x1, x2) - x) / (slope(t, x1, x2) || 1)
    return at(clamp01(t), y1, y2)
  }
}
/** Phone camera moves: a smooth landing – it gets going quickly, then settles in long and slow. */
const land = bezier(0.3, 0, 0.1, 1)
/** The final unzoom: the same landing, cut before it settles – it slows right down but never stops,
 * and the next loop carries that motion on. */
const landOpen = (p: number) => land(0.75 * p) / land(0.75)
/** Phone finger moves: quick to leave, easing into each target. */
const reach = bezier(0.3, 0, 0.15, 1)
/** A label's colour from (r, g, b) towards white, in step with its button's fill. */
const mix = (r: number, g: number, b: number, k: number) => `rgb(${lerp(r, 255, k)}, ${lerp(g, 255, k)}, ${lerp(b, 255, k)})`

// ── The kiosk's own layout (design px, screen coordinates) ──────────
const ROW_LEFT = 429.68 // the sports search column (label 144 + 237.6 + gap 48)
const VISIBLE = 1807.2
const THUMB = 469.8
const DRAG_TO = VISIBLE / 2 - THUMB / 2 // the thumb is dragged to the middle of the track…
const SCROLL_CHIPS = 15 // …but the list only moves on by about 15 sports, slowly, so each one reads (phone: `scrollChips`)
const LETTER_STEP = 64.8 // 54 + 10.8
const SCREEN = { w: 3840, h: 2160 }
const THUMB_X = ROW_LEFT + THUMB / 2 // the thumb's centre at rest
const P_X = ROW_LEFT + LETTERS.indexOf(PICK_LETTER) * LETTER_STEP + 27 // the P key
const PILATES_X = 1075 // the Pilates chip in the filtered row

// ── Timeline (seconds), derived from the camera's schedule ──────────
type Timeline = {
  start: number
  drag: number[] // the thumb moves at constant speed
  grab: number
  release: number
  tapLetter: number
  filter: { out: number; in: number; step: number }
  section: number
  blur: number[]
  dip: number[]
  cascade: { start: number; step: number; dur: number }
  pick: number
  arrow: number
  route: number[]
  end: number
  ad: number
  reset: number[]
  /** Desktop only: the visible finger's moves and the Pilates tap. */
  finger?: { in: number; toLetter: number[]; toChip: number[]; tapChip: number; out: number }
  /** The drag eases in and out (both layouts). */
  easeDrag?: boolean
  /** Phone: the finger's moves use the softer `reach` easing. */
  softFinger?: boolean
  /** How many sports the list moves on by while the thumb is dragged (default `SCROLL_CHIPS`). */
  scrollChips?: number
}

/** The scrollbar thumb's offset while dragged, back to the start as the list filters. */
function thumbAt(t: number, T: Timeline) {
  const k = prog(t, T.drag[0], T.drag[1])
  const dragK = T.easeDrag ? inOutSine(k) : k
  const backK = inOut(prog(t, T.filter.out, T.filter.out + 0.55))
  return DRAG_TO * dragK * (1 - backK)
}

// ── Layouts ─────────────────────────────────────────────────────────
type Cam = { s: number; x: number; y: number }
type Layout = {
  W: number
  H: number
  /** The kiosk screen's scale in the stage, and its offset (navy all around). */
  K: number
  OX: number
  OY: number
  LOOP: number
  T: Timeline
  cameraAt: (t: number) => Cam
}

/** Desktop's timeline – the classic cut's rhythm. */
const timeline = (ad: number, reset: number[]): Timeline => ({
  start: 1.2,
  drag: [6.0, 9.5],
  grab: 5.85,
  release: 9.65,
  tapLetter: 10.35,
  filter: { out: 10.45, in: 10.7, step: 0.06 },
  section: 13.3,
  blur: [13.35, 13.95],
  dip: [13.3, 13.45],
  cascade: { start: 13.5, step: 0.03, dur: 0.5 },
  pick: 14.1,
  arrow: 14.15,
  route: [13.55, 15.35],
  end: 14.9,
  ad,
  reset, // at the end of the slow unzoom, still inside it
  finger: { in: 5.4, toLetter: [9.75, 10.3], toChip: [11.55, 12.1], tapChip: 12.15, out: 12.3 },
  easeDrag: true,
})

/**
 * Desktop's camera: from the sat-back overview, one straight push in straight away (scaling about a
 * fixed point, so it moves in a single direction), then moves between shots – each one a smooth
 * landing like the phone's, setting off as the one before it settles, so the camera never stops dead
 * – the last (`unzoom`) a long, slow unzoom to the overview, landing as the next loop pushes in (one
 * take).
 */
function classicLayout(
  W: number, H: number, K: number,
  { ad, reset, unzoom }: { ad: number; reset: number[]; unzoom: number[] },
  push: number[],
  moves: [number[], number[]][],
): Layout {
  const OX = (W - SCREEN.w * K) / 2
  const OY = (H - SCREEN.h * K) / 2
  const at = ([s, x, y]: number[]): Cam => ({ s, x: OX + K * x, y: OY + K * y })
  const UNZOOMED: Cam = { s: 0.93, x: W / 2, y: H / 2 }
  const FIND = at(push)
  const shots: [number[], Cam][] = [...moves.map(([r, c]): [number[], Cam] => [r, at(c)]), [unzoom, UNZOOMED]]
  const r = UNZOOMED.s / FIND.s
  const anchor = { x: (FIND.x - UNZOOMED.x * r) / (1 - r), y: (FIND.y - UNZOOMED.y * r) / (1 - r) }
  return {
    W, H, K, OX, OY,
    T: timeline(ad, reset),
    LOOP: unzoom[1],
    cameraAt: (t: number) => {
      let cam = UNZOOMED
      const z = land(prog(t, 1.2, 3.4))
      if (z > 0) {
        const s = logLerp(UNZOOMED.s, FIND.s, z)
        cam = { s, x: anchor.x + ((UNZOOMED.x - anchor.x) * UNZOOMED.s) / s, y: anchor.y + ((UNZOOMED.y - anchor.y) * UNZOOMED.s) / s }
      }
      for (const [[a, b], to] of shots) {
        const k = (to === UNZOOMED ? landOpen : land)(prog(t, a, b))
        if (k <= 0) break
        cam = { s: logLerp(cam.s, to.s, k), x: lerp(cam.x, to.x, k), y: lerp(cam.y, to.y, k) }
      }
      return cam
    },
  }
}

/**
 * Desktop: the whole kiosk → one straight push in on "Find your sport" → glide to the search → the
 * finger drags the slider, taps P, taps Pilates → the camera pulls back to the whole kiosk as
 * everything answers in order (section, panel, route and point) → as the ad unveils, one long,
 * slow unzoom sets off, the kiosk going back to its start at the very end of it → straight into the
 * next loop.
 */
const desktopLayout = () =>
  classicLayout(3840, 2700, 0.88, { ad: 15.2, reset: [20.6, 22.2], unzoom: [15.2, 22.4] }, [3.6, 3233, 1671], [
    // the "Sports Section" and "Sports" rows in the middle of the frame, background around them – more on the left…
    [[3.9, 6.1], [1.75, 1050, 1700]],
    [[5.9, 12.0], [1.75, 1130, 1700]], // …drifting gently along with the drag, P and Pilates
    [[12.25, 14.6], [1, 1920, 1080]], // the whole kiosk
  ])

/**
 * Phone (2160 × 3456, portrait): one camera that never stops, landing on each beat in turn – every
 * move sets off briskly and settles long and slow, and the next sets off from that settle. Two
 * distances: a wider one that shows the interface (the ad, the titles, the Fitness button, the
 * panel, the map) and a closer one for the actions (the search, the drag, P, Pilates, the point).
 * The dive in, straight away, onto the ad's "Find your sport" → the "Sports Section" / "Sports"
 * titles → in to the search: the drag (the list moving at half the thumb's pace, so every sport
 * reads), P, back to Pilates → the tap → the Fitness button lighting up → the panel as its list
 * drops in → the whole map as the route rolls out and the point lands → the ad, landing slowly as
 * it rolls out → one long, slow unzoom to the whole kiosk, which goes back to its start at the very
 * end of it, just as the next loop dives in (one take).
 */
function phoneLayout(): Layout {
  const W = 2160
  const H = 3456
  const K = (0.9 * W) / SCREEN.w
  const OX = (W - SCREEN.w * K) / 2
  const OY = (H - SCREEN.h * K) / 2
  /** A shot, centred exactly on (x, y) in screen px – even if that shows the navy around the kiosk. */
  const at = (s: number, x: number, y: number): Cam => ({ s, x: OX + K * x, y: OY + K * y })
  const VIEW = 3.2 // the interface
  const ACT = 4.6 // the actions
  const T: Timeline = {
    start: 1.2,
    drag: [10.0, 12.8],
    grab: 9.85,
    release: 12.95,
    tapLetter: 13.6,
    filter: { out: 13.7, in: 13.95, step: 0.06 },
    section: 16.9, // as the camera lands on the Fitness button
    blur: [15.65, 16.0], // the moment Pilates is tapped – no blur after that
    dip: [15.65, 15.9],
    cascade: { start: 19.0, step: 0.035, dur: 0.5 }, // as it lands on the panel
    pick: 20.0,
    arrow: 20.1,
    route: [20.8, 22.4], // as it lands on the whole map…
    end: 22.0, // …the point lands – the end of the main animation
    ad: 24.0, // as the camera comes in to land on it
    reset: [29.4, 31.3], // at the end of the slow unzoom, still inside it
    finger: { in: 9.4, toLetter: [13.05, 13.55], toChip: [15.0, 15.5], tapChip: 15.6, out: 15.75 },
    easeDrag: true,
    softFinger: true,
    scrollChips: 8, // half the desktop's pace
  }
  const UNZOOMED: Cam = { s: 0.93, x: W / 2, y: H / 2 }
  const FIND = at(4.0, 3232, 1650) // the ad: "Find your sport" and its prompt
  // each move sets off as the one before it settles
  const STAY = at(4.45, 3232, 1700) // the slow ease in while it stays on "Find your sport"
  const moves: [number[], Cam][] = [
    [[3.0, 5.6], STAY], // stay on "Find your sport": the camera keeps easing in, slowly and evenly – never static…
    [[4.6, 8.2], at(VIEW, 330, 1620)], // …and sets off for the "Sports Section" and "Sports" titles as that creep fades
    [[8.0, 10.4], at(ACT, 720, 1880)], // in to the search: alphabet, chips and slider…
    [[9.9, 13.0], at(ACT, 1240, 1880)], // …moving along with the drag, towards P
    [[13.5, 15.6], at(ACT, PILATES_X, 1900)], // back along the P sports to Pilates
    [[15.8, 18.2], at(VIEW, 1888, 1432)], // the Fitness button lights up
    [[17.8, 20.4], at(VIEW, 473, 700)], // the panel: its list drops in
    [[20.0, 22.6], at(2.45, 1785, 650)], // the whole map: the route rolls out, the point lands
    [[22.4, 27.0], at(2.2, 3050, 1080)], // the ad, landing slowly as it rolls out
    [[25.6, 31.6], UNZOOMED], // one long, slow unzoom to the whole kiosk – the loop starts from here
  ]
  // the dive in scales about one fixed point, so it moves in a single, straight direction
  const r = UNZOOMED.s / FIND.s
  const anchor = { x: (FIND.x - UNZOOMED.x * r) / (1 - r), y: (FIND.y - UNZOOMED.y * r) / (1 - r) }
  return {
    W, H, K, OX, OY, T,
    LOOP: 31.6,
    cameraAt: (t: number) => {
      let cam = UNZOOMED
      const z = land(prog(t, 1.2, 3.8)) // straight away
      if (z > 0) {
        const s = logLerp(UNZOOMED.s, FIND.s, z)
        cam = { s, x: anchor.x + ((UNZOOMED.x - anchor.x) * UNZOOMED.s) / s, y: anchor.y + ((UNZOOMED.y - anchor.y) * UNZOOMED.s) / s }
      }
      for (const [[a, b], c] of moves) {
        const p = prog(t, a, b)
        const k = land(p)
        if (k <= 0) break
        // zoom and position always move together: the same start, the same curve, the same landing
        // (the stay on "Find your sport" eases evenly, so it never looks static; the final unzoom stays open)
        const z = c === UNZOOMED ? landOpen(p) : c === STAY ? inOutSine(p) : k
        cam = { s: logLerp(cam.s, c.s, z), x: lerp(cam.x, c.x, z), y: lerp(cam.y, c.y, z) }
      }
      return cam
    },
  }
}

/** Desktop's visible finger (screen px): in at the slider, drags it, taps P, taps Pilates. */
function fingerAt(t: number, T: Timeline, pilatesX: number) {
  const f = T.finger!
  const fin = outCubic(prog(t, f.in, f.in + 0.35))
  const ease = T.softFinger ? reach : inOut
  const toL = ease(prog(t, f.toLetter[0], f.toLetter[1]))
  const toC = ease(prog(t, f.toChip[0], f.toChip[1]))
  let x = lerp(THUMB_X + thumbAt(t, T), P_X, toL)
  let y = lerp(1992.8, 1804.8, toL) - 30 * Math.sin(Math.PI * toL) // a soft arc
  x = lerp(x, ROW_LEFT + pilatesX, toC)
  y = lerp(y, 1921.3, toC) - 24 * Math.sin(Math.PI * toC)
  return { x, y: y + 50 * (1 - fin), fin, fout: prog(t, f.out, f.out + 0.3) }
}

/** A tap: 0 → 1 → 0 press around `at`, and the ripple's 0 → 1 after it. */
const tap = (t: number, at: number) => ({
  press: Math.sin(Math.PI * prog(t, at - 0.06, at + 0.16)),
  ripple: prog(t, at, at + 0.55),
})

/** Debug overlay (`?fps`): frames per second for each second of the clip, worst first – for
 * checking smoothness on a real phone. */
function fpsMeter(loop: number) {
  const el = document.createElement('div')
  el.style.cssText =
    'position:fixed;left:8px;top:8px;z-index:99999;padding:8px 10px;border-radius:8px;background:rgba(0,0,0,.8);color:#fff;font:12px/1.45 ui-monospace,monospace;white-space:pre;pointer-events:none'
  document.body.append(el)
  const frames: number[] = new Array(Math.ceil(loop)).fill(0)
  const time: number[] = new Array(Math.ceil(loop)).fill(0)
  let prev = 0
  let shown = 0
  return {
    tick(now: number, t: number) {
      const dt = prev ? now - prev : 0
      prev = now
      if (dt > 0 && dt < 250) {
        frames[Math.floor(t)]++
        time[Math.floor(t)] += dt
      }
      if (now - shown < 500) return
      shown = now
      const total = time.reduce((a, b) => a + b, 0)
      const avg = (1000 * frames.reduce((a, b) => a + b, 0)) / (total || 1)
      const worst = frames
        .map((f, i): [number, number] => [i, time[i] ? (1000 * f) / time[i] : 0])
        .filter(([, fps]) => fps > 0)
        .sort((a, b) => a[1] - b[1])
        .slice(0, 6)
      el.textContent = `avg ${avg.toFixed(0)} fps\nslowest seconds of the clip:\n` + worst.map(([i, fps]) => `${String(i).padStart(2)}–${i + 1} s  ${fps.toFixed(0)} fps`).join('\n')
    },
    remove: () => el.remove(),
  }
}

/**
 * Every loop opens on the whole interface for `hold` seconds before the first zoom sets off: the
 * whole timeline (camera and every event) plays that much later. It's never quite still: the final
 * unzoom's last, slow motion carries on into the opening and dies away, the camera starts creeping in
 * on its own – towards the point the dive zooms to – and the dive takes over from that creep (one take).
 */
function withHold(L: Layout, hold: number): Layout {
  const T = L.T
  // the camera's motion as the loop ends (log-scale and position, per second)
  const a = L.cameraAt(L.LOOP - 0.01)
  const b = L.cameraAt(L.LOOP)
  const v = [(Math.log(b.s) - Math.log(a.s)) / 0.01, (b.x - a.x) / 0.01, (b.y - a.y) / 0.01]
  const TAU = 0.35 // how quickly that motion dies away
  /** How far that motion has carried on, `u` s into the loop – fading as the dive gets going. */
  const carry = (u: number) => TAU * (1 - Math.exp(-u / TAU)) * (1 - inOutSine(prog(u, hold, hold + 2.2)))
  // the creep in: about the dive's own fixed point (where the first two moments of the dive agree)
  const d0 = L.cameraAt(T.start + 0.1)
  const d1 = L.cameraAt(T.start + 0.5)
  const ax = (d0.s * d0.x - d1.s * d1.x) / (d0.s - d1.s)
  const ay = (d0.s * d0.y - d1.s * d1.y) / (d0.s - d1.s)
  const CREEP = 0.02 // zoom in per second
  /** How far the camera has crept in, `u` s into the loop: it eases into the creep, and the creep
   * gives way to the dive. */
  const creep = (u: number) => CREEP * (u - 0.3 * (1 - Math.exp(-u / 0.3))) * (1 - inOutSine(prog(u, hold, hold + 2.2)))
  const later = (t: number) => t + hold
  const span = (r: number[]) => r.map(later)
  return {
    ...L,
    LOOP: L.LOOP + hold,
    T: {
      ...T,
      drag: span(T.drag),
      grab: later(T.grab),
      release: later(T.release),
      tapLetter: later(T.tapLetter),
      filter: { ...T.filter, out: later(T.filter.out), in: later(T.filter.in) },
      section: later(T.section),
      blur: span(T.blur),
      dip: span(T.dip),
      cascade: { ...T.cascade, start: later(T.cascade.start) },
      pick: later(T.pick),
      arrow: later(T.arrow),
      route: span(T.route),
      end: later(T.end),
      ad: later(T.ad),
      reset: span(T.reset),
      finger: T.finger && {
        in: later(T.finger.in),
        toLetter: span(T.finger.toLetter),
        toChip: span(T.finger.toChip),
        tapChip: later(T.finger.tapChip),
        out: later(T.finger.out),
      },
    },
    cameraAt: (t) => {
      const c = L.cameraAt(Math.max(T.start, t - hold))
      const u = t - T.start
      const g = Math.exp(creep(u)) // creeping in, about the dive's point
      const k = carry(u)
      return { s: c.s * g * Math.exp(v[0] * k), x: ax + (c.x - ax) / g + v[1] * k, y: ay + (c.y - ay) / g + v[2] * k }
    },
  }
}

const HOLD = 0.75 // the whole interface, before the first zoom
const DESKTOP = withHold(desktopLayout(), HOLD)
const PHONE = withHold(phoneLayout(), HOLD)
const PHONE_QUERY = '(max-width: 809px)'

/** Phones get the portrait layout (same breakpoint as the site's phone styles). */
function usePhone() {
  const [phone, setPhone] = useState(() => typeof window !== 'undefined' && window.matchMedia(PHONE_QUERY).matches)
  useEffect(() => {
    const mq = window.matchMedia(PHONE_QUERY)
    const on = () => setPhone(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return phone
}

/** Centre line of the Select state's route (its own SVG coordinates), from where the initial
 * state's solid stub ends up to Fitness. Drawn as a stroke the width and colour of the design's
 * route (whose outline it replaces), so it can draw itself in every browser. */
const ROUTE_LINE =
  'M742.81 594 V591.97 Q742.81 588.2 740.28 585.75 L613.51 455.73 Q610.98 453.1 610.98 449.48 V12.67 Q610.98 2.67 601.03 2.67 H21.16 Q11.21 2.67 11.21 12.62 V86'

type Piece = [src: string, x: number, y: number, w: number, h: number]
const PIECES: Piece[] = [
  [beh, 504, 525.83, 236.698, 242.047],
  [raketove, 890.2, 630.67, 107.674, 152.204],
  [vodni, 754.94, 185.9, 71.188, 355.941],
  [zimni, 833.25, 185.91, 201.11, 355.939],
  [kolektivni, 751.39, 630.84, 131.696, 331.026],
  [vyziva, 1000.55, 847.96, 105.004, 129.92],
  [toalety, 1290.64, 1024.16, 72.969, 85.427],
  [turistika, 1041.48, 397.7, 403.996, 536.897],
  [cyklistika, 929.36, 185.9, 516.122, 195.771],
  [priroda, 504, 742.96, 240.264, 218.907],
]
type Area = [color: string, x: number, y: number, w: number, h: number]
const AREAS: Area[] = [
  ['#edf0f2', 747.83, 630.83, 55.172, 137.039], // precision sports
  ['#edf0f2', 1301.32, 388.79, 144.158, 71.189], // skating & scooters
  ['#687787', 1112.67, 847.96, 119.242, 129.92], // checkouts
  ['#687787', 1238.48, 892.51, 67.675, 115.446], // customer service
  ['#687787', 890.2, 548.97, 144.158, 74.749], // fitting rooms
  ['#687787', 886.1, 836.35, 75.637, 125.398], // service
]
const MAP_ICONS: Piece[] = [
  [mapRental, 1156.62, 897.69, 31.989, 31.989],
  [mapInfo, 1255.71, 933.55, 33.226, 33.226],
  [mapHanger, 943.99, 575.21, 35.638, 24.374],
  [mapRepair, 908.42, 882.88, 30.993, 30.993],
]
const LEGEND: [string, string][] = [
  [legendInfo, 'Customer Service'],
  [legendPickup, 'Order Fulfillment'],
  [legendFunding, 'Checkouts'],
  [legendHanger, 'Fitting Rooms'],
  [legendRepair, 'Service'],
  [legendRental, 'Rental'],
  [legendRestroom, 'Restrooms'],
]

const LABEL =
  "Animation: Decathlon's in-store kiosk. Filtering sports by P and picking Pilates highlights the Fitness section, lists its sports, draws the route to it on the store map and shows a Pilates mat ad."

/** Safari (iPhone and Mac): it holds script-driven motion to 60 fps and can't keep GPU animations
 * of this scene right while the page scrolls – so it plays a recording of the clip instead. */
const IS_SAFARI = typeof navigator !== 'undefined' && /^((?!chrome|chromium|android|crios|fxios|edgios).)*safari/i.test(navigator.userAgent)

/**
 * The clip: live on desktop, a video in Safari and on every phone (recorded from the live clip at
 * 120 fps – see
 * scripts/decathlon-video). `?video` forces the video; `?live` (and `?render`, `?clip`, `?nogpu`,
 * `?fps`) the live clip; and if Safari won't play the video (e.g. iOS Low Power Mode), it falls back live.
 */
export function DecathlonClip() {
  const phone = usePhone()
  const [videoFailed, setVideoFailed] = useState(false)
  const q = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
  const live = ['live', 'render', 'clip', 'nogpu', 'fps'].some((k) => q.has(k))
  if (!videoFailed && !live && (IS_SAFARI || phone || q.has('video'))) return <ClipVideo phone={phone} onFail={() => setVideoFailed(true)} />
  return <LiveClip />
}

/** The recording: plays muted on a loop, only while on screen. */
function ClipVideo({ phone, onFail }: { phone: boolean; onFail: () => void }) {
  const ref = useRef<HTMLVideoElement>(null)
  const L = phone ? PHONE : DESKTOP
  useEffect(() => {
    const video = ref.current!
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      // the finished Select state, still
      const still = () => (video.currentTime = L.T.ad + 2 - L.T.start)
      video.addEventListener('loadedmetadata', still, { once: true })
      return () => video.removeEventListener('loadedmetadata', still)
    }
    // muted from the start (iOS only autoplays muted video)
    video.muted = true
    video.defaultMuted = true
    video.setAttribute('muted', '')
    const io = new IntersectionObserver(([e]) => {
      // only a refusal to autoplay (e.g. iOS Low Power Mode) falls back to the live clip – not a play
      // interrupted by scrolling away
      if (e.isIntersecting) video.play().catch((err: DOMException) => err.name === 'NotAllowedError' && onFail())
      else video.pause()
    })
    io.observe(video)
    return () => io.disconnect()
  }, [L, onFail])
  return (
    <div className="dk-host" role="img" aria-label={LABEL}>
      <video
        ref={ref}
        key={phone ? 'phone' : 'desktop'}
        src={phone ? '/videos/decathlon-phone.mp4' : '/videos/decathlon-desktop.mp4'}
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
        aria-hidden="true"
        style={{ display: 'block', width: '100%', aspectRatio: `${L.W} / ${L.H}`, background: '#081130' }}
      />
    </div>
  )
}

function LiveClip() {
  const phone = usePhone()
  const L = phone ? PHONE : DESKTOP
  // Phones get copies of the two large ad images at the most they're ever shown on a phone screen
  // (lossless, made on Karel's request) – a third of the pixels to draw while the camera zooms.
  const adImages = phone ? '/images/decathlon/phone' : '/images/decathlon'
  const hostRef = useRef<HTMLDivElement>(null)
  const cameraRef = useRef<HTMLDivElement>(null)
  const panelItemsRef = useRef<HTMLDivElement>(null)
  const blurRef = useRef<HTMLDivElement>(null)
  const arrowRef = useRef<HTMLImageElement>(null)
  const pickRowRef = useRef<HTMLDivElement>(null)
  const fitnessOnRef = useRef<HTMLImageElement>(null)
  const routeRef = useRef<HTMLDivElement>(null)
  const sectionOnRef = useRef<HTMLDivElement>(null)
  const letterOnRef = useRef<HTMLDivElement>(null)
  const rowAllRef = useRef<HTMLDivElement>(null)
  const rowPickRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const thumbHeldRef = useRef<HTMLDivElement>(null)
  const welcomeRef = useRef<HTMLDivElement>(null)
  const matRef = useRef<HTMLImageElement>(null)
  const matTitleRef = useRef<HTMLDivElement>(null)
  const fingerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const { W, H, K, OX, OY, T, LOOP } = L

    // The route: hide the design's dashed path (the initial SVG draws it) and its outlined route,
    // and draw the route as a stroke along its centre line instead.
    const svg = routeRef.current!.querySelector('svg')!
    const paths = svg.querySelectorAll(':scope > g > path')
    ;(paths[0] as SVGPathElement).style.display = 'none'
    ;(paths[1] as SVGPathElement).style.display = 'none'
    const dot = svg.querySelector(':scope > g > g') as SVGGElement
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    line.setAttribute('d', ROUTE_LINE)
    line.setAttribute('fill', 'none')
    line.setAttribute('stroke', '#02BE8A')
    line.setAttribute('stroke-width', '5.339')
    line.setAttribute('stroke-linecap', 'round')
    line.setAttribute('stroke-linejoin', 'round')
    svg.querySelector(':scope > g')!.insertBefore(line, dot)
    const lineLength = line.getTotalLength()
    // As attributes, not CSS – the most dependable way to update an SVG stroke every frame.
    line.setAttribute('stroke-dasharray', `${lineLength} ${lineLength + 10}`)

    const items = [...panelItemsRef.current!.querySelectorAll<HTMLElement>('[data-cascade]')]
    const pickChips = [...rowPickRef.current!.children] as HTMLElement[]
    const pilatesPress = pickChips[PICKED.findIndex((x) => x.name === PICK_SPORT)].firstElementChild as HTMLElement
    const letterLabel = letterOnRef.current!.nextElementSibling as HTMLElement
    const secLabel = sectionOnRef.current!.nextElementSibling as HTMLElement

    // Measured once fonts are in (layout px, unaffected by the frame's scale).
    const m = { scroll: 3000, pilatesX: PILATES_X - ROW_LEFT }
    const measure = () => {
      m.scroll = (rowAllRef.current!.children[T.scrollChips ?? SCROLL_CHIPS] as HTMLElement).offsetLeft
      const p = pickChips[PICKED.findIndex((x) => x.name === PICK_SPORT)]
      m.pilatesX = p.offsetLeft + p.offsetWidth / 2
    }
    measure()
    document.fonts?.ready.then(measure)

    // Every write goes through `put`, which skips a value that hasn't changed: most of the kiosk is
    // still at any moment, so most frames only touch the camera. (`@name` sets an attribute.)
    // `record` collects the opacity and transform values frame() sets over a whole loop, so they can be
    // handed to the GPU; `baked` lists the ones the GPU then runs – frame() leaves those be.
    const live = { gpu: false } // whether the GPU is running the motion right now
    const last = new Map<Element, Record<string, string>>()
    let record: Map<HTMLElement, Record<string, string[]>> | null = null
    const baked = new Map<Element, Set<string>>()
    const put = (el: HTMLElement | SVGElement, prop: string, value: string) => {
      if (record) {
        if (el instanceof HTMLElement && el !== cameraRef.current && (prop === 'opacity' || prop === 'transform')) {
          let tracks = record.get(el)
          if (!tracks) record.set(el, (tracks = {}))
          ;(tracks[prop] ??= []).push(value)
        }
        return
      }
      if (baked.get(el)?.has(prop)) return
      let seen = last.get(el)
      if (!seen) last.set(el, (seen = {}))
      if (seen[prop] === value) return
      seen[prop] = value
      if (prop[0] === '@') el.setAttribute(prop.slice(1), value)
      else el.style.setProperty(prop, value)
    }
    // An element faded right out is also hidden, so the phone skips it when it redraws the kiosk.
    const fade = (el: HTMLElement | SVGElement, o: number) => {
      put(el, 'opacity', String(o))
      put(el, 'visibility', o < 0.001 ? 'hidden' : '')
    }
    const panelInner = panelItemsRef.current!

    // Phone: whatever slides moves by whole screen pixels (as iOS scrolling does), so the drawn
    // kiosk is never resampled between pixels – no shimmer on thin lines and small text while the
    // camera pans. `q` is screen pixels per stage pixel (0 = no snapping, on desktop).
    const px = { q: 0 }
    const measurePx = () => (px.q = phone ? ((window.devicePixelRatio || 1) * hostRef.current!.clientWidth) / W : 0)
    measurePx()
    const pxRo = new ResizeObserver(measurePx)
    pxRo.observe(hostRef.current!)
    const snap = (v: number, perPx: number) => (px.q ? Math.round(v * perPx) / perPx : v)
    /** The camera's transform, relative to its own box (the kiosk, at OX, OY in the stage). */
    const [BX, BY] = [OX, OY]
    const cameraTransform = (c: Cam, s: number, snapped: boolean) => {
      const x = W / 2 + s * (BX - c.x) // where the box's corner lands in the stage
      const y = H / 2 + s * (BY - c.y)
      return `translate(${(snapped ? snap(x, px.q) : x) - BX}px, ${(snapped ? snap(y, px.q) : y) - BY}px) scale(${s})`
    }

    const frame = (t: number) => {
      const r = inOut(prog(t, T.reset[0], T.reset[1])) // soft reset back to the initial state
      const keep = 1 - r

      // Camera (its scale rounded, so a held zoom is exactly the same and never re-renders the kiosk)
      const cam = L.cameraAt(t)
      const s = Math.round(cam.s * 1e6) / 1e6 // fine enough that even the slowest drift moves every frame
      if (!live.gpu) put(cameraRef.current!, 'transform', cameraTransform(cam, s, true))
      const perScreenPx = px.q * s * K // screen pixels per kiosk design px

      // Scrollbar: grabbed (a little greyer), dragged half way at constant speed, then back to the
      // start as the list filters
      const thumbX = thumbAt(t, T)
      put(thumbRef.current!, 'transform', `translateX(${snap(thumbX, perScreenPx)}px)`)
      const held = prog(t, T.grab, T.grab + 0.15) * (1 - prog(t, T.release, T.release + 0.2))
      fade(thumbHeldRef.current!, held)

      // Chip rows: the full A–Z list scrolls, then gives way to the P sports, packed left
      const scrollX = (thumbX / DRAG_TO) * m.scroll
      // (whole rows fade, not 155 chips one by one – keeps every frame cheap)
      const allOut = outCubic(prog(t, T.filter.out, T.filter.out + 0.25)) * keep
      const rowAll = rowAllRef.current!
      put(rowAll, 'opacity', String(1 - allOut))
      put(rowAll, 'transform', `translate(${-snap(scrollX, perScreenPx)}px, ${-8 * allOut}px)`)
      put(rowAll, 'visibility', allOut > 0.999 ? 'hidden' : '')
      put(rowPickRef.current!, 'opacity', String(keep))
      pickChips.forEach((el, i) => {
        const k = outQuint(prog(t, T.filter.in + i * T.filter.step, T.filter.in + i * T.filter.step + 0.6))
        fade(el, k)
        put(el, 'transform', `translateX(${90 * (1 - k)}px)`)
      })

      // Letter P: selected on the tap
      const letterOn = outCubic(prog(t, T.tapLetter, T.tapLetter + 0.18)) * keep
      fade(letterOnRef.current!, letterOn)
      put(letterLabel, 'color', mix(0x14, 0x1b, 0x56, letterOn)) // #141b56 → white, with the fill

      // ── After the Pilates tap: everything at once ──
      // Sports Section: Fitness lights up
      const sec = outCubic(prog(t, T.section, T.section + 0.3)) * keep
      fade(sectionOnRef.current!, sec)
      put(secLabel, 'color', mix(0x1d, 0x23, 0x51, sec)) // #1d2351 → white, with the fill

      // Panel: blur clears while the content dips, then drops in, row by row
      // …and on the reset it comes back fast (0.35 s), as the list returns – not drawn out over the whole reset
      const blur = 1 - inOut(prog(t, T.blur[0], T.blur[1])) * (1 - inOut(prog(t, T.reset[0], T.reset[0] + 0.35)))
      fade(blurRef.current!, blur)
      // Phone: the blur is a filter on the panel's own content rather than a backdrop blur – the
      // same look, but drawn once instead of on every frame the camera moves
      if (phone) put(panelInner, 'filter', blur > 0.005 ? `blur(${(11.35 * blur).toFixed(2)}px)` : 'none')
      const dip = prog(t, T.dip[0], T.dip[1])
      items.forEach((el, i) => {
        const st = T.cascade.start + i * T.cascade.step
        const k = outCubic(prog(t, st, st + T.cascade.dur))
        if (keep < 1 || t < T.dip[0]) {
          put(el, 'opacity', '')
          put(el, 'visibility', '')
          put(el, 'transform', '')
          return
        }
        fade(el, t < T.cascade.start ? 1 - dip : k)
        put(el, 'transform', t < T.cascade.start ? '' : `translateY(${-18 * (1 - k)}px)`)
      })
      const pick = outCubic(prog(t, T.pick, T.pick + 0.3)) * keep
      put(pickRowRef.current!, 'background-color', `rgb(${lerp(51, 30, pick)}, ${lerp(67, 37, pick)}, ${lerp(193, 103, pick)})`)
      // The ← arrow: fades in, then hovers gently left and right
      const ai = outCubic(prog(t, T.arrow, T.arrow + 0.4)) * keep
      const hover = t > T.arrow ? Math.sin(((t - T.arrow) / 1.6) * Math.PI * 2) : 0
      fade(arrowRef.current!, ai)
      put(arrowRef.current!, 'transform', `translateX(${-9 * hover - 12 * (1 - ai)}px)`)

      // Ad, last: the welcome lifts away, the mat rises in and its title follows. On the reset it plays
      // back in turn rather than cross-fading: the mat and its title sink away, then the welcome rises in.
      const rd = T.reset[1] - T.reset[0]
      const exit = inCubic(prog(t, T.reset[0], T.reset[0] + 0.5 * rd))
      const enter = outCubic(prog(t, T.reset[0] + 0.45 * rd, T.reset[1]))
      const adOut = outCubic(prog(t, T.ad, T.ad + 0.45)) * (1 - enter)
      const matIn = outCubic(prog(t, T.ad + 0.15, T.ad + 1.15))
      const titleIn = outCubic(prog(t, T.ad + 0.35, T.ad + 1.1))
      fade(welcomeRef.current!, 1 - adOut)
      put(welcomeRef.current!, 'transform', `translateY(${enter > 0 ? 40 * (1 - enter) : -40 * adOut}px)`)
      fade(matRef.current!, matIn * (1 - exit))
      put(matRef.current!, 'transform', `translateY(${220 * (1 - matIn) + 140 * exit}px)`)
      fade(matTitleRef.current!, titleIn * (1 - exit))
      put(matTitleRef.current!, 'transform', `translateY(${50 * (1 - titleIn) + 70 * exit}px)`)

      // Map: the route runs on from its solid start; the dot and the blue area arrive together
      const draw = outCubic(prog(t, T.route[0], T.route[1])) // rolls out along the route, easing out
      put(line, '@stroke-dashoffset', String(lineLength * (1 - draw)))
      put(line, 'opacity', String(keep))
      const d = outCubic(prog(t, T.end, T.end + 0.5))
      fade(dot, d * keep)
      put(dot, '@transform', `translate(11.454 90.19) scale(${0.4 + 0.6 * d}) translate(-11.454 -90.19)`)
      fade(fitnessOnRef.current!, d * keep)

      // The visible finger, and the Pilates chip's press
      if (T.finger) {
        const fp = fingerAt(t, T, m.pilatesX)
        const chipTap = tap(t, T.finger.tapChip)
        const letterTap = tap(t, T.tapLetter)
        fade(pilatesPress, chipTap.press)
        const fe = fingerRef.current!
        fade(fe, fp.fin * (1 - fp.fout))
        put(fe, 'transform', `translate(${OX - BX + K * fp.x}px, ${OY - BY + K * fp.y}px) scale(${(K / 0.88) * (1 + 0.15 * fp.fout)})`)
        put(fe, '--press', String(Math.max(held, letterTap.press, chipTap.press)))
        put(fe, '--ripple', String(t < T.tapLetter - 0.05 ? 1 : t < T.finger.tapChip - 0.2 ? letterTap.ripple : chipTap.ripple))
      }
    }

    // ?render: the clip alone, filling the window, drawn at any moment on request – for recording
    // Safari's video frame by frame (`window.__dkRender(t)`; the loop is `__dkLoop`).
    if (new URLSearchParams(window.location.search).has('render')) {
      const host = hostRef.current!
      host.style.cssText = 'position:fixed;left:0;top:0;width:100vw;z-index:2147483647'
      const w = window as unknown as Record<string, unknown>
      w.__dkLoop = { start: T.start, end: LOOP }
      w.__dkRender = (t: number) => frame(t)
      frame(T.start)
      return () => {
        pxRo.disconnect()
        line.remove()
        panelInner.style.filter = ''
      }
    }

    // Debug: ?clip=10.8 freezes the clip at that second (for reviewing individual moments).
    const pinned = parseFloat(new URLSearchParams(window.location.search).get('clip') ?? '')
    if (reduce || !Number.isNaN(pinned)) {
      const at = Number.isNaN(pinned) ? T.ad + 2 : pinned // reduced motion: the finished Select state
      frame(at)
      const id = requestAnimationFrame(() => frame(at))
      document.fonts?.ready.then(() => frame(at))
      return () => {
        cancelAnimationFrame(id)
        pxRo.disconnect()
        line.remove()
        panelInner.style.filter = ''
      }
    }

    // The graphics hardware runs the motion (at the screen's own rate – 120 Hz on ProMotion screens,
    // where script-driven motion in Safari is held to 60). The camera's path and every fade and slide
    // frame() would set are sampled over the whole loop at 60 Hz and handed to the GPU as animations
    // on one clock. The browser draws the kiosk once, sharp at the closest zoom of the coming second
    // (in 15 % steps), and the GPU only scales and slides that picture – nothing is redrawn, so
    // nothing re-snaps and glitters while the camera moves. The camera's animation is the clock for
    // what's left to the script (colours, the route, the finger's press). `?nogpu` turns it off.
    // Not in Safari: it can't keep GPU animations of a scene this size right while the page scrolls
    // (parts of the kiosk go missing or overlap as it scrolls into view), so Safari gets the script.
    const span = LOOP - T.start
    let gpu: { anim: Animation; all: Animation[]; raster: number[]; n: number; at: number } | null = null
    let stopped = false
    const startGpu = () => {
      if (stopped) return
      measure() // the fonts are in: the sports' real widths
      const n = Math.round(span * 60)
      const at = (i: number) => T.start + (i / n) * span
      const path = Array.from({ length: n + 1 }, (_, i) => L.cameraAt(at(i)))
      const step = Math.log(1.15)
      const raster = path.map((_, i) => {
        let most = 0
        for (let j = i; j <= Math.min(n, i + 60); j++) most = Math.max(most, path[j].s)
        return Math.exp(Math.ceil(Math.log(most) / step) * step)
      })
      const timing = { duration: span * 1000, iterations: Infinity }
      const anim = cameraRef.current!.animate(path.map((c) => ({ transform: cameraTransform(c, c.s, false) })), timing)
      const all = [anim]
      // every opacity and transform frame() sets, over the loop (only the moments it changes are kept)
      record = new Map()
      for (let i = 0; i <= n; i++) frame(at(i))
      const tracks = record
      record = null
      tracks.forEach((props, el) => {
        for (const [prop, values] of Object.entries(props)) {
          if (values.length !== n + 1 || values.every((v) => v === values[0])) continue
          const css = (v: string) => (v !== '' ? v : prop === 'opacity' ? '1' : 'none')
          const keyframes: Keyframe[] = []
          values.forEach((v, i) => {
            if (i === 0 || i === n || v !== values[i - 1] || v !== values[i + 1]) keyframes.push({ offset: i / n, [prop]: css(v) })
          })
          all.push(el.animate(keyframes, timing))
          if (!baked.has(el)) baked.set(el, new Set())
          baked.get(el)!.add(prop)
        }
      })
      // one clock, carrying on from where the script had got to
      const startTime = Number(document.timeline.currentTime) - elapsed * 1000
      all.forEach((a) => (a.startTime = startTime))
      if (!visible) all.forEach((a) => a.pause())
      gpu = { anim, all, raster, n, at: 0 }
      live.gpu = true
    }
    const safari = /^((?!chrome|chromium|android|crios|fxios|edgios).)*safari/i.test(navigator.userAgent)
    if (!safari && 'animate' in Element.prototype && !new URLSearchParams(window.location.search).has('nogpu')) {
      Promise.resolve(document.fonts?.ready).then(startGpu)
    }

    let raf = 0
    let elapsed = 0
    let prev = 0
    let visible = true
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting
      gpu?.all.forEach((a) => (visible ? a.play() : a.pause()))
    }, { rootMargin: '200px' })
    if (hostRef.current) io.observe(hostRef.current)
    const meter = new URLSearchParams(window.location.search).has('fps') ? fpsMeter(LOOP) : null
    const tick = (now: number) => {
      if (prev && visible) elapsed += Math.min(now - prev, 100) / 1000
      prev = now
      let t = T.start + (elapsed % span)
      if (gpu) {
        const into = (((Number(gpu.anim.currentTime) || 0) / 1000) % span + span) % span
        t = T.start + into
        // the scale the kiosk is drawn at (the animation runs on top of it): changes only per step
        const R = gpu.raster[Math.round((into / span) * gpu.n)]
        if (R !== gpu.at) {
          gpu.at = R
          put(cameraRef.current!, 'transform', cameraTransform(L.cameraAt(t), R, false))
        }
      }
      if (visible) {
        frame(t)
        meter?.tick(now, t)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      stopped = true
      gpu?.all.forEach((a) => a.cancel())
      io.disconnect()
      pxRo.disconnect()
      line.remove()
      panelInner.style.filter = ''
      meter?.remove()
    }
  }, [L, phone])

  let cascadeIndex = 0
  const cascade = () => ({ 'data-cascade': cascadeIndex++ })

  return (
    <div
      ref={hostRef}
      className="dk-host"
      role="img"
      aria-label={LABEL}
    >
      <ScaledFrame width={L.W} height={L.H} className={phone ? 'dk dk--phone' : 'dk'}>
        {/* The camera is exactly the kiosk's rectangle – the smallest layer the GPU has to hold */}
        <div className="dk__camera" ref={cameraRef} style={{ left: L.OX, top: L.OY, width: SCREEN.w * L.K, height: SCREEN.h * L.K }}>
          <div className="dk__screen" style={{ transform: `scale(${L.K})` }}>
            <div className="dk__main">
              <div className="dk__top">
                {/* Category panel */}
                <div className="dk__panel">
                  <div className="dk__panel-inner" ref={panelItemsRef}>
                    <img className="dk__icon" src={sportIcon} alt="" /> {/* stays put – only the list drops in */}
                    <div className="dk__panel-body">
                      <div className="dk__title-row" {...cascade()}>
                        <p className="dk__title">Fitness</p>
                        <img className="dk__arrow" src={arrow} alt="" ref={arrowRef} style={{ opacity: 0 }} />
                      </div>
                      <div className="dk__cols">
                        {FITNESS_COLUMNS.map((col, c) => (
                          <div className="dk__col" key={c}>
                            {col.map((name) =>
                              name === PICK_SPORT ? (
                                <div className="dk__item dk__item--pick" key={name} ref={pickRowRef} {...cascade()}>
                                  {name}
                                </div>
                              ) : (
                                <div className="dk__item" key={name} {...cascade()}>
                                  {name}
                                </div>
                              ),
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="dk__blur" ref={blurRef} />
                </div>

                {/* Store map */}
                <div className="dk__map">
                  {PIECES.map(([src, x, y, w, h]) => (
                    <img key={src} src={src} alt="" style={{ left: x, top: y, width: w, height: h }} />
                  ))}
                  <img src={fitnessOff} alt="" style={{ left: 504, top: 185.9, width: 379.077, height: 437.81 }} />
                  <img src={fitnessOn} alt="" ref={fitnessOnRef} style={{ left: 504, top: 185.9, width: 379.077, height: 437.81, opacity: 0 }} />
                  {AREAS.map(([color, x, y, w, h]) => (
                    <div key={`${x}-${y}`} className="dk__area" style={{ left: x, top: y, width: w, height: h, background: color }} />
                  ))}
                  {MAP_ICONS.map(([src, x, y, w, h]) => (
                    <img key={src} src={src} alt="" style={{ left: x, top: y, width: w, height: h }} />
                  ))}
                  <img src={routeInitial} alt="" style={{ left: 672.04, top: 365.88, width: 736.048, height: 742.703 }} />
                  <div
                    className="dk__route-select"
                    ref={routeRef}
                    style={{ left: 662.59, top: 364.78, width: 745.48, height: 743.796 }}
                    dangerouslySetInnerHTML={{ __html: routeSelectSvg }}
                  />
                  <div className="dk__legend">
                    {LEGEND.map(([src, label]) => (
                      <div className="dk__legend-item" key={label}>
                        <img src={src} alt="" />
                        <p>{label}</p>
                      </div>
                    ))}
                  </div>
                  <div className="dk__here">
                    <img src={youAreHere} alt="" />
                    <p>You Are Here</p>
                  </div>
                </div>
              </div>

              {/* Sports Section */}
              <div className="dk__sections">
                <p className="dk__label">Sports Section</p>
                <div className="dk__section-list">
                  {SECTIONS.map((s) => (
                    <div className="dk__section" key={s}>
                      {s === 'Fitness' && <div className="dk__section-on" ref={sectionOnRef} />}
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sports: alphabet + chips */}
              <div className="dk__search">
                <p className="dk__label">Sports</p>
                <div className="dk__search-body">
                  <div className="dk__letters">
                    {LETTERS.map((l) => (
                      <div className={`dk__letter${ACTIVE_LETTERS.has(l) ? '' : ' dk__letter--off'}`} key={l}>
                        {l === PICK_LETTER && <div className="dk__letter-on" ref={letterOnRef} />}
                        <span>{l}</span>
                      </div>
                    ))}
                  </div>
                  <div className="dk__chips-area">
                    <div className="dk__chips">
                      <div className="dk__row" ref={rowAllRef}>
                        {SPORTS.map((s) => (
                          <div className="dk__chip" key={s.name}>
                            <span>{s.name}</span>
                          </div>
                        ))}
                      </div>
                      <div className="dk__row" ref={rowPickRef}>
                        {PICKED.map((s) => (
                          <div className="dk__chip" key={s.name} style={{ opacity: 0 }}>
                            <div className="dk__chip-press" />
                            <span>{s.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="dk__track">
                      <div className="dk__thumb" ref={thumbRef}>
                        <div className="dk__thumb-held" ref={thumbHeldRef} />
                      </div>
                    </div>
                    <div className="dk__fade" />
                  </div>
                </div>
              </div>
            </div>

            {/* Ad screen */}
            <div className="dk__ad">
              <div className="dk__ad-layer" ref={welcomeRef}>
                <div className="dk__welcome">
                  <img src={`${adImages}/welcome.png`} alt="" />
                </div>
                <p className="dk__prompt">Select section or search by sport</p>
              </div>
              <img className="dk__mat" src="/images/decathlon/mat.png" alt="" ref={matRef} style={{ opacity: 0 }} />
              <div className="dk__mat-title" ref={matTitleRef} style={{ opacity: 0 }}>
                <img src={`${adImages}/mat-title.png`} alt="" />
              </div>
            </div>
          </div>

          {L.T.finger && (
            <div className="dk__finger" ref={fingerRef}>
              <div className="dk__finger-ring" />
              <div className="dk__finger-dot" />
            </div>
          )}
        </div>
      </ScaledFrame>
    </div>
  )
}
