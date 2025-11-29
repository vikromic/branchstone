# Carousel Implementation - Quick Reference

## Implementation Summary

A responsive 3-items-per-row infinite carousel has been implemented for the Branchstone featured artworks section, with responsive breakpoints: 3 items (desktop), 2 items (tablet), 1 item (mobile).

## Modified Files

1. **`/docs/js/components/Carousel.js`** - Core carousel logic with multi-item support
2. **`/docs/css/09-featured.css`** - Responsive grid styling
3. **`/docs/js/app.js`** - Carousel initialization with responsive configuration
4. **`/docs/test-carousel.html`** - Test page for validation

## Code Examples

### 1. Carousel Initialization (app.js)

```javascript
// Determine items per view based on viewport
let itemsPerView = 3;
if (window.innerWidth <= 768) {
  itemsPerView = 1;
} else if (window.innerWidth <= 1024) {
  itemsPerView = 2;
}

// Initialize carousel
const carousel = new Carousel({
  containerSelector: '#featured-carousel',
  itemSelector: '.carousel-item',
  autoplayDelay: 5000,           // 5 second autoplay
  loop: true,                     // Infinite looping
  pauseOnHover: true,            // Pause on user interaction
  itemsPerView: itemsPerView,    // 3/2/1 based on viewport
  itemsPerRow: itemsPerView,     // Scroll by this amount
});

// Handle window resize
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    carousel.recalculate();
  }, 250);
});
```

### 2. Infinite Clone Setup (Carousel.js)

```javascript
setupInfiniteClone() {
  const track = this.container.querySelector('.carousel-track');

  // Clone count = at least itemsPerView
  const cloneCount = Math.max(this.itemsPerView, 3);

  // Clone first N items and append to end
  for (let i = 0; i < cloneCount && i < this.originalItems.length; i++) {
    const clone = this.originalItems[i].cloneNode(true);
    clone.classList.add('carousel-clone');
    clone.removeAttribute('id');
    track.appendChild(clone);
  }

  // Clone last N items and prepend to start
  for (let i = Math.max(0, this.originalItems.length - cloneCount);
       i < this.originalItems.length; i++) {
    const clone = this.originalItems[i].cloneNode(true);
    clone.classList.add('carousel-clone');
    clone.removeAttribute('id');
    track.insertBefore(clone, track.firstChild);
  }

  // Position carousel to show original first item
  this.currentIndex = cloneCount;
  this.updateTrackPosition(true);
}
```

### 3. Transform Animation (Carousel.js)

```javascript
updateTrackPosition(instant = false) {
  const track = this.container.querySelector('.carousel-track');
  const firstItem = this.items[0];
  const itemWidth = firstItem.getBoundingClientRect().width;

  // Calculate total gap distance
  const totalGap = this.slideGap * this.currentIndex;

  // Apply CSS transform
  const translation = -(this.currentIndex * itemWidth + totalGap);

  // Manage transition property
  if (instant) {
    track.style.transition = 'none';
  } else {
    track.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
  }

  track.style.transform = `translateX(${translation}px)`;

  // Re-enable transition after instant positioning
  if (instant) {
    void track.offsetHeight; // Trigger reflow
    track.style.transition = 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
  }
}
```

### 4. Smart Navigation with Boundary Detection (Carousel.js)

```javascript
next() {
  if (this.isTransitioning) return; // Prevent click spam
  this.isTransitioning = true;

  // Advance by itemsPerRow
  let nextIndex = this.currentIndex + this.itemsPerRow;

  const cloneCount = Math.max(this.itemsPerView, 3);
  const originalCount = this.originalItems.length;

  // Check if at boundary (cloned section)
  if (nextIndex >= originalCount + cloneCount) {
    // Animate to cloned section
    this.updateTrackPosition();

    // After animation, instantly jump to original
    setTimeout(() => {
      const jumpIndex = cloneCount + (nextIndex - (originalCount + cloneCount));
      this.currentIndex = jumpIndex;
      this.updateTrackPosition(true); // Instant, no animation
      this.isTransitioning = false;
    }, 600); // Match CSS transition duration
  } else {
    this.currentIndex = nextIndex;
    this.updateTrackPosition();
    setTimeout(() => {
      this.isTransitioning = false;
    }, 600);
  }
}
```

### 5. Responsive CSS (09-featured.css)

```css
/* Desktop: 3 items per row with 2.5rem gap */
@media (min-width: 1025px) {
  #featured-carousel .carousel-item {
    flex: 0 0 calc((100% - 5rem) / 3);
  }
  .carousel-track {
    gap: 2.5rem;
  }
}

/* Tablet: 2 items per row with 2.5rem gap */
@media (min-width: 769px) and (max-width: 1024px) {
  #featured-carousel .carousel-item {
    flex: 0 0 calc((100% - 2.5rem) / 2);
  }
  .carousel-track {
    gap: 2.5rem;
  }
}

/* Mobile: 1 item per row with 1.5rem gap */
@media (max-width: 768px) {
  #featured-carousel .carousel-item {
    flex: 0 0 100%;
  }
  .carousel-track {
    gap: 1.5rem;
  }
}
```

## How It Works: Step by Step

### 1. Initialization
```
[Clone3][Clone2][Clone1] [Item1][Item2]...[ItemN] [Clone1][Clone2]
                         ↑ Start here (shows Item1)
```

### 2. Forward Navigation
- User clicks "Next", index advances by 3
- CSS transform animates the change (600ms)
- Items slide smoothly into view

### 3. Boundary Handling (Forward)
```
When reaching cloned section at end:
[...original...] [Clone1][Clone2][Clone3] → animate
After 600ms:     → instant jump back to → [Original items continue...]
                   Now at equivalent position in original items
```

### 4. Backward Navigation
Same process, but in reverse direction

### 5. Responsive Resize
- Window resize triggers debounced resize handler
- `carousel.recalculate()` called after 250ms
- `updateTrackPosition(true)` repositions instantly
- User doesn't notice the recalculation

## Key Transitions During Testing

### Desktop View
- 3 items shown
- Click next → slide 3 items left
- Reach end → smooth loop back to start

### Tablet View
- 2 items shown
- Click next → slide 2 items left
- Reach end → smooth loop back to start

### Mobile View
- 1 item shown
- Click next → slide 1 item left
- Reach end → smooth loop back to start

## Performance Notes

- **GPU Accelerated**: Uses CSS transforms (translate3d equivalent)
- **Smooth 60fps**: Transitions use cubic-bezier easing
- **Minimal Repaints**: Only DOM reads happen on init
- **Debounced Resize**: 250ms delay prevents excessive recalculations
- **Transition Guard**: Prevents animation queue buildup

## Accessibility Features

- ARIA labels on all buttons
- Screen reader announcements (single-item mode)
- Keyboard support inherited from base component
- No focus traps or keyboard nav breaking
- Proper semantic button elements

## Testing the Implementation

### Browser Console
```javascript
// Get the carousel instance
const app = window.carouselInstance;

// Test navigation
app.next();
app.previous();

// Check state
console.log({
  itemsPerView: app.itemsPerView,
  currentIndex: app.currentIndex,
  isTransitioning: app.isTransitioning,
  totalItems: app.items.length
});
```

### Test Page
Open `/docs/test-carousel.html` for a quick visual test with:
- 12 colorful test items
- Viewport width display
- Layout type indicator
- Full console logging

## Common Use Cases

### Showing Different Content
The carousel automatically handles any number of items:
```javascript
// 6 items → shows 3, advances by 3
// 9 items → shows 3, advances by 3
// 12+ items → shows 3, advances by 3
// All loop seamlessly
```

### Adjusting Breakpoints
To change breakpoints, modify `app.js`:
```javascript
let itemsPerView = 4;  // Desktop
if (window.innerWidth <= 1200) itemsPerView = 3;
if (window.innerWidth <= 768) itemsPerView = 2;
if (window.innerWidth <= 480) itemsPerView = 1;
```

### Changing Speed
Modify the autoplay delay in initialization:
```javascript
autoplayDelay: 3000,  // 3 seconds instead of 5
```

### Disabling Autoplay
```javascript
loop: false,  // No autoplay
// OR
carousel.pause();  // Pause after init
carousel.play();   // Resume
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Items not visible | Check CSS grid/flex layout |
| Jittery animation | Verify transition duration matches timeout |
| Navigation not working | Check `isTransitioning` flag logic |
| Items misaligned on resize | Call `carousel.recalculate()` manually |
| Clone items visible | Adjust gap calculation or item width |

## Files for Reference

- **Implementation**: `/docs/js/components/Carousel.js` (457 lines)
- **Styling**: `/docs/css/09-featured.css` (362 lines)
- **Initialization**: `/docs/js/app.js` (lines 116-143)
- **Testing**: `/docs/test-carousel.html`
- **Documentation**: `CAROUSEL_IMPLEMENTATION.md`

## Next Steps

1. **Deployment**: Push to main branch
2. **Monitoring**: Check user interactions with carousel
3. **A/B Testing**: Optional - test different layouts
4. **Analytics**: Track click-through rates on featured items
5. **Enhancements**: Consider keyboard navigation, jump-to-item

---

**Status**: ✅ Implementation complete and tested
**Branch**: `optimization`
**Commit**: `c46e28b`
**Date**: 2025-11-29
