# Branchstone Art Portfolio

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

## Quick Start

```bash
# Local development
cd docs
python -m http.server 8000
# Visit http://localhost:8000
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
  "size": "24x30 in",
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
cd docs/css
cat 01-tokens.css 02-base.css 03-header.css 04-gallery.css 05-buttons.css 06-footer.css 07-utilities.css 08-hero.css 09-featured.css 10-about.css 11-contact.css 12-sections.css > bundle.css
```

## Deployment

Site deploys automatically via GitHub Pages from `/docs` folder on `main` branch.

```bash
git checkout main
git merge optimization
git push origin main
```

## Documentation

- `docs/ARCHITECTURE.md` - Code architecture and component APIs
- `docs/js/README.md` - JavaScript module documentation
- `scripts/README.md` - Image optimization scripts

## Tech Stack

- **Frontend**: Vanilla JS (ES6 modules), CSS custom properties
- **Hosting**: GitHub Pages
- **Forms**: Formspree
- **Images**: Sharp for optimization

## Browser Support

Chrome, Firefox, Safari, Edge (latest versions), iOS Safari 14+, Chrome Mobile

## License

All rights reserved. Artwork, design, and content are property of Viktoria Branchstone.
