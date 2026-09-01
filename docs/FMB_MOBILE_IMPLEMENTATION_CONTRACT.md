# FMB Mobile Implementation Contract

Claude/Codex: read this file and `docs/fmb-mobile-home-reference.html` before editing the mobile experience.

## Objective

Implement the premium FMB mobile app-view inside the existing FMBNews website repo. Do not create a separate app. Desktop remains the publication website. The mobile app-view is the same routes rendered differently below 700px.

## Locked architecture

The four official publication products are exactly:

1. FMB News
2. FMB Worldwide
3. FMB Explainer
4. FMB Daily Brief

Do not rename FMB Explainer to FMB Explained.

Utilities/engagement features such as weather, horoscope, and crossword are not fifth/sixth publication products and do not belong in the four-product rail.

## Primary coded reference

Open:

`docs/fmb-mobile-home-reference.html`

That file is the visual source of truth if screenshots/mockups are unavailable. It contains:

- exact palette variables
- system font stack
- app header structure
- official emblem placement
- product rail
- live date/time/weather strip
- personalized greeting
- hero dimensions and overlay treatment
- latest-news card anatomy
- Daily Brief coffee-mug card anatomy
- Weekly Horoscope card
- Weekly Crossword card/grid preview
- conditional Breaking strip
- responsive rules
- reduced-motion rule
- data hooks for live content hydration

Do not redesign the hierarchy unless there is a measurable accessibility/performance reason.

## Asset contract

Required production paths:

- Official emblem: `/news/assets/images/brand/fmb-bulletin-emblem.svg`
- Approved supplied hero collage: `/news/assets/images/mobile/fmb-mobile-hero.jpg`
- Approved supplied Daily Brief coffee mug: `/news/assets/images/mobile/fmb-daily-brief-mug.jpg`

If the hero/mug files are not yet present, do not silently substitute a generic image. Request/copy the exact approved assets into those paths first.

All visible primary story cards require real article imagery. The fallback SVG may be used only when no approved image exists.

## Mobile breakpoint

Premium app-view: `max-width: 699px`.

Desktop/tablet publication layout at 700px and above must remain unaffected by app-specific styling and JS behavior.

## Design tokens

Use these exact base values:

```css
--fmb-plum:#2B1235;
--fmb-plum-deep:#1A0B20;
--fmb-violet:#6E3A8A;
--fmb-lilac:#E9DFF0;
--fmb-bg:#F5F5F7;
--fmb-surface:#FFFFFF;
--fmb-ink:#1D1D1F;
--fmb-muted:#6E6E73;
--fmb-line:#D9D9DF;
--fmb-gold:#C9A84D;
```

Gold is a controlled prestige accent, not the primary surface/background color.

Font stack:

```css
font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Inter,Helvetica,Arial,sans-serif;
```

Do not bundle Apple fonts.

## Component order on mobile home

1. Safe-area app header
2. Four-product top rail
3. Live date/time/weather utility strip
4. Greeting + Customize
5. Large hero
6. Latest News with images on every visible story
7. FMB Daily Brief with coffee mug image
8. This Week
   - Weekly Horoscope
   - Weekly Crossword
9. Breaking strip only if a real editorial breaking flag is active

No fixed bottom navigation.

## Required data contract

Production implementation may hydrate from existing article data into a shape equivalent to:

```js
{
  reader: { firstName },
  hero: {
    category,
    headline,
    deck,
    href,
    image,
    publishedAt,
    readTime
  },
  latest: [
    { category, headline, href, image, publishedAt, readTime }
  ],
  weather: {
    label,
    location,
    observedAt,
    stale
  },
  breaking: {
    active,
    headline,
    href
  }
}
```

Never hardcode fictional story claims, weather, timestamps, readership counts, breaking events, or completion streaks.

## Date/time

Use the reader device clock and locale. Update automatically. No backend is required for basic display.

The reference page already includes working date/time behavior. Production may improve formatting but should keep the same compact strip.

## Weather

Do not request location on first render.

Flow:

1. Home shows `Set local weather` unless a saved consented location exists.
2. Reader taps weather.
3. Offer current-location permission or manual city selection.
4. Fetch actual weather through a documented provider/server endpoint.
5. Cache last successful result.
6. Mark stale cached weather clearly.
7. Do not persist precise coordinates unless necessary and consented.

Weather failure must degrade to `Set local weather` or `Weather unavailable`, never fabricated data.

## Horoscope

Route: `/news/horoscope/`

Requirements:

- weekly cadence
- zodiac selector
- optional saved preferred sign
- week date range
- Love
- Work / Money
- Energy / Well-being
- Key day
- Reflection prompt
- clear lifestyle/entertainment label

Never frame astrology as factual certainty or medical/legal/financial advice.

Home card should stay compact and should not enter the four-product rail.

## Crossword

Route: `/news/crossword/`

Requirements:

- one genuine crossword per week
- Across and Down clues
- cell/clue selection
- keyboard/touch support
- auto-advance and backspace behavior
- check letter/word/puzzle
- reveal behind confirmation
- local autosave
- account sync when backend exists
- completion state
- optional timer
- streak only when backed by stored history

Home card uses a preview of the actual current grid and progress if available.

## Personalization

Preserve existing email/session/profile infrastructure.

Your FMB should eventually contain:

- Saved Stories
- preferred sections
- Daily Brief
- Breaking News alerts
- FMB Worldwide alerts
- preferred zodiac sign
- weather preference/location
- Home Screen install state/help
- crossword progress
- sign out

Personalization can reprioritize stories but must not hide urgent public-interest/breaking stories.

## Breaking strip

Render only when the existing editorial metadata explicitly designates a story as breaking/push alert.

Never keep a permanent fake breaking strip for visual balance.

## Search

Mobile search must span:

- FMB News
- FMB Worldwide
- FMB Explainer
- FMB Daily Brief
- Horoscope content
- Crossword issues

Editorial results should rank above engagement utilities unless the query specifically targets those utilities.

## Accessibility

Required:

- 44px minimum touch targets
- semantic headings
- focus-visible states
- usable contrast
- reduced-motion handling
- meaningful image alt text
- labeled icon buttons
- crossword keyboard navigation
- no information by color alone

## Performance

Required:

- no blocking weather request on initial load
- responsive/compressed hero and mug assets
- lazy-load below-fold images
- preserve aspect ratios
- no layout shift from image dimensions
- no third-party blocking scripts for visual chrome
- load crossword logic only where needed

## Acceptance checklist

Before calling the mobile app-view complete:

- mobile opening view matches the coded reference hierarchy
- official emblem is visible
- exact four product names are present
- top rail only, no fixed bottom nav
- date/time update live
- weather is real and permission-safe
- hero uses approved supplied hero asset
- Latest News has an image on every visible card
- Daily Brief shows the approved coffee mug asset
- Horoscope route works and is entertainment-labeled
- Crossword route is genuinely playable and saves progress
- Breaking appears only on a real editorial flag
- no mobile horizontal overflow
- existing email/session/push/Home Screen behavior survives
- desktop at 700px+ is visually unchanged

## Takeover rule

If a future Claude/Codex agent has no access to the original screenshots, it should reproduce the mobile UI from `docs/fmb-mobile-home-reference.html` and this contract. Those two files are sufficient to recover the approved direction without guessing.
