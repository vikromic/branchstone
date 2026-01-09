# Mobile Hero Visual Design Guide
**Branchstone Artist Gallery - Visual Specifications & Examples**

---

## Color Palette Reference

### Light Theme (Primary)

```css
Background:
  Primary:   #FAF9F7  ████████  Warm off-white (main canvas)
  Secondary: #F5F3F0  ████████  Subtle contrast
  Elevated:  #FFFFFF  ████████  Pure white (cards)

Text:
  Primary:   #1A1816  ████████  Rich charcoal (headlines)
  Secondary: #4A4745  ████████  Muted gray (body)
  Tertiary:  #6B6662  ████████  Subtle gray (hints)

Copper Gradient:
  Light:     #C29776  ████████  Copper 300
  Primary:   #B8866B  ████████  Copper 400 (brand)
  Dark:      #A67757  ████████  Copper 500
```

### Dark Theme

```css
Background:
  Primary:   #141210  ████████  Deep charcoal
  Secondary: #1E1B18  ████████  Slightly lighter
  Elevated:  #302D2A  ████████  Elevated surfaces

Text:
  Primary:   #FAFAF9  ████████  Near white (15.8:1 contrast)
  Secondary: #D4D0CB  ████████  Lighter warm gray
  Tertiary:  #A8A39D  ████████  Visible muted gray
```

---

## Typography Scale Examples

### Display Font (Cormorant Garamond)

```
Where Forest Meets Art
━━━━━━━━━━━━━━━━━━━━━━━━
Font: Cormorant Garamond
Weight: 400 (Regular)
Size: clamp(1.75rem, 7vw, 2.5rem)
      → 28px (375px screen)
      → 32px (400px screen)
      → 40px (575px screen)
Line Height: 1.2
Letter Spacing: -0.01em (tight)
Color: #1A1816 (rich charcoal)

Example Rendering:
┌────────────────────────────┐
│                            │
│  Where Forest Meets Art    │ ← Clean serif, elegant
│                            │
└────────────────────────────┘
```

### Body Font (Inter)

```
One-of-a-kind mixed-media artworks made
with foraged natural materials.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Font: Inter
Weight: 400 (Regular)
Size: clamp(1rem, 4vw, 1.125rem)
      → 16px (375px screen)
      → 17px (400px screen)
      → 18px (512px screen)
Line Height: 1.6 (spacious, readable)
Letter Spacing: 0.005em (slight open)
Color: #4A4745 (muted gray)
Max Width: 480px (prevents long lines)

Example Rendering:
┌────────────────────────────────┐
│                                │
│  One-of-a-kind mixed-media     │
│  artworks made with foraged    │ ← Sans-serif, clear
│  natural materials.            │
│                                │
└────────────────────────────────┘
```

---

## Button Design Examples

### Primary CTA - "Explore the Works"

**Specs:**
```css
Dimensions:  200px min-width × 48px height
Padding:     16px vertical, 32px horizontal
Background:  Linear gradient (135deg, #B8866B → #A67757)
Color:       White (#FFFFFF)
Font:        Inter, 16px, 600 weight
Radius:      16px (organic, rounded)
Shadow:      0 4px 8px rgba(26,24,22,0.10)
```

**Visual:**
```
┌──────────────────────────────┐
│                              │
│   Explore the Works  →       │ ← Copper gradient
│                              │
└──────────────────────────────┘
     ↑                    ↑
   Gradient           Arrow icon
  (warm copper)      (white, 16px)
```

**States:**
```
Normal:  [████████████████████] ← Copper gradient
Hover:   [████████████████████] ← Lighter copper, lifted
         Transform: translateY(-2px)
         Shadow: 0 10px 24px rgba(26,24,22,0.12)

Active:  [████████████████████] ← Pressed state
         Transform: translateY(0px)
         Shadow: 0 2px 4px rgba(26,24,22,0.08)
```

### Alternative Copy Options

```
Option A (Recommended):
┌──────────────────────────────┐
│   Explore the Works  →       │ ← Art-first, inviting
└──────────────────────────────┘

Option B (Formal):
┌──────────────────────────────┐
│   Enter the Gallery  →       │ ← More gallery-like
└──────────────────────────────┘

Option C (Current):
┌──────────────────────────────┐
│   View Gallery  →            │ ← Functional, less warm
└──────────────────────────────┘
```

---

## Layout Anatomy

### Full Mobile Hero Breakdown (375px iPhone SE)

```
┌─────────────────────────────────┐  ←  0px (top of viewport)
│                                 │
│                                 │
│         HERO IMAGE              │  Height: 400px (60vh)
│       (cover.webp)              │  Object-fit: cover
│                                 │  Object-position: center 40%
│   No overlay, no dark gradient  │
│                                 │
│                                 │
├─────────────────────────────────┤  ←  400px
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  Background: #FAF9F7
│ ▓                             ▓ │  Padding-top: 32px
│ ▓  Where Forest Meets Art     ▓ │  Font: Cormorant, 28px
│ ▓                             ▓ │
│ ▓  One-of-a-kind mixed-media  ▓ │  Padding: 0 16px
│ ▓  artworks made with foraged ▓ │  Font: Inter, 16px
│ ▓  natural materials.         ▓ │  Line-height: 1.6
│ ▓                             ▓ │
│ ▓  ┌───────────────────────┐  ▓ │
│ ▓  │ Explore the Works  → │  ▓ │  Button: 200px × 48px
│ ▓  └───────────────────────┘  ▓ │  Margin-bottom: 24px
│ ▓                             ▓ │
│ ▓           ↓                 ▓ │  Scroll hint: 24px icon
│ ▓                             ▓ │  Opacity: 0.6
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │  Padding-bottom: 24px
├─────────────────────────────────┤  ←  ~650px
│                                 │
│   NEXT SECTION                  │  Artist by the Numbers
│   (Stats grid begins)           │
│                                 │
```

### Spacing Breakdown

```
Section           Height       Notes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hero Image        400px        60vh on 667px screen
Text Block        ~250px       Dynamic based on text
  ├─ Top Pad      32px         var(--space-8)
  ├─ Heading      ~56px        Text + margins
  ├─ Subheading   ~96px        3 lines × 1.6 line-height
  ├─ CTA Button   48px         + 32px bottom margin
  └─ Scroll Hint  ~50px        Icon + padding
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Hero        ~650px       Fits in 1.5 screens
```

---

## Scroll Hint Animation

### Keyframe Details

```css
@keyframes gentleBounce {
  0%   { transform: translateY(0px);  }  ← Start
  50%  { transform: translateY(6px);  }  ← Move down 6px
  100% { transform: translateY(0px);  }  ← Return
}

Duration:  2s (slow, calm)
Easing:    ease-in-out (smooth)
Iterations: infinite
```

**Visual Timeline:**
```
Time:  0s     0.5s    1s     1.5s    2s
       │       │       │       │       │
       ↓       ↓       ↓       ↓       ↓

       ↓                               (start)
              ↓                        (moving down)
                      ↓                (bottom)
                              ↓        (moving up)
       ↓                               (reset, loop)
```

**Icon Design:**
```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
  <path d="M12 5v14M5 12l7 7 7-7"/>
</svg>

Renders as:
    │
    │
    ↓
   ╱ ╲
```

---

## Image Treatment Examples

### Current Desktop Hero Image
```
File: /docs/img/cover.webp
Size: 14.8 KB (optimized)
Dimensions: Unknown (check actual)

Treatment:
- Dark overlay gradient (bottom to top)
- Brightness: 0.95
- Contrast: 1.05
- Saturation: 1.1
```

### Mobile Inline Hero Image (Proposed)
```
File: Same /docs/img/cover.webp
Treatment Changes:
- NO dark overlay ← Key difference
- Brightness: 1.0 (brighter)
- Contrast: 1.05 (same)
- Saturation: 1.15 (slightly more vibrant)
- Object-position: center 40% (favor top for portraits)
```

**Visual Comparison:**

```
DESKTOP (Current):           MOBILE (New):
┌─────────────────┐          ┌─────────────────┐
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│          │                 │
│▓▓▓ IMAGE ▓▓▓▓▓▓▓│          │     IMAGE       │
│▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│          │  (no overlay)   │
│█████████████████│          │                 │
│█████████████████│          │                 │
└─────────────────┘          └─────────────────┘
 ↑ Dark gradient              ↑ Clean, breathes
```

---

## Dark Theme Variations

### Light Theme Hero (Primary)
```
┌─────────────────────────────────┐
│          IMAGE                  │ ← Brighter filter
├─────────────────────────────────┤
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ ← #FAF9F7 bg
│ ░                             ░ │
│ ░  Where Forest Meets Art     ░ │ ← #1A1816 text
│ ░  (dark text on light)       ░ │
│ ░                             ░ │
│ ░  ┌───────────────────────┐  ░ │
│ ░  │ [Copper Button]       │  ░ │
│ ░  └───────────────────────┘  ░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└─────────────────────────────────┘
```

### Dark Theme Hero
```
┌─────────────────────────────────┐
│          IMAGE                  │ ← Darker filter
├─────────────────────────────────┤
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ ← #141210 bg
│ ▓                             ▓ │
│ ▓  Where Forest Meets Art     ▓ │ ← #FAFAF9 text
│ ▓  (light text on dark)       ▓ │
│ ▓                             ▓ │
│ ▓  ┌───────────────────────┐  ▓ │
│ ▓  │ [Copper Button]       │  ▓ │
│ ▓  └───────────────────────┘  ▓ │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└─────────────────────────────────┘
```

---

## Responsive Sizing Table

### Font Sizes Across Widths

| Screen Width | Heading (H1) | Subheading | CTA Button |
|--------------|--------------|------------|------------|
| 320px (min)  | 28px         | 16px       | 16px       |
| 375px (SE)   | 30px         | 16px       | 16px       |
| 390px (Pro)  | 31px         | 16.5px     | 16px       |
| 414px (Plus) | 33px         | 17px       | 16px       |
| 428px (Max)  | 34px         | 17.5px     | 16px       |
| 576px (sm)   | 40px (max)   | 18px (max) | 16px       |

### Image Heights Across Devices

| Device               | Viewport  | 60vh  | 65vh  | 70vh  |
|---------------------|-----------|-------|-------|-------|
| iPhone SE           | 375×667   | 400px | 434px | 467px |
| iPhone 13 Mini      | 375×812   | 487px | 528px | 568px |
| iPhone 14           | 390×844   | 506px | 549px | 591px |
| iPhone 14 Pro       | 393×852   | 511px | 554px | 596px |
| iPhone 14 Pro Max   | 430×932   | 559px | 606px | 652px |
| Galaxy S21          | 360×800   | 480px | 520px | 560px |
| Pixel 6             | 412×915   | 549px | 595px | 641px |

**Recommendation:** Use `clamp(60vh, 65vh, 70vh)` — adapts to all screens while maintaining 60-70% ratio.

---

## Touch Target Compliance

### WCAG AAA Guidelines
- **Minimum:** 44×44px
- **Recommended:** 48×48px
- **Spacing:** 8px between interactive elements

### CTA Button Compliance
```
┌────────────────────────────────────┐
│                                    │
│      Explore the Works  →          │ ← 48px height
│                                    │
└────────────────────────────────────┘
 ←          200px min-width         →

Vertical padding:   16px (touch area extends)
Horizontal padding: 32px
No adjacent clickables within 16px
```

### Focus State
```
Normal:
┌────────────────────────────────────┐
│      Explore the Works  →          │
└────────────────────────────────────┘

Focused (keyboard):
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ ┌────────────────────────────────┐ ┃ ← 3px outline
┃ │      Explore the Works  →      │ ┃   4px offset
┃ └────────────────────────────────┘ ┃   Copper color
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

## Animation Specifications

### Scroll Hint Bounce
```
CSS:
animation: gentleBounce 2s ease-in-out infinite;

Behavior:
- Starts immediately (no delay)
- Loops continuously
- Pauses on hover (optional enhancement)
- Disabled if prefers-reduced-motion: reduce
```

**Motion Path:**
```
Y-axis position over 2 seconds:

0px  ┐
     │  /\      /\      /\
     │ /  \    /  \    /  \
6px  ┘      \/      \/      \/

     0s   1s   2s   3s   4s
     └─────────────────────→ time

     Smooth sine wave (ease-in-out)
```

### Button Hover Lift
```
CSS:
transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 300ms cubic-bezier(0.16, 1, 0.3, 1);

Behavior:
Normal → Hover:
  transform: translateY(0) → translateY(-2px)
  shadow: medium → large

Hover → Active:
  transform: translateY(-2px) → translateY(0)
  shadow: large → medium
```

**Visual:**
```
Normal:    [Button]           Shadow: 4px blur
           ─────────

Hover:     [Button]           Shadow: 10px blur, lifted
             ↑ -2px
           ─────────

Active:    [Button]           Shadow: 2px blur, pressed
           ─────────
```

---

## Accessibility Examples

### Screen Reader Output

**Hero Section Announcement:**
```
[User scrolls to hero]

Screen Reader:
"Heading level 1: Where Forest Meets Art.

 Paragraph: One-of-a-kind mixed-media artworks
 made with foraged natural materials.

 Link: Explore the Works."

[User can tab to CTA button]
```

### Alt Text Example
```html
<img src="img/cover.webp"
     alt="Branchstone mixed-media art featuring natural forest materials, moss, and wood textures from Santa Rosa, California"
     loading="eager"
     fetchpriority="high">
```

**Why This Alt Text:**
- Describes medium ("mixed-media art")
- Mentions key materials ("forest materials, moss, wood")
- Provides context (artist/brand name, location)
- Concise but informative (< 125 characters)

---

## Implementation Code Snippets

### HTML Structure
```html
<section class="section-hero section-hero--mobile">

  <!-- Image Container (Inline, not background) -->
  <div class="section-hero__image-container">
    <img
      src="img/cover.webp"
      alt="Branchstone mixed-media art featuring natural forest materials"
      class="section-hero__image-mobile"
      loading="eager"
      fetchpriority="high"
      width="800"
      height="600">
  </div>

  <!-- Text Block (Solid background, high contrast) -->
  <div class="section-hero__text-block">
    <h1 class="section-hero__heading">
      Where Forest Meets Art
    </h1>
    <p class="section-hero__subheading">
      One-of-a-kind mixed-media artworks made with foraged natural materials.
    </p>

    <!-- Single CTA -->
    <div class="section-hero__cta-mobile">
      <a href="gallery.html" class="btn btn--hero-primary btn--with-icon">
        Explore the Works
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2.5">
          <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
      </a>
    </div>
  </div>

  <!-- Scroll Hint (Optional, decorative) -->
  <div class="section-hero__scroll-hint" aria-hidden="true">
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="2">
      <path d="M12 5v14M5 12l7 7 7-7"/>
    </svg>
  </div>

</section>
```

### CSS Core Styles
```css
/* Mobile only: max-width 767px */
@media (max-width: 767px) {

  /* Hide desktop hero */
  .section-hero:not(.section-hero--mobile) {
    display: none;
  }

  /* Mobile inline hero */
  .section-hero--mobile {
    min-height: auto;
    padding: 0;
    position: relative;
  }

  /* Image container - inline flow */
  .section-hero__image-container {
    width: 100%;
    height: clamp(60vh, 65vh, 70vh);
    overflow: hidden;
  }

  .section-hero__image-mobile {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 40%;
    filter: brightness(1.0) contrast(1.05) saturate(1.15);
  }

  /* Text block - solid background */
  .section-hero__text-block {
    background: var(--bg-primary);
    padding: var(--space-8) var(--space-4);
    text-align: center;
  }

  /* Heading */
  .section-hero__heading {
    font-family: var(--font-display);
    font-size: clamp(1.75rem, 7vw, 2.5rem);
    font-weight: 400;
    line-height: 1.2;
    color: var(--text-primary);
    letter-spacing: -0.01em;
    margin-bottom: var(--space-4);
  }

  /* Subheading */
  .section-hero__subheading {
    font-family: var(--font-body);
    font-size: clamp(1rem, 4vw, 1.125rem);
    font-weight: 400;
    line-height: 1.6;
    color: var(--text-secondary);
    max-width: 480px;
    margin: 0 auto var(--space-6);
  }

  /* CTA wrapper */
  .section-hero__cta-mobile {
    display: flex;
    justify-content: center;
    padding: 0 var(--space-4) var(--space-8);
  }

  /* Primary button */
  .btn--hero-primary {
    padding: 1rem 2rem;
    font-size: var(--text-base);
    font-weight: 600;
    min-height: 48px;
    min-width: 200px;
    background: linear-gradient(135deg,
      var(--copper-400), var(--copper-500));
    color: white;
    border: none;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    transition: var(--transition-hover-lift);
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    text-decoration: none;
  }

  .btn--hero-primary:hover {
    background: linear-gradient(135deg,
      var(--copper-300), var(--copper-400));
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  /* Scroll hint */
  .section-hero__scroll-hint {
    display: flex;
    justify-content: center;
    padding: var(--space-4) 0 var(--space-6);
    opacity: 0.6;
    animation: gentleBounce 2s ease-in-out infinite;
  }

  @keyframes gentleBounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(6px); }
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .section-hero__scroll-hint {
      animation: none;
    }
  }

} /* End mobile */
```

---

## Final Visual Mockup (Detailed)

```
iPhone 14 (393×852px) — Light Theme
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ BRANCHSTONE        [☀]  [♡]  [☰] ┃ ← Header (64px)
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                   ┃
┃          ┌─────────────┐          ┃
┃          │             │          ┃
┃          │   ARTWORK   │          ┃
┃          │   IMAGE     │          ┃  Hero Image
┃          │ (cover.webp)│          ┃  511px (60vh)
┃          │             │          ┃  No overlay
┃          │  Natural    │          ┃
┃          │  materials  │          ┃
┃          │  forest     │          ┃
┃          │  textures   │          ┃
┃          └─────────────┘          ┃
┃                                   ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫ ← 575px
┃ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ┃
┃ ░                               ░ ┃  #FAF9F7 bg
┃ ░   Where Forest Meets Art      ░ ┃  32px (H1)
┃ ░                               ░ ┃  Cormorant
┃ ░   One-of-a-kind mixed-media   ░ ┃  #1A1816
┃ ░   artworks made with foraged  ░ ┃
┃ ░   natural materials.          ░ ┃  16.5px (body)
┃ ░                               ░ ┃  Inter
┃ ░   ┌─────────────────────────┐ ░ ┃  #4A4745
┃ ░   │                         │ ░ ┃
┃ ░   │ Explore the Works  →    │ ░ ┃  48px button
┃ ░   │                         │ ░ ┃  Copper gradient
┃ ░   └─────────────────────────┘ ░ ┃  #B8866B → #A67757
┃ ░                               ░ ┃
┃ ░              ↓                ░ ┃  Scroll hint
┃ ░                               ░ ┃  24px, opacity 0.6
┃ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ ┃  Gentle bounce
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫ ← ~825px
┃                                   ┃
┃   ARTIST BY THE NUMBERS           ┃  Next section
┃                                   ┃  begins
┃   [70+] [9+] [100%]               ┃
┃                                   ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

---

**Document Version:** 1.0
**Companion to:** mobile-hero-inline-design.md
**Date:** 2026-01-08
**Purpose:** Visual reference for implementation
