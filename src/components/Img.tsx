import sizes from 'virtual:image-sizes'

/**
 * Image that falls back to a neutral placeholder until a real file is provided.
 * Width/height come from the file itself, so the browser reserves the right space
 * before it loads (no layout jumps). Decoding happens off the main thread.
 */
export function Img({ src, alt, priority = false }: { src?: string; alt: string; priority?: boolean }) {
  if (!src) return <div className="img-placeholder" role="img" aria-label={alt} />
  const size = sizes[src]
  return (
    <img
      src={src}
      alt={alt}
      width={size?.[0]}
      height={size?.[1]}
      decoding="async"
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
    />
  )
}
