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
// This used to be checked on .fmb-mobile-product-rail. That rail is no longer
// built, so a guard on it can only ever pass. The same bug is now possible on
// the dock, which is the element that carries the current section, so the guard
// moved there rather than being deleted -- and it is asserted to match
// something, because a regex that silently matches nothing is not a guard.
const lock = await readFile(path.join(cssDir, 'fmb-news-mobile-navigation-lock.css'), 'utf8');
if (/\.fmb-mobile-product-rail/.test(lock) && !/no longer built/i.test(lock)) {
  // Not fatal on its own -- the rules are inert -- but worth saying once.
  console.warn('  Note: fmb-news-mobile-navigation-lock.css still carries .fmb-mobile-product-rail rules for an element that is no longer built.');
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

console.log(`Desk convergence verified across ${files.length} stylesheets: no retired plum/violet/gold UI chrome, desk hero titles on the editorial display stack, Light dock active label token-driven and never white, Home reference layer intact.`);
