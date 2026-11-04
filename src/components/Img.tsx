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
 * While it loads, a tiny copy of it fades in heavily blurred and breathes gently (see
 * scripts/image-placeholders.mjs); the image then lands on top equally blurred and racks into
 * focus (index.css, "Image loading"). An image the browser already has shows straight away.
 */
export function Img({ src, alt, priority = false, eager = false }: Props) {
  const ref = useRef<HTMLImageElement>(null)
  // loading: blurred placeholder breathing · resolving: the image racks into focus over it · done
  const [state, setState] = useState<'loading' | 'resolving' | 'done'>('loading')
  useLayoutEffect(() => {
    // already in the browser's cache: skip the loading state entirely
    if (ref.current?.complete && ref.current.naturalWidth) setState('done')
  }, [src])
  if (!src) return <div className="img-placeholder" role="img" aria-label={alt} />
  const size = sizes[src]
  const lqip = LQIP[src]
  const resolve = () => {
    const img = ref.current
    // wait until it's decoded, so the focus pull runs on a ready bitmap and never stutters
    const ready = img?.decode ? img.decode().catch(() => {}) : Promise.resolve()
    ready.then(() => setState((s) => (s === 'loading' ? (lqip ? 'resolving' : 'done') : s)))
  }
  return (
    <span className={`img${state === 'loading' ? '' : ' img--loaded'}${state === 'resolving' ? ' img--resolving' : ''}`}>
      {lqip && state !== 'done' && <span className="img__lqip" style={{ backgroundImage: `url(${lqip})` }} aria-hidden="true" />}
      <img
        ref={ref}
        src={src}
        alt={alt}
        width={size?.[0]}
        height={size?.[1]}
        decoding="async"
        loading={priority || eager ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        onLoad={resolve}
        onError={() => setState('done')}
        // the focus pull is the longer of the two animations: once it ends, drop placeholder and filter
        onAnimationEnd={(e) => e.animationName === 'img-resolve-focus' && setState('done')}
      />
    </span>
  )
}
