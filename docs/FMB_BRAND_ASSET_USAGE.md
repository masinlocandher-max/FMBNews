# FMB News Brand Asset Usage

Claude/Codex: this is the visual brand contract for the FMB News mobile app-view and all Filipino Media Bulletin surfaces. Read this before changing icon, logo, typography, or app chrome.

## 1. Official icon

The official icon is the user-approved gold shell with pearl center.

Primary production asset:

`/news/assets/images/brand/fmb-bulletin-emblem.svg`

Master transparent icon in Google Drive:

- File: `FMB-Icon-Transparent-HD.png`
- Drive file ID: `1ITa79ZHRZi057H5Lv9pa7bcf7G8lDWFs`

Do not redraw, reinterpret, flatten, simplify, recolor, crop, outline, add a badge, add text inside it, or replace it with a generic FMB monogram.

## 2. Approved logo lockup

Mobile header lockup is:

- official emblem
- `FMB News`
- `Filipino Media Bulletin`

Use title case for `FMB News` and normal readable capitalization for the subtitle. The four product names are exactly:

1. FMB News
2. FMB Worldwide
3. FMB Explainer
4. FMB Daily Brief

Never change `FMB Explainer` to `FMB Explained`.

Recommended markup:

```html
<a class="fmb-brand-lockup" href="/news/archive/" aria-label="FMB News — Filipino Media Bulletin">
  <img class="fmb-brand-icon" src="/news/assets/images/brand/fmb-bulletin-emblem.svg" alt="">
  <span class="fmb-brand-copy">
    <strong class="fmb-brand-title">FMB News</strong>
    <small class="fmb-brand-subtitle">Filipino Media Bulletin</small>
  </span>
</a>
```

## 3. Exact mobile logo CSS

```css
:root{
  --fmb-plum:#2B1235;
  --fmb-plum-deep:#1A0B20;
  --fmb-violet:#6E3A8A;
  --fmb-lilac:#E9DFF0;
  --fmb-gold:#C9A84D;
  --fmb-ui:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Inter,Helvetica,Arial,sans-serif;
  --fmb-display:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",Inter,Helvetica,Arial,sans-serif;
}

.fmb-brand-lockup{
  display:flex;
  align-items:center;
  gap:10px;
  min-width:0;
  color:#fff;
  text-decoration:none;
}

.fmb-brand-icon{
  display:block;
  width:40px;
  height:40px;
  flex:0 0 40px;
  object-fit:contain;
}

.fmb-brand-copy{
  display:flex;
  flex-direction:column;
  min-width:0;
  line-height:1;
}

.fmb-brand-title{
  color:#fff;
  font-family:var(--fmb-display);
  font-size:20px;
  font-weight:750;
  line-height:1.05;
  letter-spacing:-0.025em;
}

.fmb-brand-subtitle{
  margin-top:4px;
  color:rgba(255,255,255,.68);
  font-family:var(--fmb-ui);
  font-size:9.5px;
  font-weight:650;
  line-height:1;
  letter-spacing:.12em;
  text-transform:uppercase;
  white-space:nowrap;
}
```

## 4. Clear space and scale

Mobile header:

- emblem: 38–42 px, target 40 px
- minimum clear space around emblem: visually equivalent to about 8 px
- gap icon to wordmark: 10 px
- header total height: about 64–72 px plus safe area
- never let the icon touch the viewport edge
- never crop the shell or pearl

Larger marketing/editorial placements may scale the icon proportionally, but must preserve its original aspect ratio and optical breathing room.

## 5. App / Home Screen icon

Use the official emblem only.

Preferred icon background: `#2B1235`.
Alternate deep background: `#1A0B20`.

Rules:

- no text inside the app icon
- no second frame
- no decorative ring
- no ribbon or badge
- no generic newspaper symbol
- no white recolor
- no flat purple recolor
- do not manually add rounded corners inside the source image; let the platform mask the icon
- maintain generous breathing room around the shell

## 6. Typography

Primary mobile UI and reading font stack:

```css
font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Inter,Helvetica,Arial,sans-serif;
```

Display/headline stack:

```css
font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",Inter,Helvetica,Arial,sans-serif;
```

Do not bundle, upload, distribute, or commit Apple font files.

Recommended mobile hierarchy:

- app wordmark: 20 px / 750
- product rail: 13–14 px / 650–750
- hero headline: 31–36 px / 800
- section heading: 24–28 px / 800
- story headline: 17–19 px / 700–760
- body/article reading: 17–18 px / 400–500, generous line height
- metadata: 11–13 px / 550–700

Do not use decorative serif type for core app UI. A serif may be introduced only for a deliberate longform/special editorial treatment, never for controls or navigation.

## 7. Color behavior

Header background:

```css
background:linear-gradient(180deg,#2B1235 0%,#1A0B20 100%);
```

Primary app background: `#F5F5F7`.
Primary surfaces: `#FFFFFF`.
Primary ink: `#1D1D1F`.
Secondary text: `#6E6E73`.
Violet interaction: `#6E3A8A`.
Lilac support surface: `#E9DFF0`.
Controlled gold: `#C9A84D`.

Gold must remain rare. Use it for the official emblem, selected prestige details, and restrained editorial accents. Do not turn the entire interface gold.

## 8. Prohibited logo treatments

Never:

- place the emblem inside another unrelated shape
- stretch or squash it
- rotate it
- apply neon glow
- apply heavy white drop shadow
- use an embossed fake-3D UI treatment around it
- use a generic purple circle behind it when the plum header already provides the background
- recolor it to match section colors
- use multiple different FMB icons in one header
- substitute text `FMB` for the icon when the official icon can be rendered

## 9. Icon system for UI controls

The official emblem is a brand icon, not a generic UI icon.

Search, bookmark, share, account, weather, crossword, navigation, close, and other controls should use simple monochrome line icons with:

- approximately 1.8–2 px stroke at 24 px icon size
- rounded line caps/joins
- 44 px minimum touch target
- white on plum header
- `#1D1D1F` or `#6E6E73` on white surfaces
- `#6E3A8A` for selected/interacting state

Do not use gold for every interface icon.

## 10. Google Drive source assets

Approved original visual assets are stored in the user's connected Google Drive and should be copied into stable production paths before final implementation.

Known exact Drive assets:

- Official transparent FMB icon: `FMB-Icon-Transparent-HD.png`, ID `1ITa79ZHRZi057H5Lv9pa7bcf7G8lDWFs`
- Approved mobile hero source uploaded by the user: `E85E78F1-429E-42EC-8E0D-74CC1D29960A.png`, ID `1BFsbaXgrFqyBuD4R2ummFR87FUSxACq1`

The approved FMB Daily Brief coffee-mug image is also stored in Google Drive. If its exact Drive file ID is not already documented at takeover time, locate the recently supplied approved mug asset in Drive before implementing it. Do not substitute generic coffee imagery.

Target production paths:

- hero: `/news/assets/images/mobile/fmb-mobile-hero.jpg` or optimized `.webp` equivalent referenced consistently
- Daily Brief mug: `/news/assets/images/mobile/fmb-daily-brief-mug.jpg` or optimized `.webp` equivalent referenced consistently

## 11. Final brand test

Before shipping, verify:

- official emblem is the supplied shell/pearl icon
- no substitute monogram exists in mobile header
- wordmark reads exactly `FMB News`
- subtitle reads `Filipino Media Bulletin`
- typography uses the approved system stack
- no Apple font files are committed
- icon has clear space
- gold is controlled, not dominant
- all four official product names are exact
- mobile visual language remains premium, restrained, editorial, and app-like
