# Claude Takeover Prompt — FMB News Premium Mobile App-View

You are taking over the existing repository:

`masinlocandher-max/FMBNews`

Default branch: `main`

Do not create a new repository. Do not create a separate native app. Do not rebuild the project from scratch.

The existing desktop publication website must remain intact. The same website routes become a dedicated premium mobile app-like experience below 700px. Desktop at 700px and above remains the publication website.

## FIRST: read these files in this exact order

1. `docs/fmb-mobile-home-reference.html`
2. `docs/fmb-mobile-brand-reference.css`
3. `docs/FMB_BRAND_ASSET_USAGE.md`
4. `docs/FMB_APPROVED_DRIVE_ASSETS.md`
5. `docs/FMB_MOBILE_IMPLEMENTATION_CONTRACT.md`
6. `docs/FMB_MOBILE_APP_EXPERIENCE.md`
7. GitHub Issue #1: `Mobile app-view design handoff: implement approved premium FMB News home`

The coded HTML/CSS reference is the visual source of truth when screenshots are unavailable. Do not invent a different hierarchy.

## GOAL

Turn the mobile version of FMB News into a premium, App Store-quality news experience that feels like a dedicated $100k digital product, while still being delivered by the existing FMB News website/PWA.

It must feel intentional, restrained, premium, fast, readable, personalized, and editorial. It must not feel like a compressed desktop website, a generic news template, a WordPress theme, or a flashy startup dashboard.

## LOCKED PRODUCT ARCHITECTURE

The four official editorial products are exactly:

1. FMB News
2. FMB Worldwide
3. FMB Explainer
4. FMB Daily Brief

Do not rename them.
Do not change `FMB Explainer` to `FMB Explained`.

These four products appear in the primary top product rail.

Date/time, Weather, Weekly Horoscope, and Weekly Crossword are utility/engagement features. They are not fifth/sixth editorial products and must not be placed in the four-product rail.

## MOBILE BREAKPOINT

Premium app-view applies below 700px:

`max-width: 699px`

At 700px and above, preserve the desktop publication experience. Do not redesign desktop while doing this task.

## OFFICIAL BRAND

Use the official gold shell with pearl-center FMB emblem.

Do not redraw, reinterpret, simplify, recolor, flatten, crop, rotate, add a badge, add text inside it, or substitute a generic FMB monogram.

Approved Google Drive source:

- title: `14805104-70C9-49A1-AF52-770AD709D4D2.png`
- file ID: `1SZFHuvoOHPlSi_GmqVdTtqk-4UycESEw`

Production brand asset should resolve to the approved emblem, normally:

`/news/assets/images/brand/fmb-bulletin-emblem.svg`

If the in-repo SVG is not visually the same approved emblem, replace/update it from the approved Drive master.

### Mobile header lockup

Use:

- official emblem
- `FMB News`
- `Filipino Media Bulletin`

Recommended structure:

```html
<a class="fmb-brand-lockup" href="/news/archive/" aria-label="FMB News — Filipino Media Bulletin">
  <img class="fmb-brand-icon" src="/news/assets/images/brand/fmb-bulletin-emblem.svg" alt="">
  <span class="fmb-brand-copy">
    <strong class="fmb-brand-title">FMB News</strong>
    <small class="fmb-brand-subtitle">Filipino Media Bulletin</small>
  </span>
</a>
```

Target mobile icon size: about 40px.
Gap icon-to-wordmark: about 10px.
Header height: about 64–72px plus safe area.
Do not crop the shell.
Do not add a heavy white shadow.
Do not use gold for all UI icons.

## COLOR SYSTEM

Use these base values:

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

Preferred mobile top header:

```css
background:linear-gradient(180deg,#2B1235 0%,#1A0B20 100%);
```

Gold is a prestige accent, not the dominant app color. Use it mainly for the official emblem and restrained special accents.

## TYPOGRAPHY

Do not bundle Apple font files.

UI/body stack:

```css
font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Inter,Helvetica,Arial,sans-serif;
```

Display/headline stack:

```css
font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",Inter,Helvetica,Arial,sans-serif;
```

Recommended mobile hierarchy:

- app wordmark: 20px / ~750
- product rail: 13–14px / 650–750
- hero headline: 31–36px / 800
- section title: 24–28px / 800
- story headline: 17–19px / 700–760
- article body: 17–18px with generous line height
- metadata: 11–13px

Do not use decorative serif typography for core mobile UI controls/navigation. A serif may be reserved only for a deliberate special longform treatment.

## UI ICON SYSTEM

The FMB emblem is the brand icon only.

Search, account, bookmark, share, close, weather, crossword, navigation and other controls use simple monochrome line icons:

- ~24px visual size
- ~1.8–2px stroke
- rounded linecaps/joins
- minimum 44px touch target
- white on plum header
- ink/gray on white surfaces
- violet for selected state

Do not make every control gold.

## APPROVED HERO IMAGE

Use the exact user-approved global/news collage with the official gold emblem at center.

Google Drive:

- title: `E85E78F1-429E-42EC-8E0D-74CC1D29960A.png`
- file ID: `1BFsbaXgrFqyBuD4R2ummFR87FUSxACq1`

Copy it into the production asset tree and create an optimized derivative, preferably:

`/news/assets/images/mobile/fmb-mobile-hero.webp`

or a consistently referenced JPEG equivalent.

Do not use the Google Drive URL as the permanent public image URL.

The hero image is visual identity. Do not hardcode fictional story copy from concept mockups. Headline, category, deck, time/read-time and destination must come from actual FMB data.

## APPROVED FMB DAILY BRIEF MUG IMAGE

Use the exact purple coffee mug with the official gold FMB emblem.

Google Drive:

- title: `83960F27-4024-4FFA-A91D-F4710BBA147F.png`
- file ID: `1KUeapU5-UNZocnOPWRze220hlm5BYg_h`

Copy it into the production asset tree and create an optimized derivative, preferably:

`/news/assets/images/mobile/fmb-daily-brief-mug.webp`

or a consistently referenced JPEG equivalent.

Do not substitute a generic coffee cup and do not regenerate a different mug.

## MOBILE HOME INFORMATION ARCHITECTURE

Build the mobile home in this order:

1. Safe-area-aware plum app header
2. Four-product horizontal top rail
3. Live date/time/weather utility strip
4. Personalized greeting + Customize
5. Large premium hero
6. Latest News with image on every visible story card
7. FMB Daily Brief feature using the approved coffee mug image
8. `This Week`
   - Weekly Horoscope
   - Weekly Crossword
9. Breaking News strip only when a real editorial breaking/push flag exists

No fixed bottom navigation.

## APP HEADER

Top header should feel native and premium.

Left:
- official icon
- FMB News
- Filipino Media Bulletin

Right:
- Search
- Your FMB/account control

Use safe-area insets.
Keep touch targets at least 44px.
Header may collapse subtly on scroll if it improves usability, but do not create flashy motion.

## FOUR-PRODUCT TOP RAIL

Directly under the header:

`FMB News   FMB Worldwide   FMB Explainer   FMB Daily Brief`

Use horizontal scrolling if necessary.
Use a restrained violet underline for selected state.
No bottom dock.
No oversized pills.
No duplicate navigation.

## LIVE DATE / TIME / WEATHER

Show a compact utility row under the product rail.

Date/time:
- derive from device clock and locale
- update live
- no fake timestamp
- format naturally for reader locale

Weather:
- do not request location permission immediately on first render
- initial state is `Set local weather` unless an already-consented location exists
- on user interaction, offer device location or manual city choice
- fetch real weather only
- cache last successful weather response for low-connectivity use
- clearly mark stale cached weather
- never fabricate conditions
- do not store precise coordinates unnecessarily
- weather must not block first render

## PERSONALIZED GREETING

If a real first name exists in the reader profile:

`Good morning, <name>`
`Good afternoon, <name>`
`Good evening, <name>`

If no real name exists, show only the neutral time-of-day greeting.

Do not infer or invent a name.

Customize opens reader preferences.

## HERO

Use the approved hero image as a real image/background asset.

Visual treatment:
- large rounded rectangle
- strong image crop
- subtle controlled dark gradient only where necessary for readable overlay
- factual live headline/deck
- category
- published time/read-time when available
- save/bookmark control
- CTA or article link

Do not hardcode mockup claims.

## LATEST NEWS

Every primary visible story card must have an image.

Image priority:

1. article's actual rights-cleared image
2. approved file/archive photo with correct label where necessary
3. controlled approved FMB fallback only if no suitable image exists

Never create an image-less primary feed card.

Mobile story anatomy:
- category
- readable headline
- timestamp/read-time
- 96–110px image
- bookmark control where appropriate

Avoid tiny text.
Avoid desktop-grid cards compressed into mobile.

## FMB DAILY BRIEF

Use the approved mug image prominently.

Module should include:
- `FMB Daily Brief`
- concise value proposition
- current/latest brief CTA
- signed-in identity state where relevant
- no invented subscriber/readership counts

Daily Brief email identity flow remains integrated with the existing Supabase/passwordless system.

## EMAIL / PERSONALIZATION / HOME SCREEN

Preserve the existing implementation:

- Continue with email/passwordless sign-in
- reader profile
- Daily Brief preference
- Breaking News preference
- FMB Worldwide preference
- preferred sections
- personalized ranking
- saved-story continuity
- push subscription
- Home Screen/PWA prompt

After email identity is obtained, offer Home Screen installation respectfully, ideally after a meaningful engagement moment rather than stacking prompts immediately.

Installed experience should preserve reader state where supported.

## BREAKING NEWS

Breaking strip appears only when editorial metadata explicitly marks a story as breaking/push-alert.

Never fabricate breaking news to balance the layout.

Breaking public-interest stories should not be hidden by personalization.

## WEEKLY HOROSCOPE

Route:

`/news/horoscope/`

This is a lifestyle/entertainment feature, not a fifth publication product.

Requirements:
- zodiac selector
- optional saved sign
- week date range
- main weekly reading
- Love
- Work / Money
- Energy / Well-being
- Key Day
- Reflection Prompt
- clear label that this is entertainment/lifestyle content

Do not infer zodiac sign from private user information.
Do not present astrology as factual certainty or medical/legal/financial advice.

Home card should be compact and live under `This Week`.

## WEEKLY CROSSWORD

Route:

`/news/crossword/`

Build a real crossword, not a word search.

Requirements:
- one puzzle per week
- real grid
- Across clues
- Down clues
- keyboard support
- touch support
- selected cell/clue state
- auto-advance
- backspace behavior
- check letter
- check word
- check puzzle
- reveal behind deliberate confirmation
- local autosave
- signed-in sync when supported
- completion state
- optional timer
- streak only when backed by stored history

Home card should show a preview of the real weekly grid and actual progress if returning.

Do not expose the full answer key openly in rendered markup if avoidable.

## SEARCH

Mobile search should cover:

- FMB News
- FMB Worldwide
- FMB Explainer
- FMB Daily Brief
- Horoscope
- Crossword issues

Editorial results should remain primary unless the query specifically targets engagement features.

## YOUR FMB ACCOUNT SHEET

Include:
- email identity
- Saved Stories
- preferred sections
- Daily Brief
- Breaking News alerts
- FMB Worldwide alerts
- preferred zodiac sign
- weather preference/location
- Home Screen state/help
- crossword progress/continue state when available
- sign out

Do not make this look like a corporate admin dashboard.

## ARTICLE READING VIEW

Make reading feel premium and calm.

Mobile article page should include:
- back
- product identity
- bookmark
- share
- category
- large headline
- deck
- author/desk
- published time
- read time when available
- real editorial image
- readable 17–18px body
- Context
- Why it matters
- What to watch next
- Sources when applicable
- Continue reading section

Avoid carrying a giant desktop footer through the reading experience.

## PWA / HOME SCREEN

The website itself is the mobile app experience.

Preserve:
- manifest
- Home Screen install behavior
- service worker
- personalization state
- push state
- cached shell assets

Cache where practical:
- app shell
- official emblem
- hero identity asset
- Daily Brief mug image
- latest feed snapshot
- current crossword + progress
- selected horoscope edition
- last successful weather response with timestamp

Never display stale weather as fresh.

## MOTION

Use quiet motion only:

- ~180–280ms
- subtle sheet transitions
- restrained header collapse
- bookmark feedback
- underline movement

No excessive parallax.
No floating blobs.
No looping ornamental animations.
Respect `prefers-reduced-motion`.

## ACCESSIBILITY

Required:
- 44px minimum touch targets
- semantic headings
- visible focus states
- good contrast
- meaningful alt text
- labeled icon buttons
- no information conveyed by color only
- keyboard-operable crossword
- reduced motion support

## PERFORMANCE

Required:
- responsive images
- optimized hero/mug derivatives
- intrinsic dimensions/aspect-ratio to avoid layout shift
- lazy load below fold
- no blocking weather request
- avoid unnecessary third-party JS
- do not load full crossword engine globally if it is not needed
- preserve fast first contentful render

## CONTENT INTEGRITY

Do not invent:
- news headlines
- breaking events
- times
- readership counts
- weather
- horoscope claims presented as fact
- crossword streaks
- names

Use the existing FMB article/content system as source of truth.

## DO NOT DO THESE

- do not create another repo
- do not create a separate React Native/Expo app
- do not remove or redesign desktop
- do not add fixed bottom navigation
- do not rename the four products
- do not change FMB Explainer to FMB Explained
- do not replace the approved hero
- do not replace the approved mug
- do not replace the official icon
- do not use generic stock where the approved identity images exist
- do not hardcode mockup stories
- do not turn the interface gold
- do not bundle Apple font files
- do not fake a native app shell that breaks the existing website

## IMPLEMENTATION STRATEGY

1. Audit the current mobile build and existing hardfix/injection scripts.
2. Preserve working email, personalization, PWA, push, and content logic.
3. Retrieve the three exact approved Drive assets.
4. Copy and optimize them into the production asset tree.
5. Reconcile the current mobile CSS with `docs/fmb-mobile-home-reference.html` and `docs/fmb-mobile-brand-reference.css`.
6. Build the home hierarchy exactly as specified.
7. Wire live FMB content into hero/latest cards.
8. Ensure all visible story cards have images.
9. Add date/time utility.
10. Add consent-safe weather.
11. Finish Your FMB personalization surfaces.
12. Implement Weekly Horoscope route.
13. Implement real Weekly Crossword route.
14. Preserve article reading quality.
15. Update CI so regressions fail automatically.
16. Run mobile visual QA at representative iPhone and Android widths.
17. Run desktop regression QA at 700px+ and large desktop.
18. Deploy only after build, verification and public cutover pass.

## CI / ACCEPTANCE TESTS TO ADD OR PRESERVE

Fail CI if:
- premium mobile stylesheet/reference integration disappears
- fixed bottom dock returns
- any of the four official names changes
- `FMB Explained` appears in production navigation
- approved icon path is missing
- mobile hero asset is missing
- Daily Brief mug asset is missing
- primary mobile feed renders image-less cards
- mobile layout introduces horizontal overflow
- app-specific CSS leaks into 700px+ desktop
- service worker/manifest/personalization assets disappear

Manual QA must verify:
- 375–390px iPhone width
- ~412–430px Android width
- safe area behavior
- image crop quality
- text legibility
- rail scrolling
- account sheet
- email sign-in flow
- install prompt logic
- push opt-in flow
- weather consent/denial/manual location
- horoscope selection
- crossword play/autosave/check/reveal
- desktop unchanged

## DEFINITION OF DONE

The task is complete only when:

- the existing FMBNews repo serves the premium mobile app-view below 700px
- desktop remains intact
- official emblem is used correctly
- brand typography and color system match the coded reference
- exact approved hero is present
- exact approved mug is present
- all primary story cards have real images
- live date/time works
- weather is real and permission-safe
- email identity/personalization works
- Home Screen/PWA works
- push notifications remain functional
- FMB News, FMB Worldwide, FMB Explainer and FMB Daily Brief are exact
- Weekly Horoscope works and is properly labeled
- Weekly Crossword is genuinely playable and saves progress
- no bottom navigation exists
- CI passes
- Cloudflare deployment/public cutover passes
- mobile browser QA confirms the app-like visual result

Improve spacing, accessibility, performance, reliability, and polish where you can, but do not redesign away from the coded reference or the locked architecture.
