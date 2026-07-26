# Branchstone design and interaction QA

Last automated verification: 2026-07-25

Last browser matrix: 2026-07-25

## Interaction contract

- Home contains seven full-viewport works: July Pines, Born Of Burn, Spring Fire, Mermaid's Dream, Dreaming, Grounded, and Magnet.
- Native vertical scrolling is the primary selector. A work commits after the gesture ends and the viewport settles at its snap position; the Home URL remains unchanged.
- Each selected work resolves artwork → materials → story → availability without an artificial selection timer.
- Real wheel movement resets a reveal. Focus-driven scrolling does not.
- Only July Pines receives the introductory geological frame. The other works remain artwork-led.
- Gallery uses the same viewport-selection contract. Filters, saved works, deep links, modal history, carousel state, focus recovery, and scroll locking are part of the supported flow.
- Desktop exposes Works, Exhibitions, Practice, and Contact as direct primary routes. The mobile and pre-hydration index exposes the same route order; Commission remains a secondary studio link.
- Practice exposes direct Statement, Biography, and Method anchors. Exhibitions owns the two exhibition and three press records currently available.
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
| In-app Chromium, current local IA | 390×844 Home/index/EN+UK Exhibitions and 1280×720 Works/Exhibitions/Practice/Contact; real route and anchor clicks, content counts, image loading, console, and overflow | pass |
| Public `branchstone.art` | Deployed Home and `/exhibitions.html` checked against the current local IA | old Home / new route 404 |
| Physical iPhone Safari | Not run from this workspace | not proven |

Simulator and emulation results do not prove physical-device GPU behavior, font rasterization, browser chrome, keyboard geometry, safe-area edge cases, or native back-swipe behavior.

## Current verified behavior

- Home advances one settled work per real touch/wheel gesture and resolves the four reveal phases in order. The introductory frame fades away on the next work and returns when scrolling back to July Pines.
- Gallery renders all 32 records, preserves intrinsic artwork geometry, supports collection/status filters, and maintains canonical EN/UK deep links.
- Modal focus wraps through visible controls, recovers after carousel changes, closes with Escape, restores the opener, and leaves no hidden focus targets.
- Practice, Exhibitions, Commission, Contact, legal pages, the site index, and custom 404 use distinct desktop compositions while remaining consistent with the shared material system.
- Contact and Commission validate locally and provide honest email/clipboard handoff. They do not claim a server submission occurred.
- Existing language, theme, favorite, pending-inquiry, and commission-draft storage envelopes remain backward compatible.
- Unknown EN and UK document routes render the localized custom 404 with HTTP 404; direct `404.html` remains a normal document.

## Automated verification

- Full suite: 20 files, 138 tests.
- Production client and SSR builds plus localized prerendering pass.
- Artifact verification covers 18 localized entries, 32 catalog works, the 19 available / 13 collected split, locale joins, primary media, and deployment files.
- Publishing verifies generated HTML equality, the current stage plus one bounded previous asset generation, the complete local dependency closure, and absence of publisher residue.
- Publisher migration coverage proves that a newly added route does not require a pre-existing deployed HTML copy.

## Known source limits

At least Born Of Burn, Christmas Joy, Core, Moonglow, Of Ash and Flowers, Prolisok, Spectral, Whales, and November Forest have masters too small for genuinely crisp immersive Retina presentation. Born Of Burn is 360×450; several works would require roughly 2.5–3.5× enlargement in a full desktop slot. The implementation therefore preserves intrinsic geometry instead of hiding this source limitation. Higher-resolution artist originals are the only acceptable fix.

Generated assets are limited to non-art environmental strata and seam layers. Their texture is directionally matched to the approved concepts rather than pixel-identical. That variation is intentional and must not be 'fixed' by modifying artist media.

The 2026-07-25 information-architecture change was verified in the in-app browser at 390×844 and 1280×720. The local version had no broken images, horizontal overflow, or console warning/error in the checked flows. Physical-device behavior remains unproven. The public domain still serves the previous remote revision: its Home does not expose the new primary navigation and `/exhibitions.html` returns the custom 404.

## Release boundary

- GitHub Pages currently serves `codex/branchstone-carried-ground` from `/docs`.
- Root HTML files are Vite source entries; generated `docs` HTML, Ukrainian routes, and assets are the required static deployment artifact.
- `npm run publish` refreshes that artifact locally and preserves artwork media, catalog JSON, CNAME, and site metadata.
- No external email is sent by tests. Commit, push, and deployment are separate actions.
