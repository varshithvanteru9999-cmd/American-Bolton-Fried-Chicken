// Shared definition of the documentation screenshots.
// - scripts/capture-docs-screenshots.js  auto-grabs the feasible ones.
// - scripts/build-doc-html.js            embeds <file> into the HTML when present.
//
// capture.type: 'auto' (Playwright can grab it) | 'manual' (capture by hand).
// device: 'mobile' (390x844) or 'desktop' (1366x900).

export const screenshots = [
  { num: 1, file: '01-storefront-mobile.png', caption: 'Customer storefront / Order Now (mobile)', device: 'mobile',
    capture: { type: 'auto', route: '/' } },
  { num: 2, file: '02-item-modal.png', caption: 'Category items with the item / add-on modal', device: 'desktop',
    capture: { type: 'auto', route: '/', openFirstItem: true } },
  { num: 3, file: '03-cart-drawer.png', caption: 'Cart drawer & basket', device: 'desktop',
    capture: { type: 'auto', route: '/', addToCart: true, openCart: true } },
  { num: 4, file: '04-checkout.png', caption: 'Checkout — contact details, coupon code & payment', device: 'desktop',
    capture: { type: 'auto', route: '/', addToCart: true, goCheckout: true } },
  { num: 5, file: '05-reviews.png', caption: 'Reviews page (genuine customer reviews)', device: 'desktop',
    capture: { type: 'auto', route: '/review' } },
  { num: 6, file: '06-account.png', caption: 'Customer Account — Profile (via the More tab)', device: 'desktop',
    capture: { type: 'manual', note: 'Sign in as a customer, open More → Account, capture the Profile screen.' } },
  { num: 7, file: '07-admin-login.png', caption: 'Admin login', device: 'desktop',
    capture: { type: 'auto', route: '/admin/login' } },
  { num: 8, file: '08-admin-dashboard.png', caption: "Admin Dashboard — today's orders + KPIs", device: 'desktop',
    capture: { type: 'auto', route: '/admin', requiresLogin: true } },
  { num: 9, file: '09-admin-orders.png', caption: 'Admin Total Orders — history, date filter, revenue', device: 'desktop',
    capture: { type: 'auto', route: '/admin', requiresLogin: true, clickTab: 'Total Orders' } },
  { num: 10, file: '10-admin-billing.png', caption: 'Admin Billing — in-store bill builder', device: 'desktop',
    capture: { type: 'auto', route: '/admin', requiresLogin: true, clickTab: 'Billing' } },
  { num: 11, file: '11-admin-menu.png', caption: 'Admin Menu Manager + Edit Product dialog', device: 'desktop',
    capture: { type: 'auto', route: '/admin', requiresLogin: true, clickTab: 'Menu' } },
  { num: 12, file: '12-admin-discounts.png', caption: 'Admin Discounts — promo code manager', device: 'desktop',
    capture: { type: 'auto', route: '/admin', requiresLogin: true, clickTab: 'Discounts' } },
  { num: 13, file: '13-viva-payment.png', caption: 'Viva.com hosted payment page (Card / Google Pay / Apple Pay)', device: 'desktop',
    capture: { type: 'manual', note: 'External Viva.com page — capture during a real/demo checkout.' } },
  { num: 14, file: '14-email-invoice.png', caption: 'Branded email invoice received by the customer', device: 'desktop',
    capture: { type: 'manual', note: 'Capture from the inbox after a successful order.' } },
  { num: 15, file: '15-install-prompt.png', caption: '"Install App" prompt + installed home-screen icon', device: 'mobile',
    capture: { type: 'manual', note: 'OS install dialog / home-screen icon — capture on a real device.' } },
  { num: 16, file: '16-push-notification.png', caption: 'Admin background push notification (with sound)', device: 'mobile',
    capture: { type: 'manual', note: 'OS notification — capture on the admin device.' } },
];

export const DEVICES = {
  mobile: { width: 390, height: 844 },
  desktop: { width: 1366, height: 900 },
};

export const OUT_DIR = 'docs/screenshots';
