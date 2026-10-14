import { useEffect, useState, type RefObject } from 'react'

/**
 * Shared reveal queue. Elements that scroll into view at the same moment are
 * ordered top-to-bottom (then left-to-right) and each starts a beat after the
 * previous one, so a screen full of content cascades in instead of popping in
 * all at once. An element revealed on its own starts immediately.
 */

const STEP_MS = 90 // gap between consecutive reveals
const MAX_WAIT_MS = 900 // never make anything wait longer than this

type Entry = { el: Element; start: (delaySeconds: number) => void }

let pending: Entry[] = []
let frame = 0
let nextFree = 0

function flush() {
  frame = 0
  const now = performance.now()
  const batch = pending
  pending = []
  const pos = new Map(batch.map((e) => [e, e.el.getBoundingClientRect()]))
  batch.sort((a, b) => {
    const ra = pos.get(a)!
    const rb = pos.get(b)!
    return Math.abs(ra.top - rb.top) > 8 ? ra.top - rb.top : ra.left - rb.left
  })
  let t = Math.max(now, Math.min(nextFree, now + MAX_WAIT_MS))
  for (const entry of batch) {
    entry.start((t - now) / 1000)
    t += STEP_MS
  }
  nextFree = t
}

function enqueue(entry: Entry) {
  pending.push(entry)
  if (!frame) frame = requestAnimationFrame(flush)
}

/**
 * Returns `null` until the element enters the viewport, then the delay (in seconds)
 * its reveal should wait so it plays in sequence with everything else revealing now.
 */
export function useQueuedReveal(ref: RefObject<Element | null>, enabled = true) {
  const [delay, setDelay] = useState<number | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return
    let cancelled = false
    const io = new IntersectionObserver(
      ([entry]) => {
        const passed = !entry.isIntersecting && entry.boundingClientRect.top < 0
        if (!entry.isIntersecting && !passed) return // still below the viewport
        io.disconnect()
        // Already scrolled past (fast scroll, reload mid-page): show right away so it's never stuck hidden.
        if (passed) setDelay(0)
        else enqueue({ el, start: (d) => !cancelled && setDelay(d) })
      },
      { rootMargin: '0px 0px -8% 0px' },
    )
    io.observe(el)
    return () => {
      cancelled = true
      io.disconnect()
    }
  }, [ref, enabled])

  return delay
}
