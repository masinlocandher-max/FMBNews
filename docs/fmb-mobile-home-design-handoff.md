# FMB News Mobile Home Design Handoff

## Purpose

This is the approved direction for the **mobile FMB News experience**. It lives in the same `FMBNews` repository and the same `/news/` product. Do **not** create a separate mobile application repository.

The desktop publication must remain a full editorial website. On phones, the same site must behave and look like a premium installed news app.

Treat this document as the source of truth when refining the mobile UI. Improve fidelity, usability, performance, accessibility and interaction quality, but do not replace the core identity or information architecture.

## Locked product names

Use these exact names everywhere:

1. **FMB News**
2. **FMB Worldwide**
3. **FMB Explainer**
4. **FMB Daily Brief**

Do not rename FMB Explainer to "FMB Explained". Do not expose the retired visible label "FMB Brief".

## Mobile versus desktop rule

- Desktop/tablet at `700px+`: retain the current publication website experience unless a desktop-specific task explicitly changes it.
- Mobile below `700px`: render the dedicated app-style FMB News experience.
- Mobile `/news/` may enter the FMB News feed directly rather than showing the desktop-oriented publication marketing landing.
- Do not create a second deployment or duplicate content system.
- Do not add fixed bottom navigation. Primary product navigation stays at the top.

## Approved visual direction

The mobile app should feel like a premium Filipino news intelligence product, not a responsive blog and not a generic news template.

### Palette

- FMB Plum: `#2B1235`
- Deep Plum: `#1A0B20`
- Violet: `#6E3A8A`
- Lilac: `#E9DFF0`
- App background: `#F5F5F7`
- Surface: `#FFFFFF`
- Ink: `#1D1D1F`
- Secondary text: `#6E6E73`
- Hairline: `#D9D9DF`
- Controlled gold: `#C9A84D`

Gold is a prestige accent. Do not flood the interface with gold.

### Typography

- iOS: SF Pro Display / SF Pro Text through the normal Apple system font stack.
- Cross-platform fallback: Inter or the existing system sans stack.
- Main editorial body should remain comfortably readable at roughly `17px` to `18px` on phones.
- Avoid tiny metadata and browser-default button/input typography.

### Official emblem

The official identity is the existing gold shell-and-pearl FMB emblem:

`public/assets/images/brand/fmb-bulletin-emblem.svg`

Use this as the primary mobile brand mark. Do not replace it with a generic FMB monogram.

## Approved mobile home composition

The target home screen follows this order:

### 1. App header

Dark plum/deep-plum header with:

- official shell emblem
- `FMB News`
- small `Filipino Media Bulletin` subtitle
- search control
- reader/account control

Respect iOS safe-area insets. The header should feel native and compact.

### 2. Four-product rail

Directly under the app header:

`FMB News   FMB Worldwide   FMB Explainer   FMB Daily Brief`

- horizontally scrollable if required
- selected item gets a restrained gold/violet active indicator
- no pill-heavy UI
- no bottom nav duplication

### 3. Personalized greeting

Examples:

- `Good evening`
- once signed in, `Good evening, Francine`

Support copy can be concise, such as `Here’s what’s happening.`

A `Customize` action opens the existing personalization/preferences experience.

### 4. Supplied hero image

The user supplied the approved hero art: a cinematic indigo/plum global newsroom collage with a large gold FMB shell emblem centered, world map/network connections, breaking-news scenes, newsroom monitors, elections, global city, emergency response and satellite imagery.

This image is the visual anchor of the first mobile viewport.

Production asset target:

`public/assets/images/mobile/fmb-mobile-home-hero.webp`

If the production binary is not yet present when taking over, obtain the exact supplied image from the user/current working assets and save it at this path. **Do not substitute a generic stock hero.**

Hero behavior:

- full-width premium media card
- around `16:9` / editorial landscape ratio
- rounded corners consistent with the approved mockup
- restrained dark bottom readability fade is allowed for overlaid story copy
- do not wash the entire image with an opaque brand tint
- overlay current real FMB content, not fictional sample headlines
- CTA can lead to the active top story or latest top stories

### 5. Latest News

Every visible story card must have an image.

This is a hard visual rule for the mobile home unless a genuine editorial asset is unavailable and a clearly labeled fallback is required.

Use actual FMB News story data. Do not hardcode mockup-only claims.

Preferred card anatomy:

- real/rights-cleared story image
- category
- headline
- relative/published time
- reading time when available
- save/bookmark control when the reader system supports it

The approved concept uses image-forward cards. Do not regress to text-only rows.

### 6. FMB Daily Brief coffee module

The approved home design explicitly includes a **branded plum coffee mug with the FMB shell emblem and visible steam** on the left side of the FMB Daily Brief module.

This visual is required. Do not omit it and do not replace it with a generic envelope-only block.

Production asset target:

`public/assets/images/mobile/fmb-daily-brief-coffee.webp`

If the exact crop is not yet present when taking over, recreate/extract the approved visual from the approved mockup/current design assets: glossy dark-plum mug, gold FMB shell emblem, coffee visible, warm bokeh background, steam rising.

Daily Brief module:

- deep plum premium panel
- coffee mug image on the left/top depending phone width
- `FMB Daily Brief`
- concise value proposition
- one primary action: `Read Today’s Brief`
- if email/session exists, personalize the module rather than showing a redundant signup prompt

Do not display invented reader counts unless backed by actual data.

### 7. Breaking News rail

A narrow urgent module may sit near the bottom of the initial home sequence:

- clear `BREAKING NEWS` label
- actual approved breaking story
- time
- opens the real story

Do not hardcode fake earthquake, bridge, election or other alert copy from design mockups.

## Data and factuality rules

The approved design mockups are visual references only. Their sample headlines are not factual source material.

Production content must come from the actual FMB News publishing/content system.

- current story title from CMS/archive
- current category
- current image and rights metadata
- current published time
- current URL
- current breaking status where applicable

Do not fabricate names, statistics, news events, reader counts or alerts to make the interface resemble the mockup.

## Image quality rule

The mobile home is intentionally image-rich.

- hero: supplied FMB hero art
- latest news: image on every card
- Daily Brief: branded coffee mug image
- article images: real documentary/official/rights-cleared images wherever possible
- avoid generic editorial SVG fallback for ordinary breaking stories when a legitimate image is available
- preserve source/credit metadata where the newsroom already supports it

## Personalization and account behavior

Preserve the existing mobile reader system in:

`public/assets/js/fmb-news-mobile-personalization.js`

It already covers email identity/session recovery, reader preferences, push subscription logic and personalization hooks. Improve the UI around it rather than replacing it with a disconnected system.

The mobile home should expose:

- account/reader control in header
- Customize/preferences entry
- saved-story continuity when available
- Daily Brief preference
- Breaking News alerts
- FMB Worldwide updates
- preferred sections
- Home Screen installation prompt at an appropriate moment after email identity is known

Do not force registration before basic news reading.

## Current implementation files to inspect first

- `public/assets/css/fmb-news-mobile-premium.css`
- `public/assets/js/fmb-news-mobile-premium.js`
- `public/assets/css/fmb-news-mobile-first-site.css`
- `public/assets/css/fmb-news-mobile-personalization.css`
- `public/assets/js/fmb-news-mobile-personalization.js`
- `scripts/hardfix-mobile-first-site.mjs`
- `scripts/hardfix-product-identity.mjs`
- `scripts/hardfix-publication-landing.mjs`
- `scripts/render-metallic-reference.mjs`
- `.github/workflows/verify-standalone.yml`

Do not rebuild the newsroom from scratch. Continue from current working functionality.

## Implementation quality target

The user wants the mobile product to feel like a **US$100k-class news app**.

That means:

- excellent spacing and optical alignment
- strong real-image treatment
- intentional typography
- native-feeling safe areas and scrolling
- no accidental desktop leftovers on mobile
- no generic template cards
- no tiny text
- no layout shifts
- no fake content
- polished focus/active/pressed states
- accessible controls and contrast
- reduced-motion support
- fast first paint and optimized media loading

## Claude takeover instruction

When Claude takes over:

1. Read this file before changing mobile UI.
2. Inspect the current built mobile output and current `main` branch rather than assuming this is a fresh build.
3. Preserve desktop behavior and all working CMS/personalization/push functionality.
4. Bring the mobile home closer to the approved design, then improve it further where that produces a more polished, usable and coherent product.
5. Use the supplied hero art and the branded coffee mug visual as required visual assets.
6. Keep all visible story content real and dynamically sourced.
7. Keep the exact four product names locked.
8. Run `npm run build` and `npm run verify` after changes.
9. Perform rendered mobile visual QA at iPhone-scale widths and desktop regression QA before handoff.
10. Do not declare design completion based only on CI. Verify the rendered UI.

## Acceptance checklist

The mobile home is not done until all are true:

- [ ] desktop remains intact at 700px+
- [ ] mobile looks like an app, not a collapsed desktop page
- [ ] official shell emblem is visible in app chrome
- [ ] exact four-product rail is present
- [ ] supplied hero image is used
- [ ] every visible latest-story card has an image
- [ ] coffee mug visual appears in FMB Daily Brief module
- [ ] actual story data replaces mockup sample text
- [ ] breaking rail is data-backed
- [ ] email/personalization/push behavior still works
- [ ] no fixed bottom navigation
- [ ] build and verification pass
- [ ] mobile rendered visual QA is completed
- [ ] desktop regression QA is completed
