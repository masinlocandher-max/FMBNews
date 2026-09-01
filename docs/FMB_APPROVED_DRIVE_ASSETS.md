# FMB Approved Google Drive Assets

These are the exact user-approved visual assets for the FMB News premium mobile app-view. Claude/Codex should use these exact files and must not substitute generic artwork.

## Official FMB icon

Approved gold shell with pearl center.

- Google Drive title: `14805104-70C9-49A1-AF52-770AD709D4D2.png`
- Google Drive file ID: `1SZFHuvoOHPlSi_GmqVdTtqk-4UycESEw`
- Use: mobile header brand icon, Home Screen/PWA app icon source, brand lockup.
- Production target: `/news/assets/images/brand/fmb-bulletin-emblem.svg` when that in-repo asset matches the approved icon, otherwise replace/update the production brand asset from this approved source.

Do not redraw, recolor, simplify, flatten, crop, or replace this icon.

## Approved mobile hero

Global/news collage with the large official gold FMB emblem in the center.

- Google Drive title: `E85E78F1-429E-42EC-8E0D-74CC1D29960A.png`
- Google Drive file ID: `1BFsbaXgrFqyBuD4R2ummFR87FUSxACq1`
- Use: premium mobile home hero visual.
- Production target: `/news/assets/images/mobile/fmb-mobile-hero.webp` (preferred optimized output) or `/news/assets/images/mobile/fmb-mobile-hero.jpg`.

The image is visual identity only. Headline, category, deck, date/time, and links over/around it must come from real FMB content. Do not hardcode fictional mockup stories.

## Approved FMB Daily Brief coffee mug

Purple coffee mug with official gold FMB emblem.

- Google Drive title: `83960F27-4024-4FFA-A91D-F4710BBA147F.png`
- Google Drive file ID: `1KUeapU5-UNZocnOPWRze220hlm5BYg_h`
- Use: FMB Daily Brief feature module on mobile home.
- Production target: `/news/assets/images/mobile/fmb-daily-brief-mug.webp` (preferred optimized output) or `/news/assets/images/mobile/fmb-daily-brief-mug.jpg`.

Do not substitute a generic coffee cup or regenerate a different mug.

## Asset handling rules

1. Retrieve the source from the connected Google Drive.
2. Preserve the visual content and aspect ratio.
3. Produce a web-optimized derivative for production while retaining sufficient visual quality.
4. Set intrinsic width/height or aspect-ratio to prevent layout shift.
5. Use responsive `srcset`/sizes where useful.
6. Do not ship Drive URLs as permanent public image URLs. Copy approved assets into the FMBNews production asset tree.
7. Do not expose unnecessary Drive metadata in public HTML.
8. Cache the hero and mug for the PWA/offline shell where practical.

## Related implementation files

Read together:

- `docs/fmb-mobile-home-reference.html`
- `docs/fmb-mobile-brand-reference.css`
- `docs/FMB_BRAND_ASSET_USAGE.md`
- `docs/FMB_MOBILE_IMPLEMENTATION_CONTRACT.md`
- `docs/FMB_MOBILE_APP_EXPERIENCE.md`
