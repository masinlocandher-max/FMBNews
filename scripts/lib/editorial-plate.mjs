// FMB News editorial plate — the standard for FMB-owned article visuals.
//
// The retired standard baked the headline, deck, metadata and a disclaimer into
// every graphic in Arial, over a plum-and-gold ground. That fought the page in
// four ways: it restated the HTML headline in a second voice, it set type in a
// face the publication does not use, it carried the retired identity, and at a
// 100x70 story-row thumbnail none of the text was legible -- the rows read as
// grey noise rather than as pictures.
//
// A plate carries no words. The journalism is already in the HTML, where it is
// accessible, translatable and searchable: the headline, the deck, the kicker,
// the credit and the "not a documentary photograph" note all exist as real
// text. The plate's job is to hold the space with something that belongs to FMB
// News and still reads at 100 pixels wide.
//
// Two earlier versions of this file failed, and both failures shaped what
// follows.
//
// The first was so restrained -- near-black ground, one faint circle -- that a
// column of story rows became a wall of identical dark rectangles. Monotony is
// not an improvement on noise.
//
// The second tried to fix that by alternating ground per desk, from a list of
// desk names. Measured against the real corpus, 145 of 151 plates still came
// out dark: the newsroom's actual desk labels are DEVELOPING, NATION, ECONOMY,
// EDUCATION, MONEY, LABOR, GOVERNMENT, CULTURE, TRAVEL -- almost none of which
// were in the list. A rhythm that depends on a vocabulary this file does not
// own is a rhythm that silently stops working the first time the newsroom names
// a new desk.
//
// So ground is decided by the slug's own seed, not by a desk vocabulary. Every
// plate is still deterministic -- the same story always produces the same plate
// -- but the light/dark split holds at roughly half and half no matter what the
// desks are called, and a new desk can never render the feed uniform. The desk,
// where one is recognised, shifts only which accent form is used.
//
// The other rule learned from version two: on paper, forms are near-solid ink.
// A 12%-opacity plane over an off-white ground is not a composition, it is an
// empty grey card, which is exactly how the light plates read.

const INK = '#141414';    // Editorial Black
const DEEP = '#0A0A0A';   // FMB Black
const SILVER = '#BFC1C2'; // Metallic Silver
const STEEL = '#6D7072';  // Steel Gray
const RED = '#D71920';    // FMB Red
const PAPER = '#F5F3EF';  // FMB White
const PAPER_HI = '#FAF9F6';

function seeded(slug) {
  let h = 2166136261;
  for (let i = 0; i < slug.length; i += 1) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return ((h >>> 0) % 100000) / 100000;
  };
}

export function editorialPlate(slug, w, h, desk = '') {
  const rnd = seeded(slug || 'fmb-news');
  const min = Math.min(w, h);

  // Ground first, and from the seed -- see the note above on why this is not
  // read from the desk. Desk still perturbs the seed, so two stories filed to
  // different desks under the same slug stem do not collide.
  const deskKey = String(desk).toLowerCase().replace(/[^a-z]/g, '');
  for (let i = 0; i < deskKey.length; i += 1) rnd();
  const light = rnd() < 0.5;

  const ground = light ? PAPER : DEEP;
  const groundTo = light ? PAPER_HI : INK;
  // On paper the form is ink at full strength: black on off-white is the
  // publication's own contrast, and it is what survives a 100px thumbnail.
  //
  // The dark side has to be pitched deliberately against that. At 0.17 silver
  // over FMB Black the form was only a few steps off the ground: dark plates
  // read as "a dark rectangle with a red line" beside light plates that were
  // full black-on-paper compositions, and any counterform punched back to the
  // ground disappeared into it -- the window in the banded variant showed up as
  // a speck of dust. 0.34 keeps the dark plates unmistakably dark while leaving
  // the form, and anything cut out of it, legible at thumbnail size.
  const form = light ? INK : SILVER;
  const formOp = light ? 0.92 : 0.34;
  const soft = light ? STEEL : SILVER;
  const softOp = light ? 0.5 : 0.46;
  const markInk = light ? INK : PAPER;

  const rule = Math.max(4, Math.round(min * 0.024));
  const pad = Math.round(min * 0.075);
  const mark = Math.round(min * 0.055);
  // The wordmark sits on a tab of the ground colour at the bottom of the plate.
  // The tab is not decoration: without it the mark is unreadable whenever a
  // form lands under it, which on a light plate is ink on ink.
  //
  // It is centred, not set in the corner, because every surface that shows a
  // plate crops it with object-fit: cover. In a 100x70 story row a 16:9 plate
  // loses about 157 source pixels off each side -- a corner mark at the 0.075
  // inset lost its first glyph and a half, and rendered as "B NEWS", which
  // reads as breakage rather than as a mark. A centred mark survives a
  // symmetric crop at any aspect the newsroom uses.
  //
  // The tab width is estimated from the glyph count rather than measured, since
  // this runs without a text-shaping engine, and is padded so the estimate errs
  // wide rather than narrow.
  const tabW = Math.round(pad * 2 + mark * 6.4);
  const tabH = Math.round(pad * 1.55 + mark * 0.5);

  // Four compositions. Each is a few large shapes with real figure/ground
  // separation, and each varies enough inside itself that two plates drawn from
  // the same variant do not read as the same picture.
  const variant = Math.floor(rnd() * 4);
  let art = '';

  if (variant === 0) {
    // A measure. Full-bleed columns of one height: an earlier version varied
    // their tops and bottoms, which read as a bar chart -- implying data the
    // story does not have, beside headlines about ferries and elections.
    const cols = 4 + Math.floor(rnd() * 4);
    const gut = Math.round(w * (0.016 + rnd() * 0.014));
    const colW = Math.round((w - gut * (cols + 1)) / cols);
    const redAt = Math.floor(rnd() * cols);
    for (let i = 0; i < cols; i += 1) {
      const x = gut + i * (colW + gut);
      const isRed = i === redAt;
      art += `<rect x="${x}" y="0" width="${colW}" height="${h}" fill="${isRed ? RED : form}" fill-opacity="${isRed ? 0.92 : formOp}"/>`;
    }
  } else if (variant === 1) {
    // One disc, cropped hard by the frame so it reads as a shape rather than a
    // dot, with a red bar cutting the lower field.
    const r = Math.round(min * (0.58 + rnd() * 0.3));
    const cx = Math.round(w * (0.16 + rnd() * 0.72));
    const cy = Math.round(h * (0.18 + rnd() * 0.56));
    art += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${form}" fill-opacity="${formOp}"/>`;
    art += `<circle cx="${cx}" cy="${cy}" r="${Math.round(r * (0.4 + rnd() * 0.26))}" fill="${ground}"/>`;
    const barY = Math.round(h * (0.52 + rnd() * 0.3));
    const barW = Math.round(w * (0.3 + rnd() * 0.45));
    const fromRight = rnd() < 0.5;
    art += `<rect x="${fromRight ? w - barW : 0}" y="${barY}" width="${barW}" height="${Math.round(rule * 1.9)}" fill="${RED}"/>`;
  } else if (variant === 2) {
    // Two planes meeting on a diagonal, with a red seam. The seam angle, the
    // side the mass sits on, and the counterform all move with the seed --
    // version two fixed all three, and three diagonal plates in a row were
    // indistinguishable.
    const top = Math.round(w * (0.12 + rnd() * 0.62));
    const bottom = Math.round(w * (0.12 + rnd() * 0.62));
    const mirror = rnd() < 0.5;
    const X = (v) => (mirror ? w - v : v);
    const seam = Math.round(min * (0.05 + rnd() * 0.09));
    art += `<path d="M ${X(top)} 0 L ${X(mirror ? 0 : w)} 0 L ${X(mirror ? 0 : w)} ${h} L ${X(bottom)} ${h} Z" fill="${form}" fill-opacity="${formOp}"/>`;
    art += `<path d="M ${X(top - seam)} 0 L ${X(top - Math.round(seam * 0.42))} 0 L ${X(bottom - Math.round(seam * 0.42))} ${h} L ${X(bottom - seam)} ${h} Z" fill="${RED}" fill-opacity="0.92"/>`;
    const cr = Math.round(min * (0.12 + rnd() * 0.12));
    art += `<circle cx="${X(Math.round(w * (0.1 + rnd() * 0.12)))}" cy="${Math.round(h * (0.2 + rnd() * 0.6))}" r="${cr}" fill="none" stroke="${soft}" stroke-opacity="${softOp}" stroke-width="${rule}"/>`;
  } else {
    // A block and its counterform. One heavy mass holds most of the frame, a
    // red rule runs along its trailing edge, and a block of the ground colour
    // is punched back out of it, straddling that edge.
    //
    // Two earlier versions of the counterform failed for the same underlying
    // reason -- it was placed against an edge. As a thin outlined square set
    // freely on the frame it was usually cropped in half, and a half-square
    // reads as a cropping accident. Moved to straddle the band's outer edge it
    // became a small notch bitten out of the band, which reads as a UI tab.
    // Held wholly inside the mass it is a window, which is the thing it was
    // always meant to be, and it is sized off the band rather than the frame so
    // it cannot outgrow its own field.
    //
    // The mass also runs vertically half the time: with only a horizontal band
    // this variant produced nine near-identical plates in a sheet of
    // twenty-four.
    const vertical = rnd() < 0.5;
    const span = 0.36 + rnd() * 0.3;
    const redW = Math.round(rule * 1.6);
    if (vertical) {
      const bandW = Math.round(w * span);
      const bandX = Math.round((w - bandW - redW) * rnd());
      const cut = Math.round(bandW * (0.3 + rnd() * 0.2));
      art += `<rect x="${bandX}" y="0" width="${bandW}" height="${h}" fill="${form}" fill-opacity="${formOp}"/>`;
      art += `<rect x="${bandX + bandW}" y="0" width="${redW}" height="${h}" fill="${RED}" fill-opacity="0.92"/>`;
      const inset = Math.round((bandW - cut) / 2);
      art += `<rect x="${bandX + inset}" y="${Math.round((h - cut) * (0.1 + rnd() * 0.8))}" width="${cut}" height="${cut}" fill="${ground}"/>`;
    } else {
      const bandH = Math.round(h * span);
      const bandY = Math.round((h - bandH - redW) * rnd());
      const cut = Math.round(bandH * (0.3 + rnd() * 0.2));
      art += `<rect x="0" y="${bandY}" width="${w}" height="${bandH}" fill="${form}" fill-opacity="${formOp}"/>`;
      art += `<rect x="0" y="${bandY + bandH}" width="${w}" height="${redW}" fill="${RED}" fill-opacity="0.92"/>`;
      const inset = Math.round((bandH - cut) / 2);
      art += `<rect x="${Math.round((w - cut) * (0.06 + rnd() * 0.88))}" y="${bandY + inset}" width="${cut}" height="${cut}" fill="${ground}"/>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="FMB News editorial plate">
  <defs>
    <linearGradient id="plate-ground" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${ground}"/><stop offset="1" stop-color="${groundTo}"/>
    </linearGradient>
    <clipPath id="plate-clip"><rect width="${w}" height="${h}"/></clipPath>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#plate-ground)"/>
  <g clip-path="url(#plate-clip)">${art}</g>
  <rect x="${Math.round((w - tabW) / 2)}" y="${h - tabH}" width="${tabW}" height="${tabH}" fill="${ground}"/>
  <text x="${Math.round(w / 2 + mark * 0.08)}" y="${h - pad}" text-anchor="middle" fill="${markInk}" fill-opacity="0.78" font-family="Didot,'Bodoni 72',Baskerville,'Times New Roman',serif" font-size="${mark}" letter-spacing="${Math.round(mark * 0.16)}">FMB NEWS</text>
</svg>`;
}
