import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const viewports = [
  { width: 412, height: 915,  label: '412' }, // Samsung Galaxy S20 Ultra
  { width: 390, height: 844,  label: '390' }, // iPhone 14
  { width: 375, height: 844,  label: '375' }, // iPhone SE
  { width: 360, height: 800,  label: '360' }, // Small Android
];

const targets = [
  { url: 'https://favouritechickenms.co.uk', dir: 'screenshots/live' },
  { url: 'http://localhost:5173',            dir: 'screenshots/local' },
];

console.log('Launching browser…');
const browser = await chromium.launch();

for (const target of targets) {
  mkdirSync(target.dir, { recursive: true });
  console.log(`\nCapturing ${target.url}`);

  for (const vp of viewports) {
    const page = await browser.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });
    try {
      await page.goto(target.url, { waitUntil: 'networkidle', timeout: 30000 });
      // Let any CSS transitions settle
      await page.waitForTimeout(800);
      const path = `${target.dir}/${vp.label}.png`;
      await page.screenshot({ path, fullPage: false });
      console.log(`  ✓ ${path}`);
    } catch (err) {
      console.warn(`  ✗ ${vp.label}px — ${err.message}`);
    }
    await page.close();
  }
}

await browser.close();
console.log('\nDone. Screenshots saved to screenshots/live/ and screenshots/local/');
