# FMB News canonical repository

This repository is the authoritative and self-contained codebase for FMB News / Filipino Media Bulletin.

Production ownership:

- Repository: `masinlocandher-max/FMBNews`
- Runtime: Cloudflare Worker `fmb-news`
- Canonical public route: `https://www.francinemariebautista.com/news/`

## Hard rules for agents

Do not:

- deploy FMB News from Vercel;
- treat `masinlocandher-max/FMB-Ecosystem` as a source, origin, proxy target, route owner, deployment source, or fallback copy;
- move, mirror, or restore the FMB News application inside `FMB-Ecosystem`;
- attach FMB News production to the Vercel `withlovefmb` project sourced from `FMB-Ecosystem`;
- rebuild or migrate the working application merely to implement a visual redesign;
- rename or break current public article routes, canonical URLs, data contracts, publishing/CMS integrations, PWA behavior, personalization, authentication, analytics, SEO metadata, or Cloudflare ownership;
- replace production data with mock news, invented scores, invented fact checks, invented horoscope content, or fabricated founder claims;
- fabricate or substitute a stock/AI founder portrait. Use the intentional 4:5 founder portrait placeholder until an approved photograph is supplied.

All newsroom application, publishing, routing, design, SEO, CMS integration, archive, and deployment changes belong in this repository.

The main-site hosting arrangement may change independently. That does not change FMB News repository ownership or its Cloudflare deployment boundary.

## Active visual/product direction — 2026-09-12

Newer explicit product direction supersedes older handoff notes that conflict with this section.

- Canonical masthead: `FMB NEWS.` with the period in editorial crimson and `FILIPINO MEDIA BULLETIN` beneath it.
- No visible shell emblem or secondary logo in the masthead/mobile shell.
- Palette: editorial ivory/paper, ink/deep charcoal, crimson, restrained silver/steel/gunmetal support.
- Frosted transparency is the primary digital material. Matte metal is a restrained structural accent, never flashy chrome.
- Support persistent `System`, `Light`, and `Dark` appearance modes.
- Homepage editorial desks: News, World, Sports.
- Primary navigation: Home, World, Sports, Daily Briefing, Fact Check, Explainers, Entertainment. Entertainment contains Horoscope and Crossword. About remains available as an institutional utility.
- Moving headline rail is visibly labeled `LATEST` unless a genuinely breaking story warrants `BREAKING`.
- Philippine Standard Time is authoritative for publication date/time using `Asia/Manila`.
- Mobile is intentionally app-like below 700px: compact FMB masthead, Search/Theme/Menu utilities, horizontally scrollable category rail, and a five-item bottom navigation: Home, World, Sports, Briefing, Menu.
- Keep article reading surfaces solid and high-contrast. Do not place long-form journalism on translucent glass.
- Homepage includes an institutional About FMB founder module with Francine Marie Bautista identified as Founder, FMB News and an image-free 4:5 portrait placeholder until an approved portrait is supplied.

## Change discipline

Before editing, inspect the existing implementation and reuse working components and behavior wherever practical. Make presentation-layer changes incrementally. Do not use destructive git cleanup/reset operations. Do not remove a component or dependency until its usage is understood.

Run `npm run build` and `npm run verify`, then perform rendered phone and desktop regression QA before declaring a redesign complete. A prettier but broken FMB News build is a failed result.