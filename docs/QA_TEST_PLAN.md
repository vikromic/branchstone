# QA Test Plan: Ukrainian Gallery Filter Fix & Light Theme Update

**Version:** 1.0
**Date:** 2026-01-11
**Status:** Ready for Execution
**Environment:** /Users/vik/Workspace/branchstone/docs

---

## Executive Summary

This test plan covers quality assurance for two recent changes:
1. **Gallery Filter Fix (Ukrainian):** Collection filter buttons now correctly filter artworks instead of highlighting all buttons when Ukrainian locale is active
2. **Light Theme Update:** Background color changed from `#FAF9F7` to `#F5F3F0` (slightly darker) for improved visual hierarchy

---

## 1. Test Environment Setup

### Local Testing Environment
```bash
cd /Users/vik/Workspace/branchstone/docs
python3 -m http.server 8000
# Navigate to: http://localhost:8000/gallery.html
```

### Browser/Device Testing Matrix

| Browser         | Version(s)     | Desktop | Mobile  | Priority |
|-----------------|----------------|---------|---------|----------|
| Chrome          | Latest, -1     | ✓       | ✓       | P0       |
| Safari          | Latest         | ✓       | ✓       | P0       |
| Firefox         | Latest         | ✓       | ✓       | P1       |
| Edge            | Latest         | ✓       | -       | P1       |
| Safari (iOS)    | Latest, -1     | -       | ✓       | P0       |
| Chrome (Android)| Latest         | -       | ✓       | P1       |

**Priority Levels:**
- P0 (Critical): Must pass before release
- P1 (Important): Should pass before release
- P2 (Nice to have): Can be addressed post-release

### Viewport Testing Matrix

| Viewport Type   | Width (px)  | Height (px) | Device Examples        |
|-----------------|-------------|-------------|------------------------|
| Mobile Portrait | 375         | 667         | iPhone SE              |
| Mobile Portrait | 390         | 844         | iPhone 12/13/14 Pro    |
| Mobile Portrait | 414         | 896         | iPhone 11 Pro Max      |
| Mobile Landscape| 667         | 375         | iPhone SE (rotated)    |
| Tablet Portrait | 768         | 1024        | iPad Mini              |
| Tablet Landscape| 1024        | 768         | iPad (rotated)         |
| Desktop Small   | 1280        | 720         | Small laptop           |
| Desktop Medium  | 1440        | 900         | Standard desktop       |
| Desktop Large   | 1920        | 1080        | Large monitor          |

---

## 2. Feature 1: Ukrainian Gallery Filter Fix

### 2.1 Background & Technical Context

**Issue Fixed:** When Ukrainian locale was active, clicking collection filter buttons highlighted all buttons instead of filtering artwork display.

**Root Cause:** The filter system uses slugs (e.g., `ofAshAndFlowers`) for filtering, but Ukrainian collection names (e.g., "Про Попіл і Квіти") were not being mapped to their canonical English slugs.

**Solution:** Added `getCanonicalCollectionSlug()` method to map translated collection names to their canonical slugs.

**Files Changed:**
- `docs/js/gallery-data.js` (lines 171-242)
- `docs/js/main.js` (lines 485-629)

**Collections to Test:**
1. Deep Ocean / Глибокий океан → `deepOcean`
2. Golden / Золотаво → `golden`
3. Of Ash and Flowers / Про Попіл і Квіти → `ofAshAndFlowers`
4. Storms / Бурі → `storms`
5. Calm of the Forest / Тиша лісу → `calmOfTheForest`
6. Following Her Steps / Слідуючи її крокам → `followingHerSteps`

### 2.2 Test Cases - Gallery Filtering (English Locale)

#### TC-F1-EN-001: "All" Filter - Desktop
**Priority:** P0
**Preconditions:** Gallery page loaded in English, browser width ≥768px
**Steps:**
1. Navigate to `http://localhost:8000/gallery.html`
2. Observe initial state (should show all artworks)
3. Click any collection filter button
4. Click "All" button
**Expected Results:**
- All artwork cards visible
- "All" button has `is-active` class
- Other filter buttons do not have `is-active` class
- Gallery header shows "The Works"
- URL: `gallery.html` (no collection parameter)
**Actual Results:** _[To be filled during testing]_
**Status:** _[Pass/Fail/Blocked]_

#### TC-F1-EN-002: Collection Filter - Desktop (All Collections)
**Priority:** P0
**Preconditions:** Gallery page loaded in English, browser width ≥768px
**Test Data:** Each collection in the collections list
**Steps:**
1. Click "Deep Ocean" filter button
2. Verify only Deep Ocean artworks are visible
3. Verify button states and URL
4. Repeat for each collection: Golden, Of Ash and Flowers, Storms, Calm of the Forest, Following Her Steps
**Expected Results for Each Collection:**
- Only artworks from selected collection are visible
- Selected collection button has `is-active` class and `aria-pressed="true"`
- Other collection buttons have `aria-pressed="false"`
- Gallery header shows collection name
- URL contains `?collection=[collection-name]`
- Smooth fade-in/fade-out animation (unless prefers-reduced-motion)
**Actual Results:** _[To be filled during testing]_
**Status:** _[Pass/Fail/Blocked]_

#### TC-F1-EN-003: Collection Filter - Mobile
**Priority:** P0
**Preconditions:** Gallery page loaded in English, browser width <768px
**Steps:**
1. Resize browser to 375px width
2. Tap "Filters" button
3. Verify mobile filter dropdown opens
4. Tap "Deep Ocean" chip
5. Verify dropdown closes automatically after 300ms
6. Verify only Deep Ocean artworks visible
7. Repeat for other collections
**Expected Results:**
- Mobile filter dropdown opens with backdrop
- Selected chip has `mobile-filter-chip--active` class
- Desktop filters sync with mobile selection
- Filter count badge shows "1" with collection name
- Artworks filtered correctly
**Actual Results:** _[To be filled during testing]_
**Status:** _[Pass/Fail/Blocked]_

#### TC-F1-EN-004: Rapid Filter Clicking
**Priority:** P1
**Preconditions:** Gallery page loaded, any viewport
**Steps:**
1. Rapidly click different collection filter buttons (5-10 clicks within 2 seconds)
2. Wait for animations to complete
3. Observe final state
**Expected Results:**
- No JavaScript errors in console
- Only artworks from the last clicked collection are visible
- Only the last clicked button is highlighted
- No stuck animations or visual glitches
- Gallery state is stable
**Actual Results:** _[To be filled during testing]_
**Status:** _[Pass/Fail/Blocked]_

### 2.3 Test Cases - Gallery Filtering (Ukrainian Locale)

#### TC-F1-UK-001: Language Switch to Ukrainian
**Priority:** P0
**Preconditions:** Gallery page loaded in English
**Steps:**
1. Navigate to `http://localhost:8000/gallery.html`
2. Click language switcher button (EN → UA)
3. Wait for page reload
4. Observe gallery state
**Expected Results:**
- Page reloads with `?lang=uk` in URL
- HTML `lang` attribute set to "uk"
- Filter buttons show Ukrainian collection names
- Gallery title/subtitle translated to Ukrainian
- All artworks visible (default "All" filter)
- "Всі" (All) button is active
**Actual Results:** _[To be filled during testing]_
**Status:** _[Pass/Fail/Blocked]_

#### TC-F1-UK-002: Ukrainian Collection Filter - "Глибокий океан" (Deep Ocean)
**Priority:** P0 (CRITICAL FIX VALIDATION)
**Preconditions:** Gallery page loaded in Ukrainian (`?lang=uk`)
**Steps:**
1. Navigate to `http://localhost:8000/gallery.html?lang=uk`
2. Click "Глибокий океан" filter button
3. Observe artwork visibility
4. Observe button states
5. Check URL parameter
**Expected Results:**
- ✓ Only Deep Ocean artworks are visible
- ✓ "Глибокий океан" button has `is-active` class
- ✓ Other collection buttons do NOT have `is-active` class (BUG FIX VERIFICATION)
- ✓ URL contains `?lang=uk&collection=Deep+Ocean` or similar
- ✓ Gallery header shows "Глибокий океан"
- ✓ No console errors
**Actual Results:** _[To be filled during testing]_
**Status:** _[Pass/Fail/Blocked]_

#### TC-F1-UK-003: All Ukrainian Collections Filter Test
**Priority:** P0 (CRITICAL FIX VALIDATION)
**Preconditions:** Gallery page loaded in Ukrainian (`?lang=uk`)
**Test Data:**
- Глибокий океан (Deep Ocean) → deepOcean
- Золотаво (Golden) → golden
- Про Попіл і Квіти (Of Ash and Flowers) → ofAshAndFlowers
- Бурі (Storms) → storms
- Тиша лісу (Calm of the Forest) → calmOfTheForest
- Слідуючи її крокам (Following Her Steps) → followingHerSteps

**Steps:**
1. For each Ukrainian collection name:
   - Click the collection filter button
   - Verify only that collection's artworks are visible
   - Verify ONLY that button is highlighted (not all buttons)
   - Verify URL parameter matches collection
   - Click "Всі" to reset
2. Document any failures

**Expected Results for Each Collection:**
- ✓ Correct artworks displayed
- ✓ ONLY selected button highlighted (PRIMARY BUG FIX)
- ✓ Desktop and mobile filters stay in sync
- ✓ URL correctly updated
- ✓ Smooth animations
**Actual Results:** _[To be filled during testing]_
**Status:** _[Pass/Fail/Blocked]_

#### TC-F1-UK-004: Switch Language While Filtered
**Priority:** P1
**Preconditions:** Gallery page in English with a collection filter active
**Steps:**
1. Navigate to `http://localhost:8000/gallery.html`
2. Click "Deep Ocean" filter (English)
3. Verify Deep Ocean artworks visible
4. Click language switcher to Ukrainian
5. Wait for page reload
6. Observe state after reload
**Expected Results:**
- Page reloads with Ukrainian locale
- Same collection remains filtered (Deep Ocean artworks visible)
- Ukrainian collection name shown in header ("Глибокий океан")
- Corresponding Ukrainian filter button is active
- No loss of filter state during language switch
**Actual Results:** _[To be filled during testing]_
**Status:** _[Pass/Fail/Blocked]_

#### TC-F1-UK-005: Mobile Filter Dropdown - Ukrainian
**Priority:** P0
**Preconditions:** Gallery page loaded in Ukrainian, mobile viewport (<768px)
**Steps:**
1. Navigate to `http://localhost:8000/gallery.html?lang=uk` on mobile
2. Tap "Фільтри" button
3. Verify Ukrainian collection names in dropdown
4. Tap "Бурі" (Storms)
5. Verify dropdown closes
6. Verify filter applied correctly
**Expected Results:**
- Mobile dropdown shows Ukrainian collection names
- Tapping Ukrainian collection name filters correctly
- Count badge shows "1" with "Бурі"
- Desktop filters sync correctly
- Artworks from "Storms" collection visible
**Actual Results:** _[To be filled during testing]_
**Status:** _[Pass/Fail/Blocked]_

### 2.4 Edge Cases & Error Handling

#### TC-F1-EDGE-001: Invalid Collection in URL
**Priority:** P2
**Steps:**
1. Navigate to `http://localhost:8000/gallery.html?collection=InvalidName`
2. Observe behavior
**Expected Results:**
- Gallery shows all artworks (falls back to "All")
- "All" button is active
- No JavaScript errors
- URL cleaned up or ignored
**Actual Results:** _[To be filled during testing]_
**Status:** _[Pass/Fail/Blocked]_

#### TC-F1-EDGE-002: Special Characters in Collection Name
**Priority:** P2
**Preconditions:** Ukrainian locale active
**Steps:**
1. Navigate to `http://localhost:8000/gallery.html?lang=uk`
2. Click "Про Попіл і Квіти" (contains spaces, Cyrillic, special chars)
3. Observe URL encoding and filter behavior
**Expected Results:**
- Collection filters correctly despite special characters
- URL properly encodes collection name
- No encoding/decoding errors
- Filter state persists on page reload
**Actual Results:** _[To be filled during testing]_
**Status:** _[Pass/Fail/Blocked]_

#### TC-F1-EDGE-003: Browser Back/Forward Navigation
**Priority:** P1
**Steps:**
1. Navigate to gallery.html
2. Click "Deep Ocean" filter
3. Click "Golden" filter
4. Click browser back button
5. Click browser forward button
6. Observe state restoration
**Expected Results:**
- Back button restores "Deep Ocean" filter state
- Forward button restores "Golden" filter state
- Artworks update correctly with navigation
- Button states update correctly
**Actual Results:** _[To be filled during testing]_
**Status:** _[Pass/Fail/Blocked]_

### 2.5 Accessibility Testing

#### TC-F1-A11Y-001: Keyboard Navigation - Filter Buttons
**Priority:** P0
**Steps:**
1. Navigate to gallery.html
2. Press Tab until focus reaches first filter button
3. Press Tab through all filter buttons
4. Press Enter on "Deep Ocean" button
5. Verify filter applied
6. Press Tab to next filter button
7. Press Space to activate
**Expected Results:**
- All filter buttons are keyboard focusable
- Visible focus indicator on focused button
- Enter and Space keys activate filter
- `aria-pressed` attribute updates correctly
- Screen reader announces button state changes
**Actual Results:** _[To be filled during testing]_
**Status:** _[Pass/Fail/Blocked]_

#### TC-F1-A11Y-002: Screen Reader - Filter State
**Priority:** P1
**Tools:** VoiceOver (Mac), NVDA (Windows), or JAWS
**Steps:**
1. Enable screen reader
2. Navigate to gallery filter buttons
3. Listen to button announcements
4. Activate "Deep Ocean" filter
5. Listen to state change announcement
**Expected Results:**
- Buttons announced as "button, [Collection Name]"
- Active button announced as "pressed" or "selected"
- Filter count badge announced correctly
- Collection description announced (mobile)
**Actual Results:** _[To be filled during testing]_
**Status:** _[Pass/Fail/Blocked]_

#### TC-F1-A11Y-003: Reduced Motion - Filter Animations
**Priority:** P1
**Preconditions:** OS setting "Reduce motion" enabled
**Steps:**
1. Enable "Reduce Motion" in OS accessibility settings
2. Navigate to gallery.html
3. Click collection filter buttons
4. Observe artwork transitions
**Expected Results:**
- No fade-in/fade-out animations
- Immediate show/hide of artworks
- No transform animations
- Filter still functions correctly
**Actual Results:** _[To be filled during testing]_
**Status:** _[Pass/Fail/Blocked]_

---

## 3. Feature 2: Light Theme Background Update

### 3.1 Background & Technical Context

**Change:** Light theme background color updated from `#FAF9F7` to `#F5F3F0` (approximately 3% darker).

**Rationale:** Improved visual hierarchy and reduced eye strain with slightly darker warm background.

**Files Changed:**
- `docs/css/tokens.css` (lines 20-23)
- `docs/site.webmanifest` (theme_color updated)
- `docs/favicon.svg` (background updated to match)

**Color Specifications:**
- Old: `#FAF9F7` (RGB: 250, 249, 247)
- New: `#F5F3F0` (RGB: 245, 243, 240)
- Secondary: `#F0EDE9` (RGB: 240, 237, 233) - also updated

### 3.2 Test Cases - Visual Verification (Light Theme)

#### TC-T1-VIS-001: Background Color - Desktop Light Theme
**Priority:** P0
**Preconditions:** Light theme active (default)
**Steps:**
1. Navigate to `http://localhost:8000/index.html`
2. Verify page is in light theme (check data-theme attribute)
3. Visually inspect main background color
4. Use browser DevTools to inspect `--bg-primary` CSS variable
5. Repeat for gallery.html, about.html, contact.html, commissions.html
**Expected Results:**
- `<body>` has `data-theme="light"`
- `:root` CSS variable `--bg-primary` = `#F5F3F0`
- Background appears slightly darker than previous version
- Warm off-white tone preserved
- All pages use consistent background color
**Actual Results:** _[To be filled during testing]_
**Status:** _[Pass/Fail/Blocked]_

#### TC-T1-VIS-002: Secondary Background Color
**Priority:** P0
**Steps:**
1. Navigate to pages with secondary backgrounds (sections with bg-secondary)
2. Inspect elements using `--bg-secondary` variable
3. Verify color is `#F0EDE9`
**Expected Results:**
- Secondary background color updated to `#F0EDE9`
- Subtle contrast maintained between primary and secondary backgrounds
- Hierarchy clear and intentional
**Actual Results:** _[To be filled during testing]_
**Status:** _[Pass/Fail/Blocked]_

#### TC-T1-VIS-003: Text Contrast - WCAG Compliance
**Priority:** P0 (ACCESSIBILITY)
**Tools:** Browser DevTools Contrast Checker or WebAIM Contrast Checker
**Steps:**
1. Navigate to gallery.html in light theme
2. Check contrast ratio for primary text (`--text-primary: #1A1816`) on new background (`#F5F3F0`)
3. Check contrast ratio for secondary text (`--text-secondary: #4A4745`) on new background
4. Check contrast ratio for tertiary text (`--text-tertiary: #6B6662`) on new background
**Expected Results:**
- Primary text contrast: ≥4.5:1 (WCAG AA normal text)
- Secondary text contrast: ≥4.5:1 (WCAG AA normal text)
- Tertiary text contrast: ≥4.5:1 (WCAG AA normal text)
- All text remains readable
**Actual Results:** _[To be filled during testing]_
**Contrast Ratios:** _[Record actual values]_
**Status:** _[Pass/Fail/Blocked]_

#### TC-T1-VIS-004: Card Elevation & Shadows
**Priority:** P1
**Steps:**
1. Navigate to gallery.html
2. Observe artwork card shadows against new background
3. Hover over artwork cards
4. Verify shadow visibility and depth
**Expected Results:**
- Card shadows remain visible against darker background
- Shadow opacity provides clear elevation cues
- Hover shadows enhance depth perception
- No loss of visual hierarchy
**Actual Results:** _[To be filled during testing]_
**Status:** _[Pass/Fail/Blocked]_

#### TC-T1-VIS-005: Border Visibility
**Priority:** P1
**Steps:**
1. Navigate to pages with borders (inputs, buttons, cards)
2. Inspect border colors against new background
3. Verify `--border-subtle`, `--border-default`, `--border-strong` values
**Expected Results:**
- Subtle borders still visible but not harsh
- Default borders provide clear delineation
- Strong borders emphasize important boundaries
- Border hierarchy maintained
**Actual Results:** _[To be filled during testing]_
**Status:** _[Pass/Fail/Blocked]_

### 3.3 Test Cases - Theme Toggle

#### TC-T2-TOG-001: Light to Dark Theme Toggle
**Priority:** P0
**Steps:**
1. Navigate to any page in light theme
2. Click theme toggle button (sun/moon icon)
3. Observe transition to dark theme
4. Verify background color changes
5. Toggle back to light theme
**Expected Results:**
- Light theme background: `#F5F3F0`
- Dark theme background: `#141210`
- Smooth transition between themes (unless reduced motion)
- Theme preference saved to localStorage
- Theme persists on page navigation
**Actual Results:** _[To be filled during testing]_
**Status:** _[Pass/Fail/Blocked]_

#### TC-T2-TOG-002: Theme Persistence
**Priority:** P0
**Steps:**
1. Navigate to index.html in light theme
2. Toggle to dark theme
3. Navigate to gallery.html
4. Observe theme state
5. Refresh page
6. Observe theme state
**Expected Results:**
- Dark theme persists across page navigation
- Dark theme persists after page refresh
- localStorage key `branchstone.theme` = "dark"
**Actual Results:** _[To be filled during testing]_
**Status:** _[Pass/Fail/Blocked]_

#### TC-T2-TOG-003: System Preference (prefers-color-scheme)
**Priority:** P1
**Preconditions:** User has no manual theme preference set
**Steps:**
1. Clear localStorage (`branchstone.theme`)
2. Set OS to light mode
3. Navigate to gallery.html
4. Observe initial theme
5. Change OS to dark mode
6. Refresh page
7. Observe theme
**Expected Results:**
- Page respects OS preference when no manual preference exists
- Light mode matches OS light mode
- Dark mode matches OS dark mode
- Theme updates when OS preference changes
**Actual Results:** _[To be filled during testing]_
**Status:** _[Pass/Fail/Blocked]_

### 3.4 Test Cases - PWA Manifest & Favicon

#### TC-T3-PWA-001: Manifest Theme Color
**Priority:** P2
**Steps:**
1. Open browser DevTools
2. Navigate to Application → Manifest (Chrome) or Storage → Manifest (Firefox)
3. Inspect `theme_color` value
**Expected Results:**
- Manifest `theme_color` = `#F5F3F0`
- Matches updated light theme background
**Actual Results:** _[To be filled during testing]_
**Status:** _[Pass/Fail/Blocked]_

#### TC-T3-PWA-002: Favicon Background Color
**Priority:** P2
**Steps:**
1. Navigate to any page
2. Inspect favicon in browser tab
3. Right-click favicon → Open Image in New Tab
4. Inspect SVG source
**Expected Results:**
- Favicon SVG background uses `#F5F3F0`
- Favicon visually consistent with theme
**Actual Results:** _[To be filled during testing]_
**Status:** _[Pass/Fail/Blocked]_

---

## 4. Cross-Feature Integration Tests

### 4.1 Combined Testing

#### TC-INT-001: Filter + Theme Toggle
**Priority:** P1
**Steps:**
1. Navigate to gallery.html
2. Apply "Deep Ocean" filter
3. Toggle to dark theme
4. Verify filter state preserved
5. Toggle back to light theme
6. Verify filter state still preserved
**Expected Results:**
- Filter state independent of theme
- No visual glitches during theme change
- Filtered artworks remain filtered
- Button states consistent
**Actual Results:** _[To be filled during testing]_
**Status:** _[Pass/Fail/Blocked]_

#### TC-INT-002: Filter + Language + Theme
**Priority:** P1
**Steps:**
1. Navigate to gallery.html
2. Switch to Ukrainian
3. Apply "Бурі" filter
4. Toggle to dark theme
5. Verify all states preserved
**Expected Results:**
- Ukrainian locale maintained
- Filter state maintained
- Dark theme applied correctly
- No state loss or visual issues
**Actual Results:** _[To be filled during testing]_
**Status:** _[Pass/Fail/Blocked]_

#### TC-INT-003: Mobile Filter + Theme + Orientation
**Priority:** P2
**Steps:**
1. Open gallery.html on mobile device (or mobile viewport)
2. Switch to Ukrainian
3. Open mobile filter dropdown
4. Apply filter
5. Toggle theme
6. Rotate device to landscape
7. Rotate back to portrait
**Expected Results:**
- All states persist through all changes
- UI adapts correctly to orientation
- No layout breaks
- Filter dropdown closes/opens correctly
**Actual Results:** _[To be filled during testing]_
**Status:** _[Pass/Fail/Blocked]_

---

## 5. Performance Testing

### 5.1 Filter Animation Performance

#### TC-PERF-001: Large Gallery Filter Performance
**Priority:** P1
**Preconditions:** Gallery with 20+ artworks loaded
**Steps:**
1. Open browser DevTools Performance tab
2. Start recording
3. Click collection filter button
4. Wait for animation to complete
5. Stop recording
6. Analyze performance metrics
**Expected Results:**
- Frame rate: ≥30 FPS during animation
- No long tasks (>50ms)
- Total animation duration: <1000ms
- No memory leaks after multiple filter changes
**Actual Results:** _[To be filled during testing]_
**Metrics:** _[Record FPS, duration, long tasks]_
**Status:** _[Pass/Fail/Blocked]_

#### TC-PERF-002: Theme Toggle Performance
**Priority:** P2
**Steps:**
1. Open browser DevTools Performance tab
2. Record theme toggle action
3. Analyze CSS variable updates and repaints
**Expected Results:**
- Theme toggle completes in <200ms
- Single layout recalculation
- Minimal repaints
- No jank or visual glitches
**Actual Results:** _[To be filled during testing]_
**Status:** _[Pass/Fail/Blocked]_

---

## 6. Regression Testing Checklist

### 6.1 Gallery Features (Unrelated to Filter Fix)

- [ ] Artwork cards display correctly (image, title, collection, price)
- [ ] Artwork modal opens on card click
- [ ] Carousel navigation works (if multiple images)
- [ ] Favorite button toggles correctly
- [ ] Inquire button navigates to contact page
- [ ] Sold badge displays on sold artworks
- [ ] Collector's choice badge displays on highlighted artworks
- [ ] Lazy loading works for images
- [ ] Back to top button appears/disappears on scroll
- [ ] Mobile filter dropdown opens/closes correctly
- [ ] Desktop filter buttons styled correctly

### 6.2 Theme Features (Unrelated to Background Color)

- [ ] Dark theme applies correctly to all elements
- [ ] Accent colors correct in both themes
- [ ] Typography readable in both themes
- [ ] Form inputs styled correctly in both themes
- [ ] Buttons styled correctly in both themes
- [ ] Hover states work in both themes
- [ ] Focus indicators visible in both themes

### 6.3 Language Switching (Unrelated to Filter)

- [ ] Navigation links translate correctly
- [ ] Page headings translate correctly
- [ ] Form labels translate correctly
- [ ] Button labels translate correctly
- [ ] Artwork titles translate (if Ukrainian artworks.json exists)
- [ ] URL parameter `?lang=uk` persists on navigation
- [ ] localStorage saves language preference

---

## 7. Security & Data Integrity

### 7.1 Security Checks

#### TC-SEC-001: XSS Prevention in Collection Names
**Priority:** P1
**Steps:**
1. Attempt to inject `<script>alert('XSS')</script>` via URL parameter: `?collection=<script>alert('XSS')</script>`
2. Observe behavior
**Expected Results:**
- Script does not execute
- Collection name sanitized
- Fallback to "All" filter
- No console errors
**Actual Results:** _[To be filled during testing]_
**Status:** _[Pass/Fail/Blocked]_

#### TC-SEC-002: SQL Injection Attempt (N/A for Static Site)
**Priority:** P2
**Note:** Site is static, no database. This test is informational only.
**Status:** N/A (Static site)

### 7.2 Data Integrity

#### TC-DATA-001: Filter State Persistence
**Priority:** P1
**Steps:**
1. Apply "Deep Ocean" filter
2. Check localStorage for `branchstone.gallery.selectedCollection`
3. Refresh page
4. Verify filter state restored
**Expected Results:**
- localStorage contains correct collection name
- Filter state restored on refresh
- Artworks filtered correctly after reload
**Actual Results:** _[To be filled during testing]_
**Status:** _[Pass/Fail/Blocked]_

#### TC-DATA-002: URL Parameter Integrity
**Priority:** P1
**Steps:**
1. Apply filter
2. Copy URL
3. Open URL in new tab/incognito window
4. Verify filter applied
**Expected Results:**
- URL correctly encodes collection name
- Opening URL directly applies correct filter
- Deep linking works for sharing
**Actual Results:** _[To be filled during testing]_
**Status:** _[Pass/Fail/Blocked]_

---

## 8. Defect Reporting Template

When defects are found, use this template:

```markdown
### Defect ID: [DEF-001]
**Severity:** [Critical/High/Medium/Low]
**Priority:** [P0/P1/P2]
**Test Case:** [TC-XX-XXX]
**Browser:** [Browser name + version]
**Viewport:** [Desktop/Mobile, dimensions]
**Locale:** [en/uk]
**Theme:** [Light/Dark]

**Summary:** [One-line description]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happened]

**Screenshots/Video:**
[Attach if applicable]

**Console Errors:**
[Paste any console errors]

**Additional Notes:**
[Any other relevant information]
```

---

## 9. Test Execution Schedule

### Phase 1: Critical Path (P0 Tests) - Day 1
- Ukrainian filter fix validation (TC-F1-UK-002, TC-F1-UK-003)
- English filter regression (TC-F1-EN-001, TC-F1-EN-002)
- Light theme background verification (TC-T1-VIS-001, TC-T1-VIS-003)
- Theme toggle basic functionality (TC-T2-TOG-001)

### Phase 2: Important Tests (P1 Tests) - Day 2
- Mobile filter testing (TC-F1-EN-003, TC-F1-UK-005)
- Edge cases (TC-F1-EDGE-001 through TC-F1-EDGE-003)
- Accessibility keyboard navigation (TC-F1-A11Y-001)
- Visual contrast and borders (TC-T1-VIS-004, TC-T1-VIS-005)
- Integration tests (TC-INT-001, TC-INT-002)

### Phase 3: Nice-to-Have (P2 Tests) - Day 3
- PWA manifest/favicon (TC-T3-PWA-001, TC-T3-PWA-002)
- Security checks (TC-SEC-001)
- Performance testing (TC-PERF-001, TC-PERF-002)
- Remaining edge cases and regression tests

---

## 10. Risk Assessment

### High Risk Areas
1. **Ukrainian Collection Name Mapping:** Core functionality of the fix. Must work flawlessly.
   - **Mitigation:** Extensive testing of all 6 collections in both locales
2. **Filter State Persistence:** User expects filter to persist on language switch/refresh
   - **Mitigation:** Test URL parameters, localStorage, and state restoration
3. **Text Contrast (WCAG):** Darker background may affect readability
   - **Mitigation:** Measure all contrast ratios, ensure WCAG AA compliance

### Medium Risk Areas
1. **Mobile Filter Sync:** Desktop and mobile filters must stay in sync
   - **Mitigation:** Test synchronization after every filter change
2. **Theme Toggle Performance:** CSS variable updates must be smooth
   - **Mitigation:** Performance profiling, test on older devices
3. **Browser Compatibility:** Older browsers may not support all features
   - **Mitigation:** Test on browser matrix, graceful degradation

### Low Risk Areas
1. **PWA Manifest:** Theme color update is cosmetic
2. **Favicon:** Background color update is cosmetic
3. **Special Characters:** URL encoding well-established

---

## 11. Success Criteria

### Must Have (Release Blocker)
- [ ] All P0 tests pass on Chrome, Safari, Firefox (latest)
- [ ] Ukrainian filter fix confirmed working for all 6 collections
- [ ] No regression in English locale filtering
- [ ] WCAG AA contrast ratios maintained
- [ ] Mobile filter dropdown works in both locales
- [ ] Theme toggle works correctly
- [ ] No console errors or JavaScript exceptions

### Should Have (Recommended Before Release)
- [ ] All P1 tests pass
- [ ] Keyboard navigation works for filters
- [ ] Screen reader compatibility verified
- [ ] Performance metrics acceptable (≥30 FPS)
- [ ] Edge cases handled gracefully

### Nice to Have (Can Address Post-Release)
- [ ] All P2 tests pass
- [ ] PWA manifest/favicon updated
- [ ] All browsers in matrix tested

---

## 12. Test Execution Tracking

| Test Case ID    | Status | Tester | Date | Notes |
|-----------------|--------|--------|------|-------|
| TC-F1-EN-001    |        |        |      |       |
| TC-F1-EN-002    |        |        |      |       |
| TC-F1-EN-003    |        |        |      |       |
| TC-F1-UK-001    |        |        |      |       |
| TC-F1-UK-002    |        |        |      |       |
| TC-F1-UK-003    |        |        |      |       |
| TC-T1-VIS-001   |        |        |      |       |
| TC-T1-VIS-003   |        |        |      |       |
| TC-T2-TOG-001   |        |        |      |       |
| ...             |        |        |      |       |

---

## 13. Post-Testing Recommendations

After test execution, provide recommendations for:
1. **Code quality improvements:** Any technical debt or refactoring opportunities
2. **Documentation updates:** Update user-facing docs if behavior changed
3. **Monitoring:** Identify metrics to track in production (e.g., filter usage, theme preference distribution)
4. **Future enhancements:** Suggestions for improving filter UX or theme system

---

## Appendix A: Known Issues (Pre-Testing)

_[Document any known issues before testing begins]_

None documented at this time.

---

## Appendix B: Testing Tools

### Recommended Tools
- **Browser DevTools:** Chrome/Firefox/Safari built-in developer tools
- **Contrast Checker:** WebAIM Contrast Checker (https://webaim.org/resources/contrastchecker/)
- **Screen Readers:**
  - VoiceOver (macOS/iOS) - Built-in
  - NVDA (Windows) - Free download
  - JAWS (Windows) - Commercial
- **Performance:**
  - Lighthouse (Chrome DevTools)
  - WebPageTest (https://www.webpagetest.org/)
- **Viewport Testing:**
  - Browser DevTools responsive mode
  - BrowserStack or LambdaTest (for real device testing)

### Setup Commands
```bash
# Start local server
cd /Users/vik/Workspace/branchstone/docs
python3 -m http.server 8000

# Open in browser
# Chrome: http://localhost:8000/gallery.html
# Safari: http://localhost:8000/gallery.html
# Firefox: http://localhost:8000/gallery.html

# Clear localStorage (Chrome DevTools Console)
localStorage.clear()

# Check current theme
document.body.getAttribute('data-theme')

# Check current language
document.documentElement.getAttribute('lang')

# Get current filter state
localStorage.getItem('branchstone.gallery.selectedCollection')
```

---

**Test Plan Prepared By:** QA Expert Agent
**Review Status:** Pending
**Approval:** Pending
**Version History:**
- v1.0 (2026-01-11): Initial test plan creation
