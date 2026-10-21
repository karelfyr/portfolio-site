import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/open-sauce-one/400.css'
import '@fontsource/open-sauce-one/500.css'
import './index.css'
import App from './App'
import { isWebKit } from './lib/browser'
import { disableZoom } from './lib/noZoom'

// Always start at the top so the hero intro plays (Lenis handles scroll from here).
history.scrollRestoration = 'manual'

// Safari-specific rendering fallbacks in index.css are scoped under html.is-webkit.
if (isWebKit) document.documentElement.classList.add('is-webkit')

// No page zoom: it would interrupt the live animations (and can run Safari out of memory).
disableZoom()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
