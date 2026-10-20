# Portfolio site – rules

## Design fidelity over performance: Shortcuts case study (`/works/shortcuts`)

The Shortcuts hero and clip (`src/sections/ShortcutsHero.tsx`, `src/sections/shortcuts/*`) must look
exactly like the design in every browser, Safari included. Performance is sacrificed on this page
when the two conflict.

- Keep `ScaledFrame` on `transform: scale()`. Never switch it to CSS `zoom`: Safari rounds the
  shrunken font sizes and the shortcut columns overlap and clip.
- Keep the real `backdrop-filter` glass on the window and search pill in Safari as well – no
  tinted fallbacks.
- No browser-specific simplifications (removed blur, swapped effects, lower-fidelity layers) on
  these sections. Optimise only in ways that leave the rendered result identical.
