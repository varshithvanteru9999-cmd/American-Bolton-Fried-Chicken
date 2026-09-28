import { alertMessage } from './alerts';

// True when the app is running as an installed PWA (so we can hide install buttons).
export const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);

// Trigger the browser install prompt for the currently-linked manifest. If the
// browser hasn't offered one (iOS, or criteria not yet met), show how to install
// manually. The manifest in use is set per-route (see index.html + App.jsx), so
// installing from the storefront installs the customer app and installing from
// the admin installs the admin app.
export const installApp = async () => {
  const evt = window.__installPrompt;
  if (evt) {
    evt.prompt();
    try { await evt.userChoice; } catch { /* ignore */ }
    window.__installPrompt = null;
    window.dispatchEvent(new Event('pwa-install-consumed'));
    return true;
  }
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  alertMessage(
    isIOS
      ? 'Tap the Share button, then "Add to Home Screen" to install the app.'
      : 'Open your browser menu (⋮) and choose "Install app" / "Add to Home screen". On desktop Chrome you can also click the install icon in the address bar.',
    'Install American Fried Chicken',
  );
  return false;
};
