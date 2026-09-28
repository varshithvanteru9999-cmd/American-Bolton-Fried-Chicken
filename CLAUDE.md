# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server with HMR at http://localhost:5173
npm run build     # Production build to dist/
npm run preview   # Serve the production build locally
npm run lint      # Run ESLint across all JS/JSX files
```

There are no tests in this project.

## Architecture

This is a React 19 + Vite SPA that clones the Favourite Chicken M's (Chelmsford) online ordering site, powered by `react-router-dom` v7 and `lucide-react` for icons. It is configured as a PWA via `vite-plugin-pwa`.

**Routing (App.jsx):** All routes are defined in `App.jsx`, which also owns the cart state (`cartItems`, `addToCart`, `updateQuantity`) and passes it down to pages as props. The `Navbar`, `Footer`, and `BottomNav` (mobile) are all inline components in `App.jsx`. A floating basket tab and a sliding cart drawer are rendered at the app level — they appear when `totalItems > 0`.

**Pages (`src/pages/`):**
- `OrderNow.jsx` — the main ordering page (default route `/`). Owns all modal state (item detail, schedule, offers, info/login). Consumes cart props from `App`. Renders differently for desktop (sidebar + grid) vs mobile (category drill-down navigation).
- `About.jsx`, `Reviews.jsx` — static/simple pages with no shared state.

**Menu data (`src/data/menuData.js`):** Single source of truth for all menu content. Exports `categories` (ordered array), `menuItems` (flat array with `category`, `id`, `title`, `price`, `desc`, `image`, optional `addons`), and `recommendedItems`. The only add-on pattern currently used is `cheeseAddon`. Images mix Unsplash URLs with local `/images/` paths served from `public/`.

**Styling:** Each page has its own co-located CSS file. Global styles are in `src/index.css` and `src/components.css`. `src/App.css` covers navbar, footer, cart drawer, and floating basket. Responsive breakpoints use `@media` queries — the desktop layout uses a sticky left sidebar with category navigation, while mobile uses a stacked drill-down pattern.

**Public assets:** `public/` contains `Logo.png`, `favicon.svg`, `icons.svg`, and the `/images/` directory with per-category subdirectories (`BURGERS/`, `SIDES/`, `Main Meals/`, etc.) referenced directly in `menuData.js`.
