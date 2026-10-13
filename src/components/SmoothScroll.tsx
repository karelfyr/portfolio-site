import { useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

let lenis: Lenis | null = null

/** Inertia-based smooth scrolling (the "Framer feel"), plus scroll-to-top on route change. */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1 })
    let frame = requestAnimationFrame(function raf(time) {
      lenis?.raf(time)
      frame = requestAnimationFrame(raf)
    })
    return () => {
      cancelAnimationFrame(frame)
      lenis?.destroy()
      lenis = null
    }
  }, [])

  useEffect(() => {
    if (lenis) lenis.scrollTo(0, { immediate: true })
    else window.scrollTo(0, 0)
  }, [pathname])

  return <>{children}</>
}
