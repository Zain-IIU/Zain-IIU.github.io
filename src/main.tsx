import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './styles/app.css'

/**
 * HashRouter, not BrowserRouter.
 *
 * GitHub Pages serves static files and knows nothing about client-side routes,
 * so a hard refresh on /admin would 404. Hash routing (/#/admin) sidesteps that
 * with no server config and no 404.html redirect hack.
 *
 * When you move to Vercel, swap HashRouter for BrowserRouter here and the URLs
 * become /admin. That is the only change needed.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
