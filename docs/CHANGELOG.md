# Changelog
All notable changes to the Branchstone Artist Portfolio project.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Mobile hero inline design implementation (2026-01-08)
  - Replaced modal overlay with scrollable inline layout on mobile devices (≤768px)
  - Single CTA button design ("Explore the Works") to reduce decision paralysis
  - 60-70vh hero image with no dark overlay for cleaner presentation
  - High contrast text on solid background (15.8:1 contrast ratio - WCAG AAA compliant)
  - Scroll hint with gentle bounce animation to encourage exploration
  - Dark theme support with optimized image filters
  - Reduced motion support for accessibility
  - Performance optimizations: removed backdrop-filter on mobile, eager loading for hero image
  - Comprehensive documentation in `/docs/MOBILE-HERO-IMPLEMENTATION.md`
  - Design specifications in `/docs/design-specs/mobile-hero-inline-design.md`
  - Visual reference guide in `/docs/design-specs/mobile-hero-visual-guide.md`

### Changed
- Homepage hero section now uses responsive design with separate mobile and desktop variants
- Mobile hero breakpoint set to ≤768px (inline layout)
- Desktop hero breakpoint set to ≥769px (modal overlay - unchanged)
- Updated architecture documentation to reflect mobile hero implementation

### Technical Details
- **Files Modified:**
  - `/docs/index.html` - Added mobile hero HTML structure
  - `/docs/css/mobile-ux-improvements.css` - Added mobile hero styles (lines 829-1007)
  - `/docs/js/main.js` - Hero close/show behavior skips mobile devices
- **Design Specs Created:**
  - `/docs/design-specs/mobile-hero-inline-design.md`
  - `/docs/design-specs/mobile-hero-visual-guide.md`
- **Documentation Created:**
  - `/docs/MOBILE-HERO-IMPLEMENTATION.md`
- **Mobile Breakpoint:** ≤768px (inline hero)
- **Desktop Breakpoint:** ≥769px (modal unchanged)
- **Performance:**
  - LCP optimized with eager loading and fetchpriority high
  - No backdrop-filter on mobile (GPU performance improvement)
  - CLS < 0.1 (no layout shift)
- **Accessibility:**
  - WCAG AAA compliant contrast ratios
  - 48px touch targets (exceeds 44px minimum)
  - Full keyboard navigation support
  - Screen reader optimized with semantic HTML

### Design Decisions
- **Brand Alignment:** Calm, organic, art-first (no aggressive commercial patterns)
- **Single CTA Approach:** Reduces decision paralysis on mobile
- **Inline vs Modal:** Improves mobile UX by removing blocking interaction
- **Image Treatment:** No dark overlay (brighter, more vibrant than desktop)
- **Performance First:** Solid background instead of backdrop-filter for better mobile performance

---

## [2.0.0] - 2024-12-14

### Architecture
- Established zero-dependency vanilla JavaScript architecture
- Implemented ITCSS CSS organization (tokens, base, components, layout)
- Created comprehensive design system with CSS custom properties
- Progressive enhancement strategy (HTML → CSS → JavaScript)

### Features
- 8 static HTML pages (index, gallery, about, commissions, contact, terms, privacy, 404)
- 17 JavaScript feature modules using IIFE pattern
- Theme system (light/dark) with localStorage persistence
- Gallery filtering and lightbox with keyboard navigation
- Favorites system with localStorage
- Commission wizard with multi-step form
- Mobile navigation with hamburger menu
- Scroll animations using Intersection Observer
- Form validation with mailto fallback

### Performance
- Sub-second load times
- Lighthouse score 95+
- WebP image optimization
- Lazy loading for gallery images
- CSS-only animations (GPU accelerated)

### Accessibility
- WCAG 2.1 AA compliant
- Semantic HTML structure
- Keyboard navigation support
- Screen reader optimized
- High contrast color ratios
- Focus indicators on all interactive elements

---

## Versioning Strategy

- **Major (X.0.0):** Breaking changes, significant architecture updates
- **Minor (0.X.0):** New features, component additions
- **Patch (0.0.X):** Bug fixes, minor improvements

---

**Maintained by:** Development Team
**Last Updated:** 2026-01-08
