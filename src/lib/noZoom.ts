/**
 * The site is a fixed, art-directed layout with large live animations (the case-study clips are
 * 3840 px stages). Zooming re-renders them at the zoomed resolution – enough to run iOS Safari out
 * of memory and crash the tab – so page zoom is turned off everywhere. Each browser zooms through
 * a different door, so each is closed:
 *
 * - Viewport meta (index.html): maximum-scale=1, user-scalable=no – honoured by Chrome / Android.
 *   iOS Safari ignores it (since iOS 10), hence the rest.
 * - CSS (index.css): `touch-action: pan-x pan-y` on <html> – scrolling only: no pinch, no
 *   double-tap zoom. Elements can still narrow it further (e.g. `pan-y` on draggable strips).
 * - Safari's own pinch events (iOS and macOS trackpads): `gesturestart` / `gesturechange` /
 *   `gestureend` – cancelled.
 * - Two-finger moves on iOS (a pinch that slips past the gesture events) – cancelled.
 * - Trackpad pinch and Ctrl + wheel in Chrome, Edge and Firefox: a `wheel` event with ctrlKey.
 * - Keyboard: ⌘/Ctrl + plus, minus, 0.
 *
 * What a page can't block: zoom from the browser's own menu or settings, and system-level zoom
 * (e.g. macOS / iOS accessibility zoom) – those are the user's and stay available.
 */
export function disableZoom() {
  const cancel = (e: Event) => e.preventDefault()
  const opts: AddEventListenerOptions = { passive: false }

  // Safari (iOS + macOS trackpad pinch)
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(type, cancel, opts)

  // iOS: any two-finger move is a pinch on a page that only scrolls
  document.addEventListener('touchmove', (e) => e.touches.length > 1 && e.preventDefault(), opts)

  // Chrome / Edge / Firefox: trackpad pinch and Ctrl + wheel arrive as wheel events with ctrlKey
  window.addEventListener('wheel', (e) => e.ctrlKey && e.preventDefault(), opts)

  // ⌘/Ctrl + plus / minus / 0
  window.addEventListener('keydown', (e) => {
    if (!(e.ctrlKey || e.metaKey)) return
    if (['+', '-', '=', '_', '0'].includes(e.key) || ['Equal', 'Minus', 'Digit0', 'NumpadAdd', 'NumpadSubtract', 'Numpad0'].includes(e.code)) {
      e.preventDefault()
    }
  })
}
