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

  // While scrolling, pause hover effects (e.g. card image zoom) so cards passing under the
  // cursor don't trigger expensive re-renders of large images mid-scroll.
  useEffect(() => {
    const root = document.documentElement
    let timer = 0
    const onScroll = () => {
      if (!timer) root.classList.add('is-scrolling')
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        root.classList.remove('is-scrolling')
        timer = 0
      }, 150)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.clearTimeout(timer)
      root.classList.remove('is-scrolling')
    }
  }, [])

  useEffect(() => {
    if (lenis) lenis.scrollTo(0, { immediate: true })
    else window.scrollTo(0, 0)
  }, [pathname])

  return <>{children}</>
}
