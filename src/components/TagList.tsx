import { useLayoutEffect, useRef, useState } from 'react'

const NBSP = ' '

/**
 * "Branding · Website Design & Dev · Design System" as a list of tags:
 * - a tag never breaks inside (its words are joined with no-break spaces);
 * - lines only break between tags;
 * - a separator only shows between tags on the same line – where the line wraps, the break itself
 *   separates, so no line starts or ends with a "·".
 * Where the browser wraps can't be known in CSS, so the tags are measured after layout (and on
 * every width change). A separator at a wrap is hidden with `visibility`, not removed, so the
 * layout doesn't shift and the measurement stays stable.
 */
export function TagList({ value, separator = ' · ' }: { value: string; separator?: string }) {
  const tags = value.split(separator).map((t) => t.trim().split(' ').join(NBSP))
  const ref = useRef<HTMLSpanElement>(null)
  /** wraps[i]: the tag after separator i starts a new line. */
  const [wraps, setWraps] = useState<boolean[]>([])

  useLayoutEffect(() => {
    const el = ref.current
    const box = el?.parentElement // an inline span has no box of its own to observe
    if (!el || !box) return
    const measure = () => {
      const items = [...el.querySelectorAll<HTMLElement>('[data-tag]')]
      const next = items.slice(1).map((it, i) => it.offsetTop > items[i].offsetTop + 2)
      setWraps((prev) => (prev.length === next.length && prev.every((v, i) => v === next[i]) ? prev : next))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(box)
    return () => ro.disconnect()
  }, [value])

  return (
    <span ref={ref} className="tags">
      {tags.map((tag, i) => (
        <span key={i}>
          <span data-tag>{tag}</span>
          {i < tags.length - 1 && (
            // "·" sticks to the tag before it; the line may only break after it.
            <span className="tags__sep" style={wraps[i] ? { visibility: 'hidden' } : undefined}>
              {`${NBSP}·`}
            </span>
          )}
          {i < tags.length - 1 && ' '}
        </span>
      ))}
    </span>
  )
}
