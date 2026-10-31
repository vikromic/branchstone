# Branchstone evolution log

Dated product-level outcomes. Git history holds the detail; this file does not record test counts, review runs, or screenshots.

## 2026-07-19 — Carried Ground archive rebuild

- Rebuilt the portfolio as a React/Vite multi-page application with localized prerendered HTML and progressive hydration.
- Home became a native vertical Stay experience; Gallery the complete living material archive.
- Canonical EN and `/uk/` routes, deep-linked works, filters, saved works, modal history and focus, and honest email/clipboard inquiry handoffs.
- Existing English `.html` routes, legacy language queries, artwork aliases, and theme/language/saved-work/inquiry/commission storage stayed compatible.

## 2026-07-20 — Natural Home edge, Eroded Vault desktop, supporting pages

- One natural mobile geological edge replaced layered material pieces; desktop gained the asymmetric Eroded Vault overhang. The frame belongs to the introductory July Pines state only.
- Gallery, Practice, Commission, Contact, the site index, and 404 received separate desktop compositions using real imagery.
- Publishing became an atomic current asset generation plus exactly one previous generation for cached-HTML safety.

## 2026-07-25 — Professional information architecture

- Primary routes became Works, Exhibitions, Practice, and Contact for galleries, curators, collectors, and juries; Commission moved to a secondary studio link.
- A bilingual Exhibitions route owns the two exhibitions and three press records. Practice exposes Statement, Biography, and Method directly.

## 2026-07-29 — Mobile archive

- Below 760 px Gallery became a scan-first semantic index with native filters, full-composition previews, immediate modal details, and adjacent-work navigation; the Stay stream remains from 760 px.
- Deterministic bounded WebP derivatives for all 32 artwork masters and the mobile environmental surfaces; the masters are unchanged.
- Index → Saved works became nested browser-history layers. Image loading gained bounded recovery with retry. Filters stay disabled until URL-derived state is ready.
- Measured on the release profile: Gallery mobile LCP 1.79 s, CLS 0.092; desktop LCP 2.18 s.

## 2026-08-09 — Touch targets and reflow

- A global 44×44 px minimum for buttons, inputs, selects, and action links; safe-area insets and relative sizing for 200% text reflow.

## 2026-10-30 — Accessibility audit

- Fixed Paper-theme contrast (Home Index control, muted text, Contact hero eyebrow) and Soil mineral labels on surfaces; all visible text now meets AA in both themes.
- Focus rings are visible on every surface in both themes, and a sticky-header scroll padding keeps focused controls uncovered on mobile.
- Accessible names now contain their visible labels; decorative numerals are hidden from assistive technology.

## 2026-10-30 — Repository cleanup and layered architecture

- `src/` is layered as content → domain → platform → app → features → pages with an enforced dependency rule. Bilingual copy moved out of components into `content/copy`, pure rules into `domain`, browser access into `platform`, so a redesign can replace presentation without touching data, copy, or rules.
- Removed the stale release-gate and physical-device protocol documents, the unused device-audit harness, and tests that pattern-matched source text; SSR markup, asset budget, and artifact data tests replace their behavioral parts.
- Moved 141 unreferenced images and two unused JSON files out of the published `docs/` tree; EN and UK artwork records now list the same images, and the artifact verifier enforces it.
- Prerendered HTML is unchanged apart from asset hashes.
