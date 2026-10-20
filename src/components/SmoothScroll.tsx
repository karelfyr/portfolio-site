import { useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { wantsSmoothScroll } from '../lib/browser'

let lenis: Lenis | null = null

/** Freeze page scrolling (e.g. while a popup is open), and release it again. */
export function setScrollLocked(locked: boolean) {
  document.documentElement.classList.toggle('is-locked', locked)
  if (locked) lenis?.stop()
  else lenis?.start()
}

/**
 * Weighted, inertial scrolling (the "Framer feel") where it's an enhancement — Blink with a
 * mouse or trackpad — and the platform's own scrolling everywhere else (see wantsSmoothScroll).
 * Safari keeps Apple's native, gesture-coupled physics and 120 Hz compositor scrolling; the
 * premium feel there comes from scroll-driven CSS and reveal animations, not from intercepting
 * the scroll. Also scrolls to the top on route change.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const pointer = window.matchMedia('(pointer: fine)')

    const start = () => {
      if (lenis || !wantsSmoothScroll()) return
      lenis = new Lenis({
        autoRaf: true, // Lenis's own rAF loop, aligned to the display's refresh rate
        lerp: 0.22, // the glide: ~22% of the remaining distance per frame — light, with a soft finish
        smoothWheel: true, // only wheel / trackpad input is smoothed…
        syncTouch: false, // …touch keeps native momentum and rubber-banding
        wheelMultiplier: 1, // never amplify the user's own input
        gestureOrientation: 'vertical', // horizontal swipes pass through (logo strip, back-swipe)
        overscroll: true, // let the native overscroll / bounce happen at the ends
        anchors: true, // in-page #links glide too
        allowNestedScroll: true, // inner scrollable areas keep their own native scrolling
      })
      document.documentElement.classList.add('has-smooth-scroll')
    }
    const stop = () => {
      lenis?.destroy()
      lenis = null
      document.documentElement.classList.remove('has-smooth-scroll')
    }
    // Re-decide when the user flips reduced motion or switches between mouse and touch.
    const update = () => (wantsSmoothScroll() ? start() : stop())

    start()
    reduced.addEventListener('change', update)
    pointer.addEventListener('change', update)
    return () => {
      reduced.removeEventListener('change', update)
      pointer.removeEventListener('change', update)
      stop()
    }
  }, [])

  useEffect(() => {
    if (lenis) lenis.scrollTo(0, { immediate: true })
    else window.scrollTo(0, 0)
  }, [pathname])

  return <>{children}</>
}
