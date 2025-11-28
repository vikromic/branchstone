# Gallery Page Performance Optimization - Task Breakdown

**Document ID:** GALLERY-PERF-001
**Created:** 2024-11-28
**Status:** Draft
**Epic:** Gallery Performance Optimization
**Target:** Core Web Vitals compliance and improved user experience

---

## Executive Summary

This document outlines a comprehensive performance optimization plan for the Branchstone art gallery page. The current implementation loads ~100 JPEG images totaling 20.4 MB with an average file size of 208 KB. The site uses vanilla JavaScript (~107 KB across 16 modules) and CSS (~181 KB across 14 files) without a build system.

### Current State Analysis

| Metric | Current Value | Issue |
|--------|---------------|-------|
| Total Image Payload | 20.4 MB | Excessive for initial page load |
| Average Image Size | 208 KB | No responsive variants |
| Image Format | JPEG only | No WebP/AVIF support |
| JS Bundle Size | 107 KB (unminified) | All modules loaded on every page |
| CSS Size | 181 KB (unminified) | No critical CSS extraction |
| Lazy Loading | Partial (native `loading="lazy"`) | No progressive loading |

### Core Web Vitals Targets

| Metric | Target | Current Risk |
|--------|--------|--------------|
| LCP (Largest Contentful Paint) | < 2.5s | HIGH - Large hero images |
| FID (First Input Delay) | < 100ms | MEDIUM - JS execution |
| CLS (Cumulative Layout Shift) | < 0.1 | MEDIUM - Images without dimensions |

---

## Task Breakdown

### Phase 1: Image Optimization (Highest Impact)

#### TASK-001: Implement WebP Image Generation Script
**ID:** GALLERY-PERF-001-T001
**Priority:** P0 (Critical)
**Complexity:** M (1-2 days)
**Assignee:** frontend-developer

**Description:**
Create a Node.js script using Sharp library to generate WebP versions of all gallery images with multiple size variants for srcset.

**Current State:**
- Images are JPEG only at 360x450px average resolution
- No responsive variants exist
- artworks.json contains image paths but no srcset data

**Technical Requirements:**
- Generate WebP versions at 75-80% quality (typically 25-35% smaller than JPEG)
- Create size variants: 400w, 800w, 1200w, 1920w
- Preserve original JPEG as fallback
- Update artworks.json schema to include srcset data

**Acceptance Criteria:**
- [ ] Script generates WebP versions for all 100 images
- [ ] Size variants created for responsive loading
- [ ] Original JPEG files preserved
- [ ] Script is idempotent (re-runnable without duplication)
- [ ] Total image payload reduced by minimum 30%

**Dependencies:** None

**Estimated Impact:**
- LCP: 30-40% improvement
- Total payload: 30-50% reduction

**Risks:**
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Quality degradation | Medium | Medium | Test at multiple quality levels, provide side-by-side comparison |
| Build time increase | Low | Low | Implement incremental processing |

---

#### TASK-002: Update Gallery.js for srcset Support
**ID:** GALLERY-PERF-001-T002
**Priority:** P0 (Critical)
**Complexity:** S (2-4 hours)
**Assignee:** frontend-developer

**Description:**
Modify Gallery.js to utilize srcset and sizes attributes when rendering gallery items and featured items.

**Current State:**
```javascript
// Gallery.js lines 168-182 - Current implementation
const imgAttributes = {
  src: artwork.image,
  alt: artwork.title,
  loading: 'lazy',
};
if (artwork.srcset) {
  imgAttributes.srcset = artwork.srcset;
  imgAttributes.sizes = artwork.sizes || '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw';
}
```

**Technical Requirements:**
- Add `<picture>` element support with WebP source
- Implement proper sizes attribute based on grid layout
- Add decoding="async" for non-blocking decode
- Ensure backwards compatibility with existing JSON structure

**Implementation Approach:**
```javascript
// Target implementation
createGalleryItem(artwork) {
  const picture = createElement('picture');

  if (artwork.webp) {
    const sourceWebp = createElement('source', {
      srcset: artwork.webp.srcset,
      sizes: this.getSizes(),
      type: 'image/webp'
    });
    picture.appendChild(sourceWebp);
  }

  const img = createElement('img', {
    src: artwork.image,
    srcset: artwork.srcset || '',
    sizes: this.getSizes(),
    alt: artwork.title,
    loading: 'lazy',
    decoding: 'async',
    width: artwork.width,
    height: artwork.height
  });
  picture.appendChild(img);
}
```

**Acceptance Criteria:**
- [ ] Gallery items use `<picture>` element with WebP source
- [ ] srcset properly generated from JSON data
- [ ] sizes attribute reflects actual layout breakpoints
- [ ] Fallback to JPEG works in all browsers
- [ ] No regression in existing functionality

**Dependencies:** TASK-001 (WebP generation)

**Estimated Impact:**
- LCP: 10-15% improvement
- Bandwidth: Browsers select optimal image size

---

#### TASK-003: Add Explicit Image Dimensions
**ID:** GALLERY-PERF-001-T003
**Priority:** P0 (Critical)
**Complexity:** S (2-4 hours)
**Assignee:** frontend-developer

**Description:**
Add width and height attributes to all img elements to prevent Cumulative Layout Shift.

**Current State:**
- Images rely on CSS `aspect-ratio: 3/4` for mobile
- No explicit dimensions in img tags
- Layout shift occurs during image loading

**Technical Requirements:**
- Add width/height to artworks.json schema
- Update image generation script to extract dimensions
- Modify Gallery.js to include dimensions in img attributes
- Use CSS aspect-ratio as progressive enhancement

**Acceptance Criteria:**
- [ ] All gallery images have explicit width/height
- [ ] artworks.json updated with dimension data
- [ ] CLS score < 0.1 on mobile and desktop
- [ ] Aspect ratio maintained during loading

**Dependencies:** TASK-001 (script can extract dimensions)

**Estimated Impact:**
- CLS: Reduced to near-zero
- User experience: Eliminates layout jumping

---

#### TASK-004: Implement Blur-Up Progressive Loading
**ID:** GALLERY-PERF-001-T004
**Priority:** P1 (High)
**Complexity:** M (1-2 days)
**Assignee:** frontend-developer

**Description:**
Create low-quality image placeholders (LQIP) for progressive image loading experience.

**Current State:**
- Skeleton placeholders show generic animated gradient
- No preview of actual image content
- Abrupt transition when images load

**Technical Requirements:**
- Generate 20-40px wide blur placeholders (base64 inline)
- Add placeholder data to artworks.json
- Implement CSS blur-up transition effect
- Consider dominant color extraction as alternative

**Implementation Approach:**
```css
.gallery-item img {
  transition: filter 0.3s ease-out;
}

.gallery-item img.loading {
  filter: blur(20px);
}

.gallery-item img.loaded {
  filter: blur(0);
}
```

**Acceptance Criteria:**
- [ ] LQIP generated for all gallery images
- [ ] Base64 placeholders inline in JSON (< 500 bytes each)
- [ ] Smooth transition from blur to sharp
- [ ] No impact on initial render performance

**Dependencies:** TASK-001, TASK-002

**Estimated Impact:**
- Perceived performance: Significant improvement
- User experience: Content preview during load

**Risks:**
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| JSON file size increase | Medium | Low | Compress JSON, limit placeholder size |
| Visual quality of blur | Low | Medium | Test multiple blur levels |

---

### Phase 2: JavaScript Performance

#### TASK-005: Implement Module-Level Code Splitting
**ID:** GALLERY-PERF-001-T005
**Priority:** P1 (High)
**Complexity:** M (1-2 days)
**Assignee:** frontend-developer

**Description:**
Refactor app.js to dynamically import page-specific modules, reducing initial JavaScript payload.

**Current State:**
```javascript
// app.js - All imports loaded regardless of page
import Menu from './components/Menu.js';
import ThemeManager from './components/Theme.js';
import Lightbox from './components/Lightbox.js';  // Only needed on gallery
import Gallery from './components/Gallery.js';    // Only needed on gallery/home
import GalleryFilter from './components/GalleryFilter.js'; // Only gallery
import AnimationManager from './components/Animations.js';
import FormValidator from './components/FormValidator.js'; // Only contact
import Carousel from './components/Carousel.js';  // Only home/about
import ScrollToTop from './components/ScrollToTop.js';
```

**Technical Requirements:**
- Convert static imports to dynamic `import()` for page-specific modules
- Keep core modules (Menu, Theme, Animations) as static imports
- Implement proper error handling for dynamic imports
- No build system required - uses native ES modules

**Implementation Approach:**
```javascript
// Refactored page-specific loading
async initGalleryPage() {
  const galleryGrid = document.querySelector('.gallery-grid');
  if (!galleryGrid) return;

  const [{ Gallery }, { GalleryFilter }, { Lightbox }] = await Promise.all([
    import('./components/Gallery.js'),
    import('./components/GalleryFilter.js'),
    import('./components/Lightbox.js')
  ]);

  // ... initialization code
}
```

**Acceptance Criteria:**
- [ ] Page-specific modules loaded only when needed
- [ ] Initial JS payload reduced by 40%+
- [ ] No functionality regression
- [ ] Error handling for failed imports
- [ ] Works without build system (native ES modules)

**Dependencies:** None

**Estimated Impact:**
- FID: 20-30% improvement on non-gallery pages
- TTI: Faster time to interactive

**Risks:**
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Browser compatibility | Low | Medium | Test in Safari, Firefox, Chrome |
| Network waterfall | Medium | Low | Use Promise.all for parallel loading |

---

#### TASK-006: Defer Non-Critical JavaScript
**ID:** GALLERY-PERF-001-T006
**Priority:** P1 (High)
**Complexity:** XS (1-2 hours)
**Assignee:** frontend-developer

**Description:**
Add defer attribute to script tags and optimize script loading order.

**Current State:**
```html
<!-- gallery.html lines 225-226 -->
<script type="module" src="js/i18n.js"></script>
<script type="module" src="js/app.js"></script>
```

**Technical Requirements:**
- ES modules are already deferred by default
- Verify i18n.js doesn't block rendering
- Consider preloading critical modules
- Add modulepreload hints for critical path

**Implementation:**
```html
<!-- Preload critical modules -->
<link rel="modulepreload" href="js/app.js">
<link rel="modulepreload" href="js/config.js">
<link rel="modulepreload" href="js/components/Menu.js">

<!-- Scripts remain at end of body -->
<script type="module" src="js/app.js"></script>
```

**Acceptance Criteria:**
- [ ] Critical modules preloaded
- [ ] No render-blocking JavaScript
- [ ] FCP not degraded

**Dependencies:** None

**Estimated Impact:**
- FCP: 5-10% improvement
- FID: Reduced main thread blocking

---

#### TASK-007: Optimize IntersectionObserver Usage
**ID:** GALLERY-PERF-001-T007
**Priority:** P2 (Medium)
**Complexity:** S (2-4 hours)
**Assignee:** frontend-developer

**Description:**
Consolidate multiple IntersectionObserver instances and optimize callback performance.

**Current State:**
- AnimationManager creates one observer for scroll animations
- App.js creates additional observer for mobile gallery
- GalleryFilter uses direct DOM queries after filter changes
- Multiple observers running simultaneously

**Technical Requirements:**
- Create single shared observer for animations and visibility
- Debounce observer callbacks
- Use requestIdleCallback for non-critical animations
- Reduce threshold sensitivity where appropriate

**Acceptance Criteria:**
- [ ] Single consolidated IntersectionObserver
- [ ] Observer callbacks optimized with requestIdleCallback
- [ ] No visible performance regression
- [ ] Reduced memory footprint

**Dependencies:** None

**Estimated Impact:**
- Memory: Reduced observer overhead
- FID: Smoother scrolling experience

---

### Phase 3: CSS Optimization

#### TASK-008: Extract Critical CSS
**ID:** GALLERY-PERF-001-T008
**Priority:** P1 (High)
**Complexity:** M (1-2 days)
**Assignee:** frontend-developer

**Description:**
Extract above-the-fold CSS and inline it in HTML for faster first paint.

**Current State:**
```css
/* main.css - All CSS loaded via @import */
@import url('01-tokens.css');
@import url('02-base.css');
/* ... 12 more imports */
```
- Total CSS: 181 KB across 14 files
- @import creates waterfall loading
- No critical CSS inlining

**Technical Requirements:**
- Identify above-the-fold CSS (header, gallery header, first row of items)
- Inline critical CSS in `<head>` (target < 14 KB)
- Load remaining CSS asynchronously
- Maintain CSS import order for specificity

**Implementation Approach:**
```html
<head>
  <style>
    /* Critical CSS - inlined */
    :root { /* tokens */ }
    body { /* base styles */ }
    header, nav { /* header styles */ }
    .gallery-header { /* above fold */ }
    .skeleton-item { /* loading state */ }
  </style>

  <!-- Non-critical CSS loaded async -->
  <link rel="preload" href="css/main.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="css/main.css"></noscript>
</head>
```

**Acceptance Criteria:**
- [ ] Critical CSS < 14 KB inlined
- [ ] FCP improved by 20%+
- [ ] No FOUC (Flash of Unstyled Content)
- [ ] Remaining CSS loads asynchronously

**Dependencies:** None

**Estimated Impact:**
- FCP: 20-30% improvement
- LCP: 10-15% improvement

**Risks:**
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| CSS specificity issues | Medium | Medium | Test thoroughly, maintain order |
| Maintenance burden | Medium | Low | Document critical CSS boundaries |

---

#### TASK-009: Remove Unused CSS
**ID:** GALLERY-PERF-001-T009
**Priority:** P2 (Medium)
**Complexity:** S (2-4 hours)
**Assignee:** frontend-developer

**Description:**
Audit and remove unused CSS rules from the stylesheet.

**Current State:**
- style.css: 85 KB (appears to be an unused legacy file)
- Multiple media query duplications
- Potential unused selectors from component evolution

**Technical Requirements:**
- Use PurgeCSS or similar tool to identify unused rules
- Remove or consolidate duplicate media queries
- Delete legacy style.css if not in use
- Document removed styles for reference

**Implementation:**
```bash
# Manual audit approach (no build system)
# 1. Check if style.css is referenced anywhere
# 2. Use Chrome Coverage tool to identify unused CSS
# 3. Manually remove confirmed unused rules
```

**Acceptance Criteria:**
- [ ] Unused CSS identified and removed
- [ ] Total CSS reduced by 20%+
- [ ] No visual regressions
- [ ] style.css evaluated and removed if unused

**Dependencies:** None

**Estimated Impact:**
- CSS payload: 20-40% reduction
- Parse time: Reduced CSS processing

---

#### TASK-010: Optimize CSS Animations
**ID:** GALLERY-PERF-001-T010
**Priority:** P2 (Medium)
**Complexity:** S (2-4 hours)
**Assignee:** frontend-developer

**Description:**
Optimize CSS animations to use compositor-only properties and reduce paint operations.

**Current State:**
```css
/* 04-gallery.css - Current skeleton animation */
@keyframes skeleton-loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

/* Gallery item hover */
.gallery-item img {
    transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1),
        filter 0.6s cubic-bezier(0.16, 1, 0.3, 1),
        opacity 0.3s ease;
    will-change: transform, filter;
}
```

**Technical Requirements:**
- Audit all animations for compositor-only properties
- Replace layout-triggering animations where possible
- Add `will-change` strategically (not globally)
- Use `contain: layout` for gallery grid

**Optimization Targets:**
```css
/* Optimized: Use transform instead of background-position */
@keyframes skeleton-loading {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}

/* Add containment */
.gallery-grid {
    contain: layout style;
}

.gallery-item {
    contain: layout;
}
```

**Acceptance Criteria:**
- [ ] All animations use compositor-only properties where possible
- [ ] will-change applied only during animation
- [ ] CSS containment added to gallery grid
- [ ] No visible animation quality degradation

**Dependencies:** None

**Estimated Impact:**
- Frame rate: Smoother 60fps animations
- CPU usage: Reduced paint operations

---

### Phase 4: Perceived Performance

#### TASK-011: Enhance Skeleton Loading States
**ID:** GALLERY-PERF-001-T011
**Priority:** P1 (High)
**Complexity:** S (2-4 hours)
**Assignee:** frontend-developer

**Description:**
Improve skeleton placeholders to better match final content dimensions and provide smoother transitions.

**Current State:**
```html
<!-- gallery.html - Static skeleton count -->
<div class="skeleton-item" aria-hidden="true">
    <div class="skeleton-image"></div>
    <div class="skeleton-info">
        <div class="skeleton-title"></div>
        <div class="skeleton-subtitle"></div>
    </div>
</div>
<!-- 8 skeleton items total -->
```

**Technical Requirements:**
- Match skeleton dimensions to actual gallery item aspect ratios
- Dynamic skeleton count based on viewport
- Smoother fade-out transition when content loads
- Staggered skeleton animations for visual interest

**Implementation:**
```css
.skeleton-item {
    aspect-ratio: 3/4;  /* Match gallery items */
    animation-delay: calc(var(--index) * 0.1s);
}

.gallery-loaded .skeleton-item {
    animation: fadeOut 0.3s ease forwards;
}
```

**Acceptance Criteria:**
- [ ] Skeleton dimensions match gallery items
- [ ] Smooth transition to loaded content
- [ ] Staggered animation timing
- [ ] Accessible (aria-hidden, reduced motion support)

**Dependencies:** None

**Estimated Impact:**
- Perceived performance: Significantly improved
- User experience: Reduced cognitive load during wait

---

#### TASK-012: Implement Instant Page Preloading
**ID:** GALLERY-PERF-001-T012
**Priority:** P2 (Medium)
**Complexity:** S (2-4 hours)
**Assignee:** frontend-developer

**Description:**
Add link preloading on hover/touch to make navigation feel instant.

**Current State:**
- No preloading of navigation targets
- Full page load on each navigation
- Static site could benefit from aggressive prefetching

**Technical Requirements:**
- Preload pages on link hover (desktop) or touchstart (mobile)
- Use `<link rel="prefetch">` for likely next pages
- Implement with vanilla JavaScript (no library)
- Respect user's data-saver preferences

**Implementation:**
```javascript
// Simple prefetch on hover
document.querySelectorAll('a[href^="/"]:not([prefetched])').forEach(link => {
  link.addEventListener('mouseenter', () => {
    if (link.getAttribute('prefetched')) return;
    const prefetch = document.createElement('link');
    prefetch.rel = 'prefetch';
    prefetch.href = link.href;
    document.head.appendChild(prefetch);
    link.setAttribute('prefetched', 'true');
  }, { once: true, passive: true });
});
```

**Acceptance Criteria:**
- [ ] Pages prefetch on hover (300ms delay)
- [ ] Respects prefers-reduced-data
- [ ] No duplicate prefetch requests
- [ ] Works on mobile (touchstart)

**Dependencies:** None

**Estimated Impact:**
- Navigation speed: Near-instant page transitions
- User experience: Perceived performance boost

---

### Phase 5: Measurement and Monitoring

#### TASK-013: Implement Performance Monitoring
**ID:** GALLERY-PERF-001-T013
**Priority:** P2 (Medium)
**Complexity:** S (2-4 hours)
**Assignee:** frontend-developer

**Description:**
Add lightweight performance monitoring to track Core Web Vitals in production.

**Current State:**
- No performance monitoring
- Cannot measure real-world impact of optimizations
- config.js has `analyticsEnabled: false`

**Technical Requirements:**
- Use web-vitals library (1.5 KB gzipped)
- Log metrics to console in development
- Optional: Send to analytics endpoint
- Track LCP, FID, CLS, TTFB

**Implementation:**
```javascript
// Lightweight CWV tracking
import { onLCP, onFID, onCLS } from 'web-vitals';

function reportMetric({ name, value, rating }) {
  console.log(`${name}: ${value} (${rating})`);
  // Optional: Send to analytics
}

onLCP(reportMetric);
onFID(reportMetric);
onCLS(reportMetric);
```

**Acceptance Criteria:**
- [ ] Core Web Vitals tracked on gallery page
- [ ] Metrics logged in development mode
- [ ] Minimal impact on performance (< 2 KB)
- [ ] Optional analytics integration

**Dependencies:** All optimization tasks (for measurement)

**Estimated Impact:**
- Enables data-driven optimization decisions
- Tracks real-world performance improvements

---

## Dependency Graph

```
                    +------------------+
                    |   TASK-001       |
                    | WebP Generation  |
                    +--------+---------+
                             |
              +--------------+--------------+
              |              |              |
              v              v              v
    +------------------+  +------------------+  +------------------+
    |   TASK-002       |  |   TASK-003       |  |   TASK-004       |
    | srcset Support   |  | Image Dimensions |  | Blur-Up Loading  |
    +------------------+  +------------------+  +--------+---------+
                                                         |
                                                         v
                                               +------------------+
                                               |   TASK-011       |
                                               | Enhanced Skeleton|
                                               +------------------+

    +------------------+     +------------------+     +------------------+
    |   TASK-005       |     |   TASK-008       |     |   TASK-013       |
    | Code Splitting   |     | Critical CSS     |     | Monitoring       |
    +------------------+     +------------------+     +------------------+
           |                        |                        ^
           v                        v                        |
    +------------------+     +------------------+             |
    |   TASK-006       |     |   TASK-009       |   (After all optimizations)
    | Defer Scripts    |     | Remove Unused    |
    +------------------+     +------------------+

    +------------------+     +------------------+     +------------------+
    |   TASK-007       |     |   TASK-010       |     |   TASK-012       |
    | IO Optimization  |     | CSS Animations   |     | Prefetch Links   |
    +------------------+     +------------------+     +------------------+
```

---

## Sprint Planning Recommendation

### Sprint 1 (Week 1): Critical Path - Image Optimization
| Task | Priority | Estimate | Assignee |
|------|----------|----------|----------|
| TASK-001 | P0 | 1.5 days | frontend-developer |
| TASK-002 | P0 | 3 hours | frontend-developer |
| TASK-003 | P0 | 2 hours | frontend-developer |

**Sprint Goal:** Reduce image payload by 40%+, eliminate CLS issues

### Sprint 2 (Week 2): JavaScript & CSS Optimization
| Task | Priority | Estimate | Assignee |
|------|----------|----------|----------|
| TASK-005 | P1 | 1 day | frontend-developer |
| TASK-006 | P1 | 1 hour | frontend-developer |
| TASK-008 | P1 | 1.5 days | frontend-developer |

**Sprint Goal:** Reduce JS/CSS blocking, improve FCP

### Sprint 3 (Week 3): Polish & Measurement
| Task | Priority | Estimate | Assignee |
|------|----------|----------|----------|
| TASK-004 | P1 | 1 day | frontend-developer |
| TASK-011 | P1 | 3 hours | frontend-developer |
| TASK-009 | P2 | 3 hours | frontend-developer |
| TASK-013 | P2 | 3 hours | frontend-developer |

**Sprint Goal:** Enhance perceived performance, enable monitoring

### Backlog (Future Sprints)
| Task | Priority | Estimate | Notes |
|------|----------|----------|-------|
| TASK-007 | P2 | 3 hours | Optimization polish |
| TASK-010 | P2 | 3 hours | Animation refinement |
| TASK-012 | P2 | 3 hours | Navigation enhancement |

---

## Risk Assessment Summary

| Risk Category | Items | Mitigation Strategy |
|---------------|-------|---------------------|
| **High Impact** | Image quality degradation | Test WebP at multiple quality levels, maintain JPEG fallback |
| **Medium Impact** | Browser compatibility | Test on Safari, Firefox, Chrome; native ES modules well-supported |
| **Low Impact** | Build complexity | Keep build-free approach, use Node.js scripts only for assets |
| **Technical Debt** | CSS maintenance | Document critical CSS boundaries clearly |

---

## Success Metrics

| Metric | Current (Estimated) | Target | Measurement |
|--------|---------------------|--------|-------------|
| LCP | 4-6s | < 2.5s | Lighthouse, web-vitals |
| FID | ~150ms | < 100ms | web-vitals |
| CLS | 0.15-0.25 | < 0.1 | Lighthouse, web-vitals |
| Total Page Weight | ~21 MB | < 2 MB initial | DevTools Network |
| Time to Interactive | ~5s | < 3s | Lighthouse |

---

## Notes for Implementation

1. **No Build System Constraint:** All solutions must work with native ES modules and manual asset processing scripts.

2. **Static Site Context:** Changes should be deployable via simple file copy to GitHub Pages.

3. **Image Generation Script:** Should be a standalone Node.js script that can be run manually when new artwork is added.

4. **Testing Approach:** Use Lighthouse CI or manual audits before/after each sprint.

5. **Rollback Strategy:** Git-based rollback; keep original images in place alongside optimized versions.

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-11-28 | engineering-lead | Initial task breakdown |
