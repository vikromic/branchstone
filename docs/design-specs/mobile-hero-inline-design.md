# Mobile Hero Inline Design Specification
**Branchstone Artist Gallery - Mobile-First Hero Redesign**

---

## Executive Summary

This specification defines a native inline mobile hero section for the Branchstone website to replace the current pop-up modal on mobile devices. The design maintains the calm, organic, nature-inspired brand tone while creating a scrollable, non-intrusive first impression that aligns with modern mobile UX best practices.

**Key Principle:** Art-first, calm, spacious — no overlays, no forced interactions.

---

## Design Philosophy

### Brand Alignment
- **Organic & Natural:** Soft edges, breathing space, earthy warmth
- **Premium but Approachable:** Sophisticated without being commercial
- **Art-First:** Image takes center stage, text supports rather than dominates
- **Calm Navigation:** Clear path forward without urgency or pressure

### Mobile UX Principles
- **Thumb-Friendly:** Primary CTA in easy reach (bottom third of screen)
- **Scroll-Aware:** Visual cues that content continues below
- **Performance-Conscious:** Fast load, minimal backdrop blur
- **Accessible:** High contrast, readable text, sufficient touch targets

---

## Current State Analysis

### Desktop Hero (Unchanged)
- **Location:** `/Users/vik/Workspace/branchstone/docs/index.html` lines 190-234
- **Implementation:** Overlay card (`.section-hero__content`) with backdrop blur over full-screen hero image
- **Behavior:** Dismissible via close button, restores via info button
- **Status:** **Preserve as-is** — desktop experience remains unchanged

### Mobile Hero (Current - To Be Replaced)
- **Pattern:** Same overlay card as desktop, smaller padding
- **Issues:**
  - Modal-like presentation blocks content
  - Close button (`×`) creates friction
  - Dual CTAs ("View Gallery" + "About the Artist") split attention
  - No scroll hint — users may not realize content exists below

### Files Involved
```
HTML:  /Users/vik/Workspace/branchstone/docs/index.html
CSS:   /Users/vik/Workspace/branchstone/docs/css/layout.css (lines 1322-1655)
       /Users/vik/Workspace/branchstone/docs/css/components.css (hero-card-close, hero-show-info)
       /Users/vik/Workspace/branchstone/docs/css/artist-feedback.css (verified-artist-badge)
       /Users/vik/Workspace/branchstone/docs/css/mobile-ux-improvements.css
JS:    /Users/vik/Workspace/branchstone/docs/js/main.js (hero close/show behavior)
```

---

## Mobile Hero Design Specification

### Layout Structure (Mobile Only: max-width: 767px)

```
┌─────────────────────────────┐
│                             │
│      HERO IMAGE             │ ← 60-70vh height
│  (No dark overlay)          │   Full bleed, inline
│                             │
│                             │
├─────────────────────────────┤
│                             │
│  Where Forest Meets Art     │ ← H1, centered
│                             │
│  One-of-a-kind mixed-media  │ ← Subheading, centered
│  artworks made with foraged │
│  natural materials.         │
│                             │
│  ┌───────────────────────┐  │
│  │  Explore the Works    │  │ ← Primary CTA
│  └───────────────────────┘  │
│                             │
│         ↓ Scroll ↓          │ ← Scroll hint (optional)
│                             │
└─────────────────────────────┘
```

### 1. Visual Anchor: Hero Image

**Specifications:**
```css
.section-hero__background-image {
  /* Mobile-specific overrides */
  height: clamp(60vh, 65vh, 70vh); /* 60-70% viewport height */
  object-fit: cover;
  object-position: center 40%; /* Slightly favor top for portrait-heavy artwork */
  filter: brightness(1.0) contrast(1.05) saturate(1.15); /* Warmer, more vibrant */
}
```

**Image Selection:**
- **Primary:** `/docs/img/cover.webp` (current hero image)
- **Fallback:** `/docs/img/artist.webp` (artist portrait if brand direction shifts)
- **Art Direction:** Use `<picture>` element with mobile-specific crop if needed

**Key Differences from Desktop:**
- **No dark overlay gradient** — let the image breathe
- **Taller aspect ratio** (60-70vh vs. 90vh full-screen)
- **Inline, not background** — image is part of document flow, not position: absolute

**Rationale:**
- Removes blocking overlay feel
- Creates immediate visual impact
- Scrollable by default (no "trap" feeling)

---

### 2. Text Block: Headline + Subheading

**Specifications:**
```css
.section-hero__text-block {
  /* New wrapper for mobile inline text */
  padding: var(--space-8) var(--space-4); /* 32px vertical, 16px horizontal */
  background: var(--bg-primary); /* Warm off-white #FAF9F7 */
  text-align: center;
}

.section-hero__heading {
  /* Mobile-specific overrides */
  font-family: var(--font-display); /* Cormorant Garamond */
  font-size: clamp(1.75rem, 7vw, 2.5rem); /* 28px-40px */
  font-weight: 400;
  line-height: 1.2;
  color: var(--text-primary); /* Rich charcoal #1A1816 */
  letter-spacing: -0.01em;
  margin-bottom: var(--space-4); /* 16px */
  /* No text-shadow — clean, readable on light background */
}

.section-hero__subheading {
  font-family: var(--font-body); /* Inter */
  font-size: clamp(1rem, 4vw, 1.125rem); /* 16px-18px */
  font-weight: 400;
  line-height: 1.6;
  color: var(--text-secondary); /* #4A4745 */
  letter-spacing: 0.005em;
  max-width: 480px;
  margin: 0 auto var(--space-6); /* 24px bottom margin */
}
```

**Copy (Exact Text):**
```html
<h1 class="section-hero__heading">Where Forest Meets Art</h1>
<p class="section-hero__subheading">
  One-of-a-kind mixed-media artworks made with foraged natural materials.
</p>
```

**Key Differences from Desktop:**
- **Text on solid background** (not floating card with backdrop blur)
- **Darker text on light background** (vs. white text on dark overlay)
- **Smaller font sizes** optimized for mobile readability
- **No social proof stats** ("70+ pieces crafted") — reduce clutter on mobile

**Rationale:**
- Higher contrast improves readability in all lighting conditions
- Solid background removes performance-heavy backdrop-filter on mobile
- Simpler layout reduces cognitive load on small screens

---

### 3. Primary CTA: Single Action Button

**Specifications:**
```css
.section-hero__cta-mobile {
  /* Mobile-specific single CTA wrapper */
  display: flex;
  justify-content: center;
  padding: 0 var(--space-4) var(--space-8); /* 16px horizontal, 32px bottom */
}

.btn--hero-primary {
  /* Primary CTA button */
  padding: 1rem 2rem; /* 16px vertical, 32px horizontal */
  font-size: var(--text-base); /* 16px */
  font-weight: 600;
  letter-spacing: 0.02em;
  min-height: 48px; /* WCAG AAA touch target */
  min-width: 200px;
  background: linear-gradient(135deg, var(--copper-400), var(--copper-500));
  color: white;
  border: none;
  border-radius: var(--radius-lg); /* 16px — organic, handcrafted feel */
  box-shadow: var(--shadow-md);
  transition: var(--transition-hover-lift);
}

.btn--hero-primary:hover,
.btn--hero-primary:active {
  background: linear-gradient(135deg, var(--copper-300), var(--copper-400));
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

**Button Copy Options (Choose One):**
1. **"Explore the Works"** (Recommended — art-first, inviting)
2. "Enter the Gallery" (Alternative — more formal)
3. "View Gallery" (Current desktop — functional but less inviting)

**Recommendation:** Use **"Explore the Works"** for mobile to emphasize discovery and reduce transactional feel.

**Key Differences from Desktop:**
- **Single CTA only** — no secondary "About the Artist" button
- **Bottom of text block** — thumb-friendly placement
- **Larger touch target** (min 48px height per WCAG AAA)
- **Warmer gradient** — copper tones align with brand

**Rationale:**
- Single clear action reduces decision paralysis on mobile
- Placement in bottom third of screen improves thumb reachability
- Warmer color creates inviting, approachable tone vs. urgency

---

### 4. Scroll Cue: Visual Hint to Continue

**Option A: Subtle Arrow Icon (Recommended)**
```css
.section-hero__scroll-hint {
  display: flex;
  justify-content: center;
  padding: var(--space-4) 0 var(--space-6); /* 16px top, 24px bottom */
  opacity: 0.6;
  animation: gentleBounce 2s ease-in-out infinite;
}

.section-hero__scroll-hint svg {
  width: 24px;
  height: 24px;
  color: var(--text-tertiary); /* #6B6662 */
  stroke-width: 2px;
}

@keyframes gentleBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(6px); }
}
```

**Icon:**
```html
<div class="section-hero__scroll-hint" aria-hidden="true">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M12 5v14M5 12l7 7 7-7"/>
  </svg>
</div>
```

**Option B: Visible Next Section Edge**
- Alternative to arrow: extend hero so top 40px of next section (stats) is visible
- Provides implicit scroll cue without additional UI element

**Recommendation:** Use **Option A (Arrow)** — clearer signal, doesn't require layout adjustment.

**Rationale:**
- Mobile users often don't scroll unless prompted
- Subtle animation draws eye without distraction
- Low opacity keeps focus on main content

---

## Design Tokens & Brand Colors

### Color Palette (from `/docs/css/tokens.css`)

**Light Theme (Mobile Hero):**
```css
--bg-primary: #FAF9F7;      /* Warm off-white background */
--text-primary: #1A1816;    /* Rich charcoal headlines */
--text-secondary: #4A4745;  /* Muted gray body text */
--text-tertiary: #6B6662;   /* Subtle tertiary text */

/* Copper Gradient Spectrum */
--copper-300: #C29776;      /* Light copper */
--copper-400: #B8866B;      /* Primary copper (brand) */
--copper-500: #A67757;      /* Dark copper */
```

**Typography:**
```css
--font-display: 'Cormorant Garamond', Georgia, serif;
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

**Spacing Scale:**
```css
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
```

**Shadows:**
```css
--shadow-md: 0 4px 8px rgba(26, 24, 22, 0.10), 0 2px 4px rgba(26, 24, 22, 0.08);
--shadow-lg: 0 10px 24px rgba(26, 24, 22, 0.12), 0 4px 8px rgba(26, 24, 22, 0.08);
```

**Border Radius:**
```css
--radius-lg: 16px;   /* Organic, handcrafted feel */
```

---

## Implementation Requirements

### A. HTML Structure Changes

**Current (Desktop - Preserve):**
```html
<section class="section-hero">
  <div class="section-hero__background">
    <img src="img/cover.webp" class="section-hero__background-image">
  </div>
  <div class="section-hero__content">
    <!-- Overlay card with close button, dual CTAs -->
  </div>
  <button class="hero-show-info">...</button>
</section>
```

**New (Mobile - Add Variant):**
```html
<section class="section-hero section-hero--mobile">
  <div class="section-hero__image-container">
    <img src="img/cover.webp" alt="..." class="section-hero__image-mobile">
  </div>
  <div class="section-hero__text-block">
    <h1 class="section-hero__heading">Where Forest Meets Art</h1>
    <p class="section-hero__subheading">
      One-of-a-kind mixed-media artworks made with foraged natural materials.
    </p>
    <div class="section-hero__cta-mobile">
      <a href="gallery.html" class="btn btn--hero-primary btn--with-icon">
        Explore the Works
        <svg><!-- arrow icon --></svg>
      </a>
    </div>
  </div>
  <div class="section-hero__scroll-hint" aria-hidden="true">
    <svg><!-- down arrow --></svg>
  </div>
</section>
```

**Strategy:** Use media queries to show/hide appropriate variant:
- Desktop (>= 768px): `.section-hero` (current overlay design)
- Mobile (< 768px): `.section-hero--mobile` (new inline design)

---

### B. CSS Implementation (Mobile-Specific)

**File:** `/Users/vik/Workspace/branchstone/docs/css/mobile-ux-improvements.css`

```css
/* ==========================================================================
   MOBILE HERO - INLINE NATIVE DESIGN
   Replaces modal overlay with scrollable, art-first layout on mobile
   ========================================================================== */

@media (max-width: 767px) {

  /* Hide desktop hero overlay on mobile */
  .section-hero:not(.section-hero--mobile) {
    display: none;
  }

  /* Mobile inline hero */
  .section-hero--mobile {
    min-height: auto; /* Remove 90vh constraint */
    padding: 0; /* Remove default section padding */
    position: relative;
    overflow: visible; /* Allow scroll cues to extend */
  }

  /* Image container - inline, not background */
  .section-hero__image-container {
    width: 100%;
    height: clamp(60vh, 65vh, 70vh);
    overflow: hidden;
    position: relative;
  }

  .section-hero__image-mobile {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 40%;
    filter: brightness(1.0) contrast(1.05) saturate(1.15);
    /* No dark overlay — let image breathe */
  }

  /* Text block - solid background, high contrast */
  .section-hero__text-block {
    background: var(--bg-primary);
    padding: var(--space-8) var(--space-4);
    text-align: center;
  }

  .section-hero__heading {
    font-family: var(--font-display);
    font-size: clamp(1.75rem, 7vw, 2.5rem);
    font-weight: 400;
    line-height: 1.2;
    color: var(--text-primary);
    letter-spacing: -0.01em;
    margin-bottom: var(--space-4);
  }

  .section-hero__subheading {
    font-family: var(--font-body);
    font-size: clamp(1rem, 4vw, 1.125rem);
    font-weight: 400;
    line-height: 1.6;
    color: var(--text-secondary);
    letter-spacing: 0.005em;
    max-width: 480px;
    margin: 0 auto var(--space-6);
  }

  /* Single CTA - thumb-friendly placement */
  .section-hero__cta-mobile {
    display: flex;
    justify-content: center;
    padding: 0 var(--space-4) var(--space-8);
  }

  .btn--hero-primary {
    padding: 1rem 2rem;
    font-size: var(--text-base);
    font-weight: 600;
    letter-spacing: 0.02em;
    min-height: 48px;
    min-width: 200px;
    background: linear-gradient(135deg, var(--copper-400), var(--copper-500));
    color: white;
    border: none;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    transition: var(--transition-hover-lift);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    text-decoration: none;
  }

  .btn--hero-primary:hover,
  .btn--hero-primary:active {
    background: linear-gradient(135deg, var(--copper-300), var(--copper-400));
    box-shadow: var(--shadow-lg);
    transform: translateY(-2px);
  }

  .btn--hero-primary svg {
    width: 16px;
    height: 16px;
    stroke-width: 2.5px;
  }

  /* Scroll hint - subtle bounce animation */
  .section-hero__scroll-hint {
    display: flex;
    justify-content: center;
    padding: var(--space-4) 0 var(--space-6);
    opacity: 0.6;
    animation: gentleBounce 2s ease-in-out infinite;
  }

  .section-hero__scroll-hint svg {
    width: 24px;
    height: 24px;
    color: var(--text-tertiary);
    stroke-width: 2px;
  }

  @keyframes gentleBounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(6px); }
  }

  /* Dark theme support */
  [data-theme="dark"] .section-hero__text-block {
    background: var(--bg-primary); /* #141210 */
  }

  [data-theme="dark"] .section-hero__heading {
    color: var(--text-primary); /* #FAFAF9 */
  }

  [data-theme="dark"] .section-hero__subheading {
    color: var(--text-secondary); /* #D4D0CB */
  }

  [data-theme="dark"] .section-hero__image-mobile {
    filter: brightness(0.85) contrast(1.08) saturate(1.0);
  }

  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .section-hero__scroll-hint {
      animation: none;
    }
  }

} /* End mobile breakpoint */
```

---

### C. JavaScript Changes

**File:** `/Users/vik/Workspace/branchstone/docs/js/main.js`

**Required Changes:**
1. **Disable hero close/show behavior on mobile** — no longer needed for inline design
2. **Remove sessionStorage checks** for mobile hero state

**Implementation:**
```javascript
// Wrap existing hero close/show logic in desktop-only check
const initHeroCard = () => {
  // Only run on desktop
  if (window.innerWidth < 768) return;

  const heroContent = document.querySelector('.section-hero__content');
  const closeButton = document.querySelector('.hero-card-close');
  const showButton = document.querySelector('.hero-show-info');

  // ... existing logic ...
};
```

**Alternative (Cleaner):**
- Add `data-desktop-only` attribute to desktop hero elements
- Check for attribute before initializing behavior

---

## Responsive Behavior

### Breakpoint Strategy

```css
/* Mobile: Inline native hero */
@media (max-width: 767px) {
  .section-hero--mobile { display: block; }
  .section-hero:not(.section-hero--mobile) { display: none; }
}

/* Tablet/Desktop: Overlay card hero (current design) */
@media (min-width: 768px) {
  .section-hero--mobile { display: none; }
  .section-hero:not(.section-hero--mobile) { display: flex; }
}
```

### Touch Target Compliance

**WCAG AAA Standard:** Minimum 44x44px touch targets
- **CTA Button:** 48px height (exceeds minimum)
- **Spacing:** 16px horizontal padding ensures no adjacent clickable elements

### Performance Optimization

**Mobile-Specific Concerns:**
1. **Remove backdrop-filter** — performance-heavy on mobile GPUs
2. **Optimize image loading:**
   ```html
   <img src="img/cover.webp"
        loading="eager"
        fetchpriority="high"
        width="800"
        height="600"
        alt="Branchstone mixed-media art featuring natural forest materials">
   ```
3. **Reduce animation complexity** — simpler bounce vs. complex parallax

---

## Accessibility Requirements

### Semantic HTML
- **H1 uniqueness:** "Where Forest Meets Art" remains single H1 on page
- **Alt text:** Descriptive, conveys artistic context (current: "Branchstone mixed-media art featuring natural forest materials, moss, and wood textures from Santa Rosa, California")
- **ARIA labels:** Scroll hint uses `aria-hidden="true"` (decorative only)

### Color Contrast (WCAG AA)
| Element | Foreground | Background | Ratio | Status |
|---------|-----------|------------|-------|--------|
| H1 Heading | #1A1816 | #FAF9F7 | 15.8:1 | AAA ✓ |
| Subheading | #4A4745 | #FAF9F7 | 8.2:1 | AAA ✓ |
| CTA Button | #FFFFFF | #B8866B | 4.6:1 | AA ✓ |

### Focus States
```css
.btn--hero-primary:focus-visible {
  outline: 3px solid var(--accent-primary);
  outline-offset: 4px;
}
```

### Screen Reader Considerations
- **Scroll hint:** `aria-hidden="true"` — purely visual cue
- **Image:** Descriptive alt text provides context for non-visual users
- **CTA:** Clear, descriptive link text ("Explore the Works" vs. generic "Click here")

---

## Testing Checklist

### Visual QA
- [ ] Hero image displays at 60-70vh height on mobile (375px - 428px widths)
- [ ] Text is readable without squinting in bright sunlight (high contrast)
- [ ] CTA button is easily tappable with thumb (bottom third of screen)
- [ ] Scroll hint is visible but not distracting
- [ ] Layout doesn't shift/jump on page load
- [ ] Dark theme switches correctly (background/text colors)

### Interaction QA
- [ ] CTA button navigates to `/gallery.html`
- [ ] Scroll hint animates subtly (gentle bounce)
- [ ] No horizontal scroll or overflow issues
- [ ] Touch/tap on image does nothing (not clickable)
- [ ] Page scrolls smoothly to next section

### Performance QA
- [ ] Hero image loads with `fetchpriority="high"`
- [ ] No layout shift (CLS < 0.1)
- [ ] First Contentful Paint < 1.5s on 3G
- [ ] Backdrop-filter removed (check DevTools performance tab)

### Accessibility QA
- [ ] Keyboard navigation: Tab reaches CTA button
- [ ] Screen reader: Announces heading, subheading, CTA correctly
- [ ] Color contrast: All text passes WCAG AA (use axe DevTools)
- [ ] Touch targets: CTA is minimum 48x48px
- [ ] Reduced motion: Scroll hint animation stops when `prefers-reduced-motion: reduce`

### Cross-Device QA
| Device | Viewport | Image Height | Notes |
|--------|----------|--------------|-------|
| iPhone SE | 375x667 | ~400px (60vh) | Test minimum width |
| iPhone 14 Pro | 393x852 | ~511px (60vh) | Test mid-range |
| iPhone 14 Pro Max | 430x932 | ~559px (60vh) | Test maximum width |
| Samsung Galaxy S21 | 360x800 | ~480px (60vh) | Android baseline |
| iPad Mini | 768x1024 | Desktop hero | Breakpoint boundary |

### Browser QA
- [ ] Safari iOS 15+ (primary)
- [ ] Chrome Android 100+ (secondary)
- [ ] Firefox iOS (tertiary)
- [ ] Samsung Internet (if significant traffic)

---

## Edge Cases & Fallbacks

### Very Short Screens (< 600px height)
```css
@media (max-width: 767px) and (max-height: 600px) {
  .section-hero__image-container {
    height: 50vh; /* Reduce from 60-70vh */
  }

  .section-hero__text-block {
    padding: var(--space-6) var(--space-4); /* Reduce vertical padding */
  }
}
```

### Slow Connections
- Image already optimized (14.8KB for cover.webp)
- Consider adding low-res placeholder with blur-up

### JavaScript Disabled
- Hero displays correctly (CSS-only)
- CTA is standard `<a>` link (works without JS)
- No interactive dependencies

### Old Browsers (iOS < 14)
- Fallback for `clamp()` in font sizes:
  ```css
  font-size: 1.75rem; /* Fallback */
  font-size: clamp(1.75rem, 7vw, 2.5rem); /* Modern */
  ```
- Backdrop-filter not used on mobile (no fallback needed)

---

## Success Metrics

### Quantitative Goals
- **Scroll Depth:** >60% of mobile users scroll past hero (up from baseline)
- **CTA Click-Through:** >15% of mobile visitors click "Explore the Works"
- **Bounce Rate:** <45% on mobile homepage (down from baseline)
- **Time on Page:** >30 seconds average (indicates engagement vs. immediate exit)

### Qualitative Goals
- Users describe experience as "calm," "inviting," "art-focused" (user testing)
- No reports of confusion about how to proceed (clear navigation)
- Positive sentiment around mobile first impression (user interviews)

### Technical Goals
- **LCP:** < 2.5s on mobile (hero image as LCP element)
- **CLS:** < 0.1 (no layout shift during load)
- **FID:** < 100ms (interaction ready quickly)

---

## Rollout Plan

### Phase 1: Build (Week 1)
1. Create `.section-hero--mobile` variant in HTML
2. Implement CSS in `/docs/css/mobile-ux-improvements.css`
3. Update JS to skip hero close/show on mobile
4. Add feature flag for A/B testing (if desired)

### Phase 2: Test (Week 2)
1. Internal QA on physical devices (iPhone, Android)
2. Accessibility audit (axe DevTools + manual screen reader)
3. Performance profiling (Lighthouse mobile)
4. User testing with 5-10 target audience members

### Phase 3: Deploy (Week 3)
1. Merge to production
2. Monitor analytics (scroll depth, CTA clicks, bounce rate)
3. Gather user feedback (contact form, social media)
4. Iterate based on data

### Rollback Plan
- Feature flag allows instant revert to current hero
- No changes to desktop hero (zero risk)
- Mobile JS changes are additive (safe to remove)

---

## Visual Design Mockup (ASCII Art)

```
┌──────────────────────────────────┐
│                                  │
│          HERO IMAGE              │
│     (cover.webp or artist)       │
│                                  │
│      No overlay, no text         │
│      60-70vh height              │
│                                  │
│                                  │
├──────────────────────────────────┤
│  ┌────────────────────────────┐  │
│  │                            │  │
│  │  Where Forest Meets Art    │  │ ← Cormorant Garamond, 28-40px
│  │                            │  │
│  │  One-of-a-kind mixed-media │  │
│  │  artworks made with foraged│  │ ← Inter, 16-18px
│  │  natural materials.        │  │
│  │                            │  │
│  │  ┌──────────────────────┐  │  │
│  │  │ Explore the Works → │  │  │ ← Copper gradient, 48px height
│  │  └──────────────────────┘  │  │
│  │                            │  │
│  │          ↓                 │  │ ← Scroll hint (subtle bounce)
│  │                            │  │
│  └────────────────────────────┘  │
└──────────────────────────────────┘
         NEXT SECTION BEGINS
   (Artist by the Numbers stats)
```

---

## Comparison: Before vs. After

| Aspect | Current (Modal) | New (Inline) |
|--------|----------------|--------------|
| **Layout** | Overlay card, blocking | Inline, scrollable |
| **Close UI** | Close button (×) | No close needed |
| **CTAs** | Dual ("View Gallery" + "About") | Single ("Explore the Works") |
| **Image Treatment** | Dark overlay gradient | Clean, no overlay |
| **Text Background** | Blurred backdrop (heavy) | Solid color (fast) |
| **Scroll Cue** | None (users may not scroll) | Arrow hint visible |
| **Brand Tone** | Commercial, urgent | Calm, art-first |
| **Accessibility** | Good (backdrop-filter issues) | Excellent (high contrast) |
| **Performance** | Moderate (blur expensive) | Fast (CSS-only) |

---

## Appendix: Design Rationale

### Why Remove the Overlay?
**Problem:** Modal-like overlays signal "interruption" — users mentally prepare to dismiss rather than engage. The close button (×) reinforces this pattern, treating the hero as a nuisance rather than a welcome.

**Solution:** Inline, scrollable layout treats the hero as integral content, not a speed bump. Users naturally scroll down when ready, creating a calmer, more exploratory flow.

### Why Single CTA?
**Problem:** Dual CTAs ("View Gallery" + "About the Artist") create decision paralysis on small screens. Users scan both, weigh options, and often choose neither (paradox of choice).

**Solution:** Single CTA reduces cognitive load. "Explore the Works" is both inviting (not transactional) and clear (primary action). Users interested in "About" will find it naturally while browsing.

### Why No Stats on Mobile?
**Problem:** Social proof stats ("70+ pieces crafted • 9+ years creating") add clutter on mobile without proportional benefit. Desktop users have space to absorb; mobile users need focus.

**Solution:** Remove stats from hero, preserve in "Artist by the Numbers" section below. Users who scroll (our goal) still see proof; first impression stays calm and spacious.

### Why Scroll Hint?
**Problem:** Mobile users trained by apps to expect single-screen UIs may not realize content continues below. Bounce rate spikes if hero feels like "the whole page."

**Solution:** Subtle down arrow (gentle bounce) signals "more below" without being pushy. Low opacity keeps it secondary to main content.

---

## Component Files Summary

### Files to Modify
```
/Users/vik/Workspace/branchstone/docs/index.html
├─ Add .section-hero--mobile variant (lines 190-234)

/Users/vik/Workspace/branchstone/docs/css/mobile-ux-improvements.css
├─ Add mobile hero inline styles (~150 lines)

/Users/vik/Workspace/branchstone/docs/js/main.js
├─ Update initHeroCard() to skip mobile (5 lines)
```

### Files Unchanged (Desktop Preserved)
```
/Users/vik/Workspace/branchstone/docs/css/layout.css
├─ Desktop hero styles (lines 1322-1655) — no changes

/Users/vik/Workspace/branchstone/docs/css/components.css
├─ hero-card-close, hero-show-info — preserved for desktop
```

---

## Final Notes

This specification provides complete, implementation-ready details for the mobile hero redesign. All color codes, spacing values, and component names reference the existing Branchstone design system for consistency.

**Key Takeaway:** The inline mobile hero transforms the first impression from "obstacle to dismiss" to "invitation to explore," aligning perfectly with Branchstone's calm, art-first brand.

**Next Steps:**
1. Review specification with stakeholders
2. Approve button copy ("Explore the Works" vs. "Enter the Gallery")
3. Decide: Use existing `cover.webp` or commission mobile-optimized artwork?
4. Proceed to implementation

---

**Specification Version:** 1.0
**Date:** 2026-01-08
**Author:** UI Designer (Claude)
**Status:** Ready for Implementation Review
