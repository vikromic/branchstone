# Branchstone engineering guide

## Product truth

- Branchstone is Viktoria's bilingual (EN / UK) artist portfolio and living material archive, not a generic landing page.
- Real artwork is the subject. Protect it with bounded, deterministic delivery derivatives from the real masters. Never synthesize, crop, cosmetically enlarge, or replace artist artwork.
- Mobile is the first design truth. Desktop is composed separately; it must never look like a widened phone layout.
- The professional primary navigation is Works → Exhibitions → Practice → Contact. Home is the wordmark destination; Commission is a compatible secondary route.

## Durable contracts

These hold through any redesign unless the owner explicitly migrates them.

- Routes, locales (`/uk/` prefix), storage keys and envelopes, artwork deep links (`?art=`), and inquiry URLs stay backward compatible. A breaking change needs a documented migration.
- Every page is prerendered with semantic `<main>` and one `<h1>`. Prerendered Gallery links resolve without JavaScript to matching static artwork details; hydration may remove that fallback only after the enhanced view owns the same journey, and the fallback must reappear if hydration stalls.
- Index → Saved works and the artwork modal are browser-history layers: Back/Forward restore them, Escape closes them, focus returns to the opener, scroll lock is released.
- Contact and Commission hand off through the visitor's email app or clipboard. Never claim a server submission happened.
- Surface broken states (image, data, storage, hydration failures); never hide them.
- Reduced motion exposes the fully resolved semantic state.
- Unknown EN and UK routes render the localized custom 404.
- Budgets on the release profile: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1; 44×44 px primary touch targets; WCAG AA text contrast in both themes.
- Known source limit: several masters (for example Born Of Burn, 360×450) are too small for crisp full-bleed Retina display. Preserve intrinsic geometry; higher-resolution originals from the artist are the only fix.

## Current presentation

The live visual system is **Carried Ground / Eroded Vault** with two themes, Soil (dark, default) and Paper (light). It holds until a redesign explicitly replaces it.

- Home: native vertical scrolling with viewport snapping selects seven works; each resolves artwork → materials → story → availability after the viewport settles, with no artificial delay. Only the introductory July Pines state has the geological top and bottom frame.
- Gallery: below 760 px a scan-first semantic index (native filters, full-composition previews, saved works, modal navigation) that is usable immediately; from 760 px the atmospheric Stay reveal stream. Both modes share catalog, URL, modal, history, and artwork-integrity contracts.
- Practice exposes Statement, Biography, and Method directly. Exhibitions owns the authored exhibition and press records.

## Architecture

```
src/
  content/    artist data loaders, SEO metadata, site constants, bilingual copy (content/copy/*)
  domain/     pure rules: locale and routes, catalog, saved works codec, inquiry, commission, contact letter, gallery URL, storage contract
  platform/   browser I/O: localStorage, matchMedia, clipboard
  app/        runtime: startPage, SiteContext (locale, theme, saved works), document head, modal layer, shell/ (header, index, saved works, footer)
  features/   presentation modules: home, artwork, stay, legal
  pages/      page composition and page-specific presentation
  styles/     tokens.css (theme custom properties) imported first by index.css; page stylesheets
  entries/, entry-server.jsx   client and SSR entry points
```

Dependency rule:

- `domain` imports nothing: no React, DOM, browser globals, `import.meta`, `docs/`, or `src/assets/`.
- `platform` touches browser globals only; it may use `domain` codecs.
- `content` is the only importer of `docs/json_data` and the artwork-index glob.
- `app` uses `content`, `domain`, `platform`. `features` add `app`. `pages` compose everything below them.
- Pages never import other pages. Features import another feature only through its `index.js`.

A redesign replaces `features/`, `pages/`, and `styles/` (and shell presentation in `app/shell/`). It keeps `content/`, `domain/`, `platform/`, the runtime in `app/`, and the build pipeline.

## Ownership

- Page entry documents: root `*.html`; the page registry `site-pages.js` is shared by Vite, the shell, and the scripts.
- Build and publish: `scripts/`, `vite.config.js`, `vitest.config.js`, `package.json`.
- Tests: `tests/`, mirroring `src/` layers plus `tests/scripts/` and `tests/support/`.
- Artist content and media: `docs/json_data/` and `docs/img/`. Preserve them unless the artist requests a change. EN and UK artwork records must list the same images.
- Mobile artwork previews: `src/assets/artwork-index/`, generated from the masters by `scripts/generate-artwork-previews.mjs`. Delivery derivatives, never replacement artwork.
- Environmental materials: `src/assets/material-stage/`; the `*-mobile.webp` derivatives and `gallery-seam-desktop.webp` come from `scripts/generate-mobile-materials.mjs`. Environmental material may be resized; artwork may not.
- Production artifact: generated `docs/*.html`, `docs/uk/`, and `docs/assets/`. GitHub Pages serves `codex/branchstone-carried-ground:/docs`, so the artifact is committed. Refresh it only with `npm run publish`.
- Unreferenced media removed from `docs/img` on 2026-10-30 lives outside git in `~/Workspace/branchstone-media-archive` and in git history.

## Working rules

- Reproduce visible behavior before changing it. Inspect the real rendered page at the relevant mobile and desktop viewports.
- Make one coherent change set, update all callers, and delete what the change makes obsolete.
- Put logic in the owning layer: copy in `content/copy`, rules in `domain`, browser access in `platform`. Do not add helpers to components that another layer already owns.
- Tests assert behavior through rendered output, SSR markup, or real files. Never read source CSS/JSX/HTML text to pattern-match it.
- Update `EVOLUTION_LOG.md` with the verified product-level outcome only. Git history is the detailed archive; do not commit screenshots, run transcripts, or review logs.

## Verification

For source changes:

```bash
npm test
npm run build
npm run verify:artifact
```

For visual changes, check in a real browser, mobile first (390 px), then the desktop breakpoints affected (1024, 1440), in Soil and Paper and EN/UK: no horizontal overflow at 320 px, 44 px targets, AA contrast, visible focus, artwork never cropped (`object-fit: contain`), form controls ≥ 16 px. No automated test covers these layout facts. State physical-device limits honestly.

For a publish refresh, run `npm run publish`. It must leave `docs/assets/` as the current generation plus at most one previous generation, and keep `docs/img/`, `docs/json_data/`, and `docs/CNAME` intact.

## Commit standard

- Commit only a verified net improvement, with a Conventional Commit message.
- Report what was verified and what remains outside the evidence boundary.
