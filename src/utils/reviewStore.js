// Helpers for the customer review feature (kept on our own Reviews page).

export const WORD_LIMIT = 200;
export const countWords = (s) => (s && s.trim() ? s.trim().split(/\s+/).length : 0);
// Trim text to the word limit (used as the user types).
export const clampWords = (s) => {
  const w = s.trim() ? s.trim().split(/\s+/) : [];
  return w.length > WORD_LIMIT ? w.slice(0, WORD_LIMIT).join(' ') : s;
};

// ── Post-order review prompt tracking (localStorage) ───────────────────────
const DONE_KEY = 'ms-review-done';       // reviewed order / item ids
const SKIP_KEY = 'ms-review-dismissed';  // dismissed order ids
const getSet = (k) => { try { return new Set(JSON.parse(localStorage.getItem(k) || '[]')); } catch { return new Set(); } };
const addTo = (k, id) => { const s = getSet(k); s.add(String(id)); localStorage.setItem(k, JSON.stringify([...s])); };

export const markOrderReviewed = (id) => addTo(DONE_KEY, `order-${id}`);
export const dismissOrderReview = (id) => addTo(SKIP_KEY, `order-${id}`);
const orderHandled = (id) => getSet(DONE_KEY).has(`order-${id}`) || getSet(SKIP_KEY).has(`order-${id}`);

export const markItemReviewed = (id) => addTo(DONE_KEY, `item-${id}`);
export const itemReviewed = (id) => getSet(DONE_KEY).has(`item-${id}`);

const HOUR_MS = 60 * 60 * 1000;
// The most recent order older than 1 hour that hasn't been reviewed/dismissed.
export const pendingOrderReview = (orderHistory) => {
  if (!Array.isArray(orderHistory)) return null;
  return orderHistory.find(o =>
    o && o.date && (Date.now() - new Date(o.date).getTime() >= HOUR_MS) && !orderHandled(o.id)
  ) || null;
};
