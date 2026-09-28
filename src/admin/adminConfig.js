// Admin access is granted by email allowlist.
// Override/extend via VITE_ADMIN_EMAILS in .env (comma-separated).
const DEFAULT_ADMINS = [
  'admin@americanfriedchicken.co.uk',
  'varunvanteru9999@gmail.com',
];

const envAdmins = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

export const ADMIN_EMAILS = [
  ...new Set([...DEFAULT_ADMINS.map(e => e.toLowerCase()), ...envAdmins]),
];

export const isAdminEmail = (email) =>
  !!email && ADMIN_EMAILS.includes(email.toLowerCase());

// --- Admin portal credential login (/admin/login) ---
// Stored in .env (gitignored): VITE_ADMIN_EMAIL / VITE_ADMIN_PASSWORD.
export const ADMIN_LOGIN_EMAIL =
  (import.meta.env.VITE_ADMIN_EMAIL || 'admin@americanfriedchicken.co.uk').toLowerCase();

// --- Admin password -------------------------------------------------------
//
// SECURITY NOTE, read before changing this:
// This value is compiled into the shipped JavaScript bundle as a plain string.
// Anyone who opens DevTools on the live site can find it in seconds by
// searching the bundle. It is NOT a secret and does not protect the dashboard
// from a determined visitor — it only stops casual wandering.
//
// The value therefore lives ONLY in .env (gitignored) and never in this file,
// because this repository is public — a literal here would be searchable on
// GitHub and permanent in git history. Two ways to make it genuinely secure:
//   1. Firebase Auth (already wired in AdminLogin.jsx — just add the keys),
//      which verifies server-side so nothing secret ships in the bundle.
//   2. hPanel -> Password Protect Directories on /admin, which puts real HTTP
//      auth in front of the route at the Apache level.
//
// Override per-environment with VITE_ADMIN_PASSWORD in .env.
export const ADMIN_LOGIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || '';

const ADMIN_SESSION_KEY = 'ms-admin-session';
export const isAdminSession = () => {
  try { return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1'; } catch { return false; }
};
export const startAdminSession = () => {
  try { sessionStorage.setItem(ADMIN_SESSION_KEY, '1'); } catch { /* ignore */ }
};
export const endAdminSession = () => {
  try { sessionStorage.removeItem(ADMIN_SESSION_KEY); } catch { /* ignore */ }
};
