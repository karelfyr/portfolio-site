import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import sizes from 'virtual:image-sizes'
import placeholders from '../data/image-placeholders.json'

const LQIP = placeholders as Record<string, string>

/** How long an image may take, once it's on screen, before it gets the blurred loading state. */
const PATIENCE_MS = 250

type Props = {
  src?: string
  alt: string
  /** Above-the-fold image: load immediately at high priority. */
  priority?: boolean
  /** Load immediately (normal priority) so it's decoded before it scrolls into view. */
  eager?: boolean
}

/**
 * Image that falls back to a neutral placeholder until a real file is provided.
 * Width/height come from the file itself, so the browser reserves the right space
 * before it loads (no layout jumps). Decoding happens off the main thread.
 *
 * Loading state only when the connection is slow: an image that arrives within PATIENCE_MS of
 * being on screen simply shows, as it always did. One that doesn't gets a tiny copy of itself,
 * heavily blurred and breathing (scripts/image-placeholders.mjs), and then resolves into focus
 * over it once decoded (index.css, "Image loading").
 */
export function Img({ src, alt, priority = false, eager = false }: Props) {
  const wrap = useRef<HTMLSpanElement>(null)
  const ref = useRef<HTMLImageElement>(null)
  // waiting: no loading state (yet) · slow: blurred placeholder · resolving: image comes into focus
  const [state, setState] = useState<'waiting' | 'slow' | 'resolving' | 'done'>('waiting')
  const loaded = useRef(false)
  const lqip = src ? LQIP[src] : undefined

  useLayoutEffect(() => {
    // already in the browser's cache
    if (ref.current?.complete && ref.current.naturalWidth) {
      loaded.current = true
      setState('done')
    }
  }, [src])

  useEffect(() => {
    const el = wrap.current
    if (!el || !lqip) return
    let timer = 0
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      timer = window.setTimeout(() => !loaded.current && setState((s) => (s === 'waiting' ? 'slow' : s)), PATIENCE_MS)
    })
    io.observe(el)
    return () => {
      io.disconnect()
      clearTimeout(timer)
    }
  }, [lqip])

  if (!src) return <div className="img-placeholder" role="img" aria-label={alt} />
  const size = sizes[src]
  const onLoad = () => {
    loaded.current = true
    const img = ref.current
    // resolve on a decoded bitmap, so the transition never stutters
    const ready = img?.decode ? img.decode().catch(() => {}) : Promise.resolve()
    ready.then(() => setState((s) => (s === 'slow' ? 'resolving' : 'done')))
  }
  return (
    <span ref={wrap} className={`img img--${state}`}>
      {lqip && (state === 'slow' || state === 'resolving') && (
        <span className="img__lqip" style={{ backgroundImage: `url(${lqip})` }} aria-hidden="true" />
      )}
      <img
        ref={ref}
        src={src}
        alt={alt}
        width={size?.[0]}
        height={size?.[1]}
        decoding="async"
        loading={priority || eager ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={onLoad}
        onError={() => setState('done')}
        onAnimationEnd={(e) => /^img-resolve-(focus|settle)$/.test(e.animationName) && setState('done')}
      />
    </span>
  )
}
