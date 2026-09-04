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
- attach FMB News production to the Vercel `withlovefmb` project sourced from `FMB-Ecosystem`.

All newsroom application, publishing, routing, design, SEO, CMS integration, archive, and deployment changes belong in this repository.

The main-site hosting arrangement may change independently. That does not change FMB News repository ownership or its Cloudflare deployment boundary.