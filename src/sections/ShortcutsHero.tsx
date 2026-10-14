import { useMemo } from 'react'
import '@fontsource/inter/700.css'
import { ScaledFrame } from '../components/ScaledFrame'
import { SparkyAuto } from './shortcuts/Sparky'
import { figmaShortcuts } from './shortcuts/data'
import './shortcuts-hero.css'

/*
 * "Shortcuts for Figma" — 1:1 port of Figma frame 337:1496 (3840 × 2160).
 * On load it plays the app's opening once: the shortcut columns fade in left to right
 * (0.35 s, +0.04 s each) and Sparky starts cycling as in the app.
 * SF Pro is the system font on Apple devices; the SF Symbols are redrawn as SVG
 * because symbol glyphs aren't available on the web.
 */

type Hotkey = string | [string, string] // [a, b] renders as "a or b"

const or: Hotkey = ['⌘ /', '⌘ P']

const essentials = {
  title: 'Essentials',
  rows: [
    ['⌘ \\', 'Show / Hide'],
    [or, 'Pick color'],
    [or, 'Quick actions'],
  ] as [Hotkey, string][],
}

const selection = {
  title: 'Selection',
  rows: [
    ['⌘ \\', 'Select all'],
    ['⇧ ⌘ A', 'Select inverse'],
    [or, 'Select none'],
    ['⌘ Click', 'Deep select'],
    ['⌘ right-click', 'Select layer menu'],
    [or, 'Select children'],
    [or, 'Select parent'],
    [or, 'Select next sibling'],
    ['⇧ Tab', 'Select previous sibling'],
    [or, 'Group selections'],
    ['⇧ ⌘ G', 'Ungroup selection'],
    ['⌥ ⌘ G', 'Frame selection'],
  ] as [Hotkey, string][],
}

const columns = [
  [essentials, selection],
  [selection, essentials],
  [essentials, selection],
  [selection, essentials],
]

function Key({ hotkey }: { hotkey: Hotkey }) {
  if (typeof hotkey === 'string') return <p>{hotkey}</p>
  return (
    <p>
      {hotkey[0]} <span className="sh__or">or</span> {hotkey[1]}
    </p>
  )
}

function Section({ section }: { section: typeof essentials }) {
  return (
    <div className="sh__section">
      <div className="sh__keys">
        {section.rows.map(([k], i) => <Key key={i} hotkey={k} />)}
      </div>
      <div className="sh__text">
        <p className="sh__title">{section.title}</p>
        <div className="sh__actions">
          {section.rows.map(([, action], i) => <p key={i}>{action}</p>)}
        </div>
      </div>
    </div>
  )
}

export function ShortcutsHero() {
  // The design's line first, then the app's own comments, shuffled per visit (as the app does per open).
  const sentences = useMemo(() => {
    const comments = figmaShortcuts.flatMap((c) => c.shortcuts).filter((s) => s.comment).map((s) => `${s.action}: ${s.comment}`)
    for (let i = comments.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[comments[i], comments[j]] = [comments[j], comments[i]]
    }
    return ['“Even your text needs a power pose”', ...comments]
  }, [])

  return (
    <ScaledFrame width={3840} height={2160} className="sh sh--intro">
      <div className="sh__window sh__rim">
        <div className="sh__navbar">
          <div className="sh__brand">
            <p className="sh__brand-for">Shortcuts for</p>
            <p className="sh__brand-app">Figma</p>
          </div>
          <div className="sh__tools">
            <div className="sh__quote">
              {/* Live Sparky, cycling like the app (sizes are app points × 2 in this 3840 px frame) */}
              <SparkyAuto sentences={sentences} unit={2} />
            </div>
            <div className="sh__glass sh__mic">
              <svg className="sh__mic-icon" viewBox="0 0 24 24" fill="none" stroke="#ebedf0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="9" y="2.5" width="6" height="12" rx="3" />
                <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
              </svg>
            </div>
            <div className="sh__glass sh__search">
              <svg className="sh__search-icon" viewBox="0 0 24 24" fill="none" stroke="#ebedf0" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="m15.5 15.5 5 5" />
              </svg>
              <p className="sh__search-label">Search</p>
            </div>
          </div>
        </div>

        <div className="sh__cards">
          {columns.map((col, i) => (
            <div key={i} className="sh__card-wrap">
              {i > 0 && <span className="sh__divider" style={{ '--i': i } as React.CSSProperties} />}
              <div className="sh__card" style={{ '--i': i } as React.CSSProperties}>
                {col.map((s, j) => <Section key={j} section={s} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </ScaledFrame>
  )
}
