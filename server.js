// Production server for Hostinger Node.js hosting.
// - Serves the Vite build (dist/) with SPA fallback.
// - Adds Viva.com Smart Checkout endpoints (create order + verify).
// Uses only Node built-ins (http, fetch) — no npm install needed.
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import webpush from 'web-push';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(__dirname, 'dist');
const port = process.env.PORT || 3000;

// ── Web Push (background notifications) ───────────────────────────────────
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || 'BCoD3-a82PMDZPET3VlKq1L3pFiMOMzNDqM_w-gcsH0OUHKwMtmCa6VtrbM0zxpfkJXV6c285UgKoIr380vedVM';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:msfavouritechicken@gmail.com';
if (VAPID_PRIVATE) {
  try { webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE); }
  catch (e) { console.warn('VAPID setup failed:', e.message); }
}
// Firestore (public web config — used to read the saved push subscriptions)
const FB_PROJECT = process.env.FIREBASE_PROJECT_ID || 'favourite-chicken-m-s-3696c';
const FB_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyBpFcrKjev1Iu2sQveiATNxU1bA4nzWK4o';
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents`;

const readPushSubs = async () => {
  const r = await fetch(`${FS_BASE}/pushSubs?key=${FB_KEY}&pageSize=300`);
  if (!r.ok) return [];
  const j = await r.json();
  return (j.documents || [])
    .map(d => {
      try { return { name: d.name, sub: JSON.parse(d.fields?.json?.stringValue || 'null') }; }
      catch { return null; }
    })
    .filter(x => x && x.sub);
};
const deletePushSub = (name) => fetch(`https://firestore.googleapis.com/v1/${name}?key=${FB_KEY}`, { method: 'DELETE' }).catch(() => {});

// ── Viva.com config (set these as environment variables on the host) ──────
// Uses the Merchant ID + API Key (Basic auth) with Viva's Redirect Checkout API.
const VIVA_ENV = (process.env.VIVA_ENV || 'demo').toLowerCase();
const VIVA_BASE = VIVA_ENV === 'production'
  ? 'https://www.vivapayments.com'
  : 'https://demo.vivapayments.com';
const VIVA_MERCHANT_ID = process.env.VIVA_MERCHANT_ID || '';
const VIVA_API_KEY = process.env.VIVA_API_KEY || '';
const VIVA_SOURCE_CODE = process.env.VIVA_SOURCE_CODE || '';
const vivaAuth = () => 'Basic ' + Buffer.from(`${VIVA_MERCHANT_ID}:${VIVA_API_KEY}`).toString('base64');

// Find a StatusId (= 'F' on success) anywhere in Viva's transaction response.
const findStatus = (obj) => {
  if (!obj || typeof obj !== 'object') return null;
  for (const k of Object.keys(obj)) {
    if (k.toLowerCase() === 'statusid' && typeof obj[k] === 'string') return obj[k];
  }
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (Array.isArray(v)) { for (const it of v) { const s = findStatus(it); if (s) return s; } }
    else if (v && typeof v === 'object') { const s = findStatus(v); if (s) return s; }
  }
  return null;
};

const readBody = (req) => new Promise((resolve) => {
  let data = '';
  req.on('data', c => { data += c; });
  req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); } });
});

const json = (res, code, obj) => {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
};

const handleApi = async (req, res, url) => {
  try {
    // Create a Viva payment order → returns the checkout redirect URL
    if (req.method === 'POST' && url.pathname === '/api/viva/create-order') {
      if (!VIVA_MERCHANT_ID || !VIVA_API_KEY) return json(res, 500, { error: 'Viva is not configured on the server.' });
      const body = await readBody(req);
      const amount = Math.round(Number(body.amount) || 0); // minor units (pence)
      if (amount <= 0) return json(res, 400, { error: 'Invalid amount' });
      const payload = {
        Amount: amount,
        CustomerTrns: body.customerTrns || "Favourite Chicken M's order",
        Customer: {
          Email: body.email || '',
          FullName: body.fullName || '',
          Phone: body.phone || '',
          CountryCode: 'GB',
          RequestLang: 'en-GB',
        },
        PaymentTimeout: 1800,
        Preauth: false,
        AllowRecurring: false,
      };
      if (VIVA_SOURCE_CODE) payload.SourceCode = VIVA_SOURCE_CODE;
      const r = await fetch(`${VIVA_BASE}/api/orders`, {
        method: 'POST',
        headers: { Authorization: vivaAuth(), 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) { const detail = await r.text(); return json(res, 502, { error: 'Could not create payment order', detail }); }
      const j = await r.json();
      const orderCode = j.OrderCode ?? j.orderCode;
      if (!orderCode) return json(res, 502, { error: 'Viva did not return an order code', detail: JSON.stringify(j) });
      return json(res, 200, { orderCode, redirectUrl: `${VIVA_BASE}/web/checkout?ref=${orderCode}` });
    }

    // Verify a transaction after the customer returns from Viva
    if (req.method === 'GET' && url.pathname === '/api/viva/verify') {
      if (!VIVA_MERCHANT_ID || !VIVA_API_KEY) return json(res, 500, { error: 'Viva is not configured on the server.' });
      const t = url.searchParams.get('t');
      if (!t) return json(res, 400, { error: 'Missing transaction id' });
      const r = await fetch(`${VIVA_BASE}/api/transactions/${t}`, { headers: { Authorization: vivaAuth() } });
      if (!r.ok) return json(res, 200, { success: null }); // inconclusive — trust the success redirect
      const j = await r.json();
      const status = findStatus(j);
      // 'F' = finished/successful. Unknown status → inconclusive (null).
      return json(res, 200, { success: status === 'F' ? true : (status ? false : null), statusId: status });
    }

    // Send a background push to all subscribed admins (called when an order is placed)
    if (req.method === 'POST' && url.pathname === '/api/push/notify') {
      if (!VAPID_PRIVATE) return json(res, 200, { sent: 0, note: 'push not configured' });
      const body = await readBody(req);
      const payload = JSON.stringify({
        title: "Favourite Chicken M's",
        body: body.body || 'New order received',
      });
      const subs = await readPushSubs();
      let sent = 0;
      await Promise.all(subs.map(async ({ name, sub }) => {
        try { await webpush.sendNotification(sub, payload); sent++; }
        catch (err) { if (err.statusCode === 404 || err.statusCode === 410) deletePushSub(name); }
      }));
      return json(res, 200, { sent });
    }

    return json(res, 404, { error: 'Not found' });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
};

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.gif': 'image/gif',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

const sendFile = (filePath, res) => {
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream' });
    res.end(data);
  });
};

http.createServer((req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  if (url.pathname.startsWith('/api/')) return handleApi(req, res, url);
  const filePath = path.normalize(path.join(dist, decodeURIComponent(url.pathname)));
  if (!filePath.startsWith(dist)) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isFile()) return sendFile(filePath, res);
    sendFile(path.join(dist, 'index.html'), res); // SPA fallback
  });
}).listen(port, () => console.log(`Favourite Chicken M's running on port ${port} (Viva: ${VIVA_ENV})`));
