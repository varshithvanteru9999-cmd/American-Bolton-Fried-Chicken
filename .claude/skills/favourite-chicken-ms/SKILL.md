---
name: favourite-chicken-ms
description: Mandatory project rules for the Favourite Chicken M's (Chelmsford) clone. Use this skill for EVERY task in this repository — UI changes, new pages, menu data edits, cart/checkout work, PWA configuration, styling, or audits. It defines the design rules, currency rules, mobile-first requirements, data source priority, workflow, verification steps, and accuracy scoring that all changes must follow.
---

# Favourite Chicken M's — Clone Project Rules

## 1. Project Overview
- Client: UK-based (London). Target site to clone: https://favouritechickenms.co.uk/ (Chelmsford branch).
- **Phase 1 (current):** exact visual + interactive clone for client approval. All UI interactions must behave identically to the original: cart, category navigation, offers modal, delivery/pickup toggle, item customization, table booking UI, reviews UI, checkout UI.
- Authentication, payments, postcode lookup, loyalty points, and real order placement are **simulated** in Phase 1 (UI, validation, and animations must still be pixel-identical; simulate a successful flow).
- **Phase 2 (later):** real backend integrations (auth, payments, ordering) plus branding/legal modifications.
- Mobile users are the primary audience. The clone is judged on mobile FIRST, desktop second.

## 2. Technology Stack
- React 19 + Vite SPA, react-router-dom v7, lucide-react icons.
- Styling: vanilla CSS only (no Tailwind). Co-located CSS per page; global tokens in `src/index.css`.
- PWA via `vite-plugin-pwa`.
- Cart state: React Context with localStorage persistence (migrate away from prop drilling in App.jsx).
- Menu data: `src/data/menuData.js` is the single source of truth in code.

## 3. Menu Data Source Priority (on any conflict, higher wins)
1. **Client-provided reference images** — always win. Category order, item order, pricing, descriptions, and modifiers must match these exactly. Clients often provide future menu updates not yet on the live site.
2. `extracted_config.json` (scraped Foodhub store config).
3. The live website.

## 4. Currency Rule (globally enforced)
- Remove the `£` symbol EVERYWHERE prices are rendered: menu items, add-ons, modifiers, item modal, cart drawer, basket summary/floating basket, delivery charge, service charge, checkout summary, order history. Render `8.95`, never `£8.95`.
- **Single exception:** promotional/offer banner wording may keep text like "Up to £25 Savings".
- Implementation rule: ALL prices must go through one shared `formatPrice()` utility. No component may hardcode a currency symbol. After any change, grep the `src/` tree for `£` — the only allowed matches are in the whitelisted offers/promo component.

## 5. Strict Design & Styling Rules
- **Global background:** fixed background image (`Background Logo.png`).
- **Whitish layer gradient:** directly below the top banner, a full-width `.order-now-page::before` linear gradient — solid `#ffffff` fading downward to transparent — sits behind the menu items and reveals the fixed background logo as the user scrolls.
- **Top banner:** spans 100% viewport width, touching both edges. Never constrain with max-width.
- **Store info card (mobile):** `width: calc(100% - 30px)`, negative `margin-top` to overlap the banner bottom. Never use `transform: translateY()` for this overlap.
- **App download banner (mobile):** below the store card. Phone graphic left; title, description, and App Store / Play Store badges stacked on the right. Clean and clear.
- **Delivery/Pickup toggle:** grey pill container with a white sliding pill animating `transition: left 0.3s` between "Delivery (30 mins)" and "Pickup (15 mins)".
- **Mobile category navigation:** NOT horizontal tabs. Full-width vertical list, each row ending with a `>` chevron. Tapping a category replaces the list with that category's items plus a sticky `< Back` header.
- PWA/mobile meta: `theme-color: #000000`, viewport scaling restrictions, red "MS" logo for apple-touch-icon.

## 6. Pixel Matching Mode (before modifying ANY component)
- Compare against the live site first. Measure — never estimate — spacing, font sizes, font weights, border radius, shadows, and padding. Use DevTools computed values or screenshot overlays.
- If a value can't be measured, ask the client; do not guess.

## 7. Mobile-First Rule
- Mobile view is the source of truth. Desktop adapts FROM mobile.
- If a desktop improvement breaks mobile, reject the change.
- Mandatory verification viewports for every change:
  - Samsung Galaxy S20 Ultra — 412×915
  - iPhone 14 — 390×844
  - iPhone SE width — 375px
  - Small Android — 360×800
- Verify on each: sticky headers, safe-area insets, viewport height (Safari 100vh quirks), category drill-down, cart behavior, modal scrolling, PWA install.

## 8. Screenshot Verification (after every major change)
1. Take a BEFORE screenshot.
2. Take an AFTER screenshot.
3. Compare both against the live site at the same viewport.
4. List every remaining visual difference explicitly.
(Use the Playwright screenshot harness in `scripts/` if present; otherwise capture via browser DevTools device mode.)

## 9. Clone Accuracy Score (after completing each section)
Score the completed section and report:

| Area | Score |
|---|---|
| Layout | /100 |
| Typography | /100 |
| Spacing | /100 |
| Mobile Accuracy | /100 |
| Animations | /100 |
| Overall Match | /100 |

Target: **95+/100 in every area** before moving to the next feature. Below 95 → iterate, don't proceed.

## 10. Page Scope (Phase 1 — all must exist and look identical)
Home / Order Now, About, Reviews, Table Booking, Offers, Cart, Checkout UI, Login modal, Registration modal, Forgot Password modal, Track Order UI, Allergy Information, Terms & Conditions, Privacy Policy. Backend behavior simulated; visual completeness is how the client judges the clone — missing pages reduce confidence immediately.

## 11. PWA Requirements (industry grade — may exceed the original here)
- Installable PWA with a complete manifest.
- Icons: 192px, 512px, maskable variant, apple-touch-icon (red MS logo), splash screen support.
- `theme_color: #000000`.
- Offline shell: app opens with cached menu and images without network.
- Cart persistence across sessions (localStorage).
- Add to Home Screen support; installed app should feel native.

## 12. Workflow (mandatory for every feature)
1. **Ask clarifying questions first** — specific questions about behavior, alignment, opacity, edge cases.
2. **Make an implementation plan** — exact files to modify and how.
3. **Execute only upon approval.**
4. **Verify mobile accuracy** at the four mandatory viewports, run screenshot verification, then report the accuracy score.

## 13. Fix Priority Order
1. Mobile UI → 2. Menu structure → 3. Cart functionality → 4. Checkout UI → 5. Remaining pages → 6. PWA improvements.

## 14. Deployment
- Target: Vercel (HTTPS).
- Every major feature must be validated on the deployed Vercel URL — not just localhost — including PWA install, Lighthouse run, mobile testing, and production build validation, before marking it complete.
