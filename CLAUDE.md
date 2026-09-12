# Claude Takeover Notes

This repository is the canonical FMB News / Filipino Media Bulletin codebase.

Read `AGENTS.md` first. Its current production and visual rules are authoritative.

The user has approved a distinct mobile app-style experience inside the same website build. Desktop remains a premium digital publication. Mobile below 700px should feel like a polished installed news app without becoming a separate codebase.

## Critical locked rules

- Keep everything in this `FMBNews` repo. Do not create a separate app repo.
- Preserve current CMS, personalization, passwordless email session, push, Home Screen/PWA logic, SEO, routes, data, and Cloudflare deployment boundary.
- Do not rebuild from scratch. Improve the existing product incrementally.
- Current masthead is `FMB NEWS.` with a crimson period and `FILIPINO MEDIA BULLETIN` beneath it.
- Do not restore the old visible gold shell-and-pearl emblem in the masthead or mobile shell.
- The active palette is editorial ivory/paper + ink/charcoal + crimson with restrained silver/steel/gunmetal accents.
- Frosted transparency is primary. Matte metallic treatment is secondary and subtle. No flashy chrome, neon, cyberpunk, or dashboard styling.
- Persistent appearance modes: System, Light, Dark.
- Homepage editorial desks: News, World, Sports.
- Primary navigation: Home, World, Sports, Daily Briefing, Fact Check, Explainers, Entertainment. Entertainment contains Horoscope and Crossword.
- Mobile header: compact FMB identity on the left; Search, Theme, Menu on the right; horizontally scrolling category rail below.
- Mobile bottom navigation is now APPROVED and REQUIRED: Home, World, Sports, Briefing, Menu. This supersedes the older no-bottom-nav instruction.
- The older cinematic/global-newsroom mobile hero is no longer the visual authority. Keep only behavior or data contracts that remain useful; do not restore it as the visible design just to satisfy obsolete handoff notes.
- Every visible Latest News card should keep real imagery where real imagery exists.
- Production headlines, times, images, alerts, scores and editorial states must come from real FMB News data. Do not fabricate content to fill a layout.
- Homepage must include About FMB / Francine Marie Bautista as Founder, FMB News with a deliberate 4:5 portrait placeholder. Never generate or substitute a founder portrait without an approved source image.
- Article bodies remain solid, readable editorial surfaces. Do not put long-form copy on glass.

## Build / QA

Run `npm run build` and `npm run verify`, then perform rendered phone QA and desktop regression QA before declaring completion. Check Light, Dark and System modes; Latest rail; PHT date/time; mobile bottom navigation; Entertainment submenu; About founder module; all current routes; article imagery; SEO/structured data; and PWA behavior.

If an older document or verifier conflicts with these current rules, update that stale contract deliberately rather than reverting the approved product direction.