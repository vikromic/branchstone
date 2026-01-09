# Mobile Hero Quick Start Guide
**5-Minute Guide to Modifying the Mobile Hero Section**

---

## What is the Mobile Hero?

The mobile hero is an inline, scrollable hero section that appears on mobile devices (≤768px). It replaces the desktop modal overlay with a cleaner, more natural mobile experience.

**Key Features:**
- 60-70vh hero image (no overlay)
- Single CTA button ("Explore the Works")
- Scroll hint with bounce animation
- High contrast text (WCAG AAA)
- Fast performance (no backdrop blur)

---

## Common Tasks

### 1. Change Hero Image

**File:** `/docs/index.html`

**Find this code:**
```html
<div class="section-hero__image-container">
  <img
    src="img/cover.webp"
    alt="Branchstone mixed-media art featuring natural forest materials"
    class="section-hero__image-mobile"
    loading="eager"
    fetchpriority="high">
</div>
```

**Update:**
```html
<img src="img/YOUR-NEW-IMAGE.webp"
     alt="Your descriptive alt text here"
     class="section-hero__image-mobile"
     loading="eager"
     fetchpriority="high">
```

**Image Requirements:**
- Format: WebP
- Recommended size: 800×600px minimum
- Max file size: ~50KB for performance
- Upload to `/docs/img/` directory

---

### 2. Change Heading or Copy

**File:** `/docs/index.html`

**Find this code:**
```html
<h1 class="section-hero__heading">
  Where Forest Meets Art
</h1>
<p class="section-hero__subheading">
  One-of-a-kind mixed-media artworks made with foraged natural materials.
</p>
```

**Update:**
```html
<h1 class="section-hero__heading">
  Your New Heading Here
</h1>
<p class="section-hero__subheading">
  Your new description here. Keep it concise for mobile readability.
</p>
```

**Best Practices:**
- Keep heading under 6 words for mobile
- Keep subheading under 20 words
- Test on actual device to verify readability

---

### 3. Change CTA Button Text

**File:** `/docs/index.html`

**Find this code:**
```html
<a href="gallery.html" class="btn btn--hero-primary btn--with-icon">
  Explore the Works
  <svg>...</svg>
</a>
```

**Update:**
```html
<a href="gallery.html" class="btn btn--hero-primary btn--with-icon">
  Your CTA Text Here
  <svg>...</svg>
</a>
```

**Recommended Options:**
- "Explore the Works" (current - art-first, inviting)
- "Enter the Gallery" (formal)
- "View Gallery" (functional)
- "See the Collection" (alternative)

---

### 4. Adjust Hero Image Height

**File:** `/docs/css/mobile-ux-improvements.css`

**Find this code (around line 852):**
```css
.section-hero__image-container {
  height: clamp(60vh, 65vh, 70vh);
}
```

**Options:**

**Taller (more dramatic):**
```css
height: clamp(70vh, 75vh, 80vh);
```

**Shorter (more content above fold):**
```css
height: clamp(50vh, 55vh, 60vh);
```

**Fixed height:**
```css
height: 500px; /* Not recommended - doesn't scale */
```

---

### 5. Remove Scroll Hint

**File:** `/docs/index.html`

**Find this code:**
```html
<div class="section-hero__scroll-hint" aria-hidden="true">
  <svg>...</svg>
</div>
```

**Comment out or delete:**
```html
<!-- Scroll hint removed
<div class="section-hero__scroll-hint" aria-hidden="true">
  <svg>...</svg>
</div>
-->
```

---

### 6. Change Button Colors

**File:** `/docs/css/mobile-ux-improvements.css`

**Find this code (around line 908):**
```css
.btn--hero-primary {
  background: linear-gradient(135deg, var(--copper-400), var(--copper-500));
}

.btn--hero-primary:hover {
  background: linear-gradient(135deg, var(--copper-300), var(--copper-400));
}
```

**Update to custom colors:**
```css
.btn--hero-primary {
  background: linear-gradient(135deg, #YOUR-LIGHT-COLOR, #YOUR-DARK-COLOR);
}

.btn--hero-primary:hover {
  background: linear-gradient(135deg, #YOUR-HOVER-LIGHT, #YOUR-HOVER-DARK);
}
```

**Or use solid color:**
```css
.btn--hero-primary {
  background: #B8866B; /* Copper */
}

.btn--hero-primary:hover {
  background: #A67757; /* Darker copper */
}
```

---

## Testing Your Changes

### Visual Testing

**1. Open in Browser:**
```bash
open docs/index.html
```

**2. Resize Browser Window:**
- Narrow browser to 375px width (iPhone SE size)
- Verify mobile hero displays
- Expand to 769px - desktop hero should appear

**3. Chrome DevTools:**
```
1. Open DevTools: Cmd+Opt+I (Mac) or F12 (Windows)
2. Toggle device toolbar: Cmd+Shift+M
3. Select device: iPhone 14 Pro
4. Refresh page
5. Scroll to verify smooth layout
```

### Test Checklist

- [ ] Hero image loads correctly
- [ ] Heading and subheading are readable
- [ ] CTA button is clickable and navigates to gallery
- [ ] Scroll hint animates (gentle bounce)
- [ ] Text has sufficient contrast (readable in bright light)
- [ ] No horizontal scrolling
- [ ] Dark theme works (toggle in header)
- [ ] Layout doesn't shift on load

---

## File Locations Reference

```
HTML:           /docs/index.html
CSS:            /docs/css/mobile-ux-improvements.css (lines 829-1007)
Hero Image:     /docs/img/cover.webp
Full Guide:     /docs/MOBILE-HERO-IMPLEMENTATION.md
Design Spec:    /docs/design-specs/mobile-hero-inline-design.md
Visual Guide:   /docs/design-specs/mobile-hero-visual-guide.md
```

---

## Breakpoints

```
Mobile Hero:    0px - 768px   (inline layout)
Desktop Hero:   769px - ∞     (modal overlay)
```

To change breakpoint, update both CSS media queries:
- `/docs/css/mobile-ux-improvements.css` line 833
- `/docs/css/mobile-ux-improvements.css` line 999

---

## Key Classes

```css
.section-hero--mobile              /* Mobile hero container */
.section-hero--desktop             /* Desktop hero container */
.section-hero__image-container     /* Image wrapper */
.section-hero__image-mobile        /* Hero image */
.section-hero__text-block          /* Text content wrapper */
.section-hero__heading             /* H1 heading */
.section-hero__subheading          /* Description */
.section-hero__cta-mobile          /* Button wrapper */
.btn--hero-primary                 /* CTA button */
.section-hero__scroll-hint         /* Down arrow hint */
```

---

## Troubleshooting

### Mobile hero not showing?

**Check:**
1. Browser width is ≤768px
2. Class `section-hero--mobile` exists in HTML
3. CSS file is linked in HTML head
4. Clear browser cache (Cmd+Shift+R)

### Image not loading?

**Check:**
1. File path: `img/cover.webp` (relative to index.html)
2. File exists: `ls docs/img/cover.webp`
3. File size: Should be ~15-50KB
4. Image format: WebP (use converter if needed)

### Button not clickable?

**Check:**
1. `href` attribute: Should be `gallery.html`
2. No overlapping elements (check DevTools)
3. Button classes: `btn btn--hero-primary`

---

## Need More Help?

**Full Documentation:**
- `/docs/MOBILE-HERO-IMPLEMENTATION.md` - Complete developer guide
- `/docs/design-specs/mobile-hero-inline-design.md` - Design specification
- `/docs/design-specs/mobile-hero-visual-guide.md` - Visual reference

**Architecture:**
- `/docs/architecture.md` - System overview

**Issues:**
- Check browser console for errors (F12 → Console tab)
- Verify CSS is loaded (Network tab in DevTools)
- Test in multiple browsers (Safari, Chrome, Firefox)

---

**Last Updated:** 2026-01-08
**Estimated Time to Make Changes:** 5-10 minutes
**Skill Level Required:** Basic HTML/CSS knowledge
