// The one source of truth for what the Fact Check desk tells readers about the
// checks it is holding.
//
// This exists because the disclosure silently disappeared the moment the desk
// published its first check. It was written by render-fmb-fact-check.mjs only
// when NOTHING was published -- an empty-state -- and publish-current-fact-checks.mjs
// then stripped `<div class="fc-empty">` outright when it added the current
// checks. So the desk went from telling readers that 123 drafted items were held
// back and why, to saying nothing about them at all. A reader could not tell the
// queue existed.
//
// The held queue is not an empty state. It is a standing editorial fact about
// this desk, and it is the thing that makes "A check publishes only once FMB has
// attached the primary records it rests on" verifiable rather than a slogan.
//
// Both passes render from here so the two copies cannot drift: the renderer
// emits it, and the publish pass rewrites it with the final counts instead of
// deleting it.

// The stable hook. Deliberately NOT `fc-empty`: the publish pass matches on that
// class to remove the empty state, and this note must survive that pass.
export const HELD_NOTE_CLASS = 'fc-held-note';
export const HELD_NOTE_PATTERN = new RegExp(`<div class="${HELD_NOTE_CLASS}"[\\s\\S]*?</div>`, 'i');

const STANDARD = 'primary records &mdash; statutes, court decisions, official agency records, '
  + 'public datasets, or the original post as it circulated';

export function heldNote(publishedCount = 0, heldCount = 0) {
  const held = Number(heldCount) || 0;
  const published = Number(publishedCount) || 0;
  if (held <= 0) return '';

  const items = held === 1 ? 'item' : 'items';
  const isAre = held === 1 ? 'is' : 'are';

  const heading = published
    ? `${held} more check${held === 1 ? '' : 's'} ${isAre} held pending verification`
    : 'No fact checks are published yet';

  const body = published
    ? `The ${published} check${published === 1 ? '' : 's'} above ${published === 1 ? 'is' : 'are'} published because FMB has attached the `
      + `${published === 1 ? 'record it rests' : 'records they rest'} on. ${held === 1 ? 'One further' : `A further ${held}`} drafted ${items} ${isAre} held back `
      + `until FMB has checked the claim against ${STANDARD} &mdash; and can publish those records alongside the rating. `
      + `FMB Fact Check stands on FMB&rsquo;s own verification, so a check appears here only after that work is done.`
    : `The FMB Fact Check desk is re-verifying its archive. ${held} drafted ${items} ${isAre} held back until FMB has checked `
      + `the claim against ${STANDARD} &mdash; and can publish those records alongside the rating. `
      + `FMB Fact Check stands on FMB&rsquo;s own verification, so nothing appears here before that work is done.`;

  // data-fmb-held carries the count as data so a later pass and the verifier can
  // both read it without parsing prose.
  return `<div class="${HELD_NOTE_CLASS}" data-fmb-held="${held}">`
    + `<h2 style="margin:0 0 10px;font-size:22px;letter-spacing:-.03em">${heading}</h2>`
    + `<p style="margin:0;line-height:1.6">${body}</p></div>`;
}
