import type { ReactNode } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { isWebKit, supportsScrollTimeline } from '../lib/browser'

// Same values as the Framer override (WithBlurOnScroll.tsx)
const maxBlur = 15 // px
const blurSpeed = 0.25 // fraction of page scroll to reach max effect
const minScale = 0.6

/**
 * The hero recedes as the page scrolls — port of `withBlurAndScaleOnScroll`.
 *
 * - Blink: blur + scale, driven by Motion from the scroll position (works with Lenis).
 * - WebKit with scroll-driven animations (Safari 26+): a CSS scroll timeline (.scroll-recede in
 *   index.css) runs scale + fade with no JavaScript in the scroll path at all.
 * - Older WebKit: Motion, but scale + fade only. Safari can't animate `filter: blur()` on the
 *   compositor, so a blur would re-rasterise the whole hero on every scroll tick.
 */
export function BlurOnScroll({ children, className }: { children: ReactNode; className?: string }) {
  if (isWebKit && supportsScrollTimeline) {
    return <div className={`${className ?? ''} scroll-recede`}>{children}</div>
  }
  return <MotionRecede className={className}>{children}</MotionRecede>
}

function MotionRecede({ children, className }: { children: ReactNode; className?: string }) {
  const { scrollYProgress } = useScroll()
  const filter = useTransform(scrollYProgress, [0, blurSpeed], ['blur(0px)', `blur(${maxBlur}px)`])
  const opacity = useTransform(scrollYProgress, [0, blurSpeed], [1, 0.25])
  const scale = useTransform(scrollYProgress, [0, blurSpeed], [1, minScale])

  return (
    <motion.div
      className={className}
      style={isWebKit ? { opacity, scale, willChange: 'transform, opacity' } : { filter, scale, willChange: 'transform, filter' }}
    >
      {children}
    </motion.div>
  )
}
