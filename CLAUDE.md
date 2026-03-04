# Claude Code Configuration — Branchstone

## Project Overview

**Branchstone** — Static HTML/CSS/JS art portfolio site for mixed-media artist Viktoria.
- **Stack**: Vanilla HTML5, CSS3, JavaScript (ES modules)
- **Hosting**: GitHub Pages (served from `/docs`)
- **No build tool** — files are served directly, no bundler or transpiler
- **i18n**: English + Ukrainian (client-side switching)

## Site Structure

| Page | File | Purpose |
|------|------|---------|
| Home | `docs/index.html` | Hero, featured carousel, highlights |
| Gallery | `docs/gallery.html` | Masonry gallery with filtering |
| About | `docs/about.html` | Artist bio and fold section |
| Commissions | `docs/commissions.html` | Commission request info |
| Contact | `docs/contact.html` | Contact form |
| Privacy | `docs/privacy.html` | Privacy policy |
| Terms | `docs/terms.html` | Terms of service |

## Source Layout

```
docs/                    ← Served by GitHub Pages
├── css/                 ← Stylesheets (no preprocessor)
│   ├── tokens.css       ← Design tokens (colors, spacing, fonts)
│   ├── base.css         ← Reset and base styles
│   ├── typography.css   ← Type scale
│   ├── layout.css       ← Grid and layout
│   ├── components.css   ← Shared component styles
│   └── *.css            ← Feature-specific styles
├── js/                  ← JavaScript (vanilla ES modules)
│   ├── main.js          ← Entry point, imports modules
│   ├── constants.js     ← Shared constants
│   ├── utils.js         ← Utility functions
│   ├── i18n.js          ← Internationalization (EN/UK)
│   ├── gallery-data.js  ← Gallery artwork data
│   └── *.js             ← Feature modules
├── img/                 ← Images (WebP preferred)
└── *.html               ← Pages
```

## Behavioral Rules (Always Enforced)

- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary for the goal
- ALWAYS prefer editing existing files over creating new ones
- NEVER proactively create documentation files unless explicitly requested
- NEVER save working files to the root folder
- ALWAYS read a file before editing it
- All source files belong in `docs/` (css/, js/, img/, or root HTML)
- Test files and debug scripts stay in project root (not docs/)

## Code Conventions

- Vanilla JavaScript only — no frameworks, no build tools
- CSS custom properties for theming (defined in `tokens.css`)
- ES modules (`type="module"`) for JS imports
- Mobile-first responsive design
- WebP images with fallbacks
- Semantic HTML5 elements
- BEM-like CSS class naming
- Keep accessibility in mind (ARIA labels, keyboard nav)

## Testing

```bash
# Open locally — just use a local server
npx serve docs

# Run test files (Node.js based)
node test-responsive.js
node test-mobile-gallery-spacing.js
```

- No CI pipeline — manual testing in browser
- Test files in project root are debug/QA helpers

## Security Rules

- NEVER hardcode API keys, secrets, or credentials
- NEVER commit .env files
- Sanitize any user input (contact form)
- Use CSP headers where possible

## Claude Flow Configuration

### Project Config
- **Topology**: hierarchical-mesh
- **Max Agents**: 15
- **Memory**: hybrid
- **HNSW**: Enabled
- **Neural**: Enabled
- **Intelligence**: MAXIMUM

### 3-Tier Model Routing

| Tier | Handler | Use Cases |
|------|---------|-----------|
| **1** | Agent Booster (WASM) | Simple CSS fixes, typos, class renames |
| **2** | Haiku | Single-file edits, style tweaks, content updates |
| **3** | Sonnet/Opus | Multi-page refactoring, responsive redesign, i18n |

### Concurrency Rules

- All operations MUST be concurrent/parallel in a single message
- ALWAYS batch ALL file reads/writes/edits in ONE message
- ALWAYS batch ALL Bash commands in ONE message

### Available Agents

**Core**: `coder`, `reviewer`, `tester`, `planner`, `researcher`
**Frontend**: `frontend-dev`, `designer`
**Code Quality**: `code-review-swarm`, `code-analyzer`
