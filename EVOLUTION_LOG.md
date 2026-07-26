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
