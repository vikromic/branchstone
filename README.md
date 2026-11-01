# Branchstone

Branchstone is Viktoria's bilingual artist portfolio and living material archive: a React/Vite multi-page site, prerendered for EN and `/uk/`, published as static files on GitHub Pages.

## Project map

- `src/` — application, layered as `content/` → `domain/` → `platform/` → `app/` → `features/` → `pages/`. `CLAUDE.md` describes each layer and the dependency rule.
- root `*.html` and `site-pages.js` — Vite page entries and the page registry.
- `tests/` — Vitest suites mirroring `src/`, plus `tests/scripts/` for build and publish tooling.
- `scripts/` — prerender, pre-hydration bootstrap, asset derivative generators, artifact verification, and guarded publishing.
- `docs/json_data/` and `docs/img/` — artist content and media.
- `docs/` — the GitHub Pages root: the generated artifact plus the artist content above.

The generated files in `docs/assets/`, `docs/uk/`, and `docs/*.html` are committed because GitHub Pages serves the `codex/branchstone-carried-ground` branch from `/docs`. Refresh them with the publisher; never edit them by hand. `docs/sitemap.xml`, `robots.txt`, `site.webmanifest`, and `CNAME` are hand-maintained.

## Local development

```bash
npm ci
npm run dev        # http://127.0.0.1:5173
npm run dev:lan    # http://<laptop-lan-ip>:8082 for a phone on the same Wi-Fi
```

`dev:lan` is for development only; it does not prove production TLS or CDN behavior.

## Verification

```bash
npm test
npm run build
npm run verify:artifact
```

The artifact verifier checks all 18 localized prerendered entries, the 32-work catalog split, EN/UK record and image-list joins, every artwork and highlight image on disk, and the required deployment files.

When an artwork master changes, regenerate the delivery previews first:

```bash
npm run assets:gallery-previews
```

## Publishing

```bash
npm run publish
```

The publisher builds, verifies the stage, atomically replaces the generated HTML and Ukrainian routes, and keeps the current asset generation plus one previous generation for cached-HTML safety. It preserves `docs/img/`, `docs/json_data/`, `docs/CNAME`, and the hand-maintained files. Publishing changes the local artifact only; commit and push are separate decisions.

## Documentation

- `CLAUDE.md` — product, architecture, and engineering contract.
- `EVOLUTION_LOG.md` — dated product-level outcomes.
