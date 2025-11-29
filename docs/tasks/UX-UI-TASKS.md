# Branchstone Art Portfolio - UX/UI Task Breakdown

**Date:** 2025-11-28
**Reference:** UX-UI-REVIEW-001-nextgen-design.md
**Sprint Planning:** Organized by Priority (P0-P3) and Complexity (S/M/L/XL)

---

## Priority Legend

- **P0 (Critical):** Must-have for next-gen experience, high ROI
- **P1 (High):** Important for competitive parity, strong ROI
- **P2 (Medium):** Nice-to-have enhancements, moderate ROI
- **P3 (Low):** Future considerations, experimental features

## Complexity Legend

- **S (Small):** 1-2 days, minimal dependencies
- **M (Medium):** 3-5 days, some dependencies
- **L (Large):** 1-2 weeks, multiple dependencies
- **XL (Extra Large):** 2-4 weeks, complex integration

---

## Quick Wins (Ship in 1-2 Weeks)

These tasks have high impact and low-medium complexity. Prioritize for immediate improvement.

### QW-001: Pricing & Availability Transparency
**Priority:** P0 | **Complexity:** S | **Effort:** 1-2 days

**Description:**
Display artwork prices and availability status in gallery cards and lightbox.

**Tasks:**
1. Update `artworks.json` schema:
   ```json
   {
     "price": 1200,
     "currency": "USD",
     "availability": "available" | "sold" | "commission",
     "priceRange": { "min": 500, "max": 1500 } // for commissions
   }
   ```
2. Create CSS badges for availability:
   - Green dot + "Available" (`.badge-available`)
   - Red dot + "Sold" (`.badge-sold`)
   - Orange dot + "Commission Only" (`.badge-commission`)
3. Update gallery card HTML to display price
4. Update lightbox caption to show price + availability
5. Add translations (EN/UA) for price labels

**Acceptance Criteria:**
- [ ] All artworks have price displayed or "Price on Request"
- [ ] Availability badge visible in gallery and lightbox
- [ ] Color contrast meets WCAG AA (3:1 for badges)
- [ ] Mobile: Badges readable, min 44x44px touch target
- [ ] Translations complete (EN/UA)

**Dependencies:** None
**Files to Edit:** `docs/js/artworks.json`, `docs/css/04-gallery.css`, `docs/js/app.js`, `docs/js/i18n.js`

---

### QW-002: Related Artworks in Lightbox
**Priority:** P0 | **Complexity:** S | **Effort:** 2 days

**Description:**
Add "Similar Artworks" carousel below lightbox caption to increase discovery.

**Tasks:**
1. Create similarity algorithm:
   - Match by material tags (Wood, Moss, Resin)
   - Match by size category (Small, Medium, Large)
   - Fallback: Same collection/series
2. Add carousel component below lightbox caption
3. Fetch 3-5 related artworks on lightbox open
4. Click related artwork → Navigate to that artwork in lightbox
5. Update ARIA labels for accessibility

**Acceptance Criteria:**
- [ ] Carousel shows 3-5 related artworks
- [ ] Click related artwork → Lightbox updates (smooth transition)
- [ ] Keyboard navigable (tab to carousel, arrow keys to navigate)
- [ ] Mobile: Swipe-friendly carousel
- [ ] No related artworks? Hide section (graceful degradation)

**Dependencies:** None
**Files to Edit:** `docs/css/04-gallery.css`, `docs/js/app.js`, `docs/index.html` (lightbox template)

---

### QW-003: Testimonials & Press Page
**Priority:** P0 | **Complexity:** S | **Effort:** 2 days

**Description:**
Create dedicated "Press & Testimonials" page with collector reviews, press logos, and exhibition timeline.

**Tasks:**
1. Create `docs/press.html` page:
   - Section 1: Featured Press (logos + links)
   - Section 2: Collector Testimonials (photos, names, quotes)
   - Section 3: Exhibition Timeline (interactive horizontal scroll)
2. Design testimonial card component:
   - Collector photo (round, 80px)
   - Quote (italic, 1.125rem)
   - Name + location (0.875rem, secondary color)
   - Star rating (5-star visual)
3. Add press logos (The New York Times, Artsy, Local Magazine)
4. Create timeline component:
   - Horizontal scroll-snap
   - Year markers
   - Gallery names + cities
   - Exhibition photos
5. Add link to Press page in footer navigation

**Acceptance Criteria:**
- [ ] Press page accessible from footer
- [ ] At least 5 real collector testimonials with photos
- [ ] At least 3 press logos (or placeholder for future)
- [ ] Timeline shows 3-5 exhibitions/milestones
- [ ] Mobile responsive (timeline swipes smoothly)
- [ ] WCAG AA compliant (contrast, alt text)

**Dependencies:** Content collection (testimonials, press, exhibitions)
**Files to Create:** `docs/press.html`
**Files to Edit:** `docs/css/12-sections.css` (new section styles), `docs/index.html` (footer link), `docs/gallery.html`, `docs/about.html`, `docs/contact.html` (footer link)

---

### QW-004: Instagram Feed Integration
**Priority:** P1 | **Complexity:** S | **Effort:** 1 day

**Description:**
Embed latest 6-9 Instagram posts on homepage to show social proof and keep content fresh.

**Tasks:**
1. Set up Instagram Basic Display API:
   - Create Facebook Developer App
   - Get Instagram Access Token (long-lived)
   - Store token in environment variable (`.env` file)
2. Create Instagram feed component on homepage:
   - Fetch latest 9 posts from API
   - Display in 3x3 grid (desktop) or 3x1 horizontal scroll (mobile)
   - Link each post to Instagram (target="_blank")
3. Add loading skeleton for Instagram feed
4. Handle API errors gracefully (show fallback message)
5. Cache responses for 1 hour (reduce API calls)

**Acceptance Criteria:**
- [ ] Homepage displays 9 latest Instagram posts
- [ ] Posts link to Instagram
- [ ] Loading skeleton while fetching
- [ ] Error handling: "Follow us on Instagram @branchstone.art"
- [ ] Mobile: Horizontal scroll, snap scrolling
- [ ] Desktop: 3x3 grid, hover effect

**Dependencies:** Instagram Basic Display API setup
**Files to Edit:** `docs/index.html`, `docs/css/12-sections.css`, `docs/js/app.js` (new Instagram module)

---

## E-Commerce Essentials (P0 - 4-6 Weeks)

### EC-001: Shopping Cart Implementation
**Priority:** P0 | **Complexity:** M | **Effort:** 5 days

**Description:**
Implement client-side shopping cart with local storage persistence.

**Tasks:**
1. Create cart state management:
   - Add to cart function (artwork ID, quantity)
   - Remove from cart
   - Update quantity (for prints)
   - Clear cart
   - Store in `localStorage` (persist across sessions)
2. Add cart icon to header:
   - Cart icon (SVG)
   - Badge with item count
   - Click → Open cart drawer
3. Create cart drawer (slide-in from right):
   - List cart items (thumbnail, title, price, quantity)
   - Remove button per item
   - Subtotal calculation
   - "Proceed to Checkout" button
   - "Continue Shopping" button
4. Add "Add to Cart" button in lightbox:
   - Replace "Purchase Inquiry" with "Add to Cart"
   - Show toast notification on add: "Added to cart!"
   - Disable if artwork is sold
5. Update mobile navigation:
   - Cart icon in header (always visible)
   - Badge on mobile menu toggle

**Acceptance Criteria:**
- [ ] Add to cart from lightbox works
- [ ] Cart drawer shows all items correctly
- [ ] Remove from cart works
- [ ] Subtotal calculates correctly
- [ ] Cart persists on page refresh (localStorage)
- [ ] Cart count badge updates in real-time
- [ ] Mobile: Cart drawer accessible, swipe-to-close
- [ ] Accessibility: Screen reader announces cart changes

**Dependencies:** QW-001 (pricing data)
**Files to Edit:** `docs/js/app.js` (cart module), `docs/css/03-header.css`, `docs/css/04-gallery.css`, `docs/index.html` (header cart icon)

---

### EC-002: Stripe Checkout Integration
**Priority:** P0 | **Complexity:** L | **Effort:** 1-2 weeks

**Description:**
Integrate Stripe Checkout for secure payment processing.

**Tasks:**
1. Set up Stripe account:
   - Create Stripe account (test mode)
   - Get publishable key and secret key
   - Store keys in environment variables
2. Create server-side endpoint (Netlify Function or Vercel Serverless):
   - POST `/api/create-checkout-session`
   - Accepts cart items (array of artwork IDs + quantities)
   - Creates Stripe Checkout Session
   - Returns session ID
3. Client-side Checkout flow:
   - "Proceed to Checkout" button in cart drawer
   - Call `/api/create-checkout-session` with cart data
   - Redirect to Stripe Checkout (hosted page)
   - Handle success redirect (`/success.html`)
   - Handle cancel redirect (back to cart)
4. Create success page (`docs/success.html`):
   - "Order Confirmed" message
   - Order summary (items purchased)
   - "We'll email you tracking info" message
   - Clear cart on success
5. Email notifications:
   - Stripe sends receipt to buyer
   - Webhook sends order details to artist (SendGrid/Mailgun)
6. Test with Stripe test cards

**Acceptance Criteria:**
- [ ] Checkout button redirects to Stripe Checkout
- [ ] Stripe Checkout displays correct items and prices
- [ ] Test payment completes successfully
- [ ] Success page shows order confirmation
- [ ] Cart clears after successful purchase
- [ ] Artist receives email notification of order
- [ ] Buyer receives Stripe receipt email
- [ ] Handles errors gracefully (payment failed, etc.)

**Dependencies:** EC-001 (cart), QW-001 (pricing), Server-side function hosting (Netlify/Vercel)
**Files to Create:** `docs/success.html`, `netlify/functions/create-checkout-session.js` (or equivalent)
**Files to Edit:** `docs/js/app.js` (checkout module), `docs/css/12-sections.css` (success page styles)

**Technical Stack:**
- **Payment:** Stripe Checkout (hosted)
- **Server:** Netlify Functions or Vercel Serverless Functions
- **Email:** Stripe receipts + SendGrid for artist notifications

---

### EC-003: Print-on-Demand Integration
**Priority:** P1 | **Complexity:** L | **Effort:** 1-2 weeks

**Description:**
Offer high-quality prints of sold original artworks via Printful or Gelato.

**Tasks:**
1. Choose print-on-demand provider (Printful or Gelato)
2. Upload artwork images to POD platform
3. Configure print products:
   - Fine Art Paper: 8x10, 11x14, 16x20, 24x36
   - Canvas: 12x16, 18x24, 24x32
   - Metal Print: 12x12, 16x20
4. Sync POD products to website:
   - Add "Print Options" section in lightbox (for sold originals)
   - Display print sizes + prices
   - Add to cart → Includes print specs
5. Update checkout to handle POD orders:
   - Send POD order to Printful/Gelato API on successful payment
   - POD fulfills and ships directly to buyer
6. Add "Print Only" filter to gallery:
   - Show artworks available as prints

**Acceptance Criteria:**
- [ ] Sold artworks show "Print Options" in lightbox
- [ ] Print sizes and prices display correctly
- [ ] Add print to cart works (with size selection)
- [ ] Checkout sends POD order to Printful/Gelato
- [ ] Buyer receives tracking number from POD provider
- [ ] Artist receives notification of POD order
- [ ] "Prints Available" filter works in gallery

**Dependencies:** EC-001 (cart), EC-002 (checkout), Printful/Gelato account
**Files to Edit:** `docs/js/app.js` (POD module), `docs/css/04-gallery.css`, `netlify/functions/create-checkout-session.js` (POD order creation)

---

## Immersive Experience Enhancements (P1 - 2-4 Weeks)

### IMM-001: Masonry Grid Layout
**Priority:** P0 | **Complexity:** M | **Effort:** 3 days

**Description:**
Replace uniform grid with masonry layout to showcase natural aspect ratios.

**Tasks:**
1. Update gallery grid CSS:
   - Use CSS Grid with `grid-auto-flow: dense`
   - Variable row heights: `grid-auto-rows: minmax(200px, auto)`
   - Some cards span 2 rows: `.gallery-item:nth-child(3n+1) { grid-row: span 2; }`
2. Add view toggle buttons above gallery:
   - "Grid" (current uniform)
   - "Masonry" (new natural aspect ratios)
   - "List" (vertical list with large previews)
   - "Slideshow" (fullscreen carousel)
3. Save view preference in `localStorage`
4. Update mobile: Masonry may not work well on mobile, default to single column
5. Optimize for performance (content-visibility, lazy loading)

**Acceptance Criteria:**
- [ ] Masonry view displays artworks in natural aspect ratios
- [ ] No awkward gaps or overlaps
- [ ] View toggle buttons work (Grid, Masonry, List, Slideshow)
- [ ] View preference persists on page refresh
- [ ] Mobile: Single column or 2-column masonry
- [ ] Accessibility: View toggle buttons keyboard-navigable

**Dependencies:** None
**Files to Edit:** `docs/css/04-gallery.css`, `docs/js/app.js` (view switcher), `docs/gallery.html` (view toggle buttons)

---

### IMM-002: Scroll-Triggered Animations (GSAP)
**Priority:** P1 | **Complexity:** M | **Effort:** 4-5 days

**Description:**
Add scroll-driven animations for gallery cards, hero section, and page sections.

**Tasks:**
1. Install GSAP library:
   - Add GSAP CDN to `<head>` or bundle
   - Add ScrollTrigger plugin
2. Animate hero section:
   - Parallax background image (moves slower than foreground)
   - Title fades in from bottom
   - CTA buttons scale in with stagger
3. Animate gallery cards:
   - Fade in from bottom as user scrolls
   - Stagger effect (cards appear sequentially, 100ms delay)
   - Scale effect (0.95 → 1)
4. Animate About page cards:
   - Slide in from left/right alternating
5. Add scroll progress bar:
   - Fixed at top of page
   - Width increases as user scrolls (0% → 100%)
6. Respect `prefers-reduced-motion` (disable animations if set)

**Acceptance Criteria:**
- [ ] Hero title and CTA animate on page load
- [ ] Gallery cards animate on scroll into view
- [ ] Animations smooth, not janky (60fps)
- [ ] No animation on mobile (performance)
- [ ] Respects `prefers-reduced-motion`
- [ ] Scroll progress bar visible, accurate

**Dependencies:** GSAP library
**Files to Edit:** `docs/js/app.js` (GSAP module), `docs/css/08-hero.css`, `docs/css/04-gallery.css`, `docs/index.html` (script tags)

---

### IMM-003: Pinch-to-Zoom in Lightbox
**Priority:** P1 | **Complexity:** M | **Effort:** 4 days

**Description:**
Enable pinch-to-zoom (mobile) and scroll-to-zoom (desktop) for artwork inspection.

**Tasks:**
1. Implement zoom functionality:
   - Desktop: Scroll wheel to zoom (2x, 4x, 8x levels)
   - Mobile: Pinch gesture to zoom (2x-8x)
   - Pan: Drag zoomed image to explore
2. Add zoom controls:
   - Zoom in button (+)
   - Zoom out button (-)
   - Reset zoom button (1:1)
3. Add zoom indicator:
   - Show current zoom level (e.g., "2x")
   - Fade out after 2 seconds
4. Update lightbox layout:
   - Zoomed image should fill viewport
   - Disable slider controls while zoomed (conflicts with panning)
5. Handle edge cases:
   - Max zoom: 8x
   - Min zoom: Fit to viewport (1x)
   - Double-tap to toggle zoom (mobile)

**Acceptance Criteria:**
- [ ] Desktop: Scroll wheel zooms in/out smoothly
- [ ] Mobile: Pinch gesture zooms in/out smoothly
- [ ] Drag to pan zoomed image
- [ ] Zoom controls work (+, -, reset)
- [ ] Zoom indicator shows current level
- [ ] Double-tap to zoom (mobile)
- [ ] Slider controls disabled while zoomed
- [ ] Accessibility: Zoom controls keyboard-navigable

**Dependencies:** None
**Files to Edit:** `docs/css/04-gallery.css`, `docs/js/app.js` (zoom module)

**Libraries:** Hammer.js (for pinch gesture) or native Touch Events

---

### IMM-004: AR "View in Your Space" Feature
**Priority:** P1 | **Complexity:** L | **Effort:** 1-2 weeks

**Description:**
Let collectors visualize artwork on their wall via phone camera.

**Tasks:**
1. Create 3D models of artworks:
   - Convert artwork JPEGs to 3D planes with depth (Blender)
   - Export as USDZ (iOS) and glTF (Android)
   - Add realistic lighting and shadows
2. Implement `<model-viewer>` web component:
   - Google's model-viewer library (WebXR compatible)
   - Load USDZ/glTF models per artwork
3. Add "View in Your Space" button in lightbox:
   - iOS: Launches AR Quick Look (native)
   - Android: Launches Scene Viewer (native)
   - Desktop: Shows 3D preview with room background
4. Fallback 3D preview (desktop/non-AR devices):
   - Show 3D model on virtual wall
   - Adjust wall color (white, grey, beige, dark)
   - Adjust artwork size on wall
5. Track AR usage (analytics):
   - How many users click "View in Your Space"
   - Which artworks are viewed most in AR

**Acceptance Criteria:**
- [ ] "View in Your Space" button visible in lightbox
- [ ] iOS: AR Quick Look launches correctly
- [ ] Android: Scene Viewer launches correctly
- [ ] Desktop: 3D preview shows artwork on wall
- [ ] 3D models load quickly (< 2MB per model)
- [ ] Fallback works on non-AR devices
- [ ] Analytics track AR usage
- [ ] Accessibility: Button labeled for screen readers

**Dependencies:** 3D model creation (Blender), model-viewer library
**Files to Edit:** `docs/css/04-gallery.css`, `docs/js/app.js` (AR module), `docs/index.html` (lightbox template)

**Technical Stack:**
- **3D Models:** Blender (free, open-source)
- **AR Library:** [Google Model Viewer](https://modelviewer.dev/)
- **Hosting:** Serve USDZ/glTF from CDN (Cloudflare, AWS S3)

---

### IMM-005: Cursor Effects (Desktop Only)
**Priority:** P2 | **Complexity:** M | **Effort:** 3-4 days

**Description:**
Custom cursor that samples artwork colors on hover for immersive desktop experience.

**Tasks:**
1. Create custom cursor component:
   - Replace default cursor with custom SVG circle
   - Cursor follows mouse with easing (smooth trail)
2. Color-reactive cursor:
   - On gallery card hover, sample artwork's dominant color
   - Cursor changes to sampled color
   - Add glow effect (box-shadow)
3. Cursor states:
   - Default: Neutral color (accent color)
   - Hover artwork: Artwork dominant color
   - Hover link: Pointer cursor + scale up
   - Hover button: Scale down (press effect)
4. Disable on mobile (no cursor on touch devices)
5. Respect `prefers-reduced-motion` (use default cursor if set)

**Acceptance Criteria:**
- [ ] Custom cursor visible on desktop
- [ ] Cursor color changes when hovering artworks
- [ ] Smooth easing, no lag
- [ ] Disabled on mobile
- [ ] Respects reduced motion preference
- [ ] Accessibility: Doesn't interfere with keyboard navigation

**Dependencies:** None
**Files to Edit:** `docs/css/07-utilities.css`, `docs/js/app.js` (cursor module)

**Libraries:** Vanilla JS or GSAP for cursor animation

---

## Content & Engagement (P1 - 1-3 Weeks)

### CONT-001: Studio & Process Blog
**Priority:** P1 | **Complexity:** M | **Effort:** 5 days

**Description:**
Create "Studio Journal" blog for behind-the-scenes content, material sourcing, and creative process.

**Tasks:**
1. Choose blog platform:
   - Option A: Static blog with Markdown files (11ty, Jekyll)
   - Option B: Headless CMS (Contentful, Sanity, Strapi)
   - Recommendation: Static Markdown (simpler, faster)
2. Create blog page (`docs/blog.html` or `docs/journal.html`):
   - List view: Cards with thumbnail, title, date, excerpt
   - Filter by category: Process, Materials, Inspiration, Exhibitions
   - Search functionality
3. Create blog post template:
   - Hero image
   - Title, date, reading time
   - Markdown content (paragraphs, headings, images, videos)
   - Tags (e.g., "Wood", "Moss", "Studio Tour")
   - Share buttons (copy link, Instagram, Pinterest)
4. Seed with 5-10 blog posts:
   - "Where I Find Wood: Sonoma County Redwoods"
   - "Why I Use Eco-Friendly Resin"
   - "Studio Tour: My Creative Space"
   - "The Story Behind [Artwork Name]"
   - "From Ukraine to California: My Art Journey"
5. Add RSS feed for subscribers
6. Link to blog in main navigation

**Acceptance Criteria:**
- [ ] Blog page accessible from navigation
- [ ] At least 5 published blog posts
- [ ] Posts filterable by category and tags
- [ ] Search functionality works
- [ ] Mobile responsive (reading experience)
- [ ] RSS feed available
- [ ] Share buttons work
- [ ] Accessibility: Semantic HTML, alt text for images

**Dependencies:** Content creation (blog posts, photos, videos)
**Files to Create:** `docs/blog.html` or `docs/journal.html`, blog post Markdown files
**Files to Edit:** `docs/css/12-sections.css` (blog styles), `docs/index.html` (nav link)

**Recommendation:** Use [11ty (Eleventy)](https://www.11ty.dev/) for static blog generation

---

### CONT-002: Collections & Series Pages
**Priority:** P1 | **Complexity:** M | **Effort:** 4 days

**Description:**
Group artworks into curated collections (e.g., "Woodland Memories", "Coastal Fragments").

**Tasks:**
1. Update `artworks.json` schema:
   ```json
   {
     "collection": "Woodland Memories",
     "series": "Series 1",
     "order": 5 // display order within collection
   }
   ```
2. Create Collections landing page (`docs/collections.html`):
   - Grid of collection cards
   - Each card: Collection name, hero image, artwork count, description
   - Click card → Navigate to collection detail page
3. Create Collection detail page (`docs/collection.html?name=woodland-memories`):
   - Collection hero image + description
   - Grid of artworks in this collection (filtered)
   - "Share Collection" button (copy link)
4. Add Collections link to main navigation
5. Add "View Full Collection" link in lightbox (if artwork is part of collection)

**Acceptance Criteria:**
- [ ] Collections landing page lists all collections
- [ ] Collection detail page shows filtered artworks
- [ ] At least 3 collections created (Woodland, Coastal, Abstract)
- [ ] Each collection has 3-8 artworks
- [ ] "View Full Collection" link in lightbox works
- [ ] Share collection link works
- [ ] Mobile responsive
- [ ] Accessibility: Semantic headings, alt text

**Dependencies:** None
**Files to Create:** `docs/collections.html`, `docs/collection.html`
**Files to Edit:** `docs/js/artworks.json`, `docs/css/12-sections.css`, `docs/index.html` (nav link)

---

### CONT-003: Commission Request Flow
**Priority:** P1 | **Complexity:** M | **Effort:** 4-5 days

**Description:**
Create dedicated commission page with structured request form and pricing tiers.

**Tasks:**
1. Create Commission page (`docs/commission.html`):
   - Hero section: "Commission Custom Artwork"
   - How It Works: 5-step process (Inquiry → Consultation → Deposit → Creation → Delivery)
   - Pricing tiers: Small ($500-1500), Medium ($1500-3000), Large ($3000+)
   - Example commissions (photos + descriptions)
   - FAQ section
2. Create commission request form:
   - Name, email, phone
   - Artwork size preference (Small/Medium/Large)
   - Material preferences (Wood, Moss, Resin, Bark, Other)
   - Color palette preference (Warm/Cool/Neutral/Mixed)
   - Budget range (slider: $500 - $5000+)
   - Inspiration (textarea: Describe your vision)
   - Upload inspiration images (optional, max 3)
   - Timeline (When do you need it? Dropdown)
3. Form submission:
   - Validate inputs
   - Send to Formspree or artist email (via server function)
   - Show confirmation message: "We'll respond within 24 hours"
4. Add "Request Commission" CTA on homepage
5. Link Commission page in navigation

**Acceptance Criteria:**
- [ ] Commission page accessible from navigation
- [ ] Form collects all required info
- [ ] File upload works (max 3 images, 5MB each)
- [ ] Form validation works (required fields, email format)
- [ ] Form submission sends email to artist
- [ ] Confirmation message shows after submission
- [ ] Pricing tiers clearly displayed
- [ ] Mobile responsive
- [ ] Accessibility: Form labels, error messages

**Dependencies:** Formspree or server function for email
**Files to Create:** `docs/commission.html`
**Files to Edit:** `docs/css/11-contact.css` (form styles), `docs/index.html` (nav link, homepage CTA)

---

## Mobile Enhancements (P1 - 1 Week)

### MOB-001: Swipe Gestures in Lightbox
**Priority:** P1 | **Complexity:** M | **Effort:** 3 days

**Description:**
Add swipe gestures for mobile lightbox navigation and closing.

**Tasks:**
1. Implement swipe gestures:
   - Swipe left → Next artwork
   - Swipe right → Previous artwork
   - Swipe down → Close lightbox
2. Use Hammer.js or native Touch Events:
   - Detect swipe direction and distance
   - Threshold: 50px minimum swipe to trigger action
3. Add visual feedback:
   - Lightbox image follows finger during swipe (drag effect)
   - Elastic bounce if at first/last artwork
4. Update lightbox controls:
   - Hide prev/next buttons on mobile (swipe is primary navigation)
   - Show touch hint on first lightbox open: "Swipe to navigate"
5. Accessibility:
   - Swipe doesn't interfere with zoom/pan
   - Screen reader announces artwork change

**Acceptance Criteria:**
- [ ] Swipe left/right navigates between artworks
- [ ] Swipe down closes lightbox
- [ ] Smooth drag effect during swipe
- [ ] Touch hint shows on first open (dismissible)
- [ ] Doesn't conflict with zoom/pan gestures
- [ ] Works on iOS and Android
- [ ] Accessibility: Screen reader announces changes

**Dependencies:** Hammer.js library (or native Touch Events)
**Files to Edit:** `docs/js/app.js` (lightbox module), `docs/css/04-gallery.css`

---

### MOB-002: Bottom Tab Bar Navigation
**Priority:** P1 | **Complexity:** M | **Effort:** 3-4 days

**Description:**
Add bottom tab bar for primary navigation on mobile (iOS/Android app-style).

**Tasks:**
1. Create bottom tab bar component:
   - Fixed at bottom of screen (z-index: 100)
   - 5 tabs: Home, Gallery, Favorites, About, Contact
   - Icon + label per tab
   - Active tab highlighted (accent color)
2. Update mobile navigation:
   - Hide hamburger menu (optional, or keep for secondary links)
   - Tab bar handles primary navigation
3. Design tab icons:
   - Home: House icon
   - Gallery: Grid icon
   - Favorites: Heart icon
   - About: User icon
   - Contact: Mail icon
4. Add Favorites page (if not already implemented):
   - List of favorited artworks
   - Remove from favorites button
5. Tab bar behavior:
   - Always visible (except in lightbox)
   - Smooth transitions between pages
6. Accessibility:
   - ARIA labels for each tab
   - Keyboard navigable
   - Screen reader announces tab changes

**Acceptance Criteria:**
- [ ] Bottom tab bar visible on mobile (< 768px)
- [ ] Tabs navigate to correct pages
- [ ] Active tab highlighted
- [ ] Icons clear, min 44x44px touch target
- [ ] Hidden in lightbox (doesn't obstruct artwork)
- [ ] Accessibility: Keyboard navigable, ARIA labels
- [ ] Works on iOS and Android

**Dependencies:** Favorites feature (if not implemented)
**Files to Edit:** `docs/css/03-header.css` (tab bar styles), `docs/index.html`, `docs/gallery.html`, `docs/about.html`, `docs/contact.html` (tab bar HTML)

---

### MOB-003: Haptic Feedback
**Priority:** P2 | **Complexity:** S | **Effort:** 1 day

**Description:**
Add vibration feedback for key interactions on mobile.

**Tasks:**
1. Implement haptic feedback:
   - Add to favorites: 10ms vibration
   - Add to cart: 50-30-50ms pattern (3 pulses)
   - Remove from cart: 20ms vibration
   - Submit form: 30ms vibration
2. Feature detection:
   - Check if `navigator.vibrate` is supported
   - Graceful degradation if not supported
3. User preference:
   - Add toggle in settings (optional): "Enable haptic feedback"
   - Store in localStorage

**Acceptance Criteria:**
- [ ] Vibration on favorite/unfavorite (10ms)
- [ ] Vibration on add to cart (50-30-50ms)
- [ ] Works on iOS Safari 16+ and Android Chrome
- [ ] Graceful degradation on unsupported devices
- [ ] Optional: User can disable via toggle

**Dependencies:** None
**Files to Edit:** `docs/js/app.js` (haptic module)

**Browser Support:** iOS Safari 16+, Android Chrome 32+

---

## Accessibility Enhancements (P1 - 3 Days)

### ACC-001: WCAG AAA Compliance
**Priority:** P1 | **Complexity:** S | **Effort:** 2-3 days

**Description:**
Improve contrast ratios, focus indicators, and keyboard navigation to meet WCAG 2.1 AAA.

**Tasks:**
1. Increase color contrast:
   - Secondary text: `#4A4A4A` → `#3A3A3A` (7:1 ratio)
   - UI components (borders, icons): Ensure 3:1 ratio minimum
2. Enhance focus indicators:
   - Increase outline width from 3px → 4px
   - Add focus indicator to ALL interactive elements
   - Visible focus on filter buttons, carousel controls, form inputs
3. Implement roving tabindex:
   - Filter buttons: Tab to group, arrow keys to navigate within
   - Carousel: Tab to controls, arrow keys to navigate
4. Add keyboard shortcuts:
   - `/` to focus search (when search is implemented)
   - `Esc` to close modals (lightbox, cart drawer)
   - `?` to show keyboard shortcuts overlay
5. Add live regions:
   - Gallery filtering: Announce "Showing 12 artworks" after filter
   - Cart updates: Announce "Added [Artwork] to cart"
6. Improve link context:
   - "View All" → "View All <span class='sr-only'>artworks in gallery</span>"

**Acceptance Criteria:**
- [ ] All text meets 7:1 contrast ratio (AAA)
- [ ] All UI components meet 3:1 contrast (AAA)
- [ ] All interactive elements have visible focus indicator
- [ ] Keyboard shortcuts work (/, Esc, ?)
- [ ] Live regions announce dynamic changes
- [ ] Roving tabindex works for button groups
- [ ] Screen reader testing passes (NVDA, JAWS, VoiceOver)

**Dependencies:** None
**Files to Edit:** `docs/css/01-tokens.css` (color updates), `docs/css/05-buttons.css`, `docs/css/04-gallery.css`, `docs/js/app.js` (keyboard shortcuts, live regions)

---

### ACC-002: Site Map & Search
**Priority:** P2 | **Complexity:** M | **Effort:** 3-4 days

**Description:**
Add site map page and search functionality for improved navigation.

**Tasks:**
1. Create Site Map page (`docs/sitemap.html`):
   - Hierarchical list of all pages and sections
   - Grouped by category (Home, Gallery, About, Contact, Blog, etc.)
   - Link in footer
2. Implement search functionality:
   - Search box in header (desktop: always visible, mobile: icon → opens modal)
   - Search across artwork titles, materials, descriptions, blog posts
   - Live search results (dropdown)
   - Full search results page
3. Search indexing:
   - Generate search index JSON (all artwork metadata + blog posts)
   - Use Fuse.js for fuzzy search
4. Keyboard navigation:
   - `/` focuses search box
   - Arrow keys navigate results
   - Enter opens selected result

**Acceptance Criteria:**
- [ ] Site map page lists all pages
- [ ] Search box visible in header
- [ ] Search returns relevant results (artworks, blog posts)
- [ ] Live search dropdown shows top 5 results
- [ ] Full results page shows all matches
- [ ] Keyboard navigation works (/, arrow keys, enter)
- [ ] Accessibility: Search results announced to screen readers

**Dependencies:** Blog (for blog post search), Fuse.js library
**Files to Create:** `docs/sitemap.html`, search index JSON
**Files to Edit:** `docs/css/03-header.css` (search box), `docs/js/app.js` (search module)

---

## Performance & PWA (P1 - 1 Week)

### PERF-001: Advanced Image Optimization
**Priority:** P1 | **Complexity:** M | **Effort:** 3-4 days

**Description:**
Optimize images for faster loading and better performance.

**Tasks:**
1. Convert images to WebP format:
   - Generate WebP versions of all artworks
   - Keep JPEG as fallback for older browsers
   - Use `<picture>` element for WebP + JPEG fallback
2. Generate responsive image sizes:
   - 400w, 800w, 1200w, 1920w for each artwork
   - Use `srcset` and `sizes` attributes
   - Mobile: Load 400w-800w
   - Tablet: Load 800w-1200w
   - Desktop: Load 1200w-1920w
3. Optimize LQIP (Low-Quality Image Placeholders):
   - Generate 20px width blurred thumbnails
   - Inline as base64 in HTML or load separately
   - Fade from blurred to sharp when full image loads
4. Lazy loading:
   - Use native `loading="lazy"` attribute
   - Intersection Observer for advanced lazy loading (if needed)
5. CDN hosting:
   - Host images on Cloudflare, Imgix, or AWS CloudFront
   - Automatic WebP conversion and resizing

**Acceptance Criteria:**
- [ ] All images have WebP versions with JPEG fallback
- [ ] Responsive images load correct size for viewport
- [ ] LQIP shows instantly, fades to full image smoothly
- [ ] Lazy loading works on scroll
- [ ] Images hosted on CDN (optional but recommended)
- [ ] Lighthouse Performance score: 95+ (mobile), 100 (desktop)

**Dependencies:** Image processing tools (Squoosh CLI, ImageOptim, Sharp)
**Files to Edit:** `docs/index.html`, `docs/gallery.html`, `docs/about.html` (image tags), `docs/js/app.js` (lazy loading)

**Tools:**
- [Squoosh CLI](https://github.com/GoogleChromeLabs/squoosh/tree/dev/cli) (image compression)
- [Sharp](https://sharp.pixelplumbing.com/) (Node.js image processing)
- [Cloudflare Images](https://www.cloudflare.com/products/cloudflare-images/) (CDN + auto-optimization)

---

### PERF-002: Progressive Web App (PWA)
**Priority:** P1 | **Complexity:** M | **Effort:** 4-5 days

**Description:**
Enable offline gallery viewing, install prompt, and push notifications.

**Tasks:**
1. Create Web App Manifest (`docs/manifest.json`):
   - App name, description, icons
   - Start URL, display mode (standalone)
   - Theme color, background color
2. Update Service Worker (`docs/sw.js`):
   - Cache strategy:
     - Static assets (CSS, JS): Cache first
     - Artwork images: Network first, fallback to cache
     - API calls: Network only
   - Offline page: Show cached artworks if offline
   - Cache last 50 viewed artworks
3. Install prompt:
   - Show install banner on mobile/desktop (Chrome, Edge, Safari)
   - "Add to Home Screen" button in footer
4. Push notifications (optional, requires backend):
   - Subscribe to notifications (opt-in)
   - Send push when new artwork is added
   - Send push when favorited artwork is on sale
5. Update icons:
   - 192x192, 512x512 PNG icons for home screen
   - Maskable icon for Android adaptive icons

**Acceptance Criteria:**
- [ ] PWA install prompt appears on supported browsers
- [ ] App installs to home screen (mobile/desktop)
- [ ] Offline mode works (shows cached artworks)
- [ ] Service worker caches last 50 artworks
- [ ] Push notifications work (if implemented)
- [ ] Lighthouse PWA score: 100

**Dependencies:** Service Worker, Web App Manifest
**Files to Create:** `docs/manifest.json`, update `docs/sw.js`
**Files to Edit:** `docs/index.html` (manifest link), `docs/js/app.js` (install prompt)

**Resources:**
- [Workbox](https://developers.google.com/web/tools/workbox) (service worker library)
- [PWA Builder](https://www.pwabuilder.com/) (manifest generator)

---

## Advanced Features (P2-P3 - Future Enhancements)

### ADV-001: 3D Gallery Walkthrough (Three.js)
**Priority:** P2 | **Complexity:** XL | **Effort:** 3-4 weeks

**Description:**
Create virtual 3D gallery space where users can walk around and view artworks on walls.

**Tasks:**
1. Set up Three.js scene:
   - Gallery room with walls, floor, ceiling
   - Realistic lighting (spotlights on artworks)
   - Texture-mapped walls (white gallery aesthetic)
2. Place artworks on walls:
   - Load artwork images as textures
   - Apply to 3D planes (frames)
   - Position artworks around gallery
3. Navigation:
   - WASD keys to move
   - Mouse to look around
   - Click artwork to open lightbox
4. Optimize for performance:
   - Low-poly room model
   - Texture compression
   - LOD (level of detail) for distant artworks
5. Mobile: Touch controls (joystick + swipe to look)

**Acceptance Criteria:**
- [ ] 3D gallery loads within 5 seconds
- [ ] WASD navigation works smoothly (60fps)
- [ ] Click artwork opens lightbox
- [ ] Mobile touch controls work
- [ ] Graceful fallback to 2D gallery on low-end devices

**Dependencies:** Three.js, 3D models (Blender)
**Files to Create:** `docs/gallery-3d.html`, Three.js scene files
**Files to Edit:** `docs/index.html` (link to 3D gallery)

**Priority:** P2 (Nice-to-have, high complexity)

---

### ADV-002: AI Artwork Recommendations
**Priority:** P2 | **Complexity:** L | **Effort:** 1-2 weeks

**Description:**
Use TensorFlow.js to recommend similar artworks based on image similarity.

**Tasks:**
1. Set up TensorFlow.js:
   - Use MobileNet model for image feature extraction
   - Generate feature vectors for all artworks
   - Store vectors in JSON
2. Calculate similarity:
   - Cosine similarity between feature vectors
   - Recommend top 5 most similar artworks
3. Display recommendations:
   - "You may also like" section in lightbox
   - Related artworks carousel on homepage
4. Fallback:
   - If TensorFlow.js fails to load, use manual tags (materials, colors)

**Acceptance Criteria:**
- [ ] Recommendations show in lightbox and homepage
- [ ] Similar artworks are visually related
- [ ] TensorFlow.js loads asynchronously (doesn't block page)
- [ ] Fallback to tag-based recommendations if TF.js fails

**Dependencies:** TensorFlow.js, MobileNet model
**Files to Edit:** `docs/js/app.js` (recommendation module)

**Priority:** P2 (Nice-to-have, moderate complexity)

---

### ADV-003: Mood-Based Discovery
**Priority:** P3 | **Complexity:** M | **Effort:** 3-4 days

**Description:**
Filter artworks by mood (Calming, Energizing, Earthy, Mystical).

**Tasks:**
1. Assign mood tags to artworks:
   - Calming: Cool colors (blues, greens), horizontal compositions
   - Energizing: Warm colors (reds, oranges), high contrast
   - Earthy: Browns, greens, natural materials
   - Mystical: Dark tones, abstract shapes
2. Add mood filter buttons above gallery
3. Algorithm (optional):
   - Extract dominant colors from artwork
   - Classify mood based on color temperature and contrast
   - Use Color Thief library

**Acceptance Criteria:**
- [ ] Mood filter buttons work
- [ ] Artworks tagged with appropriate moods
- [ ] Filter shows only matching artworks
- [ ] Mobile: Mood filters in horizontal scroll

**Dependencies:** Color Thief (if using algorithm)
**Files to Edit:** `docs/js/artworks.json` (mood tags), `docs/css/04-gallery.css`, `docs/js/app.js` (filter logic)

**Priority:** P3 (Low priority, experimental)

---

## Sprint Planning Recommendations

### Sprint 1: Quick Wins (Week 1-2)
- QW-001: Pricing & Availability (2 days)
- QW-002: Related Artworks (2 days)
- QW-003: Testimonials & Press Page (2 days)
- QW-004: Instagram Feed (1 day)
- ACC-001: WCAG AAA Compliance (2 days)

**Goal:** Ship high-impact, low-complexity improvements quickly

---

### Sprint 2: E-Commerce Foundations (Week 3-4)
- EC-001: Shopping Cart (5 days)
- EC-002: Stripe Checkout (1-2 weeks)

**Goal:** Enable direct online sales

---

### Sprint 3: Immersive Experience (Week 5-6)
- IMM-001: Masonry Grid (3 days)
- IMM-002: Scroll-Triggered Animations (4 days)
- IMM-003: Pinch-to-Zoom (4 days)

**Goal:** Add "wow factor" to gallery

---

### Sprint 4: Content & Engagement (Week 7-8)
- CONT-001: Studio Blog (5 days)
- CONT-002: Collections & Series (4 days)
- CONT-003: Commission Request (4 days)

**Goal:** Build content depth and collector engagement

---

### Sprint 5: Mobile & Performance (Week 9-10)
- MOB-001: Swipe Gestures (3 days)
- MOB-002: Bottom Tab Bar (3 days)
- PERF-001: Image Optimization (3 days)
- PERF-002: PWA (4 days)

**Goal:** Optimize mobile experience and performance

---

### Sprint 6: Advanced Features (Week 11-12)
- IMM-004: AR "View in Your Space" (1-2 weeks)
- EC-003: Print-on-Demand (1-2 weeks)

**Goal:** Add cutting-edge features for differentiation

---

## Total Estimated Effort

- **Quick Wins (P0-P1):** 1-2 weeks
- **E-Commerce (P0):** 2-3 weeks
- **Immersive Experience (P1):** 2-3 weeks
- **Content & Engagement (P1):** 1-2 weeks
- **Mobile & Performance (P1):** 1-2 weeks
- **Advanced Features (P2):** 3-4 weeks

**Total (All P0-P1 Features):** 8-12 weeks (full-time developer)
**MVP (P0 Only):** 4-6 weeks

---

## Dependencies & Prerequisites

### Technical
- Stripe account (test & live keys)
- Instagram Basic Display API (Facebook Developer account)
- Print-on-Demand account (Printful or Gelato)
- Server hosting for functions (Netlify, Vercel, or AWS Lambda)
- Email service (SendGrid, Mailgun, or SMTP)
- CDN for images (Cloudflare, Imgix, or AWS CloudFront)

### Content
- High-quality artwork photos (minimum 1920px width)
- Artwork metadata (title, size, materials, description, price)
- Collector testimonials (photos, names, quotes)
- Press logos and articles
- Exhibition history (dates, galleries, cities, photos)
- Blog content (5-10 posts to start)
- Artist photos (studio, process, materials)

### Design
- 3D models for AR (USDZ, glTF)
- Print product mockups (for POD)
- Collection hero images
- Icon set (custom or library like Heroicons, Feather Icons)

---

## Tools & Libraries

### Core
- **GSAP** (animations): https://greensock.com/gsap/
- **Hammer.js** (gestures): https://hammerjs.github.io/
- **Fuse.js** (search): https://fusejs.io/

### E-Commerce
- **Stripe** (payments): https://stripe.com/
- **Printful** (POD): https://www.printful.com/
- **Gelato** (POD): https://www.gelato.com/

### 3D/AR
- **Three.js** (3D): https://threejs.org/
- **Model Viewer** (AR): https://modelviewer.dev/
- **Blender** (3D modeling): https://www.blender.org/

### Performance
- **Workbox** (service worker): https://developers.google.com/web/tools/workbox
- **Sharp** (image processing): https://sharp.pixelplumbing.com/
- **Squoosh CLI** (image compression): https://github.com/GoogleChromeLabs/squoosh/tree/dev/cli

### Content
- **11ty** (static blog): https://www.11ty.dev/
- **Contentful** (headless CMS): https://www.contentful.com/
- **Sanity** (headless CMS): https://www.sanity.io/

### Email
- **SendGrid** (transactional email): https://sendgrid.com/
- **Mailgun** (transactional email): https://www.mailgun.com/
- **Mailchimp** (newsletter): https://mailchimp.com/

### Analytics
- **Google Analytics 4** (web analytics)
- **Hotjar** (user behavior): https://www.hotjar.com/
- **Microsoft Clarity** (free heatmaps): https://clarity.microsoft.com/

---

## Testing Checklist

### Cross-Browser
- [ ] Chrome (Windows, Mac, Android)
- [ ] Firefox (Windows, Mac)
- [ ] Safari (Mac, iOS)
- [ ] Edge (Windows)

### Devices
- [ ] iPhone 13/14/15 (Safari)
- [ ] iPad Pro (Safari)
- [ ] Samsung Galaxy S22/S23 (Chrome)
- [ ] Desktop 1920x1080 (Chrome, Firefox, Safari)
- [ ] Laptop 1440x900 (all browsers)

### Accessibility
- [ ] Screen readers (NVDA, JAWS, VoiceOver, TalkBack)
- [ ] Keyboard-only navigation
- [ ] axe DevTools audit
- [ ] Lighthouse accessibility audit
- [ ] WAVE extension audit

### Performance
- [ ] Lighthouse Performance (95+ mobile, 100 desktop)
- [ ] WebPageTest (3G, 4G, Cable)
- [ ] Real device testing (not just emulators)

### Functionality
- [ ] Add to cart, checkout flow
- [ ] AR viewer on iPhone & Android
- [ ] Swipe gestures on mobile
- [ ] Zoom in lightbox (pinch & scroll)
- [ ] Form submissions (contact, commission, newsletter)
- [ ] Search functionality
- [ ] Blog post rendering
- [ ] PWA install and offline mode

---

## Next Steps

1. **Review with stakeholder** - Prioritize features based on business goals
2. **Estimate timeline** - Assign developer resources
3. **Set milestones** - Define release schedule (MVP → Full v2.0)
4. **Gather content** - Collect testimonials, press, blog posts, artwork metadata
5. **Begin Sprint 1** - Start with Quick Wins

**Recommended Approach:**
- Week 1-2: Quick Wins (immediate improvements)
- Week 3-6: E-Commerce (enable online sales)
- Week 7-12: Immersive + Content (differentiation)

**End Goal:** Next-generation artist portfolio that rivals top 1% of artist websites globally.
