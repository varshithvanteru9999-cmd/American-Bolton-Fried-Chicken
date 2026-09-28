# Payments — Viva.com Smart Checkout

Online card / Google Pay / Apple Pay payments go through **Viva.com Smart
Checkout** (hosted redirect). Cash stays as pay-on-collection (no gateway).

## Flow
1. Customer taps **Pay** (card / Google Pay) at checkout.
2. The browser calls our server `POST /api/viva/create-order` with the amount +
   contact. The server gets a Viva OAuth token and creates a payment order,
   returning the hosted-checkout URL.
3. The order details are stashed in `localStorage` (`ms-pending-order`), then the
   browser redirects to Viva's secure page (cards + Google/Apple Pay).
4. Viva redirects back to `…/checkout?viva=success&t=<transactionId>` (or
   `?viva=fail`). The app calls `GET /api/viva/verify?t=…`; if the transaction is
   successful it **places the order** (status PAID), clears the basket, and emails
   the invoice. On failure the basket is kept.

Code: `server.js` (endpoints), `src/utils/payments.js` (client calls),
`src/pages/Checkout.jsx` (redirect + return handling).

## Server environment variables (set in Hostinger → Node.js app → Environment variables)
| Variable | Value |
|---|---|
| `VIVA_ENV` | `demo` for test, `production` for live |
| `VIVA_MERCHANT_ID` | **Merchant ID** (Viva → Settings → API Access) |
| `VIVA_API_KEY` | **API Key** (same page) |
| `VIVA_SOURCE_CODE` | the **Source Code** of your payment source (Sales → Payment Sources) |

The env vars must match the environment: live Merchant ID/API Key with
`VIVA_ENV=production`; demo credentials with `VIVA_ENV=demo`. Secrets stay on the
server — never bundled into the client.

## Viva dashboard setup
1. **Payment source:** Sales → Payment Sources → add/open a source, note its
   **Source Code**, and set its redirect URLs:
   - **Success:** `https://favouritechickenms.online/checkout?viva=success`
   - **Failure:** `https://favouritechickenms.online/checkout?viva=fail`
2. **Credentials:** Settings → API Access → copy the **Merchant ID** and **API Key**.
3. Test on **demo** first (a separate account at `demo.vivapayments.com`), then
   switch to live credentials + `VIVA_ENV=production`.

## Notes
- Amounts are sent to Viva in **pence** (GBP). The app keeps currency as GBP.
- `node -c server.js` checks syntax; the server uses Node 20's built-in `fetch`
  (no extra dependency / npm install).
- For local testing the Vite dev server doesn't run `server.js`; test on the
  deployed Hostinger site (or run `node server.js` with the env vars set).
