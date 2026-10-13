import { useLayoutEffect, useMemo, useRef, useState, type ElementType } from 'react'
import { motion, useReducedMotion } from 'motion/react'

type Props = {
  /** Text to animate. Use "\n" to force a line break. */
  text: string
  as?: ElementType
  className?: string
  /** Split granularity, like Framer's "Per" option. */
  per?: 'word' | 'line'
  /** "appear" animates on mount, "inView" when the layer scrolls into view (Framer's "Layer in view"). */
  trigger?: 'appear' | 'inView'
  /** Seconds before the first word/line starts. */
  delay?: number
  /** Seconds between consecutive words/lines. */
  stagger?: number
}

// Framer's "Effect" enter: fade + blur + slight rise, on a soft ease-out.
const hidden = { opacity: 0, filter: 'blur(10px)', y: 16 }
const shown = { opacity: 1, filter: 'blur(0px)', y: 0 }
const ease = [0.22, 1, 0.36, 1] as const

/**
 * Framer-style "Text effect": splits text per word or per visual line and
 * reveals each piece with a staggered blur-in. Per-line mode measures where
 * the browser actually wrapped the text, so it stays correct at any width.
 */
export function TextEffect({
  text,
  as: Tag = 'p',
  className,
  per = 'word',
  trigger = 'appear',
  delay = 0,
  stagger,
}: Props) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const [lineOf, setLineOf] = useState<number[] | null>(null)
  const step = stagger ?? (per === 'line' ? 0.12 : 0.06)

  const lines = text.split('\n')
  const words = lines.flatMap((line, li) =>
    line.split(' ').filter(Boolean).map((w, wi, arr) => ({ w, br: wi === arr.length - 1 && li < lines.length - 1 })),
  )

  // Group words into rendered lines by their vertical offset.
  useLayoutEffect(() => {
    if (per !== 'line' || !ref.current) return
    const measure = () => {
      const spans = ref.current!.querySelectorAll<HTMLElement>('[data-word]')
      const tops: number[] = []
      const result = Array.from(spans).map((s) => {
        const top = s.offsetTop
        let idx = tops.findIndex((t) => Math.abs(t - top) < 4)
        if (idx === -1) idx = tops.push(top) - 1
        return idx
      })
      setLineOf(result)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [per, text])

  const MotionTag = useMemo(() => motion.create(Tag), [Tag])
  // Per-line needs one layout pass to know the lines before it can start.
  const ready = per === 'word' || lineOf !== null
  const target = ready ? 'shown' : 'hidden'

  return (
    <MotionTag
      ref={ref}
      className={className}
      aria-label={text.replace(/\n/g, ' ')}
      initial={reduce ? false : 'hidden'}
      {...(trigger === 'appear'
        ? { animate: target }
        : { whileInView: target, viewport: { once: true, amount: 0 } })}
    >
      {words.map(({ w, br }, i) => {
        const order = per === 'line' ? (lineOf?.[i] ?? 0) : i
        return (
          <span key={i} aria-hidden>
            <motion.span
              data-word
              style={{ display: 'inline-block', willChange: 'transform, filter, opacity' }}
              variants={{
                hidden,
                shown: { ...shown, transition: { duration: 0.9, ease, delay: delay + order * step } },
              }}
            >
              {w}
            </motion.span>
            {br ? <br /> : ' '}
          </span>
        )
      })}
    </MotionTag>
  )
}
