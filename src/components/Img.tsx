/** Image that falls back to a neutral placeholder until a real file is provided. */
export function Img({ src, alt }: { src?: string; alt: string }) {
  if (!src) return <div className="img-placeholder" role="img" aria-label={alt} />
  return <img src={src} alt={alt} loading="lazy" />
}
