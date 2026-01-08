# Visual QA Manual Validation Checklist

**Target:** http://localhost:8000/gallery.html
**Date:** 2026-01-07
**Changes Tested:**
1. Grid row gaps reduced by ~50% across all breakpoints
2. Dynamic aspect ratios from dimension metadata (parsing "W x H in" format)
3. Changed from object-fit: cover to object-fit: contain

---

## Quick Validation Steps

### 1. Server Status Check
```bash
# Verify server is running
curl -I http://localhost:8000/gallery.html
```

### 2. Open in Browser
Open: http://localhost:8000/gallery.html

---

## Visual Validation Checklist

### A. Gap Reduction Assessment

**Mobile (375px width):**
- [ ] Gaps feel tighter/denser than before
- [ ] No excessive whitespace between rows
- [ ] Visual: ~8px gaps (0.5rem)

**Tablet (768px width):**
- [ ] Gaps appropriately sized for 3-column layout
- [ ] Visual: ~8-12px gaps

**Desktop (1280px+ width):**
- [ ] Gaps create visual breathing room but not excessive
- [ ] Visual: ~10-14px gaps (0.625-0.875rem)

**Expected gap values per breakpoint:**
- Mobile (<640px): `clamp(0.5rem, 1.5vw, 0.75rem)` = ~8-12px
- Tablet (768-1023px): `clamp(0.5rem, 1.25vw, 0.75rem)` = ~8-12px
- Desktop (1024px+): `clamp(0.625rem, 1.25vw, 0.875rem)` = ~10-14px

### B. Aspect Ratio & Orientation

**Test Artworks:**

**"Born Of Burn" (16 x 20 in - VERTICAL)**
- [ ] Displays in PORTRAIT orientation (taller than wide)
- [ ] Full image visible (no cropping top/bottom)
- [ ] Aspect ratio: 16/20 = 0.8
- [ ] Card should be vertical/tall

**"By Marks and Fire" (20 x 16 in - HORIZONTAL)**
- [ ] Displays in LANDSCAPE orientation (wider than tall)
- [ ] Full image visible (no cropping sides)
- [ ] Aspect ratio: 20/16 = 1.25
- [ ] Card should be horizontal/wide

**General artwork orientation:**
- [ ] Portrait artworks (16x20, 18x24, etc.) display vertically
- [ ] Landscape artworks (20x16, 24x18, etc.) display horizontally
- [ ] Square artworks (20x20, 24x24, etc.) display as squares

### C. Object-fit: contain Validation

**No Cropping:**
- [ ] All artwork edges visible (top, bottom, left, right)
- [ ] No parts of artwork cut off
- [ ] Images scale to fit within card bounds

**Background Handling:**
- [ ] If image doesn't fill card (letterboxing/pillarboxing), background is acceptable
- [ ] Background color: `var(--bg-tertiary)` (should blend with design)

### D. Responsive Design Validation

**Mobile (375px):**
- [ ] No horizontal scrolling
- [ ] Single column layout
- [ ] All content visible and accessible
- [ ] Images scale appropriately

**Mobile Medium (414px):**
- [ ] No horizontal scrolling
- [ ] Layout adapts smoothly

**Tablet (768px):**
- [ ] 3-column grid
- [ ] Proper spacing between columns
- [ ] Large artworks span 2 columns
- [ ] No overlapping cards

**Desktop Small (1024px):**
- [ ] 4-column grid
- [ ] Dense packing works correctly
- [ ] No gaps or holes in grid

**Desktop Medium (1280px):**
- [ ] Layout feels balanced
- [ ] Adequate breathing room
- [ ] Visual hierarchy clear

**Desktop Large (1920px):**
- [ ] Maximum width constraints (if any) working
- [ ] Content centered or properly aligned
- [ ] No excessive gaps

### E. Layout Integrity

**Grid Structure:**
- [ ] No overlapping artwork cards
- [ ] Proper alignment of all cards
- [ ] Grid flows naturally (dense packing)
- [ ] Row heights proportional to artwork scale (small/medium/large)

**Visual Balance:**
- [ ] Gallery feels cohesive, not chaotic
- [ ] Size-driven layout maintains hierarchy
- [ ] Highlighted works appropriately prominent

**Scroll Behavior:**
- [ ] Smooth scrolling
- [ ] No layout shift during scroll
- [ ] Images load progressively without jumping

### F. Image Loading & Quality

**Loading States:**
- [ ] Images fade in smoothly on load (0.3s opacity transition)
- [ ] No jarring pop-in effects
- [ ] Loading indicators (if visible)

**Image Quality:**
- [ ] No distorted images (stretched/squashed)
- [ ] Appropriate resolution for display size
- [ ] No broken images (check console for 404s)

**Performance:**
- [ ] Page loads in reasonable time
- [ ] Lazy loading working (images load as scrolled into view)
- [ ] No significant layout shift (CLS)

### G. Browser DevTools Inspection

**Console:**
```javascript
// Open DevTools Console and check for:
```
- [ ] No JavaScript errors
- [ ] No 404 errors for images/assets
- [ ] Gallery rendering logs show correct counts
- [ ] No warnings about aspect ratios or object-fit

**Grid Inspection:**
```javascript
// Run in console to check gap values:
const grid = document.querySelector('.bento-grid');
const style = window.getComputedStyle(grid);
console.log('Gap:', style.gap);
console.log('Columns:', style.gridTemplateColumns);
console.log('Auto rows:', style.gridAutoRows);
```

**Expected output at 1280px:**
- Gap: ~12px (0.75rem or similar based on clamp)
- Columns: repeat(4, 1fr) or similar
- Auto rows: 10px

**Aspect Ratio Verification:**
```javascript
// Check specific artwork aspect ratios:
const cards = document.querySelectorAll('.artwork-card');
cards.forEach(card => {
  const title = card.querySelector('.artwork-card__title')?.textContent;
  const ar = card.style.aspectRatio;
  const dims = card.getAttribute('data-dimensions');
  if (title && ar) {
    console.log(`${title}: ${dims} → aspect-ratio: ${ar}`);
  }
});
```

**Object-fit Verification:**
```javascript
// Verify all images use object-fit: contain
const images = document.querySelectorAll('.artwork-card__image');
images.forEach(img => {
  const objectFit = window.getComputedStyle(img).objectFit;
  if (objectFit !== 'contain') {
    console.warn('Wrong object-fit:', img.src, objectFit);
  }
});
console.log('✓ All images checked');
```

### H. Cross-Browser Testing (if applicable)

**Chrome/Edge:**
- [ ] Layout correct
- [ ] Images render properly
- [ ] No console errors

**Safari:**
- [ ] Layout correct
- [ ] Aspect-ratio CSS property supported
- [ ] Object-fit working

**Firefox:**
- [ ] Layout correct
- [ ] Grid rendering correct
- [ ] No visual glitches

---

## Issues Found

### Critical Issues
- [ ] None found

### High Priority Issues
- [ ] None found

### Medium Priority Issues
- [ ] None found

### Low Priority / Polish
- [ ] None found

---

## Specific Artwork Testing Results

| Artwork Name | Expected Orientation | Actual Orientation | Cropping? | Pass/Fail |
|--------------|---------------------|--------------------|-----------|----|
| Born Of Burn | Vertical (16x20) | | | |
| By Marks and Fire | Horizontal (20x16) | | | |
| | | | | |
| | | | | |

---

## Screenshots Captured

1. Mobile (375px) - Full page: `mobile-375-full.png`
2. Tablet (768px) - Full page: `tablet-768-full.png`
3. Desktop (1280px) - Full page: `desktop-1280-full.png`
4. Born Of Burn - Close-up: `artwork-born-of-burn.png`
5. By Marks and Fire - Close-up: `artwork-by-marks-and-fire.png`

---

## Final Assessment

**Overall Visual Quality:** [ ] Pass / [ ] Needs work

**Gap Reduction:**
- [ ] ✅ Gaps successfully reduced
- [ ] ⚠️  Gaps acceptable but could be better
- [ ] ❌ Gaps too tight or too loose

**Aspect Ratio Fix:**
- [ ] ✅ All orientations correct
- [ ] ⚠️  Most correct, some issues
- [ ] ❌ Orientations still wrong

**Object-fit Change:**
- [ ] ✅ No cropping, full images visible
- [ ] ⚠️  Some minor issues
- [ ] ❌ Cropping still occurring

**Recommendations:**
1.
2.
3.

---

## Next Steps
- [ ] Address any critical issues
- [ ] Review medium/low priority items
- [ ] Consider additional polish
- [ ] Document any CSS changes needed
