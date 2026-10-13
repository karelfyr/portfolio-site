import { Route, Routes } from 'react-router-dom'
import { SmoothScroll } from './components/SmoothScroll'
import { Nav } from './components/Nav'
import { Footer } from './components/Footer'
import { Home } from './pages/Home'
import { CaseStudy } from './pages/CaseStudy'

export default function App() {
  return (
    <SmoothScroll>
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/works/:slug" element={<CaseStudy />} />
        </Routes>
      </main>
      <Footer />
    </SmoothScroll>
  )
}
