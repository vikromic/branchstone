# Next-Generation Artist Portfolio Improvement Plan

**Project**: Branchstone Art Portfolio
**Document ID**: NEXT-GEN-PORTFOLIO-001
**Created**: 2025-11-28
**Engineering Lead**: AI Assistant
**Status**: Active

---

## Executive Summary

### Current State Assessment

The Branchstone Art portfolio is a well-architected static website with a solid foundation:

**Strengths:**
- Clean ES6 modular JavaScript architecture with clear separation of concerns
- Well-implemented design token system with light/dark theme support
- Bilingual support (EN/UA) with proper i18n infrastructure
- Mobile-first responsive design with accessibility features (skip links, ARIA)
- PWA-ready with service worker and offline page
- Gallery with lightbox featuring pinch-zoom, swipe navigation, and keyboard support
- Contact form with Formspree integration and pre-fill from artwork inquiry

**Weaknesses:**
- **Critical**: Image optimization is the primary performance bottleneck (21MB total, 2.6MB hero)
- No responsive images (srcset prepared in code but variants not generated)
- No WebP/AVIF formats (100% JPEG)
- Static JSON-based content management (no CMS)
- No analytics or user behavior insights
- Limited SEO (no structured data/schema.org)
- No search functionality for artwork
- Experience section hidden (incomplete content)
- No e-commerce capabilities (inquire-only flow)
- Limited social media integration (Instagram only)

**Technical Debt:**
- Duplicate CSS in bundle.css vs individual files
- Critical CSS duplicated in gallery.html head
- 6 font weights loaded (potentially excessive)
- No build process for optimization

### Vision for Next-Generation Portfolio

Transform Branchstone Art into an **immersive digital art experience** that:

1. **Showcases art as the hero** - Every interaction celebrates the artwork
2. **Loads instantly** - Sub-2s LCP on 4G connections
3. **Engages emotionally** - Micro-interactions that evoke the tactile nature of the art
4. **Converts visitors** - Clear path from discovery to inquiry to purchase
5. **Scales with the artist** - Easy content updates without technical knowledge
6. **Stands out** - Features that no other artist portfolio offers

---

## Strategic Roadmap

### Phase 1: Quick Wins (1-2 Weeks)
High impact, low effort improvements that immediately boost performance and UX.

### Phase 2: Medium Impact (2-4 Weeks)
Feature enhancements that differentiate the portfolio.

### Phase 3: Transformational (4-8 Weeks)
Major architectural changes that create a truly next-generation experience.

---

## Phase 1: Quick Wins

### TASK-001: Image Optimization Pipeline
**Priority**: P0-Critical | **Complexity**: M | **Estimated Effort**: 2-3 days

**Description**: Implement automated image optimization to address the critical LCP bottleneck.

**Agent Assignment**: `devops-architect`, `frontend-developer`

**Acceptance Criteria**:
- [ ] Generate WebP and AVIF variants for all images
- [ ] Create responsive sizes: 400w, 800w, 1200w, 1920w
- [ ] Implement LQIP (Low-Quality Image Placeholders) with base64 blur
- [ ] Update artworks.json with srcset data
- [ ] Gallery.js already supports srcset - enable it
- [ ] LCP improves from 3-5s to under 2.5s

**Technical Details**:
- Use Sharp.js for image processing (already in scripts/package.json)
- Generate optimized variants in img/ directory structure
- Preserve originals in img/originals/ for future regeneration
- Target quality: WebP 80, AVIF 65, JPEG 85

**Dependencies**: None

**Risks**:
- Storage increase with multiple formats (~3x size temporarily)
- Mitigation: Use .gitignore for original files, only commit optimized

---

### TASK-002: Font Optimization
**Priority**: P1-High | **Complexity**: S | **Estimated Effort**: 4-6 hours

**Description**: Reduce font payload and improve loading strategy.

**Agent Assignment**: `frontend-developer`

**Acceptance Criteria**:
- [ ] Reduce font weights from 6 to 4 (Inter: 400, 500; Cormorant: 600)
- [ ] Self-host fonts with preload for critical text
- [ ] Implement font-display: optional for non-critical fonts
- [ ] Generate subsetted font files (latin + latin-ext only)
- [ ] Font payload reduced from ~400KB to ~120KB

**Technical Details**:
- Download Google Fonts and host locally in /fonts directory
- Use fonttools for subsetting
- Add preload hints for Cormorant Garamond (headings)

**Dependencies**: None

---

### TASK-003: Critical CSS Extraction & Inlining
**Priority**: P1-High | **Complexity**: S | **Estimated Effort**: 4-6 hours

**Description**: Inline critical above-the-fold CSS to eliminate render-blocking.

**Agent Assignment**: `frontend-developer`

**Acceptance Criteria**:
- [ ] Extract critical CSS for each page (~15KB inline)
- [ ] Async load remaining CSS with media="print" hack
- [ ] Remove duplicate CSS from gallery.html head
- [ ] FCP improves by 200-400ms

**Technical Details**:
- Critical CSS already partially done in gallery.html
- Extend pattern to all pages
- Use consistent approach via script or build tool

**Dependencies**: None

---

### TASK-004: Structured Data / Schema.org
**Priority**: P2-Medium | **Complexity**: S | **Estimated Effort**: 3-4 hours

**Description**: Add schema.org structured data for better SEO.

**Agent Assignment**: `frontend-developer`

**Acceptance Criteria**:
- [ ] Add Person schema for artist
- [ ] Add ArtGallery schema for gallery page
- [ ] Add VisualArtwork schema for each artwork in lightbox
- [ ] Add LocalBusiness schema for contact page
- [ ] Validate with Google Rich Results Test

**Technical Details**:
```json
{
  "@context": "https://schema.org",
  "@type": "VisualArtwork",
  "name": "Born of Burn",
  "creator": { "@type": "Person", "name": "Viktoria Branchstone" },
  "artMedium": "Mixed media on canvas",
  "width": "24 in",
  "height": "36 in"
}
```

**Dependencies**: None

---

### TASK-005: Accessibility Audit & Fixes
**Priority**: P1-High | **Complexity**: S | **Estimated Effort**: 4-6 hours

**Description**: Complete WCAG 2.1 AA compliance with AAA targets.

**Agent Assignment**: `frontend-developer`, `qa-automation`

**Acceptance Criteria**:
- [ ] Run axe-core audit and fix all violations
- [ ] Ensure all interactive elements have visible focus states
- [ ] Add aria-current="page" to active nav items
- [ ] Verify color contrast ratios (already improved in tokens)
- [ ] Test with VoiceOver and NVDA
- [ ] Score 100 on Lighthouse accessibility

**Technical Details**:
- Focus states exist but may need enhancement for visibility
- Add focus-visible polyfill for older browsers

**Dependencies**: None

---

## Phase 2: Medium Impact

### TASK-006: Artwork Search & Advanced Filtering
**Priority**: P2-Medium | **Complexity**: M | **Estimated Effort**: 2-3 days

**Description**: Add full-text search and faceted filtering for artwork discovery.

**Agent Assignment**: `frontend-developer`

**Acceptance Criteria**:
- [ ] Search input in gallery header
- [ ] Client-side fuzzy search (Fuse.js or similar)
- [ ] Search across title, description, materials
- [ ] Multi-select category filters
- [ ] Filter by availability (available/sold)
- [ ] URL state persistence for shareable filter links
- [ ] Clear all filters button

**Technical Details**:
- Add Fuse.js (~5KB gzipped) for fuzzy search
- Update GalleryFilter.js to support multiple selections
- Store filter state in URL query params

**Dependencies**: TASK-001 (images should load fast for filtered results)

---

### TASK-007: Artwork Detail Page
**Priority**: P2-Medium | **Complexity**: M | **Estimated Effort**: 2-3 days

**Description**: Create dedicated artwork detail pages with SEO-friendly URLs.

**Agent Assignment**: `frontend-developer`

**Acceptance Criteria**:
- [ ] Individual artwork pages at /artwork/{slug}.html
- [ ] Full-screen image gallery with thumbnails
- [ ] Detailed artwork information (materials, dimensions, story)
- [ ] "Inquire About This Piece" button
- [ ] Related artworks section
- [ ] Social sharing buttons
- [ ] Each page has unique meta tags and schema.org

**Technical Details**:
- Generate static pages via build script
- Alternative: Use hash routing (#artwork/slug) to keep single-page
- Recommend static pages for SEO

**Dependencies**: TASK-001 (image optimization), TASK-004 (schema.org)

---

### TASK-008: Virtual Gallery Experience
**Priority**: P3-Low | **Complexity**: L | **Estimated Effort**: 5-7 days

**Description**: Create an immersive virtual gallery tour experience.

**Agent Assignment**: `frontend-developer`, `ui-ux-designer`

**Acceptance Criteria**:
- [ ] 3D gallery room with artwork on walls
- [ ] Click to zoom into artwork details
- [ ] Smooth navigation between "rooms" or sections
- [ ] Mobile-friendly controls (swipe, pinch)
- [ ] Optional: VR/AR support for compatible devices
- [ ] Performance target: 60fps on mid-range devices

**Technical Details**:
- Use Three.js or A-Frame for 3D rendering
- Consider lightweight alternatives like Pannellum for 360 view
- Load artwork textures on demand

**Dependencies**: TASK-001 (image optimization critical for 3D)

**Risks**:
- High complexity, may impact performance
- Mitigation: Offer as optional "Experience" mode, not default

---

### TASK-009: Analytics & User Insights
**Priority**: P1-High | **Complexity**: S | **Estimated Effort**: 1 day

**Description**: Implement privacy-respecting analytics.

**Agent Assignment**: `frontend-developer`, `devops-architect`

**Acceptance Criteria**:
- [ ] Implement Plausible or Fathom (GDPR-compliant, no cookies)
- [ ] Track page views, referrers, device types
- [ ] Custom events: artwork views, inquiry submissions, filter usage
- [ ] Dashboard accessible to artist
- [ ] No impact on Core Web Vitals

**Technical Details**:
- Plausible: self-hosted or cloud (~$9/month)
- Alternative: Self-hosted Umami (free, open-source)
- Add via script tag (1KB, non-blocking)

**Dependencies**: None

---

### TASK-010: Enhanced Contact Form
**Priority**: P2-Medium | **Complexity**: S | **Estimated Effort**: 1-2 days

**Description**: Improve contact form UX and add commission request flow.

**Agent Assignment**: `frontend-developer`

**Acceptance Criteria**:
- [ ] Add inquiry type dropdown (Purchase, Commission, Collaboration, General)
- [ ] Commission form with additional fields (size, timeline, budget range)
- [ ] File upload for reference images (for commissions)
- [ ] Success page with next steps
- [ ] Email confirmation to user (via Formspree)
- [ ] CRM integration ready (Airtable webhook)

**Technical Details**:
- Multi-step form for commission flow
- Use Formspree file upload feature
- Consider Airtable for inquiry management

**Dependencies**: None

---

### TASK-011: Performance Monitoring
**Priority**: P2-Medium | **Complexity**: S | **Estimated Effort**: 4-6 hours

**Description**: Set up real user monitoring (RUM) for Core Web Vitals.

**Agent Assignment**: `devops-architect`

**Acceptance Criteria**:
- [ ] Implement web-vitals library
- [ ] Send metrics to analytics or custom endpoint
- [ ] Set up alerts for LCP > 2.5s, CLS > 0.1
- [ ] Monthly performance reports

**Technical Details**:
- Use web-vitals library (~1KB)
- Send to Plausible custom events or dedicated RUM service
- Consider Vercel Analytics (free tier) if migrating hosting

**Dependencies**: TASK-009 (analytics)

---

## Phase 3: Transformational

### TASK-012: Headless CMS Integration
**Priority**: P2-Medium | **Complexity**: L | **Estimated Effort**: 5-7 days

**Description**: Enable artist to manage content without touching code.

**Agent Assignment**: `backend-developer`, `frontend-developer`, `devops-architect`

**Acceptance Criteria**:
- [ ] Artist can add/edit/delete artworks via web interface
- [ ] Image upload with automatic optimization
- [ ] Preview changes before publish
- [ ] Content versioning/history
- [ ] Multi-language content management
- [ ] Build triggered on content change (GitHub Actions)

**Technical Details**:
- **Recommended CMS**: Decap CMS (formerly Netlify CMS) - works with GitHub Pages
- Alternative: Sanity.io (more powerful, small free tier)
- Alternative: Contentful (enterprise-grade)
- See ADR-002 for detailed comparison

**Dependencies**: TASK-001 (image pipeline)

**Risks**:
- Adds complexity to deployment
- Mitigation: Keep static fallback, CMS is optional layer

---

### TASK-013: E-commerce Integration
**Priority**: P3-Low | **Complexity**: XL | **Estimated Effort**: 2-3 weeks

**Description**: Enable direct artwork purchases.

**Agent Assignment**: `backend-developer`, `frontend-developer`, `infosec-engineer`

**Acceptance Criteria**:
- [ ] "Buy Now" option for available artworks
- [ ] Secure checkout flow (Stripe)
- [ ] Inventory management (mark as sold automatically)
- [ ] Order confirmation and tracking
- [ ] Shipping calculation (or flat rate)
- [ ] PCI compliance
- [ ] Tax handling (basic US states)

**Technical Details**:
- Use Stripe Checkout (hosted) for minimal scope
- Alternative: Full cart with Snipcart or Shopify Buy Button
- See ADR for recommendation

**Dependencies**: TASK-012 (CMS for inventory), TASK-009 (analytics for conversion tracking)

**Risks**:
- Significant complexity increase
- Legal/tax implications
- Mitigation: Start with Stripe Checkout links, iterate to full cart

---

### TASK-014: Image CDN & Global Edge Delivery
**Priority**: P2-Medium | **Complexity**: M | **Estimated Effort**: 2-3 days

**Description**: Serve images from global CDN with on-the-fly optimization.

**Agent Assignment**: `devops-architect`

**Acceptance Criteria**:
- [ ] Images served from CDN edge locations
- [ ] On-demand format conversion (WebP, AVIF)
- [ ] Responsive sizes generated on request
- [ ] Lazy blur placeholders via CDN
- [ ] Cache hit ratio > 90%
- [ ] Cost under $20/month at current traffic

**Technical Details**:
- **Recommended**: Cloudinary (free tier: 25GB bandwidth/month)
- Alternative: Imgix, Cloudflare Images
- Alternative: Self-hosted with CloudFront + Lambda@Edge
- See ADR-003 for detailed comparison

**Dependencies**: None (can replace TASK-001 or complement it)

---

### TASK-015: Progressive Web App Enhancements
**Priority**: P3-Low | **Complexity**: M | **Estimated Effort**: 2-3 days

**Description**: Full offline experience and app-like features.

**Agent Assignment**: `frontend-developer`

**Acceptance Criteria**:
- [ ] Offline gallery with cached artworks
- [ ] Background sync for form submissions
- [ ] Push notifications for new artwork (opt-in)
- [ ] "Add to Home Screen" prompt with install metrics
- [ ] App store listing (via PWA Builder for Microsoft Store)

**Technical Details**:
- Service worker already exists (sw.js)
- Enhance caching strategy for images
- Add Web Push (Firebase or self-hosted)

**Dependencies**: TASK-001 (optimized images for caching)

---

### TASK-016: Social Media Integration
**Priority**: P2-Medium | **Complexity**: S | **Estimated Effort**: 1-2 days

**Description**: Deep integration with social platforms.

**Agent Assignment**: `frontend-developer`

**Acceptance Criteria**:
- [ ] Instagram feed widget on home page
- [ ] Pinterest "Pin It" buttons on artworks
- [ ] Twitter/X share cards with artwork preview
- [ ] Facebook Open Graph optimization
- [ ] Social proof: Recent sales/features section
- [ ] Social links in footer (already has Instagram)

**Technical Details**:
- Use Instagram Basic Display API (or embed widget)
- Leverage existing Open Graph meta tags, enhance per-artwork

**Dependencies**: TASK-007 (artwork pages for social shares)

---

### TASK-017: Multi-Language Expansion
**Priority**: P3-Low | **Complexity**: M | **Estimated Effort**: 2-3 days

**Description**: Add language variants and improve i18n.

**Agent Assignment**: `frontend-developer`, `technical-writer`

**Acceptance Criteria**:
- [ ] Add German (DE), French (FR), Spanish (ES) translations
- [ ] Language switcher shows flag icons
- [ ] hreflang tags for SEO
- [ ] RTL support ready (for future Arabic)
- [ ] Date/number formatting per locale

**Technical Details**:
- Extend translations.json structure
- Consider using Intl API for formatting
- May need professional translation services

**Dependencies**: TASK-012 (CMS for translation management)

---

### TASK-018: Accessibility Excellence (WCAG 2.1 AAA)
**Priority**: P2-Medium | **Complexity**: M | **Estimated Effort**: 3-4 days

**Description**: Achieve WCAG 2.1 AAA compliance for maximum inclusivity.

**Agent Assignment**: `frontend-developer`, `qa-automation`

**Acceptance Criteria**:
- [ ] Sign language interpretation video option
- [ ] Extended audio descriptions for visually impaired
- [ ] Timing adjustments for all animations
- [ ] Reading level analysis (Grade 9 or lower)
- [ ] Cognitive accessibility features (simplified mode)
- [ ] Third-party accessibility audit

**Technical Details**:
- Audio descriptions could be synthesized (browser TTS)
- Simplified mode removes animations, increases contrast

**Dependencies**: TASK-005 (AA compliance first)

---

### TASK-019: Artist Blog / Stories
**Priority**: P3-Low | **Complexity**: M | **Estimated Effort**: 3-5 days

**Description**: Add storytelling capability for artist to share process, inspiration.

**Agent Assignment**: `frontend-developer`, `technical-writer`

**Acceptance Criteria**:
- [ ] Blog/Stories section with list and detail views
- [ ] Rich text content with images
- [ ] Categories (Process, Inspiration, Events)
- [ ] RSS feed for subscribers
- [ ] Integration with artwork (link stories to pieces)

**Technical Details**:
- Static site generator for blog (11ty, Hugo)
- Or: CMS-driven content (see TASK-012)
- Keep minimal to not distract from artwork

**Dependencies**: TASK-012 (CMS for content management)

---

### TASK-020: Build & Deployment Pipeline
**Priority**: P1-High | **Complexity**: M | **Estimated Effort**: 2-3 days

**Description**: Automate build, optimization, and deployment.

**Agent Assignment**: `devops-architect`

**Acceptance Criteria**:
- [ ] GitHub Actions workflow for build
- [ ] CSS/JS minification and bundling
- [ ] Image optimization on commit
- [ ] HTML minification
- [ ] Lighthouse CI checks (fail if score drops)
- [ ] Preview deployments for PRs
- [ ] Auto-deploy to GitHub Pages on main

**Technical Details**:
- Use Vite or esbuild for bundling (fast)
- Sharp.js for image processing in CI
- Lighthouse CI GitHub Action

**Dependencies**: None (enhances all other tasks)

---

## Architecture Decision Records

The following ADRs provide detailed analysis for major technical decisions:

| ADR | Title | Status | Location |
|-----|-------|--------|----------|
| ADR-001 | Static vs. Dynamic Architecture | Proposed | [/docs/tasks/adrs/ADR-001-static-vs-dynamic.md] |
| ADR-002 | Headless CMS Selection | Proposed | [/docs/tasks/adrs/ADR-002-headless-cms.md] |
| ADR-003 | Image Delivery Strategy | Proposed | [/docs/tasks/adrs/ADR-003-image-delivery.md] |
| ADR-004 | Analytics Platform Selection | Proposed | [/docs/tasks/adrs/ADR-004-analytics.md] |
| ADR-005 | Performance Monitoring Strategy | Proposed | [/docs/tasks/adrs/ADR-005-performance-monitoring.md] |

---

## Risk Assessment

### High Severity Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Image optimization breaks existing links | Medium | High | Keep original paths, add optimized variants |
| CMS adds complexity artist cannot manage | Low | High | Comprehensive training, video tutorials |
| E-commerce creates legal/tax burden | Medium | High | Start with inquiry-only, consult accountant |

### Medium Severity Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Performance regression during changes | Medium | Medium | Lighthouse CI gates, staging environment |
| CDN costs exceed budget | Low | Medium | Monitor usage, set alerts, use free tiers |
| Multi-language adds maintenance burden | Medium | Medium | Start with 2 languages, expand as needed |

### Low Severity Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Virtual gallery underperforms on mobile | High | Low | Offer as optional enhancement |
| PWA install rates low | High | Low | Focus on web experience, PWA is bonus |

---

## Success Metrics & KPIs

### Performance Metrics (Core Web Vitals)

| Metric | Current (Estimated) | Phase 1 Target | Phase 3 Target |
|--------|---------------------|----------------|----------------|
| LCP (Largest Contentful Paint) | 3-5s | < 2.5s | < 1.5s |
| FID (First Input Delay) | ~50ms | < 100ms | < 50ms |
| CLS (Cumulative Layout Shift) | 0.05-0.1 | < 0.1 | < 0.05 |
| TTI (Time to Interactive) | ~3s | < 2s | < 1.5s |
| Lighthouse Performance | ~60-70 | > 85 | > 95 |

### User Engagement Metrics

| Metric | Baseline | 3-Month Target | 6-Month Target |
|--------|----------|----------------|----------------|
| Avg. Session Duration | TBD (no analytics) | 2 min | 3 min |
| Pages per Session | TBD | 3 | 4 |
| Artwork Lightbox Opens | TBD | +50% vs baseline | +100% |
| Inquiry Form Submissions | TBD | +30% | +75% |
| Return Visitors | TBD | 15% | 25% |

### Conversion Metrics

| Metric | Baseline | Target |
|--------|----------|--------|
| Gallery Visit to Inquiry Rate | TBD | 3% |
| Inquiry to Sale Rate | TBD | 20% |
| Abandoned Inquiry Rate | TBD | < 50% |

### Accessibility Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Lighthouse Accessibility | ~85 | 100 |
| axe-core Violations | TBD | 0 |
| WCAG Compliance Level | AA (partial) | AAA |

### SEO Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Google Search Impressions | TBD | +100% in 6 months |
| Rich Results Eligibility | None | Artwork, Person, Gallery |
| Core Web Vitals (CrUX) | TBD | All metrics "Good" |

---

## Agent Assignments Summary

| Agent | Tasks | Priority Focus |
|-------|-------|----------------|
| `devops-architect` | TASK-001, 009, 011, 014, 020 | Performance infrastructure |
| `frontend-developer` | TASK-002, 003, 004, 005, 006, 007, 008, 010, 015, 016, 017, 018, 019 | Features & optimization |
| `backend-developer` | TASK-012, 013 | CMS & e-commerce |
| `ui-ux-designer` | TASK-008 | Virtual gallery design |
| `qa-automation` | TASK-005, 018 | Accessibility testing |
| `infosec-engineer` | TASK-013 | E-commerce security |
| `technical-writer` | TASK-017, 019 | Content & translations |

---

## Parallel Execution Plan

### Sprint 1 (Week 1-2): Foundation
**Execute in Parallel:**
- `devops-architect`: TASK-001 (Image Pipeline)
- `frontend-developer`: TASK-002 (Fonts), TASK-003 (Critical CSS)

### Sprint 2 (Week 2-3): SEO & Performance
**Execute in Parallel:**
- `frontend-developer`: TASK-004 (Schema.org), TASK-005 (Accessibility)
- `devops-architect`: TASK-020 (Build Pipeline)

### Sprint 3 (Week 3-5): Features
**Execute in Parallel:**
- `frontend-developer`: TASK-006 (Search), TASK-007 (Artwork Pages)
- `devops-architect`: TASK-009 (Analytics), TASK-011 (Monitoring)

### Sprint 4 (Week 5-8): Enhancement
**Execute in Parallel:**
- `frontend-developer`: TASK-010 (Contact Form), TASK-016 (Social)
- `backend-developer`: TASK-012 (CMS) - optional, based on user decision

### Future Sprints: Transformational
- TASK-008 (Virtual Gallery) - only if prioritized
- TASK-013 (E-commerce) - only if artist ready
- TASK-014 (CDN) - depends on traffic growth

---

## Decisions Required from User

1. **CMS Priority**: Is content management by the artist a priority? (Affects TASK-012 timing)

2. **E-commerce Intent**: Is direct sales a goal, or remain inquiry-based? (Affects TASK-013)

3. **Virtual Gallery Interest**: Is the 3D gallery experience desired? (High effort, optional)

4. **Analytics Platform**: Preference for Plausible (paid, hosted) vs Umami (free, self-hosted)?

5. **Hosting Change**: Consider Vercel/Netlify for better features? (Currently GitHub Pages)

6. **Budget for Services**: Monthly budget for CDN, analytics, CMS hosting?

---

## Appendix: File Inventory

### Files to Create
- `/docs/tasks/adrs/ADR-001-static-vs-dynamic.md`
- `/docs/tasks/adrs/ADR-002-headless-cms.md`
- `/docs/tasks/adrs/ADR-003-image-delivery.md`
- `/docs/tasks/adrs/ADR-004-analytics.md`
- `/docs/tasks/adrs/ADR-005-performance-monitoring.md`
- `/docs/fonts/` directory (for self-hosted fonts)
- `/docs/img/optimized/` directory structure

### Files to Modify
- `/docs/js/artworks.json` - Add srcset data
- `/docs/index.html` - Critical CSS, schema.org
- `/docs/gallery.html` - Search input, schema.org
- `/docs/about.html` - Schema.org
- `/docs/contact.html` - Enhanced form, schema.org
- `/docs/css/bundle.css` - Font optimization

### Files to Review/Delete
- Duplicate CSS in gallery.html head (consolidate)
- Unused font weights

---

**Document Version**: 1.0
**Last Updated**: 2025-11-28
**Next Review**: After Phase 1 completion
