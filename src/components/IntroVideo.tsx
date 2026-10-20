import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { setScrollLocked } from './SmoothScroll'
import { VideoPlayer } from './VideoPlayer'
import { muxStill } from '../lib/mux'
import { isWebKit } from '../lib/browser'

/** Mux playback ID of the reel. */
const PLAYBACK_ID = 'y02NQcA5R02yJj4LCkQC4HEZTzeuugMvIwB3jjGpjPNTQ'
/** Second of the video used as the still (title thumbnail and popup poster). */
const STILL_AT = 0
/** One still for the title thumbnail and the popup poster: it's already loaded and decoded when
 * the popup opens, so nothing is fetched or decoded while the screen grows. */
const STILL = muxStill(PLAYBACK_ID, { time: STILL_AT, width: 1280 })
const ease = [0.22, 1, 0.36, 1] as const
/** Seconds for the still to grow from the title into the player — unhurried on purpose. */
const ENTER = 1.1

/**
 * Small video still that sits inside the hero title. Clicking it dims the page and
 * plays the intro video in a popup; the still grows into the player (shared layout).
 * Closes on the ✕ button, a click outside the video, or Esc.
 */
type Props = {
  /** "inline" sits inside the title text; "block" is a larger standalone still (phones). */
  variant?: 'inline' | 'block'
}

/** Fetches the streaming library ahead of time (idle after load, or on hover), so opening the
 * popup doesn't download and parse it during the grow animation. Safari streams natively. */
const warmUp = () => {
  if (!isWebKit) import('hls.js')
}

export function IntroVideo({ variant = 'inline' }: Props) {
  const layoutId = `intro-video-${variant}`
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 2000))
    idle(warmUp)
  }, [])

  useEffect(() => {
    if (!open) return
    setScrollLocked(true)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      setScrollLocked(false)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <button className={`intro-thumb intro-thumb--${variant}`} onClick={() => setOpen(true)} onPointerEnter={warmUp} aria-label="Play intro video">
        <motion.span className="intro-thumb__media" layoutId={layoutId} transition={{ duration: ENTER, ease }}>
          <img src={STILL} alt="" draggable={false} decoding="sync" />
          <span className="intro-thumb__play" aria-hidden />
        </motion.span>
        <span className="intro-thumb__caption">Watch the reel</span>
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              className="video-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Intro video"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease }}
            >
              <div className="video-modal__frame" onClick={(e) => e.stopPropagation()}>
                <VideoPlayer playbackId={PLAYBACK_ID} poster={STILL} layoutId={layoutId} enter={ENTER} />
              </div>
              <button className="video-modal__close label" onClick={() => setOpen(false)} autoFocus>
                Close ✕
              </button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}
