# Branchstone engineering guide

## Product truth

- Branchstone is an artist portfolio and living material archive, not a generic landing page.
- The approved visual system is **Carried Ground / Eroded Vault**: real artwork, quiet typography, irregular geological material, and no card-template or sticker aesthetic.
- Mobile is the first design truth. Desktop is separately composed; it must never look like a widened phone layout.
- Protect the artwork. Do not crop or upscale low-resolution masters to fake impact, and never generate replacements for the artist's work.

## Core interaction contract

- Home uses native vertical scrolling and viewport snapping to select seven works.
- A work resolves artwork → materials → story → availability after the viewport settles. Do not add an artificial selection delay.
- Only the introductory July Pines state receives the geological top and bottom frame.
- Gallery reuses the Stay reveal behavior, supports deep links, filters, saved works, a carousel modal, and EN/UK routes.
- The professional primary navigation is Works → Exhibitions → Practice → Contact. Home remains the wordmark destination; Commission remains a compatible secondary route.
- Exhibitions owns the five authored exhibition/press records. Practice exposes Statement, Biography, and Method directly instead of burying the public record inside the artist story.
- Reduced motion must expose the fully resolved semantic state. Focus, history, and scroll locking must remain recoverable.

## Source and content ownership

- React source: `src/`
- Page entry documents: root `*.html` and `site-pages.js`
- Tests: `tests/`
- Build/publish tooling: `scripts/`, `vite.config.js`, and `package.json`
- Artist content and media: `docs/json_data/` and `docs/img/` — preserve these unless the artist explicitly requests a content change.
- Production artifact: generated HTML, `docs/uk/`, and `docs/assets/`. GitHub Pages currently serves `v2:/docs`, so this artifact is required even though it is generated.

## Working rules

- Reproduce visible behavior before changing it. For UI changes, inspect the real rendered page at relevant mobile and desktop viewports.
- Make one coherent change set, update all affected callers, and remove artifacts made obsolete by the change.
- Keep route, locale, storage, and inquiry contracts backward compatible unless an explicit migration is documented.
- Prefer existing domain and component owners over duplicate helpers or page-specific patches.
- Surface broken states; do not hide data, image, storage, or hydration failures.
- Update `EVOLUTION_LOG.md` with the current verified outcome. Git history is the detailed archive; do not add screenshot dumps or temporary-run transcripts to the repository.

## Verification

For source changes, run:

```bash
npm test
npm run build
npm run verify:artifact
```

For a publish refresh, run:

```bash
npm run publish
```

`npm run publish` must leave `docs/assets/` as the current `.stage/assets/` generation plus at most one previous generation for cached-HTML safety, preserve that fallback across identical local republishes, and keep `docs/img/`, `docs/json_data/`, `docs/CNAME`, and hand-maintained documentation intact.

For visual changes, also verify the touched flow in a real browser, mobile first, then at the desktop breakpoints affected. State physical-device limits honestly.

## Commit standard

- Commit only a verified net improvement.
- Use Conventional Commit messages.
- Never claim global completion; report what was verified and what remains outside the evidence boundary.
