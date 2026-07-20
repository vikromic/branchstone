# Branchstone final design and interaction QA

Date: 2026-07-19

Scope: mobile-first Carried Ground visual system, the Home and Gallery “Stay” interaction, every localized page, modal and drawer behavior, forms, storage, routing, accessibility, and a separate desktop-layout audit. This report deliberately separates simulator, emulation, desktop, and physical-device evidence.

## Interaction contract

- Home contains seven full-viewport works: July Pines, Born Of Burn, Spring Fire, Mermaid’s Dream, Dreaming, Grounded, and Magnet.
- Native vertical document scrolling is the primary selector. A work commits only after the gesture ends and the viewport settles at its snap position; the Home URL stays unchanged.
- The initial work starts revealing as soon as its image is ready. Each selected work resolves in the fixed order artwork → materials → story → availability, without an artificial selection timer.
- Real wheel movement resets a reveal. Scrolling produced only by keyboard focus navigation does not.
- Only July Pines receives the organic introductory strata frame. Other works remain artwork-led rather than inheriting a sticker-like frame.
- Gallery uses the same viewport-selection contract. Modal focus includes only visible, non-inert controls and recovers inside the dialog if a carousel change hides the focused control.

## Verified environments

| Environment | Coverage | Result |
| --- | --- | --- |
| iPhone 17 Pro, iOS 27 Simulator, Safari/WebKit | Native Home swipes through July Pines → Born Of Burn → Spring Fire; exact snap and phase resolution; Gallery modal; About, Commissions, Contact, Privacy, Terms, custom 404; commission anchor jump | pass |
| Chromium mobile emulation with real CDP touch | 320×568, 390×844, 568×320, and 844×390; all routes/locales; all seven Home works; Gallery selection, filters, all 32 works and modals; forms/storage/history/focus | pass |
| Desktop Chromium | 1280×800, 1440×1000, and 1920×1080; nine EN/UK route states per viewport plus functional form, Gallery, modal, 404, crop, and overflow checks | pass |
| Physical iPhone Safari | Not run from this workspace | not proven |

The actual simulator proof is WebKit/Safari, not a resized desktop browser. It is still not proof for a physical iPhone’s exact GPU, font rasterization, network, browser chrome, or device-specific safe areas.

## Mobile verification

- 32/32 focused Home checks passed.
- 6/6 real touch transitions advanced through all seven Home works, one settled work at a time.
- Observed phase timing after one Chromium touch swipe: the new artwork/material state by 207 ms, story by 933 ms, availability by 1548 ms, and fully resolved by 2166 ms.
- 32/32 route states passed across eight routes, EN/UK, 390×844 and 320×568, with no horizontal overflow, broken image, route mismatch, runtime overlay, or unexpected page/request error.
- Gallery passed 32/32 work selections, 32/32 stream images, 32/32 modal openings, 150/150 modal images, 24/24 filter combinations, and 4/4 URL canonicalization cases.
- Modal keyboard/focus order passed Close → Previous → Next → Reveal → Save → Inquire → Close, including reverse wrap, carousel focus recovery, Escape, and opener restoration.
- Reduced-motion Home, Gallery, and modal states contained no pending, hidden, or inert semantic phase.

Evidence:

- Native iOS Home video: `/tmp/branchstone-ios-home-final-scroll.mov`
- Native iOS Home before/after: `/tmp/branchstone-ios-home-final-before.png`, `/tmp/branchstone-ios-home-final-after.png`
- Native iOS Gallery: `/tmp/branchstone-ios-gallery-final-top.png`, `/tmp/branchstone-ios-gallery-final-narrative.png`, `/tmp/branchstone-ios-gallery-final-modal.png`
- Native iOS pages: `/tmp/branchstone-ios-about-final.png`, `/tmp/branchstone-ios-commissions-retry.png`, `/tmp/branchstone-ios-contact-retry.png`, `/tmp/branchstone-ios-privacy-retry.png`, `/tmp/branchstone-ios-terms-retry.png`, `/tmp/branchstone-ios-not-found-retry.png`
- Exhaustive Chromium evidence: `/tmp/branchstone-postfix-mobile/`, `/tmp/branchstone-mobile-audit/`

## Desktop verification

- 54 rendered states passed: nine pages/routes, EN/UK, at 1280×800, 1440×1000, and 1920×1080.
- Home is a desktop composition: a bounded crisp artwork plane with same-work atmospheric side fields, not a mobile canvas stretched across the viewport. Wheel scrolling snapped exactly to the next work and completed its reveal with zero pending/inert phases.
- Gallery uses desktop grid composition, not stacked mobile layout. All 32 records render; filters, counters, URL state, modal focus, carousel, and real wheel reset pass.
- About selects the 1920-wide source for its full-width portrait and crops with `object-fit: cover`; Contact’s material image also crops without geometric stretching.
- Custom 404 content returns HTTP 404 for unknown EN/UK routes and has document height equal to the viewport. Direct `/404.html` remains HTTP 200.
- Commission native Enter and explicit Continue share validation/step behavior. Contact and Commission errors/statuses translate reactively without reload. Drafts preserve their existing storage envelope format.

Evidence:

- Structured desktop report: `/tmp/branchstone-desktop-postfix.icdthj/postfix-report.json`
- Targeted interaction evidence: `/tmp/branchstone-desktop-postfix.icdthj/targeted-evidence.json`
- Modal focus trace: `/tmp/branchstone-desktop-postfix.icdthj/modal-focus-diagnostic.json`
- Contact sheets: `/tmp/branchstone-desktop-postfix.icdthj/contact-sheet-1280x800.jpg`, `/tmp/branchstone-desktop-postfix.icdthj/contact-sheet-1440x1000.jpg`, `/tmp/branchstone-desktop-postfix.icdthj/contact-sheet-1920x1080.jpg`

## Automated verification

- Final full suite: 14 files, 105/105 tests passed.
- Focused post-cleanup forms, Stay, modal, and routing assertions: 32/32 passed.
- Routing teardown had one reproduced 10-second dependency-scan flake after all assertions passed. Dependency discovery and HMR are now disabled for that middleware-only test; the suite subsequently passed 10/10 three consecutive times in 0.68–0.76 seconds.
- Production client/SSR build passed. Artifact verification passed all 16 localized prerendered entries and the 32/19/13 catalog invariants. `git diff --check` passed.

## Visual fidelity and source limits

The Home retains the supplied reference’s full-bleed mobile artwork, quiet chrome, natural top and bottom strata, irregular mineral seam, and lack of card or sticker silhouettes. Artist artworks were not generated or altered. Generated assets are limited to non-artwork environmental strata/seam layers.

There is one honest production-fidelity blocker that code cannot repair: at least these nine Gallery masters are measurably upscaled in immersive slots—Born Of Burn, Christmas Joy, Core, Moonglow, Of Ash and Flowers, Prolisok, Spectral, Whales, and November Forest. Born Of Burn is only 360×450 and is rendered about 2.6–3.1× wider on larger desktop viewports; the affected Gallery works reach roughly 2.5–3.5× source width. Higher-resolution artist originals are required for genuinely crisp large/Retina presentation. Generative replacement is not acceptable.

## Local access and release boundary

- Current LAN URL: `http://192.168.50.229:8082/`
- The server is bound to `0.0.0.0:8082` and returned HTTP 200 from both loopback and the LAN address during this audit.
- No external email was sent. Mail actions were verified up to local handoff/clipboard behavior.
- No storage schema migration is needed. Expired legacy envelopes are purged on the next site load.
- Nothing was deployed or published in this task.

Current status: local functionality passes across the tested mobile and desktop matrices; physical-iPhone proof and higher-resolution source masters remain outside the evidence boundary.
