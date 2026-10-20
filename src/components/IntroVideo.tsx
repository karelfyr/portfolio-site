import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import { setScrollLocked } from './SmoothScroll'
import { VideoPlayer } from './VideoPlayer'

const VIDEO_ID = '6g4ReR1X4Zw'
const POSTER = `https://i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg`
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

export function IntroVideo({ variant = 'inline' }: Props) {
  const layoutId = `intro-video-${variant}`
  const [open, setOpen] = useState(false)

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
      <button className={`intro-thumb intro-thumb--${variant}`} onClick={() => setOpen(true)} aria-label="Play intro video">
        <motion.span className="intro-thumb__media" layoutId={layoutId} transition={{ duration: ENTER, ease }}>
          <img src={POSTER} alt="" draggable={false} />
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
                <VideoPlayer videoId={VIDEO_ID} poster={POSTER} layoutId={layoutId} enter={ENTER} />
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
