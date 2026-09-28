# Favourite Chicken M's — Online Ordering Platform
### Final Technical Delivery Documentation

**Live site:** https://favouritechickenms.online
**Developed by:** [VEXLOR — Explore What's Next](https://vexlor.in/) · https://vexlor.in/
**Status:** ✅ Live in production (customer platform + admin platform, fully delivered)

> This document is the complete, final technical reference for the Favourite
> Chicken M's platform — every integration, modification and technology
> delivered across the **Customer Interface** and the **Admin Interface**,
> including the **Billing System**, **Coupons & Discounts**, **Reviews**,
> **Customer Accounts**, payments, database, notifications, cross-platform PWA,
> performance engineering and production deployment.
>
> The entire product — frontend, backend, database, design, payments and
> deployment — was designed and built by **VEXLOR** ( https://vexlor.in/ ).

---

## 📸 Screenshot Index

| # | Screen | Section |
|---|--------|---------|
| 1 | Customer storefront / Order Now (mobile) | §4.1 |
| 2 | Item + add-on customisation modal | §4.2 |
| 3 | Cart drawer & basket | §4.3 |
| 4 | Checkout — contact, coupon & payment | §4.4 |
| 5 | Reviews page (genuine reviews) | §4.5 |
| 6 | Customer Account (via More) | §4.6 |
| 7 | Admin login | §5.1 |
| 8 | Admin Dashboard (today + KPIs) | §5.2 |
| 9 | Admin Total Orders (history + revenue) | §5.3 |
| 10 | Admin **Billing System** | §5.5 |
| 11 | Admin Menu Manager + Edit Product | §5.6 |
| 12 | Admin **Discounts / Promo Codes** | §5.7 |
| 13 | Viva.com hosted payment page | §6 |
| 14 | Email invoice received by customer | §8 |
| 15 | "Install App" + home-screen icon | §10 |
| 16 | Admin background push notification | §9 |

---

## 1. Executive Summary

Favourite Chicken M's has been delivered by **VEXLOR** as a modern, installable
**Progressive Web Application (PWA)** providing a complete **online food-ordering
experience** for customers and a full, real-time **back-office Admin Dashboard**
for the restaurant. It is **live in production**, served over HTTPS, and operates
as a real end-to-end system — **live card payments**, **email invoices**,
**real-time order alerts**, **background push notifications**, an **in-store
billing system**, **coupons & discounts**, **customer reviews** and **customer
accounts**.

The same codebase installs as a **native-feeling app on iOS, Android, macOS and
Windows** directly from the browser, with no app-store dependency.

**Delivered — at a glance:**

- ✅ Full customer ordering journey (browse → customise → cart → checkout → pay → invoice)
- ✅ Live payment gateway (**Viva.com** — Cards, Google Pay, Apple Pay)
- ✅ Cloud database & authentication (**Google Firebase** — Firestore + Auth)
- ✅ Automated **email invoicing** (EmailJS)
- ✅ Real-time **Admin Dashboard** — live order feed, KPIs, customers & menu management
- ✅ **Billing System** — in-store/counter billing with per-item packed photos
- ✅ **Coupons & Discounts** manager — promo codes validated live at checkout
- ✅ **Reviews** page with genuine customer reviews
- ✅ **Customer Accounts** — profile, reorder, address book, saved-cards
- ✅ **Web Push** background notifications with sound to the restaurant
- ✅ Installable **PWA** across iOS / Android / macOS / Windows with offline support
- ✅ **Premium, glassy UI** with a custom brand background across customer + admin
- ✅ **Performance-engineered** mobile load (image optimisation, code-splitting, instant-paint shell)
- ✅ Production **deployment** on Node.js hosting with a version-controlled release pipeline

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend framework** | React 19 | Component-based single-page application (SPA) |
| **Build tool / bundler** | Vite 8 | Production builds, code-splitting, asset fingerprinting |
| **Routing** | React Router v7 | Client-side navigation (no full-page reloads) |
| **UI icons** | lucide-react | Lightweight, scalable vector icon set |
| **State management** | React Context API | Global cart, auth, menu, coupons & reviews state (localStorage-persisted) |
| **PWA engine** | vite-plugin-pwa + Workbox | Service worker, offline caching, installability |
| **Database** | Google Cloud Firestore | Real-time NoSQL store (orders, users, menu, coupons, reviews) |
| **Authentication** | Firebase Authentication | Google sign-in (OAuth 2.0) |
| **Email** | EmailJS | Browser-triggered transactional invoice emails |
| **Payments** | Viva.com Smart/Redirect Checkout | PCI-DSS-compliant hosted card payments |
| **Push notifications** | Web Push API + VAPID + web-push | Background notifications to the admin device |
| **Backend runtime** | Node.js (zero-dependency HTTP server) | Serves the app + payment & push API endpoints |
| **Hosting** | Hostinger (Node.js Web App, Node 20) | Production hosting over HTTPS |
| **Version control / CI-CD** | Git / GitHub + Hostinger Deployments | Source control & build-and-release pipeline |
| **Image pipeline** | sharp (build-time) → WebP | Optimised, responsive imagery |
| **Styling** | Vanilla CSS (mobile-first, responsive, glassmorphism) | Pixel-accurate, dependency-free styling |

---

## 3. System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         CUSTOMER DEVICE                            │
│   (installed PWA or browser — iOS / Android / macOS / Windows)     │
│   React SPA  ──►  Service Worker (offline cache + push handler)    │
└───────────┬───────────────────────────────────┬──────────────────┘
            │ HTTPS                               │ Web Push
            ▼                                     ▼
┌───────────────────────────┐        ┌──────────────────────────────┐
│   Node.js Server (Host)    │        │   Push Service (browser/OS)   │
│  • Serves the built app    │        │   delivers background alerts  │
│  • /api/viva/*  (payments) │        └──────────────────────────────┘
│  • /api/push/*  (notify)   │
└──────┬─────────────┬───────┘
       │             │
       ▼             ▼
┌───────────────┐  ┌───────────────────────────────────────────────┐
│  Viva.com     │  │   Google Firebase                              │
│  Payment API  │  │  • Firestore (orders, users, menu, coupons,    │
└───────────────┘  │    reviews, push subscriptions)                │
                   │  • Authentication (Google OAuth 2.0)           │
                   └───────────────────────────────────────────────┘
                              ▲
┌──────────────────────────────────────────────────────────────────┐
│                          ADMIN DEVICE                              │
│   (separate installed Admin PWA → opens straight into /admin)      │
│   Live orders · billing · menu · coupons · push + sound alerts     │
└──────────────────────────────────────────────────────────────────┘
```

**Key architectural decisions (by VEXLOR):**

- **Single codebase, two installable apps** — the storefront and the admin
  dashboard share one deployment but expose **two separate PWA manifests**.
  Installing from the storefront installs the **customer app**; installing from
  `/admin` installs the **admin app**, which launches directly into the dashboard.
- **Server-side secrets** — payment API keys and push private keys live **only**
  in server environment variables, never in the browser bundle.
- **Real-time data** — the admin order feed uses Firestore's live subscription
  (`onSnapshot`), so new orders appear **instantly** without refreshing.
- **Resilience** — coupons and reviews use a Firestore source of truth with a
  **localStorage fallback**, so the experience degrades gracefully.

---

## 4. Customer Interface

### 4.1 Storefront / "Order Now" (Home)
> 📸 **Screenshot 1**

- Mobile-first storefront with a **custom brand banner** (device-specific artwork
  for desktop and mobile) and a compact **store-info card** (with a location pin).
- **Delivery / Pickup toggle** with an animated sliding pill.
- **Category navigation:** mobile vertical drill-down (`Category → items → Back`);
  desktop sticky sidebar with **scroll-spy** highlighting the in-view category.
- **Live menu search** across all items.
- **Store-hours awareness** (UK / Europe-London time, independent of device clock):
  **11:00–23:00** open · **10:00–11:00** pre-order window · **23:00–10:00** closed.
- **In-app "Install App"** call-to-action (no third-party store badges).

### 4.2 Item Customisation & Add-ons
> 📸 **Screenshot 2**

- Item detail modal with image, description and price.
- **Add-on / option groups**, data-driven and admin-overridable:
  - **"Please Select (Required)"** — circular single-select groups (e.g. a
    required drink on Family Treats, excluding the Wings Bucket).
  - **"Please Select (Optional)"** — rounded-square, individually priced extras.
  - **On-skip validation warnings** before adding to cart.
- **"Item Unavailable"** state — disabled items remain visible, clearly marked.

### 4.3 Cart & Basket
> 📸 **Screenshot 3**

- Global cart (React Context) with **localStorage persistence** — survives
  refreshes and app restarts.
- App-level **floating basket tab** + **sliding cart drawer**, per-line quantity
  controls and live totals.

### 4.4 Checkout & Coupons
> 📸 **Screenshot 4**

- **Sign-in optional** — guests check out with just an **email or mobile number**.
- **First-order discount** — signed-in customers get **20% off their first order**.
- **Coupon code box** above Payment Options — validates the entered code **live**
  against admin-created promo codes (active, not expired, minimum order, usage
  limit, optional max-discount cap), auto-calculates the discount, and shows it
  in the basket and on the invoice.
- Order summary with subtotal, discount and total — all prices in **GBP (£)**.
- On verified payment the order is **placed automatically** with a confirmation toast.

### 4.5 Reviews
> 📸 **Screenshot 5**

- A dedicated **Reviews** page presenting **genuine customer reviews** (names,
  star ratings, comments, source tags and the owner's responses), with an
  aggregate rating, total count and **star-rating filters**.

### 4.6 Customer Account (via "More")
> 📸 **Screenshot 6**

Tapping **More** opens the customer account area (sign-in required):

- **Profile** — first/last name, phone (with validation), email, save changes,
  email marketing preference, and **Advance Options** (Export My Data, Delete Account).
- **Reorder** — one-tap re-add of previously ordered items.
- **Address Book** — add and remove saved delivery addresses.
- **Saved Cards** — cards are entered securely at checkout via the payment provider.

### 4.7 Supporting Pages
**About**, **Reviews**, **Reorder**, **Allergy Information**, **Terms &
Conditions**, **Terms of Use**, and **Privacy Policy**.

---

## 5. Admin Interface (`/admin`)

A secure, premium, single-page back office for the restaurant.

### 5.1 Secure Admin Login
> 📸 **Screenshot 7**

- Access restricted by an **email allowlist** (admin accounts only).
- The installed **Admin PWA** launches straight into the dashboard.

### 5.2 Dashboard — Today at a Glance
> 📸 **Screenshot 8**

- Shows **only today's orders and upcoming pre-orders** for a clean operational view.
- **Real-time order feed** (Firestore `onSnapshot`) — new orders appear live.
- **Audible + on-screen alert** on each new order (see §9).
- Each order shows customer **name, email/phone, items, options, discount, total**,
  payment status, and a **packed-photo** upload (a "+" beside Delete) so staff can
  attach a photo of the packed order, viewable in an in-app popup.

### 5.3 Total Orders — Full History & Revenue
> 📸 **Screenshot 9**

- Complete order history across all customers and **channels** (online + in-store).
- **From / To date-range filter**.
- **Business KPIs:** **Total Customers** (unique), **Total Orders**, **Total Revenue**.
- In-store bills are tagged with a distinct **"Billing"** label vs Pickup/Delivery.

### 5.4 Customers
- Customer list aggregated from order activity (name, contact, order count).

### 5.5 Billing System (In-store / Counter) — Delivered
> 📸 **Screenshot 10**

A complete point-of-sale style billing screen:

- Items shown **grouped by category** as image tiles (with the same toolbar as
  Menu — **search, category filter, Add Category, Add Item**).
- Tap a tile to add it to the **Current Bill** on the right; set a **price per
  line**, adjust **quantity**, and see the **live total** in **GBP (£)**.
- **Optional customer name, email and phone** on the bill.
- **Packed-item photos** — per line and a bill-level header upload.
- **Generate Bill** → payment-method popup (**Cash / Card**) → the bill is
  **saved as an order** (so it appears in Total Orders & Revenue, tagged
  "Billing"), the **invoice is emailed** when an email is provided, and a
  **printable receipt** is offered.
- **Mobile-optimised** with a floating "Current Bill" basket that scrolls to the bill.

### 5.6 Menu Manager
> 📸 **Screenshot 11**

- **Category filter**, **Add Category**, **Add Item**, per-category **availability toggle**, **rename/delete** categories.
- **Edit Product** dialog — name, price, description, image, move category;
  **add-on builder** (Required single-select + Optional priced groups);
  **Visibility** control + **Hidden Products** filter.
- **Per-item image upload** (resized in-browser). Changes reflect **live** on the storefront.

### 5.7 Discounts / Promo Codes — Delivered
> 📸 **Screenshot 12**

- **Promo Codes & Discounts** table — **Code · Discount · Min Order · Uses ·
  Expiry · Status · Actions**.
- **New Promo Code / Edit** opens a full sectioned form — code (auto-uppercased),
  description, discount **type (% or £)** + value, **minimum order**, **max
  discount cap (% only)**, **max uses**, **valid until**.
- **Enable / Disable / Delete**; status auto-derives (Active / Expired / Disabled);
  **use count** auto-increments when a code is redeemed at checkout.

### 5.8 Admin UX
- Slim, **collapsible sidebar**; fixed content area.
- **Premium glassmorphism** theme with the brand background, gold accents, and
  motion (see §12).
- All confirmations/notifications use polished **SweetAlert2** dialogs + toasts —
  **no raw browser pop-ups** anywhere.

---

## 6. Payment Integration — Viva.com
> 📸 **Screenshot 13**

A real, production payment gateway (not a simulation).

- **Provider:** Viva.com (Viva Wallet) — a licensed European acquirer.
- **Methods:** Card payments, **Google Pay** and **Apple Pay**.
- **Flow (Redirect / Smart Checkout):** server creates a Viva payment order
  (Merchant ID + API Key, Basic auth) → customer pays on **Viva's PCI-DSS hosted
  page** (card details never touch our servers) → server **verifies** the
  transaction → order is **auto-placed** and the invoice emailed.
- **Environment-switchable** between **demo (test)** and **production (live money)**.
- **Security:** all payment secrets live **only** in server environment variables.

---

## 7. Authentication & Cloud Data — Firebase

- **Authentication:** Google sign-in via **Firebase Authentication (OAuth 2.0)**.
  Optional for ordering; unlocks order history, accounts and the first-order discount.
- **Database — Cloud Firestore (real-time NoSQL):**
  - `orders` — every placed order (guest, signed-in, or in-store billing).
  - `users/{uid}` & `users/{uid}/orders` — customer profiles & history.
  - `menuConfig`, `customMenuItems`, `customCategories`, `categoryConfig` — live menu.
  - `coupons` — admin promo codes.
  - `reviews` — customer reviews.
  - `pushSubs` — admin devices subscribed to background notifications.
- **Security rules** restrict sensitive order/menu read/write to admin accounts,
  while allowing guests to place orders and the public to read menu/coupons/reviews.

---

## 8. Email Invoicing — EmailJS
> 📸 **Screenshot 14**

- On a **successful payment** (online or in-store with an email), the customer is
  emailed a **branded HTML invoice**.
- Email-safe **table layout with inline styles** (renders across Gmail, Outlook,
  Apple Mail) — logo, itemised lines, options, discount, totals and amount paid.
- Triggered client-side via **EmailJS** — no separate mail server.

---

## 9. Real-Time & Background Notifications
> 📸 **Screenshot 16**

1. **In-app real-time alert (app open):** a **two-tone beep** (Web Audio API) +
   on-screen alert the instant an order arrives (Firestore live subscription).
2. **Background push (app closed):** via the **Web Push API + VAPID keys** and a
   **service-worker push handler**, the restaurant's device gets an OS-level
   notification **with sound and vibration even when the admin app is closed** —
   exactly like a native app. Tapping it opens the dashboard.
- Delivered to all subscribed admin devices via `/api/push/notify` (web-push +
  VAPID); the push **private key** is held only on the server.

---

## 10. Cross-Platform & PWA (iOS · Android · macOS · Windows)
> 📸 **Screenshot 15**

A fully installable **Progressive Web App** delivering a native-like experience
on every major platform from one codebase — no app-store submission required.

| Platform | Capability |
|----------|-----------|
| **Android** | One-tap "Install App" to home screen; standalone full-screen; background push with sound & vibration; offline. |
| **iOS / iPadOS** | Add to Home Screen via Share (guided in-app); full-screen standalone; apple-touch-icon & splash. |
| **Windows** | Installable from Chrome/Edge or the in-app button; standalone desktop window. |
| **macOS** | Installable from Chrome/Edge; standalone window with dock icon. |

- **Complete Web App Manifest** — name, theme colour, icons (192 / 512 / maskable), apple-touch-icon.
- **Two separate installs** — customer app (`/`) and admin app (`/admin/login`).
- **In-app "Install App"** buttons (navbar + footer) with guided iOS fallback; auto-hide once installed.
- **Offline support** — Workbox service worker pre-caches the app shell, menu & images.
- **Auto-update** on every new deploy; **cart persistence** across sessions.

---

## 11. Performance Engineering

VEXLOR engineered the mobile load specifically (Google PageSpeed mobile improved
from **59 → 95+**):

- **Image optimisation** — all menu photos resized + recompressed (≈ **34.5 MB →
  4.3 MB**); backgrounds and banners converted to **WebP**; mobile-specific
  lighter banner/background for a fast Largest Contentful Paint.
- **Code-splitting** — every route except the home page is lazy-loaded; vendor
  libraries (Firebase / React / SweetAlert) are split into **parallel chunks**
  (app code chunk **881 KB → 82 KB**).
- **Instant-paint static shell** — the above-the-fold banner is rendered from
  static HTML with inline critical CSS, so first paint doesn't wait for the JS.
- **Resource hints** — banner **preload**, Firebase **preconnect**, **async fonts**.
- **Lazy-loaded** below-the-fold images (`loading="lazy"`).
- **Edge/HTTPS delivery** with content-hash fingerprinting + service-worker
  precaching for instant repeat loads and offline use.

---

## 12. Premium UI / UX Design

- A **custom brand background** runs across both the customer site and the admin
  portal (device-specific, dimmed with a tasteful overlay).
- **Glassmorphism** — translucent, blurred sidebar, top bar, panels and cards.
- **Gold accent system** — active navigation, KPI icons, status highlights.
- **Motion & depth** — hover lifts, soft shadows, gradient primary buttons, and
  themed scrollbars across admin and customer surfaces.
- Mobile-first responsive layouts verified across phone, tablet and desktop.

---

## 13. Deployment, Hosting & Release Pipeline (CI/CD)

- **Hosting:** **Hostinger Node.js Web App** (Node 20) over HTTPS on
  **favouritechickenms.online**.
- **Backend:** a lightweight **zero-dependency Node.js HTTP server** (`server.js`)
  that serves the SPA (with fallback routing) and exposes the **Viva** and **push**
  API endpoints.
- **Configuration via environment variables** (off the client, out of source).
- **Version control:** full **Git / GitHub** history; deployed via **Hostinger
  Deployments** (build + release), with Git-based auto-deploy available.

---

## 14. Security & Compliance Highlights

- **PCI-DSS:** card data handled entirely on **Viva.com's hosted pages** — never on our servers/DB.
- **Secret management:** payment & push private keys live **only** in server env vars.
- **Authentication:** Google OAuth 2.0 (Firebase); admin restricted by email allowlist.
- **Database rules:** Firestore rules limit sensitive reads/writes to admins.
- **Transport:** entire site over **HTTPS/TLS**.

---

## 15. Appendix

### 15.1 Customer Route Map
| Route | Page |
|-------|------|
| `/` | Order Now (storefront) |
| `/category/:name` | Category page |
| `/checkout` | Checkout & payment (with coupon) |
| `/account` | Customer Account (Profile · Reorder · Address Book · Saved Cards) |
| `/reorder` | Re-order previous orders |
| `/about` · `/review` | About · Reviews |
| `/allergy-info` · `/terms` · `/terms-of-use` · `/privacy` | Legal pages |

### 15.2 Admin Route Map
| Route | Page |
|-------|------|
| `/admin/login` | Admin login |
| `/admin` | Dashboard · Total Orders · **Billing** · Menu · Customers · **Discounts** |

### 15.3 Cloud Data Collections (Firestore)
`orders` · `users/{uid}` · `users/{uid}/orders` · `menuConfig` ·
`customMenuItems` · `customCategories` · `categoryConfig` · `coupons` ·
`reviews` · `pushSubs`

### 15.4 Glossary
- **PWA** — installable, app-like website with offline support & home-screen presence.
- **SPA** — single-page app; updates content without full reloads.
- **Service Worker** — background script enabling offline caching and push.
- **VAPID** — key standard authenticating Web Push notifications.
- **PCI-DSS** — global security standard for handling card payments.
- **OAuth 2.0** — industry-standard secure sign-in (Google sign-in).
- **LCP / FCP** — Largest / First Contentful Paint (Google performance metrics).
- **CI/CD** — automated, repeatable build-and-release pipeline.

---

## 16. Developed by VEXLOR

[![VEXLOR — Explore What's Next](vexlor-logo.webp)](https://vexlor.in/)

The **complete design and development** of the Favourite Chicken M's platform —
**frontend, backend, database architecture, payment integration, real-time
systems, PWA, performance engineering, premium UI design and production
deployment** — was delivered by **VEXLOR**.

**VEXLOR — Explore What's Next** · 🔗 **https://vexlor.in/**

---

*Document generated from the live production codebase of
https://favouritechickenms.online. All features listed above are implemented and
deployed in production.*
