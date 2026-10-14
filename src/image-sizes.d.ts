declare module 'virtual:image-sizes' {
  /** Pixel size of every file in public/images, keyed by its public path. */
  const sizes: Record<string, [width: number, height: number]>
  export default sizes
}
