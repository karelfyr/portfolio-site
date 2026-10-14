# Shortcuts HUD — behaviour spec

Source of truth for the interactive prototype in the Shortcuts case study.
Derived from reading the full source of `~/ClaudeProjects/ShortcutsHUD` (9 Swift files)
and its pill package `~/ClaudeProjects/TextAnimationPreview/Sources/AnimatedPillKit` (5 files).
Shortcut data: `ShortcutsDatabase.swift` (same content as `CSV/ShortcutsFigma.csv`, `;`-separated:
`Category;Action Name;Shortcut;Comment`).

---

## 1. What it is

A native macOS (14+) menu-bar utility. Press **⌘J** while **Figma** is the frontmost app and a
full-screen glass HUD appears listing Figma's keyboard shortcuts, with a live search field and
"Sparky" — an animated pill that cycles through cheeky one-line comments about each shortcut.

## 2. Lifecycle

### Launch
- Runs as an **accessory app**: no Dock icon, no main window (`LSUIElement`, activation policy `.accessory`).
- Adds a **menu bar item** with the SF Symbol `keyboard.fill`.
- Registers a **global hotkey ⌘J** (Carbon `RegisterEventHotKey`) — works system-wide.
  (A code comment says ⌘F4; the real binding is ⌘J.)

### Menu bar menu (click the keyboard icon)
1. **ShortcutsHUD** (headline) / *Press ⌘+J to toggle shortcuts* (caption, 60% opacity)
2. — divider —
3. **Launch at Login** toggle (system login item; reverts if registration fails)
4. **Sparky** toggle — default **on**, persisted in UserDefaults (`sparkyEnabled`)
   caption: *A little companion who keeps you professional and smiling.*
5. — divider —
6. **Quit** (⌘Q)

### Opening (⌘J)
- If the HUD is already showing → ⌘J **closes** it (toggle).
- Otherwise it reads the **frontmost app**. It only opens for Figma
  (`com.figma.Desktop`, `com.figma.agent`). Any other app → **nothing happens** (silent, no feedback).
- Opens on the **display under the mouse cursor**.
- Shows over everything, on every Space, including over full-screen apps
  (shielding window level; `canJoinAllSpaces`, `fullScreenAuxiliary`).
- The HUD panel is **non-activating**: Figma stays the active app; the panel just takes keyboard focus.
- Note: ⌘J is also Figma's own "Join selection" shortcut — the HUD steals it while running.

### Every open is a fresh instance
New identity per open → search is empty, comments are **re-shuffled**, columns rebuilt.

### Closing — all instant, no exit animation
| Trigger | Result |
|---|---|
| **Esc** | close |
| **Tab** | close (even while typing in search — caught before the field) |
| **⌘J** again | close |
| **Click** on the dimmed area outside the panel | close |
| **Switching apps** (⌘Tab, Dock, any other app activating) | close |

On close: monitors removed, visibility state reset without animation, both windows hidden at once.

## 3. Structure & visual spec

### Dim overlay (window 1)
- Black at **50%** opacity, covers the whole screen (built 200 px larger on every side so it never
  looks like it "grows in").
- Appears **instantly** (no fade).
- Catches clicks (→ close) and **swallows scroll** so nothing scrolls behind it.

### HUD panel (window 2, above the overlay)
- Inset from screen edges: **33 px** left / right / bottom, **51 px** top (clears the menu bar).
- Corner radius **34**, continuous (squircle) curve, content clipped.
- Appears **instantly** — only the shortcut columns animate (see §4).

**Liquid-glass material** (bottom → top):
1. macOS behind-window blur, `.hudWindow` material, dark appearance
2. Black **50%**
3. `#888888` at **8%**, blend **color-burn**
4. Diagonal sheen, top-left → bottom-right, blend **screen**:
   white 4% @0 → clear @0.4 → white 2% @1

**Edge**: 0.5 px stroke, linear gradient top-left → bottom-right: white **28% → 8% (mid) → 4%**.
**Shadow**: black 12%, radius 20, y +8.

**Padding**: 40 left/right, 32 top, 40 bottom. Navbar → columns gap: **72**.

### Navbar (height 52)
**Left** (baseline-aligned, gap 8, single line, colour `#e6e6e6`):
- "Shortcuts for" — system 15 regular
- App name — system **26 bold** (frontmost app's name, e.g. "Figma")

**Right** (gap 16):
- **Sparky pill** (height 36, sized to content) — only if Sparky is enabled (§5)
- **Search field** — glass pill **197 × 36**:
  - fill `#333333` @ 60%, stroke white 10% 0.5 px, capsule
  - `magnifyingglass` 13 medium, `#8a8a8a`, 16×16 box; gap 6; horizontal padding 10
  - placeholder **"Search shortcut"** 13 medium `#8a8a8a`; typed text `#e6e6e6`
  - **auto-focused 150 ms after opening** — you can type immediately

### Shortcut columns
- **Horizontal scroll**, scrollbars hidden. Columns 300 wide.
- Between columns: 1 px divider, `#e6e6e6` @ 10%, 23 px horizontal padding each side.
- Column = vertical stack of sections, spacing **40**, trailing-aligned.

**Section** (two columns, gap 24):
- **Hotkeys** (right-aligned, min width 120, row gap 8): a 22 + 12 px spacer to line up with the
  title, then one key label per row — system 13, `#e6e6e6`, row height 16.
  `" or "` / `" and "` inside a key string render in `#9b9b9b` (e.g. `⌘ /` *or* `⌘ P`).
- **Actions** (left-aligned, width 180): category title system **17 bold**, height 22, 20 below;
  then action names system 13, height 16, row gap 8, single line.

**Column distribution** (computed once per open): max **22 rows** per column; a section header costs
**2 rows**; a section only starts if ≥ 3 rows remain; sections that don't fit **split** and continue
in the next column **with their title repeated**. With today's data (131 shortcuts, 13 categories):

| Col | Content |
|---|---|
| 1 | Essentials (3), Tools (12), View (1) |
| 2 | View (11), Zoom (7) |
| 3 | Zoom (5), Text (13) |
| 4 | Text (1), Shape (12), Selection (3) |
| 5 | Selection (11), Cursor (7) |
| 6 | Cursor (2), Edit (11), Transform (3) |
| 7 | Transform (6), Arrange (12) |
| 8 | Arrange (1), Components (6), Prototyping (4) |

## 4. Opening animation

- Navbar, panel, overlay: **no animation** (instant).
- ~10 ms after the windows show, every **column** fades in: opacity 0 → 1,
  **0.35 s ease-in-out**, delay **index × 0.04 s** (left to right; col 8 starts at 0.28 s).
- Each **divider** fades with the same timing as the column to its right.
- Fade only — no movement, scale or blur.
- Closing has **no** animation.

## 5. Search

- Matches the **action name** only (case-insensitive substring). Key labels and comments are not searched.
- **Instant** (every keystroke) for the list:
  - non-matching rows → **20%** opacity (both key and action)
  - a section title → 20% if none of *that slice's* rows match
  - nothing is hidden or reordered — columns never reflow; no transition on the dimming
- **Debounced 300 ms** for Sparky:
  - pill sentences become `"<Action>: <comment>"` for matching shortcuts
  - no matches → single sentence **"Type to search shortcuts"**
  - exactly **one** match → the pill **freezes** after revealing it (stays on screen)
  - any change of the sentence list restarts the pill from scratch
- Empty search → pill returns to the shuffled list of all comments.

## 6. Sparky — the animated pill

Content: `[spinning icon] [sentence]`, gap 8, right-aligned in the navbar so it **grows to the left**
(toward the title) as the text reveals.

- **Icon**: SF Symbol `apple.intelligence` (macOS 26+) else `sparkles`, 14 pt, 16×16.
- **Text**: system **rounded 12 medium**, tracking 0.1, single line.
- **Sentences**: every shortcut's `"<Action>: <comment>"`, shuffled per open
  (e.g. *"Move tool: Back to basics. Something needs to move."*).

### Gradient fill (icon + text)
Both are masked onto an **animated angular gradient**, 600×600, blurred 12:
`#FEAE25` orange → `#FF915D` salmon → `#F64174` pink → `#BE67E5` purple → `#46B7FD` blue →
(repeat orange, salmon, pink for a seamless loop).
- rotates 360° every **25 s**, linear, forever
- slides horizontally 0 ↔ −80 px every **5 s**, linear, ping-pong

### One cycle (≈ 4.26 s per sentence)
| t (ms) | What happens |
|---|---|
| 0 | New sentence set, reveal 0, opacity 1, blur 0. Icon → **fast** (−648°/s, counter-clockwise) |
| 50 | **Reveal** starts: 0 → 1 over **706 ms linear** |
| 506 | Icon eases **fast → normal** (−60°/s CCW) over **666 ms**, ease-out (quadratic) |
| 806 | Fully revealed. If *freeze* → stop here (icon keeps spinning slowly) |
| 3806 | Icon switches **instantly** to **fast clockwise** (+648°/s); text **fades out** over **350 ms ease-in**: opacity → 0, blur → 8 px, reveal → 0 (pill collapses back) |
| 4256 | Next sentence (loops forever) |

### The reveal ("frosted typewriter")
- Pill width = full text width × reveal. Text is anchored to the **trailing** edge, so the visible
  window grows leftward.
- The **leading edge** (left side of the visible window) is a soft frosted zone:
  - zone width = 60 × (1 − p⁴)
  - a copy of the text blurred 40 × (1 − p³), at 30% × (1 − p²) opacity, masked white → 50% → clear
  - the sharp text is masked clear → 30% → solid across the same zone
- At p = 1 the zone is gone and the text is fully sharp.

## 7. Other details
- Keeps the display at its maximum refresh rate (120 Hz on ProMotion) while open (CVDisplayLink).
- Scrolling over the overlay does nothing; the panel scrolls its columns horizontally.
- Clicking inside the panel does nothing (shortcuts aren't clickable / copyable).
- Navbar app name falls back to "Figma".

## 8. Data quirks (as shipped)
- "Slice cool" (Tools) — likely meant "Slice tool".
- "Pixel grid" keys are `⌘ or ⇧` — likely incomplete.
- Some shortcuts repeat across categories (Pick color, Show / Hide UI, Deep select, Pen…).
- ⌘J is listed as "Join selection" while also being the HUD's own trigger.

## 9. Mapping to a web prototype (suggestions)
- **Open**: ⌘J / Ctrl+J while the prototype is focused, plus a visible "Press ⌘J" hint/button
  (visitors won't guess it). Optionally a fake Figma canvas behind the overlay.
- **Close**: Esc, Tab, ⌘J, click outside.
- Columns: CSS grid with `overflow-x: auto`; replicate the 22-row split rule and repeated titles.
- Glass: `backdrop-filter: blur()` + the layered fills above; 0.5 px gradient border via masked pseudo-element.
- Sparky: a `requestAnimationFrame` loop for icon angular velocity (with the 666 ms ease-out),
  `clip`/`mask-image` for the trailing-anchored reveal, `background-clip: text` on an animated
  conic-gradient for the fill.
- Respect `prefers-reduced-motion`: skip the reveal and spin, show sentences as plain fades.
