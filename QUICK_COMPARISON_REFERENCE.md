# Quick Reference: Modal Elimination Patterns
## Side-by-Side Comparison

---

## At a Glance

| Aspect | Bottom Sheet (Recommended) | Deep Link | Fullscreen Carousel |
|--------|--------------------------|-----------|-------------------|
| **Complexity** | ✓ Low | Medium | Medium |
| **Dev Time** | 2-3 weeks | 4-5 weeks | 3-4 weeks |
| **Friction** | ✓ Lowest | Medium | Low-Medium |
| **Mobile UX** | ✓ Native | Web-like | Immersive |
| **Context Maintained** | ✓ Yes (visible) | No (new page) | No (fullscreen) |
| **WCAG AA** | ✓ Easy | ✓ Easy | ✓ Requires care |
| **Performance** | ✓ Excellent | Good | Good |
| **Shareable URLs** | No | ✓ Yes | No |
| **Brand Fit** | Modern, native | Luxury, prestige | Story-like, immersive |

---

## Core Interactions

### Bottom Sheet Pattern
```
USER GESTURE → EFFECT → DISMISS

Tap artwork → Sheet slides up from bottom → Swipe down
             Gallery dimmed 15% behind     (50-100px threshold)

INTERACTION COST: 2 gestures (tap + swipe)
DISCOVERABILITY: High (visual drag handle)
MOBILE NATURAL: Yes (native iOS/Material pattern)
```

### Deep Link Pattern
```
USER GESTURE → EFFECT → DISMISS

Tap artwork → Detail page (image + scroll panel) → Back button
             Full viewport, new page context       or Esc key

INTERACTION COST: 2 gestures (tap + back/esc)
DISCOVERABILITY: High (visible back button)
MOBILE NATURAL: Moderate (feels like web navigation)
```

### Fullscreen Carousel Pattern
```
USER GESTURE → EFFECT → DISMISS

Tap artwork → Fullscreen, minimal UI → Swipe down
             Gallery faded behind    or close button

INTERACTION COST: 2-3 gestures (tap + swipe x N)
DISCOVERABILITY: Medium (gesture hints needed)
MOBILE NATURAL: Yes (Stories pattern familiar)
```

---

## Gesture Comparison

### Primary Navigation

| Pattern | Primary Gesture | Behavior | Threshold |
|---------|-----------------|----------|-----------|
| **Bottom Sheet** | Swipe down | Sheet slides down, gallery returns | 100px |
| **Deep Link** | Tap back button | Navigate back (browser history) | N/A |
| **Carousel** | Swipe left/right | Navigate between images | 50px |

### Secondary Navigation

| Pattern | Gesture | Behavior | Notes |
|---------|---------|----------|-------|
| **Bottom Sheet** | Swipe left/right in sheet | Next/prev artwork (optional) | Keep simple |
| **Deep Link** | Left/right arrow keys | Previous/next artwork | Keyboard only |
| **Carousel** | Arrow keys | Previous/next artwork | Recommended |

### UI Toggle

| Pattern | Gesture | Behavior | Notes |
|---------|---------|----------|-------|
| **Bottom Sheet** | Scroll metadata | Natural, within sheet | No UI hiding needed |
| **Deep Link** | Scroll metadata | Natural, below image | No UI hiding needed |
| **Carousel** | Tap image | Toggle header/footer | Auto-hide after 3s |

---

## Mobile Viewport Breakdown

### Bottom Sheet (Mobile-First)
```
Portrait (320-767px):
┌────────────────────┐
│ Gallery (85%)      │  ← Still visible, interactive below
│ [Card 1] [Card 2]  │
├────────────────────┤ ← Handle
│ SHEET (60vh)       │
│ ∿∿∿ (drag handle)  │
│ [Image: 280px]     │  ← Sticky
│ [Metadata scroll]  │
│ [CTA button]       │  ← Sticky bottom
└────────────────────┘

Landscape (320 wide, 600+ tall):
┌────────────────┐
│ Gallery        │
├────────────────┤
│ SHEET (70vh)   │
│ [Adjusted for] │
│  landscape     │
└────────────────┘
```

### Deep Link (Mobile-First)
```
Portrait (320-767px):
┌────────────────────┐
│ ← Gallery          │  ← Sticky header
├────────────────────┤
│ [Image: 60vh]      │  ← Fills most of viewport
│ (sticky during     │
│  scroll)           │
├────────────────────┤
│ [Metadata scroll]  │
│ Title              │
│ Size               │
│ Materials          │
│ Description        │
│ [CTA button]       │  ← At bottom
└────────────────────┘
```

### Fullscreen Carousel (Mobile-First)
```
Portrait (320-767px):
┌────────────────────┐
│ ← Close  Title  ⓘ  │  ← Fades after 3s
├────────────────────┤
│                    │
│ [Image: 100%vh]    │  ← Fullscreen, centered
│                    │
│                    │
│ Swipe hint ← →     │  ← Fades after 2s
├────────────────────┤
│ 1 of 12 progress   │  ← Always visible
└────────────────────┘

Info Expanded:
┌────────────────────┐
│ ← Close  Title  ⓘ  │
├────────────────────┤
│ [Image: 50vh]      │  ← Shrinks
├────────────────────┤
│ OVERLAY            │
│ Title              │
│ Materials          │
│ [CTA]              │
│ (scrollable)       │
└────────────────────┘
```

---

## Animation Timing

### Bottom Sheet
```
Open:      300ms spring (0.16, 1, 0.3, 1)
  0-100ms: Backdrop blur/dim, sheet slides up
  100-300ms: Metadata fades in (staggered)

Dismiss:   250ms ease-out
  0-100ms: Sheet slides down
  100-250ms: Backdrop blur/dim returns to 0
```

### Deep Link
```
Enter:     400ms spring
  0-150ms: Image zooms from grid position, gallery fades
  150-400ms: Metadata slides in, staggered animations

Exit:      300ms ease-out
  0-150ms: Image shrinks back to grid, metadata collapses
  150-300ms: Gallery returns to normal opacity
```

### Fullscreen Carousel
```
Open:      400ms spring
  0-200ms: Image zooms to fullscreen, gallery fades behind
  200-400ms: Header/footer fade in, hints appear

Transition: 200ms crossfade
  0-100ms: Previous image fades out
  100-200ms: Next LQIP appears, HD fades in

Close:     300ms ease-out
  0-300ms: Image shrinks, gallery fades in
```

---

## Accessibility Shortcuts

### Bottom Sheet
```
Esc        Close sheet
Tab        Next focusable element in sheet
Shift+Tab  Previous focusable element
Space      Scroll down (within sheet)
Page Down  Scroll down (faster)
Page Up    Scroll up
```

### Deep Link
```
Esc        Go back (browser back)
Tab        Next focusable element
Shift+Tab  Previous focusable element
Left       Previous artwork (if in image)
Right      Next artwork (if in image)
Enter      Activate focused button
Space      Activate button (if focused)
```

### Fullscreen Carousel
```
Esc        Close carousel
Left       Previous artwork
Right      Next artwork
Up         Zoom in (if zoomed)
Down       Zoom out (if zoomed)
I          Toggle info panel
Space      Same as I
Tab        Next focusable (close, info buttons)
Shift+Tab  Previous focusable
```

---

## Performance Targets

### Loading Sequence

**Bottom Sheet** (Fastest)
```
0ms:  User taps artwork
0-50ms: Sheet component mounted, animations begin
50-200ms: Metadata loads from cache (fast)
200-300ms: Image loads in background (non-blocking)
300ms: Sheet open, metadata visible
5000ms: Full-res image replaces placeholder
```

**Deep Link** (Medium)
```
0ms: User taps artwork
0-100ms: Navigate to detail page (routing)
100-200ms: Detail page DOM renders
200-400ms: Image zooms into position
400ms: Page fully interactive
5000ms: Full-res image loads
```

**Fullscreen Carousel** (Medium)
```
0ms: User taps artwork
0-50ms: Carousel component mounted
50-200ms: Image starts loading
200-400ms: Image zooms, carousel interactive
400ms: Ready for navigation
Next image: 200-500ms per swipe transition
```

### Metrics

| Pattern | LCP Target | INP Target | CLS Target |
|---------|-----------|-----------|-----------|
| **Bottom Sheet** | <1.5s | <100ms | <0.05 |
| **Deep Link** | <2.0s | <150ms | <0.1 |
| **Fullscreen** | <2.0s | <100ms | <0.05 |

---

## Code Complexity Overview

### Bottom Sheet
```javascript
// Component count: 1-2
// Gesture handlers: 2 (touchstart, touchend)
// State management: Simple (isOpen, isDragging)
// Animation complexity: Low (single transform)
// Estimated LOC: 200-300

Key features:
- Modal: NO (aria-modal="false")
- Focus trap: NO (maintains gallery focus)
- Routing: NO (in-place sheet)
- Preloading: Lazy (on-demand)
```

### Deep Link
```javascript
// Component count: 2-3 (Router, DetailPage, ImageCarousel)
// Gesture handlers: 2 (swipe nav, pinch zoom)
// State management: Medium (URL, index, zoom state)
// Animation complexity: Medium (zoom transform)
// Estimated LOC: 400-600

Key features:
- Modal: NO (full page)
- Focus trap: NO (page-level)
- Routing: YES (URL-driven)
- Preloading: Predictive (adjacent images)
```

### Fullscreen Carousel
```javascript
// Component count: 1 (CarouselModal)
// Gesture handlers: 3 (swipe, pinch, long-press)
// State management: Medium (index, zoom, infoOpen)
// Animation complexity: High (crossfade, zoom)
// Estimated LOC: 300-500

Key features:
- Modal: YES (aria-modal="true", focus trap)
- Focus trap: YES (required)
- Routing: NO (in-place modal)
- Preloading: Moderate (current + next 2)
```

---

## Browser Support Matrix

| Feature | Bottom Sheet | Deep Link | Carousel |
|---------|---|---|---|
| iOS Safari 13+ | ✓ | ✓ | ✓ |
| iOS Safari 14+ | ✓✓ | ✓✓ | ✓✓ |
| Chrome 90+ | ✓✓ | ✓✓ | ✓✓ |
| Firefox 88+ | ✓ | ✓ | ✓ |
| Samsung 14+ | ✓ | ✓ | ✓ |
| Edge 90+ | ✓✓ | ✓✓ | ✓✓ |

✓ = Works
✓✓ = Excellent, native support

---

## Tradeoffs Summary

### Bottom Sheet: Tradeoffs
```
PROS:
+ Native mobile pattern
+ Maintains context (gallery visible)
+ Lowest dev effort
+ Best accessibility (non-modal)
+ Fastest performance
+ Natural swipe-down gesture

CONS:
- No deep-linking (URLs not shareable)
- Gallery slightly dimmed (distraction?)
- Requires custom gesture handling
```

### Deep Link: Tradeoffs
```
PROS:
+ Shareable URLs (SEO benefit)
+ Full-screen focus on artwork
+ Native web navigation
+ Elegant zoom animation

CONS:
- Highest dev effort (routing needed)
- Gallery context lost
- Feels web-like, not app-like
- Complex state management
```

### Carousel: Tradeoffs
```
PROS:
+ Immersive, story-like feel
+ Minimal UI (luxury positioning)
+ Momentum scrolling natural
+ Continuous browsing experience

CONS:
- Requires gesture education (hints needed)
- Gallery context completely lost
- Focus trap complexity
- More animation overhead
```

---

## Decision Tree

```
START
  ↓
Is ShareableURLs Important?
  │ YES → Deep Link (Proposal 1)
  │ NO ↓
Are you mobile-first (>70% traffic)?
  │ YES → Bottom Sheet (Proposal 2) ✓
  │ NO ↓
Want Luxury/Immersive feel?
  │ YES → Fullscreen Carousel (Proposal 3)
  │ NO → Bottom Sheet (Proposal 2) ✓
```

---

## Recommendation Scorecard

```
SCORING: 5 = Excellent, 1 = Poor, X = Not applicable

Criterion                Weight  Sheet  Link  Carousel
─────────────────────────────────────────────────────
Mobile UX               20%     5      3     5
Dev Effort (low=best)   25%     5      2     3
Accessibility          15%     5      4     3
Performance             15%     5      4     4
Brand Alignment         15%     4      5     4
Context Maintained      10%     5      2     2
─────────────────────────────────────────────────────
WEIGHTED SCORE          100%    4.65   3.35  3.70

Winner: BOTTOM SHEET (4.65/5.0) ✓
```

---

## Implementation Priority

### Phase 1 (Week 1-2): Bottom Sheet
- [ ] Design & prototype in Figma
- [ ] Build component
- [ ] Integrate with gallery
- [ ] Mobile testing

### Phase 2 (Week 3-4): Polish & Launch
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] A/B test if desired
- [ ] Monitor metrics

### Phase 3 (Later): Consider Alternatives
- [ ] If Bottom Sheet engagement < target, try Carousel
- [ ] If need shareable URLs, add Deep Link routing
- [ ] Implement based on real usage data

---

## Files to Update

### Current Implementation
- `/docs/gallery.html` — Remove lightbox modal markup
- `/docs/js/components/Lightbox.js` — Replace with BottomSheet
- `/docs/css/04-gallery.css` — Update lightbox styles → sheet styles

### New Components
- `/docs/js/components/BottomSheet.js` — New (reusable)
- `/docs/css/bottom-sheet.css` — New (styles + animations)

### Testing
- Viewport testing (320px, 375px, 414px, 768px, 1024px)
- Device testing (iOS Safari, Chrome, Firefox)
- Accessibility testing (NVDA, JAWS, VoiceOver)
- Performance testing (Lighthouse, DevTools)

---

## Final Recommendation

**→ Implement Bottom Sheet (Proposal 2)**

**Why:**
1. **Fastest to implement** (2-3 weeks vs. 4+ weeks)
2. **Best mobile UX** (native iOS/Material pattern)
3. **Maintains gallery context** (less cognitive friction)
4. **Excellent accessibility** (non-modal, natural interactions)
5. **Superior performance** (lazy-load details)

**Next Steps:**
1. Share this comparison with stakeholders
2. Get approval to move forward
3. Create high-fidelity mockup in Figma
4. Start development (engineer assignment)
5. Launch within 3-4 weeks

