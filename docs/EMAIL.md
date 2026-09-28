# Emailing the invoice (EmailJS)

When a customer **completes payment** (online orders, marked `PAID`) and we have
their email — typed at checkout or from their **Google sign-in** — the app emails
them the invoice. Cash / COD orders are paid on collection/delivery, so no
invoice is emailed at placement for them.

Email is sent with **EmailJS** straight from the browser — no backend, no SMTP
server, no Firebase Blaze plan. Free tier covers ~200 emails/month.

## How it works in code
- `src/utils/invoice.js` → `buildInvoiceHtml(order)` builds the invoice HTML
  (same template the admin "Download" button prints).
- `src/context/CartContext.jsx` → `emailInvoice(order)` calls
  `emailjs.send(serviceId, templateId, params, { publicKey })` with the invoice
  HTML. It's called from `addOrder()` only when `order.paymentStatus === 'PAID'`
  and `order.email` is present.
- Config comes from `.env`: `VITE_EMAILJS_SERVICE_ID`,
  `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY`.

Until those are set the app still works — the email step is just skipped (logged
as a warning).

## One-time setup (≈5 min, free)
1. Create a free account at <https://www.emailjs.com> and verify it.
2. **Email Services → Add New Service** → pick **Gmail** (or any provider) →
   connect the `msfavouritechicken@gmail.com` account → note the **Service ID**
   (e.g. `service_xxx`).
3. **Email Templates → Create New Template**. Set:
   - **To Email:** `{{to_email}}`
   - **Subject:** `{{subject}}`
   - **Content:** switch the editor to its **code/HTML** view and put just:
     ```
     {{{html}}}
     ```
     (triple braces = insert raw HTML — this drops the full invoice in)
   - Save → note the **Template ID** (e.g. `template_xxx`).
4. **Account → General → Public Key** → copy it.
5. Put all three in `.env`:
   ```
   VITE_EMAILJS_SERVICE_ID=service_xxx
   VITE_EMAILJS_TEMPLATE_ID=template_xxx
   VITE_EMAILJS_PUBLIC_KEY=your_public_key
   ```
6. Restart `npm run dev` (Vite reads env at startup), then place a test order,
   pay with **G Pay / Card**, and enter an email.

## Template params the app sends
`to_email`, `subject`, `html` (the full invoice), plus `customer_name` and
`order_id` if you want to reference them in the subject/body.

## Notes
- The Public Key is safe to expose in the client — that's how EmailJS works. To
  prevent abuse, turn on **allowed domains** in EmailJS settings (add your
  Vercel domain + `localhost`).
- If a send fails, the browser console logs `Could not send invoice email: …`
  with the EmailJS error text.
