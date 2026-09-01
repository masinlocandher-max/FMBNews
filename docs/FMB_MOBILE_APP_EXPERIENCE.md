# FMB Mobile App Experience

## Product rule

This is not a separate native app and not a separate repository. The existing FMBNews website remains the source and deployment surface. Desktop keeps the publication website. Below 700px, the same routes become a premium app-like FMB experience.

The four official editorial products remain exactly:

1. FMB News
2. FMB Worldwide
3. FMB Explainer
4. FMB Daily Brief

Date/time, Weather, Weekly Horoscope, and Weekly Crossword are utility/engagement features. They are not new editorial products and must not be added to the four-product rail.

## Design system

Primary palette:
- FMB Plum: #2B1235
- Deep Plum: #1A0B20
- Violet: #6E3A8A
- Lilac: #E9DFF0
- App Background: #F5F5F7
- White Surface: #FFFFFF
- Ink: #1D1D1F
- Secondary Text: #6E6E73
- Hairline: #D9D9DF
- Controlled Gold: #C9A84D

Use the existing official gold shell/pearl emblem without redrawing it.

Typography:
- Apple platforms: SF Pro system stack
- Cross-platform fallback: system UI / Inter-compatible metrics
- Do not bundle Apple font files
- Editorial body should stay around 17px or larger on mobile

No fixed bottom navigation.

## Mobile home information architecture

### 1. App header

Safe-area-aware deep plum header.

Left:
- official FMB emblem
- FMB News
- Filipino Media Bulletin

Right:
- Search
- Your FMB / reader profile control

### 2. Four-product rail

Horizontal top rail directly below the app header:

FMB News | FMB Worldwide | FMB Explainer | FMB Daily Brief

Selected product uses a restrained underline. No pill-heavy navigation.

### 3. Live utility strip

Directly below the product rail, show a compact live utility row that can be tapped for detail:

- Local date
- Local time
- Local weather

Example presentation only, never hardcoded:

Monday, September 1  |  6:42 PM  |  29°C  Partly Cloudy

Date/time behavior:
- derive from the reader device clock and locale
- refresh automatically
- display Philippine Standard Time when the reader is in the Philippines unless device locale/timezone indicates otherwise
- no server round trip is required for basic date/time display

Weather behavior:
- do not request location permission immediately on first page load
- default state: `Set local weather` or use an already-consented saved location
- request geolocation only after the reader taps the weather control or explicitly enables local weather
- if geolocation is denied, allow manual city selection
- cache the last successful weather result for low-connectivity use and mark stale data clearly
- never fabricate weather
- weather provider/API must be documented in code and secrets must not be shipped client-side when a server proxy is required
- show temperature, condition, high/low, rain chance when available
- detailed weather view can show today plus upcoming forecast, but the home strip remains compact

### 4. Personalized greeting

When the reader has an email identity/profile:

`Good evening, <first name>`

When no first name exists, use a neutral greeting such as `Good evening`.

Do not infer or invent a name.

A Customize control opens reader preferences.

### 5. Hero story

Use the approved supplied global/news hero collage as the visual identity hero asset when appropriate, while the actual headline/deck/link must come from live FMB content.

Do not hardcode fictional headlines from mockups.

Hero must include:
- real image asset
- current FMB story or product destination
- category
- headline
- concise deck
- time/read-time when available
- save/bookmark control

### 6. Latest News

Every visible story card must have an image.

Image priority:
1. article's rights-cleared editorial image
2. approved archive/file photo with labeling where needed
3. approved FMB fallback image only if there is genuinely no suitable image

Do not use empty text-only news cards in the primary mobile feed.

### 7. FMB Daily Brief feature

Use the approved branded FMB coffee mug image as a real asset in the Daily Brief module.

The module should contain:
- FMB Daily Brief label
- concise value proposition
- current/latest brief CTA
- email identity state when signed in

Do not invent readership counts.

### 8. This Week

Create a distinct engagement section after the core news/brief content:

`This Week`

It contains two primary modules:
- Weekly Horoscope
- Weekly Crossword

These do not appear in the four-product publication rail.

## Weekly Horoscope

Suggested route:

`/news/horoscope/`

Purpose:
- lightweight weekly lifestyle/entertainment engagement
- visually premium but clearly separate from factual news reporting

Reader flow:
- first visit asks the reader to choose a zodiac sign
- optionally save the sign to the signed-in reader profile
- do not infer zodiac sign from private information
- reader can change sign at any time

Weekly horoscope page:
- week date range
- zodiac sign selector
- main weekly reading
- Love
- Work / Money
- Energy / Well-being
- Key day of the week
- Short reflection prompt

Editorial/safety rule:
- horoscope content must be labeled as entertainment/lifestyle content
- never present horoscope guidance as factual prediction, medical advice, financial advice, legal advice, or guaranteed outcomes

Update cadence:
- one issue per zodiac sign per calendar week
- preserve past weekly editions only if the editorial team wants an archive

Home card:
- selected sign symbol
- `Your week` teaser
- one sentence only
- CTA: `Read weekly horoscope`

## Weekly Crossword

Suggested route:

`/news/crossword/`

Purpose:
- recurring reader habit
- intelligent FMB-branded engagement
- culturally relevant clues can include Philippine history, language, geography, culture, current affairs, world knowledge, and general knowledge

Puzzle requirements:
- publish one new crossword per week
- real crossword grid, not a word-search substitute
- Across and Down clues
- keyboard support
- tap cell to select clue
- auto-advance
- backspace behavior
- check letter
- check word
- check puzzle
- reveal letter/word/puzzle behind a deliberate confirmation
- progress autosave locally
- signed-in readers sync progress to their account when backend support is available
- completion state with elapsed time if timer is enabled
- optional streak only when backed by real stored completion history
- printable/shareable puzzle state can be considered later

Puzzle content model should support:
- issue id
- week start date
- title/theme
- grid dimensions
- blocked cells
- answers
- clues
- clue numbering
- solution validation
- optional explanation for special/theme clues

Do not expose the complete answer key in client markup before the user requests reveal if avoidable. Prefer a validated puzzle data model and server-delivered or obfuscated solution handling suitable for the current static/Cloudflare architecture.

Home card:
- small preview of the actual weekly grid
- week label
- title/theme
- progress percentage for returning readers
- CTA: `Play this week's crossword`

## Search

Mobile search must cover:
- FMB News
- FMB Worldwide
- FMB Explainer
- FMB Daily Brief
- Weekly Crossword issues
- Weekly Horoscope landing/weekly editions when indexed

Results should be grouped by type. Utilities should not overwhelm editorial results.

## Your FMB

Reader/account sheet should contain:
- email identity
- Saved Stories
- preferred sections
- Daily Brief
- Breaking News alerts
- FMB Worldwide alerts
- preferred zodiac sign
- weather location / local weather toggle
- Home Screen install state/help
- account sign out

Crossword progress can surface here later as `Continue crossword`.

## Breaking news

Only show a breaking strip when a story is explicitly designated as breaking/push-alert by editorial metadata.

Never fabricate breaking news to fill the UI.

## Home Screen / PWA

After email identity is obtained, proactively but respectfully offer Add to Home Screen.

Recommended trigger priority:
1. after first save
2. after completing a story
3. on a return session

Avoid immediately stacking an install prompt on top of the email confirmation flow.

Installed experience should preserve:
- personalization
- saved content
- weather preference
- horoscope sign
- crossword progress
- push notification state

## Offline and low-connectivity behavior

Cache:
- shell assets
- official emblem
- current hero identity asset
- current Daily Brief mug image
- last successfully loaded feed snapshot when practical
- last weather result with stale timestamp
- current crossword puzzle and local progress
- current selected horoscope edition

Do not show stale weather as current. Label stale/cached content.

## Accessibility

- 44px minimum interactive targets
- semantic headings
- visible focus states
- screen-reader labels for weather/icons/zodiac symbols/crossword controls
- high contrast
- reduced motion support
- crossword must be keyboard operable
- no information conveyed only by color

## Performance

- lazy-load below-the-fold imagery
- responsive image sizes
- compress hero and Daily Brief mug assets without visibly degrading them
- avoid blocking third-party scripts
- weather request should not block initial render
- crossword should load only on its route/home preview

## Analytics/events worth tracking

Only where privacy policy and implementation permit:
- product tab opens
- story open
- story save
- Daily Brief open
- email sign-in completion
- Home Screen install prompt accepted/dismissed
- weather enabled/disabled, without storing precise location unless needed and consented
- horoscope sign selected
- horoscope opened
- crossword started
- crossword resumed
- crossword completed

Do not log sensitive or unnecessary location data.

## Acceptance criteria for takeover

Mobile:
- looks and behaves like a premium app, not a compressed desktop site
- official emblem is visible
- all four product names are exact
- date and local time update correctly
- weather requires consent or manual location and never fabricates data
- every primary visible news card has an image
- supplied hero image is properly integrated
- supplied coffee mug image is visible in FMB Daily Brief
- Weekly Horoscope route works and is clearly lifestyle/entertainment
- Weekly Crossword is playable and saves progress
- no fixed bottom navigation
- no horizontal overflow
- personalization/email/push/Home Screen features continue to work

Desktop:
- existing publication website remains visually and functionally intact

## Takeover instruction

Claude/Codex should treat this document as the product specification, then improve spacing, polish, accessibility, reliability, performance, state handling, transitions, and responsive behavior without changing the locked four-product architecture or turning the utilities into additional publication products.
