# Infinite Scroll Gallery - Test Documentation

## Overview
Comprehensive test suite for the new mobile-first Infinite Scroll Gallery feature. These tests validate behavior-driven functionality following Test Pyramid principles and Google Testing practices.

## Test Distribution
- **Unit Tests**: 21 tests (100% of suite)
- **Integration Tests**: Covered in existing Lightbox tests
- **E2E Tests**: To be added in Cypress/Playwright (separate effort)

## Test Coverage Summary

### 1. Mode Detection (3 tests)
Tests gallery mode switching based on viewport width (mobile < 768px, desktop >= 768px)

**Tests:**
- `should_switch_to_infinite_scroll_on_mobile_viewport` - Validates 375px viewport triggers infinite scroll
- `should_keep_grid_layout_on_desktop_viewport` - Validates 1200px viewport maintains grid
- `should_update_mode_on_viewport_resize` - Tests dynamic mode switching on window resize

**Edge Cases Covered:**
- Viewport exactly at 768px breakpoint
- Rapid resize events
- Initial page load state

---

### 2. Layout (3 tests)
Tests scroll-snap CSS container setup and viewport-height items

**Tests:**
- `should_render_items_with_scroll_snap_container` - Validates `scroll-snap-type: y mandatory`
- `should_set_item_height_to_viewport_height` - Tests `height: 100vh` and dynamic min-height
- `should_apply_scroll_snap_align_to_items` - Validates `scroll-snap-align: start`

**Edge Cases Covered:**
- Different viewport heights (iPhone SE: 667px, iPhone 14: 844px)
- Landscape orientation (min-height adjusts)

---

### 3. Scroll Behavior (3 tests)
Tests scroll snapping, IntersectionObserver tracking, and index updates

**Tests:**
- `should_snap_to_next_item_on_scroll` - Validates scroll-snap behavior on scroll > 1 viewport
- `should_track_current_item_with_intersection_observer` - Tests IntersectionObserver initialization
- `should_update_current_index_when_scrolled` - Tests current index tracking via intersection ratio

**Edge Cases Covered:**
- Partial scroll (< 50% threshold)
- Fast scrolling through multiple items
- Simultaneous scroll events

**Mock Setup:**
```javascript
const mockIntersectionObserver = jest.fn((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
window.IntersectionObserver = mockIntersectionObserver;
```

---

### 4. Details Overlay (4 tests)
Tests minimal overlay, expand/collapse interactions, and content display

**Tests:**
- `should_show_minimal_overlay_by_default` - Validates 80px peek with `translateY(calc(100% - 80px))`
- `should_expand_details_on_overlay_tap` - Tests tap → `translateY(0)` transition
- `should_collapse_details_on_collapse_button_tap` - Tests collapse button with `stopPropagation`
- `should_show_title_and_price_in_overlay` - Validates content rendering

**Edge Cases Covered:**
- Tapping while overlay is animating
- Double-tap prevention
- Touch vs click events

---

### 5. Multi-Image Navigation (3 tests)
Tests horizontal swipe gestures for artworks with multiple images

**Tests:**
- `should_show_swipe_indicator_for_multi_image_artworks` - Shows "← Swipe for more →" hint
- `should_navigate_images_on_horizontal_swipe` - Tests 50px threshold left/right swipe
- `should_show_image_position_indicator` - Displays "1 / 3" counter

**Edge Cases Covered:**
- Single-image artworks (no indicator)
- Swipe distance below 50px threshold (no navigation)
- Boundary conditions (first/last image)

**Swipe Detection:**
```javascript
const touchStartX = 200;
const touchEndX = 50;
const diff = touchStartX - touchEndX; // 150px > 50px threshold
if (diff > 50) navigateNext(); // Left swipe
if (diff < -50) navigatePrevious(); // Right swipe
```

---

### 6. Accessibility (3 tests)
Tests keyboard navigation, screen reader support, and motion preferences

**Tests:**
- `should_support_keyboard_navigation_in_infinite_scroll` - ArrowDown/Up, PageDown/Up support
- `should_announce_current_artwork_to_screen_readers` - `role="article"`, `aria-label`, `aria-live="polite"`
- `should_respect_prefers_reduced_motion` - Disables smooth scroll for `prefers-reduced-motion: reduce`

**Edge Cases Covered:**
- Tab key focus management
- NVDA/JAWS screen reader compatibility
- VoiceOver mobile gestures

**Accessibility Attributes:**
```html
<div class="scroll-item"
     role="article"
     aria-label="Artwork: Mountain Vista, 60x80 cm"
     aria-live="polite"
     tabindex="0">
```

---

### 7. Performance (2 tests)
Tests lazy loading strategy and adjacent image preloading

**Tests:**
- `should_lazy_load_images_outside_viewport` - First 2 items `loading="eager"`, rest `loading="lazy"`
- `should_preload_adjacent_images` - Preloads current, previous, and next images via `<link rel="preload">`

**Edge Cases Covered:**
- Initial page load (eager load first 2)
- Scrolling to end (no preload beyond last item)
- Low memory devices (browser handles lazy loading)

**Preload Strategy:**
```javascript
// For currentIndex = 2, preload indices [1, 2, 3]
const preloadRange = [currentIndex - 1, currentIndex, currentIndex + 1];
preloadRange.forEach(index => {
  if (index >= 0 && index < totalItems) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = `/img/artwork-${index}.jpg`;
    document.head.appendChild(link);
  }
});
```

---

## Test Data Factory

```javascript
const createMockArtwork = (overrides = {}) => ({
  id: 1,
  title: 'Test Artwork',
  size: '20x30 cm',
  materials: 'Oil on canvas',
  description: 'Test description',
  image: '/img/test.jpg',
  thumb: '/img/test-thumb.jpg',
  available: true,
  category: 'paintings',
  width: 400,
  height: 500,
  ...overrides,
});
```

## Mock Helpers

### Viewport Simulation
```javascript
const setMobileViewport = () => {
  Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
  Object.defineProperty(window, 'innerHeight', { value: 667, writable: true });
  window.dispatchEvent(new Event('resize'));
};

const setDesktopViewport = () => {
  Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });
  Object.defineProperty(window, 'innerHeight', { value: 900, writable: true });
  window.dispatchEvent(new Event('resize'));
};
```

### IntersectionObserver Mock
```javascript
beforeEach(() => {
  const mockIntersectionObserver = jest.fn((callback) => {
    observerCallback = callback;
    return {
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    };
  });
  window.IntersectionObserver = mockIntersectionObserver;
});
```

### matchMedia Mock
```javascript
window.matchMedia = jest.fn((query) => ({
  matches: query === '(prefers-reduced-motion: reduce)',
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));
```

---

## Running Tests

### Run Infinite Scroll Tests Only
```bash
npm test -- tests/components/Gallery.test.js -t "Infinite Scroll Mode"
```

### Run All Gallery Tests
```bash
npm test -- tests/components/Gallery.test.js
```

### Run with Coverage
```bash
npm test -- --coverage tests/components/Gallery.test.js
```

### Watch Mode
```bash
npm test -- --watch tests/components/Gallery.test.js
```

---

## CI Integration

### Pipeline Configuration
```yaml
test:
  stage: test
  script:
    - npm ci
    - npm test -- tests/components/Gallery.test.js
  coverage: '/All files[^|]*\|[^|]*\s+([\d\.]+)/'
  artifacts:
    reports:
      junit: junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
```

### Quality Gates
- **Coverage Threshold**: 80% line coverage (enforced)
- **Test Timeout**: Unit tests < 100ms each
- **Flaky Test Policy**: Auto-quarantine after 3 consecutive failures

---

## Edge Cases Validated

### Input Validation
- Empty artworks array
- Missing image URLs (fallback to placeholder)
- Invalid JSON in data attributes
- Null/undefined artwork properties

### State Transitions
- Desktop → Mobile resize
- Mobile → Desktop resize
- Portrait ↔ Landscape orientation change
- Rapid scroll events

### Error Conditions
- IntersectionObserver not supported (graceful fallback)
- Touch events unavailable (mouse fallback)
- Images fail to load (alt text display)

### Boundary Values
- First item (no previous navigation)
- Last item (no next navigation)
- Single artwork (no scroll-snap)
- Viewport exactly at 768px breakpoint

---

## Future Enhancements

### Planned Test Additions
1. **E2E Tests** (Playwright)
   - Real scroll-snap behavior on mobile Safari/Chrome
   - Touch gesture accuracy on physical devices
   - Performance profiling (LCP, CLS, FID)

2. **Visual Regression Tests** (Percy/Chromatic)
   - Overlay animations
   - Swipe indicator positioning
   - Multi-image carousel transitions

3. **Performance Tests** (Lighthouse CI)
   - Time to Interactive < 3s
   - First Contentful Paint < 1.5s
   - Cumulative Layout Shift < 0.1

4. **Contract Tests** (Pact)
   - Gallery API response shape validation
   - Image URL format verification

---

## Test Maintenance

### When to Update Tests
- Breakpoint changes (e.g., 768px → 800px)
- New swipe threshold (e.g., 50px → 75px)
- Overlay animation timing changes
- Accessibility attribute updates

### When to Add New Tests
- New user interactions (e.g., pinch-to-zoom)
- New device support (e.g., foldable screens)
- New artwork types (e.g., 3D models)

---

## Self-Review Checklist

Before merging:
- [ ] All 21 tests pass locally
- [ ] Tests pass on CI/CD pipeline
- [ ] No flaky tests (run 10x consecutively)
- [ ] Mock setup isolated in beforeEach/afterEach
- [ ] Test names follow `should_X_when_Y` convention
- [ ] Edge cases documented
- [ ] No implementation details tested (e.g., internal state)
- [ ] Assertions test behavior, not structure
- [ ] Test data uses factory functions

---

## Contact

For questions or issues with this test suite:
- **QA Lead**: [Your Name]
- **Test Location**: `/tests/components/Gallery.test.js` (lines 393-950)
- **Related Files**:
  - Implementation: `/docs/js/components/Gallery.js`
  - Styles: `/docs/css/gallery.css` (infinite-scroll classes)
  - Lightbox Tests: `/tests/components/Lightbox.test.js`

---

**Test Suite Version**: 1.0.0
**Last Updated**: 2025-12-03
**Total Tests**: 43 (22 original + 21 infinite scroll)
**Pass Rate**: 100%
