# Mobile Gallery Modal Elimination: 3 Alternative Design Patterns
## Branchstone Art — Design Proposals

**User Feedback:** "Modal is always make mobile experience worse"

**Goal:** Eliminate friction of modal-based artwork detail views while maintaining immersive, distraction-free browsing.

---

## Current State Analysis

### Existing Implementation
- **Gallery View:** Vertical scrolling grid (1 column mobile, full width items with 4:5 aspect ratio)
- **Interaction:** Tap artwork → Bottom-sheet modal lightbox opens
- **Modal Features:**
  - Full-screen semi-opaque dark backdrop
  - Centered card with image, navigation controls (prev/next), metadata
  - Choreographed staggered animations (title, materials, description, CTA fade-in sequentially)
  - Touch gestures: swipe to navigate, pinch to zoom
  - Keyboard navigation support

### Pain Points
1. **Context loss** — Gallery disappears behind dark overlay, disrupts visual continuity
2. **Two-hand interaction** — Closing modal requires reaching back button (top or bottom of screen)
3. **Gesture conflict** — Swipe navigation in modal competes with scroll-to-close patterns
4. **Cognitive load** — New viewport state, no sense of spatial navigation
5. **Mobile momentum** — Interrupts natural scrolling flow with jarring modal entry

---

## Proposal 1: Deep Linked Detail Views (Pinterest/Gucci Model)

### Concept
Replace modal with **full-screen detail pages that feel like spatial navigation**. User scrolls horizontally through a carousel of artwork, each occupying full mobile viewport. Each artwork has its own scrollable detail panel below the image. Swiping left/right navigates between artworks; scrolling up reveals next item naturally.

### Interaction Flow

#### Screen 1: Gallery Grid (Starting State)
```
┌─────────────────────────┐
│  Header: Gallery        │
├─────────────────────────┤
│  [FILTER PILLS]         │
├─────────────────────────┤
│                         │
│   ┌─────────────────┐   │
│   │    Artwork 1    │   │  ← Tap to enter detail view
│   │    (4:5 ratio)  │   │
│   │    "Material"   │   │
│   └─────────────────┘   │
│                         │
│   ┌─────────────────┐   │
│   │    Artwork 2    │   │
│   │    (4:5 ratio)  │   │
│   │    "Size"       │   │
│   └─────────────────┘   │
│                         │
└─────────────────────────┘
```

#### Screen 2: First Artwork Detail (Tap Effect)
```
┌─────────────────────────┐
│  ← Back to Gallery      │  (top-left affordance OR back button)
├─────────────────────────┤
│                         │
│   [FULL-SCREEN IMAGE]   │  (100% viewport height)
│                         │
│     Swipe ← → to next   │  (subtle affordance hint)
│                         │
├─────────────────────────┤  (scroll down for details)
│  Title: "Moss Study"    │
│  Size: 24" × 32"        │
│  Materials: Mixed media │
│  Price: $1,200          │
│  Description: Lorem...  │
│  [PURCHASE INQUIRY]     │
│                         │
│  Swipe left to see      │
│  "Texture Fragments"    │
│                         │
└─────────────────────────┘
     (Carousel beneath hint)
```

#### Screen 3: Swiped to Second Artwork
```
Swipe left (prev gesture)
    ↓
┌─────────────────────────┐
│  ← Back to Gallery      │
├─────────────────────────┤
│                         │
│   [NEXT ARTWORK IMAGE]  │  (crossfade transition)
│                         │
│     ← Prev | Next →     │
│                         │
├─────────────────────────┤
│  Title: "Texture        │
│          Fragments"     │
│  Size: 18" × 24"        │
│  Materials: Acrylic...  │
│  Price: $800            │
│  Description: Lorem...  │
│  [PURCHASE INQUIRY]     │
│                         │
└─────────────────────────┘
```

### Gesture Vocabulary
| Gesture | Action | Feedback |
|---------|--------|----------|
| Tap artwork | Open detail view | Zoom + fade animation (image grows, gallery fades behind) |
| Swipe left/right (image area) | Navigate to next/prev artwork | Momentum-aware horizontal scroll with crossfade |
| Scroll down (detail panel) | Reveal metadata & CTA | Natural scrolling, image sticky at top until detail panel reaches top |
| Swipe down/pull (detail area) | Return to gallery | Sheet gesture—pull detail downward to dismiss |
| Tap back button | Return to gallery | Reverse animation (detail shrinks, gallery fades in) |
| Double-tap image | Zoom in/out | Pinch-to-zoom for high-detail artwork |

### Visual Design

#### States

**Default** (Gallery thumbnail)
- Image: 4:5 aspect ratio, rounded corners
- Info overlay: Title + material at bottom (always visible on mobile)
- Shadow: Subtle elevation
- Touch target: 100% width, min 44px height

**Hover/Focus** (Keyboard navigation)
- Ring focus indicator (2px, color: accent)
- Slight scale lift (1.02x)
- Box-shadow elevation increase

**Entering Detail** (Tap gesture start)
- Image zooms up from gallery grid position
- Gallery grid fades to 30% opacity behind
- Metadata slides up from bottom
- Navigation controls fade in
- Total duration: 400ms (spring easing)

**In Detail View**
- Image: Full viewport width/height, centered
- Sticky header: Back button + title
- Scrollable panel below: All metadata
- Navigation hints: Subtle left/right indicators (arrows or gradient pulse)
- Detail panel: White/dark card, rounded top corners, touches bottom of image area

**Exiting Detail** (Back gesture or button)
- Image shrinks back to grid position
- Gallery grid fades in (30% → 100% opacity)
- Detail panel compresses downward
- Total duration: 300ms

#### Color & Contrast
- Image: Natural color (artwork)
- Backdrop in transition: Overlay darkening from 0% to 15% (doesn't feel "modal")
- Text on detail panel: Maintain 4.5:1 contrast ratio (dark text on light bg or light on dark)
- Navigation indicators: Accent color (#8B785D), opacity 0.6 → 1.0 on hover

#### Typography
- Back button: Label "← Gallery" (16px, Inter Medium)
- Title: "Moss Study" (24px, Cormorant Garamond Semi-Bold)
- Metadata: "24" × 32" | Mixed Media" (14px, Inter Regular)
- Description: 16px line-height 1.6x, 14px font
- Price/Availability: 16px bold, accent color

#### Touch Targets
- Back button: 48px circular or 44px min height pill
- Navigation arrows (if shown): 48×48px min
- Detail scroll area: Full width, naturally scrollable
- Inquiry button: 48px min height, 100% width or 80% with center margin

### Loading States
| State | Pattern | Details |
|-------|---------|---------|
| Initial detail load | Skeleton matching final layout | Blurred image placeholder + skeleton text blocks |
| Image loading in carousel | LQIP (Low Quality Image Placeholder) | Blur-up from LQIP as image loads |
| Transitioning between images | Crossfade + skeleton frame | Previous image fades (0.2s), new LQIP appears |

### Empty/Error States

**No Artworks in Filter**
```
┌─────────────────────────┐
│  Gallery                │
├─────────────────────────┤
│  [FILTER PILLS]         │
├─────────────────────────┤
│          ICON           │
│   No artworks found     │
│   in "Prints Only"      │
│                         │
│  [Show All Artworks]    │
│  (resets filter)        │
└─────────────────────────┘
```

**Error Loading Artwork Details**
```
┌─────────────────────────┐
│  ← Gallery              │
├─────────────────────────┤
│          ERROR ICON     │
│   Couldn't load         │
│   artwork details       │
│                         │
│  [Try Again]            │
│  [Back to Gallery]      │
└─────────────────────────┘
```

### Accessibility

**Focus Management**
- Enter detail: Focus moves to image (allow keyboard arrow keys to navigate next/prev)
- In detail: Tab cycles through Back → Navigation Buttons → Inquiry CTA
- Exit detail: Focus returns to originating gallery item

**Screen Reader Announcements**
```javascript
// When opening detail
announceToScreenReader(
  "Opened: Moss Study. 24 inches by 32 inches. Mixed media. " +
  "Use arrow keys to navigate between artworks or Tab to buttons."
);

// When navigating artworks
announceToScreenReader(
  "Now viewing: Texture Fragments. " +
  "Use left/right arrow keys or swipe to navigate."
);
```

**Keyboard Navigation**
- `Esc` or `B` key → Back to gallery
- `Left/Right Arrow` → Previous/Next artwork
- `Tab` → Cycle through interactive elements
- `Enter` → Activate focused button

**ARIA Labels**
```html
<button aria-label="Back to gallery">← Gallery</button>
<button aria-label="Previous artwork">← Prev</button>
<button aria-label="Next artwork">Next →</button>
<img alt="Moss Study, 24 inches by 32 inches mixed media artwork">
```

### Performance Optimizations

**Image Optimization**
- Preload: Next/prev artwork images when in detail (predictive)
- Lazy load: Gallery grid items (Intersection Observer)
- LQIP: Serve tiny blurred preview while HD loads
- Responsive images: `srcset` for mobile (max 800px width)

**Animation Performance**
- GPU acceleration: `transform` and `opacity` only (no `top/left`)
- Reduce motion: Respect `prefers-reduced-motion` (skip animations, instant transition)
- Debounce swipe gestures: Prevent multiple navigations
- Cancel in-flight animations on new gesture

**Rendering**
- Content visibility: Detail panel uses `content-visibility: auto` for off-screen items
- Will-change: Only on actively transitioning elements
- Contain: Layout containment for carousel items

### Inspiration References
- **Pinterest:** Deep-linked detail pins with carousel browsing
- **Instagram Stories:** Full-screen swipeable sequence with minimal UI
- **Apple Photos:** Spatial zoom from grid → detail, swipe navigation
- **Gucci.com:** Luxury product detail with immersive image focus
- **Artsy:** Art detail carousel with metadata beneath

---

## Proposal 2: Inline Expandable Card Detail (Apple Photos Library Model)

### Concept
Artwork stays in grid. On tap, a **detail panel slides up from bottom** as a native bottom sheet (not a modal—always part of grid scrollable context). User scrolls to see more details within the same viewport. Swiping down dismisses. Image remains visible above while scrolling metadata. No backdrop darkening—gallery grid visible throughout.

### Interaction Flow

#### Screen 1: Gallery Grid (Starting State)
```
┌─────────────────────────┐
│  Header: Gallery        │
├─────────────────────────┤
│  [FILTER PILLS]         │
├─────────────────────────┤
│                         │
│   ┌─────────────────┐   │
│   │    Artwork 1    │   │ ← Tap anywhere on card
│   │    (4:5 ratio)  │   │
│   │    "Material"   │   │
│   └─────────────────┘   │
│                         │
│   ┌─────────────────┐   │
│   │    Artwork 2    │   │
│   │    (4:5 ratio)  │   │
│   │    "Size"       │   │
│   └─────────────────┘   │
│                         │
└─────────────────────────┘
```

#### Screen 2: Tap → Bottom Sheet Expands
```
Animation: Bottom sheet slides up (200ms)

┌─────────────────────────┐
│  Header: Gallery        │  (still visible, slightly dimmed 85%)
├─────────────────────────┤
│  [Artwork 1 - smaller]  │  (image shrinks to 50% viewport height)
│                         │  (scrollable internally)
├─────────────────────────┤  (sheet drag handle)
│ BOTTOM SHEET (expanded) │
│ ┌─────────────────────┐ │
│ │ ∿∿∿ (drag handle)   │ │  (visual affordance to dismiss)
│ ├─────────────────────┤ │
│ │ Title: Moss Study   │ │
│ │ Size: 24" × 32"     │ │  (metadata visible, user scrolls for more)
│ │ Materials: Mixed    │ │
│ │ Description: Lorem..│ │
│ │                     │ │
│ │ (scroll to see CTA) │ │
│ │ [PURCHASE INQUIRY]  │ │
│ └─────────────────────┘ │
│                         │  (gallery grid still visible above)
└─────────────────────────┘
```

#### Screen 3: Scroll Down Within Sheet
```
User scrolls down in sheet (gallery grid scrolled behind)

┌─────────────────────────┐
│  (Gallery hidden)       │
│                         │
├─────────────────────────┤
│ BOTTOM SHEET (scrolled) │
│ ┌─────────────────────┐ │
│ │ ∿∿∿ (drag handle)   │ │
│ ├─────────────────────┤ │
│ │ Size: 24" × 32"     │ │
│ │ Materials: Mixed    │ │  (scrolled view)
│ │ Description: Lorem  │ │
│ │ ipsum dolor sit     │ │
│ │ amet consectetur    │ │
│ │                     │ │
│ │ Availability: In    │ │
│ │ Stock               │ │
│ │                     │ │
│ │ [PURCHASE INQUIRY]  │ │
│ │ [SAVE/SHARE]        │ │
│ └─────────────────────┘ │
│                         │
└─────────────────────────┘
```

#### Screen 4: Swipe Down to Dismiss
```
User swipes sheet downward
    ↓
Sheet slides down, gallery fades in
    ↓
Return to Screen 1
```

### Gesture Vocabulary
| Gesture | Action | Feedback |
|---------|--------|----------|
| Tap artwork | Expand sheet | Slide up (300ms spring), blur gallery 15%, dim background 10% |
| Swipe down (on sheet) | Dismiss sheet | Momentum-aware slide down, unblur gallery |
| Scroll down (sheet content) | See more details | Natural scroll with overscroll bounce at edges |
| Swipe left/right (on image in sheet) | Navigate to next artwork | Sheet slides out left, next artwork sheet slides in from right |
| Drag handle up | Maximize sheet | Sheet expands to 90vh, grid disappears |
| Tap outside sheet (gallery area) | Dismiss sheet | Sheet slides down smoothly |

### Visual Design

#### States

**Gallery (Closed)**
- Gallery items: Normal 4:5 cards
- Opacity: 100%
- Blur: None
- Shadow: Normal gallery shadows

**Sheet Entering** (Tap effect)
- Duration: 300ms spring
- Gallery blur: 0% → 5% blur
- Gallery opacity: 100% → 85%
- Sheet: Slides up from bottom with natural overscroll
- Handle appears with gentle bounce
- Image in sheet shrinks to 60% viewport height

**Sheet Open** (Rest state)
- Sheet occupies 60% of viewport
- Gallery visible above (15% dimmed)
- Handle: Always visible at top
- Scroll position: Defaults to metadata start (image scrolled up)
- Interaction ready for left/right swipe to next artwork

**Sheet Scrolling** (User scrolls content)
- Image sticky-scrolls: Image sticks at top during 200px of scroll
- Text scrolls beneath
- Handle remains visible
- Gallery stays dimmed below

**Sheet Dismissing** (Swipe down)
- Duration: 250ms ease-out
- Gallery: Blur/opacity returns to normal
- Sheet: Slides down with friction
- Return to gallery state

#### Color & Contrast
- Gallery grid behind sheet: 15% darkening (rgba overlay, NOT a modal)
- Blur: Light 5px blur (not disruptive)
- Sheet background: Match card-background (white in light mode, dark in dark mode)
- Sheet border-radius: 16px top corners
- Shadow on sheet: Elevated (0 4px 16px rgba shadow)

#### Typography & Spacing
- Drag handle: 3px thick bar, 32px wide, centered (visual affordance)
- Title: 24px Cormorant Garamond, bold
- Metadata: 14px Inter, spaced with 1.5x line-height
- Description: 16px line-height, max 600px width (readable)
- CTA buttons: Min 48px height, 100% width sheet width
- Padding: 16px sides, 24px top/bottom

#### Touch Targets
- Whole sheet edge-to-edge for swipe detection
- Handle: 44px min touch area (including hidden zones)
- Buttons: 48×48px minimum
- Text links: Padded tap zones (16px)

### Loading States

**Sheet Opening**
```
┌─────────────────────────┐
│  Gallery (dimmed)       │
├─────────────────────────┤
│ BOTTOM SHEET            │
│ ┌─────────────────────┐ │
│ │ ∿∿∿ (drag handle)   │ │
│ ├─────────────────────┤ │
│ │ ████████████ 70% ░░ │ │  (image skeleton loading)
│ │                     │ │
│ │ Title: ██████ ░░░░  │ │  (text skeleton shimmer)
│ │ Size: ████ ░░░░░░   │ │
│ │                     │ │
│ └─────────────────────┘ │
│                         │
└─────────────────────────┘
```

**Image Loading in Sheet**
- LQIP first (blurred preview)
- Fade-up to HD image
- Skeleton text while metadata loads

### Empty/Error States

**Sheet Couldn't Load**
```
┌─────────────────────────┐
│  Gallery (dimmed)       │
├─────────────────────────┤
│ BOTTOM SHEET            │
│ ┌─────────────────────┐ │
│ │ ∿∿∿ (drag handle)   │ │
│ ├─────────────────────┤ │
│ │      ERROR ICON     │ │
│ │  Couldn't load      │ │
│ │  artwork details    │ │
│ │                     │ │
│ │  [Try Again]        │ │
│ │  [Dismiss]          │ │
│ └─────────────────────┘ │
│                         │
└─────────────────────────┘
```

### Accessibility

**Focus Management**
- Open sheet: Focus moves to drag handle (announce "Bottom sheet opened, swipe down to dismiss")
- Tab order: Handle → Title → Navigation (left/right next) → Buttons → Exit
- Keyboard: `Escape` dismisses sheet

**Screen Reader**
```javascript
announceToScreenReader(
  "Bottom sheet opened for Moss Study. " +
  "Swipe down to dismiss or Tab to read details. " +
  "Use arrow keys to navigate to next artwork."
);
```

**Keyboard Navigation**
- `Esc` → Dismiss sheet
- `Tab` → Cycle through focusable elements in sheet
- `Left/Right Arrow` → Next/previous artwork (if in image area)
- `Page Up/Down` → Scroll sheet content
- `Home/End` → Jump to top/bottom of sheet

**ARIA Attributes**
```html
<div role="region" aria-modal="false" aria-label="Artwork details panel">
  <button aria-label="Dismiss artwork details">
    <span aria-hidden="true">∿∿∿</span>
  </button>
</div>
```

### Performance

**Smooth Interactions**
- GPU acceleration: Transform/opacity for sheet slide
- Overflow scroll: Momentum scrolling on iOS (webkit-overflow-scrolling)
- Debounce swipe events: Prevent rapid successive dismissals
- Lazy load: Details only when sheet opens (don't preload all metadata)

**Memory**
- Unload sheet details when dismissed (unmount detail component)
- Only keep current + adjacent images in memory
- Recycle DOM nodes for metadata text

**Rendering**
- Content-visibility: Use for off-screen gallery items
- Will-change: Only on transitioning sheet
- Containment: Layout containment on sheet itself

### Inspiration References
- **Apple Photos:** Sheet-based detail view with image + metadata
- **Google Photos:** Bottom sheet for photo info, album suggestions
- **Spotify:** Track details bottom sheet while browsing playlists
- **Tinder:** Card detail overlay with upward sheet
- **Maps:** Location bottom sheet (stays contextual)

---

## Proposal 3: Immersive Full-Screen Carousel (Instagram Stories Model)

### Concept
Elevate gallery to a **full-screen, chronological browsing experience** similar to Instagram Stories. Tap gallery item → enters full-screen carousel mode. One artwork per screen. Swipe horizontally to navigate (intuitive). Tap top area to reveal minimal metadata. Swipe down/back gesture exits. Gallery context is replaced entirely (not visible), but exit is always one gesture away.

### Interaction Flow

#### Screen 1: Gallery Grid (Starting State)
```
┌─────────────────────────┐
│  Header: Gallery        │
├─────────────────────────┤
│  [FILTER PILLS]         │
├─────────────────────────┤
│                         │
│   ┌─────────────────┐   │
│   │    Artwork 1    │   │ ← Tap to enter fullscreen carousel
│   │    (4:5 ratio)  │   │
│   │    "Material"   │   │
│   └─────────────────┘   │
│                         │
│   ┌─────────────────┐   │
│   │    Artwork 2    │   │
│   │    (4:5 ratio)  │   │
│   │    "Size"       │   │
│   └─────────────────┘   │
│                         │
└─────────────────────────┘
```

#### Screen 2: Full-Screen Carousel Opens (Artwork 1)
```
Animation: Image zooms to fullscreen, gallery fades behind

┌─────────────────────────┐
│ ← Close   Title   ⓘ Info│  (minimal header, fades after 2s)
├─────────────────────────┤
│                         │
│                         │
│   [FULL-SCREEN IMAGE]   │  (100% viewport, centered)
│                         │
│      Swipe ← → to       │  (subtle hint below image)
│      browse artworks    │
│                         │
└─────────────────────────┘
                          (No bottom navigation visible)
```

#### Screen 3: Swipe Left (Navigate to Artwork 2)
```
Swipe left gesture
    ↓
┌─────────────────────────┐
│ ← Close   New Title ⓘ   │  (header updates, title morphs)
├─────────────────────────┤
│                         │
│                         │
│   [NEXT FULL-SCREEN]    │  (crossfade transition, no visible swipe)
│                         │
│                         │
│                         │
└─────────────────────────┘
```

#### Screen 4: Tap Info Button (Reveal Metadata)
```
Tap ⓘ icon
    ↓
┌─────────────────────────┐
│ ← Close   Title   ⓘ Info│ (header remains visible)
├─────────────────────────┤
│                         │
│   [FULL-SCREEN IMAGE]   │  (image shrinks slightly)
│                         │
├─────────────────────────┤
│ Title: Moss Study       │  (minimal metadata overlay, slides in)
│ Size: 24" × 32"         │
│ Materials: Mixed Media  │
│ Price: $1,200           │
│                         │
│ [PURCHASE INQUIRY]      │  (CTA visible at bottom)
│                         │
└─────────────────────────┘
```

#### Screen 5: Swipe Down to Exit
```
Swipe down gesture (or tap ← Close)
    ↓
Image shrinks back to thumbnail position
    ↓
Gallery fades in
    ↓
Return to Screen 1 (Gallery remains scrolled to same position)
```

### Gesture Vocabulary
| Gesture | Action | Feedback |
|---------|--------|----------|
| Tap artwork | Enter fullscreen carousel | Image zooms to fullscreen, gallery fades behind (400ms) |
| Swipe left/right (image area) | Navigate artworks | Momentum-aware horizontal scroll with crossfade transition |
| Swipe down (image area) | Exit carousel | Image shrinks, gallery fades in, back to original scroll position |
| Tap ← button | Exit carousel | Instant exit animation (reverse zoom) |
| Tap ⓘ button | Toggle metadata overlay | Slide up/down metadata panel (200ms) |
| Tap image | Cycle UI visibility | Hide header/footer on first tap, show on second (immersive mode toggle) |
| Double-tap image | Zoom in/out | Pinch zoom for detail inspection |
| Long-press | Open context menu | Share, save, or other actions |

### Visual Design

#### States

**Gallery (Closed)**
- Normal 4:5 gallery items
- Fully visible
- Interactive

**Carousel Entering**
- Duration: 400ms spring
- Gallery: Fades to 20% opacity behind fullscreen image
- Image: Zooms from thumbnail grid position to fullscreen (perspective transform)
- Header: Fades in (title + info button)
- Navigation hints: Subtle pulse or "Swipe ← →" text fades in below image

**Carousel Open (Image View)**
- Image: 100% viewport width/height, centered, object-fit contain
- Header: Sticky at top (title, close button, info toggle)
- Footer: Barely visible (swipe hint text, progress indicator)
- Background: True black (#000000) behind image
- Interaction: Only image area is interactive (swipe, zoom, tap to toggle UI)

**Carousel Open (Info Expanded)**
- Image: Shrinks to 70% viewport height
- Metadata overlay: Slides up from bottom
- Background behind overlay: Darkened (rgba 0,0,0 0.4)
- Footer: Purchase button visible
- CTA: Full width, 48px minimum height

**Carousel Exiting**
- Duration: 300ms ease-out
- Image: Shrinks back to original grid position
- Gallery: Fades in (100% opacity)
- Metadata: Collapses
- Header: Fades out

#### Color & Contrast
- Background: Pure black (#000000) for immersive feel
- Header: Transparent dark (rgba 0,0,0 0.3) with backdrop blur
- Title: White text (100% contrast on black)
- Metadata overlay: Dark semi-transparent card on black
- Info button: Accent color (#8B785D) for clear affordance
- Progress indicator: Subtle white bar/dots (opacity 0.4)

#### Typography
- Title in header: 18px white, Cormorant Garamond medium
- Info button: Icon + text, 14px Inter
- Metadata: 16px white text on dark overlay
- Description: 14px line-height 1.6x
- Price/Availability: 16px bold, accent color
- CTA: 16px bold white on accent background

#### Touch Targets
- Close button: 48×48px
- Info button: 48×48px
- Image swiping: 100% width, viewport height
- Metadata: Scrollable within overlay, safe insets for notch

### Loading States

**Carousel Opening**
```
┌─────────────────────────┐
│ ← Close   ⓘ             │  (minimal header)
├─────────────────────────┤
│                         │
│   [LOADING SPINNER]     │  (centered, pulsing)
│                         │
│   Artwork loading...    │  (status text below)
│                         │
│                         │
└─────────────────────────┘
```

**Navigation Transition**
- Previous image: Fade out (200ms)
- LQIP (low-quality placeholder): Fades in immediately
- HD image: Loads in background, crossfades in when ready
- Skeleton text: Shows for metadata if info expanded

### Empty/Error States

**No More Artworks (End of Carousel)**
```
┌─────────────────────────┐
│ ← Close   Final   ⓘ     │
├─────────────────────────┤
│                         │
│   [LAST ARTWORK]        │
│                         │
│   ← Back | See more → ✕  │  (navigation options)
│   (at bottom, fades)    │
│                         │
└─────────────────────────┘
```

**Error Loading Artwork**
```
┌─────────────────────────┐
│ ← Close   ERROR   ⓘ     │
├─────────────────────────┤
│          ERROR ICON     │
│                         │
│  Couldn't load this     │
│  artwork                │
│                         │
│  ← Previous | Next →    │
│  [Back to Gallery]      │
│                         │
└─────────────────────────┘
```

### Accessibility

**Focus Management**
- Enter carousel: Focus trapped in carousel (visible focus on close button)
- Cycle: `Tab` → Close btn → Info btn → (if info open) Exit
- Exit carousel: Focus returns to originating gallery item

**Screen Reader**
```javascript
announceToScreenReader(
  "Fullscreen carousel opened. " +
  "Artwork 1 of 12: Moss Study. " +
  "Use arrow keys or swipe to navigate. " +
  "Press Escape to exit."
);

// On navigation
announceToScreenReader(
  "Now viewing artwork 2 of 12: Texture Fragments. " +
  "24 inches by 32 inches, mixed media."
);
```

**Keyboard Navigation**
- `Esc` → Exit carousel (return to gallery)
- `Left/Right Arrow` → Previous/next artwork
- `Up/Down Arrow` → Zoom in/out
- `Space` → Toggle info panel visibility
- `I` → Toggle info (alternative shortcut)
- `Tab` → Focus close button, then out (trap focus)

**ARIA Attributes**
```html
<div
  role="region"
  aria-modal="true"
  aria-label="Fullscreen artwork carousel. Use arrow keys to navigate."
  aria-live="polite"
>
  <h1 aria-live="assertive">Moss Study (1 of 12)</h1>
  <button aria-label="Close carousel and return to gallery">×</button>
  <button aria-label="Toggle artwork information panel">ⓘ Info</button>
</div>
```

### Performance

**Preloading Strategy**
- Preload: Current + next two artworks in carousel
- Abandon: Previous artworks (free memory)
- LQIP: Serve immediately for smooth carousel feel

**Animation Performance**
- GPU acceleration: Transform/opacity only
- No layout shifts during transitions
- Momentum scrolling disabled (prevent overscroll gestures)
- Debounce double-tap zoom (100ms)

**Memory Management**
- Carousel component: Single shared instance
- Image swap: Only swap `src` attribute (reuse DOM)
- Metadata: Load on-demand (not preloaded)
- Cleanup: Unload carousel when exiting (unmount component)

**Rendering Optimization**
- Fullscreen image: Hardware-accelerated scaling
- Metadata overlay: Rendered on separate layer
- Will-change: Active on transitioning elements only

### Inspiration References
- **Instagram Stories:** Fullscreen chronological carousel, swipe to navigate
- **Snapchat Stories:** Tap-to-progress, swipe-to-exit model
- **Apple Photos Fullscreen:** Minimal UI, swipe to navigate
- **Tik Tok:** Fullscreen immersive scrolling (vertical)
- **VSCO:** Immersive photo viewer with swipe navigation
- **Medium:** Fullscreen article reader, minimal chrome

---

## Comparison Table

| Aspect | Proposal 1: Deep Link | Proposal 2: Bottom Sheet | Proposal 3: Fullscreen Carousel |
|--------|----------------------|------------------------|----------------------------------|
| **Gallery Context** | Lost (new page feel) | Visible behind (dimmed) | Lost (immersive) |
| **Dismiss Ease** | Back button or Esc | Swipe down or Esc | Swipe down or Esc |
| **Navigation Gesture** | Swipe left/right | Swipe left/right | Swipe left/right |
| **Metadata Visibility** | Scrollable panel below | Scrollable in sheet | Info button expands |
| **Mobile Natural** | ✓ Horizontal swipe familiar | ✓✓ Bottom sheet native to iOS | ✓✓ Stories model feels native |
| **Scroll Continuity** | Breaks (new view) | Maintained (grid scrolls) | Breaks (immersive) |
| **Touch Conflict** | None | None (swipe down on sheet) | Minimal |
| **Accessibility** | Good (ARIA labels) | Good (not modal) | Good (focus trapped) |
| **Performance** | Excellent (preload) | Good (lazy load metadata) | Good (preload 2 images) |
| **Code Complexity** | Medium (routing needed) | Low (single component) | Medium (carousel state) |
| **Dev Effort** | High (requires routing) | Low (sheet component) | Medium (gesture handling) |
| **WCAG Compliance** | ✓ AA (non-modal) | ✓ AA (non-modal) | ✓ AA (modal OK if managed) |
| **Dark Mode Ready** | ✓ (theme-aware) | ✓ (theme-aware) | ✓ (black background) |
| **RTL Support** | ✓ (reverse swipe) | ✓ (standard sheet) | ✓ (swipe reverses) |

---

## Recommendation

**🥇 Proposal 2 (Bottom Sheet) is the optimal choice for Branchstone** because:

1. **Maintains Context** — Gallery remains visible, reducing cognitive load (user knows they can dismiss anytime)
2. **Native Mobile Feeling** — Bottom sheet is a native iOS/Material Design pattern (users familiar)
3. **Lowest Dev Effort** — Single component, no routing changes needed (quick iteration)
4. **Best Accessibility** — Not a modal (aria-modal="false"), so focus doesn't trap
5. **Fastest Performance** — Lazy-load details only when sheet opens
6. **Elegantly Dismissible** — Swipe down from anywhere (low friction)
7. **Least Disruptive** — Gallery remains partially interactive behind sheet

**Alternative: Proposal 3** if you want a truly immersive "showcase" experience for luxury/prestige positioning (Instagram-Stories vibe), but it requires more gesture education.

**Avoid: Proposal 1** unless you plan deep-linking for artwork sharing (SEO benefit), which adds complexity without clear mobile UX gain.

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Remove lightbox modal from DOM
- [ ] Create `BottomSheet` component (reusable for other pages too)
- [ ] Implement bottom sheet open/close animations
- [ ] Add mobile-first viewport constraints (safe insets)

### Phase 2: Details (Week 2-3)
- [ ] Lazy-load metadata when sheet opens
- [ ] Implement swipe-down-to-dismiss gesture
- [ ] Add left/right arrow navigation in sheet
- [ ] Create loading skeleton matching final layout

### Phase 3: Polish (Week 3-4)
- [ ] Test gesture conflicts (swipe scroll vs. swipe dismiss)
- [ ] Accessibility audit (focus management, screen reader)
- [ ] Performance optimization (preload adjacent images)
- [ ] Dark mode testing, RTL support

### Phase 4: Launch (Week 4)
- [ ] A/B test (optional): 5% bottom sheet vs. lightbox modal
- [ ] User testing feedback
- [ ] Monitor scroll-to-detail (analytics)
- [ ] Iterate based on real usage

---

## Fallback / Progressive Enhancement

If bottom sheet isn't available on some browsers:
```javascript
// Fallback to simpler inline detail (no sheet, just expand card)
if (!supportsBottomSheet()) {
  // Expand gallery item in-place
  // Show details below thumbnail without sheet animation
}
```

---

## Questions for Stakeholder Review

1. **Priority:** Is reducing modal friction more important than maintaining gallery context?
2. **Branding:** Does the luxury/immersive feel benefit from Proposal 3 (fullscreen carousel)?
3. **Analytics:** Do we track "viewed details → purchased inquiry"? Metrics might inform choice.
4. **Mobile First:** Is the audience primarily mobile (>70%)? If so, Proposal 2 is strongest.
5. **Sharing:** Do we want shareable artwork URLs? (Proposal 1 enables this naturally)

---

## Success Metrics

Track post-launch:
- **Engagement:** Time spent in detail view, artworks viewed per session
- **Friction:** Scroll-to-detail conversion rate (vs. modal baseline)
- **Gestures:** Swipe-down dismissal rate (vs. close button)
- **Acquisition:** Inquiry conversions per session
- **Accessibility:** Screen reader session duration, keyboard usage %
- **Performance:** Time to interactive, CLS (cumulative layout shift)

