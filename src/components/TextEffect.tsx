import { useLayoutEffect, useMemo, useRef, useState, type ElementType, type ReactNode } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useQueuedReveal } from '../lib/revealQueue'
import { isWebKit } from '../lib/browser'
import { bindShortWords } from '../lib/typography'

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
  /** Elements to drop into the text in place of a token word, e.g. { '[video]': <Thumb /> }. */
  inserts?: Record<string, ReactNode>
}

// Framer's "Effect" enter: fade + blur + slight rise, on a soft ease-out.
const hidden = { opacity: 0, filter: 'blur(10px)', y: 16 }
const shown = { opacity: 1, filter: 'blur(0px)', y: 0 }
// WebKit rasterises an animated blur on the CPU for every word, every frame; text revealed while
// scrolling there fades and rises only.
const hiddenPlain = { opacity: 0, y: 16 }
const shownPlain = { opacity: 1, y: 0 }
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
  inserts,
}: Props) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const [lineOf, setLineOf] = useState<number[] | null>(null)
  const step = stagger ?? (per === 'line' ? 0.12 : 0.06)

  // Short function words stay with the next word (they become one animated unit, too).
  const lines = bindShortWords(text).split('\n')
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

  // In-view text waits for its turn in the shared reveal queue (top-to-bottom cascade).
  const queued = useQueuedReveal(ref, trigger === 'inView' && !reduce)
  const start = delay + (queued ?? 0)

  const MotionTag = useMemo(() => motion.create(Tag), [Tag])
  const plain = isWebKit && trigger === 'inView'
  // Per-line needs one layout pass to know the lines before it can start.
  const ready = (per === 'word' || lineOf !== null) && (trigger === 'appear' || queued !== null)

  return (
    <MotionTag
      ref={ref}
      className={className}
      aria-label={words.filter(({ w }) => !inserts?.[w]).map(({ w }) => w).join(' ')}
      initial={reduce ? false : 'hidden'}
      animate={ready ? 'shown' : 'hidden'}
    >
      {words.map(({ w, br }, i) => {
        const order = per === 'line' ? (lineOf?.[i] ?? 0) : i
        const insert = inserts?.[w]
        return (
          <span key={i} className={insert ? 'te-insert' : undefined} aria-hidden={insert ? undefined : true}>
            <motion.span
              data-word
              data-text={insert ? undefined : w.toLowerCase()} // lets CSS fine-tune individual words (e.g. kerning)
              style={{ display: 'inline-block' }}
              variants={{
                hidden: plain ? hiddenPlain : hidden,
                shown: {
                  ...(plain ? shownPlain : shown),
                  transition: { duration: 0.9, ease, delay: start + order * step },
                  // A finished word must not keep `filter: blur(0px)`: any filter keeps it in its
                  // own filtered layer (an offscreen pass per word in WebKit). Clear it at the end.
                  ...(plain ? {} : { transitionEnd: { filter: 'none' } }),
                },
              }}
            >
              {insert ?? w}
            </motion.span>
            {br ? <br /> : ' '}
          </span>
        )
      })}
    </MotionTag>
  )
}
