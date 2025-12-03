# Branchstone.art - Design Review Checklist

Quick reference for design issues and recommendations.

---

## CRITICAL ISSUES (Fix Immediately)

- [ ] **Form validation errors** - Add inline error messages with visual feedback
  - [ ] `.form-field.error` styling with red border
  - [ ] `.form-error` message display with icon
  - [ ] Real-time validation on blur
  - [ ] Submit button disabled until valid

- [ ] **Mobile menu keyboard trap** - Implement focus trap and Escape key handling
  - [ ] Escape key closes menu
  - [ ] Tab focus confined to menu items
  - [ ] First menu item receives focus on open
  - [ ] Return focus to hamburger on close

- [ ] **Hover state contrast** - Fix WCAG AA compliance on interactive elements
  - [ ] Filter button hover: minimum 4.5:1 contrast
  - [ ] Link hover: ensure sufficient contrast
  - [ ] Secondary button hover: test contrast ratio
  - [ ] Test in light AND dark themes

- [ ] **Gallery empty state** - Add fallback UI if JSON fails to load
  - [ ] Create `.gallery-empty-state` div
  - [ ] Add retry button with reload action
  - [ ] Add loading state while fetching
  - [ ] Test with network error simulation

---

## HIGH PRIORITY (Phase 1 - Accessibility)

- [ ] **Form field focus indicators**
  - [ ] Input focus: `outline: 2px solid var(--accent-color)`
  - [ ] Textarea focus: same styling
  - [ ] Focus outline offset: 2px
  - [ ] Test with keyboard navigation

- [ ] **Complete WCAG focus indicators**
  - [ ] All interactive elements have visible focus ring
  - [ ] Focus ring minimum 2px (currently good at 3px)
  - [ ] Focus indicator color has 3:1 contrast with element

- [ ] **Touch target sizing** (44x44px minimum)
  - [ ] `.btn-text` - increase padding to 48px height on mobile
  - [ ] `.filter-btn` - verify 44px height on mobile
  - [ ] All buttons have adequate spacing around them (8px)
  - [ ] Test on mobile device

- [ ] **Dark theme button variants**
  - [ ] `.btn-primary` in dark mode needs lighter background
  - [ ] Hover state contrast in dark theme: 4.5:1+
  - [ ] All button types work in both themes
  - [ ] Test with actual dark theme toggle

---

## MEDIUM PRIORITY (Phase 2 - Consistency)

- [ ] **Transition timing standardization**
  - [ ] Replace all hardcoded durations with design tokens
  - [ ] Hero subtitle animation: use `var(--transition-slow)`
  - [ ] Button hover: use `var(--transition-normal)`
  - [ ] All animations respect `prefers-reduced-motion`

- [ ] **Image loading states**
  - [ ] Add skeleton loader for gallery items
  - [ ] Skeleton animation: `background-size: 200% 100%`
  - [ ] Remove skeleton when image `src` attribute present
  - [ ] Test on slow network (throttle to 3G in DevTools)

- [ ] **Gallery filter active state**
  - [ ] Stronger visual feedback for active filter
  - [ ] Consider background color change vs. border only
  - [ ] Add checkmark or other indicator
  - [ ] Smooth transition between filter states

- [ ] **Hero section improvements**
  - [ ] Shorten line draw animation delay (0.8s → 0.4s)
  - [ ] Use `var(--ease-smooth)` instead of custom easing
  - [ ] Ensure line animation respects `prefers-reduced-motion`

---

## MEDIUM PRIORITY (Phase 3 - Enhancement)

- [ ] **Breadcrumb navigation**
  - [ ] Add to Gallery page: `Home / Gallery`
  - [ ] Add to About page: `Home / About`
  - [ ] Add to Contact page: `Home / Contact`
  - [ ] Use semantic `<nav>` with `aria-label="Breadcrumb"`

- [ ] **Lightbox accessibility**
  - [ ] Add `role="dialog"` to modal
  - [ ] Add `aria-modal="true"`
  - [ ] Add `aria-labelledby` pointing to image title
  - [ ] Implement focus trap within lightbox
  - [ ] Close on Escape key

- [ ] **Scroll-to-top on desktop**
  - [ ] Remove `display: none` restriction at 769px+
  - [ ] Keep visible but lower opacity when not needed
  - [ ] Show on scroll down
  - [ ] Test on long pages

- [ ] **Gallery empty/error states**
  - [ ] Empty message: "No artworks available"
  - [ ] Error message: "Failed to load gallery. Retry?"
  - [ ] Loading message: "Loading gallery..."
  - [ ] Proper icon/illustration for each state

---

## LOW PRIORITY (Phase 4 - Polish)

- [ ] **Hero image optimization**
  - [ ] Generate 800w, 1200w, 1920w versions
  - [ ] Update `srcset` attribute
  - [ ] Update `sizes` attribute with breakpoints
  - [ ] Use WebP with fallback

- [ ] **Commissions page review** (not included in review)
  - [ ] Check form follows same patterns as Contact
  - [ ] Verify responsive layout
  - [ ] Test validation states
  - [ ] Check accessibility compliance

- [ ] **Gallery image lazy loading**
  - [ ] Verify `loading="lazy"` on gallery images
  - [ ] Test with DevTools network throttling
  - [ ] Confirm skeleton loaders appear during load

---

## WCAG 2.1 AA COMPLIANCE CHECKLIST

### Perceivable
- [ ] **1.4.3 Contrast (Minimum)**: Light theme accent color needs darkening
  - Current: 3.2:1 (fails)
  - Target: 4.5:1 (passes AA)
  - Solution: Use darker brown or add background color on hover

- [ ] **1.4.11 Non-text Contrast**: All UI components have 3:1 minimum
  - [ ] Buttons: 4.5:1+ with background color
  - [ ] Borders: 3:1+ against background
  - [ ] Icons: 3:1+ contrast with background

### Operable
- [ ] **2.1.1 Keyboard**: All functionality available via keyboard
  - [ ] Mobile menu keyboard accessible
  - [ ] Forms submittal via Enter key
  - [ ] Gallery navigation via keyboard

- [ ] **2.1.2 No Keyboard Trap**: Focus can move away from modal
  - [ ] Mobile menu: trap focus, allow Escape
  - [ ] Lightbox: trap focus, allow Escape
  - [ ] No element locks keyboard focus

- [ ] **2.5.5 Target Size (Enhanced)**: 44x44px minimum
  - [ ] All buttons: 44px+ height on mobile
  - [ ] All touch targets: 44px+ size
  - [ ] 8px spacing between targets

### Understandable
- [ ] **3.3.1 Error Identification**: Errors are identified
  - [ ] Error message near field
  - [ ] Use color AND icon (not color alone)
  - [ ] Plain language error description

- [ ] **3.3.4 Error Suggestion**: Suggestions provided for errors
  - [ ] Form field shows what format is needed
  - [ ] Example: "Email format: user@example.com"
  - [ ] Error message suggests how to fix

### Robust
- [ ] **4.1.2 Name, Role, Value**: All components properly marked
  - [ ] Buttons have `aria-label` when needed
  - [ ] Form fields have `<label>` elements
  - [ ] Links have descriptive text
  - [ ] Icons have `aria-hidden="true"` if decorative

- [ ] **4.1.3 Status Messages**: Updates announced to screen readers
  - [ ] Form validation messages: `role="status"` or `aria-live="polite"`
  - [ ] Loading messages: announced when appear
  - [ ] Success messages: announced on completion

---

## DESIGN SYSTEM VERIFICATION

- [ ] All colors use `var(--*)` tokens
- [ ] All spacing uses `var(--spacing-*)` tokens
- [ ] All transitions use `var(--transition-*)` tokens
- [ ] All border radius uses `var(--radius-*)` tokens
- [ ] Z-index follows `var(--z-*)` hierarchy
- [ ] Font sizes use scale (12px to 48px)
- [ ] Line heights are 1.5+ (readability)

---

## RESPONSIVE DESIGN VERIFICATION

### Mobile (320-768px)
- [ ] No horizontal scroll at 320px
- [ ] Touch targets minimum 44x44px
- [ ] Text size minimum 14px (readable)
- [ ] Navigation hamburger visible
- [ ] Gallery: single column layout
- [ ] Forms: single column layout
- [ ] Footer: single column, centered

### Tablet (768-1024px)
- [ ] Desktop navigation visible (optional on tablet)
- [ ] Gallery: 2-column layout
- [ ] Forms: 2-column layout where appropriate
- [ ] Button sizes adequate for touch
- [ ] Images scale proportionally

### Desktop (1024px+)
- [ ] Desktop navigation with hover effects
- [ ] Gallery: 3-4 column layout
- [ ] Forms: proper width constraint (max 600px form width)
- [ ] Scroll-to-top button visible after scrolling
- [ ] All hover states functioning

---

## ACCESSIBILITY TESTING CHECKLIST

### Keyboard Navigation
- [ ] Tab through entire page
  - [ ] Order is logical (top to bottom, left to right)
  - [ ] Focus is always visible
  - [ ] No focus trapped in elements
  - [ ] Skip-link works

- [ ] Navigation menu
  - [ ] Mobile menu accessible via keyboard
  - [ ] Escape closes mobile menu
  - [ ] Tab order correct within menu
  - [ ] Focus returns to hamburger after close

- [ ] Forms
  - [ ] All fields reachable via Tab
  - [ ] Can submit form via keyboard (Enter key)
  - [ ] Error messages announced

### Screen Reader Testing (VoiceOver / NVDA)
- [ ] Skip-link announced
- [ ] All headings announced with level (H1, H2, etc.)
- [ ] Images have meaningful alt text
- [ ] Decorative images have `aria-hidden="true"`
- [ ] Form labels associated with inputs
- [ ] Button purposes are clear
- [ ] Links have descriptive text

### Color Contrast (WebAIM Contrast Checker)
- [ ] Light theme: text on background 4.5:1+
- [ ] Dark theme: text on background 4.5:1+
- [ ] All hover/focus states: 4.5:1+
- [ ] UI components: 3:1+ contrast
- [ ] Borders: 3:1+ contrast with adjacent

### Motion & Animations
- [ ] `prefers-reduced-motion: reduce` respected
- [ ] Animations don't auto-play with sound
- [ ] No flashing content (>3 flashes/second)
- [ ] Animation duration reasonable (not too fast)

---

## BEFORE DEPLOYING FIXES

### Testing Required
- [ ] Test on actual mobile device (iPhone + Android)
- [ ] Test on tablet (iPad or similar)
- [ ] Test all browsers (Chrome, Safari, Firefox, Edge)
- [ ] Test dark mode toggle
- [ ] Test language toggle (EN/UA)
- [ ] Test network throttling (3G, slow 4G)
- [ ] Test with screen reader (VoiceOver on Mac)
- [ ] Test keyboard-only navigation

### Build & Deployment
- [ ] Run CSS minifier
- [ ] Verify cache-busting version number incremented
- [ ] Check bundle.css is updated
- [ ] Test offline page (service worker)
- [ ] Verify security headers still in place
- [ ] Test form submissions work
- [ ] Verify images load correctly

---

## METRICS TO TRACK

After implementing fixes, measure:

- [ ] **Lighthouse Accessibility Score** - Target: 95+
- [ ] **Lighthouse Performance Score** - Target: 90+
- [ ] **Core Web Vitals**
  - [ ] LCP (Largest Contentful Paint): < 2.5s
  - [ ] INP (Interaction to Next Paint): < 200ms
  - [ ] CLS (Cumulative Layout Shift): < 0.1
- [ ] **Keyboard Navigation**: All features accessible without mouse
- [ ] **Screen Reader**: Logical content flow, no missing labels
- [ ] **Mobile Responsiveness**: No horizontal scroll, readable text

---

## NOTES

- Design tokens are excellently structured - leverage them for consistency
- Mobile-first CSS is a strength - maintain that approach
- Dark mode implementation is thoughtful - extend to all components
- Semantic HTML is strong - maintain that pattern
- Focus on form states and error handling first (blocks user goals)
- Keyboard navigation and focus trap improvements are critical for a11y

---

**Total Estimated Effort to 9/10 Rating: 10-15 development days**

- Phase 1 (Critical): 3-4 days
- Phase 2 (High): 3-4 days
- Phase 3 (Medium): 2-3 days
- Phase 4 (Polish): 1-2 days
- Testing: 2-3 days

---

Last Updated: December 2, 2025
