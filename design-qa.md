# Branchstone design and interaction QA

Last verified: 2026-07-20

## Interaction contract

- Home contains seven full-viewport works: July Pines, Born Of Burn, Spring Fire, Mermaid's Dream, Dreaming, Grounded, and Magnet.
- Native vertical scrolling is the primary selector. A work commits after the gesture ends and the viewport settles at its snap position; the Home URL remains unchanged.
- Each selected work resolves artwork → materials → story → availability without an artificial selection timer.
- Real wheel movement resets a reveal. Focus-driven scrolling does not.
- Only July Pines receives the introductory geological frame. The other works remain artwork-led.
- Gallery uses the same viewport-selection contract. Filters, saved works, deep links, modal history, carousel state, focus recovery, and scroll locking are part of the supported flow.
- Reduced motion exposes a fully resolved semantic state rather than a frozen animation midpoint.

## Visual contract

- The approved direction is Carried Ground / Eroded Vault: a fused, irregular soil-and-mineral threshold rather than a ribbon, sticker, card, or reusable frame.
- Mobile is full-bleed and touch-first. Desktop uses a bounded artwork plane and independently composed atmospheric fields; it is not the mobile layout stretched wider.
- Artist work is never generated, cosmetically enlarged, or cropped merely to fill a decorative slot.
- Supporting pages share quiet ledger typography, open editorial fields, real material imagery, and one shell vocabulary across Soil/Paper and EN/UK states.

## Verified environments

| Environment | Coverage | Result |
| --- | --- | --- |
| iOS Simulator Safari/WebKit | Native Home swipes, exact snap/reveal order, Gallery modal, supporting pages, custom 404, commission anchor | pass |
| Chromium mobile with touch input | 320×568, 390×844, 430×929, and landscape boundaries; all routes/locales; Home works; Gallery filters, works and modals; forms/storage/history/focus | pass |
| Desktop Chromium | 1280×800, 1366×600, 1440×1000, 1920×1080, and ultra-wide/short boundaries; EN/UK routes, themes, forms, Gallery, modal, 404, crop and overflow | pass |
| Physical iPhone Safari | Not run from this workspace | not proven |

Simulator and emulation results do not prove physical-device GPU behavior, font rasterization, browser chrome, keyboard geometry, safe-area edge cases, or native back-swipe behavior.

## Current verified behavior

- Home advances one settled work per real touch/wheel gesture and resolves the four reveal phases in order. The introductory frame fades away on the next work and returns when scrolling back to July Pines.
- Gallery renders all 32 records, preserves intrinsic artwork geometry, supports collection/status filters, and maintains canonical EN/UK deep links.
- Modal focus wraps through visible controls, recovers after carousel changes, closes with Escape, restores the opener, and leaves no hidden focus targets.
- Practice, Commission, Correspondence, legal pages, the site index, and custom 404 use distinct desktop compositions while remaining consistent with the shared material system.
- Contact and Commission validate locally and provide honest email/clipboard handoff. They do not claim a server submission occurred.
- Existing language, theme, favorite, pending-inquiry, and commission-draft storage envelopes remain backward compatible.
- Unknown EN and UK document routes render the localized custom 404 with HTTP 404; direct `404.html` remains a normal document.

## Automated verification

- Full suite: 19 files, 133 tests.
- Production client and SSR builds plus localized prerendering pass.
- Artifact verification covers 16 localized entries, 32 catalog works, the 19 available / 13 collected split, locale joins, primary media, and deployment files.
- Publishing verifies generated HTML equality, the current stage plus one bounded previous asset generation, the complete local dependency closure, and absence of publisher residue.

## Known source limits

At least Born Of Burn, Christmas Joy, Core, Moonglow, Of Ash and Flowers, Prolisok, Spectral, Whales, and November Forest have masters too small for genuinely crisp immersive Retina presentation. Born Of Burn is 360×450; several works would require roughly 2.5–3.5× enlargement in a full desktop slot. The implementation therefore preserves intrinsic geometry instead of hiding this source limitation. Higher-resolution artist originals are the only acceptable fix.

Generated assets are limited to non-art environmental strata and seam layers. Their texture is directionally matched to the approved concepts rather than pixel-identical. That variation is intentional and must not be 'fixed' by modifying artist media.

## Release boundary

- GitHub Pages currently serves the `v2` branch from `/docs`.
- Root HTML files are Vite source entries; generated `docs` HTML, Ukrainian routes, and assets are the required static deployment artifact.
- `npm run publish` refreshes that artifact locally and preserves artwork media, catalog JSON, CNAME, and site metadata.
- No external email is sent by tests. Commit, push, and deployment are separate actions.
