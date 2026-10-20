import { useEffect } from 'react'

/**
 * Port of `withMobileSafeDVH`: keeps `--vh` in sync with the real inner height (mobile browser bars).
 * Only updates when the width changes (rotation, window resize). iOS Safari fires `resize` every
 * time its toolbar collapses or expands during a scroll; rewriting `--vh` then re-lays-out the
 * full-height hero in the middle of the scroll gesture.
 */
export function useMobileSafeVh() {
  useEffect(() => {
    let width = 0
    const setVh = () => {
      if (window.innerWidth === width) return
      width = window.innerWidth
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
    }
    setVh()
    window.addEventListener('resize', setVh)
    return () => window.removeEventListener('resize', setVh)
  }, [])
}
