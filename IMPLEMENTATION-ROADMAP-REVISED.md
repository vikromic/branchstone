# Branchstone Portfolio: Revised Implementation Roadmap

**Updated:** 2024-11-28
**Context:** No e-commerce (visa restrictions), GitHub Pages hosting, focused feature improvements

---

## Key Constraints & Decisions

✅ **Confirmed Approach:**
- Stay on GitHub Pages (no Vercel/Netlify migration)
- No e-commerce features (no cart, payments, Stripe)
- Focus on portfolio showcase + inquiry-based contact
- Static site with enhanced features

❌ **Removed from Scope:**
- Shopping cart & checkout
- Payment processing (Stripe)
- Order management system
- Full backend infrastructure
- User accounts

---

## Consolidated Task List

Combining **your specific requirements** + **technical improvements** from agent reviews:

### **Your Requested Features**

#### **INDEX / HOME**
- [ ] Keep featured artwork with manual sliding
- [ ] Display 3 items per row
- [ ] Implement infinite (endless) carousel
- [ ] Add logo to header
- [ ] Add subtle zoomed logo texture/noise background

#### **GALLERY**
- [ ] Fix artwork overlap in desktop grid
- [ ] Remove existing subcategories
- [ ] Add filters: Available, Small items, Prints only
- [ ] Add "Back to top" button (mobile scroll)
- [ ] Show "Sold Out" on unavailable pieces
- [ ] Add price row under description in details
- [ ] Add "Prints available" indicator
- [ ] Hide prints section if not available
- [ ] Add notes:
  - "Email me to see a mockup of this painting on your wall."
  - "Please note that colours may vary slightly on different screens."
- [ ] Optimize image sizes (uniform slideshow images)
- [ ] Add short videos to piece carousel
- [ ] Confirm video format requirements

#### **ABOUT**
- [ ] Add "Gallery Experience & Media" section
- [ ] Carousel format: Image + Caption (Place – Exhibition – Date)
- [ ] Style as customer feedback/press section

#### **COMMISSIONS (New Page)**
- [ ] Create Commissions page
- [ ] Describe collaborative creative process
- [ ] Explain client participation (colors, materials, emotional direction)

#### **GENERAL**
- [ ] Add mailing/shipping/prints information section (visible)
- [ ] Logo in main header

#### **FOOTER**
- [ ] Add email address under Instagram link

---

### **Critical Technical Improvements (from Agent Reviews)**

#### **Security (CRITICAL - Do First)**
- [ ] **P0:** Fix XSS vulnerability in i18n.js (1 hour, CRITICAL)
- [ ] **P0:** Add CSP headers (2 hours)
- [ ] **P1:** Add security headers (X-Frame-Options, etc.) (1 hour)
- [ ] **P1:** Add SRI hashes for CDN resources (1 hour)
- [ ] **P1:** Obfuscate email addresses (30 min)
- [ ] **P2:** Create Privacy Policy (2 hours)

#### **Performance (High Impact)**
- [ ] **P0:** Optimize hero image 2.6MB→96KB (1 hour, 69% LCP improvement)
- [ ] **P0:** Add Cache-Control headers (30 min, 56% faster repeats)
- [ ] **P0:** Pre-cache critical images in Service Worker (30 min)
- [ ] **P1:** Generate WebP variants for all images (2 hours, 50% smaller)
- [ ] **P1:** Implement responsive srcset for all images (1 day, 40% bandwidth)
- [ ] **P2:** Setup Lighthouse CI in GitHub Actions (2 hours)
- [ ] **P2:** Lazy load below-fold content (1 day)

#### **Infrastructure (GitHub Pages Compatible)**
- [ ] **P1:** Setup Cloudinary CDN (free tier, 2 hours)
- [ ] **P1:** Setup Sentry error tracking (free tier, 2 hours)
- [ ] **P1:** Setup Plausible analytics (privacy-first, 2 hours)
- [ ] **P2:** GitHub Actions CI/CD (automated deployments, 1 day)
- [ ] **P2:** Lighthouse CI (performance budgets, 2 hours)

#### **Testing & Quality**
- [ ] **P1:** Setup test infrastructure (Vitest + Playwright, 1 day)
- [ ] **P1:** Write DOM utilities tests (1 day)
- [ ] **P1:** Write Gallery component tests (2 days)
- [ ] **P2:** Write E2E tests for gallery flow (2 days)
- [ ] **P2:** Add accessibility tests (1.5 days)

#### **Code Quality**
- [ ] **P2:** TypeScript migration (1 week, optional but recommended)
- [ ] **P2:** Setup Vite build tooling (2 days, optional)
- [ ] **P3:** Add Storybook component library (2 days, optional)

---

## Prioritized Implementation Plan

### **Phase 1: Critical Fixes & Security (Week 1)**
**Goal:** Fix security vulnerabilities, basic performance wins

**Effort:** 2-3 days

| Task | Priority | Effort | Impact |
|------|----------|--------|--------|
| Fix i18n XSS vulnerability | P0 | 1 hour | CRITICAL security |
| Optimize hero image | P0 | 1 hour | 69% LCP improvement |
| Add Cache-Control headers | P0 | 30 min | 56% faster repeats |
| Add CSP headers | P0 | 2 hours | XSS protection |
| Add security headers | P1 | 1 hour | Clickjacking protection |
| Obfuscate email | P1 | 30 min | Bot protection |
| Setup Cloudinary CDN | P1 | 2 hours | Image optimization |

**Outcome:** Zero critical security issues, 50-60% performance improvement

---

### **Phase 2: Gallery Improvements (Week 2-3)**
**Goal:** Implement your gallery feature requests

**Effort:** 1.5-2 weeks

| Task | Effort | Notes |
|------|--------|-------|
| Fix desktop grid overlap | 2 hours | CSS grid adjustments |
| Remove subcategories | 1 hour | Update GalleryFilter component |
| Add new filters (Available, Small, Prints) | 3 hours | Extend filter logic |
| Add "Back to top" button (mobile) | 2 hours | New ScrollToTop component |
| Show "Sold Out" badges | 2 hours | Update artwork data model |
| Add price row in details | 2 hours | Update Lightbox component |
| Add "Prints available" indicator | 2 hours | Conditional rendering |
| Add email mockup note | 1 hour | Update Lightbox template |
| Add color variance note | 1 hour | Update Lightbox template |
| Optimize slideshow images (uniform size) | 1 day | Sharp image processing |
| Add video support to carousel | 1 day | HTML5 video player |
| Generate WebP variants | 2 hours | Sharp automation |
| Implement responsive srcset | 1 day | Update Gallery rendering |

**Outcome:** Gallery with all requested features, optimized images, video support

---

### **Phase 3: Homepage & Navigation (Week 4)**
**Goal:** Homepage carousel, logo, background texture

**Effort:** 1 week

| Task | Effort | Notes |
|------|--------|-------|
| 3 items per row carousel | 1 day | Update Carousel component |
| Infinite carousel loop | 1 day | Carousel logic enhancement |
| Add logo to header | 2 hours | Update header HTML/CSS |
| Add logo background texture | 3 hours | CSS background, subtle noise |
| Manual slide controls | 2 hours | Carousel UX improvement |

**Outcome:** Enhanced homepage with infinite carousel, branded header

---

### **Phase 4: Content Pages (Week 5)**
**Goal:** About page updates, Commissions page, Footer

**Effort:** 1 week

| Task | Effort | Notes |
|------|--------|-------|
| "Gallery Experience & Media" section | 1 day | Carousel component reuse |
| Press/feedback carousel | 1 day | Image + caption data structure |
| Create Commissions page | 2 days | New page + content |
| Commissions content writing | 1 day | Description of process |
| Mailing/shipping/prints section | 1 day | Info page or modal |
| Add email to footer | 30 min | Update footer HTML |

**Outcome:** Complete About page, new Commissions page, clear shipping info

---

### **Phase 5: Testing & Monitoring (Week 6)**
**Goal:** Quality assurance, monitoring setup

**Effort:** 1 week

| Task | Effort | Notes |
|------|--------|-------|
| Setup Sentry error tracking | 2 hours | GitHub Pages compatible |
| Setup Plausible analytics | 2 hours | Privacy-first, GDPR compliant |
| Test infrastructure (Vitest + Playwright) | 1 day | Foundation for quality |
| Write Gallery tests | 2 days | Component + integration tests |
| E2E gallery flow test | 1 day | User journey testing |
| Privacy Policy creation | 2 hours | GDPR compliance |

**Outcome:** Full observability, test coverage for critical components

---

### **Phase 6: Polish & Launch (Week 7)**
**Goal:** Final optimizations, comprehensive testing, deployment

**Effort:** 1 week

| Task | Effort | Notes |
|------|--------|-------|
| Lighthouse CI setup | 2 hours | Performance budgets |
| Cross-browser testing | 1 day | Chrome, Firefox, Safari, Edge |
| Mobile device testing | 1 day | iOS, Android |
| Accessibility audit | 1 day | WCAG 2.1 AA/AAA |
| Final performance optimization | 1 day | Lazy loading, code splitting |
| Production deployment | 1 day | GitHub Pages deployment |
| Post-launch monitoring | Ongoing | Sentry + Plausible review |

**Outcome:** Production-ready, world-class portfolio

---

## Updated Budget & Timeline

### **Timeline: 7 Weeks Total**

```
Week 1: Security & Critical Performance ✅
Week 2-3: Gallery Improvements ✅
Week 4: Homepage & Navigation ✅
Week 5: Content Pages ✅
Week 6: Testing & Monitoring ✅
Week 7: Polish & Launch ✅
```

### **Monthly Recurring Costs (GitHub Pages Compatible)**

| Service | Cost | Notes |
|---------|------|-------|
| GitHub Pages | FREE | Current hosting |
| Cloudinary CDN (Free tier) | FREE | 25GB bandwidth/month |
| Sentry (Free tier) | FREE | 5K events/month |
| Plausible Analytics | $9/mo | Privacy-first analytics |
| **Total** | **$9/mo** | Minimal ongoing cost |

**Optional Upgrades:**
- Cloudinary paid tier: $30/mo (if exceeding free tier)
- Sentry paid tier: $20/mo (if more error tracking needed)

### **Development Effort**

| Phase | Duration | Hours | Cost @ $75/hr |
|-------|----------|-------|---------------|
| Phase 1: Security & Perf | 1 week | 20 hrs | $1,500 |
| Phase 2: Gallery | 2 weeks | 60 hrs | $4,500 |
| Phase 3: Homepage | 1 week | 30 hrs | $2,250 |
| Phase 4: Content | 1 week | 30 hrs | $2,250 |
| Phase 5: Testing | 1 week | 30 hrs | $2,250 |
| Phase 6: Polish | 1 week | 30 hrs | $2,250 |
| **Total** | **7 weeks** | **200 hrs** | **$15,000** |

**Alternatives:**
- **Minimal approach:** Just Phase 1-4 (5 weeks, 140 hrs, $10,500)
- **DIY approach:** Follow task list yourself (free, longer timeline)

---

## Video Format Confirmation Needed

For adding videos to piece carousel, please confirm:

**Questions:**
1. **Format:** MP4 (H.264)? WebM? Both for browser compatibility?
2. **Max duration:** How long are videos? (recommend <30 seconds)
3. **Max file size:** Target < 5MB per video for mobile performance?
4. **Autoplay:** Should videos autoplay (muted) or play on user interaction?
5. **Controls:** Show video controls or just play/pause on click?
6. **Fallback:** What if video doesn't load? Show thumbnail image?

**Recommended approach:**
- **Format:** MP4 (H.264) primary + WebM fallback
- **Max duration:** 15-30 seconds
- **Max size:** 3-5MB (optimize in post-production)
- **Autoplay:** Muted autoplay on desktop, click-to-play on mobile
- **Controls:** Minimal controls (play/pause on click)
- **Fallback:** Poster image (first frame or custom thumbnail)

---

## Data Model Updates Needed

For new features, we need to update `artworks.json` with additional fields:

```json
{
  "id": 1,
  "title": "Born of Burn",
  "size": "24x36 in",
  "materials": "Mixed media on canvas",
  "price": "$2,500",              // NEW: Add price
  "available": true,               // Existing field
  "soldOut": false,               // NEW: Explicit sold out flag
  "printsAvailable": true,        // NEW: Prints availability
  "category": "fire",
  "filterTags": ["small"],        // NEW: For "Small items" filter
  "image": "img/born_of_burn/main.jpeg",
  "images": [...],
  "videos": [                     // NEW: Video support
    {
      "src": "img/born_of_burn/process.mp4",
      "poster": "img/born_of_burn/process-poster.jpeg",
      "type": "video/mp4"
    }
  ],
  "description": "..."
}
```

**Required actions:**
1. Add `price` field to all artworks
2. Add `soldOut` boolean
3. Add `printsAvailable` boolean
4. Add `filterTags` array for filtering
5. Add `videos` array (optional, for pieces with videos)

---

## Immediate Next Steps (This Week)

### **Day 1-2: Security Fixes (CRITICAL)**

**File:** `/docs/js/i18n.js`

**Current code (VULNERABLE):**
```javascript
// Line 71, 91 - VULNERABLE to XSS
element.innerHTML = translation;
```

**Fixed code:**
```javascript
// Safe approach - use textContent
element.textContent = translation;

// OR if HTML needed in specific cases, sanitize:
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(translation);
```

**Action:** Replace all `innerHTML` with `textContent` in i18n.js (1 hour)

---

**File:** All HTML files (index.html, gallery.html, about.html, contact.html)

**Add to `<head>` section:**
```html
<!-- Content Security Policy -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self';
">

<!-- Security Headers -->
<meta http-equiv="X-Frame-Options" content="SAMEORIGIN">
<meta http-equiv="X-Content-Type-Options" content="nosniff">
<meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
```

**Action:** Add security headers to all HTML pages (2 hours)

---

### **Day 3: Performance Quick Wins**

**Optimize hero image:**
```bash
# Run Sharp image optimization
cd scripts
node optimize-images.js --input ../docs/img/artist.jpeg --output ../docs/img/artist-optimized/
```

**Add Cache-Control headers:**

**File:** Create `.htaccess` or use GitHub Pages cache settings

```apache
# Note: GitHub Pages has default caching
# For custom domain with Cloudflare, add cache rules
```

**For GitHub Pages:** Cloudinary CDN will handle caching

---

**Setup Cloudinary:**

1. Sign up: https://cloudinary.com/users/register/free
2. Get cloud name, API key
3. Update image URLs in artworks.json:

```json
// Before
"image": "img/born_of_burn/main.jpeg"

// After (Cloudinary CDN)
"image": "https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/f_auto,q_auto,w_800/branchstone/born_of_burn/main.jpeg"
```

**Benefits:**
- Auto WebP/AVIF conversion
- Responsive image variants
- Global CDN (fast worldwide)
- Free tier: 25GB bandwidth/month

---

### **Day 4-5: Update artworks.json**

Add new fields to all 13 artworks:

```json
{
  "id": 1,
  "title": "Born of Burn",
  "price": "$2,500",
  "soldOut": false,
  "printsAvailable": true,
  "filterTags": ["available"],
  // ... existing fields
}
```

**Action:** Update data model (3-4 hours)

---

## Success Metrics

### **Week 1 Targets (Security & Performance)**
- ✅ Zero critical security vulnerabilities
- ✅ LCP < 2.0s (currently 2.6s)
- ✅ All images on CDN
- ✅ Security headers present

### **Week 3 Targets (Gallery Complete)**
- ✅ All gallery features implemented
- ✅ New filters working
- ✅ Videos playing in carousel
- ✅ Mobile "Back to top" button
- ✅ Uniform slideshow images

### **Week 5 Targets (Content Complete)**
- ✅ Commissions page live
- ✅ About page with press carousel
- ✅ Shipping info visible
- ✅ Logo in header + background

### **Week 7 Targets (Launch)**
- ✅ Lighthouse score > 90
- ✅ Zero accessibility violations
- ✅ Test coverage > 60%
- ✅ Cross-browser tested
- ✅ Production deployed

---

## Questions for You

Before we start implementation:

1. **Video format confirmation** - See section above
2. **Price display** - Show prices publicly or "Contact for pricing"?
3. **Commissions page content** - Do you have text ready or need help writing?
4. **Press/exhibitions** - Do you have images + captions for "Gallery Experience & Media" section?
5. **Logo** - Do you have logo files ready (SVG preferred)?
6. **Email** - Which email to display in footer?
7. **Shipping info** - Do you have shipping policy text ready?

---

## Ready to Start?

**Recommended approach:**

**Option A: Start immediately with Quick Wins (This Week)**
- Day 1-2: Security fixes (i18n XSS, CSP headers)
- Day 3: Performance (hero image, Cloudinary)
- Day 4-5: Update artworks.json with new fields

**Option B: Plan & Prepare (This Week)**
- Gather all content (prices, videos, logo, text)
- Review and approve detailed task list
- Setup development environment
- Start Week 1 tasks next week

**Which approach do you prefer?**

I'm ready to start implementation immediately. Just let me know:
1. Any clarifications needed?
2. Which option (A or B)?
3. Answers to the questions above?

Then we can dive in! 🚀
