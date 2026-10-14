/*
 * Sparky's motion as pure functions of time — a port of AnimatedPillKit
 * (SentenceCycler, SpinningIcon, TypewriterText, AnimatedGradient). All times in ms.
 */

const MEASURE = 50 // layout settle before the reveal starts
const REVEAL = 706 // linear reveal
const EASE_AT = 506 // icon starts easing fast → normal (300 ms before reveal ends)
const EASE = 666 // icon ease-out duration
const PAUSE_END = 3806 // 50 + 456 + 300 + 3000: fade-out starts
const FADE = 350 // ease-in fade-out
export const CYCLE = 4256 // fade + 450 ms → next sentence

const FAST = -648 // deg/s, counter-clockwise
const NORMAL = -60
const FAST_CW = 648

const easeIn = (x: number) => x * x * x // SwiftUI .easeIn ≈ cubic-bezier(0.42, 0, 1, 1)
const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

export type SparkyFrame = {
  /** 0 → 1 reveal progress */
  p: number
  /** text opacity (fade-out) */
  opacity: number
  /** text blur in px (fade-out) */
  blur: number
  /** icon rotation in degrees */
  angle: number
}

/** Icon rotation accumulated over one cycle up to `t` (ms), integrating the app's speed changes. */
function iconAngle(t: number, freeze: boolean): number {
  const seg = (from: number, to: number, dps: number) => (Math.max(0, Math.min(t, to) - from) / 1000) * dps
  let a = seg(0, EASE_AT, FAST)
  // Ease-out fast → normal: v(u) = FAST + (NORMAL - FAST) · (1 − (1 − u)²)
  const u = clamp01((t - EASE_AT) / EASE)
  if (t > EASE_AT) {
    const integral = u + Math.pow(1 - u, 3) / 3 - 1 / 3 // ∫₀ᵘ (1 − (1 − s)²) ds
    a += (EASE / 1000) * (FAST * u + (NORMAL - FAST) * integral)
  }
  if (freeze) return a + seg(EASE_AT + EASE, Infinity, NORMAL)
  a += seg(EASE_AT + EASE, PAUSE_END, NORMAL)
  a += seg(PAUSE_END, CYCLE, FAST_CW)
  return a
}

const FULL_CYCLE_ANGLE = iconAngle(CYCLE, false)

/**
 * Sparky's state `t` ms after the pill appeared.
 * `freeze`: stop after the first reveal (search with exactly one match).
 * Returns the frame plus which sentence (cycle index) is showing.
 */
export function sparkyAt(t: number, freeze: boolean): SparkyFrame & { index: number } {
  if (freeze) {
    const p = clamp01((t - MEASURE) / REVEAL)
    return { p, opacity: 1, blur: 0, angle: iconAngle(t, true), index: 0 }
  }
  const index = Math.floor(t / CYCLE)
  const local = t - index * CYCLE
  let p = clamp01((local - MEASURE) / REVEAL)
  let opacity = 1
  let blur = 0
  if (local >= PAUSE_END) {
    const k = easeIn(clamp01((local - PAUSE_END) / FADE))
    p = 1 - k
    opacity = 1 - k
    blur = 8 * k
  }
  return { p, opacity, blur, angle: index * FULL_CYCLE_ANGLE + iconAngle(local, false), index }
}

/** The gradient fill: rotates 360° / 25 s, slides 0 ↔ −80 px every 5 s. `t` in ms of global time. */
export function gradientAt(t: number) {
  const s = t / 1000
  const tri = (s % 10) / 5
  return { angle: ((s / 25) * 360) % 360, offset: -80 * (tri < 1 ? tri : 2 - tri) }
}

/** Reveal edge effects from TypewriterText, given reveal progress `p`. */
export function edgeAt(p: number) {
  return {
    zone: 60 * (1 - Math.pow(p, 4)), // frosted leading-edge width (pt)
    edgeBlur: 40 * (1 - Math.pow(p, 3)),
    edgeOpacity: 0.3 * (1 - Math.pow(p, 2)),
  }
}
