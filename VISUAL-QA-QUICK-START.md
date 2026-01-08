# Gallery Visual QA - Quick Start Guide

## Setup (5 minutes)

### 1. Open Gallery Page
```bash
# From project root
open docs/gallery.html
# Or navigate to: file:///Users/vik/Workspace/branchstone/docs/gallery.html
```

### 2. Open DevTools
- **Mac**: `Cmd + Option + I`
- **Windows/Linux**: `F12`

### 3. Load Console Helpers
1. Open Console tab in DevTools
2. Copy entire contents of `visual-qa-console-helpers.js`
3. Paste into console and press Enter
4. You should see: "GALLERY VISUAL QA CONSOLE HELPERS LOADED"

### 4. Run Initial Automated Checks
```javascript
runAllChecks()
```

This will check for:
- Overlapping cards
- Grid alignment issues
- Horizontal scroll
- Image loading/distortion
- Spacing consistency
- Accessibility issues

---

## Quick Testing Protocol (30 minutes)

### Phase 1: Desktop Baseline (10 min)

**Viewport**: 1440px × 900px

```javascript
// Check current viewport
getViewportInfo()

// Run all automated checks
runAllChecks()

// Monitor hover states (then hover over cards manually)
checkHoverOverlays()

// Test filter animations
testFilterAnimations()
```

**Manual checks**:
- [ ] Hover over each card - overlay appears smoothly
- [ ] Overlay stays within card bounds
- [ ] No layout shift when hovering
- [ ] Filter buttons have hover states
- [ ] Click each filter - smooth transitions
- [ ] No overlaps during filter animations

---

### Phase 2: Mobile Testing (10 min)

**Viewports**: 375px, 768px, 1024px

1. **Open Device Toolbar**: `Cmd + Shift + M` (Mac) or `Ctrl + Shift + M` (Windows)
2. **Select device or custom dimensions**

**At each viewport**:
```javascript
// Check viewport
getViewportInfo()

// Check for overlaps
checkForOverlaps()

// Check grid
checkGridAlignment()

// Check horizontal scroll
checkHorizontalScroll()
```

**Manual checks**:
- [ ] No horizontal scrolling
- [ ] Cards fill screen properly
- [ ] Text readable
- [ ] Touch targets adequate (44×44px minimum)
- [ ] Mobile filter dropdown works
- [ ] Images not distorted

---

### Phase 3: Edge Cases (10 min)

**Test awkward sizes** where layout might break:

1. **600px** (between mobile and tablet)
```javascript
// Resize window to 600px wide, then:
getViewportInfo()
checkForOverlaps()
checkGridAlignment()
```

2. **800px** (between tablet breakpoints)
```javascript
// Resize to 800px, then:
getViewportInfo()
checkForOverlaps()
```

3. **1100px** (just above tablet threshold)
```javascript
// Resize to 1100px, then:
getViewportInfo()
checkGridAlignment()
```

**Manual checks**:
- [ ] Grid transitions smoothly
- [ ] No partial cards visible
- [ ] Gaps remain consistent

---

## Critical Visual Checks (All Viewports)

### Zero Overlaps ✅
```javascript
checkForOverlaps()
// Should return: "✅ No overlapping cards found"
```

### Layout Stability ✅
1. Refresh page (Cmd+R)
2. Watch cards as images load
3. Look for jumping or shifting

**Expected**: Placeholders maintain space, no layout shift when images load

### Hover Overlays ✅ (Desktop only)
```javascript
checkHoverOverlays()
// Then hover over cards manually
```

**Expected**:
- Overlay slides up from bottom
- Stays within card bounds
- No overflow to adjacent cards
- Smooth animation

### Filter Transitions ✅
```javascript
testFilterAnimations()
// Watch as it cycles through filters
```

**Expected**:
- Cards fade out smoothly
- Cards fade in with stagger
- No overlaps during transition
- Visibility toggles correctly

### Image Loading ✅
```javascript
checkImages()
```

**Expected**:
- All images loaded
- No broken images
- No distorted aspect ratios
- Placeholder shown while loading

---

## Reduced Motion Testing

### Enable Reduced Motion
1. Open DevTools → More tools → Rendering
2. Check "Emulate CSS media feature prefers-reduced-motion"
3. Select "reduce"

### Test
```javascript
checkReducedMotion()
// Click filters manually
```

**Expected**:
- Filters change instantly (no fade animation)
- Cards appear/disappear instantly
- No transforms or motion

---

## Dark Mode Testing

### Toggle Dark Mode
1. Click theme toggle button in header (sun/moon icon)
2. OR add to console:
```javascript
document.documentElement.setAttribute('data-theme', 'dark')
```

### Check
```javascript
runAllChecks()
```

**Manual verification**:
- [ ] Cards visible against dark background
- [ ] Text readable
- [ ] Shadows adjusted
- [ ] Borders visible
- [ ] Overlays maintain contrast

---

## Rapid Interaction Testing

### Filter Toggle Spam
1. Rapidly click between filter buttons
2. Watch for:
   - Layout breakage
   - Overlapping cards
   - Animation conflicts
   - Console errors

```javascript
// After spam clicking, check:
checkForOverlaps()
```

### Hover Spam
1. Rapidly move mouse over multiple cards
2. Watch for:
   - Stuttering animations
   - Z-index issues
   - Overlay glitches

---

## Screenshot Capture

### For Each Issue Found

1. **Take screenshot**:
   - Mac: `Cmd + Shift + 4` → drag selection
   - DevTools: Device toolbar → More options → Capture screenshot

2. **Name format**:
```
breakpoint-state-issue.png

Examples:
mobile-375px-overlap-cards.png
desktop-1440px-hover-overflow.png
tablet-768px-filter-transition-gap.png
```

3. **Save to**:
```
/Users/vik/Workspace/branchstone/visual-qa-screenshots/
```

4. **Document in** `visual-qa-report.md` under appropriate section

---

## Common Issues to Watch For

### ❌ Layout Problems
- Cards overlapping
- Grid columns misaligned
- Gaps inconsistent
- Cards cut off

### ❌ Image Issues
- Distorted (stretched/squashed)
- Broken (not loading)
- Wrong aspect ratio
- Pixelated/blurry

### ❌ Hover/Interaction
- Overlay overflows card
- Hover causes layout shift
- Animation stutters
- Focus states invisible

### ❌ Responsive
- Horizontal scroll on mobile
- Text too small
- Touch targets too small
- Grid doesn't adapt

### ❌ Filter Animation
- Cards overlap during transition
- Layout jumps
- Animation conflicts
- Flickering

---

## Reporting Issues

### For Each Issue

1. **Run diagnostic**:
```javascript
// Get viewport info
getViewportInfo()

// Check specific issue
checkForOverlaps()  // or relevant check
```

2. **Fill in template** in `visual-qa-report.md`:

```markdown
### [ISSUE-###] Brief Title

**Category**: Layout | Responsive | Component State | Typography | Image | Spacing

**Description**: What's wrong

**Steps to Reproduce**:
1. Navigate to /docs/gallery.html
2. Resize to [width]px
3. [Action]
4. Observe [element]

**Expected**: What should happen
**Actual**: What actually happens

**Environment**:
- Viewport: 1440px × 900px
- Browser: Chrome 120
- OS: macOS
- DPR: 2x

**Screenshot**: `desktop-1440px-issue-001.png`

**Severity**: Critical | High | Medium | Low

**Fix**:
```css
.selector { property: value; }
```
```

3. **Take screenshot** and save with descriptive name

4. **Console output**: Copy relevant error messages

---

## Final Checklist

Before marking testing complete, verify:

### Acceptance Criteria
- [ ] ✅ Zero overlaps in all states
- [ ] ✅ Layout stability (no jumping during image load)
- [ ] ✅ Filter transitions smooth without layout shifts
- [ ] ✅ Hover overlays stay within card bounds
- [ ] ✅ Reduced motion preference respected
- [ ] ✅ Image loading placeholders work
- [ ] ✅ Responsive behavior at all breakpoints
- [ ] ✅ Consistent gaps and spacing
- [ ] ✅ Rapid filter toggling stable
- [ ] ✅ Aspect ratios preserved

### All Breakpoints Tested
- [ ] 320px (mobile)
- [ ] 375px (mobile)
- [ ] 640px (tablet start)
- [ ] 768px (tablet 3-col)
- [ ] 1024px (desktop 4-col)
- [ ] 1440px (desktop)

### All States Tested
- [ ] Initial load
- [ ] After images loaded
- [ ] Hover states (desktop)
- [ ] Focus states (keyboard)
- [ ] Filter active states
- [ ] Filter transitions
- [ ] Dark mode
- [ ] Reduced motion

### All Browsers Tested (if available)
- [ ] Chrome
- [ ] Safari
- [ ] Firefox

---

## Time Estimate

- **Quick check** (automated only): 5 minutes
- **Single viewport manual test**: 10 minutes
- **Full responsive test**: 30 minutes
- **Comprehensive test (all viewports, states, browsers)**: 2-3 hours

---

## Next Steps After Testing

1. **Compile results** in `visual-qa-report.md`
2. **Prioritize issues** (Critical → High → Medium → Low)
3. **Create fix recommendations** for each issue
4. **Provide summary** to developer

---

## Need Help?

### Console Commands Reference
```javascript
// Quick checks
runAllChecks()           // Run everything
getViewportInfo()        // Current viewport
checkForOverlaps()       // Find overlapping cards
checkImages()            // Validate images

// Deep dives
checkGridAlignment()     // Grid structure
checkHorizontalScroll()  // Overflow check
checkSpacing()           // Spacing consistency
analyzeDesignTokens()    // Design system

// Interactive tests
testFilterAnimations()   // Auto-cycle filters
checkHoverOverlays()     // Monitor hovers
checkAccessibility()     // A11y checks
```

### Breakpoint Quick Reference
```
Mobile:      < 640px   (1 column)
Tablet:      640-767px (2 columns)
Tablet:      768-1023px (3 columns)
Desktop:     >= 1024px (4 columns)
```

### DevTools Shortcuts
```
Cmd+Option+I    Open DevTools (Mac)
Cmd+Shift+M     Device toolbar (Mac)
Cmd+Shift+P     Command palette (Mac)
Cmd+R           Refresh
Cmd+Shift+R     Hard refresh (clear cache)
```

---

**Ready to start?**

1. ✅ Open `/docs/gallery.html`
2. ✅ Open DevTools console
3. ✅ Paste `visual-qa-console-helpers.js`
4. ✅ Run `runAllChecks()`
5. 🚀 Begin systematic testing!
