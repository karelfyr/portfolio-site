import { Route, Routes, useLocation } from 'react-router-dom'
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
