/**
 * True in WebKit-based browsers: desktop Safari and every browser on iPhone / iPad
 * (Chrome, Firefox and Edge on iOS all use WebKit). Blink (Chrome, Edge, Opera, Arc) reports
 * "AppleWebKit" too, so it's excluded by its "Chrome/" / "Chromium/" token.
 */
export const isWebKit =
  typeof navigator !== 'undefined' &&
  (/iP(hone|ad|od)/.test(navigator.userAgent) ||
    (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent)) || // iPadOS desktop UA
    (/AppleWebKit/.test(navigator.userAgent) && !/(Chrome|Chromium|Edg|OPR)\//.test(navigator.userAgent)))

/** CSS scroll-driven animations (Chrome 115+, Safari 26+): scroll-linked effects off the main thread. */
export const supportsScrollTimeline =
  typeof CSS !== 'undefined' && CSS.supports('animation-timeline: scroll()')

/**
 * Whether to add synthetic (Lenis) momentum on top of native scrolling. It's an enhancement only
 * where it can't fight the platform: Blink (WebKit's gesture-coupled, 120 Hz native scroll is kept
 * as the intended Apple feel), a fine pointer (mouse / trackpad — touch always scrolls natively),
 * and no reduced-motion preference.
 */
export function wantsSmoothScroll() {
  return (
    !isWebKit &&
    window.matchMedia('(pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}
