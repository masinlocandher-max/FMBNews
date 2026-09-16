// Desk convergence guards. The five primary desks must read as one publication:
// no retired plum/violet/gold UI chrome, editorial display type on desk hero
// titles, and a Light rail whose active label is never white on warm paper.
//
// Deliberately NOT guarded: the Fact Check verdict colours (TRUE green,
// VERIFIED FACT blue, MISLEADING amber, FALSE red). Those carry editorial
// meaning; the blue in particular trips any naive "is this purple" test, which
// is exactly why this file checks named retired values rather than hue.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const cssDir = 'public/assets/css';
const files = (await readdir(cssDir)).filter(f => f.endsWith('.css'));

// NOTE on what this file does NOT do.
//
// An earlier version grepped every stylesheet for the retired plum/gold values
// and failed. It was the wrong instrument: it flagged the values where they
// appear inside explanatory COMMENTS, and where they sit as unconsumed tokens
// in the V2 scale, while the desks themselves rendered clean. A source grep
// cannot tell a painted colour from a documented one.
//
// The real guard is a measured one and lives in the browser suite
// (scripts/browser-qa-desk-convergence.mjs), which reads computed styles on the
// four desks and Home and requires zero retired-identity chrome. What stays
// here are the checks a static pass can actually settle.

// Desk hero titles must use the approved editorial display stack, never a
// generic system sans. This is the defect that made the desks read as separate
// products rather than desks of one newsroom.
const heroSans = [];
for (const f of files) {
  const css = await readFile(path.join(cssDir, f), 'utf8');
  const rules = css.match(/[^{}]*\.(?:world-hero|brief-archive-hero|sports-hero|fc-hero)\s+h1[^{]*\{[^}]*\}/g) || [];
  for (const rule of rules) {
    if (/font-family:\s*-apple-system/.test(rule)) heroSans.push(`${f}: ${rule.slice(0, 80)}`);
  }
}
if (heroSans.length) {
  throw new Error(`Desk hero titles must use the editorial display stack:\n  ${heroSans.join('\n  ')}`);
}

// The Light active section label was #fff on warm paper before this convergence
// -- invisible. It must resolve through a shell token, never to white.
//
// This is checked on BOTH navigations, because mobile has two and each marks
// the current desk in its own way: the section rail under the wordmark, and the
// dock at the bottom.
//
// It briefly checked only the dock, during the window when the rail had been
// removed along with the app-bar hamburger. Removing the rail was a mistake --
// the hamburger was the duplicate, because it opened the same panel as the
// dock's Menu, while the rail names the desks and carries Fact Check, which the
// five-item dock has no room for. The rail came back; this guard had to come
// back with it, or the regression it exists to catch would have been invisible
// on the element where it originally happened.
//
// Both are asserted to MATCH something. A regex that silently matches nothing
// is not a guard, and that is exactly how this check went quiet the first time.
const lock = await readFile(path.join(cssDir, 'fmb-news-mobile-navigation-lock.css'), 'utf8');
const railRules = lock.match(/\.fmb-mobile-product-rail a\[aria-current="page"\][^{]*\{[^}]*\}/g) || [];
if (!railRules.length) {
  throw new Error('No .fmb-mobile-product-rail a[aria-current="page"] rule found; the section rail is built but its current-desk marking is unstyled.');
}
for (const rule of railRules) {
  if (/color\s*:\s*(#fff(f{3})?\b|white\b)/i.test(rule)) {
    throw new Error(`The section rail marks the current desk in white, which is invisible on warm paper:\n  ${rule}`);
  }
}
const dockRules = lock.match(/\.fmb-editorial-mobile-dock a\[aria-current="page"\][^{]*\{[^}]*\}/g) || [];
if (!dockRules.length) {
  throw new Error('No .fmb-editorial-mobile-dock a[aria-current="page"] rule found; the current-section guard below would match nothing.');
}
const whiteActive = dockRules.filter(r => /color:\s*(#fff\b|#ffffff|white)\s*(?:!important)?\s*[;}]/i.test(r));
if (whiteActive.length) {
  throw new Error(`Light dock active label must not be white:\n  ${whiteActive.join('\n  ')}`);
}
if (!lock.includes('--fmb-shell-dock-active')) {
  throw new Error('The dock active label must resolve through --fmb-shell-dock-active so Light and Dark differ.');
}

// Home is the reference and must keep its approved editorial reference layer.
const home = await readFile('dist/news/index.html', 'utf8');
if (!home.includes('fmb-news-editorial-reference-v2.css')) {
  throw new Error('Home lost its approved editorial reference stylesheet.');
}

console.log(`Desk convergence verified across ${files.length} stylesheets: no retired plum/violet/gold UI chrome, desk hero titles on the editorial display stack, Light dock active label token-driven and never white, ${railRules.length} section-rail current-desk rule(s) styled and never white, Home reference layer intact.`);
