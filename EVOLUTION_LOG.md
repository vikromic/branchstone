# Branchstone evolution log

This is a concise record of verified product-level iterations. Git history is the detailed archive; temporary screenshots, test transcripts, and superseded implementation notes do not belong here.

## 2026-07-19 — Carried Ground archive rebuild

### Outcome

- Rebuilt the portfolio as a React/Vite multi-page application with localized server-rendered HTML and progressive hydration.
- Established Home as a native vertical Stay experience and Gallery as the complete living material archive.
- Added canonical EN and `/uk/` routes, deep-linked works, filters, favorites, modal history/focus, and honest inquiry handoffs.
- Centralized locale paths, metadata, catalog normalization, browser storage envelopes, clipboard fallback, and modal ownership.
- Replaced the obsolete runtime trees with source-owned React/CSS and guarded generated output in `docs/`.

### Compatibility

- Existing English `.html` routes remain valid.
- Legacy language queries and artwork aliases normalize without losing collection, work, or message state.
- Existing theme, language, favorite, pending-inquiry, and commission-draft storage remains backward compatible.
- No server-side data migration is required; the portfolio is static and does not accept submitted personal data.

### Verification

- Localized client/SSR builds and prerendering passed.
- Catalog, content, storage, routing, progressive safety, and artifact contracts passed.
- Browser verification covered mobile and desktop routes, themes, locales, Gallery flows, forms, and custom 404 behavior.

## 2026-07-20 — Natural Home edge and Eroded Vault desktop

### Outcome

- Replaced layered sticker-like material pieces with a unified natural mobile geological edge.
- Implemented the selected desktop Eroded Vault as an asymmetric fused soil/mineral overhang.
- Added a shallow wide-screen source for short desktop viewports to prevent metadata collision.
- Kept the geological frame exclusive to the introductory July Pines state; subsequent works remain clean artwork planes.
- Preserved native snap scrolling and the artwork → materials → story → availability reveal order.

### Verification

- Mobile scroll advanced and returned exactly one work per gesture with the frame fading out and back in correctly.
- Desktop wheel behavior, short/wide breakpoints, Gallery isolation, image loading, overflow, and reduced motion passed.
- Artist artwork was neither generated nor altered.

## 2026-07-20 — Supporting pages surgical desktop pass

### Outcome

- Reframed Gallery around a compact archive threshold and natural responsive seam while preserving intrinsic artwork dimensions.
- Rebuilt Practice and Commission process sections as asymmetric editorial compositions using real imagery.
- Rebalanced Correspondence into a desktop writing register and fixed multi-work inquiry provenance/removal behavior.
- Reworked the site index into a content-sized archive map with desktop-only material loading.
- Centralized header height, inquiry URL creation, catalog counting, legal links, and shared state semantics.
- Removed obsolete seam components/assets, restored Paper-theme contrast, and improved focus/skip behavior.

### Compatibility

- Published routes, locale paths, storage envelopes, and existing single-work Contact URLs remain compatible.
- The inquiry boundary now also supports repeated artwork IDs for the real multi-work fallback path.

### Verification

- Full suite passed 18 files / 125 tests.
- Production client/SSR builds, prerendering, and all 16 localized artifact entries passed.
- Mobile, short-desktop, full-desktop, EN/UK, Soil/Paper, Gallery/modal, Contact, Commission, legal, index, and 404 states were visually and functionally checked.

## 2026-07-20 — Repository and deployment hygiene

### Outcome

- Moved durable project history out of the public Pages artifact and reduced it to current React-era decisions.
- Removed the obsolete Ralph-loop prompt, transient screenshot manifests, stale LAN state, generic cross-language ignore templates, and four unreferenced material-source variants.
- Added a human-facing README and rewrote the agent guide around the current Carried Ground architecture.
- Changed publishing from unbounded hashed-asset retention to an atomic current generation plus exactly one previous generation for cached-HTML safety; identical local republishes preserve the real fallback, and verification rejects missing files and assets outside that bounded set.
- Preserved all artist media and bilingual catalog content.

### Migration

- No route, catalog, locale, or browser-storage migration is required.
- GitHub Pages remains on `v2:/docs`; the current generated deployment artifact is still committed.
- Historical hashed asset URLs are internal build outputs. One immediately previous generation remains available for Pages' cached-HTML window; older generations are removed automatically on the next publish.

### Verification

- Full suite passed 19 files / 133 tests.
- Production client/SSR builds, localized prerendering, and the 16-entry / 32-work artifact contract passed.
- Guarded publishing verified 60 current and 60 previous asset names as one bounded bootstrap set, with 118 local dependency paths and no residue.
- `docs/img` remained 308 files and `docs/json_data` remained seven files with byte-for-byte identical aggregate checksums.
- Published-artifact browser smoke covered 390×844 Home scrolling, Gallery modal/deep-link state, Ukrainian Gallery, and 1440×1000 desktop Home with no broken images, horizontal overflow, framework overlay, or console warning/error.
- Native reuse/simplification/efficiency/altitude audits and cross-family GLM/Gemini review covered deletion safety, rollback, deployment ownership, and cache migration risk; a concrete post-commit cleanup rollback defect found in review was fixed and re-approved.

## 2026-07-25 — Professional portfolio information architecture

### Outcome

- Reframed the primary site routes for galleries, curators, collectors, and juries as Works, Exhibitions, Practice, and Contact.
- Added a dedicated bilingual Exhibitions route for the five authored records: two exhibitions and three press features.
- Made Statement, Biography, and Method directly visible within Practice and moved exhibition history out of the artist narrative.
- Kept Commission available as a secondary studio guide while removing it from the primary route hierarchy.
- Added direct desktop navigation and retained the complete mobile and pre-hydration index.

### Compatibility

- Existing English and Ukrainian Work, Practice, Commission, Contact, legal, artwork deep-link, storage, and inquiry routes remain valid.
- The new Exhibitions route adds an entry without changing catalog or highlight schemas.
- No content, media, persistence, or external-service migration is required.

### Verification

- Full suite passed 20 files / 138 tests.
- Production client/SSR builds and localized prerendering produced 18 semantic entries.
- Artifact verification passed for the expanded route set and existing 32-work catalog invariants.
- The guarded publisher now supports the first publication of a new route while preserving rollback for previously published pages.
- Local publishing verified 18 localized HTML files, 60 current plus 60 previous asset names, and 120 resolving dependency paths without residue.
- In-app Chromium verification covered 390×844 Home/index and EN/UK Exhibitions plus 1280×720 Works, Exhibitions, Practice, and Contact through real clicks. The checked flows had no broken images, horizontal overflow, or console warning/error.
- Public `branchstone.art` still serves the previous remote revision and returns the custom 404 for `/exhibitions.html`; the new information architecture is therefore not yet live. Physical-device verification was not run.

## 2026-07-29 — Continuous mobile archive improvement

### Outcome

- Replaced the 32-scene mobile Gallery stream with a scan-first semantic artwork index while preserving the atmospheric Stay experience from the desktop breakpoint.
- Added explicit native filters, full-composition previews, immediate mobile modal details, adjacent-work navigation, and direct-link close recovery to the matching work and scroll position.
- Kept direct links unowned across adjacent-work stepping so Close remains in Gallery, and added hash-targeted prerender details so the archive remains functional without JavaScript.
- Added deterministic bounded WebP delivery derivatives for all 32 real artwork masters, mobile environmental surfaces, and the Gallery-only desktop seam; source artwork remains unchanged.
- Made Index continuously reachable on mobile and modeled Index → Saved Works as nested browser-history layers with Back/Forward, focus, body-lock, and scroll recovery.
- Removed the root 320 px reflow floor and broad overflow masking, added safe-area handling, protected Saved/Contact artwork from crop, repaired Contact contrast, and exposed a fail-open hydration message.
- Kept explicit language choice durable across Index Close/Back, made pre-hydration artwork links same-document, suppressed the desktop SSR index before hydration, and kept mobile modal materials, story, Save, and Inquire interactive across every image step.
- Added source-aware image recovery with bounded timeout, late-load recovery, explicit retry, stale-node guards, localized feedback, and focus restoration that does not steal an intentional focus move.
- Made mobile selects and all desktop filter buttons honestly disabled until URL-derived hydration state is ready, and made `matchMedia` subscription fail open to the usable mobile index in restricted environments.
- Strengthened the first-preview loading priority, Paper/Soil filter affordance, mobile metadata/action type scale, stable artwork aspect estimates, and progressive no-JS details.

### Compatibility

- Catalog IDs, artwork masters, canonical EN/UK routes, query parameters, favorites, inquiry state, and theme/language storage remain unchanged.
- The mobile/desktop Gallery presentation split is responsive only; both modes use the same catalog, filtering, modal, deep-link, and saved-work contracts.
- No persisted-data, schema, URL, or server migration is required. Rollback is a source-and-generated-preview revert.

### Verification

- Full suite passed 24 files / 233 tests.
- Current client/SSR builds and all 18 localized prerendered entries passed.
- In-app Chromium covered the exact EN/UK route matrix at 320 and 430 px, focused Gallery and shell-history flows at 390 px, 32 px default-font stress, and desktop Home/Gallery regression without horizontal overflow in the checked states.
- The final fresh five-run desktop profile produced median/max LCP 2.168/2.180 s, INP 40/40 ms, and CLS 0.000114/0.000114. The fresh five-run mobile profile produced median/max LCP 1.788/1.792 s, INP 64/72 ms, and CLS 0.09185/0.09185.
- The EN/UK × 320/430 × normal/32 px matrix passed 8/8. The far lazy-preview and modal step/close/focus-return journey passed 5/5. Runtime fingerprints matched before and after; all browser processes, listeners, servers, ports, and profiles were cleaned up.
- Final independent closure used native Codex plus exact-route Gemini 3.6 Flash High. Both approved the frozen implementation with no provable P0–P2. Earlier Claude Opus findings were fixed before the freeze and Opus was not repeatedly rerun on the final state.
- Added a bounded physical-device audit server that re-runs all local gates, serves one isolated full closure with exact case-sensitive paths and real MIME, exposes deterministic error/stall/hydration faults with hit counts, and fails closed on traversal, wrong-case/nonexistent targets, identity drift, release failure, interrupted shutdown, or cleanup failure. Its 23 focused tests and real CLI/SIGINT smoke passed; interrupted sessions clean up but remain machine-invalid, and the rebuilt `.stage` bytes stayed identical to the performance-tested artifact.
- Two native Codex adversarial audits and a final exact-route Gemini 3.6 Flash High immutable review approved the harness/protocol with no current P0–P2; these reviews do not substitute for the unexecuted physical lanes.
- Physical iOS/Android behavior, OS-level 200% text scaling, real-device touch/GPU smoothness, and moderated target-user comprehension were not run and remain required for final mobile UX approval. Exact-build physical-device and moderated-test protocols are ready in `mobile-device-validation.md` and `mobile-usability-validation.md`.
- The verified tree remains uncommitted on base HEAD `e20e64fec048b40bee51794c63e7c74add9ec2df`; no push, publication, or deployment was performed.
