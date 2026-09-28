/* Builds a styled, print-ready HTML version of the client documentation from the
 * single Markdown source (docs/PROJECT_DOCUMENTATION.md).
 *
 *   node scripts/build-doc-html.js
 *
 * Output: docs/PROJECT_DOCUMENTATION.html
 * To make a PDF: open that file in Chrome/Edge → Print → "Save as PDF"
 * (A4, default margins, "Background graphics" ON).
 *
 * Any screenshots present in docs/screenshots/ are embedded automatically; the
 * rest render as neat "to be added" placeholders.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { marked } from 'marked';
import { screenshots, OUT_DIR } from './docs-screenshots.config.js';

const MD = 'docs/PROJECT_DOCUMENTATION.md';
const HTML = 'docs/PROJECT_DOCUMENTATION.html';
const LOGO = 'https://favouritechickenms.online/Logo.png';

marked.setOptions({ gfm: true, breaks: false });

let md = readFileSync(MD, 'utf8');

// Replace each "> 📸 **Screenshot N**" placeholder with an embedded figure
// (if the image exists) or a styled pending placeholder.
for (const s of screenshots) {
  const placeholder = `> 📸 **Screenshot ${s.num}**`;
  const imgPath = `${OUT_DIR}/${s.file}`;
  const rel = `screenshots/${s.file}`; // relative to docs/PROJECT_DOCUMENTATION.html
  const replacement = existsSync(imgPath)
    ? `<figure class="shot"><img src="${rel}" alt="${s.caption}"/><figcaption>Figure ${s.num} — ${s.caption}</figcaption></figure>`
    : `<div class="shot-pending"><span class="shot-cam">📸</span> Screenshot ${s.num} — ${s.caption} <em>(image to be added)</em></div>`;
  md = md.split(placeholder).join(replacement);
}

const body = marked.parse(md);

const css = `
  :root { --red:#e31837; --navy:#1b2a4a; --ink:#222; --muted:#667; --line:#e6e6ea; --soft:#f7f8fa; }
  * { box-sizing: border-box; }
  body { font-family: 'Poppins','Segoe UI',Arial,sans-serif; color:var(--ink); line-height:1.6;
         max-width: 900px; margin: 0 auto; padding: 0 28px 60px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  /* Cover */
  .cover { text-align:center; padding: 90px 20px 80px; page-break-after: always; }
  .cover img { height: 96px; width:auto; margin-bottom: 24px; }
  .cover h1 { font-size: 2.4rem; color: var(--navy); margin: 0 0 6px; }
  .cover .sub { font-size: 1.15rem; color: var(--red); font-weight:600; margin: 0 0 28px; }
  .cover .url { font-size: 1rem; color: var(--muted); }
  .cover .meta { margin-top: 40px; font-size: .9rem; color: var(--muted); }
  .cover .rule { width: 64px; height: 4px; background: var(--red); border-radius: 4px; margin: 18px auto 26px; }
  /* Cover: developed-by VEXLOR */
  .cover-vexlor { display: inline-flex; flex-direction: column; align-items: center; gap: 6px; margin-top: 54px; text-decoration: none; }
  .cover-by { font-size: .8rem; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
  .cover-vexlor img { height: 110px; width: auto; margin: 0; }
  .cover-vexlor-url { font-size: .95rem; color: var(--red); font-weight: 600; }
  /* In-body VEXLOR logo (section 16) */
  main p a img { width: 200px; height: auto; display: block; margin: 10px 0 4px; }
  /* Headings */
  h1,h2,h3,h4 { color: var(--navy); line-height:1.25; }
  h2 { font-size: 1.5rem; border-bottom: 2px solid var(--red); padding-bottom: 6px; margin-top: 2.2em; page-break-after: avoid; }
  h3 { font-size: 1.18rem; margin-top: 1.6em; page-break-after: avoid; }
  h4 { font-size: 1.02rem; color: var(--red); }
  /* Tables */
  table { border-collapse: collapse; width: 100%; margin: 14px 0; font-size: .92rem; page-break-inside: avoid; }
  th,td { border: 1px solid var(--line); padding: 8px 10px; text-align: left; vertical-align: top; }
  th { background: var(--navy); color:#fff; }
  tr:nth-child(even) td { background: var(--soft); }
  /* Code / diagram */
  pre { background:#0f1525; color:#cde3ff; padding:16px; border-radius:8px; overflow:auto; font-size:.8rem; line-height:1.4; page-break-inside: avoid; }
  code { font-family: 'Consolas','SF Mono',Menlo,monospace; }
  p code, li code, td code { background:#eef0f4; color:#b0143a; padding:1px 5px; border-radius:4px; font-size:.86em; }
  /* Blockquotes / callouts */
  blockquote { border-left: 4px solid var(--red); background: var(--soft); margin: 16px 0; padding: 10px 16px; color:#444; border-radius: 0 6px 6px 0; }
  /* Lists */
  ul,ol { padding-left: 1.3em; }
  li { margin: 4px 0; }
  hr { border:none; border-top:1px solid var(--line); margin: 30px 0; }
  a { color: var(--red); text-decoration: none; }
  /* Screenshots */
  figure.shot { margin: 18px 0; text-align:center; page-break-inside: avoid; }
  figure.shot img { max-width: 100%; border: 1px solid var(--line); border-radius: 8px; box-shadow: 0 4px 14px rgba(0,0,0,.08); }
  figure.shot figcaption { font-size: .85rem; color: var(--muted); margin-top: 8px; font-style: italic; }
  .shot-pending { border: 2px dashed var(--red); background:#fff5f6; color: var(--navy); border-radius: 8px;
                  padding: 22px; text-align:center; margin: 18px 0; font-size:.92rem; }
  .shot-pending .shot-cam { font-size: 1.2rem; }
  @page { size: A4; margin: 16mm 14mm; }
  @media print { body { padding: 0; max-width: none; } a { color: var(--ink); } }
`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Favourite Chicken M's — Technical Delivery Documentation</title>
<style>${css}</style>
</head>
<body>
  <section class="cover">
    <img src="${LOGO}" alt="Favourite Chicken M's"/>
    <h1>Favourite Chicken M's</h1>
    <div class="rule"></div>
    <p class="sub">Online Ordering Platform — Final Technical Delivery Documentation</p>
    <p class="url">https://favouritechickenms.online</p>
    <p class="meta">Customer Platform &nbsp;·&nbsp; Admin Platform &nbsp;·&nbsp; PWA (iOS · Android · macOS · Windows)<br/>
    Live in production</p>
    <a class="cover-vexlor" href="https://vexlor.in/" target="_blank" rel="noopener">
      <span class="cover-by">Designed &amp; developed by</span>
      <img src="vexlor-logo.webp" alt="VEXLOR — Explore What's Next" />
      <span class="cover-vexlor-url">https://vexlor.in/</span>
    </a>
  </section>
  <main>
    ${body}
  </main>
</body>
</html>`;

writeFileSync(HTML, html, 'utf8');
const embedded = screenshots.filter(s => existsSync(`${OUT_DIR}/${s.file}`)).length;
console.log(`✓ Built ${HTML}`);
console.log(`  Screenshots embedded: ${embedded}/${screenshots.length}`);
console.log(`  Make a PDF: open ${HTML} in Chrome/Edge → Print → Save as PDF (A4, Background graphics ON).`);
