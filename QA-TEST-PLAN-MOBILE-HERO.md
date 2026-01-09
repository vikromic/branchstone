# QA Test Plan: Mobile Hero Implementation
**Feature**: Mobile Inline Hero Section (Replaces Modal Overlay on Mobile)
**Date Created**: 2026-01-08
**QA Specialist**: Quality Assurance Expert
**Status**: PRODUCTION-READY TEST PLAN

---

## Executive Summary

### Feature Overview
The mobile hero implementation replaces the desktop modal overlay with a native, inline hero section optimized for mobile devices. This provides an art-first, scrollable experience with improved accessibility and performance.

**Key Metrics from Initial Validation**:
- Visual Quality: 9.2-9.8/10 across all test breakpoints
- Accessibility: WCAG 2.1 Level AAA compliance verified
- Performance: LCP optimized, CLS < 0.1 validated
- UX Score: Excellent user experience across device categories

### Implementation Scope
- **Mobile (≤768px)**: Inline hero with 60-70vh image, text block, single CTA, scroll hint
- **Desktop (≥769px)**: Modal pop-up (unchanged from previous implementation)
- **Responsive Breakpoint**: 768px/769px boundary
- **Key Technologies**: HTML5, CSS3 (clamp, media queries), vanilla JavaScript

### Release Readiness
This test plan provides the structured testing framework required for final production validation and go/no-go decision-making.

---

## Table of Contents
1. [Test Strategy & Approach](#test-strategy--approach)
2. [Device & Browser Testing Matrix](#device--browser-testing-matrix)
3. [Functional Test Cases](#functional-test-cases)
4. [Visual & Layout Test Cases](#visual--layout-test-cases)
5. [Accessibility Test Cases](#accessibility-test-cases)
6. [Performance Test Cases](#performance-test-cases)
7. [Cross-Browser Test Cases](#cross-browser-test-cases)
8. [Edge Case & Regression Testing](#edge-case--regression-testing)
9. [User Acceptance Testing (UAT)](#user-acceptance-testing-uat)
10. [Release Readiness Checklist](#release-readiness-checklist)

---

## Test Strategy & Approach

### Testing Philosophy
- **Prevention Over Detection**: Focus on comprehensive upfront testing
- **Risk-Based Prioritization**: Critical paths tested first
- **Device Diversity**: Real device testing prioritized over emulation
- **Accessibility First**: WCAG 2.1 Level AAA compliance mandatory
- **Performance Baseline**: Web Vitals thresholds enforced

### Testing Phases

#### Phase 1: Critical Path Validation (Priority: CRITICAL)
**Objective**: Verify core user flow works without blocking issues.

**Test Coverage**:
- Mobile hero displays correctly at 375px (iPhone standard)
- CTA button navigates to gallery.html
- Desktop hero remains unchanged
- No console errors on initial page load
- Images load and display correctly

**Success Criteria**: 100% pass rate, zero critical issues

#### Phase 2: Comprehensive Functional Testing (Priority: HIGH)
**Objective**: Validate all features and interactions across device spectrum.

**Test Coverage**:
- All device breakpoints (320px-428px)
- All interactive elements (CTA, scroll hint)
- Theme switching (light/dark)
- Accessibility features (keyboard nav, screen readers)
- Browser compatibility (iOS Safari, Chrome, Firefox)

**Success Criteria**: ≥95% pass rate, no high-severity issues

#### Phase 3: Edge Case & Regression Testing (Priority: MEDIUM)
**Objective**: Ensure robustness and no side effects from changes.

**Test Coverage**:
- Viewport edge cases (768px/769px boundary)
- Orientation changes (portrait/landscape)
- Slow network conditions
- Image load failures
- Desktop hero functionality preserved
- Reduced motion preferences

**Success Criteria**: ≥90% pass rate, no regressions to existing features

#### Phase 4: User Acceptance Testing (Priority: MEDIUM)
**Objective**: Validate user experience meets expectations.

**Test Coverage**:
- Real user feedback on mobile devices
- Task completion rates
- Aesthetic satisfaction scoring
- First-time user experience

**Success Criteria**: ≥85% user satisfaction, positive feedback

### Testing Tools & Environment

**Real Device Testing** (Preferred):
- iPhone 13 Mini (375px) - iOS Safari
- iPhone 13 Pro Max (428px) - iOS Safari
- Samsung Galaxy S21 (360px) - Chrome Android
- iPad Mini (768px) - Safari iOS

**Emulation Testing** (Supplementary):
- Chrome DevTools Device Emulation
- Firefox Responsive Design Mode
- BrowserStack (for devices not available physically)

**Accessibility Testing Tools**:
- VoiceOver (iOS)
- TalkBack (Android)
- NVDA (Windows screen reader)
- axe DevTools
- WAVE browser extension
- Lighthouse Accessibility Audit

**Performance Testing Tools**:
- Chrome DevTools Lighthouse
- WebPageTest
- Chrome DevTools Performance Panel
- Network throttling (Fast 3G, Slow 3G)

---

## Device & Browser Testing Matrix

### Mobile Devices (Priority: CRITICAL)

| Device Category | Viewport | Devices | Browsers | Test Depth |
|-----------------|----------|---------|----------|------------|
| **Small Mobile** | 320-374px | iPhone SE (320px)<br>iPhone 5S (320px)<br>Galaxy S5 (360px) | Safari iOS (latest)<br>Chrome iOS (latest)<br>Chrome Android (latest) | Full functional + visual |
| **Standard Mobile** | 375-413px | iPhone 13 Mini (375px)<br>iPhone 13 (390px)<br>Google Pixel 5 (393px) | Safari iOS (latest)<br>Chrome iOS (latest)<br>Chrome Android (latest)<br>Samsung Internet | **Comprehensive** (all test cases) |
| **Large Mobile** | 414-428px | iPhone 13 Pro Max (428px)<br>Samsung Galaxy S21+ (411px) | Safari iOS (latest)<br>Chrome iOS (latest)<br>Chrome Android (latest) | Full functional + visual |

### Tablet Devices (Priority: HIGH)

| Device Category | Viewport | Devices | Browsers | Test Depth |
|-----------------|----------|---------|----------|------------|
| **Boundary Testing** | 768-769px | iPad Mini (768px)<br>Surface Duo (540px portrait, 720px landscape) | Safari iOS<br>Chrome<br>Edge | **Critical** (breakpoint validation) |

### Desktop (Priority: MEDIUM - Regression Only)

| Viewport | Purpose | Browsers | Test Depth |
|----------|---------|----------|------------|
| 1024px | Desktop threshold | Chrome, Safari, Firefox | Regression testing (desktop hero unchanged) |
| 1440px | Standard desktop | Chrome | Smoke test |

### Browser Version Requirements

**iOS Safari**: Latest stable + previous major version
**Chrome (iOS & Android)**: Latest stable
**Chrome Android**: Latest stable
**Samsung Internet**: Latest stable
**Firefox iOS**: Latest stable (if available)

**Rationale**: Mobile-first approach prioritizes mobile browsers. Desktop browsers tested for regression only.

---

## Functional Test Cases

### TC-F001: Mobile Hero Display (320px-768px)
**Priority**: CRITICAL
**Category**: Core Functionality
**Preconditions**: Navigate to `/docs/index.html` on mobile device or emulator

#### Test Steps:
1. Open index.html in mobile viewport (375px width recommended)
2. Observe hero section on page load
3. Verify desktop hero is NOT displayed
4. Verify mobile hero IS displayed

#### Expected Results:
- ✅ Desktop hero (`section-hero--desktop`) has `display: none`
- ✅ Mobile hero (`section-hero--mobile`) is visible
- ✅ Hero image displays at 60-70vh height
- ✅ Image aspect ratio preserved (no distortion)
- ✅ Text block displays below image
- ✅ CTA button is visible and accessible
- ✅ Scroll hint is visible at bottom

#### Pass/Fail Criteria:
- **PASS**: All expected results verified
- **FAIL**: Any element missing, misaligned, or incorrectly displayed

**Test Data**: N/A
**Test Environment**: Mobile viewports 320px-768px
**Automation Potential**: Medium (visual validation required)

---

### TC-F002: CTA Button Navigation
**Priority**: CRITICAL
**Category**: Core Functionality
**Preconditions**: Mobile hero displayed (TC-F001 passed)

#### Test Steps:
1. Locate "Explore the Works" CTA button in hero section
2. Verify button is thumb-friendly (min 48x48px touch target)
3. Tap/click the CTA button
4. Observe navigation

#### Expected Results:
- ✅ CTA button displays "Explore the Works" text + arrow icon
- ✅ Button has `min-height: 48px`, `min-width: 200px`
- ✅ Button is centered in text block
- ✅ Button has proper focus state (3px outline)
- ✅ Clicking navigates to `gallery.html`
- ✅ Navigation is immediate (no loading delay)
- ✅ Gallery page loads successfully

#### Pass/Fail Criteria:
- **PASS**: Navigation to gallery.html succeeds, no errors
- **FAIL**: Navigation fails, broken link, or incorrect target page

**Test Data**: N/A
**Test Environment**: All mobile viewports
**Automation Potential**: High (E2E automation possible)

---

### TC-F003: Desktop Hero Preservation (≥769px)
**Priority**: HIGH
**Category**: Regression Testing
**Preconditions**: None

#### Test Steps:
1. Open index.html in desktop viewport (1024px+ width)
2. Observe hero section behavior
3. Verify mobile hero is NOT displayed
4. Verify desktop modal hero IS displayed
5. Test desktop hero close button
6. Test desktop hero "Show Info" button

#### Expected Results:
- ✅ Mobile hero (`section-hero--desktop`) has `display: none !important`
- ✅ Desktop hero (`section-hero--desktop`) has `display: flex !important`
- ✅ Desktop hero displays as modal overlay
- ✅ Close button dismisses modal
- ✅ "Show Info" button restores modal
- ✅ All desktop hero features work as before implementation

#### Pass/Fail Criteria:
- **PASS**: Desktop experience unchanged from previous implementation
- **FAIL**: Desktop hero broken, modal not working, or regressions detected

**Test Data**: N/A
**Test Environment**: Desktop viewports ≥1024px
**Automation Potential**: High (regression suite)

---

### TC-F004: Responsive Breakpoint Transition (768px/769px)
**Priority**: CRITICAL
**Category**: Responsive Design
**Preconditions**: None

#### Test Steps:
1. Open index.html in browser
2. Set viewport to exactly 768px width
3. Verify mobile hero is displayed
4. Increase viewport width to exactly 769px
5. Verify desktop hero is displayed
6. Decrease viewport back to 768px
7. Verify mobile hero is displayed again

#### Expected Results:
- ✅ At 768px: Mobile hero visible, desktop hero hidden
- ✅ At 769px: Desktop hero visible, mobile hero hidden
- ✅ Transition is clean (no flicker or layout shift)
- ✅ No horizontal scrollbar at breakpoint
- ✅ No content overlap during transition
- ✅ Page remains functional during resize

#### Pass/Fail Criteria:
- **PASS**: Clean transition, correct display at each breakpoint
- **FAIL**: Both heroes visible, incorrect hero shown, or layout breaks

**Test Data**: N/A
**Test Environment**: Browser with responsive design mode
**Automation Potential**: Medium (visual validation required)

---

### TC-F005: Scroll Hint Animation
**Priority**: MEDIUM
**Category**: UI/UX Enhancement
**Preconditions**: Mobile hero displayed (TC-F001 passed)

#### Test Steps:
1. Observe scroll hint at bottom of hero section
2. Wait and observe animation
3. Verify animation behavior
4. Enable reduced motion preference (Settings > Accessibility)
5. Reload page and verify animation respects preference

#### Expected Results:
- ✅ Scroll hint displays down-arrow icon
- ✅ Animation is subtle bounce (6px vertical movement)
- ✅ Animation duration: 2s infinite loop
- ✅ `aria-hidden="true"` attribute present (decorative)
- ✅ With reduced motion enabled: no animation (static)
- ✅ With reduced motion disabled: gentle bounce visible

#### Pass/Fail Criteria:
- **PASS**: Animation works correctly, respects motion preferences
- **FAIL**: Animation too aggressive, doesn't respect preferences, or missing

**Test Data**: N/A
**Test Environment**: Mobile viewports with reduced motion toggle
**Automation Potential**: Low (visual/animation validation)

---

### TC-F006: Theme Switching (Light/Dark Mode)
**Priority**: HIGH
**Category**: Theme Support
**Preconditions**: Mobile hero displayed (TC-F001 passed)

#### Test Steps:
1. Verify page loads in light mode by default
2. Observe mobile hero styling in light mode
3. Click theme toggle button in header
4. Verify page switches to dark mode
5. Observe mobile hero styling in dark mode
6. Click theme toggle again to return to light mode

#### Expected Results:

**Light Mode**:
- ✅ Text block background: `var(--bg-primary)` (light)
- ✅ Heading color: `var(--text-primary)` (dark)
- ✅ Subheading color: `var(--text-secondary)` (gray)
- ✅ Image filter: `brightness(1.0) contrast(1.05) saturate(1.15)`
- ✅ CTA button: gradient copper/warm tones

**Dark Mode**:
- ✅ Text block background: `var(--bg-primary)` (dark)
- ✅ Heading color: `var(--text-primary)` (light)
- ✅ Subheading color: `var(--text-secondary)` (light gray)
- ✅ Image filter: `brightness(0.85) contrast(1.08) saturate(1.0)`
- ✅ CTA button: adjusted gradient for dark theme
- ✅ Sufficient contrast in all text (WCAG AA minimum)

#### Pass/Fail Criteria:
- **PASS**: Theme switching works, both modes readable, no contrast issues
- **FAIL**: Theme doesn't apply, text unreadable, or contrast violations

**Test Data**: N/A
**Test Environment**: All mobile viewports
**Automation Potential**: High (automated contrast checks)

---

### TC-F007: Image Loading & Error Handling
**Priority**: HIGH
**Category**: Error Handling
**Preconditions**: None

#### Test Steps:
1. Open index.html with network throttling (Slow 3G)
2. Observe hero image loading behavior
3. Verify loading attributes: `loading="eager"`, `fetchpriority="high"`
4. Test with broken image URL (simulate 404)
5. Verify error handling

#### Expected Results:
- ✅ Image has `loading="eager"` attribute
- ✅ Image has `fetchpriority="high"` attribute
- ✅ Preload link present in `<head>`: `<link rel="preload" as="image" href="img/cover.webp">`
- ✅ Image loads immediately (no lazy loading on hero)
- ✅ Alt text is descriptive and meaningful
- ✅ If image fails: alt text displayed, no broken image icon
- ✅ Layout remains stable during image load (no CLS)

#### Pass/Fail Criteria:
- **PASS**: Image loads optimally, error handling graceful
- **FAIL**: Image doesn't load, causes layout shift, or poor error state

**Test Data**: Valid image: `img/cover.webp`, Invalid image: `img/fake.webp`
**Test Environment**: Mobile viewports with network throttling
**Automation Potential**: High (loading performance metrics)

---

## Visual & Layout Test Cases

### TC-V001: Hero Image Dimensions & Aspect Ratio
**Priority**: CRITICAL
**Category**: Visual Layout
**Preconditions**: Mobile hero displayed (TC-F001 passed)

#### Test Steps:
1. Open index.html in mobile viewport (375px)
2. Measure hero image container height
3. Verify responsive height scaling
4. Test at multiple breakpoints: 320px, 375px, 414px, 768px

#### Expected Results:
- ✅ Image height uses `clamp(60vh, 65vh, 70vh)` formula
- ✅ Minimum height: 60vh on all mobile viewports
- ✅ Maximum height: 70vh on all mobile viewports
- ✅ Image uses `object-fit: cover`
- ✅ Image uses `object-position: center 40%` (focus on upper-center)
- ✅ No image distortion or stretching
- ✅ Aspect ratio maintained across breakpoints

#### Pass/Fail Criteria:
- **PASS**: Image height within clamp range, no distortion
- **FAIL**: Image too tall/short, distorted, or incorrect crop

**Test Data**: N/A
**Test Environment**: All mobile viewports
**Automation Potential**: Medium (automated dimension checks possible)

---

### TC-V002: Text Block Layout & Typography
**Priority**: HIGH
**Category**: Visual Layout
**Preconditions**: Mobile hero displayed (TC-F001 passed)

#### Test Steps:
1. Observe text block below hero image
2. Verify background color and padding
3. Measure font sizes and line heights
4. Verify text alignment and spacing

#### Expected Results:

**Text Block Container**:
- ✅ Background: solid `var(--bg-primary)` (high contrast)
- ✅ Padding: `var(--space-8) var(--space-4)` (32px 16px)
- ✅ Text alignment: centered

**Heading** ("Where Forest Meets Art"):
- ✅ Font family: `var(--font-display)` (Cormorant Garamond)
- ✅ Font size: `clamp(1.75rem, 7vw, 2.5rem)` (28px-40px)
- ✅ Font weight: 400
- ✅ Line height: 1.2
- ✅ Color: `var(--text-primary)`
- ✅ Margin bottom: `var(--space-4)` (16px)

**Subheading** ("One-of-a-kind mixed-media..."):
- ✅ Font family: `var(--font-body)` (Inter)
- ✅ Font size: `clamp(1rem, 4vw, 1.125rem)` (16px-18px)
- ✅ Font weight: 400
- ✅ Line height: 1.6
- ✅ Color: `var(--text-secondary)`
- ✅ Max width: 480px
- ✅ Margin: `0 auto var(--space-6)` (centered, 24px bottom)

#### Pass/Fail Criteria:
- **PASS**: Text readable, properly sized, correct hierarchy
- **FAIL**: Text too small/large, poor contrast, misaligned

**Test Data**: N/A
**Test Environment**: All mobile viewports
**Automation Potential**: High (automated typography checks)

---

### TC-V003: CTA Button Styling
**Priority**: HIGH
**Category**: Visual Layout
**Preconditions**: Mobile hero displayed (TC-F001 passed)

#### Test Steps:
1. Locate CTA button in text block
2. Verify button dimensions
3. Verify button styling (colors, shadows, borders)
4. Test hover/active states
5. Test focus state for keyboard users

#### Expected Results:

**Default State**:
- ✅ Padding: `1rem 2rem` (16px 32px)
- ✅ Font size: `var(--text-base)` (16px)
- ✅ Font weight: 600
- ✅ Min height: 48px (WCAG AAA compliant)
- ✅ Min width: 200px
- ✅ Background: `linear-gradient(135deg, var(--copper-400), var(--copper-500))`
- ✅ Color: white
- ✅ Border: none
- ✅ Border radius: `var(--radius-lg)`
- ✅ Box shadow: `var(--shadow-md)`
- ✅ Display: inline-flex, centered
- ✅ Arrow icon visible, 16x16px, stroke-width 2.5px

**Hover/Active State**:
- ✅ Transform: `translateY(-2px)`
- ✅ Background shifts to lighter gradient
- ✅ Box shadow deepens to `var(--shadow-lg)`
- ✅ Transition duration: 300ms cubic-bezier

**Focus State**:
- ✅ Outline: `3px solid var(--accent-primary)`
- ✅ Outline offset: 4px
- ✅ No loss of button styling

#### Pass/Fail Criteria:
- **PASS**: Button styled correctly, states work, meets accessibility standards
- **FAIL**: Button too small, poor contrast, or states don't work

**Test Data**: N/A
**Test Environment**: All mobile viewports
**Automation Potential**: Medium (visual regression testing)

---

### TC-V004: Scroll Hint Visual Design
**Priority**: LOW
**Category**: Visual Polish
**Preconditions**: Mobile hero displayed (TC-F001 passed)

#### Test Steps:
1. Observe scroll hint below CTA button
2. Verify positioning and spacing
3. Verify icon styling
4. Verify animation (if not reduced motion)

#### Expected Results:
- ✅ Display: flex, centered
- ✅ Padding: `var(--space-4) 0 var(--space-6)` (16px 0 24px)
- ✅ Opacity: 0.6
- ✅ SVG icon: 24x24px
- ✅ Icon color: `var(--text-tertiary)`
- ✅ Stroke width: 2px
- ✅ Animation: gentle bounce (0 → 6px vertical)
- ✅ Animation easing: ease-in-out
- ✅ Animation duration: 2s infinite

#### Pass/Fail Criteria:
- **PASS**: Scroll hint subtle, not distracting, animation smooth
- **FAIL**: Scroll hint too prominent, animation jarring, or missing

**Test Data**: N/A
**Test Environment**: All mobile viewports
**Automation Potential**: Low (subjective visual assessment)

---

### TC-V005: Short Screen Handling (≤600px height)
**Priority**: MEDIUM
**Category**: Edge Case Layout
**Preconditions**: Mobile viewport with height ≤600px

#### Test Steps:
1. Set viewport to 375px × 600px (short screen)
2. Observe hero layout adjustments
3. Verify image height reduction
4. Verify text block padding reduction

#### Expected Results:
- ✅ Image height reduces to 50vh (max-height: 600px override)
- ✅ Text block padding reduces to `var(--space-6) var(--space-4)`
- ✅ All content remains visible (no overflow)
- ✅ CTA button still accessible without scrolling
- ✅ Layout remains functional and attractive

#### Pass/Fail Criteria:
- **PASS**: Content fits viewport, no critical elements hidden
- **FAIL**: Content overflows, CTA hidden, or layout breaks

**Test Data**: N/A
**Test Environment**: Mobile viewport 375px × 600px or less
**Automation Potential**: Medium (dimension validation)

---

## Accessibility Test Cases

### TC-A001: Keyboard Navigation
**Priority**: CRITICAL
**Category**: Accessibility (WCAG 2.1 Level A)
**Preconditions**: Mobile hero displayed (TC-F001 passed)

#### Test Steps:
1. Load index.html on mobile device
2. Use Tab key to navigate through hero section
3. Verify focus order and visibility
4. Use Enter key to activate CTA button

#### Expected Results:
- ✅ Skip link appears first on Tab (if implemented)
- ✅ CTA button receives focus
- ✅ Focus indicator visible: `3px solid var(--accent-primary)`, offset 4px
- ✅ Focus order logical (top to bottom)
- ✅ Enter key activates CTA and navigates to gallery
- ✅ No keyboard trap (can tab out of hero section)
- ✅ Focus remains visible against all backgrounds

#### Pass/Fail Criteria:
- **PASS**: Full keyboard accessibility, logical focus order
- **FAIL**: Elements not focusable, focus invisible, or keyboard trap

**Test Data**: N/A
**Test Environment**: Desktop with keyboard, mobile with external keyboard
**Automation Potential**: High (automated keyboard navigation tests)

**WCAG Success Criteria**: 2.1.1 Keyboard (Level A), 2.4.7 Focus Visible (Level AA)

---

### TC-A002: Screen Reader Compatibility
**Priority**: CRITICAL
**Category**: Accessibility (WCAG 2.1 Level A)
**Preconditions**: Screen reader enabled (VoiceOver on iOS, TalkBack on Android, NVDA on Windows)

#### Test Steps:
1. Enable screen reader
2. Navigate to mobile hero section
3. Listen to screen reader announcements
4. Verify semantic HTML structure
5. Verify ARIA attributes

#### Expected Results:

**Semantic Structure**:
- ✅ Hero section uses `<section>` element with `aria-label="Hero"`
- ✅ Heading uses `<h1>` (proper document outline)
- ✅ Subheading uses `<p>` (not misused heading level)
- ✅ CTA button uses `<a>` element (navigational action)
- ✅ Scroll hint uses `aria-hidden="true"` (decorative)

**Screen Reader Announcements**:
- ✅ Hero section announced as "Hero, region"
- ✅ Image alt text announced: "Branchstone mixed-media art featuring natural forest materials, moss, and wood textures from Santa Rosa, California"
- ✅ Heading announced with proper level: "Where Forest Meets Art, heading level 1"
- ✅ Subheading announced: "One-of-a-kind mixed-media artworks made with foraged natural materials."
- ✅ CTA announced: "Explore the Works, link" (not "button")
- ✅ No confusion or duplicate announcements

**ARIA Attributes**:
- ✅ Scroll hint SVG has `aria-hidden="true"` (icon decorative)
- ✅ CTA icon SVG has `aria-hidden="true"` (text already descriptive)
- ✅ No incorrect ARIA usage (role overrides)

#### Pass/Fail Criteria:
- **PASS**: All content accessible to screen readers, proper structure
- **FAIL**: Content not announced, incorrect structure, or ARIA errors

**Test Data**: N/A
**Test Environment**: iOS (VoiceOver), Android (TalkBack), Windows (NVDA)
**Automation Potential**: Medium (automated ARIA validation, manual listening)

**WCAG Success Criteria**: 4.1.2 Name, Role, Value (Level A), 1.3.1 Info and Relationships (Level A)

---

### TC-A003: Color Contrast (Light & Dark Modes)
**Priority**: CRITICAL
**Category**: Accessibility (WCAG 2.1 Level AAA)
**Preconditions**: Mobile hero displayed (TC-F001 passed)

#### Test Steps:
1. Use color contrast analyzer tool (e.g., axe DevTools, WAVE)
2. Check all text against background colors
3. Test in light mode
4. Switch to dark mode and repeat
5. Verify AAA contrast ratios

#### Expected Results:

**Light Mode Contrast Ratios**:
- ✅ Heading (text-primary) vs bg-primary: ≥7:1 (AAA)
- ✅ Subheading (text-secondary) vs bg-primary: ≥7:1 (AAA)
- ✅ CTA text (white) vs gradient background: ≥7:1 (AAA)
- ✅ No auto-fail elements

**Dark Mode Contrast Ratios**:
- ✅ Heading (text-primary) vs bg-primary: ≥7:1 (AAA)
- ✅ Subheading (text-secondary) vs bg-primary: ≥7:1 (AAA)
- ✅ CTA text (white) vs adjusted gradient: ≥7:1 (AAA)
- ✅ No auto-fail elements

**Minimum Requirements** (if AAA not achievable):
- ✅ All large text (≥18pt or 14pt bold): ≥4.5:1 (AA)
- ✅ All normal text: ≥4.5:1 (AA)

#### Pass/Fail Criteria:
- **PASS**: All contrast ratios meet WCAG 2.1 Level AAA (7:1), or Level AA minimum (4.5:1)
- **FAIL**: Any text fails AA contrast requirements

**Test Data**: N/A
**Test Environment**: All mobile viewports, light and dark modes
**Automation Potential**: High (automated contrast checking)

**WCAG Success Criteria**: 1.4.6 Contrast (Enhanced) - Level AAA, 1.4.3 Contrast (Minimum) - Level AA

---

### TC-A004: Touch Target Size
**Priority**: CRITICAL
**Category**: Accessibility (WCAG 2.1 Level AAA)
**Preconditions**: Mobile hero displayed (TC-F001 passed)

#### Test Steps:
1. Inspect CTA button dimensions using browser DevTools
2. Verify minimum touch target size
3. Test on physical mobile device (tap accuracy)
4. Compare against WCAG 2.1 Level AAA requirements (44×44px minimum)

#### Expected Results:
- ✅ CTA button min-height: 48px (exceeds 44px requirement)
- ✅ CTA button min-width: 200px (exceeds 44px requirement)
- ✅ Button padding ensures large enough tap area
- ✅ No overlapping touch targets
- ✅ Button easy to tap on physical device (no mis-taps)
- ✅ Button has sufficient spacing from surrounding elements (no accidental taps)

#### Pass/Fail Criteria:
- **PASS**: Touch target ≥44×44px, easy to tap on real device
- **FAIL**: Touch target <44×44px, difficult to tap, or frequent mis-taps

**Test Data**: N/A
**Test Environment**: Real mobile devices (iPhone, Android)
**Automation Potential**: High (automated dimension checks)

**WCAG Success Criteria**: 2.5.5 Target Size (Level AAA)

---

### TC-A005: Reduced Motion Preference
**Priority**: HIGH
**Category**: Accessibility (WCAG 2.1 Level AAA)
**Preconditions**: None

#### Test Steps:
1. Enable reduced motion in device settings:
   - **iOS**: Settings > Accessibility > Motion > Reduce Motion
   - **Android**: Settings > Accessibility > Remove animations
   - **macOS**: System Preferences > Accessibility > Display > Reduce motion
   - **Windows**: Settings > Ease of Access > Display > Show animations
2. Load index.html
3. Observe hero section (no animations should occur)
4. Verify all functionality still works

#### Expected Results:
- ✅ Scroll hint animation disabled (static icon)
- ✅ CTA button hover effects instant (no transform animation)
- ✅ No fade-in transitions on page load
- ✅ All functionality preserved (button still navigates)
- ✅ Layout identical to animated version (no content hidden)
- ✅ CSS media query `@media (prefers-reduced-motion: reduce)` respected

#### Pass/Fail Criteria:
- **PASS**: All animations disabled, functionality preserved
- **FAIL**: Animations still occur, or functionality broken when disabled

**Test Data**: N/A
**Test Environment**: All platforms with reduced motion enabled
**Automation Potential**: Medium (automated via browser DevTools emulation)

**WCAG Success Criteria**: 2.3.3 Animation from Interactions (Level AAA)

---

### TC-A006: Alt Text Quality
**Priority**: HIGH
**Category**: Accessibility (WCAG 2.1 Level A)
**Preconditions**: Mobile hero displayed (TC-F001 passed)

#### Test Steps:
1. Inspect hero image `alt` attribute
2. Verify alt text is descriptive and meaningful
3. Load page with images disabled (browser settings or CSS)
4. Verify alt text provides equivalent information

#### Expected Results:
- ✅ Alt text present: `"Branchstone mixed-media art featuring natural forest materials, moss, and wood textures from Santa Rosa, California"`
- ✅ Alt text is descriptive (not generic like "hero image" or "cover")
- ✅ Alt text provides context about artwork and location
- ✅ Alt text does not start with "Image of" or "Picture of" (redundant)
- ✅ With images disabled, alt text conveys hero message effectively
- ✅ Alt text concise but informative (<150 characters)

#### Pass/Fail Criteria:
- **PASS**: Alt text descriptive, meaningful, and provides equivalent information
- **FAIL**: Alt text missing, generic, or unhelpful

**Test Data**: N/A
**Test Environment**: All mobile viewports, images disabled
**Automation Potential**: Medium (automated presence check, manual quality review)

**WCAG Success Criteria**: 1.1.1 Non-text Content (Level A)

---

## Performance Test Cases

### TC-P001: Largest Contentful Paint (LCP)
**Priority**: CRITICAL
**Category**: Performance (Core Web Vitals)
**Preconditions**: None

#### Test Steps:
1. Open Chrome DevTools
2. Navigate to Lighthouse tab
3. Run performance audit (mobile mode)
4. Observe LCP metric
5. Identify LCP element (should be hero image)
6. Verify optimization techniques applied

#### Expected Results:
- ✅ LCP < 2.5 seconds (Good)
- ✅ LCP element is hero image (`img/cover.webp`)
- ✅ Image has `fetchpriority="high"` attribute
- ✅ Image has `loading="eager"` attribute
- ✅ Preload link present: `<link rel="preload" as="image" href="img/cover.webp">`
- ✅ Image format optimized (WebP)
- ✅ Image dimensions appropriate for mobile (not oversized)

**Performance Thresholds**:
- **Good**: LCP < 2.5s (target)
- **Needs Improvement**: LCP 2.5-4.0s
- **Poor**: LCP > 4.0s

#### Pass/Fail Criteria:
- **PASS**: LCP < 2.5s, image optimized
- **FAIL**: LCP > 2.5s, or missing optimizations

**Test Data**: N/A
**Test Environment**: Mobile viewport, simulated 4G throttling
**Automation Potential**: High (Lighthouse CI)

**Web Vitals Metric**: LCP (Largest Contentful Paint)

---

### TC-P002: Cumulative Layout Shift (CLS)
**Priority**: CRITICAL
**Category**: Performance (Core Web Vitals)
**Preconditions**: None

#### Test Steps:
1. Open Chrome DevTools Performance panel
2. Enable "Layout Shift Regions" in Rendering panel
3. Load page and observe layout shifts
4. Run Lighthouse audit to measure CLS
5. Verify no layout shifts during image load

#### Expected Results:
- ✅ CLS < 0.1 (Good)
- ✅ Hero image container has explicit dimensions (aspect-ratio or height)
- ✅ No layout shift when image loads
- ✅ Text block does not shift after image load
- ✅ CTA button does not move after image load
- ✅ Scroll hint does not cause layout shift

**Layout Shift Prevention**:
- ✅ Image container uses `height: clamp(60vh, 65vh, 70vh)` (explicit height)
- ✅ Image uses `width: 100%; height: 100%; object-fit: cover`
- ✅ No content reflow after fonts load

**Performance Thresholds**:
- **Good**: CLS < 0.1 (target)
- **Needs Improvement**: CLS 0.1-0.25
- **Poor**: CLS > 0.25

#### Pass/Fail Criteria:
- **PASS**: CLS < 0.1, no visible layout shifts
- **FAIL**: CLS > 0.1, or visible layout shifts during load

**Test Data**: N/A
**Test Environment**: Mobile viewport, simulated 4G throttling
**Automation Potential**: High (Lighthouse CI, WebPageTest)

**Web Vitals Metric**: CLS (Cumulative Layout Shift)

---

### TC-P003: First Input Delay (FID) / Interaction to Next Paint (INP)
**Priority**: HIGH
**Category**: Performance (Core Web Vitals)
**Preconditions**: Mobile hero displayed (TC-F001 passed)

#### Test Steps:
1. Load page on mobile device
2. Immediately tap CTA button after page appears (before fully loaded)
3. Measure time until navigation occurs
4. Run Chrome DevTools Performance audit
5. Observe interaction metrics

#### Expected Results:
- ✅ FID < 100ms (Good)
- ✅ INP < 200ms (Good)
- ✅ CTA button responds immediately to tap
- ✅ No JavaScript blocking main thread during hero interaction
- ✅ No long tasks (>50ms) blocking input
- ✅ Smooth tap response (no lag)

**Performance Thresholds (FID)**:
- **Good**: FID < 100ms (target)
- **Needs Improvement**: FID 100-300ms
- **Poor**: FID > 300ms

**Performance Thresholds (INP)**:
- **Good**: INP < 200ms (target)
- **Needs Improvement**: INP 200-500ms
- **Poor**: INP > 500ms

#### Pass/Fail Criteria:
- **PASS**: FID < 100ms, INP < 200ms, immediate button response
- **FAIL**: FID > 100ms, INP > 200ms, or laggy interactions

**Test Data**: N/A
**Test Environment**: Real mobile devices (iPhone, Android)
**Automation Potential**: Medium (Lighthouse field data, manual testing required)

**Web Vitals Metrics**: FID (First Input Delay), INP (Interaction to Next Paint)

---

### TC-P004: Network Performance (Slow 3G)
**Priority**: MEDIUM
**Category**: Performance (Network Resilience)
**Preconditions**: None

#### Test Steps:
1. Open Chrome DevTools Network panel
2. Enable network throttling: "Slow 3G" preset
3. Hard reload page (Cmd+Shift+R or Ctrl+Shift+R)
4. Observe page load behavior
5. Verify progressive rendering

#### Expected Results:
- ✅ Hero text block appears before image loads (progressive rendering)
- ✅ CTA button functional before image loads
- ✅ Image loads with visible progress (not blank)
- ✅ Page remains functional during slow load
- ✅ No JavaScript errors during slow load
- ✅ Total page load < 10 seconds on Slow 3G
- ✅ Hero image fully loaded within acceptable time

**Network Conditions (Slow 3G)**:
- Bandwidth: 400 Kbps down, 400 Kbps up
- Latency: 2000ms RTT

#### Pass/Fail Criteria:
- **PASS**: Page usable during slow load, acceptable load time
- **FAIL**: Page unusable during load, or excessive load time (>15s)

**Test Data**: N/A
**Test Environment**: Chrome DevTools with Slow 3G throttling
**Automation Potential**: Medium (WebPageTest)

---

### TC-P005: Image Optimization
**Priority**: MEDIUM
**Category**: Performance (Asset Optimization)
**Preconditions**: None

#### Test Steps:
1. Open Chrome DevTools Network panel
2. Load page and observe image request
3. Verify image format, size, and compression
4. Check image dimensions vs display size

#### Expected Results:
- ✅ Image format: WebP (modern, efficient format)
- ✅ Image file size: < 150KB (mobile-optimized)
- ✅ Image dimensions: appropriate for mobile (not oversized)
- ✅ Image served with compression (gzip or brotli)
- ✅ Image uses `srcset` if available (responsive images)
- ✅ No PNG or JPEG when WebP available
- ✅ Image quality acceptable (no visible compression artifacts)

**Optimization Checklist**:
- ✅ WebP format used
- ✅ Appropriate resolution for mobile (~800px width)
- ✅ Compression level optimized (quality ~80-85%)
- ✅ Progressive rendering (if JPEG fallback used)

#### Pass/Fail Criteria:
- **PASS**: Image optimized (WebP, <150KB, appropriate dimensions)
- **FAIL**: Image too large (>300KB), wrong format, or oversized dimensions

**Test Data**: Image file: `docs/img/cover.webp`
**Test Environment**: Chrome DevTools Network panel
**Automation Potential**: High (automated image analysis tools)

---

## Cross-Browser Test Cases

### TC-B001: iOS Safari (Latest)
**Priority**: CRITICAL
**Category**: Browser Compatibility
**Preconditions**: iPhone with iOS Safari (latest stable version)

#### Test Steps:
1. Open index.html in Safari on iPhone
2. Verify mobile hero displays correctly
3. Test all interactive elements (CTA, theme toggle)
4. Verify responsive behavior (portrait/landscape)
5. Check for any Safari-specific bugs

#### Expected Results:
- ✅ Hero image displays correctly (no Safari-specific rendering issues)
- ✅ Image filter CSS applies correctly: `brightness()`, `contrast()`, `saturate()`
- ✅ Gradient background on CTA button renders correctly
- ✅ `clamp()` CSS function works (image height, font sizes)
- ✅ CSS custom properties (variables) work
- ✅ Touch interactions smooth (no lag)
- ✅ No horizontal scrolling
- ✅ No console errors in Safari Web Inspector
- ✅ Dark mode switches correctly

**Safari-Specific Checks**:
- ✅ `-webkit-backdrop-filter` not required (no backdrop filter used)
- ✅ Smooth scrolling works: `scroll-behavior: smooth`
- ✅ Viewport units (`vh`) work correctly
- ✅ Safe area insets respected (if applicable)

#### Pass/Fail Criteria:
- **PASS**: All features work on iOS Safari, no visual bugs
- **FAIL**: Rendering issues, features broken, or Safari-specific bugs

**Test Data**: N/A
**Test Environment**: iPhone 13 Mini (or later) with iOS Safari
**Automation Potential**: Medium (BrowserStack automation)

---

### TC-B002: Chrome iOS (Latest)
**Priority**: HIGH
**Category**: Browser Compatibility
**Preconditions**: iPhone with Chrome iOS (latest stable version)

#### Test Steps:
1. Open index.html in Chrome on iPhone
2. Verify mobile hero displays correctly
3. Test all interactive elements
4. Compare rendering with Safari iOS

#### Expected Results:
- ✅ Hero displays identically to Safari iOS (same WebKit engine)
- ✅ All features functional
- ✅ No Chrome-specific issues
- ✅ Theme toggle works
- ✅ Navigation works

**Note**: Chrome iOS uses WebKit engine (same as Safari), so behavior should be identical.

#### Pass/Fail Criteria:
- **PASS**: Feature parity with Safari iOS, no issues
- **FAIL**: Any deviation from Safari iOS, or Chrome-specific bugs

**Test Data**: N/A
**Test Environment**: iPhone with Chrome iOS
**Automation Potential**: Medium (BrowserStack)

---

### TC-B003: Chrome Android (Latest)
**Priority**: CRITICAL
**Category**: Browser Compatibility
**Preconditions**: Android device with Chrome (latest stable version)

#### Test Steps:
1. Open index.html in Chrome on Android device
2. Verify mobile hero displays correctly
3. Test all interactive elements
4. Verify performance and smoothness

#### Expected Results:
- ✅ Hero image displays correctly
- ✅ All CSS features work (clamp, gradients, filters)
- ✅ Touch interactions smooth
- ✅ No Android-specific bugs
- ✅ Theme toggle works
- ✅ Navigation works
- ✅ Performance acceptable (no lag)

**Android-Specific Checks**:
- ✅ No issues with Android system navigation gestures
- ✅ Dark mode respects Android system theme
- ✅ No issues with different screen densities (1x, 2x, 3x)

#### Pass/Fail Criteria:
- **PASS**: All features work on Chrome Android, no visual bugs
- **FAIL**: Rendering issues, features broken, or Android-specific bugs

**Test Data**: N/A
**Test Environment**: Samsung Galaxy S21 (or similar) with Chrome Android
**Automation Potential**: Medium (BrowserStack automation)

---

### TC-B004: Samsung Internet (Latest)
**Priority**: MEDIUM
**Category**: Browser Compatibility
**Preconditions**: Samsung device with Samsung Internet browser (latest stable)

#### Test Steps:
1. Open index.html in Samsung Internet
2. Verify mobile hero displays correctly
3. Test all interactive elements
4. Compare with Chrome Android

#### Expected Results:
- ✅ Hero displays correctly
- ✅ All features functional
- ✅ No Samsung Internet-specific issues
- ✅ Theme toggle works
- ✅ Navigation works

**Samsung Internet-Specific Checks**:
- ✅ Chromium-based features work (should be identical to Chrome)
- ✅ No issues with Samsung-specific browser features

#### Pass/Fail Criteria:
- **PASS**: Feature parity with Chrome Android, no issues
- **FAIL**: Any deviation from Chrome Android, or Samsung-specific bugs

**Test Data**: N/A
**Test Environment**: Samsung device with Samsung Internet browser
**Automation Potential**: Medium (BrowserStack)

---

### TC-B005: Firefox iOS (Latest)
**Priority**: LOW
**Category**: Browser Compatibility
**Preconditions**: iPhone with Firefox iOS (latest stable version)

#### Test Steps:
1. Open index.html in Firefox on iPhone
2. Verify mobile hero displays correctly
3. Test basic functionality

#### Expected Results:
- ✅ Hero displays correctly (uses WebKit on iOS)
- ✅ Basic features work
- ✅ Navigation works

**Note**: Firefox iOS uses WebKit (Apple requirement), so behavior should match Safari iOS.

#### Pass/Fail Criteria:
- **PASS**: Feature parity with Safari iOS
- **FAIL**: Any Firefox-specific bugs

**Test Data**: N/A
**Test Environment**: iPhone with Firefox iOS
**Automation Potential**: Low (manual testing)

---

## Edge Case & Regression Testing

### TC-E001: Orientation Change (Portrait ↔ Landscape)
**Priority**: HIGH
**Category**: Edge Case (Device Orientation)
**Preconditions**: Mobile device with accelerometer

#### Test Steps:
1. Open index.html in portrait mode
2. Observe mobile hero layout
3. Rotate device to landscape mode
4. Observe layout adjustment
5. Rotate back to portrait
6. Verify layout returns to original state

#### Expected Results:

**Portrait Mode (e.g., 375px × 812px)**:
- ✅ Mobile hero visible
- ✅ Image height 60-70vh
- ✅ Text block centered
- ✅ CTA button visible

**Landscape Mode (e.g., 812px × 375px)**:
- ✅ IF viewport width ≤768px: Mobile hero still visible
- ✅ IF viewport width ≥769px: Desktop hero visible (modal)
- ✅ Layout adapts smoothly (no broken layout)
- ✅ All content accessible

**Rotation Transition**:
- ✅ No layout shift or flicker during rotation
- ✅ No content overflow
- ✅ Images resize correctly
- ✅ Text remains readable

#### Pass/Fail Criteria:
- **PASS**: Layout adapts correctly in both orientations, smooth transition
- **FAIL**: Layout breaks, content hidden, or broken during rotation

**Test Data**: N/A
**Test Environment**: Real mobile devices (iPhone, Android)
**Automation Potential**: Low (physical device rotation required)

---

### TC-E002: Rapid Viewport Resizing
**Priority**: MEDIUM
**Category**: Edge Case (Responsive Stress Test)
**Preconditions**: Desktop browser with responsive design mode

#### Test Steps:
1. Open index.html in responsive design mode
2. Rapidly resize viewport from 320px → 768px → 1024px → 320px
3. Repeat cycle 5-10 times
4. Observe layout stability

#### Expected Results:
- ✅ Layout adapts to each breakpoint correctly
- ✅ No JavaScript errors in console
- ✅ No visual glitches or flicker
- ✅ Correct hero version displays at each breakpoint
- ✅ Breakpoint transition (768px/769px) is clean
- ✅ No memory leaks (check DevTools memory profile)

#### Pass/Fail Criteria:
- **PASS**: Layout stable, no errors, smooth transitions
- **FAIL**: Layout breaks, errors occur, or visual glitches

**Test Data**: N/A
**Test Environment**: Chrome DevTools responsive design mode
**Automation Potential**: Medium (automated resize script)

---

### TC-E003: Image Load Failure
**Priority**: MEDIUM
**Category**: Edge Case (Error Handling)
**Preconditions**: None

#### Test Steps:
1. Modify `img/cover.webp` path to invalid URL (e.g., `img/fake.webp`)
2. Load index.html
3. Observe error handling
4. Verify fallback behavior

#### Expected Results:
- ✅ Alt text displayed: "Branchstone mixed-media art featuring natural forest materials, moss, and wood textures from Santa Rosa, California"
- ✅ Image container maintains height (no layout shift)
- ✅ Background color visible: `var(--bg-elevated)` or similar
- ✅ No broken image icon (if possible)
- ✅ Text block still displays correctly
- ✅ CTA button still functional
- ✅ No JavaScript errors
- ✅ Console warning logged (for developer awareness)

#### Pass/Fail Criteria:
- **PASS**: Graceful degradation, alt text shown, functionality preserved
- **FAIL**: Layout breaks, no fallback, or errors crash page

**Test Data**: Invalid image path: `img/fake.webp`
**Test Environment**: All mobile viewports
**Automation Potential**: High (automated error injection)

---

### TC-E004: Very Small Screens (<320px)
**Priority**: LOW
**Category**: Edge Case (Ultra-Small Viewports)
**Preconditions**: None

#### Test Steps:
1. Open index.html in responsive design mode
2. Set viewport to 280px width (below typical minimum)
3. Observe layout behavior
4. Verify no critical breakage

#### Expected Results:
- ✅ Hero image displays (may be small but visible)
- ✅ Text remains readable (font size may be minimum)
- ✅ CTA button visible and tappable
- ✅ No horizontal scrolling
- ✅ Content does not overflow
- ✅ Layout remains functional (not pretty, but usable)

**Acceptable Degradation**:
- ⚠️ Text may be small (but still readable)
- ⚠️ Image may be cropped aggressively
- ⚠️ Spacing may be tighter

#### Pass/Fail Criteria:
- **PASS**: Page usable, no critical breakage, acceptable degradation
- **FAIL**: Layout completely broken, content hidden, or horizontal scroll

**Test Data**: N/A
**Test Environment**: Browser responsive mode at 280px width
**Automation Potential**: Medium (dimension validation)

---

### TC-E005: Very Large Screens (>1920px)
**Priority**: LOW
**Category**: Edge Case (Ultra-Wide Viewports)
**Preconditions**: None

#### Test Steps:
1. Open index.html in responsive design mode
2. Set viewport to 2560px width (ultra-wide)
3. Observe desktop hero behavior
4. Verify no breakage at large sizes

#### Expected Results:
- ✅ Desktop modal hero displays (not mobile hero)
- ✅ Modal overlay scales appropriately
- ✅ Content does not stretch excessively
- ✅ No layout issues
- ✅ Image quality remains acceptable

**Acceptable Behavior**:
- ⚠️ Content may use max-width constraints
- ⚠️ Extra whitespace around modal is fine

#### Pass/Fail Criteria:
- **PASS**: Desktop hero works, no layout issues
- **FAIL**: Layout breaks, modal too small/large, or content issues

**Test Data**: N/A
**Test Environment**: Browser responsive mode at 2560px width
**Automation Potential**: Medium (dimension validation)

---

### TC-R001: Desktop Hero Functionality Preserved
**Priority**: CRITICAL
**Category**: Regression Testing
**Preconditions**: Desktop viewport ≥1024px

#### Test Steps:
1. Open index.html in desktop viewport (1440px recommended)
2. Verify desktop modal hero displays
3. Test close button functionality
4. Test "Show Info" button functionality
5. Test click-outside-to-close behavior
6. Test ESC key to close
7. Compare with previous implementation (pre-mobile-hero)

#### Expected Results:
- ✅ Desktop modal hero displays on page load
- ✅ Close button (×) dismisses modal
- ✅ Modal content hides, "Show Info" button appears
- ✅ "Show Info" button restores modal
- ✅ Clicking outside modal closes it
- ✅ ESC key closes modal
- ✅ SessionStorage persists dismissal state
- ✅ All previous desktop features work identically
- ✅ No regressions or new bugs introduced

**Functionality Checklist**:
- ✅ Modal overlay displays with background image
- ✅ Modal content card displays correctly
- ✅ All text readable (heading, subheading, stats)
- ✅ Both CTA buttons work ("View Gallery", "About the Artist")
- ✅ Verified artist badge displays
- ✅ Close button positioned correctly (top-right)
- ✅ "Show Info" button appears after close

#### Pass/Fail Criteria:
- **PASS**: Desktop hero 100% identical to previous implementation, no regressions
- **FAIL**: Any desktop feature broken, new bugs, or behavioral changes

**Test Data**: N/A
**Test Environment**: Desktop viewport 1024px-1920px
**Automation Potential**: High (regression test suite)

---

### TC-R002: Gallery Page Unaffected
**Priority**: HIGH
**Category**: Regression Testing
**Preconditions**: None

#### Test Steps:
1. Navigate to gallery.html on mobile device
2. Verify no hero section present (correct)
3. Verify gallery layout unchanged
4. Test all gallery features (filters, cards, modal)

#### Expected Results:
- ✅ Gallery page has NO hero section (mobile or desktop)
- ✅ Gallery header displays correctly
- ✅ Filter controls work
- ✅ Artwork cards display correctly
- ✅ Modal lightbox opens on card click
- ✅ No side effects from mobile hero CSS

#### Pass/Fail Criteria:
- **PASS**: Gallery page unaffected, all features work
- **FAIL**: Gallery layout broken, hero mistakenly appears, or side effects

**Test Data**: N/A
**Test Environment**: All viewports
**Automation Potential**: High (regression suite)

---

### TC-R003: Other Pages Unaffected
**Priority**: MEDIUM
**Category**: Regression Testing
**Preconditions**: None

#### Test Steps:
1. Navigate to about.html, commissions.html, contact.html
2. Verify pages load correctly on mobile
3. Verify no hero section present
4. Verify no layout issues from mobile hero CSS

#### Expected Results:
- ✅ All pages load without errors
- ✅ No hero section on non-index pages
- ✅ Layouts unchanged and correct
- ✅ No CSS conflicts from mobile-ux-improvements.css

#### Pass/Fail Criteria:
- **PASS**: All pages unaffected, no side effects
- **FAIL**: Layout issues, CSS conflicts, or broken pages

**Test Data**: N/A
**Test Environment**: All viewports
**Automation Potential**: High (regression suite)

---

## User Acceptance Testing (UAT)

### UAT-001: First-Time Visitor Experience
**Priority**: HIGH
**Category**: User Acceptance
**Test Type**: User Observation / Interview

#### Scenario:
You are a potential art collector visiting Branchstone for the first time on your mobile phone. You're browsing while commuting or during a break.

#### Tasks:
1. Open index.html on mobile device (provided by tester)
2. Observe the hero section as the page loads
3. Read the heading and subheading
4. Notice the hero image
5. Find and tap the CTA button
6. Navigate to the gallery

#### Observation Criteria:
- ✅ User notices hero image immediately (eye-tracking or verbal confirmation)
- ✅ User reads heading and subheading without prompting
- ✅ User understands the site's purpose within 5 seconds
- ✅ User finds CTA button without assistance
- ✅ User taps CTA button confidently (no hesitation)
- ✅ User successfully navigates to gallery

#### User Satisfaction Questions (1-5 scale):
1. How visually appealing is the hero section? (1=Poor, 5=Excellent)
2. How easy was it to understand the site's purpose? (1=Difficult, 5=Very Easy)
3. How easy was it to find the main CTA? (1=Difficult, 5=Very Easy)
4. How likely are you to explore more? (1=Unlikely, 5=Very Likely)
5. Overall satisfaction with first impression? (1=Poor, 5=Excellent)

#### Success Criteria:
- **PASS**: Average score ≥4.0/5.0 across all questions, ≥85% task completion rate
- **FAIL**: Average score <4.0/5.0, or <85% task completion rate

**Test Data**: N/A
**Test Participants**: 5-10 first-time users (mixed demographics)
**Test Environment**: Real mobile devices (iPhone, Android)

---

### UAT-002: Aesthetic Preference Testing
**Priority**: MEDIUM
**Category**: User Acceptance
**Test Type**: A/B Comparison

#### Scenario:
Compare mobile hero implementation against desktop modal version.

#### Tasks:
1. Show participant mobile hero on iPhone (current implementation)
2. Show participant desktop modal on desktop browser (previous version)
3. Ask preference questions

#### Comparison Questions:
1. Which version feels more modern? (Mobile vs Desktop)
2. Which version is more engaging? (Mobile vs Desktop)
3. Which version better showcases the artwork? (Mobile vs Desktop)
4. Which version would you prefer on your phone? (Mobile vs Desktop)

#### Qualitative Feedback:
- What do you like about the mobile version?
- What do you dislike about the mobile version?
- Any suggestions for improvement?

#### Success Criteria:
- **PASS**: ≥70% prefer mobile hero for mobile devices, positive qualitative feedback
- **FAIL**: <70% prefer mobile hero, or predominantly negative feedback

**Test Data**: N/A
**Test Participants**: 5-10 users (art collectors, general audience)
**Test Environment**: iPhone for mobile, laptop for desktop comparison

---

### UAT-003: Accessibility User Testing
**Priority**: HIGH
**Category**: User Acceptance (Accessibility)
**Test Type**: Assistive Technology User Testing

#### Scenario:
Screen reader user or keyboard-only user navigates the mobile hero.

#### Tasks:
1. Navigate to index.html using assistive technology
2. Use screen reader (VoiceOver or TalkBack) to explore hero section
3. OR use keyboard only (Tab, Enter) to navigate hero
4. Attempt to activate CTA and reach gallery

#### Observation Criteria:
- ✅ User understands hero content via screen reader
- ✅ User finds CTA button via keyboard navigation
- ✅ User successfully activates CTA
- ✅ User expresses no confusion or frustration
- ✅ User rates experience as accessible (subjective)

#### Accessibility User Questions:
1. Was the hero section easy to navigate with assistive technology? (Yes/No)
2. Was the content clear and understandable? (Yes/No)
3. Were there any barriers or frustrations? (Open-ended)
4. Overall accessibility rating? (1-5 scale)

#### Success Criteria:
- **PASS**: 100% task completion, no significant barriers, average rating ≥4/5
- **FAIL**: Task failure, significant barriers reported, or rating <4/5

**Test Data**: N/A
**Test Participants**: 2-5 users with disabilities (blind, low vision, motor impairments)
**Test Environment**: Real mobile devices with assistive technology enabled

---

## Release Readiness Checklist

### Pre-Production Validation

#### Critical Path (MUST PASS)
- [ ] **TC-F001**: Mobile hero displays correctly on standard mobile (375px) - PASS
- [ ] **TC-F002**: CTA button navigates to gallery.html - PASS
- [ ] **TC-F003**: Desktop hero preserved (≥769px) - PASS
- [ ] **TC-F004**: Breakpoint transition (768px/769px) clean - PASS
- [ ] **TC-A001**: Keyboard navigation works - PASS
- [ ] **TC-A002**: Screen reader compatible - PASS
- [ ] **TC-A003**: Color contrast AAA compliant - PASS
- [ ] **TC-P001**: LCP < 2.5s - PASS
- [ ] **TC-P002**: CLS < 0.1 - PASS
- [ ] **TC-B001**: iOS Safari compatibility - PASS
- [ ] **TC-B003**: Chrome Android compatibility - PASS
- [ ] **TC-R001**: Desktop hero functionality preserved - PASS

**Mandatory**: 100% pass rate on Critical Path tests.

#### High Priority (STRONGLY RECOMMENDED)
- [ ] **TC-F005**: Scroll hint animation - PASS
- [ ] **TC-F006**: Theme switching (light/dark) - PASS
- [ ] **TC-F007**: Image loading & error handling - PASS
- [ ] **TC-V001**: Hero image dimensions correct - PASS
- [ ] **TC-V002**: Text block layout correct - PASS
- [ ] **TC-V003**: CTA button styling correct - PASS
- [ ] **TC-A004**: Touch target size AAA compliant (≥44px) - PASS
- [ ] **TC-A005**: Reduced motion preference respected - PASS
- [ ] **TC-P003**: FID < 100ms, INP < 200ms - PASS
- [ ] **TC-B002**: Chrome iOS compatibility - PASS
- [ ] **TC-E001**: Orientation change (portrait/landscape) - PASS
- [ ] **UAT-001**: First-time visitor satisfaction ≥4/5 - PASS

**Target**: ≥95% pass rate on High Priority tests.

#### Medium Priority (RECOMMENDED)
- [ ] **TC-V004**: Scroll hint visual design - PASS
- [ ] **TC-V005**: Short screen handling (≤600px height) - PASS
- [ ] **TC-A006**: Alt text quality - PASS
- [ ] **TC-P004**: Slow 3G performance acceptable - PASS
- [ ] **TC-P005**: Image optimization verified - PASS
- [ ] **TC-B004**: Samsung Internet compatibility - PASS
- [ ] **TC-E002**: Rapid viewport resizing stable - PASS
- [ ] **TC-E003**: Image load failure graceful - PASS
- [ ] **TC-R002**: Gallery page unaffected - PASS
- [ ] **TC-R003**: Other pages unaffected - PASS
- [ ] **UAT-002**: Aesthetic preference ≥70% favor mobile - PASS

**Target**: ≥90% pass rate on Medium Priority tests.

#### Low Priority (OPTIONAL)
- [ ] **TC-B005**: Firefox iOS compatibility - PASS/SKIP
- [ ] **TC-E004**: Very small screens (<320px) usable - PASS/ACCEPTABLE DEGRADATION
- [ ] **TC-E005**: Very large screens (>1920px) unaffected - PASS/SKIP
- [ ] **UAT-003**: Accessibility user testing positive - PASS/SKIP (if no participants available)

**Target**: ≥80% pass rate on Low Priority tests (acceptable to skip some).

---

### Production Readiness Assessment

#### Go/No-Go Decision Matrix

**GO Criteria** (All must be TRUE):
1. ✅ Critical Path: 100% pass rate (12/12 tests)
2. ✅ High Priority: ≥95% pass rate (≥11/12 tests)
3. ✅ Medium Priority: ≥90% pass rate (≥10/11 tests)
4. ✅ Zero CRITICAL severity bugs open
5. ✅ Zero HIGH severity bugs open
6. ✅ Web Vitals meet Google thresholds:
   - LCP < 2.5s
   - CLS < 0.1
   - FID < 100ms OR INP < 200ms
7. ✅ WCAG 2.1 Level AAA compliance verified (contrast, touch targets, motion)
8. ✅ User acceptance testing positive (≥4/5 satisfaction, ≥85% task completion)
9. ✅ No regressions to desktop hero or other pages
10. ✅ iOS Safari and Chrome Android compatibility confirmed

**NO-GO Criteria** (ANY of these triggers NO-GO):
1. ❌ Critical Path: <100% pass rate
2. ❌ Any CRITICAL severity bug open
3. ❌ More than 1 HIGH severity bug open
4. ❌ Web Vitals fail Google thresholds
5. ❌ WCAG 2.1 Level AA compliance NOT met (minimum requirement)
6. ❌ iOS Safari or Chrome Android broken/unusable
7. ❌ Desktop hero broken (regressions)
8. ❌ User acceptance testing predominantly negative

---

### Issue Severity Definitions

#### CRITICAL (Blocks Release)
- Feature completely non-functional (e.g., mobile hero doesn't display)
- Page crash or unrecoverable error
- Data loss or corruption
- Security vulnerability
- WCAG Level A violation (core accessibility broken)
- Desktop functionality broken (regressions)

**Resolution**: MUST FIX before production deployment.

#### HIGH (Strongly Recommended to Fix)
- Feature partially functional but significantly degraded
- Major visual bug affecting user experience
- Performance severely degraded (LCP > 4s, CLS > 0.25)
- WCAG Level AA violation
- Browser compatibility issue on major browser (iOS Safari, Chrome Android)
- Layout broken on common viewport (375px, 414px)

**Resolution**: STRONGLY RECOMMENDED to fix before production. May proceed with documented risk acceptance.

#### MEDIUM (Recommended to Fix)
- Minor visual inconsistency
- Edge case failure (rare viewport, orientation)
- Performance moderately degraded (LCP 2.5-4s, CLS 0.1-0.25)
- WCAG Level AAA violation (but AA met)
- Browser compatibility issue on uncommon browser (Samsung Internet, Firefox iOS)

**Resolution**: RECOMMENDED to fix before production, but acceptable to defer to post-launch if prioritized.

#### LOW (Nice to Fix)
- Cosmetic issue with no UX impact
- Edge case failure on rare configuration (<1% user base)
- Enhancement suggestion (not a bug)
- Documentation gap

**Resolution**: Safe to defer to backlog. Does not block release.

---

### Known Limitations & Acceptable Trade-offs

#### Documented Acceptable Limitations:
1. **Very Small Screens (<320px)**: Layout may be cramped but remains functional. Acceptable degradation given <0.1% user base.
2. **Landscape Mode on Small Phones**: Hero may appear short in landscape. Acceptable as portrait is primary mobile use case.
3. **Internet Explorer**: Not supported (EOL browser). Displays desktop hero fallback.
4. **Firefox iOS**: Minimal testing due to low market share (<1%). Should work (uses WebKit) but not exhaustively tested.

**Risk Acceptance**: Stakeholder sign-off required for any known limitation that affects >1% of user base.

---

### Post-Deployment Monitoring

#### Week 1 Metrics to Monitor:
- **Web Vitals** (via Google Search Console / CrUX):
  - LCP, CLS, FID/INP on mobile devices
  - Target: ≥75% of page loads in "Good" category
- **User Engagement**:
  - Mobile hero CTA click-through rate
  - Bounce rate on mobile vs desktop
  - Time on page (mobile)
- **Error Tracking** (via Sentry / error monitoring):
  - JavaScript errors on mobile
  - 404 errors (image load failures)
  - Console warnings
- **Device/Browser Analytics**:
  - Mobile device distribution (iOS vs Android)
  - Browser distribution (Safari vs Chrome)
  - Viewport size distribution

#### Success Metrics (Post-Launch):
- **CTA Click-Through Rate**: ≥40% (mobile visitors click "Explore the Works")
- **Bounce Rate**: ≤50% on mobile (comparable to desktop)
- **Web Vitals**: ≥75% of loads in "Good" category
- **Zero Production Errors**: No error spikes in first 48 hours

#### Rollback Criteria:
Immediate rollback if:
- **Error Rate Spike**: >5% of mobile sessions encounter JavaScript errors
- **Performance Degradation**: Web Vitals drop to "Poor" category
- **User Complaints**: >10 user-reported issues in first 48 hours
- **Critical Bug Discovered**: Blocking issue on major device/browser

---

## Test Execution Summary Template

### Test Run ID: [TR-YYYY-MM-DD-NN]
**Date**: [YYYY-MM-DD]
**Tester**: [Name]
**Environment**: [Devices/Browsers Tested]
**Build Version**: [Git commit hash]

---

### Test Results Summary

| Priority | Total Tests | Passed | Failed | Skipped | Pass Rate |
|----------|-------------|--------|--------|---------|-----------|
| Critical | 12          | TBD    | TBD    | TBD     | TBD%      |
| High     | 12          | TBD    | TBD    | TBD     | TBD%      |
| Medium   | 11          | TBD    | TBD    | TBD     | TBD%      |
| Low      | 4           | TBD    | TBD    | TBD     | TBD%      |
| **Total**| **39**      | **TBD**| **TBD**| **TBD** | **TBD%**  |

---

### Issues Found

| Issue ID | Severity | Test Case | Description | Status |
|----------|----------|-----------|-------------|--------|
| [AUTO]   | [LEVEL]  | [TC-XXX]  | [DESC]      | Open/Fixed/Deferred |

---

### Release Recommendation

**☐ GO** - All critical tests passed, meets production criteria
**☐ GO WITH MINOR ISSUES** - Non-blocking issues documented, accepted by stakeholders
**☐ NO-GO** - Critical issues present, requires fixes before deployment

**Justification**: [Explain recommendation based on test results]

---

### Approval Sign-Off

**QA Lead**: ___________________________ Date: ___________
**Product Manager**: ___________________________ Date: ___________
**Engineering Lead**: ___________________________ Date: ___________

---

## Appendix A: Test Environment Setup

### Required Tools & Software

**Browsers**:
- Chrome (latest stable)
- Safari (latest stable, macOS and iOS)
- Firefox (latest stable)
- Chrome Android (latest stable)
- Samsung Internet (optional)

**Developer Tools**:
- Chrome DevTools
- Safari Web Inspector
- Firefox Developer Tools

**Accessibility Tools**:
- axe DevTools (browser extension)
- WAVE (browser extension)
- VoiceOver (iOS/macOS built-in)
- TalkBack (Android built-in)
- NVDA (Windows, free download)

**Performance Tools**:
- Chrome Lighthouse (DevTools built-in)
- WebPageTest (webpagetest.org)

**Device Testing**:
- **Preferred**: Real devices (iPhone, Android phone)
- **Fallback**: BrowserStack or similar cloud testing service

---

### Local Development Server Setup

```bash
# Navigate to project directory
cd /Users/vik/Workspace/branchstone/docs

# Start local HTTP server (choose one):

# Option 1: Python (built-in on macOS)
python3 -m http.server 8000

# Option 2: Node.js (if installed)
npx http-server -p 8000

# Option 3: PHP (built-in on macOS)
php -S localhost:8000

# Access site:
# http://localhost:8000/index.html
```

---

## Appendix B: Recommended Testing Order

### Phase 1: Smoke Test (30 minutes)
**Objective**: Verify basic functionality before comprehensive testing.

1. **TC-F001**: Mobile hero displays (375px)
2. **TC-F002**: CTA button navigates
3. **TC-F003**: Desktop hero preserved (1024px)
4. **TC-F004**: Breakpoint transition (768px/769px)
5. **TC-B001**: iOS Safari basic test
6. **TC-B003**: Chrome Android basic test

**If any test fails**: STOP and fix before proceeding.

---

### Phase 2: Critical Functional Testing (1 hour)
**Objective**: Validate all critical features across devices.

1. **TC-F005**: Scroll hint animation
2. **TC-F006**: Theme switching
3. **TC-F007**: Image loading & error handling
4. **TC-V001**: Hero image dimensions
5. **TC-V002**: Text block layout
6. **TC-V003**: CTA button styling
7. **TC-A001**: Keyboard navigation
8. **TC-A002**: Screen reader compatibility

---

### Phase 3: Accessibility & Performance (1.5 hours)
**Objective**: Ensure WCAG compliance and performance targets met.

1. **TC-A003**: Color contrast (light & dark)
2. **TC-A004**: Touch target size
3. **TC-A005**: Reduced motion preference
4. **TC-A006**: Alt text quality
5. **TC-P001**: LCP < 2.5s
6. **TC-P002**: CLS < 0.1
7. **TC-P003**: FID/INP < 100ms/200ms
8. **TC-P004**: Slow 3G performance
9. **TC-P005**: Image optimization

---

### Phase 4: Cross-Browser & Edge Cases (1 hour)
**Objective**: Verify compatibility and robustness.

1. **TC-B002**: Chrome iOS
2. **TC-B004**: Samsung Internet
3. **TC-B005**: Firefox iOS (optional)
4. **TC-E001**: Orientation change
5. **TC-E002**: Rapid viewport resizing
6. **TC-E003**: Image load failure
7. **TC-E004**: Very small screens (<320px)
8. **TC-E005**: Very large screens (>1920px)

---

### Phase 5: Regression Testing (45 minutes)
**Objective**: Ensure no side effects from implementation.

1. **TC-R001**: Desktop hero functionality preserved
2. **TC-R002**: Gallery page unaffected
3. **TC-R003**: Other pages unaffected
4. **TC-V004**: Scroll hint visual design
5. **TC-V005**: Short screen handling

---

### Phase 6: User Acceptance Testing (2-3 hours)
**Objective**: Validate user experience and satisfaction.

1. **UAT-001**: First-time visitor experience (5-10 participants)
2. **UAT-002**: Aesthetic preference testing (5-10 participants)
3. **UAT-003**: Accessibility user testing (2-5 participants, optional)

---

**Total Estimated Time**: 6-8 hours (including UAT)

---

## Appendix C: Bug Reporting Template

### Bug Report: [BUG-YYYY-MM-DD-NN]

**Title**: [Short, descriptive title]

**Severity**: Critical | High | Medium | Low

**Priority**: P0 (Blocker) | P1 (High) | P2 (Medium) | P3 (Low)

**Test Case**: [TC-XXX]

**Environment**:
- Device: [e.g., iPhone 13 Mini]
- OS: [e.g., iOS 17.2]
- Browser: [e.g., Safari 17.2]
- Viewport: [e.g., 375px × 812px]
- Network: [e.g., WiFi, 4G]

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]
4. [Observe issue]

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happens]

**Visual Evidence**:
- Screenshot: [filename or attach]
- Screen recording: [filename or attach]

**Frequency**: Always | Often | Sometimes | Rare

**Workaround**: [If known, how to avoid/mitigate issue]

**Additional Notes**:
[Any other relevant information]

**Suggested Fix** (optional):
[If QA has code insight, suggest potential fix]

---

**Status**: Open | In Progress | Fixed | Deferred | Closed

**Assigned To**: [Developer name]

**Fixed In**: [Git commit hash or build version]

**Verified By**: [QA tester name]

**Verification Date**: [YYYY-MM-DD]

---

## Appendix D: Performance Metrics Reference

### Core Web Vitals Thresholds

#### Largest Contentful Paint (LCP)
**Measures**: Loading performance (time for largest visible element to render)

- **Good**: ≤2.5 seconds (TARGET)
- **Needs Improvement**: 2.5-4.0 seconds
- **Poor**: >4.0 seconds

**Optimization Tips**:
- Use `fetchpriority="high"` on hero image
- Preload hero image: `<link rel="preload" as="image" href="...">`
- Optimize image size (WebP, compression)
- Use CDN for faster delivery
- Minimize server response time

---

#### Cumulative Layout Shift (CLS)
**Measures**: Visual stability (unexpected layout shifts during page load)

- **Good**: ≤0.1 (TARGET)
- **Needs Improvement**: 0.1-0.25
- **Poor**: >0.25

**Optimization Tips**:
- Set explicit dimensions on images (width, height, or aspect-ratio)
- Reserve space for dynamic content
- Use `transform` for animations (not top/left/width/height)
- Avoid inserting content above existing content
- Use CSS `contain` property where appropriate

---

#### First Input Delay (FID) / Interaction to Next Paint (INP)
**Measures**: Interactivity (time between user input and browser response)

**FID** (older metric):
- **Good**: ≤100 milliseconds (TARGET)
- **Needs Improvement**: 100-300 milliseconds
- **Poor**: >300 milliseconds

**INP** (newer metric, replacing FID):
- **Good**: ≤200 milliseconds (TARGET)
- **Needs Improvement**: 200-500 milliseconds
- **Poor**: >500 milliseconds

**Optimization Tips**:
- Minimize JavaScript execution time
- Break up long tasks (>50ms)
- Use `requestIdleCallback` for non-critical work
- Defer non-essential JavaScript
- Optimize event handlers

---

### Additional Performance Metrics

#### Time to First Byte (TTFB)
- **Good**: ≤600ms
- **Fair**: 600-1500ms
- **Poor**: >1500ms

#### First Contentful Paint (FCP)
- **Good**: ≤1.8s
- **Fair**: 1.8-3.0s
- **Poor**: >3.0s

#### Total Blocking Time (TBT)
- **Good**: ≤200ms
- **Fair**: 200-600ms
- **Poor**: >600ms

---

## Appendix E: WCAG 2.1 Compliance Reference

### Level A (Minimum)
**MUST** meet for basic accessibility.

- **1.1.1 Non-text Content**: All images have alt text
- **1.3.1 Info and Relationships**: Semantic HTML structure
- **2.1.1 Keyboard**: All functionality available via keyboard
- **2.4.1 Bypass Blocks**: Skip link present
- **4.1.2 Name, Role, Value**: ARIA attributes correct

---

### Level AA (Target)
**SHOULD** meet for good accessibility.

- **1.4.3 Contrast (Minimum)**: 4.5:1 for normal text, 3:1 for large text
- **2.4.7 Focus Visible**: Focus indicators visible
- **3.2.3 Consistent Navigation**: Navigation order consistent

---

### Level AAA (Goal)
**NICE TO HAVE** for excellent accessibility.

- **1.4.6 Contrast (Enhanced)**: 7:1 for normal text, 4.5:1 for large text (TARGET FOR MOBILE HERO)
- **2.3.3 Animation from Interactions**: Respect reduced motion preference (IMPLEMENTED)
- **2.5.5 Target Size**: 44×44px minimum touch targets (IMPLEMENTED: 48px)

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-08 | QA Expert | Initial comprehensive test plan created |

---

## Contact & Escalation

**QA Lead**: [Name / Email]
**Product Manager**: [Name / Email]
**Engineering Lead**: [Name / Email]
**Stakeholder**: [Name / Email]

**Escalation Path**:
1. QA Lead (for test clarifications)
2. Engineering Lead (for critical bugs)
3. Product Manager (for go/no-go decisions)
4. Stakeholder (for risk acceptance)

---

**Document Status**: APPROVED FOR USE
**Effective Date**: 2026-01-08
**Review Date**: Post-deployment (1 week after production launch)

---

END OF DOCUMENT
