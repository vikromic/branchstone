# Branchstone Documentation
**Artist Portfolio Website - Technical Documentation**

---

## Overview

This directory contains comprehensive documentation for the Branchstone artist portfolio website, a static, zero-dependency web application built with vanilla HTML, CSS, and JavaScript.

**Project Type:** Static Artist Portfolio
**Tech Stack:** HTML5, CSS3, Vanilla JavaScript (ES6+)
**Architecture:** Jamstack, Progressive Enhancement
**Status:** Production Ready

---

## Documentation Index

### Core Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| [architecture.md](./architecture.md) | System architecture, design patterns, technical decisions | Developers, Architects |
| [MOBILE-HERO-IMPLEMENTATION.md](./MOBILE-HERO-IMPLEMENTATION.md) | Mobile hero component guide, usage, and maintenance | Developers, Designers |
| [QUICK-START-MOBILE-HERO.md](./QUICK-START-MOBILE-HERO.md) | 5-minute guide to modifying mobile hero | Content Editors, Developers |
| [CHANGELOG.md](./CHANGELOG.md) | Version history and release notes | All Stakeholders |

### Design Specifications

| Document | Purpose | Audience |
|----------|---------|----------|
| [design-specs/mobile-hero-inline-design.md](./design-specs/mobile-hero-inline-design.md) | Complete mobile hero design specification | Designers, Developers |
| [design-specs/mobile-hero-visual-guide.md](./design-specs/mobile-hero-visual-guide.md) | Visual reference guide with color codes and examples | Designers, QA |

### Legacy/Reference Documentation

| Document | Purpose | Status |
|----------|---------|--------|
| GALLERY-MASONRY-LAYOUT.md | Gallery layout implementation | Reference |
| QA-FIXES-SUMMARY.md | Quality assurance fixes summary | Reference |
| css/mobile-test-summary.md | Mobile CSS testing notes | Reference |

---

## Quick Navigation

### For Developers

**Getting Started:**
1. Read [architecture.md](./architecture.md) for system overview
2. Review file structure and component architecture
3. Check design patterns and coding standards

**Making Changes:**
1. Mobile Hero: See [QUICK-START-MOBILE-HERO.md](./QUICK-START-MOBILE-HERO.md)
2. Design Specs: Check [design-specs/](./design-specs/) directory
3. Full Implementation Guide: [MOBILE-HERO-IMPLEMENTATION.md](./MOBILE-HERO-IMPLEMENTATION.md)

### For Designers

**Visual Reference:**
1. Color palette: [design-specs/mobile-hero-visual-guide.md](./design-specs/mobile-hero-visual-guide.md)
2. Typography scale: [design-specs/mobile-hero-visual-guide.md](./design-specs/mobile-hero-visual-guide.md)
3. Spacing system: [MOBILE-HERO-IMPLEMENTATION.md](./MOBILE-HERO-IMPLEMENTATION.md)

**Design System:**
- Tokens: `/css/tokens.css`
- Components: `/css/components.css`
- Layout: `/css/layout.css`

### For Content Editors

**Quick Edits:**
1. Change hero image or text: [QUICK-START-MOBILE-HERO.md](./QUICK-START-MOBILE-HERO.md)
2. Update CTA button: [QUICK-START-MOBILE-HERO.md](./QUICK-START-MOBILE-HERO.md)
3. Modify colors: [MOBILE-HERO-IMPLEMENTATION.md](./MOBILE-HERO-IMPLEMENTATION.md)

### For Stakeholders

**Project Status:**
1. Latest changes: [CHANGELOG.md](./CHANGELOG.md)
2. Architecture overview: [architecture.md](./architecture.md) (Executive Summary)
3. Design decisions: [architecture.md](./architecture.md) (Technical Decisions)

---

## Key Features Documented

### Mobile Hero Section (v2.1 - 2026-01-08)

- Responsive inline hero for mobile devices (≤768px)
- Single CTA design with scroll hint
- WCAG AAA compliant (15.8:1 contrast)
- Performance optimized (LCP < 2.5s)
- Dark theme support

**Documentation:**
- [MOBILE-HERO-IMPLEMENTATION.md](./MOBILE-HERO-IMPLEMENTATION.md)
- [design-specs/mobile-hero-inline-design.md](./design-specs/mobile-hero-inline-design.md)

### Static Architecture (v2.0 - 2024-12-14)

- Zero dependencies (vanilla JavaScript)
- 17 feature modules (IIFE pattern)
- Theme system with localStorage
- Gallery with filtering and lightbox
- Favorites system
- Form validation

**Documentation:**
- [architecture.md](./architecture.md)

---

## File Structure

```
docs/
├── README.md                              # This file - Documentation index
├── architecture.md                        # System architecture (comprehensive)
├── MOBILE-HERO-IMPLEMENTATION.md          # Mobile hero developer guide
├── QUICK-START-MOBILE-HERO.md             # 5-minute quick start
├── CHANGELOG.md                           # Version history
│
├── design-specs/                          # Design specifications
│   ├── mobile-hero-inline-design.md       # Mobile hero full spec
│   └── mobile-hero-visual-guide.md        # Visual reference
│
├── css/                                   # Stylesheets
│   ├── tokens.css                         # Design system variables
│   ├── base.css                           # Reset and normalize
│   ├── typography.css                     # Type system
│   ├── components.css                     # UI components
│   ├── layout.css                         # Page layouts
│   ├── mobile-ux-improvements.css         # Mobile hero + UX enhancements
│   └── mobile-gallery-improvements.css    # Mobile gallery optimizations
│
├── js/                                    # JavaScript
│   └── main.js                            # Main application (2832 lines)
│
├── img/                                   # Images
│   ├── cover.webp                         # Hero image (14.8KB)
│   └── artwork-*.webp                     # Gallery images
│
├── index.html                             # Homepage (with responsive hero)
├── gallery.html                           # Gallery page
├── about.html                             # About page
├── commissions.html                       # Commissions page
├── contact.html                           # Contact page
├── terms.html                             # Terms of service
├── privacy.html                           # Privacy policy
└── 404.html                               # Error page
```

---

## Recent Changes

### January 8, 2026
- Added mobile hero inline design implementation
- Created comprehensive mobile hero documentation
- Updated architecture documentation
- Added quick start guide for content editors

See [CHANGELOG.md](./CHANGELOG.md) for full version history.

---

## Documentation Standards

### Maintenance

- Update documentation when features change
- Review quarterly for accuracy
- Keep code examples up-to-date
- Document breaking changes immediately

### Writing Style

- **Clarity:** Write for both technical and non-technical audiences
- **Examples:** Include code examples for all technical concepts
- **Completeness:** Provide context, rationale, and alternatives
- **Accessibility:** Use clear headings, tables, and formatting

### File Naming

- `README.md` - Directory index
- `UPPERCASE.md` - Major documentation files
- `lowercase-with-dashes.md` - Specific component/feature docs

---

## Contributing

### Adding New Documentation

1. Create file in appropriate directory
2. Update this README index
3. Link from related documents
4. Update CHANGELOG.md

### Updating Existing Documentation

1. Update document content
2. Update "Last Updated" date
3. Add entry to CHANGELOG.md if significant
4. Review cross-references

---

## Support Resources

### Internal Resources

- **Code:** `/docs/` directory (HTML, CSS, JS)
- **Design System:** `/docs/css/tokens.css`
- **Architecture:** [architecture.md](./architecture.md)

### External Resources

- **HTML5 Spec:** https://html.spec.whatwg.org/
- **CSS Spec:** https://www.w3.org/Style/CSS/
- **MDN Web Docs:** https://developer.mozilla.org/
- **WCAG Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/

---

## Contact

For questions about this documentation:

1. Check [architecture.md](./architecture.md) first
2. Review specific component documentation
3. Check code comments in source files
4. Contact development team

---

**Last Updated:** January 8, 2026
**Documentation Version:** 2.1
**Project Version:** 2.0 (with mobile hero enhancements)
