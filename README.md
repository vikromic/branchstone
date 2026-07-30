# Branchstone

Branchstone is Viktoriia's bilingual artist portfolio and living material archive. The current React/Vite implementation is mobile-first and uses the Carried Ground / Eroded Vault visual system.

## Project map

- `src/` — React application, domain logic, interactions, and styles
- root `*.html` — Vite multi-page source entries
- `tests/` — Vitest behavior and contract coverage
- `docs/json_data/` — English and Ukrainian portfolio content
- `docs/img/` — artwork and studio media
- `scripts/` — prerender, verification, and guarded publishing
- `src/assets/artwork-index/` — bounded, deterministic Gallery delivery previews derived from the real artwork masters
- `docs/` — GitHub Pages artifact plus protected content/media

The generated files in `docs/assets/`, `docs/uk/`, and `docs/*.html` are committed because GitHub Pages currently serves the `codex/branchstone-carried-ground` branch from `/docs`. They must be refreshed with the guarded publisher, never edited by hand.

## Local development

Install dependencies and start the loopback server:

```bash
npm ci
npm run dev
```

To open the site from an iPhone on the same Wi-Fi network:

```bash
npm run dev:lan
```

Then open `http://<laptop-lan-ip>:8082/` on the phone. On macOS, the Wi-Fi address is commonly available from `ipconfig getifaddr en0`. A VPN, firewall, guest network, or client isolation can block LAN access.

`dev:lan` is for development only. For physical-device acceptance against an immutable built closure, use:

```bash
npm run device:audit -- --host 0.0.0.0 --port 8082
```

The audit harness first runs the full tests, production build, and artifact verifier. It then serves `.stage` together with the protected artwork/JSON/static deployment files, records source and served-closure digests before and after, and provides deterministic image-error, image-stall, and Gallery/Contact hydration-stall controls with observable request-hit counts. Follow `mobile-device-validation.md`; a LAN run does not prove production TLS/CDN behavior.

## Verification

```bash
npm test
npm run build
npm run verify:artifact
```

The artifact verifier checks all localized routes, 32 catalog works, EN/UK joins, availability totals, required deployment files, and every referenced artwork image.

When an artwork master or bounded environmental source changes, regenerate the corresponding delivery derivatives before verification:

```bash
npm run assets:gallery-previews
npm run assets:mobile-materials
```

Gallery uses bounded, deterministic delivery previews derived from the real artwork masters. Artist artwork is never synthesized, cropped, cosmetically enlarged, or replaced.

## Publishing

```bash
npm run publish
```

Publishing builds and prerenders the site, verifies the stage, atomically replaces the generated HTML and Ukrainian routes, and keeps only the current asset generation plus one previous generation for cached-HTML safety. An identical local republish preserves that real fallback instead of promoting the current generation twice. The verifier then checks the bounded closure and preserves `docs/img/`, `docs/json_data/`, `docs/CNAME`, and hand-maintained documentation.

Running `npm run publish` changes the local deployment artifact only. Commit and push are separate release decisions.

## Documentation

- `CLAUDE.md` — product and engineering contract for agents
- `design-qa.md` — current interaction contract, verified boundaries, and known limits
- `mobile-device-validation.md` — exact-build physical iOS Safari / Android Chrome matrix
- `mobile-usability-validation.md` — moderated eight-participant task and scoring gate
- `EVOLUTION_LOG.md` — concise record of verified product iterations
