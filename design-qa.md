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

- Final full suite: 14 files, 106/106 tests passed.
- Focused post-cleanup forms, Stay, modal, and routing assertions: 32/32 passed.
- Routing teardown had one reproduced 10-second dependency-scan flake after all assertions passed. Dependency discovery and HMR are now disabled for that middleware-only test; the suite subsequently passed 10/10 three consecutive times in 0.68–0.76 seconds.
- Production client/SSR build passed. Artifact verification passed all 16 localized prerendered entries and the 32/19/13 catalog invariants. `git diff --check` passed.

## Visual fidelity and source limits

The Home retains the supplied reference’s full-bleed mobile artwork, quiet chrome, natural top and bottom strata, irregular mineral seam, and lack of card or sticker silhouettes. Artist artworks were not generated or altered. Generated assets are limited to non-artwork environmental strata/seam layers.

The final mobile top edge uses the user-selected, more natural unified ImageGen source rather than separately positioned soil and mineral stickers:

- Selected source: `/Users/denysmalyshev/.codex/generated_images/019f7852-fe5d-78d3-8425-03580280f1b0/exec-d9751fa9-ae98-4e43-bce4-61bfd0333b99.png`
- Runtime asset: `src/assets/material-stage/home-top-composite-alpha.webp`
- Final mobile capture: `/tmp/branchstone-preferred-natural-home-430x929.png`
- Scroll-to-next capture: `/tmp/branchstone-preferred-scroll-next-430x929.png`
- Desktop capture: `/tmp/branchstone-preferred-natural-home-1280x800.png`
- Mobile/desktop comparison: `/tmp/branchstone-preferred-final-comparison.png`

At 430×929, real in-app-browser touch input settled July Pines → Born Of Burn at `scrollY: 929` and reduced the introductory frame opacity to effectively zero; the reverse gesture settled back at `scrollY: 0` and restored the frame opacity to effectively one. The next work therefore receives neither the top geological edge nor the bottom strata, exactly as approved. Responsive captures at 320×568, 430×929, 559×844, 568×320, 699×844, 700×844, 844×390, and 1280×800 showed no horizontal overflow. Gallery remained on its own material composition and did not load the new Home-only composite.

There is one honest production-fidelity blocker that code cannot repair: at least these nine Gallery masters are measurably upscaled in immersive slots—Born Of Burn, Christmas Joy, Core, Moonglow, Of Ash and Flowers, Prolisok, Spectral, Whales, and November Forest. Born Of Burn is only 360×450 and is rendered about 2.6–3.1× wider on larger desktop viewports; the affected Gallery works reach roughly 2.5–3.5× source width. Higher-resolution artist originals are required for genuinely crisp large/Retina presentation. Generative replacement is not acceptable.

## Desktop Concept 3 design-to-implementation QA

The selected desktop direction is Concept 3, “Eroded Vault”: one fused red-brown soil and blue/ochre mineral overhang forming an asymmetric shallow vault. It is not a ribbon, a floating seam, or a second frame around every work. The asset appears only on the July Pines introductory state; all subsequent works remain clean artwork planes.

Visual-truth comparison used one viewport and one resolved state throughout:

- Source visual truth: `/Users/denysmalyshev/.codex/generated_images/019f7852-fe5d-78d3-8425-03580280f1b0/exec-af89d72d-900c-4f7c-b522-9107327b5f79.png`
- Runtime capture: `/tmp/branchstone-desktop-vault-final/home-1505x1045-final.png`
- Final deliverable capture: `/tmp/branchstone-desktop-vault-final/desktop-deliverable-1440x1000.png`
- Full same-size comparison: `/tmp/branchstone-desktop-vault-final/compare-full-final.png`
- Focused top-layer comparison: `/tmp/branchstone-desktop-vault-final/compare-top-final.png`
- Viewport and state: 1505×1045, Home, EN, July Pines, `scrollY: 0`, all Stay phases resolved, introductory frame visible.

Typography, header spacing, artwork scale, metadata placement, color balance, copy, bottom material layer, and the fused top silhouette were inspected in the combined comparison—not as isolated screenshots. The final implementation preserves the reference’s quiet typography and artwork dominance while using real transparent ImageGen material assets rather than CSS-drawn geology.

Three visible-difference rounds were resolved:

1. The first generated desktop asset produced a deep, centered U-shape that overpowered the artwork. It was rejected and regenerated as the selected asymmetric shallow vault.
2. At 1366×600 and 2400×1200, the metadata sat too close to the mineral contour. The desktop offsets and ultra-wide artwork-relative anchoring were corrected.
3. An independent review then reproduced a P1 collision at 1920–2400×600: a width-driven regular vault was too deep for the short viewport. A dedicated shallow ImageGen asset is now selected only when desktop height is at most 620 px and aspect ratio is at least 9:4. It is a native-pixel transparent crop/translation, not a CSS-distorted texture.

Responsive evidence:

- Standard desktop: `/tmp/branchstone-desktop-vault-final/desktop-700x844.png`, `desktop-1024x768.png`, `desktop-1280x800.png`, `desktop-1440x1000.png`, `desktop-1920x1080-final.png`, and `desktop-2400x1200-final.png`.
- Source-switch boundary: `/tmp/branchstone-desktop-vault-final/desktop-aspect-1349x600-final.png` and `desktop-aspect-1350x600-final.png`.
- Short desktop: `/tmp/branchstone-desktop-vault-final/desktop-aspect-1366x600-short-final.png`, `desktop-aspect-1440x600-short-final.png`, `desktop-aspect-1920x600-short-final.png`, and `desktop-aspect-2400x600-short-final.png`.
- Regular-vault height boundary: `/tmp/branchstone-desktop-vault-final/desktop-aspect-1366x620-final.png`, `desktop-short-1681x620.png`, `desktop-short-1920x620.png`, and `desktop-short-2400x620.png`.
- Mobile regression: `/tmp/branchstone-desktop-vault-final/mobile-scroll-initial.png`, `mobile-scroll-next.png`, and `mobile-scroll-return.png`.
- Gallery regression: `/tmp/branchstone-desktop-vault-final/gallery-1440x1000-regression.png`.

Across this matrix there were zero broken images and zero horizontal overflow. Real mobile scrolling settled 0 → 929 → 0 and real desktop scrolling settled 0 → 1045 → 0; both changed July Pines → Born Of Burn → July Pines and introductory-frame opacity 1 → 0 → 1. The next-work captures contain no geological frame. Gallery retained its one gallery-owned seam and all 21 visible links; no Home material asset leaked into that route. Runtime logs contained no warning or error.

Independent review was deliberately adversarial and cross-family:

- Native Codex first reproduced a real P1 collision at 1920×600 and returned `NOT READY`. That finding drove the dedicated shallow-vault asset and aspect-specific `<picture>` source. Its independent post-fix recheck returned `READY` with no P0/P1/P2 and reran all 106 tests.
- Gemini 3.1 Pro High returned `NOT READY`, classifying the full-bleed ultra-wide ceiling, bottom-only 120rem fade, and proportional top asset as two P1s. The cited captures were reopened at original resolution. `/tmp/branchstone-desktop-vault-final/desktop-2400x1200-final.png` shows a deliberate full-bleed ceiling and artwork-relative foreground rather than a broken shared bound; `/tmp/branchstone-desktop-vault-final/desktop-aspect-2400x600-short-final.png` and `desktop-short-2400x620.png` show the shallow contour clear of the metadata and the primary artwork still dominant. There is no clipping, overflow, hidden control, unreadable text, or contradiction of the selected Concept 3 visual truth, so the claimed P1 severity was not confirmed. The different top and bottom bounds remain an intentional depth treatment.
- OpenCode GLM 5.2 independently returned `READY`, reran 106/106 tests plus the full production build and artifact verification, and confirmed the source order, SSR output, CSS cascade, Home/Gallery isolation, and migration boundary. It explicitly could not perform a pixel judgment because that model endpoint lacked image input, so this counts as supplemental architecture/regression evidence rather than a second visual verdict.
- Claude Fable 5 supplied useful earlier visual feedback before the short-vault fix, but both requested final blind rechecks terminated at their USD budget limits without a verdict. They are recorded as unavailable, not as successful reviews.

The remaining P3 difference is intentional generative texture variation: the transparent desktop material is not a pixel-identical crop of the concept render, but its fused structure, palette, edge hierarchy, asymmetric vault, and visual weight match the approved direction. Physical-iPhone proof and the previously documented low-resolution Gallery masters remain outside this desktop pass’s evidence boundary.

The obsolete Home-only `top-strata-alpha.png` and `top-strata-alpha.webp` sources were removed after reference search confirmed that the unified assets replaced their only importer. The non-alpha `top-strata.webp` remains because Commissions still uses it; Gallery and Contact seam assets also remain live.

## Local access and release boundary

- Current LAN URL: `http://192.168.50.229:8082/`
- The server is bound to `0.0.0.0:8082` and returned HTTP 200 from both loopback and the LAN address during this audit.
- No external email was sent. Mail actions were verified up to local handoff/clipboard behavior.
- No storage schema migration is needed. Expired legacy envelopes are purged on the next site load.
- Nothing was deployed or published in this task.

Current status: local functionality and the approved natural Home edge pass across the tested mobile and desktop matrices; physical-iPhone proof and higher-resolution source masters remain outside the evidence boundary.

final result: passed
