/* Captures the documentation screenshots defined in docs-screenshots.config.js.
 *
 * Usage:
 *   # Local dev server (default):
 *   npm run dev            # in one terminal
 *   node scripts/capture-docs-screenshots.js
 *
 *   # Against the live site:
 *   DOCS_URL=https://favouritechickenms.online node scripts/capture-docs-screenshots.js
 *
 *   # To auto-capture the admin screens, supply admin credentials:
 *   ADMIN_EMAIL=msfavouritechicken@gmail.com ADMIN_PASS=*** node scripts/capture-docs-screenshots.js
 *
 * 'manual' screens (Viva page, e-mail invoice, install prompt, home-screen icon,
 * OS push notification) are skipped and listed at the end — capture those by hand.
 */
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'fs';
import { screenshots, DEVICES, OUT_DIR } from './docs-screenshots.config.js';

const BASE = (process.env.DOCS_URL || 'http://localhost:5173').replace(/\/$/, '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PASS = process.env.ADMIN_PASS || '';

mkdirSync(OUT_DIR, { recursive: true });
console.log(`\nCapturing documentation screenshots from: ${BASE}`);
console.log(`Output: ${OUT_DIR}/\n`);

const browser = await chromium.launch();
const done = [];
const failed = [];
const manual = [];

// Try a list of selectors; click the first visible match. Returns true on success.
async function tryClick(page, selectors) {
  for (const sel of selectors) {
    try {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 1500 })) { await el.click(); return true; }
    } catch { /* next */ }
  }
  return false;
}

async function loginAdmin(page) {
  if (!ADMIN_EMAIL || !ADMIN_PASS) return false;
  await page.goto(`${BASE}/admin/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  try {
    await page.fill('#admin-email', ADMIN_EMAIL);
    await page.fill('#admin-pass', ADMIN_PASS);
    await page.click('.adminlogin-btn');
    await page.waitForURL('**/admin', { timeout: 15000 });
    await page.waitForTimeout(3000);
    return true;
  } catch (e) {
    console.warn(`  ! Admin login failed: ${e.message}`);
    return false;
  }
}

for (const shot of screenshots) {
  if (shot.capture.type === 'manual') {
    manual.push(shot);
    continue;
  }

  const vp = DEVICES[shot.device] || DEVICES.desktop;
  const context = await browser.newContext({
    viewport: vp,
    deviceScaleFactor: 2,
    isMobile: shot.device === 'mobile',
  });
  const page = await context.newPage();
  const outPath = `${OUT_DIR}/${shot.file}`;

  try {
    // Admin screens need a session first.
    if (shot.capture.requiresLogin) {
      const ok = await loginAdmin(page);
      if (!ok) throw new Error('admin credentials not supplied or login failed');
      if (shot.capture.clickTab) {
        await tryClick(page, [
          `button:has-text("${shot.capture.clickTab}")`,
          `a:has-text("${shot.capture.clickTab}")`,
          `[role="button"]:has-text("${shot.capture.clickTab}")`,
        ]);
        await page.waitForTimeout(1200);
      }
    } else {
      await page.goto(`${BASE}${shot.capture.route}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000); // let the React SPA render + images load
    }

    // Optional storefront interactions (best-effort).
    if (shot.capture.openFirstItem) {
      await tryClick(page, [
        '.menu-item-image', '.item-image', '.menu-item-card', '.item-card',
        '.menu-item', '[class*="menu-item"]',
      ]);
      await page.waitForTimeout(900);
    }
    if (shot.capture.addToCart) {
      // open an item, then add it
      await tryClick(page, ['.menu-item-image', '.item-image', '.menu-item', '.item-card']);
      await page.waitForTimeout(700);
      await tryClick(page, [
        'button:has-text("ADD")', 'button:has-text("Add to")', '.modal-add-btn', '.add-to-cart',
      ]);
      await page.waitForTimeout(700);
    }
    if (shot.capture.openCart) {
      await tryClick(page, [
        '.floating-basket', '.basket-tab', '.cart-toggle',
        'button:has-text("Basket")', 'button:has-text("View basket")', '[class*="basket"]',
      ]);
      await page.waitForTimeout(900);
    }
    if (shot.capture.goCheckout) {
      await page.goto(`${BASE}/checkout`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(900);
    }

    await page.screenshot({ path: outPath, fullPage: shot.device === 'mobile' });
    console.log(`  ✓ [${shot.num}] ${outPath}`);
    done.push(shot);
  } catch (e) {
    // Still try to save whatever is on screen so there's something usable.
    try { await page.screenshot({ path: outPath }); } catch { /* ignore */ }
    console.warn(`  ✗ [${shot.num}] ${shot.caption} — ${e.message}`);
    failed.push(shot);
  } finally {
    await context.close();
  }
}

await browser.close();

console.log('\n──────────── Summary ────────────');
console.log(`Auto-captured: ${done.length}`);
if (failed.length) {
  console.log(`\nNeeds attention (interaction/login may have failed) — verify these files:`);
  for (const s of failed) console.log(`  • [${s.num}] ${s.file} — ${s.caption}`);
}
console.log(`\nCapture MANUALLY (external / on-device), save into ${OUT_DIR}/ with these names:`);
for (const s of manual) console.log(`  • ${s.file} — ${s.caption}\n      ${s.capture.note}`);
console.log(`\nThen run:  node scripts/build-doc-html.js   to embed them into the HTML/PDF.`);
console.log('─────────────────────────────────\n');
