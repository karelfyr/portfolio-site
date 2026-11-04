import { useLayoutEffect, useRef, useState } from 'react'
import sizes from 'virtual:image-sizes'
import placeholders from '../data/image-placeholders.json'

const LQIP = placeholders as Record<string, string>

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
 * While it loads, a tiny copy of it shows heavily blurred, gently pulsing (see
 * scripts/image-placeholders.mjs); the image fades in over it, then the blur is removed.
 * An image the browser already has shows straight away, with no blur at all.
 */
export function Img({ src, alt, priority = false, eager = false }: Props) {
  const ref = useRef<HTMLImageElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [blurGone, setBlurGone] = useState(false)
  useLayoutEffect(() => {
    // already in the browser's cache: skip the loading state entirely
    if (ref.current?.complete && ref.current.naturalWidth) {
      setLoaded(true)
      setBlurGone(true)
    }
  }, [src])
  if (!src) return <div className="img-placeholder" role="img" aria-label={alt} />
  const size = sizes[src]
  const lqip = LQIP[src]
  return (
    <span className={`img${loaded ? ' img--loaded' : ''}`}>
      {lqip && !blurGone && <span className="img__lqip" style={{ backgroundImage: `url(${lqip})` }} aria-hidden="true" />}
      <img
        ref={ref}
        src={src}
        alt={alt}
        width={size?.[0]}
        height={size?.[1]}
        decoding="async"
        loading={priority || eager ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={() => setLoaded(true)}
        onError={() => setBlurGone(true)}
        onTransitionEnd={(e) => e.propertyName === 'opacity' && loaded && setBlurGone(true)}
      />
    </span>
  )
}
