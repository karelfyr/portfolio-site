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
 * and Select states are the Figma frames; everything between is animated. No visible hand: the
 * UI simply answers an invisible touch.
 *
 * The camera is one continuous path through a list of shots (see `schedule`):
 * - it never stops – each shot is a short dwell with a slow drift (≈1–2 screen px/s, aimed at the
 *   next target, plus a hair of push-in), and every move enters and leaves at that drift speed;
 * - travel time between shots follows the distance covered (frame widths + zoom change);
 * - during the slider drag it moves at the thumb's constant speed, 1:1, so the thumb stays put;
 * - every UI event is timed from the camera's arrival, so it happens in the middle of the frame.
 *
 * Desktop (3840 × 2700): overview → "Find your sport" → the search, riding the drag → P → the P
 * sports → Pilates → the whole kiosk as everything answers in order (section, panel, route and
 * point, then the ad) → long dwell → sit back into the next loop.
 * Phone (2160 × 3456, portrait): the same, closer – plus the "Sports Section" / "Sports" titles,
 * and after Pilates a flythrough: section → panel → map (route, then in on Fitness as the point
 * lands) → the ad → the whole kiosk.
 */

// ── Easing ──────────────────────────────────────────────────────────
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x))
const prog = (t: number, a: number, b: number) => clamp01((t - a) / (b - a))
const inOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
const outCubic = (x: number) => 1 - Math.pow(1 - x, 3)
const outQuint = (x: number) => 1 - Math.pow(1 - x, 5)
const lerp = (a: number, b: number, k: number) => a + (b - a) * k
/** A label's colour from (r, g, b) towards white, in step with its button's fill. */
const mix = (r: number, g: number, b: number, k: number) => `rgb(${lerp(r, 255, k)}, ${lerp(g, 255, k)}, ${lerp(b, 255, k)})`

// ── The kiosk's own layout (design px, screen coordinates) ──────────
const ROW_LEFT = 429.68 // the sports search column (label 144 + 237.6 + gap 48)
const VISIBLE = 1807.2
const THUMB = 469.8
const DRAG_TO = VISIBLE / 2 - THUMB / 2 // the thumb is dragged to the middle of the track…
const SCROLL_CHIPS = 15 // …but the list only moves on by about 15 sports, slowly, so each one reads
const LETTER_STEP = 64.8 // 54 + 10.8
const SCREEN = { w: 3840, h: 2160 }
const THUMB_X = ROW_LEFT + THUMB / 2 // the thumb's centre at rest
const P_X = ROW_LEFT + LETTERS.indexOf(PICK_LETTER) * LETTER_STEP + 27 // the P key
const PILATES_X = 1075 // the Pilates chip in the filtered row
const DRAG_TIME = 3.5 // the drag: constant speed, so the list streams by evenly

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
}

/** The scrollbar thumb's offset: constant speed while dragged, back to the start as the list filters. */
function thumbAt(t: number, T: Timeline) {
  const dragK = prog(t, T.drag[0], T.drag[1])
  const backK = inOut(prog(t, T.filter.out, T.filter.out + 0.55))
  return DRAG_TO * dragK * (1 - backK)
}

// ── The camera: one continuous path through timed shots ─────────────
type Cam = { s: number; x: number; y: number }
type Shot = {
  name: string
  s: number
  x: number // screen px – the shot is centred exactly here
  y: number
  dwell: number
  /** Explicit velocity during the dwell (screen px/s) – e.g. the drag's constant speed. */
  move?: { x: number; y: number }
  /** Override the travel time into this shot (s). */
  travel?: number
}
type Knot = { t: number; p: number[]; v: number[] } // p, v: [x, y, ln s] in screen px

/**
 * Lays the shots out in time and returns the camera path and each shot's arrival / departure.
 * - Dwell: the camera keeps drifting (DRIFT × frame width per second, towards the next shot, plus
 *   a 0.15 %/s push-in) – it never comes to rest.
 * - Travel: 0.7 s + 0.9 s × distance (in frame widths, plus 0.7 × the zoom change in ln), 0.9–2.4 s;
 *   a cubic (Hermite) curve that leaves and arrives at the dwell's drift velocity – an ease in-out
 *   that hands over to the drift without ever stopping.
 */
function schedule(shots: Shot[], viewW: (s: number) => number, drift: number) {
  const knots: Knot[] = []
  const times: Record<string, { arrive: number; depart: number }> = {}
  const last = shots.length - 1
  const vel = (i: number): number[] => {
    // the last shot is the first one again (the loop's seam): same drift, so speed carries through
    if (i === last) return vel(0)
    const a = shots[i]
    if (a.move) return [a.move.x, a.move.y, 0]
    const b = shots[i + 1]
    const v = drift * viewW(a.s)
    // the slow zoom drift leans towards the next shot's scale (anticipation)
    const zoom = 0.0015 * (Math.log(b.s / a.s) < -0.01 ? -1 : 1)
    const dx = b.x - a.x, dy = b.y - a.y
    const d = Math.hypot(dx, dy)
    // next shot in the same place (e.g. a sit-back): drift gently on the diagonal instead of stopping
    if (d < 1) return [v * 0.8, v * 0.6, zoom]
    return [(dx / d) * v, (dy / d) * v, zoom]
  }
  let t = 0
  shots.forEach((sh, i) => {
    const v = vel(i)
    if (i > 0) {
      const prev = knots[knots.length - 1]
      const dist = Math.hypot(sh.x - prev.p[0], sh.y - prev.p[1]) / viewW(Math.exp((prev.p[2] + Math.log(sh.s)) / 2)) + 0.7 * Math.abs(Math.log(sh.s) - prev.p[2])
      t += sh.travel ?? clamp(0.7 + 0.9 * dist, 0.9, 2.4)
    }
    const p = [sh.x, sh.y, Math.log(sh.s)]
    knots.push({ t, p, v })
    times[sh.name] = { arrive: t, depart: t + sh.dwell }
    if (sh.dwell > 0) knots.push({ t: t + sh.dwell, p: p.map((c, k) => c + v[k] * sh.dwell), v })
    t += sh.dwell
  })
  const at = (t: number): number[] => {
    if (t <= knots[0].t) return knots[0].p
    const last = knots[knots.length - 1]
    if (t >= last.t) return last.p
    let i = 0
    while (t > knots[i + 1].t) i++
    const a = knots[i], b = knots[i + 1]
    const h = b.t - a.t
    const u = (t - a.t) / h
    const h00 = 2 * u ** 3 - 3 * u ** 2 + 1, h10 = u ** 3 - 2 * u ** 2 + u, h01 = -2 * u ** 3 + 3 * u ** 2, h11 = u ** 3 - u ** 2
    return [0, 1, 2].map((k) => h00 * a.p[k] + h10 * h * a.v[k] + h01 * b.p[k] + h11 * h * b.v[k])
  }
  return { at, times, total: t }
}

// ── Layouts ─────────────────────────────────────────────────────────
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

/** Shared by both layouts: builds the stage mapping, the camera and the timeline from the shots. */
function makeLayout(W: number, H: number, K: number, drift: number, shots: Shot[], events: (a: (n: string) => number, d: (n: string) => number) => Timeline): Layout {
  const OX = (W - SCREEN.w * K) / 2
  const OY = (H - SCREEN.h * K) / 2
  const viewW = (s: number) => W / s / K // the frame's width in screen px at scale s
  const path = schedule(shots, viewW, drift)
  const arrive = (n: string) => path.times[n].arrive
  const depart = (n: string) => path.times[n].depart
  return {
    W, H, K, OX, OY,
    LOOP: path.total,
    T: events(arrive, depart),
    cameraAt: (t: number) => {
      const [x, y, ls] = path.at(t)
      return { s: Math.exp(ls), x: OX + K * x, y: OY + K * y }
    },
  }
}

/** The overview the loop starts and ends on: the whole kiosk, sat back slightly. */
const overview = (name: string, dwell: number, travel?: number): Shot => ({ name, s: 0.93, x: SCREEN.w / 2, y: SCREEN.h / 2, dwell, travel })

/** The events every layout shares, timed from the camera (a = arrival, d = departure). */
const searchEvents = (a: (n: string) => number) => ({
  drag: [a('drag'), a('drag') + DRAG_TIME],
  grab: a('drag') - 0.15,
  release: a('drag') + DRAG_TIME + 0.1,
  tapLetter: a('letter') + 0.15,
  filter: { out: a('letter') + 0.25, in: a('letter') + 0.5, step: 0.06 },
})

function desktopLayout(): Layout {
  const Y = 1393 // the search framing's centre line
  return makeLayout(3840, 2700, 0.88, 0.003, [
    overview('start', 1.0),
    { name: 'find', s: 3.6, x: 3233, y: 1671, dwell: 1.6 }, // exactly the ad panel – read
    { name: 'drag', s: 2, x: THUMB_X + 336, y: Y, dwell: DRAG_TIME, move: { x: DRAG_TO / DRAG_TIME, y: 0 } }, // rides the drag 1:1
    { name: 'letter', s: 2, x: P_X - 80, y: Y, dwell: 0.9 },
    { name: 'pwords', s: 2, x: 1100, y: Y, dwell: 1.6, move: { x: 40, y: 0 } }, // a slow read across the P sports
    { name: 'pilates', s: 2, x: PILATES_X + 120, y: Y, dwell: 0.6 },
    { name: 'home', s: 1, x: SCREEN.w / 2, y: SCREEN.h / 2, dwell: 7.5 }, // everything answers, in order
    overview('end', 0, 2.0),
  ], (a, d) => {
    const h = a('home')
    return {
      start: 0,
      ...searchEvents(a),
      section: h - 0.3,
      blur: [h, h + 0.6],
      dip: [h - 0.05, h + 0.1],
      cascade: { start: h + 0.15, step: 0.03, dur: 0.5 },
      pick: h + 0.75,
      arrow: h + 0.8,
      route: [h + 0.3, h + 2.1],
      end: h + 1.65,
      ad: h + 2.3,
      reset: [d('home') + 0.1, a('end') - 0.2], // eases back across the whole sit-back
    }
  })
}

function phoneLayout(): Layout {
  const W = 2160
  return makeLayout(W, 3456, (0.9 * W) / SCREEN.w, 0.005, [
    overview('start', 1.0),
    { name: 'ad1', s: 3.52, x: 3232, y: 1080, dwell: 1.0 }, // the ad panel, edge to edge
    { name: 'fys', s: 4, x: 3232, y: 1671, dwell: 1.6 }, // "Find your sport" + the prompt – read
    { name: 'titles', s: 3.2, x: 262, y: 1600, dwell: 1.6 }, // the "Sports Section" / "Sports" titles – read
    { name: 'drag', s: 4.2, x: THUMB_X, y: 1900, dwell: DRAG_TIME, move: { x: DRAG_TO / DRAG_TIME, y: 0 } }, // rides the drag 1:1
    { name: 'letter', s: 4.2, x: P_X, y: 1840, dwell: 0.9 },
    { name: 'pwords', s: 2.7, x: 1080, y: 1890, dwell: 1.8, move: { x: 80, y: 0 } }, // a slow read across the P sports
    { name: 'pilates', s: 2.9, x: PILATES_X, y: 1921, dwell: 0.6 },
    { name: 'section', s: 2.9, x: 1888, y: 1432, dwell: 1.2 }, // Fitness lights up
    { name: 'panel', s: 2.9, x: 473, y: 646, dwell: 1.8 }, // the list drops in
    { name: 'map', s: 2.9, x: 1985, y: 700, dwell: 1.0 }, // the route rolls out…
    { name: 'fitness', s: 3.4, x: 1640, y: 430, dwell: 1.8 }, // …and the point lands
    { name: 'ad', s: 2.8, x: 3232, y: 1080, dwell: 2.0 }, // the ad rolls out
    { name: 'home', s: 1, x: SCREEN.w / 2, y: SCREEN.h / 2, dwell: 2.4 }, // the whole kiosk
    overview('end', 0, 2.0),
  ], (a, d) => ({
    start: 0,
    ...searchEvents(a),
    section: a('section') - 0.15,
    blur: [a('panel') - 0.3, a('panel') + 0.7],
    dip: [a('panel') - 0.35, a('panel') - 0.2],
    cascade: { start: a('panel') - 0.15, step: 0.045, dur: 0.6 },
    pick: a('panel') + 1.0,
    arrow: a('panel') + 1.1,
    route: [a('map') - 0.3, a('fitness') + 0.5],
    end: a('fitness') - 0.05,
    ad: a('ad') - 0.9,
    reset: [d('home') + 0.1, a('end') - 0.2], // eases back across the whole sit-back
  }))
}

const DESKTOP = desktopLayout()
const PHONE = phoneLayout()
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

export function DecathlonClip() {
  const L = usePhone() ? PHONE : DESKTOP
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

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const { W, H, T, LOOP } = L

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
    const letterLabel = letterOnRef.current!.nextElementSibling as HTMLElement
    const secLabel = sectionOnRef.current!.nextElementSibling as HTMLElement

    // Measured once fonts are in (layout px, unaffected by the frame's scale).
    const m = { scroll: 3000 }
    const measure = () => {
      m.scroll = (rowAllRef.current!.children[SCROLL_CHIPS] as HTMLElement).offsetLeft
    }
    measure()
    document.fonts?.ready.then(measure)

    const frame = (t: number) => {
      const r = inOut(prog(t, T.reset[0], T.reset[1])) // soft reset back to the initial state
      const keep = 1 - r

      // Camera
      const cam = L.cameraAt(t)
      cameraRef.current!.style.transform = `translate(${W / 2}px, ${H / 2}px) scale(${cam.s}) translate(${-cam.x}px, ${-cam.y}px)`

      // Scrollbar: grabbed (a little greyer), dragged half way at constant speed, then back to the
      // start as the list filters
      const thumbX = thumbAt(t, T)
      thumbRef.current!.style.transform = `translateX(${thumbX}px)`
      const held = prog(t, T.grab, T.grab + 0.15) * (1 - prog(t, T.release, T.release + 0.2))
      thumbHeldRef.current!.style.opacity = String(held)

      // Chip rows: the full A–Z list scrolls, then gives way to the P sports, packed left
      const scrollX = (thumbX / DRAG_TO) * m.scroll
      // (whole rows fade, not 155 chips one by one – keeps every frame cheap)
      const allOut = outCubic(prog(t, T.filter.out, T.filter.out + 0.25)) * keep
      const rowAll = rowAllRef.current!
      rowAll.style.opacity = String(1 - allOut)
      rowAll.style.transform = `translate(${-scrollX}px, ${-8 * allOut}px)`
      rowAll.style.visibility = allOut > 0.999 ? 'hidden' : ''
      rowPickRef.current!.style.opacity = String(keep)
      pickChips.forEach((el, i) => {
        const k = outQuint(prog(t, T.filter.in + i * T.filter.step, T.filter.in + i * T.filter.step + 0.6))
        el.style.opacity = String(k)
        el.style.transform = `translateX(${90 * (1 - k)}px)`
      })

      // Letter P: selected on the tap
      const letterOn = outCubic(prog(t, T.tapLetter, T.tapLetter + 0.18)) * keep
      letterOnRef.current!.style.opacity = String(letterOn)
      letterLabel.style.color = mix(0x14, 0x1b, 0x56, letterOn) // #141b56 → white, with the fill

      // ── After the Pilates tap: everything at once ──
      // Sports Section: Fitness lights up
      const sec = outCubic(prog(t, T.section, T.section + 0.3)) * keep
      sectionOnRef.current!.style.opacity = String(sec)
      secLabel.style.color = mix(0x1d, 0x23, 0x51, sec) // #1d2351 → white, with the fill

      // Panel: blur clears while the content dips, then drops in, row by row
      blurRef.current!.style.opacity = String(1 - inOut(prog(t, T.blur[0], T.blur[1])) * keep)
      const dip = prog(t, T.dip[0], T.dip[1])
      items.forEach((el, i) => {
        const st = T.cascade.start + i * T.cascade.step
        const k = outCubic(prog(t, st, st + T.cascade.dur))
        if (keep < 1 || t < T.dip[0]) {
          el.style.opacity = ''
          el.style.transform = ''
          return
        }
        el.style.opacity = String(t < T.cascade.start ? 1 - dip : k)
        el.style.transform = t < T.cascade.start ? '' : `translateY(${-18 * (1 - k)}px)`
      })
      const pick = outCubic(prog(t, T.pick, T.pick + 0.3)) * keep
      pickRowRef.current!.style.backgroundColor = `rgb(${lerp(51, 30, pick)}, ${lerp(67, 37, pick)}, ${lerp(193, 103, pick)})`
      // The ← arrow: fades in, then hovers gently left and right
      const ai = outCubic(prog(t, T.arrow, T.arrow + 0.4)) * keep
      const hover = t > T.arrow ? Math.sin(((t - T.arrow) / 1.6) * Math.PI * 2) : 0
      arrowRef.current!.style.opacity = String(ai)
      arrowRef.current!.style.transform = `translateX(${-9 * hover - 12 * (1 - ai)}px)`

      // Ad, last: the welcome lifts away, the mat rises in and its title follows
      const adOut = outCubic(prog(t, T.ad, T.ad + 0.45)) * keep
      const matIn = outCubic(prog(t, T.ad + 0.15, T.ad + 1.15)) * keep
      const titleIn = outCubic(prog(t, T.ad + 0.35, T.ad + 1.1)) * keep
      welcomeRef.current!.style.opacity = String(1 - adOut)
      welcomeRef.current!.style.transform = `translateY(${-40 * adOut}px)`
      matRef.current!.style.opacity = String(matIn)
      matRef.current!.style.transform = `translateY(${220 * (1 - matIn)}px)`
      matTitleRef.current!.style.opacity = String(titleIn)
      matTitleRef.current!.style.transform = `translateY(${50 * (1 - titleIn)}px)`

      // Map: the route runs on from its solid start; the dot and the blue area arrive together
      const draw = outCubic(prog(t, T.route[0], T.route[1])) // rolls out along the route, easing out
      line.setAttribute('stroke-dashoffset', String(lineLength * (1 - draw)))
      line.style.opacity = String(keep)
      const d = outCubic(prog(t, T.end, T.end + 0.5))
      dot.style.opacity = String(d * keep)
      dot.setAttribute('transform', `translate(11.454 90.19) scale(${0.4 + 0.6 * d}) translate(-11.454 -90.19)`)
      fitnessOnRef.current!.style.opacity = String(outCubic(prog(t, T.end, T.end + 0.5)) * keep)

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
        line.remove()
      }
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
      if (visible) frame(T.start + (elapsed % (LOOP - T.start)))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      line.remove()
    }
  }, [L])

  let cascadeIndex = 0
  const cascade = () => ({ 'data-cascade': cascadeIndex++ })

  return (
    <div
      ref={hostRef}
      className="dk-host"
      role="img"
      aria-label="Animation: Decathlon's in-store kiosk. Filtering sports by P and picking Pilates highlights the Fitness section, lists its sports, draws the route to it on the store map and shows a Pilates mat ad."
    >
      <ScaledFrame width={L.W} height={L.H} className="dk">
        <div className="dk__camera" ref={cameraRef}>
          <div className="dk__screen" style={{ left: L.OX, top: L.OY, transform: `scale(${L.K})` }}>
            <div className="dk__main">
              <div className="dk__top">
                {/* Category panel */}
                <div className="dk__panel">
                  <div className="dk__panel-inner" ref={panelItemsRef}>
                    <img className="dk__icon" src={sportIcon} alt="" {...cascade()} />
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
                  <img src="/images/decathlon/welcome.png" alt="" />
                </div>
                <p className="dk__prompt">Select section or search by sport</p>
              </div>
              <img className="dk__mat" src="/images/decathlon/mat.png" alt="" ref={matRef} style={{ opacity: 0 }} />
              <div className="dk__mat-title" ref={matTitleRef} style={{ opacity: 0 }}>
                <img src="/images/decathlon/mat-title.png" alt="" />
              </div>
            </div>
          </div>

        </div>
      </ScaledFrame>
    </div>
  )
}
