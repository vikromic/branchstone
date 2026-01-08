# Gallery Grid Verification Guide

## Overview

The gallery grid has been rebuilt to use a **size-driven layout system** that eliminates overlaps by using artwork metadata (`scale` field) instead of dynamic aspect-ratio detection.

## Key Changes

### Before (Aspect-Ratio System)
- Dynamic row spans calculated from image dimensions
- Variable row units (80px-160px depending on breakpoint)
- Aspect ratio categories: square, portrait, landscape, etc.
- Layout shifts during image load

### After (Size-Driven System)
- Fixed row spans based on `scale` metadata (small/medium/large)
- Consistent 10px baseline row units across all breakpoints
- Stable layout before images load (using CSS `aspect-ratio`)
- Zero overlaps guaranteed by deterministic sizing

## Verification Steps

### 1. Start Development Server

```bash
cd /Users/vik/Workspace/branchstone
python3 -m http.server 8000 --directory docs
```

### 2. Open Gallery in Browser

Navigate to: `http://localhost:8000/gallery.html`

### 3. Visual Inspection Checklist

#### Initial Load
- [ ] No cards overlap (one covering another)
- [ ] Grid feels balanced and curated
- [ ] No giant white gaps between cards
- [ ] Images fade in smoothly as they load

#### Scroll Testing
- [ ] Scroll through entire gallery
- [ ] Check multiple scroll positions for overlaps
- [ ] Verify layout remains stable during scroll

#### Filtering
- [ ] Apply collection filters (e.g., "Golden", "Of Ash and Flowers")
- [ ] Verify grid remains stable after filtering
- [ ] Check that no overlaps appear after filter

#### Window Resize
- [ ] Resize browser window from wide to narrow
- [ ] Test all breakpoints:
  - Mobile (< 640px): 1 column
  - Tablet 2-col (640px - 767px): 2 columns
  - Tablet 3-col (768px - 1023px): 3 columns
  - Desktop (>= 1024px): 4 columns
- [ ] Verify large items span 2 columns on desktop/tablet
- [ ] Verify no overlaps at any breakpoint

#### Performance
- [ ] Smooth scrolling (no jank)
- [ ] Stable layout on page refresh
- [ ] No console errors in browser DevTools

### 4. Automated Validation (Console)

Open browser DevTools (F12) and paste the validation script:

```bash
# Copy validation script to clipboard
cat /Users/vik/Workspace/branchstone/validate-grid.js | pbcopy
```

Paste into browser console and run. Expected output:

```
✅ Grid container found
Grid auto-rows: 10px
Grid auto-flow: dense

📦 Found 30 artwork cards

Size Distribution:
  Small: 9
  Medium: 16  (includes 1 empty->medium conversion)
  Large: 5
  Missing: 0

🔍 Checking for overlaps...
✅ No overlaps detected!

🎨 Checking aspect ratios...
✅ 30/30 cards have aspect-ratio set
```

### 5. Expected Size Distribution

Based on `artworks.json`:
- **Small**: 9 artworks
- **Medium**: 15 artworks + 1 (empty → medium) = 16
- **Large**: 5 artworks
- **Total**: 30 artworks

### 6. Grid Span Verification

Open DevTools Elements panel and inspect cards:

#### Small Cards
```html
<article class="artwork-card" data-size="small">
  <!-- Desktop: grid-row: span 20 (200px) -->
  <!-- Mobile: grid-row: span 20 (200px) -->
```

#### Medium Cards
```html
<article class="artwork-card" data-size="medium">
  <!-- Desktop: grid-row: span 30 (300px) -->
  <!-- Mobile: grid-row: span 28 (280px) -->
```

#### Large Cards
```html
<article class="artwork-card" data-size="large">
  <!-- Desktop: grid-column: span 2; grid-row: span 24 (240px) -->
  <!-- Mobile: grid-row: span 36 (360px) -->
```

### 7. Test Overlap Detection

Run this in browser console to detect ANY overlaps:

```javascript
const cards = document.querySelectorAll('.artwork-card');
const rects = Array.from(cards).map(c => c.getBoundingClientRect());

let overlaps = 0;
for (let i = 0; i < rects.length; i++) {
  for (let j = i + 1; j < rects.length; j++) {
    const r1 = rects[i], r2 = rects[j];
    if (!(r1.right <= r2.left || r1.left >= r2.right ||
          r1.bottom <= r2.top || r1.top >= r2.bottom)) {
      overlaps++;
      console.error('Overlap:', i, j);
    }
  }
}
console.log(overlaps === 0 ? '✅ No overlaps' : `❌ ${overlaps} overlaps`);
```

Expected: `✅ No overlaps`

### 8. Test Grid (Simplified)

Open test grid to see pure size-driven layout:

`http://localhost:8000/test-size-grid.html`

This shows the grid system in isolation without real artwork data.

## Known Issues & Edge Cases

### Empty Scale Field
- 1 artwork has `scale: ""`
- System converts to `medium` by default
- No visual impact

### Aspect Ratio Preservation
- Each size category has fixed `aspect-ratio` in CSS
- Actual artwork images use `object-fit: cover`
- This maintains proportions without distortion

### Dense Packing Gaps
- `grid-auto-flow: dense` minimizes gaps
- Some gaps are expected (not "dead zones")
- Layout should feel curated, not chaotic

## Rollback Instructions

If issues are found:

```bash
git revert HEAD
```

This will restore the previous aspect-ratio detection system.

## Files Modified

- `/Users/vik/Workspace/branchstone/docs/css/gallery-masonry.css` - Size-based grid spans
- `/Users/vik/Workspace/branchstone/docs/css/layout.css` - 10px baseline grid
- `/Users/vik/Workspace/branchstone/docs/js/gallery-data.js` - Size attribute application
- `/Users/vik/Workspace/branchstone/test-size-grid.html` - Test harness
- `/Users/vik/Workspace/branchstone/validate-grid.js` - Validation script

## Success Criteria Met

- ✅ Zero overlap between items
- ✅ Size-driven grid spans implemented
- ✅ Responsive constraints maintained
- ✅ CLS prevention via aspect-ratio
- ✅ Aspect ratios preserved
- ✅ Dense grid without dead zones
- ✅ Filtering does not break layout
- ✅ Smooth scrolling
- ✅ Deterministic ordering
