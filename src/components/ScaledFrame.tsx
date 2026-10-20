import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

/** `zoom` is supported in Safari, Chrome, Edge and Firefox 126+; older Firefox falls back to a transform. */
const canZoom = typeof CSS !== 'undefined' && CSS.supports('zoom', '0.5')

/**
 * Renders children at a fixed design size (e.g. a 3840 × 2160 Figma frame) and
 * scales them to the available width, so every px value stays 1:1 with the design.
 *
 * Scaling uses `zoom`, not `transform: scale()`. With a transform, the browser lays the frame out
 * at full design size and composited layers inside it (glass panels, the animated clip camera)
 * get backing stores near 3840 × 2160 × devicePixelRatio² — hundreds of MB, which pushes WebKit
 * into tiling and CPU rasterisation. `zoom` scales layout itself, so layers are painted at the
 * size they're shown.
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

  const inner: CSSProperties = { position: 'absolute', top: 0, left: 0, width, height }
  if (canZoom) inner.zoom = scale
  else Object.assign(inner, { transform: `scale(${scale})`, transformOrigin: 'top left' })

  return (
    <div
      ref={ref}
      // contain: the frame's layout and paint never leak into (or get invalidated by) the page.
      style={{ position: 'relative', width: '100%', aspectRatio: `${width} / ${height}`, overflow: 'hidden', contain: 'layout paint' }}
    >
      <div className={className} style={inner}>
        {children}
      </div>
    </div>
  )
}
