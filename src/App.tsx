import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { NOT_FOUND, pageMeta, SITE } from './data/meta'
import { SmoothScroll } from './components/SmoothScroll'
import { Nav } from './components/Nav'
import { Footer } from './components/Footer'
import { Home } from './pages/Home'
import { Works } from './pages/Works'
import { CaseStudy } from './pages/CaseStudy'
import { Contact } from './pages/Contact'
import { Logos } from './pages/Logos'
import { NotFound } from './pages/NotFound'
import { Start } from './pages/Start'
import { Book } from './pages/Book'

export default function App() {
  const { pathname } = useLocation()

  // The server writes each page's title and description into the HTML; keep them right as you navigate.
  useEffect(() => {
    const meta = pageMeta(pathname) ?? NOT_FOUND
    document.title = meta.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description)
    document.querySelector('link[rel="canonical"]')?.setAttribute('href', SITE.url + (pathname.replace(/\/+$/, '') || '/'))
  }, [pathname])

  return (
    <SmoothScroll>
      <Nav />
      {/* Keyed by path so every page (and its reveal animations) starts fresh on navigation. */}
      <main key={pathname}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/works" element={<Works />} />
          <Route path="/works/:slug" element={<CaseStudy />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/logos" element={<Logos />} />
          <Route path="/start" element={<Start />} />
          <Route path="/book" element={<Book />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {/* Contact already is the reach-out page: on phones its footer is just ©2026. */}
      <Footer compact={pathname === '/contact'} />
    </SmoothScroll>
  )
}
