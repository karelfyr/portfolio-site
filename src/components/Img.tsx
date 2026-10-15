import sizes from 'virtual:image-sizes'

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
 */
export function Img({ src, alt, priority = false, eager = false }: Props) {
  if (!src) return <div className="img-placeholder" role="img" aria-label={alt} />
  const size = sizes[src]
  return (
    <img
      src={src}
      alt={alt}
      width={size?.[0]}
      height={size?.[1]}
      decoding="async"
      loading={priority || eager ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
    />
  )
}
