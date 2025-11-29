# Performance Optimization Task Breakdown

**Document ID:** CHAOS-PERFORMANCE-TASKS
**Epic:** Branchstone Performance & Resilience Optimization
**Priority:** CRITICAL
**Target Timeline:** 4 weeks

---

## Phase 1: Quick Wins (2 Days, 50-60% improvement expected)

### TASK-001: Optimize Hero Image (about-me.jpeg)
**Priority:** P0 - CRITICAL
**Effort:** 1 hour
**Assigned to:** frontend-developer
**Acceptance Criteria:**
- [ ] about-me.jpeg compressed from 2.6MB to <200KB
- [ ] WebP variant created (target: <120KB)
- [ ] 3 responsive variants: 600w, 1200w, 1920w
- [ ] All files uploaded to /docs/img/
- [ ] LCP improvement verified: 2.6s → <1.0s
- [ ] Mobile LCP (3G) improvement: 5.8s → <2.0s

**Implementation Steps:**
1. Download about-me.jpeg
2. Use ImageMagick or ffmpeg:
   ```bash
   # Optimize original JPEG (75% quality)
   convert about-me.jpeg -quality 75 -resize 1920x1080 about-me-1920w.jpeg
   convert about-me.jpeg -quality 75 -resize 1200x675 about-me-1200w.jpeg
   convert about-me.jpeg -quality 75 -resize 600x338 about-me-600w.jpeg

   # Generate WebP versions
   cwebp -q 70 about-me-1920w.jpeg -o about-me-1920w.webp
   cwebp -q 70 about-me-1200w.jpeg -o about-me-1200w.webp
   cwebp -q 70 about-me-600w.jpeg -o about-me-600w.webp
   ```
3. Update index.html to use picture element:
   ```html
   <picture>
     <source srcset="img/about-me-600w.webp 600w, img/about-me-1200w.webp 1200w, img/about-me-1920w.webp 1920w" type="image/webp">
     <source srcset="img/about-me-600w.jpeg 600w, img/about-me-1200w.jpeg 1200w, img/about-me-1920w.jpeg 1920w" type="image/jpeg">
     <img src="img/about-me-1920w.jpeg" alt="Viktoria Branchstone" loading="eager" sizes="100vw">
   </picture>
   ```
4. Verify file sizes and LCP timing
5. Commit changes

**Acceptance Test:**
```bash
# Before
ls -lh docs/img/about-me.jpeg    # 2.6M

# After
ls -lh docs/img/about-me-*.jpeg   # Should be <200KB each
ls -lh docs/img/about-me-*.webp   # Should be <120KB each
# Test LCP: npm run lighthouse
```

---

### TASK-002: Add HTTP Cache-Control Headers
**Priority:** P0 - CRITICAL
**Effort:** 30 minutes
**Assigned to:** devops-architect
**Acceptance Criteria:**
- [ ] Create /docs/_headers file
- [ ] Set cache policies for all asset types
- [ ] Images cached for 1 year (immutable)
- [ ] CSS/JS cached for 30 days
- [ ] HTML cached for 1 hour (revalidate)
- [ ] Verify headers with curl/DevTools
- [ ] Repeat visitor load time: 3.2s → <1.5s

**Implementation Steps:**
1. Create `/docs/_headers`:
   ```
   # Images - cache forever (fingerprinted)
   /img/*
     Cache-Control: public, max-age=31536000, immutable

   # CSS and JavaScript
   /css/*
     Cache-Control: public, max-age=2592000, must-revalidate
   /js/*
     Cache-Control: public, max-age=2592000, must-revalidate

   # HTML - short cache, revalidate
   /*
     Cache-Control: public, max-age=3600, must-revalidate

   # JSON API - no cache (always fresh)
   /js/artworks.json
     Cache-Control: public, max-age=0, must-revalidate
   /js/translations.json
     Cache-Control: public, max-age=0, must-revalidate
   ```

2. For GitHub Pages, add to repository settings or use Netlify redirects

3. Verify headers:
   ```bash
   curl -I https://branchstone.art/img/about-me.jpeg
   # Should show: Cache-Control: public, max-age=31536000, immutable
   ```

**Acceptance Test:**
```javascript
// Open DevTools, check Response Headers
// 1st visit: Time 3.2s
// 2nd visit (same session): Time <1.5s
// Clear cache, 3rd visit: Time 3.2s
```

---

### TASK-003: Pre-cache Featured Images in Service Worker
**Priority:** P0 - CRITICAL
**Effort:** 30 minutes
**Assigned to:** frontend-developer
**Acceptance Criteria:**
- [ ] Update sw.js to pre-cache hero + featured images
- [ ] Modify STATIC_ASSETS array
- [ ] Add top 5 artwork hero images
- [ ] Service Worker installs without errors
- [ ] First gallery visit: 28-35s → 12-18s (image load time)

**Implementation Steps:**
1. Update `/docs/sw.js`, expand STATIC_ASSETS:
   ```javascript
   const STATIC_ASSETS = [
     './',
     './index.html',
     './gallery.html',
     './about.html',
     './contact.html',
     './offline.html',
     './css/bundle.css',
     './js/app.js',
     './js/config.js',
     './js/i18n.js',
     './js/theme-init.js',
     './js/artworks.json',
     './js/translations.json',
     './favicon.svg',
     // Hero images
     './img/about-me-600w.webp',
     './img/about-me-1200w.webp',
     // Featured artwork thumbnails (top 5)
     './img/born_of_burn/0731A57D-AC50-4060-B496-FE85500E7A03_4_5005_c.jpeg',
     './img/by_marks_and_fire/1B2EEF46-AE1B-429D-B6B1-D78D25075FF0_1_105_c.jpeg',
     './img/christmass_joy/27B0BF96-31B8-4D64-8796-049C7323701B_4_5005_c.jpeg',
     './img/core/120EE968-E29D-4AC7-ACBD-B79E8BFF81F8_4_5005_c.jpeg',
     './img/july_pines/4194A90D-56FE-499F-AC39-8B291BDAAAD5_1_201_a.jpeg',
   ];
   ```

2. Test Service Worker installation:
   ```javascript
   // DevTools → Application → Service Workers
   // Should show: sw.js (active and running)
   ```

3. Verify pre-cached resources:
   ```javascript
   // DevTools console:
   const cache = await caches.open('branchstone-v1');
   const keys = await cache.keys();
   console.log('Pre-cached resources:', keys.length);
   ```

---

### TASK-004: Add Image 404 Error Handling
**Priority:** P1 - HIGH
**Effort:** 30 minutes
**Assigned to:** frontend-developer
**Acceptance Criteria:**
- [ ] Add onerror handler to all image elements
- [ ] Display placeholder image on 404
- [ ] Log errors to analytics
- [ ] No broken image icons visible
- [ ] User experience smooth even if image fails

**Implementation Steps:**
1. Add error handler to Gallery.js, Carousel.js, and static HTML:
   ```javascript
   // In Gallery.js renderGalleryItem()
   const img = document.createElement('img');
   img.src = artwork.image;
   img.alt = artwork.title;
   img.loading = 'lazy';

   img.onerror = () => {
     console.error(`Failed to load image: ${artwork.image}`);
     // Log to analytics
     gtag('event', 'image_load_error', {
       url: artwork.image,
       artwork: artwork.title
     });
     // Show placeholder
     img.src = 'img/placeholder.svg';
     img.alt = `Missing: ${artwork.title}`;
   };
   ```

2. Create placeholder image (`img/placeholder.svg`):
   ```xml
   <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
     <rect width="400" height="300" fill="#f0f0f0"/>
     <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">
       Image not available
     </text>
   </svg>
   ```

3. Verify error handling by inspecting images in DevTools

---

## Phase 2: Medium-Term Improvements (1 Week, 45-55% total improvement)

### TASK-005: Generate WebP for All Gallery Images
**Priority:** P0 - CRITICAL
**Effort:** 4 hours (including batch processing)
**Assigned to:** frontend-developer
**Acceptance Criteria:**
- [ ] Generate WebP for all 292 images
- [ ] WebP quality set to 75-80
- [ ] All files named consistently (*-original.webp)
- [ ] Total WebP payload <10MB
- [ ] Gallery bandwidth reduced by 25-35%
- [ ] Test in Chrome and Safari (with JPEG fallback)

**Implementation Steps:**
1. Create batch conversion script `/scripts/generate-webp.js`:
   ```bash
   #!/bin/bash
   # Install cwebp
   brew install webp

   # Batch convert all JPEGs to WebP
   find docs/img -name "*.jpeg" -type f | while read jpeg; do
     webp="${jpeg%.jpeg}.webp"
     if [ ! -f "$webp" ]; then
       echo "Converting: $jpeg"
       cwebp -q 75 "$jpeg" -o "$webp"
     fi
   done

   echo "Conversion complete"
   du -sh docs/img/
   ```

2. Run script:
   ```bash
   chmod +x scripts/generate-webp.js
   ./scripts/generate-webp.js
   ```

3. Verify conversion:
   ```bash
   find docs/img -name "*.webp" | wc -l  # Should be ~292
   du -sh docs/img/                       # Check total size
   ```

4. Update Gallery.js to prefer WebP:
   ```javascript
   // In Gallery.js, update image rendering
   const webpPath = artwork.image.replace(/\.jpeg$/, '.webp');

   return `
     <picture>
       <source srcset="${webpPath}" type="image/webp">
       <img src="${artwork.image}" alt="${artwork.title}" loading="lazy">
     </picture>
   `;
   ```

---

### TASK-006: Generate Responsive Image Variants
**Priority:** P0 - CRITICAL
**Effort:** 4 hours (including batch processing)
**Assigned to:** frontend-developer
**Acceptance Criteria:**
- [ ] Generate variants: 400w, 800w, 1200w, 1920w
- [ ] Include both JPEG and WebP variants
- [ ] Update artworks.json with srcset data
- [ ] Mobile users load 50% less bandwidth
- [ ] Test responsiveness on mobile/tablet/desktop

**Implementation Steps:**
1. Create batch resize script `/scripts/generate-responsive.js`:
   ```bash
   #!/bin/bash
   # Generate responsive variants for all images
   find docs/img -name "*-original.jpeg" -type f | while read original; do
     base="${original%-original.jpeg}"

     # JPEG variants
     convert "$original" -resize 400x "$base-400w.jpeg"
     convert "$original" -resize 800x "$base-800w.jpeg"
     convert "$original" -resize 1200x "$base-1200w.jpeg"
     convert "$original" -resize 1920x "$base-1920w.jpeg"

     # WebP variants
     cwebp -q 75 "$base-400w.jpeg" -o "$base-400w.webp"
     cwebp -q 75 "$base-800w.jpeg" -o "$base-800w.webp"
     cwebp -q 75 "$base-1200w.jpeg" -o "$base-1200w.webp"
     cwebp -q 75 "$base-1920w.jpeg" -o "$base-1920w.webp"
   done
   ```

2. Update artworks.json with srcset:
   ```json
   {
     "id": 1,
     "title": "Born of Burn",
     "image": "img/born_of_burn/0731A57D-AC50-4060-B496-FE85500E7A03_4_5005_c.jpeg",
     "srcset": {
       "webp": "img/born_of_burn/0731A57D-AC50-4060-B496-FE85500E7A03_4_5005_c-400w.webp 400w, img/born_of_burn/0731A57D-AC50-4060-B496-FE85500E7A03_4_5005_c-800w.webp 800w, img/born_of_burn/0731A57D-AC50-4060-B496-FE85500E7A03_4_5005_c-1200w.webp 1200w",
       "jpeg": "img/born_of_burn/0731A57D-AC50-4060-B496-FE85500E7A03_4_5005_c-400w.jpeg 400w, img/born_of_burn/0731A57D-AC50-4060-B496-FE85500E7A03_4_5005_c-800w.jpeg 800w, img/born_of_burn/0731A57D-AC50-4060-B496-FE85500E7A03_4_5005_c-1200w.jpeg 1200w"
     }
   }
   ```

3. Update Gallery.js to use srcset (already supports it, just verify)

---

### TASK-007: Remove Duplicate CSS and Minify
**Priority:** P1 - HIGH
**Effort:** 2 hours
**Assigned to:** frontend-developer
**Acceptance Criteria:**
- [ ] Identify and remove duplicate media queries
- [ ] Minify CSS bundle
- [ ] CSS size: 4.1KB → <2.5KB
- [ ] Gzipped CSS: 1.2KB → <0.8KB
- [ ] Extract critical CSS for above-fold
- [ ] No visual changes to site

**Implementation Steps:**
1. Audit 03-header.css for duplicate 768px queries:
   ```bash
   grep -n "@media" docs/css/03-header.css
   # Identify duplicates and consolidate
   ```

2. Set up CSS minification:
   ```bash
   npm install --save-dev cssnano postcss postcss-cli
   ```

3. Create PostCSS config (`postcss.config.js`):
   ```javascript
   module.exports = {
     plugins: [
       require('cssnano')({
         preset: ['default', {
           discardComments: {
             removeAll: true,
           },
         }]
       })
     ]
   };
   ```

4. Generate minified CSS:
   ```bash
   postcss docs/css/bundle.css > docs/css/bundle.min.css
   ```

5. Update HTML to use minified CSS:
   ```html
   <link rel="stylesheet" href="css/bundle.min.css">
   ```

6. Verify size reduction and visual appearance

---

### TASK-008: Lazy-Load Gallery on Home Page
**Priority:** P1 - HIGH
**Effort:** 2 hours
**Assigned to:** frontend-developer
**Acceptance Criteria:**
- [ ] Gallery.js loaded only when featured section visible
- [ ] Home page JS bundle reduced by 40%
- [ ] Home page LCP: 2.6s → <1.8s
- [ ] Gallery still functions on home page
- [ ] No console errors

**Implementation Steps:**
1. Update app.js to defer Gallery initialization:
   ```javascript
   async initHomePage() {
     const featuredGrid = document.getElementById('featured-artworks');
     if (!featuredGrid) return;

     // Use Intersection Observer to lazy-load Gallery only when visible
     const observer = new IntersectionObserver((entries) => {
       if (entries[0].isIntersecting) {
         // Load Gallery only when section becomes visible
         import('./components/Gallery.js').then(module => {
           const Gallery = module.default;
           const gallery = new Gallery(featuredGrid);
           gallery.renderFeaturedGallery();
         });
         observer.unobserve(featuredGrid);
       }
     }, { rootMargin: '100px' });

     observer.observe(featuredGrid);
   }
   ```

2. Test on home page - gallery should load when scrolling down

3. Verify performance:
   ```bash
   npm run lighthouse -- --url https://branchstone.art/index.html
   # LCP should improve significantly
   ```

---

## Phase 3: Strategic Improvements (2-3 Weeks, 55-70% total improvement)

### TASK-009: Implement Lighthouse CI
**Priority:** P1 - HIGH
**Effort:** 4 hours
**Assigned to:** devops-architect
**Acceptance Criteria:**
- [ ] Create lighthouserc.json with performance budgets
- [ ] Create GitHub Actions workflow
- [ ] Run on every pull request
- [ ] Block merges if performance degrades >5%
- [ ] Display scores in PR comments

**Implementation Steps:**
1. Create `lighthouserc.json` (see CHAOS-LOAD-TESTING.md)

2. Create `.github/workflows/lighthouse-ci.yml` (see CHAOS-LOAD-TESTING.md)

3. Set up Lighthouse CI:
   ```bash
   npm install -g @lhci/cli@0.11.x
   lhci wizard
   ```

4. Test locally:
   ```bash
   lhci autorun
   ```

5. Push workflow to GitHub

---

### TASK-010: Implement Connection-Aware Loading
**Priority:** P2 - MEDIUM
**Effort:** 3 hours
**Assigned to:** frontend-developer
**Acceptance Criteria:**
- [ ] Detect network connection type (4G/3G/2G)
- [ ] Load WebP on 4G, JPEG on 2G/3G
- [ ] Defer non-critical images on slow networks
- [ ] Show connection indicator in UI
- [ ] No impact on fast networks

**Implementation Steps:**
1. Create utility module (`js/utils/network.js`):
   ```javascript
   export function getNetworkInfo() {
     const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

     if (!conn) return { type: 'unknown', effectiveType: '4g' };

     return {
       type: conn.type,
       effectiveType: conn.effectiveType,
       downlink: conn.downlink,
       rtt: conn.rtt,
       saveData: navigator.connection?.saveData || false
     };
   }

   export function isSlowNetwork() {
     const info = getNetworkInfo();
     return ['slow-2g', '2g', '3g'].includes(info.effectiveType) ||
            info.saveData;
   }
   ```

2. Update Gallery.js to use network info:
   ```javascript
   import { isSlowNetwork } from '../utils/network.js';

   renderImage(artwork) {
     const slow = isSlowNetwork();
     const format = slow ? 'jpeg' : 'webp';
     const srcset = artwork.srcset[format];
     // Use srcset based on network speed
   }
   ```

---

### TASK-011: Code Splitting & Dynamic Imports
**Priority:** P2 - MEDIUM
**Effort:** 5 hours
**Assigned to:** frontend-developer
**Acceptance Criteria:**
- [ ] Core bundle: <50KB gzipped
- [ ] Gallery bundle: 45KB gzipped
- [ ] Page bundles: 20-30KB each
- [ ] Dynamic imports working on all pages
- [ ] No performance regression

**Implementation Steps:**
1. Refactor app.js to use dynamic imports:
   ```javascript
   async initHomePage() {
     // Load Gallery only on home page
     if (path.endsWith('index.html') || path.endsWith('/')) {
       const { default: Gallery } = await import('./components/Gallery.js');
       const { default: Carousel } = await import('./components/Carousel.js');
       // Initialize components
     }
   }
   ```

2. Create separate bundles for each page

3. Update service worker to cache separate bundles

4. Test with Lighthouse to verify improvements

---

### TASK-012: Set Up Performance Analytics
**Priority:** P2 - MEDIUM
**Effort:** 4 hours
**Assigned to:** frontend-developer
**Acceptance Criteria:**
- [ ] Google Analytics 4 configured
- [ ] Web Vitals metrics tracked
- [ ] Error tracking with Sentry
- [ ] Performance dashboard created
- [ ] Alerts configured for regressions

**Implementation Steps:**
1. Add Google Analytics to index.html:
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=GA_ID"></script>
   <script>
     window.dataLayer = window.dataLayer || [];
     function gtag(){dataLayer.push(arguments);}
     gtag('js', new Date());
     gtag('config', 'GA_ID');
   </script>
   ```

2. Add Web Vitals tracking:
   ```javascript
   import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

   getCLS(metric => gtag('event', 'cls', { value: metric.value }));
   getFID(metric => gtag('event', 'fid', { value: metric.value }));
   getLCP(metric => gtag('event', 'lcp', { value: metric.value }));
   ```

3. Integrate Sentry:
   ```bash
   npm install @sentry/browser
   ```

4. Create Analytics dashboard in GA4

---

## Phase 4: Nice-to-Have Improvements (Optional)

### TASK-013: Image CDN Integration
**Priority:** P3 - LOW (optional enhancement)
**Effort:** 8 hours (including testing)
**Assigned to:** devops-architect
**Recommendations:** Cloudinary, Imgix, or AWS CloudFront

**Benefits:**
- Automatic format selection (WebP, AVIF)
- On-the-fly responsive images
- Geographic distribution
- Analytics

---

### TASK-014: Implement AVIF Support
**Priority:** P3 - LOW (nice-to-have)
**Effort:** 3 hours
**Assigned to:** frontend-developer
**Expected Savings:** Additional 15-20% compression over WebP

---

## Phase 5: Monitoring & Maintenance

### TASK-015: Create Performance Dashboard
**Priority:** P2 - MEDIUM
**Effort:** 2 hours
**Assigned to:** devops-architect
**Contents:**
- Core Web Vitals (LCP, FID, CLS) trends
- Real User Monitoring (RUM) data
- Error rate tracking
- Network performance by region
- Device/browser breakdown

---

### TASK-016: Set Up Performance Regression Alerts
**Priority:** P1 - HIGH
**Effort:** 1 hour
**Assigned to:** devops-architect
**Alerts to Configure:**
- LCP > 2.5s (warning), > 3.0s (critical)
- CLS > 0.1 (warning), > 0.15 (critical)
- Error rate > 5% (warning), > 10% (critical)
- Memory usage > 200MB (warning)

---

## Success Metrics & Verification

### Key Metrics to Track

| Metric | Current | Target | Task | Verification |
|--------|---------|--------|------|--------------|
| Home LCP | 2.6s | 0.7s | 1,2,6,8 | Lighthouse |
| Gallery LCP | 3.8s | 0.9s | 2,5,8,11 | Lighthouse |
| Image Size | 2.6MB | 180KB | 1,5 | ls -lh |
| Total Bytes | 37MB | 12-15MB | 1,5,6 | du -sh |
| JS Bundle | 172KB | 50KB | 11 | bundlesize |
| CSS Bundle | 1.2KB gzipped | 0.7KB | 7 | gzip -c |
| Mobile 3G LCP | 5.8s | <1.5s | 1,2,5,6 | DevTools |
| Repeat Visit | 3.2s | <0.5s | 2 | Chrome cache |
| Cache Hit Rate | 0% | >75% | 2,3 | Analytics |

---

## Deployment & Rollout Plan

### Phase 1 (Week 1) - Quick Wins
1. Deploy hero image optimization → measure LCP
2. Add cache headers → measure repeat visits
3. Pre-cache images → measure gallery load
4. Add error handling → verify stability

### Phase 2 (Week 2) - Medium-Term
1. Deploy WebP for all images → measure bandwidth
2. Deploy responsive variants → measure mobile experience
3. Deploy CSS minification → measure FCP
4. Deploy lazy-loaded Gallery → measure home page LCP
5. Deploy Lighthouse CI → prevent regressions

### Phase 3 (Week 3-4) - Strategic
1. Deploy connection-aware loading → optimize for network
2. Deploy code splitting → reduce initial JS
3. Deploy analytics → monitor real users
4. Deploy Sentry → track errors

---

## Rollback Plan

Each task includes rollback steps:
1. Keep previous versions in git history
2. Use feature flags for major changes
3. Monitor metrics after each deployment
4. Revert if metrics regress >5%

---

## Task Dependencies

```
TASK-001 (Image optimization) [independent]
TASK-002 (Cache headers)       [independent]
TASK-003 (Pre-cache images)    [depends on TASK-001]
TASK-004 (Error handling)      [independent]
────────────────────────────────────────────
TASK-005 (WebP generation)     [depends on TASK-001]
TASK-006 (Responsive variants) [depends on TASK-005]
TASK-007 (CSS minification)    [independent]
TASK-008 (Lazy load Gallery)   [depends on TASK-007]
────────────────────────────────────────────
TASK-009 (Lighthouse CI)       [independent]
TASK-010 (Network awareness)   [independent]
TASK-011 (Code splitting)      [depends on TASK-008]
TASK-012 (Analytics)           [independent]
```

---

## Git Commit Pattern

After each task completion:
```bash
# TASK-001
git add docs/img/about-me-*.{jpeg,webp} index.html
git commit -m "perf: optimize hero image 2.6MB → 180KB with responsive variants

Reduces home page LCP by 69% (2.6s → 0.8s)
- Compress JPEG to 75% quality
- Generate WebP variant (31% smaller)
- Create responsive 600w/1200w/1920w variants
- Update index.html with picture element

Fixes: LCP > 2.5s on home page"

# TASK-002
git add docs/_headers
git commit -m "perf: add cache-control headers for assets

Improves repeat visit performance by 56% (3.2s → 1.4s)
- Images: 1 year cache (immutable)
- CSS/JS: 30 days cache
- HTML: 1 hour cache (revalidate)
- JSON: No cache (always fresh)"

# Continue for all tasks...
```

---

## Timeline Estimate

| Phase | Tasks | Duration | Effort | Resources |
|-------|-------|----------|--------|-----------|
| 1 | 001-004 | 2 days | 2-3 hours | 1 frontend-dev, 1 devops |
| 2 | 005-008 | 1 week | 12-14 hours | 2 frontend-devs |
| 3 | 009-012 | 2 weeks | 16-18 hours | 1 frontend-dev, 1 devops |
| 4 | 013-014 | Optional | 10-12 hours | 1 devops |
| 5 | 015-016 | Ongoing | 2-3 hours | 1 devops |
| **Total** | **16 tasks** | **4-5 weeks** | **40-50 hours** | **2-3 people** |

---

## Success Criteria (Go/No-Go)

### Phase 1 - Go If:
- [ ] Hero image LCP: 2.6s → <1.0s (39% improvement minimum)
- [ ] Repeat visit load: 3.2s → <1.5s (53% improvement minimum)
- [ ] No console errors or broken images
- [ ] All files committed to git

### Phase 2 - Go If:
- [ ] Gallery bandwidth: 30% reduction verified
- [ ] Mobile LCP (3G): 5.8s → <2.0s (66% improvement)
- [ ] Lighthouse score: >80 (performance)
- [ ] Lighthouse CI passing on all PRs

### Phase 3 - Go If:
- [ ] Home page JS bundle: <50KB gzipped
- [ ] Lighthouse score: >90 (performance)
- [ ] Web Vitals: All green (LCP <2s, FID <100ms, CLS <0.1)
- [ ] Analytics dashboard active with real data

---

**Document Owner:** Chaos Engineer
**Last Updated:** 2025-11-28
**Next Review:** After Phase 1 completion (2025-11-30)
