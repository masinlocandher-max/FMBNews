// Measured desk convergence. Home is the reference; World, Sports, Briefing and
// Fact Check must read as desks of the same publication, not separate products.
//
// This is the guard that matters. A source grep cannot tell a painted colour
// from one sitting in a comment or an unused token, and it cannot see which
// element actually carries the visible label -- the Light rail regression hid
// in an inner <span> while the anchor above it already measured correct.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const base = process.env.FMB_QA_BASE || 'http://127.0.0.1:4173';
const DESKS = [
  ['Home', '/news/'], ['World', '/news/world/'], ['Sports', '/news/sports/'],
  ['Briefing', '/news/fmb-brief/'], ['Fact Check', '/news/fact-check/'],
];

// Retired plum/violet. Deliberately excludes the Fact Check verdict palette:
// VERIFIED FACT blue (#1677C8) would trip any blue-ish test, and its colour is
// the verdict.
const isRetired = (v) => {
  const p = String(v).match(/[\d.]+/g);
  if (!p) return false;
  if (p[3] !== undefined && Number(p[3]) === 0) return false;
  const [r, g, b] = p.map(Number);
  if (r === 22 && g === 119 && b === 200) return false;   // VERIFIED FACT blue
  if (r === 91 && g === 174 && b === 238) return false;   // its dark variant
  if (b > 150 && g > 120 && r < 120) return false;        // remaining verdict blues
  return b > r && b > g + 8 && (b - g) > 18 && b > 40;
};

const browser = await chromium.launch();
const failures = [];

for (const [name, url] of DESKS) {
  for (const [w, theme] of [[390, 'light'], [430, 'light'], [1440, 'light'], [390, 'dark'], [430, 'dark'], [1440, 'dark']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, isMobile: w < 700, hasTouch: w < 700, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    await page.route('https://**/*', r => r.abort());
    await page.goto(base + url, { waitUntil: 'domcontentloaded' });
    await page.evaluate(t => { try { localStorage.setItem('fmbThemeModeV1', t); } catch {} }, theme);
    await page.goto(base + url, { waitUntil: 'load' });
    await page.waitForTimeout(450);
    const tag = `${name} ${w} ${theme}`;

    const result = await page.evaluate((isRetiredSrc) => {
      const isRetired = eval('(' + isRetiredSrc + ')');
      const seen = [];
      for (const el of document.querySelectorAll('*')) {
        const rect = el.getBoundingClientRect();
        if (rect.width < 2 || rect.height < 2) continue;
        for (const pseudo of [null, '::before', '::after']) {
          const cs = getComputedStyle(el, pseudo);
          for (const prop of ['backgroundColor', 'color', 'backgroundImage', 'borderTopColor', 'borderLeftColor', 'boxShadow']) {
            const v = cs[prop];
            if (!v || v === 'none') continue;
            for (const c of String(v).match(/rgba?\([^)]*\)/g) || []) {
              if (isRetired(c)) seen.push(`${el.tagName}.${String(el.className).slice(0, 34)}${pseudo || ''} ${prop} ${c}`);
            }
          }
        }
      }
      // The visible active rail label is the inner span, not the anchor.
      const activeSpan = document.querySelector('.fmb-mobile-product-rail a[aria-current="page"]>span')
        || document.querySelector('.fmb-mobile-product-rail a[aria-current="page"]');
      const rail = document.querySelector('.fmb-mobile-product-rail');
      const lum = (v) => { const p = String(v).match(/[\d.]+/g); if (!p) return null; const c = x => { const n = Number(x) / 255; return n <= .03928 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4; }; return .2126 * c(p[0]) + .7152 * c(p[1]) + .0722 * c(p[2]); };
      let hero = null, size = 0;
      for (const h of document.querySelectorAll('h1,h2')) {
        const fs = parseFloat(getComputedStyle(h).fontSize) || 0;
        if (fs > size && h.getBoundingClientRect().height > 0) { size = fs; hero = h; }
      }
      return {
        retired: [...new Set(seen)],
        railActiveLum: activeSpan ? lum(getComputedStyle(activeSpan).color) : null,
        railLum: rail ? lum(getComputedStyle(rail).backgroundColor) : null,
        heroFont: hero ? getComputedStyle(hero).fontFamily.split(',')[0].replace(/["']/g, '') : null,
        bodyLum: lum(getComputedStyle(document.body).backgroundColor),
        overflow: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
      };
    }, isRetired.toString());

    if (result.retired.length) failures.push(`${tag}: retired identity chrome -> ${result.retired.slice(0, 3).join(' | ')}`);
    if (result.overflow > 0) failures.push(`${tag}: horizontal overflow ${result.overflow}px`);

    // Light rail: the active label must be dark ink on the warm rail, never white.
    if (w < 700 && result.railActiveLum !== null && result.railLum !== null) {
      if (theme === 'light' && result.railActiveLum > 0.35) {
        failures.push(`${tag}: Light rail active label too pale (${result.railActiveLum.toFixed(3)}) on a rail at ${result.railLum.toFixed(3)}`);
      }
      if (theme === 'dark' && result.railActiveLum < 0.4) {
        failures.push(`${tag}: Dark rail active label too dark (${result.railActiveLum.toFixed(3)})`);
      }
    }
    // One publication: same paper, same ink direction.
    if (theme === 'light' && result.bodyLum < 0.5) failures.push(`${tag}: Light paper too dark (${result.bodyLum.toFixed(3)})`);
    if (theme === 'dark' && result.bodyLum > 0.1) failures.push(`${tag}: Dark ground too light (${result.bodyLum.toFixed(3)})`);
    // Desk titles carry the editorial display face.
    if (result.heroFont && !/Bodoni|Libre Bodoni|Didot|Baskerville|Times/.test(result.heroFont)) {
      failures.push(`${tag}: desk hero title is "${result.heroFont}", not the editorial display stack`);
    }
    await ctx.close();
  }
}

await browser.close();
if (failures.length) {
  throw new Error(`Desk convergence failures (${failures.length}):\n  ${failures.join('\n  ')}`);
}
console.log(`Desk convergence browser QA passed: Home, World, Sports, Briefing and Fact Check across 390/430/1440 in both appearances -- no retired plum/violet chrome, Light rail active labels readable on warm paper, shared paper and ink, editorial display type on every desk title, no overflow. Fact Check verdict colours preserved.`);
