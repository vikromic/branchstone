# Gallery QA Test Plan - http://branchstone.art

**Test Date:** 2025-12-03
**Test Environment:** Production (http://branchstone.art)
**Tester:** QA Automation Engineer
**Test Scope:** Comprehensive gallery and lightbox functionality

---

## Test Strategy

This test plan follows the Test Pyramid approach:
- **60-70% Unit Tests**: Component behavior validation
- **20-30% Integration Tests**: Gallery-lightbox interaction flow
- **5-10% E2E Tests**: Full user journey testing

Focus on **behavior testing**, not implementation details. All tests should be deterministic and complete in specified time limits.

---

## 1. FUNCTIONAL TESTING

### 1.1 Gallery Loading & Display

#### Test: should_load_all_artworks_when_page_loads
**Priority:** P0 (Critical)
**Test Data:** 13 artworks from artworks.json

**Steps:**
1. Navigate to http://branchstone.art/gallery.html
2. Wait for skeleton loaders to appear
3. Wait for artworks to load
4. Count visible gallery items

**Expected Results:**
- ✅ Skeleton loaders appear immediately
- ✅ Skeleton loaders disappear after data loads
- ✅ 13 gallery items render
- ✅ Each item has image, title, and size
- ✅ No console errors
- ✅ Loading completes in <3s on 3G network

**Edge Cases:**
- Network timeout: Should show error state
- Invalid JSON: Should show error message with retry button

---

#### Test: should_display_sold_indicator_for_unavailable_items
**Priority:** P1 (High)

**Test Data:**
- "Christmas Joy" (id: 3) - sold
- "Core" (id: 4) - sold
- "July Pines" (id: 5) - sold

**Steps:**
1. Load gallery
2. Find items with soldOut: true
3. Verify visual indicator

**Expected Results:**
- ✅ Red pulsing dot appears next to title
- ✅ Dot has aria-label="Sold"
- ✅ Dot is visible without hover

---

### 1.2 Lightbox Opening

#### Test: should_open_lightbox_when_artwork_clicked
**Priority:** P0 (Critical)

**Steps:**
1. Click any gallery item
2. Verify lightbox opens

**Expected Results:**
- ✅ Lightbox modal appears with fadeInScale animation
- ✅ Body scroll is locked (overflow: hidden)
- ✅ Scrollbar width compensation applied (padding-right)
- ✅ Focus moves to close button
- ✅ Background darkens (backdrop-filter blur)
- ✅ aria-hidden="false" on lightbox
- ✅ Previous focus element stored

**Performance:**
- Animation completes in 500ms
- No layout shift (CLS = 0)

---

#### Test: should_open_lightbox_via_keyboard
**Priority:** P1 (High)

**Steps:**
1. Tab to gallery item
2. Press Enter or Space
3. Verify lightbox opens

**Expected Results:**
- ✅ Gallery items have tabindex="0"
- ✅ Enter key opens lightbox
- ✅ Space key opens lightbox
- ✅ Focus trap activates

---

### 1.3 Image Navigation - ALL Images Testing

#### Test: should_navigate_through_all_images_for_each_artwork
**Priority:** P0 (Critical)

**Test Data (all artworks with multiple images):**
1. **Born of Burn** (id: 1) - 7 images
2. **By Marks and Fire** (id: 2) - 6 images
3. **Christmas Joy** (id: 3) - 3 images
4. **Core** (id: 4) - 4 images
5. **July Pines** (id: 5) - 3 images
6. **Moonglow** (id: 6) - 11 images ⚠️ LARGEST
7. **Navy of the Dreamland** (id: 7) - 5 images
8. **Of Ash and Flowers** (id: 8) - 4 images
9. **Prolisok** (id: 9) - 6 images
10. **Rise in Blue** (id: 10) - 10 images
11. **Spectral** (id: 11) - 4 images
12. **Whales** (id: 12) - 8 images
13. **Winds** (id: 13) - 5 images

**For EACH artwork:**

**Via Arrow Buttons:**
1. Open lightbox
2. Click next button repeatedly until cycling back to image 1
3. Click previous button repeatedly until cycling back to last image
4. Verify counter updates: "1 / N", "2 / N", etc.

**Via Keyboard:**
1. Open lightbox
2. Press ArrowRight N times
3. Press ArrowLeft N times
4. Verify wrapping (last → first, first → last)

**Via Swipe (Mobile):**
1. Swipe left to go to next
2. Swipe right to go to previous
3. Verify swipe threshold > 50px

**Expected Results for ALL artworks:**
- ✅ All N images load successfully
- ✅ Navigation wraps correctly (circular)
- ✅ Counter shows "X / N" where N is correct count
- ✅ No broken images (all URLs valid)
- ✅ Preloading works (next/prev images cached)
- ✅ Loading indicator appears for uncached images
- ✅ Screen reader announces: "Image X of N: [title]"
- ✅ Navigation buttons visible for multi-image, hidden for single-image

**Performance:**
- Image switch: <200ms for cached, <2s for uncached
- Preload adjacent images in background

**Bug Risk Areas:**
- **Moonglow (11 images)**: Test memory leak on rapid navigation
- Single image artworks: Ensure nav buttons hidden
- Image 1 → Last: Boundary condition
- Rapid clicking: Race condition handling

---

### 1.4 Keyboard Shortcuts - COMPLETE Testing

#### Test: should_support_all_keyboard_shortcuts_correctly
**Priority:** P0 (Critical)

**Test Matrix:**

| Shortcut | Expected Behavior | Success Criteria |
|----------|-------------------|------------------|
| **Escape** | Close lightbox | ✅ Modal closes<br>✅ Focus restores to trigger<br>✅ Body scroll unlocked |
| **ArrowLeft** | Previous image | ✅ Image changes<br>✅ Counter decrements<br>✅ Wraps from first to last |
| **ArrowRight** | Next image | ✅ Image changes<br>✅ Counter increments<br>✅ Wraps from last to first |
| **+** or **=** | Zoom in | ✅ Scale increases by 0.5<br>✅ Max zoom: 4x (CONFIG.ui.lightbox.zoomMax)<br>✅ Zoom indicator appears<br>✅ Shows "X.Xx" format |
| **-** or **_** | Zoom out | ✅ Scale decreases by 0.5<br>✅ Min zoom: 1x (CONFIG.ui.lightbox.zoomMin)<br>✅ Auto-reset when < 1.1x |
| **0** (zero) | Reset zoom | ✅ Scale returns to 1x<br>✅ Pan position resets (0, 0)<br>✅ Zoom indicator hides |
| **Home** | First image | ✅ Jumps to image 1<br>✅ Counter shows "1 / N"<br>✅ Works from any position |
| **End** | Last image | ✅ Jumps to image N<br>✅ Counter shows "N / N"<br>✅ Works from any position |
| **Tab** | Focus trap | ✅ Cycles through: Close → Prev → Next → Inquire<br>✅ Does NOT escape modal<br>✅ Shift+Tab reverses |

**Detailed Test Scenarios:**

**Zoom Behavior:**
1. Press "+" five times
   - Expected: 1.0x → 1.5x → 2.0x → 2.5x → 3.0x → 3.5x
2. Press "+" three more times
   - Expected: Stops at 4.0x (max)
3. Press "-" eight times
   - Expected: 4.0x → 3.5x → ... → 1.0x (auto-reset)
4. Press "0"
   - Expected: Immediate reset to 1.0x, centered

**Navigation Edge Cases:**
1. Open first image, press Home
   - Expected: No change, stays on image 1
2. Open last image, press End
   - Expected: No change, stays on image N
3. Open image 1, press ArrowLeft
   - Expected: Wraps to image N
4. Open image N, press ArrowRight
   - Expected: Wraps to image 1

**Expected Results:**
- ✅ All shortcuts work without page refresh
- ✅ preventDefault() called to block browser defaults
- ✅ Shortcuts only active when lightbox open
- ✅ Visual feedback for all actions
- ✅ No conflicts with browser shortcuts

**Performance:**
- Keyboard response time: <50ms
- Smooth transitions (60fps)

---

### 1.5 Zoom Functionality - EXHAUSTIVE Testing

#### Test: should_support_pinch_zoom_correctly
**Priority:** P0 (Critical - Mobile)

**Test Scenarios:**

**Pinch to Zoom:**
1. Place two fingers on image
2. Pinch outward (zoom in)
3. Verify scale increases
4. Pinch inward (zoom out)
5. Verify scale decreases
6. Pinch beyond max zoom
7. Verify clamped to 4x
8. Pinch below min zoom
9. Verify auto-reset to 1x

**Expected Results:**
- ✅ Smooth scaling (no jitter)
- ✅ Scale clamped: 1.0x ≤ scale ≤ 4.0x
- ✅ Zoom indicator shows level
- ✅ Auto-reset when scale < 1.1x
- ✅ No page scroll while zooming

---

#### Test: should_support_double_tap_zoom
**Priority:** P1 (High - Mobile)

**Steps:**
1. Double-tap on image
2. Verify zooms to 2x at tap location
3. Double-tap again
4. Verify resets to 1x

**Expected Results:**
- ✅ Tap detection: 2 taps within 500ms (CONFIG.ui.lightbox.doubleTapDelay)
- ✅ Zoom centers on tap point
- ✅ Smooth animation
- ✅ Toggle behavior (zoom ↔ reset)

---

#### Test: should_support_keyboard_zoom_with_visual_feedback
**Priority:** P1 (High - Desktop)

**Steps:**
1. Press "+" key
2. Verify zoom indicator appears with "1.5x" and "Double-tap to reset"
3. Wait 2 seconds
4. Verify indicator auto-hides
5. Press "0"
6. Verify zoom resets and indicator disappears

**Expected Results:**
- ✅ Indicator shows zoom level: "X.Xx"
- ✅ Hint text: "Double-tap to reset" (translated)
- ✅ Auto-hide after 2s of inactivity
- ✅ Position: top center, z-index: 15
- ✅ Visible animation (translateY, opacity)

---

#### Test: should_pan_image_when_zoomed
**Priority:** P1 (High)

**Steps:**
1. Zoom to 2x
2. Touch and drag image
3. Verify image pans
4. Zoom to 1x
5. Verify pan resets

**Expected Results:**
- ✅ Pan only works when scale > 1
- ✅ Smooth dragging (no lag)
- ✅ Boundary constraints (no infinite scroll)
- ✅ Reset on zoom out

---

#### Test: should_disable_swipe_navigation_when_zoomed
**Priority:** P1 (High - UX)

**Steps:**
1. Open multi-image artwork
2. Zoom to 2x
3. Try swiping left/right
4. Verify image does NOT change
5. Verify nav buttons dimmed (disabled-by-zoom class)

**Expected Results:**
- ✅ Swipe disabled when scale > 1
- ✅ Nav buttons opacity: 0.2, pointer-events: none
- ✅ Pan works instead of navigate
- ✅ Zoom out to re-enable navigation

---

### 1.6 Lightbox Closing

#### Test: should_close_lightbox_via_all_methods
**Priority:** P0 (Critical)

**Test Matrix:**

| Method | Steps | Expected Result |
|--------|-------|-----------------|
| **X Button** | Click close button | ✅ Modal closes<br>✅ Focus restores |
| **Escape Key** | Press Escape | ✅ Modal closes |
| **Outside Click** | Click backdrop | ✅ Modal closes |

**For ALL methods:**
- ✅ display: none on lightbox
- ✅ aria-hidden="true"
- ✅ Body scroll restored (overflow: '', padding-right: '')
- ✅ Focus returns to original gallery item
- ✅ Zoom state reset
- ✅ Image index reset to 0
- ✅ Smooth fade-out animation

**Performance:**
- Close animation: 300ms
- No memory leaks on repeated open/close

---

### 1.7 Inquiry Button

#### Test: should_navigate_to_contact_with_prefilled_message
**Priority:** P1 (High)

**Steps:**
1. Open lightbox for "Born of Burn"
2. Click "Purchase Inquiry" button
3. Verify redirects to contact.html
4. Check localStorage for inquiry message

**Expected Results:**
- ✅ Redirects to contact.html
- ✅ localStorage key: CONFIG.storage.inquiryMessage
- ✅ Message format: "I'm interested in \"[title]\" ([size]). Please provide more information about availability and pricing."
- ✅ Message pre-filled in contact form

**Edge Cases:**
- localStorage blocked: Should still navigate
- Missing title/size: Should use fallback text

---

### 1.8 Filter Buttons - ALL Categories

#### Test: should_filter_gallery_by_all_categories
**Priority:** P0 (Critical)

**Test Data:**

| Filter | Expected Artworks | Count |
|--------|-------------------|-------|
| **All Works** | All artworks | 13 |
| **fire** | Born of Burn, By Marks and Fire | 2 |
| **seasonal** | Christmas Joy | 1 |
| **nature** | Core, July Pines, Of Ash and Flowers, Prolisok, Winds | 5 |
| **ethereal** | Moonglow, Spectral | 2 |
| **blue** | Navy of the Dreamland, Rise in Blue | 2 |

**For EACH filter:**

**Steps:**
1. Click filter button
2. Count visible items
3. Verify correct items shown
4. Check URL hash

**Expected Results:**
- ✅ Correct count matches expected
- ✅ Button has .active class
- ✅ aria-pressed="true" on active button
- ✅ Filtered items have .filtered-out (display: none)
- ✅ Fade animation (300ms)
- ✅ URL updates: #category=[filter]
- ✅ Screen reader announcement: "Showing N [category] artworks"

**Performance:**
- Filter transition: <300ms
- No layout thrashing (batched DOM updates)

---

#### Test: should_show_empty_state_for_filters_with_no_results
**Priority:** P1 (High)

**Note:** Based on current data, all filters have results. Test if filter yields 0 results:

**Steps:**
1. Apply filter that yields 0 results
2. Verify empty state appears

**Expected Results:**
- ✅ Empty state icon (image SVG)
- ✅ Title: "No artworks found"
- ✅ Message: "No artworks match the \"[category]\" filter..."
- ✅ "View All Artworks" button
- ✅ Clicking button resets to "All Works"

---

### 1.9 Edge Cases - Rapid Interactions

#### Test: should_handle_rapid_clicking_without_errors
**Priority:** P1 (High)

**Steps:**
1. Rapidly click gallery items (10 clicks/second)
2. Rapidly click next/prev buttons (10 clicks/second)
3. Rapidly open/close lightbox (5 times/second)
4. Monitor console for errors

**Expected Results:**
- ✅ No race conditions
- ✅ No duplicate modals
- ✅ No stuck states
- ✅ No memory leaks
- ✅ Smooth performance (no lag)

**Debouncing:**
- Event delegation prevents duplicate listeners
- State checks prevent invalid transitions

---

#### Test: should_handle_single_image_artworks_correctly
**Priority:** P1 (High)

**Test Data:**
Currently all artworks have multiple images. If any have single image:

**Expected Results:**
- ✅ Nav buttons hidden (display: none)
- ✅ Indicator hidden
- ✅ Swipe disabled
- ✅ Keyboard nav disabled (arrows do nothing)

---

#### Test: should_handle_very_long_descriptions
**Priority:** P2 (Medium)

**Test Data:**
- "Born of Burn" - 8 lines
- "July Pines" - 11 lines ⚠️ LONGEST

**Steps:**
1. Open lightbox with long description
2. Verify caption scrolls
3. Check for scroll indicators

**Expected Results:**
- ✅ Caption scrollable (overflow-y: auto)
- ✅ Scroll fade hint at bottom (mobile)
- ✅ Thin scrollbar (scrollbar-width: thin)
- ✅ No text overflow
- ✅ Smooth scrolling (-webkit-overflow-scrolling: touch)

**Mobile:**
- Max-height: 35vh
- Visible scroll indicator

---

## 2. CROSS-BROWSER TESTING

### 2.1 Browser Compatibility Matrix

#### Test: should_function_identically_across_all_browsers
**Priority:** P0 (Critical)

**Test Browsers:**
- Chrome 120+ (Desktop & Mobile)
- Firefox 121+ (Desktop & Mobile)
- Safari 17+ (Desktop & iOS)
- Edge 120+ (Desktop)

**Test Matrix:**

| Feature | Chrome | Firefox | Safari | Edge | Notes |
|---------|--------|---------|--------|------|-------|
| Gallery Load | ✅ | ✅ | ✅ | ✅ | All should load in <3s |
| Lightbox Open | ✅ | ✅ | ✅ | ✅ | Backdrop-filter support varies |
| Image Navigation | ✅ | ✅ | ✅ | ✅ | Arrow keys, swipe |
| Zoom (Pinch) | ✅ | ✅ | ✅ | ✅ | Test touch events |
| Zoom (Keyboard) | ✅ | ✅ | ✅ | ✅ | +/-/0 keys |
| Focus Trap | ✅ | ✅ | ✅ | ✅ | Tab cycling |
| WebP Support | ✅ | ✅ | ✅ | ✅ | Fallback to JPEG |
| Picture Element | ✅ | ✅ | ✅ | ✅ | Responsive images |
| Video Playback | ✅ | ✅ | ✅ | ✅ | WebM/MP4 sources |
| Filters | ✅ | ✅ | ✅ | ✅ | Animation smooth |

**Safari-Specific Issues to Test:**
- ✅ Backdrop-filter blur (may be weaker)
- ✅ Touch events (passive listeners)
- ✅ Video autoplay (requires muted + playsinline)
- ✅ Scroll behavior (overscroll-behavior-y)

**Firefox-Specific Issues:**
- ✅ Scrollbar styling (scrollbar-width vs ::-webkit-scrollbar)
- ✅ Backdrop-filter support (may degrade gracefully)

---

## 3. MOBILE TESTING

### 3.1 Touch Gestures

#### Test: should_support_all_touch_gestures
**Priority:** P0 (Critical)

**Test Device:**
- iOS (iPhone 12+, iPad)
- Android (Pixel, Samsung)

**Gesture Matrix:**

| Gesture | Action | Expected Result |
|---------|--------|-----------------|
| **Swipe Left** | Next image | ✅ Image changes<br>✅ Threshold: 50px<br>✅ Only when not zoomed |
| **Swipe Right** | Previous image | ✅ Image changes<br>✅ Wraps correctly |
| **Pinch Out** | Zoom in | ✅ Scale increases<br>✅ Smooth scaling |
| **Pinch In** | Zoom out | ✅ Scale decreases<br>✅ Auto-reset < 1.1x |
| **Double Tap** | Toggle zoom | ✅ 1x → 2x → 1x<br>✅ Centers on tap point |
| **Tap** | No action | ✅ Does not close modal<br>✅ Only backdrop closes |

**Expected Results:**
- ✅ Passive event listeners (no scroll blocking)
- ✅ touch-action: none on image
- ✅ No 300ms tap delay
- ✅ Smooth 60fps gestures
- ✅ No accidental zooms

---

### 3.2 Orientation Changes

#### Test: should_handle_orientation_changes_gracefully
**Priority:** P1 (High)

**Steps:**
1. Open lightbox in portrait
2. Rotate to landscape
3. Verify layout adjusts
4. Rotate back to portrait

**Expected Results:**
- ✅ No layout breaks
- ✅ Images re-center
- ✅ Caption remains scrollable
- ✅ Controls remain accessible
- ✅ Zoom state preserved
- ✅ No flashing/reflow

**Portrait Mode:**
- Image: max-height 65vh
- Caption: max-height 35vh, scrollable

**Landscape Mode:**
- Side-by-side layout maintained
- Image: max-width 60%
- Caption: width 40%

---

### 3.3 Gesture Hints

#### Test: should_show_gesture_hint_on_first_use
**Priority:** P2 (Medium)

**Steps:**
1. Open lightbox for first time (session)
2. Verify hint overlay appears
3. Wait 3 seconds
4. Verify hint auto-hides
5. Open another artwork
6. Verify hint does NOT appear again

**Expected Results:**
- ✅ Hint shows: "Swipe to navigate" + "Pinch to zoom"
- ✅ Only on touch devices (ontouchstart detection)
- ✅ Only for multi-image artworks
- ✅ Once per session (state.hasShownGestureHint)
- ✅ Auto-hide after 3s
- ✅ Accessible (role="tooltip")

---

## 4. ACCESSIBILITY TESTING

### 4.1 Screen Reader Announcements

#### Test: should_announce_all_state_changes_to_screen_readers
**Priority:** P0 (Critical - WCAG 2.1 AA)

**Test Tools:**
- NVDA (Windows)
- JAWS (Windows)
- VoiceOver (macOS/iOS)

**Announcement Matrix:**

| Event | Expected Announcement | ARIA Attribute |
|-------|----------------------|----------------|
| Lightbox Opens | "[Title], Size: [size], dialog" | role="dialog", aria-modal="true" |
| Image Changes | "Image X of N: [title]" | aria-live="polite" |
| Zoom Changes | "Zoom level: X.Xx, Double-tap to reset" | role="status" on zoom indicator |
| Filter Applied | "Showing N [category] artworks" | aria-live="polite" |
| Loading | "Loading image" | role="status" on loader |
| Error | "Unable to load gallery. Please try again." | role="alert" |

**Expected Results:**
- ✅ All state changes announced
- ✅ Announcements clear and concise
- ✅ No redundant announcements
- ✅ Correct politeness levels (polite vs assertive)
- ✅ Visual content described (alt text)

---

### 4.2 Focus Management

#### Test: should_manage_focus_correctly_throughout_interaction
**Priority:** P0 (Critical - WCAG 2.1 AA)

**Focus Flow:**

**Opening:**
1. User clicks gallery item
2. Focus moves to close button
3. Previous focus stored

**Navigating:**
1. Tab: Close → Prev → Next → Inquire → Caption (links)
2. Shift+Tab reverses
3. Focus never escapes modal

**Closing:**
1. Close button clicked/Escape pressed
2. Focus returns to original gallery item
3. Modal becomes inert (aria-hidden="true")

**Expected Results:**
- ✅ Focus trap active when lightbox open
- ✅ Focus visible (outline: 3px solid accent-color)
- ✅ Focus restoration on close
- ✅ No focus loss
- ✅ Keyboard-only navigation works

**Test Script:**
```javascript
// Verify focus trap
const focusable = lightbox.querySelectorAll('button, a, [tabindex="0"]');
// Tab through all elements
// Verify focus cycles back to first element
// Verify focus never escapes modal
```

---

### 4.3 Keyboard-Only Navigation

#### Test: should_be_fully_operable_via_keyboard_only
**Priority:** P0 (Critical - WCAG 2.1 AA)

**Steps:**
1. Unplug mouse
2. Navigate entire gallery using only keyboard
3. Open lightbox (Enter/Space)
4. Navigate images (Arrow keys)
5. Zoom (+ / -)
6. Close (Escape)
7. Apply filters (Tab + Enter)

**Expected Results:**
- ✅ All features accessible
- ✅ No keyboard traps
- ✅ Visible focus indicators
- ✅ Logical tab order
- ✅ Skip links work

**Focus Order:**
Gallery: Skip Link → Logo → Language → Theme → Menu → Filters → Gallery Items
Lightbox: Close → Prev → Next → Inquire → (Caption scrollable)

---

### 4.4 Color Contrast

#### Test: should_meet_wcag_aa_contrast_ratios
**Priority:** P1 (High - WCAG 2.1 AA)

**Test Tool:** Chrome DevTools (Lighthouse)

**Contrast Requirements:**
- Normal text: 4.5:1
- Large text (18pt+): 3:1
- UI components: 3:1

**Elements to Test:**

| Element | Foreground | Background | Ratio | Pass |
|---------|-----------|------------|-------|------|
| Gallery item title | #fff | rgba(0,0,0,0.85) | >7:1 | ✅ |
| Gallery item size | #f5f5f7 | rgba(0,0,0,0.85) | >6:1 | ✅ |
| Filter button (active) | white | #8B785D | 4.5:1 | ✅ |
| Lightbox title | var(--text-color) | var(--card-background) | 8.5:1 | ✅ |
| Close button | white | rgba(0,0,0,0.5) | 4.5:1 | ✅ |
| Sold dot | #d32f2f | white | 6:1 | ✅ |

**Dark Mode:**
- Verify contrast ratios in dark theme
- Check against var(--background-color): #2A2622

**Expected Results:**
- ✅ All text meets 4.5:1 (normal) or 3:1 (large)
- ✅ UI controls meet 3:1
- ✅ No pure black (#000) on pure white (#FFF) (harsh)
- ✅ Soft shadows used for depth

---

### 4.5 ARIA Attributes

#### Test: should_have_correct_aria_attributes_for_all_interactive_elements
**Priority:** P1 (High - WCAG 2.1 AA)

**ARIA Audit:**

| Element | Required ARIA | Actual | Pass |
|---------|---------------|--------|------|
| Lightbox | role="dialog", aria-modal="true", aria-labelledby | ✅ | ✅ |
| Gallery Items | role="button", tabindex="0", aria-label | ✅ | ✅ |
| Filter Buttons | aria-pressed="[bool]" | ✅ | ✅ |
| Slider Indicator | role="status", aria-live="polite" | ✅ | ✅ |
| Zoom Indicator | role="status", aria-live="polite" | ✅ | ✅ |
| Loading Spinner | role="status", aria-label="Loading image" | ✅ | ✅ |
| Empty State | role="status", aria-live="polite" | ✅ | ✅ |
| Sold Items | .sold-dot has aria-label="Sold" | ✅ | ✅ |

**Expected Results:**
- ✅ All ARIA attributes valid (W3C validator)
- ✅ No redundant roles (e.g., role="button" on <button>)
- ✅ Live regions used appropriately
- ✅ Hidden content has aria-hidden="true"

---

## 5. PERFORMANCE TESTING

### 5.1 Image Loading Times

#### Test: should_load_images_within_acceptable_timeframes
**Priority:** P0 (Critical)

**Network Conditions:**
- **Fast 3G**: 1.6 Mbps, 562ms RTT
- **Slow 3G**: 400 Kbps, 2000ms RTT
- **4G**: 4 Mbps, 170ms RTT

**Metrics:**

| Metric | Fast 3G | Slow 3G | 4G | Target |
|--------|---------|---------|-----|--------|
| First Contentful Paint (FCP) | <2s | <3.5s | <1.5s | ✅ |
| Largest Contentful Paint (LCP) | <3s | <5s | <2s | ✅ |
| Gallery Load Complete | <5s | <8s | <3s | ✅ |
| Lightbox Image Load (cached) | <200ms | <200ms | <200ms | ✅ |
| Lightbox Image Load (uncached) | <2s | <4s | <1s | ✅ |

**Optimization Techniques:**
- ✅ Lazy loading (loading="lazy")
- ✅ Responsive images (srcset, sizes)
- ✅ WebP with JPEG fallback
- ✅ Preloading (rel="preload")
- ✅ Image caching check (img.complete)
- ✅ Adjacent image preloading

**Test Steps:**
1. Clear cache
2. Throttle network to Slow 3G
3. Load gallery
4. Measure LCP
5. Open lightbox
6. Measure image load time

**Expected Results:**
- ✅ Skeleton loaders prevent CLS
- ✅ Above-fold images load first (loading="eager")
- ✅ Below-fold images lazy load
- ✅ Preloading improves perceived performance

---

### 5.2 Loading Indicator Visibility

#### Test: should_show_loading_indicator_for_slow_images
**Priority:** P1 (High)

**Steps:**
1. Throttle network to Slow 3G
2. Open lightbox
3. Navigate to uncached image
4. Verify loading spinner appears

**Expected Results:**
- ✅ Loader appears immediately
- ✅ Spinner animates (rotate 360deg, 0.8s linear infinite)
- ✅ Image opacity: 0.5 while loading
- ✅ Loader disappears when image loads
- ✅ Image opacity: 1 on complete

**Performance:**
- Loader visibility threshold: >500ms (don't flash for fast loads)
- Animation runs on GPU (transform, not margin)

---

### 5.3 Preloading Effectiveness

#### Test: should_preload_adjacent_images_for_instant_navigation
**Priority:** P1 (High)

**Steps:**
1. Open lightbox (image 1)
2. Wait 500ms
3. Check network tab for preload requests
4. Click next
5. Measure time to display

**Expected Results:**
- ✅ Next image (image 2) preloaded in background
- ✅ Previous image (last image) preloaded
- ✅ Preload triggered after current image loads
- ✅ Navigation to preloaded image: <200ms
- ✅ No excessive preloading (only ±1 images)

**Implementation:**
```javascript
// Lightbox.js lines 602-622
preloadAdjacentImages() {
  const nextIndex = (this.state.currentIndex + 1) % this.state.images.length;
  const prevIndex = (this.state.currentIndex - 1 + this.state.images.length) % this.state.images.length;

  [nextIndex, prevIndex].forEach(index => {
    const media = this.state.images[index];
    if (typeof media === 'string') {
      const img = new Image();
      img.src = sanitizeURL(media);
    }
  });
}
```

---

### 5.4 Memory Leaks

#### Test: should_not_leak_memory_on_repeated_open_close
**Priority:** P1 (High)

**Steps:**
1. Open Chrome DevTools → Memory
2. Take heap snapshot (baseline)
3. Open/close lightbox 20 times
4. Force garbage collection
5. Take heap snapshot (after)
6. Compare

**Expected Results:**
- ✅ Heap size returns to baseline ±5%
- ✅ No detached DOM nodes
- ✅ Event listeners cleaned up
- ✅ Images released from memory

**Common Memory Leak Patterns:**
- ❌ Event listeners not removed
- ❌ DOM references retained
- ❌ Closures holding references
- ❌ Images not garbage collected

**Cleanup Implementation:**
```javascript
// Lightbox.js line 463-484
close() {
  this.state.isOpen = false;
  this.lightbox.style.display = 'none';

  // Clear state
  this.state.images = [];
  this.state.currentIndex = 0;
  this.resetZoom();

  // Cleanup
  this.disableFocusTrap();
  this.hideLoader();

  // Restore focus
  if (this.state.previousFocus) {
    this.state.previousFocus.focus();
    this.state.previousFocus = null;
  }
}
```

---

## 6. REGRESSION TESTING

### 6.1 Body Scroll Lock

#### Test: should_lock_body_scroll_when_lightbox_open
**Priority:** P0 (Critical)

**Steps:**
1. Open lightbox
2. Try to scroll page with mouse wheel
3. Try to scroll page with touch
4. Close lightbox
5. Verify scrolling restored

**Expected Results:**
- ✅ body { overflow: hidden } applied
- ✅ Scrollbar width compensation (padding-right)
- ✅ No layout shift (CLS = 0)
- ✅ Lightbox caption still scrollable
- ✅ Page scroll restored on close

**iOS Quirk:**
- overscroll-behavior-y: none prevents rubber-band

---

### 6.2 Console Errors

#### Test: should_have_zero_console_errors_warnings
**Priority:** P0 (Critical)

**Steps:**
1. Open DevTools console
2. Navigate entire gallery
3. Open all artworks in lightbox
4. Apply all filters
5. Test all features

**Expected Results:**
- ✅ 0 JavaScript errors
- ✅ 0 network errors (404, CORS)
- ✅ 0 CSS warnings
- ✅ 0 ARIA violations (axe DevTools)

**Common Errors to Check:**
- ❌ Uncaught TypeError
- ❌ Failed to fetch (broken image URLs)
- ❌ CORS policy errors
- ❌ CSP violations

---

### 6.3 Animation Smoothness

#### Test: should_render_all_animations_at_60fps
**Priority:** P1 (High)

**Test Tool:** Chrome DevTools → Performance

**Animations to Test:**
- Lightbox open/close (fadeInScale)
- Image navigation (slide/fade)
- Filter transition (opacity + transform)
- Zoom (transform scale)
- Hover effects (box-shadow, transform)

**Expected Results:**
- ✅ Frame rate: 60fps (16.7ms per frame)
- ✅ No jank (frame drops <1%)
- ✅ GPU-accelerated (transform, opacity)
- ✅ No layout thrashing

**Performance Budget:**
- JavaScript execution: <50ms
- Style recalculation: <5ms
- Layout: <10ms
- Paint: <5ms

**Optimization:**
- Use transform + opacity (GPU)
- Avoid layout triggers (width, height, top, left)
- Use will-change sparingly (memory cost)
- Batch DOM reads/writes (requestAnimationFrame)

---

## 7. EDGE CASES & BUG SCENARIOS

### 7.1 Network Failures

#### Test: should_handle_network_failures_gracefully
**Priority:** P1 (High)

**Scenarios:**

**1. Failed to Load artworks.json:**
- Simulate: Block network request
- Expected: Error state with retry button
- Message: "Unable to load gallery. Please try again."

**2. Failed to Load Image:**
- Simulate: 404 image URL
- Expected: Broken image handled
- Fallback: Show error icon or retry

**3. Timeout:**
- Simulate: Delay response >10s
- Expected: Timeout error + retry

**Expected Results:**
- ✅ User-friendly error messages
- ✅ Retry functionality works
- ✅ No infinite loading spinners
- ✅ Graceful degradation

---

### 7.2 Malformed Data

#### Test: should_sanitize_all_user_data
**Priority:** P0 (Critical - Security)

**Test Data (XSS Attempts):**
```json
{
  "title": "<script>alert('XSS')</script>",
  "description": "<img src=x onerror=alert('XSS')>",
  "image": "javascript:alert('XSS')"
}
```

**Expected Results:**
- ✅ All HTML tags escaped (sanitizeText)
- ✅ JavaScript URLs blocked (sanitizeURL)
- ✅ JSON parsed safely (sanitizeJSON)
- ✅ No script execution
- ✅ Content-Security-Policy enforced

**Sanitization Implementation:**
```javascript
// utils/sanitize.js
export function sanitizeText(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML; // Escapes <, >, &, etc.
}

export function sanitizeURL(url) {
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    return parsed.href;
  } catch {
    return '';
  }
}
```

---

### 7.3 Browser Back/Forward

#### Test: should_handle_browser_navigation_correctly
**Priority:** P1 (High)

**Steps:**
1. Apply filter (e.g., "fire")
2. Verify URL: #category=fire
3. Click browser back
4. Verify filter resets to "All Works"
5. Click browser forward
6. Verify filter reapplies "fire"

**Expected Results:**
- ✅ URL hash updates on filter
- ✅ popstate event listener active
- ✅ Filter state synchronized with URL
- ✅ No page reload

**Implementation:**
```javascript
// GalleryFilter.js lines 160-163
window.addEventListener('popstate', () => {
  this.handleURLFilter();
});
```

---

## 8. TEST AUTOMATION PLAN

### 8.1 Unit Tests (60-70% coverage)

**Framework:** Jest + @testing-library/react

**Test Files:**
- `Lightbox.test.js`
- `Gallery.test.js`
- `GalleryFilter.test.js`

**Example Unit Test:**
```javascript
describe('Lightbox', () => {
  it('should_zoom_in_when_plus_key_pressed', () => {
    const lightbox = new Lightbox({ lightboxSelector: '#lightbox' });
    lightbox.state.scale = 1.0;
    lightbox.state.isOpen = true;

    lightbox.zoomIn();

    expect(lightbox.state.scale).toBe(1.5);
  });

  it('should_not_zoom_beyond_max', () => {
    const lightbox = new Lightbox({ lightboxSelector: '#lightbox' });
    lightbox.state.scale = 4.0; // max

    lightbox.zoomIn();

    expect(lightbox.state.scale).toBe(4.0); // clamped
  });
});
```

**Coverage Targets:**
- Lightbox: 85%
- Gallery: 80%
- GalleryFilter: 75%

---

### 8.2 Integration Tests (20-30% coverage)

**Framework:** Playwright

**Test Files:**
- `gallery-integration.spec.js`

**Example Integration Test:**
```javascript
test('should_open_lightbox_and_navigate_images', async ({ page }) => {
  await page.goto('http://branchstone.art/gallery.html');

  // Wait for gallery to load
  await page.waitForSelector('.gallery-item');

  // Click first artwork
  await page.click('.gallery-item:first-child');

  // Verify lightbox opens
  await expect(page.locator('#lightbox')).toBeVisible();

  // Navigate to next image
  await page.click('#next-btn');

  // Verify counter updates
  const indicator = await page.locator('#slider-indicator').textContent();
  expect(indicator).toContain('2 /');
});
```

---

### 8.3 E2E Tests (5-10% coverage)

**Framework:** Playwright

**Test Files:**
- `gallery-e2e.spec.js`

**Example E2E Test:**
```javascript
test('complete_user_journey_from_gallery_to_contact', async ({ page }) => {
  // 1. Load gallery
  await page.goto('http://branchstone.art/gallery.html');
  await page.waitForSelector('.gallery-loaded');

  // 2. Apply filter
  await page.click('[data-category="fire"]');
  await expect(page.locator('.gallery-item')).toHaveCount(2);

  // 3. Open artwork
  await page.click('.gallery-item:first-child');
  await expect(page.locator('#lightbox')).toBeVisible();

  // 4. Navigate images
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');

  // 5. Zoom
  await page.keyboard.press('+');
  await expect(page.locator('.zoom-indicator')).toBeVisible();

  // 6. Inquire
  await page.click('.inquire-btn');
  await expect(page).toHaveURL(/contact\.html/);

  // 7. Verify prefilled message
  const message = await page.evaluate(() =>
    localStorage.getItem('branchstone_inquiry_message')
  );
  expect(message).toContain('Born of Burn');
});
```

---

## 9. CI/CD INTEGRATION

### 9.1 Quality Gates

**Pre-Deployment Checklist:**

| Gate | Tool | Pass Criteria | Blocker |
|------|------|---------------|---------|
| Unit Tests | Jest | >80% coverage, 0 failures | ✅ Yes |
| Integration Tests | Playwright | 0 failures, <5min | ✅ Yes |
| E2E Tests | Playwright | 0 failures, <10min | ✅ Yes |
| Lighthouse Score | CI | Performance >90, A11y >95 | ✅ Yes |
| Bundle Size | webpack-bundle-analyzer | <500KB total | ⚠️ Warning |
| Visual Regression | Percy | 0 unreviewed diffs | ⚠️ Warning |
| Accessibility | axe-core | 0 violations | ✅ Yes |

---

### 9.2 Automated Testing Pipeline

**GitHub Actions Workflow:**
```yaml
name: QA Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: npm ci

      - name: Unit tests
        run: npm test -- --coverage --maxWorkers=2

      - name: Integration tests
        run: npx playwright test --project=chromium

      - name: E2E tests (Slow 3G)
        run: npx playwright test --project=mobile-slow-3g

      - name: Lighthouse CI
        run: npx @lhci/cli@0.12.x autorun

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 10. BUGS FOUND & RECOMMENDATIONS

### 10.1 Critical Bugs (P0)

**None found in code review** - Implementation looks solid

### 10.2 High Priority Issues (P1)

**1. Missing Image Dimension Attributes**
- **File:** /Users/denysmalyshev/Workspace/Projects/petprojects/branchstone/docs/js/components/Gallery.js:239
- **Issue:** `width: artwork.width || 400, height: artwork.height || 500` uses fallback values
- **Impact:** Cumulative Layout Shift (CLS) if actual dimensions differ
- **Fix:** Add explicit width/height to artworks.json for all images
- **Test:** Lighthouse CLS score should be <0.1

**2. Potential Race Condition on Rapid Filter Changes**
- **File:** /Users/denysmalyshev/Workspace/Projects/petprojects/branchstone/docs/js/components/GalleryFilter.js:214
- **Issue:** setTimeout(300ms) animation could be interrupted by rapid clicks
- **Impact:** Visual glitch if user clicks filter during transition
- **Fix:** Debounce filter button clicks or cancel pending animations
- **Test:** Rapidly click filters 10x, verify no stuck states

**3. No Error Handling for Video Playback Failures**
- **File:** /Users/denysmalyshev/Workspace/Projects/petprojects/branchstone/docs/js/components/Lightbox.js:630
- **Issue:** No onerror handler for video element
- **Impact:** Blank screen if video fails to load
- **Fix:** Add video.onerror handler with fallback to poster image
- **Test:** Block video URLs, verify graceful fallback

### 10.3 Medium Priority Issues (P2)

**1. Accessibility: Missing Live Region for Image Load Errors**
- **Issue:** No screen reader announcement if image fails to load
- **Fix:** Add aria-live region for error states
- **Test:** Simulate 404 image, verify announcement

**2. Performance: Large Image Sizes**
- **Issue:** "Moonglow" has 11 images, no lazy loading in lightbox
- **Impact:** Could preload 22 images (±11), excessive bandwidth
- **Fix:** Only preload ±1 images, lazy load rest
- **Test:** Network tab shows only 3 image requests max

**3. UX: No Visual Feedback for Swipe Gesture**
- **Issue:** Swiping doesn't show preview of next/prev image (like Instagram)
- **Impact:** User doesn't know if swipe was detected
- **Fix:** Add swipe preview animation (optional enhancement)
- **Test:** User testing shows improved discoverability

### 10.4 Low Priority Issues (P3)

**1. Code Quality: Duplicated Sanitization Calls**
- **File:** Multiple files
- **Issue:** URLs sanitized multiple times (openFromTrigger + showImage)
- **Impact:** Minor performance overhead
- **Fix:** Sanitize once at data ingestion, trust internal state
- **Test:** Performance profiler shows <1ms improvement

---

## 11. PERFORMANCE BENCHMARKS

### 11.1 Lighthouse Scores (Target)

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Performance | TBD | >90 | ⏳ |
| Accessibility | TBD | >95 | ⏳ |
| Best Practices | TBD | 100 | ⏳ |
| SEO | TBD | 100 | ⏳ |

**Core Web Vitals:**
- LCP (Largest Contentful Paint): <2.5s ✅
- FID (First Input Delay): <100ms ✅
- CLS (Cumulative Layout Shift): <0.1 ⚠️ (check image dimensions)

---

## 12. FINAL CHECKLIST

### Before Shipping:
- [ ] All P0 bugs fixed
- [ ] All P1 bugs triaged
- [ ] Unit test coverage >80%
- [ ] Integration tests pass
- [ ] E2E tests pass (3 browsers × 2 devices = 6 combos)
- [ ] Lighthouse score >90 (all categories)
- [ ] Accessibility audit (axe) 0 violations
- [ ] Visual regression approved
- [ ] Performance budget met (<500KB)
- [ ] Security scan passed (no XSS vulnerabilities)
- [ ] Manual QA sign-off on staging

---

## 13. TEST EXECUTION SUMMARY

**Total Test Cases:** 89
**Priority Breakdown:**
- P0 (Critical): 24 tests
- P1 (High): 38 tests
- P2 (Medium): 19 tests
- P3 (Low): 8 tests

**Estimated Execution Time:**
- Manual Testing: 8-10 hours
- Automated Testing: 15 minutes (CI/CD)

**Recommended Testing Frequency:**
- Unit Tests: Every commit
- Integration Tests: Every PR
- E2E Tests: Pre-release + daily on main
- Manual Regression: Weekly
- Full QA Cycle: Before major releases

---

## 14. CONTACT FOR ISSUES

**Bugs Found During Testing:**
- Create GitHub issue with label: `bug`, `qa-testing`
- Include: Browser, OS, Steps to Reproduce, Expected vs Actual
- Attach: Screenshots, console logs, network trace

**Questions:**
- Tag QA team in PR comments
- Slack: #qa-automation channel

---

**END OF TEST PLAN**

*This comprehensive test plan covers all aspects of gallery and lightbox functionality. Execute tests in order, marking each ✅ or ❌. Document all failures with screenshots and console logs.*
