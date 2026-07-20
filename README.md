# Branchstone

Branchstone is Viktoriia's bilingual artist portfolio and living material archive. The current React/Vite implementation is mobile-first and uses the Carried Ground / Eroded Vault visual system.

## Project map

- `src/` — React application, domain logic, interactions, and styles
- root `*.html` — Vite multi-page source entries
- `tests/` — Vitest behavior and contract coverage
- `docs/json_data/` — English and Ukrainian portfolio content
- `docs/img/` — artwork and studio media
- `scripts/` — prerender, verification, and guarded publishing
- `docs/` — GitHub Pages artifact plus protected content/media

The generated files in `docs/assets/`, `docs/uk/`, and `docs/*.html` are committed because GitHub Pages currently serves the `v2` branch from `/docs`. They must be refreshed with the guarded publisher, never edited by hand.

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

## Verification

```bash
npm test
npm run build
npm run verify:artifact
```

The artifact verifier checks all localized routes, 32 catalog works, EN/UK joins, availability totals, required deployment files, and every referenced artwork image.

## Publishing

```bash
npm run publish
```

Publishing builds and prerenders the site, verifies the stage, atomically replaces the generated HTML and Ukrainian routes, and keeps only the current asset generation plus one previous generation for cached-HTML safety. An identical local republish preserves that real fallback instead of promoting the current generation twice. The verifier then checks the bounded closure and preserves `docs/img/`, `docs/json_data/`, `docs/CNAME`, and hand-maintained documentation.

Running `npm run publish` changes the local deployment artifact only. Commit and push are separate release decisions.

## Documentation

- `CLAUDE.md` — product and engineering contract for agents
- `design-qa.md` — current interaction contract, verified boundaries, and known limits
- `EVOLUTION_LOG.md` — concise record of verified product iterations
