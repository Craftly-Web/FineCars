// Erzeugt die Raster-Grafiken (Favicons, Open-Graph-Bild, Logo-PNG) aus SVG/HTML.
// Nur bei Änderungen am Logo oder Design nötig – die Ergebnisse liegen in
// src/assets/img/ und werden mit eingecheckt.
// Voraussetzung: Playwright mit Chromium (npx playwright install chromium).
//   node scripts/generate-images.mjs

import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { heroSvg } from '../src/demo/car-art.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const IMG = join(ROOT, 'src/assets/img');
const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright'));
}

const logo = (await readFile(join(IMG, 'logo.svg'), 'utf8')).trim();
const favicon = await readFile(join(IMG, 'favicon.svg'), 'utf8');
const font = async f => 'data:font/woff2;base64,' + (await readFile(join(ROOT, 'src/assets/fonts', f))).toString('base64');
const fontCss = `@font-face{font-family:Manrope;src:url(${await font('manrope-latin-wght.woff2')});font-weight:200 800}@font-face{font-family:Inter;src:url(${await font('inter-latin-wght.woff2')});font-weight:100 900}`;

const jobs = [
  { file: 'favicon-32.png', w: 32, h: 32, html: `<body style="margin:0">${favicon.replace('<svg ', '<svg width="32" height="32" ')}</body>` },
  { file: 'apple-touch-icon.png', w: 180, h: 180, html: `<body style="margin:0;background:#ffffff">${favicon.replace('<svg ', '<svg width="180" height="180" ').replace('rx="14"', 'rx="0"')}</body>` },
  { file: 'logo-finecars.png', w: 600, h: 240, html: `<body style="margin:0;background:#fff;display:grid;place-items:center;height:240px"><div style="width:440px;color:#1e8ae5">${logo}</div></body>` },
  {
    file: 'og-image.png', w: 1200, h: 630,
    html: `<style>${fontCss}</style><body style="margin:0;width:1200px;height:630px;background:linear-gradient(180deg,#fff,#edf2f8);color:#0f2a4f;font-family:Inter;position:relative;overflow:hidden">
<div style="position:absolute;left:0;right:0;top:0;height:10px;background:#2cb3e8"></div>
<div style="position:absolute;left:72px;top:72px;width:230px;color:#1e8ae5">${logo}</div>
<div style="position:absolute;left:72px;top:200px;font-family:Manrope;font-weight:700;font-size:72px;line-height:1.02;letter-spacing:-2.5px;width:620px">Gebrauchtwagen in Görlitz</div>
<div style="position:absolute;left:72px;top:394px;font-size:26px;color:#1d5fbf;font-weight:600">Rothenburger Straße 27f · 03581 311715</div>
<div style="position:absolute;right:0;bottom:236px;width:520px;height:40px;border-radius:999px 0 0 999px;background:#2cb3e8"></div>
<div style="position:absolute;right:0;bottom:222px;width:430px;height:7px;border-radius:999px 0 0 999px;background:#1d5fbf"></div>
<div style="position:absolute;right:-120px;bottom:20px;width:760px">${heroSvg({ body: 'limousine', paint: '#b4bcc5', dark: false }).replace('width="1140" height="480"', 'width="760" height="320"')}</div>
</body>`
  }
];

const browser = await chromium.launch();
for (const job of jobs) {
  const page = await browser.newPage({ viewport: { width: job.w, height: job.h } });
  await page.setContent(job.html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(IMG, job.file), omitBackground: job.file === 'favicon-32.png' });
  await page.close();
  console.log('✔', job.file);
}
await browser.close();
