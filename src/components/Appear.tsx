import { useMemo, useRef, type ElementType, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useQueuedReveal } from '../lib/revealQueue'
import { isWebKit } from '../lib/browser'

const ease = [0.22, 1, 0.36, 1] as const

type Props = {
  as?: ElementType
  className?: string
  children?: ReactNode
  /** Rise distance in px. */
  y?: number
  /** Blur-in. Keep off for large images — animating blur on big bitmaps is expensive. */
  blur?: boolean
  duration?: number
  /** Extra delay on top of the reveal queue (seconds). */
  delay?: number
}

/** Fades/rises its content in when scrolled into view, in sequence with everything else revealing. */
export function Appear({ as: Tag = 'div', className, children, y = 16, blur = false, duration = 0.9, delay = 0 }: Props) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const queued = useQueuedReveal(ref, !reduce)
  const MotionTag = useMemo(() => motion.create(Tag), [Tag])
  // Animated blur is CPU-rasterised in WebKit; these reveals run while scrolling, so skip it there.
  const useBlur = blur && !isWebKit

  return (
    <MotionTag
      ref={ref}
      className={className}
      initial={reduce ? false : { opacity: 0, y, ...(useBlur && { filter: 'blur(10px)' }) }}
      animate={
        queued === null
          ? undefined
          : {
              opacity: 1,
              y: 0,
              ...(useBlur && { filter: 'blur(0px)' }),
              transition: { duration, ease, delay: delay + queued },
              // Don't leave a finished element on `filter: blur(0px)` (keeps a filter layer alive).
              ...(useBlur && { transitionEnd: { filter: 'none' } }),
            }
      }
    >
      {children}
    </MotionTag>
  )
}
