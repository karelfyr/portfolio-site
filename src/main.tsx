import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/open-sauce-one/400.css'
import '@fontsource/open-sauce-one/500.css'
import './index.css'
import App from './App'

// Always start at the top so the hero intro plays (Lenis handles scroll from here).
history.scrollRestoration = 'manual'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
