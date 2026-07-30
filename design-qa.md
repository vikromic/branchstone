# Branchstone design and interaction QA

Last automated verification: 2026-07-29

Last browser matrix: 2026-07-29

## Continuous Mobile Experience release goal

Make the mobile portfolio the clearest and most complete way to encounter Branchstone: fast, fluid, self-explanatory, and comfortable to operate with one hand. Continuous improvement means repeating critical audit, implementation, measurement, and review; it does not make approval indefinite. A release receives final mobile UX approval only when the current source revision has:

- no open P0 or P1 finding in an independent critical UI/UX review;
- no horizontal overflow, covered controls, scroll traps, lost filter/scroll context, or cropped artwork on the 320–430 CSS px matrix;
- mobile LCP no greater than 2.5 seconds, INP no greater than 200 ms, and CLS no greater than 0.1 on the defined release profile;
- complete EN/UK functional parity, 44×44 px primary touch targets, reduced-motion support, and usable 200% text reflow;
- current physical iOS Safari and Android Chrome evidence for browser chrome, safe areas, system Back/back-swipe, keyboard geometry, and perceived touch/GPU smoothness;
- a moderated task test with at least eight target users, at least 90% first-attempt completion without prompting, and no critical usability blocker.

Automated and emulated evidence can approve the implementation boundary. It cannot be relabeled as physical-device or moderated-usability evidence.

The physical browser matrix and approval/invalidation rules are defined in `mobile-device-validation.md`. The participant mix, bilingual task script, scoring sheet, and moderated approve/reject rules are defined in `mobile-usability-validation.md`. Both protocols are ready to run but have no device or participant results yet.

## Interaction contract

- Home contains seven full-viewport works: July Pines, Born Of Burn, Spring Fire, Mermaid's Dream, Dreaming, Grounded, and Magnet.
- Native vertical scrolling is the primary selector. A work commits after the gesture ends and the viewport settles at its snap position; the Home URL remains unchanged.
- Each selected work resolves artwork → materials → story → availability without an artificial selection timer.
- Real wheel movement resets a reveal. Focus-driven scrolling does not.
- Only July Pines receives the introductory geological frame. The other works remain artwork-led.
- On mobile, Gallery is a scan-first semantic index: all works and their collection, year, title, availability, and explicit View action are discoverable without waiting for a narrative reveal sequence. Native filters replace hidden horizontal filter scrolling.
- From 760 px, Gallery retains the atmospheric Stay stream. Both modes share filters, saved works, canonical deep links, modal history, carousel state, adjacent-work navigation, focus recovery, and scroll locking.
- Opening Index and then Saved Works creates nested browser-history layers. Back returns Saved → Index → page without losing the route or scroll position; Forward restores the layers.
- Desktop exposes Works, Exhibitions, Practice, and Contact as direct primary routes. The mobile and pre-hydration index exposes the same route order; Commission remains a secondary studio link.
- Practice exposes direct Statement, Biography, and Method anchors. Exhibitions owns the two exhibition and three press records currently available.
- Reduced motion exposes a fully resolved semantic state rather than a frozen animation midpoint.

## Visual contract

- The approved direction is Carried Ground / Eroded Vault: a fused, irregular soil-and-mineral threshold rather than a ribbon, sticker, card, or reusable frame.
- Mobile is full-bleed and touch-first. Desktop uses a bounded artwork plane and independently composed atmospheric fields; it is not the mobile layout stretched wider.
- Artist work is never generated, cosmetically enlarged, or cropped merely to fill a decorative slot.
- Supporting pages share quiet ledger typography, open editorial fields, real material imagery, and one shell vocabulary across Soil/Paper and EN/UK states.

## Current verified environments

| Environment | Coverage | Result |
| --- | --- | --- |
| In-app Chromium, current local source | Exact EN/UK route matrix at 320×568 and 430×929; Gallery at 390×844; Home, Gallery, Exhibitions, Practice, and Contact; mid-page Index reachability and horizontal overflow | pass |
| In-app Chromium, focused mobile flows | Gallery filters/index/modal/adjacent-work navigation/direct-link close/focus/scroll; nested Index/Saved Back and Forward; Contact no-crop selected work and enabled form | pass |
| In-app Chromium, desktop regression | 1280×800 Home and Gallery; Gallery retains all 32 Stay records and the mobile index is absent | pass |
| Cold desktop Gallery lab profile | Chrome 150.0.7871.187, 1440×900 at DPR 1, five isolated runs, cache disabled, gzip, 4× CPU, 150 ms RTT, 1.6/0.75 Mbps | median/max LCP 2.168/2.180 s, INP 40/40 ms, CLS 0.000114/0.000114; pass |
| Cold mobile Gallery lab profile | Chrome 150.0.7871.187, Pixel 7 emulation at 390×844 and DPR 3, five isolated runs, same throttling | median/max LCP 1.788/1.792 s, INP 64/72 ms, CLS 0.09185/0.09185; pass, CLS watch |
| Large-text reflow stress proxy | EN/UK at 320 and 430 CSS px, normal and Chromium 32 px default-font override; eight isolated cases | 8/8 pass with no overflow, clipping, overlap, offscreen semantics, or undersized relevant controls; not equivalent to OS-level 200% text scaling |
| Physical iPhone Safari / native back-swipe | Not run from this workspace | not proven |
| Physical Android Chrome / hardware Back | Not run from this workspace | not proven |
| Moderated target-user task test | Not run | not proven |

Simulator and emulation results do not prove physical-device GPU behavior, font rasterization, browser chrome, keyboard geometry, safe-area edge cases, or native back-swipe behavior.

## Current verified behavior

- Home advances one settled work per real touch/wheel gesture and resolves the four reveal phases in order. The introductory frame fades away on the next work and returns when scrolling back to July Pines.
- Mobile Gallery renders a compact semantic index instead of mounting 32 Stay state machines. On the cold 390×844 profile the DOM fell from 1,783 to 592 elements; the separate browser matrix reduced page height from approximately 40,800 px to approximately 7,400 px.
- The 32 bounded artwork previews total 2,624,194 B, versus approximately 19.87 MB for the source masters they protect from routine index delivery. Images preserve intrinsic ratios and use `object-fit: contain`.
- Modal details are available immediately on mobile. Modal focus wraps through visible controls, recovers after artwork/carousel changes, closes with Escape, restores the matching opener and scroll position, and leaves no hidden focus targets.
- Direct-link work stepping preserves history ownership: Close stays in Gallery, removes the work query/hash, and returns visible focus to the current archive record.
- The prerendered Gallery is a functional progressive archive, not a decorative placeholder: every work link targets matching static materials, dimensions, story, availability, and inquiry content. Hydration removes that fallback DOM before the enhanced index or desktop Stay stream takes ownership.
- The mobile shell keeps a 44 px Index control reachable after scroll. Index and Saved Works follow nested browser history, preserve scroll, and use safe-area-aware gutters.
- Contact and Saved Works use bounded previews without cropping. Contact error and placeholder contrast meet their static thresholds, and failed hydration exposes an honest fallback rather than leaving an unexplained disabled form.
- Practice, Exhibitions, Commission, Contact, legal pages, the site index, and custom 404 use distinct desktop compositions while remaining consistent with the shared material system.
- Contact and Commission validate locally and provide honest email/clipboard handoff. They do not claim a server submission occurred.
- Existing language, theme, favorite, pending-inquiry, and commission-draft storage envelopes remain backward compatible.
- Unknown EN and UK document routes render the localized custom 404 with HTTP 404; direct `404.html` remains a normal document.

## Automated verification

- Evidence identity: branch `codex/branchstone-carried-ground`, base HEAD `e20e64fec048b40bee51794c63e7c74add9ec2df`, uncommitted working tree. No commit, push, publication, or deployment was performed.
- Full suite: 24 files, 233 tests.
- Production client and SSR builds plus localized prerendering pass for the current source tree.
- Artifact verification covers 18 localized entries, 32 catalog works, the 19 available / 13 collected split, locale joins, primary media, and deployment files.
- Publishing verifies generated HTML equality, the current stage plus one bounded previous asset generation, the complete local dependency closure, and absence of publisher residue.
- Publisher migration coverage proves that a newly added route does not require a pre-existing deployed HTML copy.
- The physical-device harness has 23/23 focused contract tests. A real CLI session served EN/UK HTML, artwork, MP4, favicon, manifest, and built JS with exact MIME and `no-store`; rejected wrong-case and traversal/authority paths; proved error/stall/entry-module faults and observable hit counts; then reported the served closure `937c95b8074fe5644f2b72ab75c7b32f1adfd0e44a756de9f4386e4f9eb2be76` as `MATCH` and removed its bounded temporary copy.
- A real child-process SIGINT in the former startup race preserved both post-run identities as `MATCH` and removed the closure, while correctly exiting nonzero and marking the interrupted session `INVALID`. Explicit `quit` is the only valid terminal state; repeated-signal, EOF, post-hash failure, exact-path, nonexistent-fault, and failed-release paths are independently covered.
- Two independent native Codex adversarial passes returned harness `APPROVE` after reproducing signal, cleanup-failure, exact-path, fault-hit, and terminal-state behavior. The final exact-route Gemini 3.6 Flash High review also returned clean `APPROVE` with no P0–P2 for Agent HQ job `adcbf347-adfe-48a3-9739-9db0b0a90ad3`, immutable evidence digest `36804e76ae0628d20f388070beeb3c26a6ac519082ba9f397ca0ef32f0896aef`.
- The final native Codex read-only closure returned `APPROVE`, found no provable P0–P2, and independently passed 85/85 focused tests.
- The final exact-route Gemini 3.6 Flash High review returned clean `APPROVE` for Agent HQ job `c784aec9-a6b0-4b4b-84b2-b25fc239d6bc`, immutable evidence digest `034c35ce12a0e771f7e2fc5fceef328327b6907af584f3f914d565ead8b61768`, with no P0–P2.
- An earlier Claude Opus review surfaced additional image-priority, filter-affordance, pre-hydration, focus, and typography findings. Those findings were repaired before the final freeze; Opus was not repeatedly used to grade the frozen tree.

## Final Gallery performance evidence

The final acceptance run used Google Chrome 150.0.7871.187 and CDP 1.3. Every target used a fresh isolated profile, disabled cache, cleared origin storage, a unique cold URL, gzip, 4× CPU throttling, 150 ms RTT, 1.6 Mbps download, and 0.75 Mbps upload. Desktop was 1440×900 at DPR 1; mobile was a Pixel 7 profile at 390×844 and DPR 3.

| Profile/run | FCP | LCP | INP | CLS | Long task |
| --- | ---: | ---: | ---: | ---: | ---: |
| Desktop 1 | 672 ms | 2.152 s | 40 ms | 0.000114 | 52 ms |
| Desktop 2 | 664 ms | 2.172 s | 40 ms | 0.000114 | 51 ms |
| Desktop 3 | 672 ms | 2.180 s | 40 ms | 0.000114 | 54 ms |
| Desktop 4 | 660 ms | 2.160 s | 40 ms | 0.000114 | none |
| Desktop 5 | 668 ms | 2.168 s | 40 ms | 0.000114 | 51 ms |
| Mobile 1 | 672 ms | 1.792 s | 64 ms | 0.091850 | none |
| Mobile 2 | 660 ms | 1.784 s | 72 ms | 0.091850 | none |
| Mobile 3 | 668 ms | 1.788 s | 72 ms | 0.091850 | none |
| Mobile 4 | 668 ms | 1.784 s | 64 ms | 0.091850 | none |
| Mobile 5 | 676 ms | 1.792 s | 64 ms | 0.091850 | none |

| Profile | Metric | Median | Max | Budget |
| --- | --- | ---: | ---: | ---: |
| Desktop | FCP | 668 ms | 672 ms | observation only |
| Desktop | LCP | 2.168 s | 2.180 s | ≤2.5 s |
| Desktop | INP | 40 ms | 40 ms | ≤200 ms |
| Desktop | CLS | 0.000114 | 0.000114 | ≤0.1 |
| Mobile | FCP | 668 ms | 676 ms | observation only |
| Mobile | LCP | 1.788 s | 1.792 s | ≤2.5 s |
| Mobile | INP | 64 ms | 72 ms | ≤200 ms |
| Mobile | CLS | 0.091850 | 0.091850 | ≤0.1 |

All 10 runs hydrated without a stalled state, page exception, console warning/error, failed request, HTTP error, horizontal overflow, or header/content overlap. Desktop rendered 32 Stay records; mobile rendered 32 index records. The LCP element was consistently the Gallery seam image: the 75,988 B desktop derivative and 35,514 B mobile derivative. The seam request begins at Low network priority and is promoted to High.

The mobile journey passed 5/5: the far `Magnet` preview resolved from 0×0 to 720×966 after scrolling; filtering changed 32 works to 13 collected works; July Pines opened, adjacent navigation moved to Navy of the Dreamland, and Close returned focus to `artwork-open-navy-of-the-dreamland` while preserving the filter and count.

The eight-case EN/UK × 320/430 × normal/32 px default-font matrix passed without root/body overflow, clipped or offscreen semantic content, undersized relevant controls, header overlap, or runtime/network errors. Filters remained usable and produced localized 32 → 13 → 32 counts in every case. At the most constrained UK/320/32 px case, the header retained a 14.14 CSS px gap.

The runtime-code fingerprint remained `4a840422103ddfcdf28ae80ca0aa8c2b72a9eed73492bbd8701be6ab8964c00a` before and after the run. A later clean rebuild after validation-only harness changes reproduced the exact 115-file, 8,840,890-byte `.stage` tree and its sorted SHA-256 manifest digest `33bf05f348cd65cca7c0525896451ed33bc3c4fb4eff553441b5fcd61c396172`; the performance evidence therefore remains bound to identical served application bytes. All CDP connections, Chrome processes, servers, listeners, ports, and temporary profiles were cleaned up.

The near-budget watch items are explicit: desktop LCP has 320 ms headroom, and mobile CLS has only 0.00815 headroom. Both pass the fixed budgets but should be remeasured after any visual, font, image-priority, or shell-layout change.

## Known source limits

At least Born Of Burn, Christmas Joy, Core, Moonglow, Of Ash and Flowers, Prolisok, Spectral, Whales, and November Forest have masters too small for genuinely crisp immersive Retina presentation. Born Of Burn is 360×450; several works would require roughly 2.5–3.5× enlargement in a full desktop slot. The implementation therefore preserves intrinsic geometry instead of hiding this source limitation. Higher-resolution artist originals are the only acceptable fix.

Generated assets are limited to non-art environmental strata and seam layers. Their texture is directionally matched to the approved concepts rather than pixel-identical. That variation is intentional and must not be 'fixed' by modifying artist media.

Exact OS-level 200% text scaling, mobile on-screen keyboard behavior, safe-area behavior under real browser chrome, hardware/system Back, native iOS back-swipe, real touch/GPU smoothness, and moderated comprehension remain outside the current local evidence boundary. These are release gates, not inferred passes.

Desktop hydration intentionally replaces the coherent prerendered/no-JS archive grid with the atmospheric Stay stream. The final five-run desktop profile measured that transition and passed LCP, INP, CLS, error, overlap, and record-count gates. The progressive transition remains intentional, but it is no longer an unmeasured local P2.

The current implementation has not been published in this work. The public domain may therefore differ from the verified local source.

## Current approval state

**Local implementation boundary: APPROVE.** The current source revision passes the automated, emulated-browser, performance, and independent critical-review evidence recorded above, with no open P0/P1 or unacceptable P2 finding.

**Overall final mobile UX and release approval: WITHHELD.** It still requires the physical iOS Safari and Android Chrome matrix, OS-level 200% text verification, real keyboard/safe-area/system-Back/back-swipe/touch-GPU evidence, and the moderated eight-user task test. Passing the local boundary does not convert any of those unrun gates into evidence.

The two executable external gates are `mobile-device-validation.md` and `mobile-usability-validation.md`. They must pass on the same immutable artifact before this status can change to overall `APPROVE`.

## Release boundary

- GitHub Pages currently serves `codex/branchstone-carried-ground` from `/docs`.
- Root HTML files are Vite source entries; generated `docs` HTML, Ukrainian routes, and assets are the required static deployment artifact.
- `npm run publish` refreshes that artifact locally and preserves artwork media, catalog JSON, CNAME, and site metadata.
- No external email is sent by tests. Commit, push, and deployment are separate actions.
