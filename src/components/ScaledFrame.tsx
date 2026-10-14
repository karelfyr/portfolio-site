import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Renders children at a fixed design size (e.g. a 3840 × 2160 Figma frame) and
 * scales them to the available width, so every px value stays 1:1 with the design.
 */
export function ScaledFrame({
  width,
  height,
  className,
  children,
}: {
  width: number
  height: number
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    // Measure right away so the first paint is already scaled, then track resizes.
    setScale(el.clientWidth / width)
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [width])

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', aspectRatio: `${width} / ${height}`, overflow: 'hidden' }}>
      <div
        className={className}
        style={{ position: 'absolute', top: 0, left: 0, width, height, transform: `scale(${scale})`, transformOrigin: 'top left' }}
      >
        {children}
      </div>
    </div>
  )
}
