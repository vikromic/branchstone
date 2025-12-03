# Branchstone Art Portfolio

[![CI Pipeline](https://github.com/username/branchstone/actions/workflows/ci.yml/badge.svg)](https://github.com/username/branchstone/actions/workflows/ci.yml)
[![Deploy](https://github.com/username/branchstone/actions/workflows/deploy.yml/badge.svg)](https://github.com/username/branchstone/actions/workflows/deploy.yml)
[![codecov](https://codecov.io/gh/username/branchstone/branch/main/graph/badge.svg)](https://codecov.io/gh/username/branchstone)
[![License](https://img.shields.io/badge/license-All%20Rights%20Reserved-red.svg)](LICENSE)

A minimalist, elegant artist portfolio website for mixed-media artist Viktoria Branchstone.

## Live Site

**URL**: [branchstone.art](https://branchstone.art)

## Features

- **Gallery** with filters (Available, Small Items, Prints), lightbox with price/availability
- **Commissions** page with custom inquiry form
- **About** page with artist statement, shipping policies, customer feedback carousel
- **Gallery Experience** carousel (auto-loaded from `highlights.json`)
- **Video support** in gallery/lightbox (autoplay muted loop)
- **Responsive design** optimized for all devices
- **Light/dark theme** respecting system preferences
- **Bilingual** (English/Ukrainian)
- **PWA** with offline support
- **223 unit tests** (100% pass rate) with comprehensive coverage
- **CI/CD pipeline** with automated testing, linting, and GitHub Pages deployment

## Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Serve the site locally
npm run serve
# Visit http://localhost:8000
```

### Testing

```bash
# Run tests (223 tests)
npm test

# Run with coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch

# Full CI validation locally
npm run validate
```

### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Check/apply formatting
npm run format
npm run format:check
```

## Project Structure

```
docs/                     # Website files (GitHub Pages root)
├── css/
│   ├── 01-tokens.css    # Design tokens
│   ├── ...              # Component CSS
│   └── bundle.css       # Concatenated CSS (generated)
├── js/
│   ├── app.js           # Main application
│   ├── components/      # UI components
│   ├── artworks.json    # Gallery data
│   ├── highlights.json  # Experience carousel data
│   └── translations.json
├── img/                 # Images
│   ├── artwork/         # Gallery images
│   └── highlight/       # Experience images
└── *.html               # Pages

scripts/                 # Build scripts
├── optimize-images.js   # Image optimization (Sharp)
└── README.md
```

## Content Management

### Adding Artworks

Edit `docs/js/artworks.json`:

```json
{
  "id": 14,
  "title": "New Artwork",
  "size": "21 x 16 in",
  "materials": "Mixed media on canvas",
  "image": "img/artwork/main.jpeg",
  "images": ["img/artwork/main.jpeg", "img/artwork/detail.jpeg"],
  "description": "Description here",
  "price": "$2,000",
  "available": true,
  "soldOut": false,
  "printsAvailable": true,
  "video": {                    // Optional
    "webm": "img/artwork/preview.webm",
    "mp4": "img/artwork/preview.mp4"
  }
}
```

### Adding Experience/Gallery Images

Edit `docs/js/highlights.json`:

```json
[
  {
    "image": "img/highlight/exhibition.jpg",
    "alt": "Gallery exhibition",
    "caption": "Gallery Name – Exhibition Title – 2024"
  }
]
```

Section auto-appears when entries exist. No code changes needed.

### Optimizing Images

```bash
cd scripts
npm install
npm run optimize
```

Generates 400w/800w variants in WebP + JPEG.

### Rebuilding CSS

After editing any CSS file in `docs/css/`:

```bash
npm run build:css
```

## CI/CD Pipeline

Every push and pull request triggers automated quality checks:

- **Linting**: ESLint code quality enforcement
- **Formatting**: Prettier consistency validation
- **Testing**: Jest unit tests (223 tests, 100% pass rate)
- **Build**: CSS bundle and file validation
- **Security**: npm audit for vulnerabilities
- **Performance**: Asset size monitoring

Pushes to `main` automatically deploy to GitHub Pages. See [.github/CICD.md](.github/CICD.md) for detailed pipeline documentation.

**View test coverage:**
```bash
npm run test:coverage
open coverage/index.html
```

## Documentation

### Getting Started
- **[TESTING.md](TESTING.md)** - Comprehensive testing guide (223 tests, coverage reports)
- **[tests/README.md](tests/README.md)** - Test directory structure and best practices
- **[.github/SETUP.md](.github/SETUP.md)** - GitHub Actions and CI/CD configuration

### Code Quality
- **[.github/CICD.md](.github/CICD.md)** - CI/CD pipeline documentation
- **[.github/QUICK_REFERENCE.md](.github/QUICK_REFERENCE.md)** - Common commands and checklist

### Design Reference
- **[DESIGN_REVIEW_SUMMARY.md](DESIGN_REVIEW_SUMMARY.md)** - UI/UX review (8.2/10 rating)
- **[DESIGN_METRICS.md](DESIGN_METRICS.md)** - Technical specs (contrast ratios, spacing, etc.)

## Tech Stack

- **Frontend**: Vanilla JS (ES6 modules), CSS custom properties
- **Hosting**: GitHub Pages
- **Forms**: Formspree
- **Images**: Sharp for optimization

## Browser Support

Chrome, Firefox, Safari, Edge (latest versions), iOS Safari 14+, Chrome Mobile

## License

All rights reserved. Artwork, design, and content are property of Viktoria Branchstone.
