import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { isWebKit } from '../lib/browser'

const links = [
  { to: '/', label: 'Home' },
  { to: '/works', label: 'Works' },
  { to: '/contact', label: 'Contact' },
]

export function Nav() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => setOpen(false), [pathname])

  return (
    <header className="nav">
      <Link to="/" className="nav__logo">karelfyrbach</Link>
      <nav className="nav__links" aria-label="Main">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end className="nav__link label">{l.label}</NavLink>
        ))}
      </nav>
      <button className="nav__menu label" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        {open ? 'Close' : 'Menu'}
      </button>
      <AnimatePresence>
        {open && (
          <motion.nav
            className="nav__sheet"
            aria-label="Mobile"
            // The sheet covers the page first; only then do the links come in, so the big menu type
            // never sits on top of the hero's headline mid-fade.
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.3, 0, 0.1, 1] }}
          >
            {links.map((l, i) => (
              <motion.div
                key={l.to}
                // Animated blur is CPU-rasterised in WebKit (janky on big type), so it's left out there.
                initial={{ opacity: 0, y: 16, ...(!isWebKit && { filter: 'blur(8px)' }) }}
                animate={{ opacity: 1, y: 0, ...(!isWebKit && { filter: 'blur(0px)', transitionEnd: { filter: 'none' } }) }}
                transition={{ delay: 0.22 + i * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <NavLink to={l.to} end className="nav__sheet-link h2">{l.label}</NavLink>
              </motion.div>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
