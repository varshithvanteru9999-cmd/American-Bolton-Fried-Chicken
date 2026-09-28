// Single source of truth for the shop's online-ordering hours.
// The store runs on UK time (Europe/London) regardless of the visitor's device.

// Current time-of-day in minutes, in UK time.
export const ukNowMinutes = () => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const h = Number(parts.find(p => p.type === 'hour').value) % 24;
  const m = Number(parts.find(p => p.type === 'minute').value);
  return h * 60 + m;
};

// Three states based on UK time:
//   'open'     — 11:00 AM – 11:00 PM: normal ordering
//   'preorder' — 10:00 AM – 10:59 AM: scheduled (pre-)orders only
//   'closed'   — 11:00 PM – 09:59 AM: fully closed
export const getStoreStatus = () => {
  const m = ukNowMinutes();
  if (m >= 11 * 60 && m < 23 * 60) return 'open';
  if (m >= 10 * 60 && m < 11 * 60) return 'preorder';
  return 'closed';
};

export const isStoreOpen = () => getStoreStatus() === 'open';

// Orders are accepted during open hours (live) and the pre-order window
// (10:00–11:00 AM, scheduled for the 11:00 AM opening). Fully closed overnight.
export const isAcceptingOrders = () => getStoreStatus() !== 'closed';
