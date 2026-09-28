/* Renders docs/PROJECT_DOCUMENTATION.html to a print-ready PDF using headless
 * Chromium (Playwright). Run `node scripts/build-doc-html.js` first.
 *
 *   node scripts/build-doc-pdf.js
 *
 * Output: docs/PROJECT_DOCUMENTATION.pdf
 */
import { chromium } from 'playwright';
import path from 'path';
import { existsSync } from 'fs';

const htmlPath = path.resolve('docs/PROJECT_DOCUMENTATION.html');
if (!existsSync(htmlPath)) {
  console.error('docs/PROJECT_DOCUMENTATION.html not found — run: node scripts/build-doc-html.js');
  process.exit(1);
}
const url = 'file://' + htmlPath.split(path.sep).join('/');

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(url, { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(1500); // let the remote logo + images settle
await page.pdf({
  path: 'docs/PROJECT_DOCUMENTATION.pdf',
  format: 'A4',
  printBackground: true,
  margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' },
});
await browser.close();
console.log('✓ Built docs/PROJECT_DOCUMENTATION.pdf');
