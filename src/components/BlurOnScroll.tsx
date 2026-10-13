import type { ReactNode } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'

// Same values as the Framer override (WithBlurOnScroll.tsx)
const maxBlur = 15 // px
const blurSpeed = 0.25 // fraction of page scroll to reach max effect
const minScale = 0.6

/** Blurs and shrinks its content as the page scrolls — port of `withBlurAndScaleOnScroll`. */
export function BlurOnScroll({ children, className }: { children: ReactNode; className?: string }) {
  const { scrollYProgress } = useScroll()
  const filter = useTransform(scrollYProgress, [0, blurSpeed], ['blur(0px)', `blur(${maxBlur}px)`])
  const scale = useTransform(scrollYProgress, [0, blurSpeed], [1, minScale])

  return (
    <motion.div className={className} style={{ filter, scale }}>
      {children}
    </motion.div>
  )
}
