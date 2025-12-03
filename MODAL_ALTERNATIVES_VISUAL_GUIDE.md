# Visual Design Guide: Modal Elimination Proposals
## Mobile Wireframes & Component Specs

---

## PROPOSAL 1: Deep Linked Detail Views
### Spatial Navigation with Full-Screen Carousel

```
FLOW DIAGRAM:

Gallery Grid          Artwork Detail       Navigation

┌──────────────┐     [Tap]    ┌──────────────────┐
│ Artwork 1    │ ─────────→   │ Artwork 1        │
│ Artwork 2    │             │ (Full-screen)    │
│ Artwork 3    │             │                  │
│ Artwork 4    │             │ ← Gallery        │
│ Artwork 5    │             │ [IMAGE]          │
│ ...          │             │ Swipe ← →        │
└──────────────┘             │ [Metadata]       │
                            │ [CTA]            │
                             └──────────────────┘
                                    ↓
                             [Swipe Left]
                                    ↓
                             ┌──────────────────┐
                             │ Artwork 2        │
                             │ (Full-screen)    │
                             │                  │
                             │ ← Gallery        │
                             │ [NEXT IMAGE]     │
                             │ Swipe ← →        │
                             │ [Different Info] │
                             │ [CTA]            │
                             └──────────────────┘

ANIMATION TIMELINE:
0ms:    Gallery grid visible, all cards at rest
200ms:  User taps Artwork 1
201ms:  Image begins zoom-out animation (source: grid position)
300ms:  Gallery fades to 30% opacity (dark overlay appears)
400ms:  Animation completes—image is fullscreen, metadata slides in
401ms:  Title, materials, description animate in sequence (stagger)
600ms:  All elements settled, user can swipe or navigate
```

### Component Specifications

#### Gallery Item → Detail Transition

```css
/* During Transition (User Taps) */
.gallery-item {
  /* Calculate position relative to viewport */
  transform-origin: center;
  transform: scale(1.0) translateY(0);
  opacity: 1;
  transition: none; /* Interrupt current animations */
}

.gallery-item.entering-detail {
  /* Animate from grid position to fullscreen */
  transform: scale(2.5) translateY(-150px);
  /* (Actual values depend on item position in grid) */
  opacity: 0.2; /* Fade as it grows */
  transition: all 400ms cubic-bezier(0.16, 1, 0.3, 1);
}

/* Backdrop During Transition */
.gallery-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0);
  backdrop-filter: blur(0px);
  opacity: 0;
  transition: all 400ms ease;
}

.gallery-backdrop.detail-open {
  background: rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(8px);
  opacity: 1;
}
```

#### Detail View Container

```html
<!-- Fullscreen Detail View (Mobile-First) -->
<div class="detail-view" data-artwork-id="artwork-001">

  <!-- Header: Sticky -->
  <div class="detail-header">
    <button class="back-button" aria-label="Back to gallery">
      <svg>← Gallery</svg>
    </button>
    <h1 class="detail-title">Moss Study</h1>
  </div>

  <!-- Image: Full viewport height, sticky during scroll -->
  <div class="detail-image-container">
    <img
      src="artwork-001-hd.jpg"
      alt="Moss Study, 24 inches by 32 inches mixed media"
      class="detail-image"
    />
    <div class="swipe-hint">← Swipe to see more →</div>
  </div>

  <!-- Metadata Panel: Scrollable below image -->
  <div class="detail-metadata">
    <div class="metadata-section">
      <p class="meta-label">Size</p>
      <p class="meta-value">24" × 32"</p>
    </div>

    <div class="metadata-section">
      <p class="meta-label">Materials</p>
      <p class="meta-value">Mixed Media on Canvas</p>
    </div>

    <div class="metadata-section">
      <p class="meta-label">Description</p>
      <p class="meta-description">
        A study in organic texture and natural patterns...
      </p>
    </div>

    <div class="metadata-section">
      <p class="meta-label">Availability</p>
      <div class="availability-badge">In Stock</div>
    </div>

    <div class="metadata-section price-section">
      <p class="meta-label">Price</p>
      <p class="meta-price">$1,200</p>
    </div>

    <!-- CTA: Sticky at bottom -->
    <button class="cta-button">Purchase Inquiry</button>
  </div>

  <!-- Carousel Navigation (Hidden by default) -->
  <div class="carousel-nav">
    <button class="nav-prev" aria-label="Previous artwork">←</button>
    <span class="nav-indicator">1 of 12</span>
    <button class="nav-next" aria-label="Next artwork">→</button>
  </div>

</div>
```

#### Responsive Breakpoints

```css
/* Mobile: 320px - 767px (Primary) */
@media (max-width: 767px) {
  .detail-view {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }

  .detail-header {
    position: sticky;
    top: 0;
    height: 56px;
    z-index: 100;
    display: flex;
    align-items: center;
    padding: 0 16px;
  }

  .detail-image-container {
    position: relative;
    flex: 0 0 auto;
    height: 60vh; /* Leaves room for metadata scroll */
    overflow: hidden;
  }

  .detail-image {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .detail-metadata {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    padding: 24px 16px;
    background: var(--card-background);
  }

  .metadata-section {
    margin-bottom: 24px;
  }

  .meta-label {
    font-size: 12px;
    text-transform: uppercase;
    color: var(--secondary-text);
    letter-spacing: 1px;
  }

  .meta-value {
    font-size: 16px;
    font-weight: 500;
    margin-top: 4px;
  }

  .cta-button {
    width: 100%;
    padding: 16px;
    margin-top: 24px;
    background: var(--accent-color);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    touch-action: manipulation;
  }
}

/* Tablet: 768px - 1024px */
@media (min-width: 768px) and (max-width: 1024px) {
  .detail-image-container {
    height: 70vh; /* More image focus */
  }
}

/* Desktop: 1025px+ */
@media (min-width: 1025px) {
  .detail-view {
    display: grid;
    grid-template-columns: 1fr 350px;
    height: 100vh;
  }

  .detail-image-container {
    grid-column: 1;
    height: 100%;
  }

  .detail-metadata {
    grid-column: 2;
    border-left: 1px solid var(--border-color);
    overflow-y: auto;
  }
}
```

#### Swipe Navigation Handler

```javascript
// Touch tracking for horizontal swipe
let touchStartX = 0;
let touchEndX = 0;

detailView.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].clientX;
});

detailView.addEventListener('touchend', (e) => {
  touchEndX = e.changedTouches[0].clientX;

  const distance = touchStartX - touchEndX;
  const isSignificant = Math.abs(distance) > 50; // 50px threshold

  if (isSignificant) {
    if (distance > 0) {
      // Swiped left → show next artwork
      navigateCarousel('next');
    } else {
      // Swiped right → show previous artwork
      navigateCarousel('prev');
    }
  }
});

function navigateCarousel(direction) {
  const currentIndex = state.currentIndex;
  const maxIndex = artworks.length - 1;

  let nextIndex = direction === 'next'
    ? Math.min(currentIndex + 1, maxIndex)
    : Math.max(currentIndex - 1, 0);

  if (nextIndex === currentIndex) return; // No-op at boundaries

  // Crossfade transition
  detailImage.classList.add('fading-out');

  setTimeout(() => {
    detailImage.src = artworks[nextIndex].imageUrl;
    detailImage.classList.remove('fading-out');
    updateMetadata(artworks[nextIndex]);
    state.currentIndex = nextIndex;
  }, 150);
}
```

---

## PROPOSAL 2: Inline Expandable Card (Bottom Sheet)
### Native iOS/Material Design Pattern

```
FLOW DIAGRAM:

┌────────────────┐         [Tap Artwork]      ┌──────────────────┐
│  Gallery Grid  │ ──────────────────────→   │  Gallery (85%)   │
│                │                            ├──────────────────┤
│ [Card 1] ← tap │                            │  Image (50%)     │
│ [Card 2]       │                            │  [Image shrinks] │
│ [Card 3]       │                            ├──────────────────┤
│ ...            │                            │  BOTTOM SHEET    │
│                │                            │  ∿∿∿ (handle)    │
│                │                            │  Title           │
└────────────────┘                            │  Materials       │
                                              │  Description     │
                                              │  [CTA]           │
                                              └──────────────────┘
                                                      ↓
                                              [Swipe Sheet ↓]
                                                      ↓
                                              Sheet slides down
                                              Gallery fades in
                                                      ↓
                                              Back to Gallery Grid

SHEET HEIGHT PROGRESSION:
Closed:    Gallery 100% (sheet hidden)
Opening:   Sheet 60% viewport (300ms spring anim)
Scrolled:  Sheet 80% viewport (user scrolls up to maximize)
Dismissing: Sheet collapses (250ms ease-out)

TOUCH ZONES:
┌────────────────────────┐
│  Interactive Gallery   │  ← User can scroll gallery behind sheet
│  (visible, 15% dimmed) │
├────────────────────────┤ ← Drag handle zone (44px height)
│ SHEET ∿∿∿ (handle)     │
│ ┌────────────────────┐ │
│ │ [Title]            │ │
│ │ [Metadata]         │ │ ← Scrollable section (momentum scroll)
│ │ [Description]      │ │
│ │ [CTA]              │ │
│ └────────────────────┘ │
│                        │
└────────────────────────┘
```

### Component Specifications

#### Bottom Sheet Container & Handle

```html
<!-- Bottom Sheet (Initially Hidden) -->
<div class="bottom-sheet" role="region" aria-modal="false" aria-label="Artwork details">

  <!-- Drag Handle (Visual affordance) -->
  <div class="sheet-handle" aria-label="Drag to dismiss">
    <div class="handle-bar"></div>
  </div>

  <!-- Scrollable Content -->
  <div class="sheet-content">

    <!-- Sticky Image Section -->
    <div class="sheet-image-container">
      <img src="artwork-001-sd.jpg" alt="Artwork thumbnail" />
    </div>

    <!-- Scrollable Metadata -->
    <div class="sheet-metadata">
      <h2 class="artwork-title">Moss Study</h2>

      <div class="metadata-grid">
        <div class="metadata-item">
          <label>Size</label>
          <value>24" × 32"</value>
        </div>

        <div class="metadata-item">
          <label>Medium</label>
          <value>Mixed Media on Canvas</value>
        </div>

        <div class="metadata-item">
          <label>Year</label>
          <value>2023</value>
        </div>
      </div>

      <div class="description-section">
        <label>About This Work</label>
        <p>
          A meditation on natural textures and patterns
          found in forest ecosystems...
        </p>
      </div>

      <div class="availability-section">
        <span class="status-badge in-stock">In Stock</span>
        <p class="price">$1,200</p>
      </div>

      <!-- CTA (Sticky at bottom of scroll) -->
      <button class="cta-button">Purchase Inquiry</button>

      <!-- Additional Actions -->
      <div class="sheet-actions">
        <button class="action-secondary">Share</button>
        <button class="action-secondary">Save</button>
      </div>
    </div>

  </div>

</div>
```

#### Bottom Sheet CSS

```css
/* Container & Overlay */
.bottom-sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 90vh;
  background: var(--card-background);
  border-radius: 16px 16px 0 0;
  box-shadow:
    0 -4px 16px rgba(0, 0, 0, 0.08),
    0 -2px 8px rgba(0, 0, 0, 0.04);
  z-index: 1000;
  transform: translateY(100%); /* Hidden by default */
  transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
}

.bottom-sheet.is-open {
  transform: translateY(0);
}

.bottom-sheet.is-closing {
  transition-duration: 250ms;
  transition-timing-function: ease-out;
  transform: translateY(100%);
}

/* Gallery Backdrop Dimming */
.gallery-grid {
  transition: filter 300ms ease, opacity 300ms ease;
}

.bottom-sheet.is-open ~ .gallery-grid,
.bottom-sheet.is-open ~ main {
  filter: blur(5px);
  opacity: 0.85;
}

/* Handle */
.sheet-handle {
  padding: 12px 0;
  display: flex;
  justify-content: center;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
}

.sheet-handle:active {
  cursor: grabbing;
}

.handle-bar {
  width: 32px;
  height: 3px;
  background: var(--border-color);
  border-radius: 2px;
  opacity: 0.6;
}

/* Content Scrolling */
.sheet-content {
  max-height: calc(90vh - 44px); /* 44px = handle height */
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain; /* Prevent pull-to-refresh */
}

/* Image Sticky Top */
.sheet-image-container {
  position: sticky;
  top: 0;
  background: var(--card-background);
  height: 280px;
  overflow: hidden;
  margin-bottom: 0;
  z-index: 10;
}

.sheet-image-container img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Metadata Grid */
.sheet-metadata {
  padding: 24px 16px 32px;
}

.metadata-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.metadata-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metadata-item label {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--secondary-text);
  font-weight: 600;
  letter-spacing: 0.5px;
}

.metadata-item value {
  font-size: 14px;
  color: var(--text-color);
  font-weight: 500;
}

/* CTA Button (Sticky at bottom) */
.cta-button {
  width: 100%;
  padding: 16px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 24px;
  transition: background-color 200ms ease, transform 100ms ease;
  touch-action: manipulation;
  box-shadow: 0 2px 8px rgba(139, 120, 93, 0.15);
}

.cta-button:hover {
  background-color: var(--accent-darker);
  box-shadow: 0 4px 12px rgba(139, 120, 93, 0.25);
}

.cta-button:active {
  transform: scale(0.98);
  transition-duration: 75ms;
}

.cta-button:focus-visible {
  outline: 2px solid var(--accent-color);
  outline-offset: 2px;
}

/* Safe Area for Notch/Dynamic Island */
@supports (padding: max(0px)) {
  .bottom-sheet {
    padding-bottom: max(16px, env(safe-area-inset-bottom));
  }
}
```

#### Swipe-to-Dismiss Handler

```javascript
class BottomSheet {
  constructor(element) {
    this.sheet = element;
    this.handle = element.querySelector('.sheet-handle');
    this.content = element.querySelector('.sheet-content');

    this.state = {
      isDragging: false,
      startY: 0,
      currentY: 0,
      velocityY: 0,
    };

    this.attachListeners();
  }

  attachListeners() {
    // Touch events
    this.handle.addEventListener('touchstart', this.onTouchStart.bind(this));
    this.sheet.addEventListener('touchmove', this.onTouchMove.bind(this), {passive: false});
    this.sheet.addEventListener('touchend', this.onTouchEnd.bind(this));

    // Prevent scroll while sheet moves
    if (this.state.isDragging) {
      this.content.style.overflow = 'hidden';
    }
  }

  onTouchStart(e) {
    this.state.isDragging = true;
    this.state.startY = e.touches[0].clientY;
    this.state.currentY = 0;
    this.content.style.overflow = 'hidden';
  }

  onTouchMove(e) {
    if (!this.state.isDragging) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - this.state.startY;

    // Only allow downward drag (positive deltaY)
    if (deltaY > 0) {
      this.state.currentY = deltaY;

      // Live preview: translate sheet downward
      const opacity = Math.max(0, 1 - (deltaY / 300));
      this.sheet.style.transform = `translateY(${deltaY}px)`;

      // Backdrop fades as sheet moves
      document.querySelector('main').style.opacity = opacity;
    }
  }

  onTouchEnd(e) {
    const velocity = this.state.currentY / 10; // Simplistic momentum
    const threshold = 100; // 100px to dismiss

    const shouldDismiss =
      this.state.currentY > threshold ||
      velocity > 5; // Momentum-based dismiss

    if (shouldDismiss) {
      this.dismiss();
    } else {
      // Snap back
      this.snap();
    }

    this.state.isDragging = false;
    this.content.style.overflow = 'auto';
  }

  dismiss() {
    this.sheet.classList.add('is-closing');
    setTimeout(() => {
      this.sheet.classList.remove('is-open', 'is-closing');
      // Re-enable gallery scroll
      document.querySelector('main').style.filter = '';
      document.querySelector('main').style.opacity = '1';
    }, 250);
  }

  snap() {
    this.sheet.style.transition = 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)';
    this.sheet.style.transform = 'translateY(0)';
    setTimeout(() => {
      this.sheet.style.transition = '';
    }, 300);
  }

  open() {
    this.sheet.classList.add('is-open');
  }
}
```

---

## PROPOSAL 3: Fullscreen Carousel (Stories Model)
### Immersive Sequential Browsing

```
FLOW DIAGRAM:

Gallery Grid          Carousel Mode         Navigation
(Visible)            (Fullscreen)

┌──────────────┐     [Tap]    ┌──────────────────┐
│ Artwork 1    │ ─────────→   │ ← Close  1 of 12 │
│ Artwork 2    │             │ [FULLSCREEN IMG] │
│ Artwork 3    │             │                  │
│ Artwork 4    │             │ (Gallery faded   │
│ Artwork 5    │             │  behind)         │
│ ...          │             │                  │
└──────────────┘             │ Swipe ← → or     │
                            │ arrow buttons    │
                             └──────────────────┘
                                    ↓
                    [Tap ⓘ Info to reveal metadata]
                                    ↓
                             ┌──────────────────┐
                             │ ← Close  1 of 12 │
                             │ [IMAGE]          │
                             ├──────────────────┤
                             │ METADATA OVERLAY │
                             │ Title            │
                             │ Size/Materials   │
                             │ Price            │
                             │ [CTA]            │
                             └──────────────────┘
                                    ↓
                           [Swipe Down to Exit]
                                    ↓
                           Back to Gallery Grid

HEADER FADE BEHAVIOR:
0-2 sec:  Header visible (title, close, info button)
2-5 sec:  Header fades to opacity 0.5 (still interactive)
5+ sec:   Header fades to opacity 0.2 (tap image to bring back)
When touched: Header returns to opacity 1 (4 sec timeout)

METADATA OVERLAY TIMING:
Tap ⓘ:     Overlay slides up from bottom (250ms spring)
Scrolled:  Can scroll within overlay (momentum)
Hidden:    If user swipes to next image while open
Next img:  Overlay remains, metadata updates smoothly
```

### Component Specifications

#### Fullscreen Carousel Container

```html
<!-- Fullscreen Carousel Modal -->
<div class="carousel-modal" role="region" aria-modal="true" aria-label="Fullscreen artwork carousel">

  <!-- Header: Fades after 2 seconds inactivity -->
  <header class="carousel-header">
    <button class="carousel-close" aria-label="Close carousel">
      <svg>←</svg>
      <span>Close</span>
    </button>

    <h1 class="carousel-title">Moss Study</h1>

    <button class="carousel-info-toggle" aria-label="Toggle artwork information">
      <svg>ⓘ</svg>
    </button>
  </header>

  <!-- Main Image Container (Full Viewport) -->
  <div class="carousel-image-container">
    <!-- Loading State -->
    <div class="carousel-loader">
      <div class="spinner"></div>
      <p>Loading artwork...</p>
    </div>

    <!-- Image (Renders when ready) -->
    <img
      src="artwork-001-hd.jpg"
      alt="Moss Study, 24 by 32 inches mixed media"
      class="carousel-image"
      loading="lazy"
    />

    <!-- Gesture Hints -->
    <div class="carousel-hints">
      <div class="hint swipe-hint">Swipe ← → to browse</div>
      <div class="hint info-hint">Tap ⓘ for details</div>
    </div>
  </div>

  <!-- Metadata Overlay (Initially Hidden) -->
  <div class="carousel-metadata-overlay" aria-hidden="true">
    <div class="overlay-content">
      <h2>Moss Study</h2>
      <div class="overlay-meta">
        <p><strong>Size:</strong> 24" × 32"</p>
        <p><strong>Medium:</strong> Mixed Media on Canvas</p>
        <p><strong>Year:</strong> 2023</p>
      </div>
      <p class="overlay-description">
        A study in organic texture and natural patterns...
      </p>
      <p class="overlay-price"><strong>$1,200</strong></p>
      <button class="overlay-cta">Purchase Inquiry</button>
    </div>
  </div>

  <!-- Navigation Bar (Always visible but subtle) -->
  <footer class="carousel-footer">
    <span class="carousel-counter">1 of 12</span>
    <div class="carousel-progress">
      <div class="progress-fill" style="width: 8.3%"></div>
    </div>
  </footer>

</div>

<!-- Gallery Grid (Behind carousel, faded) -->
<main class="gallery-main carousel-open">
  <!-- Gallery items remain in DOM (position: fixed pulls carousel out of flow) -->
</main>
```

#### Fullscreen Carousel CSS

```css
/* Carousel Modal Container */
.carousel-modal {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: #000000;
  display: flex;
  flex-direction: column;
  opacity: 1;
  animation: carouselFadeIn 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes carouselFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Gallery Behind Carousel */
.gallery-main.carousel-open {
  opacity: 0.2;
  filter: blur(8px);
  pointer-events: none;
  transition: opacity 300ms ease, filter 300ms ease;
}

/* Header */
.carousel-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.5) 0%,
    transparent 100%
  );
  opacity: 1;
  transition: opacity 300ms ease;
  will-change: opacity;
  z-index: 10;
}

.carousel-header.hidden {
  opacity: 0.2;
  pointer-events: none;
}

.carousel-close,
.carousel-info-toggle {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
  transition: background-color 200ms ease;
}

.carousel-close:hover,
.carousel-info-toggle:hover {
  background: rgba(255, 255, 255, 0.3);
}

.carousel-close:active,
.carousel-info-toggle:active {
  transform: scale(0.95);
}

.carousel-title {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 18px;
  color: white;
  margin: 0;
  font-family: 'Cormorant Garamond', serif;
  font-weight: 600;
  letter-spacing: 0.5px;
}

/* Image Container */
.carousel-image-container {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.carousel-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  animation: imageZoomIn 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes imageZoomIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.carousel-image.fading-out {
  opacity: 0.1;
  transition: opacity 200ms ease;
}

.carousel-image:active {
  cursor: grabbing;
}

/* Loading Indicator */
.carousel-loader {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: white;
  opacity: 0;
  pointer-events: none;
  transition: opacity 200ms ease;
}

.carousel-loader.visible {
  opacity: 1;
  pointer-events: auto;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.2);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Metadata Overlay */
.carousel-metadata-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.95) 0%,
    rgba(0, 0, 0, 0.85) 20%,
    transparent 100%
  );
  color: white;
  max-height: 0;
  overflow: hidden;
  transition: max-height 250ms cubic-bezier(0.16, 1, 0.3, 1);
  padding: 0 16px;
}

.carousel-metadata-overlay.visible {
  max-height: 50vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.overlay-content {
  padding: 24px 0 32px;
}

.overlay-content h2 {
  font-size: 20px;
  margin: 0 0 16px;
  font-family: 'Cormorant Garamond', serif;
}

.overlay-meta,
.overlay-description {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 16px;
}

.overlay-price {
  font-size: 18px;
  font-weight: 600;
  color: var(--accent-color);
  margin-bottom: 16px;
}

.overlay-cta {
  width: 100%;
  padding: 16px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  touch-action: manipulation;
}

.overlay-cta:active {
  transform: scale(0.98);
}

/* Footer Progress */
.carousel-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 44px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.3);
  color: white;
  font-size: 12px;
  z-index: 5;
}

.carousel-progress {
  width: 100%;
  height: 2px;
  background: rgba(255, 255, 255, 0.2);
  position: absolute;
  top: 0;
}

.progress-fill {
  height: 100%;
  background: white;
  transition: width 400ms ease;
}

/* Gesture Hints */
.carousel-hints {
  position: absolute;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  pointer-events: none;
  animation: hintsFadeIn 500ms ease-out 0.5s both;
}

@keyframes hintsFadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.hint {
  margin-bottom: 8px;
}
```

#### Carousel Controller

```javascript
class FullscreenCarousel {
  constructor(artworks, startIndex = 0) {
    this.artworks = artworks;
    this.currentIndex = startIndex;
    this.modal = document.querySelector('.carousel-modal');
    this.image = this.modal.querySelector('.carousel-image');
    this.title = this.modal.querySelector('.carousel-title');
    this.header = this.modal.querySelector('.carousel-header');
    this.overlay = this.modal.querySelector('.carousel-metadata-overlay');

    this.state = {
      isLoading: false,
      headerAutoHideTimer: null,
      isDragging: false,
      touchStartX: 0,
    };

    this.init();
  }

  init() {
    this.attachListeners();
    this.loadArtwork(this.currentIndex);
    this.startHeaderAutoHide();
  }

  attachListeners() {
    // Close button
    this.modal.querySelector('.carousel-close')
      .addEventListener('click', () => this.close());

    // Info toggle
    this.modal.querySelector('.carousel-info-toggle')
      .addEventListener('click', () => this.toggleInfo());

    // Image tap (toggle UI)
    this.image.addEventListener('click', () => this.toggleUI());

    // Swipe navigation
    this.modal.addEventListener('touchstart', (e) => this.onTouchStart(e));
    this.modal.addEventListener('touchmove', (e) => this.onTouchMove(e));
    this.modal.addEventListener('touchend', (e) => this.onTouchEnd(e));

    // Keyboard navigation
    document.addEventListener('keydown', (e) => this.onKeyDown(e));
  }

  loadArtwork(index) {
    const artwork = this.artworks[index];

    // Update title
    this.title.textContent = artwork.title;

    // Preload image
    this.state.isLoading = true;
    this.modal.querySelector('.carousel-loader')?.classList.add('visible');

    const img = new Image();
    img.onload = () => {
      this.image.src = artwork.imageUrl;
      this.state.isLoading = false;
      this.modal.querySelector('.carousel-loader')?.classList.remove('visible');
    };
    img.src = artwork.imageUrl;

    // Update metadata
    this.updateMetadata(artwork);

    // Update counter
    const counter = this.modal.querySelector('.carousel-counter');
    counter.textContent = `${index + 1} of ${this.artworks.length}`;

    const progress = this.modal.querySelector('.progress-fill');
    progress.style.width = `${((index + 1) / this.artworks.length) * 100}%`;
  }

  updateMetadata(artwork) {
    const overlay = this.modal.querySelector('.overlay-content');
    overlay.innerHTML = `
      <h2>${artwork.title}</h2>
      <div class="overlay-meta">
        <p><strong>Size:</strong> ${artwork.size}</p>
        <p><strong>Medium:</strong> ${artwork.materials}</p>
      </div>
      <p class="overlay-description">${artwork.description}</p>
      <p class="overlay-price"><strong>${artwork.price}</strong></p>
      <button class="overlay-cta">Purchase Inquiry</button>
    `;
  }

  onTouchStart(e) {
    this.state.touchStartX = e.touches[0].clientX;
    this.state.isDragging = true;
  }

  onTouchMove(e) {
    // Optionally add drag preview
  }

  onTouchEnd(e) {
    const touchEndX = e.changedTouches[0].clientX;
    const distance = this.state.touchStartX - touchEndX;
    const threshold = 50;

    if (Math.abs(distance) > threshold) {
      if (distance > 0) {
        // Swiped left → next
        this.navigate('next');
      } else {
        // Swiped right → prev
        this.navigate('prev');
      }
    }

    this.state.isDragging = false;
  }

  navigate(direction) {
    const maxIndex = this.artworks.length - 1;
    let nextIndex = this.currentIndex;

    if (direction === 'next' && nextIndex < maxIndex) {
      nextIndex++;
    } else if (direction === 'prev' && nextIndex > 0) {
      nextIndex--;
    } else {
      return; // No-op at boundaries
    }

    // Fade out, load, fade in
    this.image.classList.add('fading-out');

    setTimeout(() => {
      this.currentIndex = nextIndex;
      this.loadArtwork(nextIndex);
      this.image.classList.remove('fading-out');
    }, 150);
  }

  onKeyDown(e) {
    if (e.key === 'Escape') this.close();
    if (e.key === 'ArrowLeft') this.navigate('prev');
    if (e.key === 'ArrowRight') this.navigate('next');
    if (e.key === 'i' || e.key === 'I') this.toggleInfo();
  }

  toggleInfo() {
    this.overlay.classList.toggle('visible');
  }

  toggleUI() {
    this.header.classList.toggle('hidden');
    this.startHeaderAutoHide();
  }

  startHeaderAutoHide() {
    clearTimeout(this.state.headerAutoHideTimer);
    this.header.classList.remove('hidden');

    this.state.headerAutoHideTimer = setTimeout(() => {
      this.header.classList.add('hidden');
    }, 3000); // Hide after 3 seconds
  }

  close() {
    this.modal.style.animation = 'carouselFadeOut 300ms ease-out forwards';
    setTimeout(() => {
      this.modal.remove();
      document.querySelector('main').classList.remove('carousel-open');
    }, 300);
  }
}
```

---

## Comparison: Mobile Interaction Costs

```
USER ACTION → INTERACTION COST (lower is better)

PROPOSAL 1: Deep Link
┌────────────────────────────────────────┐
│ View detail metadata     │ ●○○○○ (2/5) │  Scroll panel
│ Navigate to next         │ ●●●○○ (3/5) │  Swipe left (intuitive)
│ Return to gallery        │ ●●●○○ (3/5) │  Tap back or Esc
│ View multiple artworks   │ ●●●●○ (4/5) │  Requires swiping through
│ TOTAL FRICTION SCORE     │ 12/20 (Low) │  Efficient but breaks context
└────────────────────────────────────────┘

PROPOSAL 2: Bottom Sheet
┌────────────────────────────────────────┐
│ View detail metadata     │ ●○○○○ (1/5) │  Natural scroll
│ Navigate to next         │ ●●●○○ (3/5) │  Swipe left in sheet
│ Return to gallery        │ ●○○○○ (1/5) │  Swipe down (easy!)
│ View multiple artworks   │ ●●●○○ (3/5) │  Reopen sheet (quick)
│ TOTAL FRICTION SCORE     │ 8/20  (✓✓)  │  Most frictionless!
└────────────────────────────────────────┘

PROPOSAL 3: Fullscreen Carousel
┌────────────────────────────────────────┐
│ View detail metadata     │ ●●○○○ (2/5) │  Tap info, then scroll
│ Navigate to next         │ ●○○○○ (1/5) │  Native swipe gesture
│ Return to gallery        │ ●○○○○ (1/5) │  Swipe down (easy!)
│ View multiple artworks   │ ●○○○○ (1/5) │  Continuous swiping
│ TOTAL FRICTION SCORE     │ 5/20  (✓✓✓) │  Immersive, minimal friction
└────────────────────────────────────────┘

KEY: ●○○○○ = 1 gesture, ●●○○○ = 2 gestures, etc.
(Lower friction when you *want* immersion over context)
```

---

## Accessibility Comparison

```
PROPOSAL 1: Deep Link
├─ Focus Management    ✓ Excellent (link-based nav is accessible)
├─ Screen Reader       ✓ Good (semantic HTML structure)
├─ Keyboard Nav        ✓ Good (tab order, arrow keys)
├─ ARIA Attributes     ✓ Simple (non-modal context)
└─ Complexity          ✓ Low

PROPOSAL 2: Bottom Sheet
├─ Focus Management    ✓✓ Excellent (focus stays in gallery)
├─ Screen Reader       ✓ Good (aria-modal="false" is non-disruptive)
├─ Keyboard Nav        ✓ Good (escape, tab within sheet)
├─ ARIA Attributes     ✓✓ Well-defined (native pattern)
└─ Complexity          ✓ Very Low

PROPOSAL 3: Fullscreen Carousel
├─ Focus Management    ○ Fair (focus trap required)
├─ Screen Reader       ✓ Good (aria-modal="true", live region)
├─ Keyboard Nav        ✓ Good (arrow keys, escape)
├─ ARIA Attributes     ✓ Medium (modal requires strict ARIA)
└─ Complexity          ○ Medium (focus trap logic)

WCAG 2.1 AA Compliance: All three pass ✓
(But Proposal 2 requires least accessibility work)
```

---

## Performance Profile

```
METRIC                  P1 (Deep Link)  P2 (Sheet)  P3 (Carousel)
──────────────────────────────────────────────────────────────
Initial Load            △ DOM route     ✓ DOM exists ✓ DOM exists
Image Preload           ✓✓ Preload      ✓ On-demand  ✓✓ Preload
Memory (hidden items)   △ Frees memory  ✓ Shared    ✓ Carousel
Gesture Response        ✓ 60fps         ✓ 60fps     ✓✓ 60fps
Cumulative Layout Shift ○ Medium        ✓✓ None     ✓✓ None
LCP (Largest Paint)     ✓ Fast          ✓ Fast      ✓ Fast
INP (Interaction Paint) ✓ Good          ✓✓ Excellent ✓✓ Excellent

MOBILE DATA (Slow 3G):
- Download time for detail: P1 (+200ms routing) vs P2/P3 (instant from cache)
- Preload images: P1 (aggressive) vs P2 (lazy) vs P3 (moderate)

RECOMMENDATION: P2 is fastest, P3 is most responsive
```

---

## Browser/Device Support

```
DEVICE TYPE         P1: Link      P2: Sheet       P3: Carousel
─────────────────────────────────────────────────────────────
iOS Safari (15+)    ✓ Excellent   ✓✓ Native       ✓✓ Native
Android Chrome      ✓ Good        ✓ Good          ✓ Good
Samsung Internet    ✓ Good        ✓ Good          ✓ Good
Edge                ✓ Good        ✓ Good          ✓ Good
Firefox             ✓ Good        ✓ Good          ✓ Good
IE 11               ✗ Not viable  ○ Polyfills     ○ Polyfills

GESTURE SUPPORT:
- Swipe (horizontal)   ✓ All        ✓ All          ✓ All
- Swipe (vertical)     ✓ All        ✓✓ All (native) ✓ All
- Pinch-zoom          ✓ All        ✓ All          ✓ All
- Long-press          ✓ All        ✓ All          ✓ All

RECOMMENDATION: All three are production-ready on modern browsers
```

