import { useEffect } from 'react'

/** Port of `withMobileSafeDVH`: keeps `--vh` in sync with the real inner height (mobile browser bars). */
export function useMobileSafeVh() {
  useEffect(() => {
    const setVh = () => document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`)
    setVh()
    window.addEventListener('resize', setVh)
    return () => window.removeEventListener('resize', setVh)
  }, [])
}
