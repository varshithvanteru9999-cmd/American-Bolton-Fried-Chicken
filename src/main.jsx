import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { CartProvider } from './context/CartContext.jsx'
// Premium theme overrides. Imported AFTER App so it wins the cascade over the
// per-page stylesheets that App (and its routes) pull in.
import './premium.css'

// Capture the PWA install prompt as early as possible (it can fire before React
// mounts). The admin "Install app" button uses this.
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__installPrompt = e;
  window.dispatchEvent(new Event('pwa-install-ready'));
});
window.addEventListener('appinstalled', () => {
  window.__installPrompt = null;
  window.dispatchEvent(new Event('pwa-installed'));
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CartProvider>
      <App />
    </CartProvider>
  </StrictMode>,
)
