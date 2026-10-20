/** Mux URLs for a playback ID (public playback policy). */

/** Adaptive stream (HLS). */
export const muxStream = (id: string) => `https://stream.mux.com/${id}.m3u8`

/** A still from the video; `time` in seconds, `width` in px (Mux scales it, keeping 16:9). */
export const muxStill = (id: string, { time = 0, width = 1920 }: { time?: number; width?: number } = {}) =>
  `https://image.mux.com/${id}/thumbnail.webp?time=${time}&width=${width}`
