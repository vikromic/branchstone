# Branchstone Test Suite

Comprehensive automated testing infrastructure for Branchstone Art Portfolio.

## Directory Structure

```
tests/
├── README.md                     # This file
├── setup.js                      # Test environment setup
├── vitest.config.js             # Vitest configuration
├── playwright.config.js         # Playwright configuration
├── mocks/
│   ├── handlers.js              # MSW request handlers
│   ├── server.js                # MSW server (Node/Vitest)
│   └── browser.js               # MSW browser setup
├── unit/
│   ├── components/
│   │   ├── FormValidator.test.js
│   │   ├── Gallery.test.js
│   │   ├── Theme.test.js
│   │   ├── Menu.test.js
│   │   ├── Lightbox.test.js
│   │   ├── Carousel.test.js
│   │   ├── GalleryFilter.test.js
│   │   └── Animations.test.js
│   ├── services/
│   │   └── api.test.js
│   └── utils/
│       ├── dom.test.js
│       └── storage.test.js
├── integration/
│   ├── app-bootstrap.test.js
│   ├── gallery-lightbox.test.js
│   ├── contact-form.test.js
│   └── theme-i18n.test.js
├── e2e/
│   ├── gallery-browsing.spec.js
│   ├── contact-form.spec.js
│   ├── theme-language.spec.js
│   └── mobile-menu.spec.js
├── accessibility/
│   ├── a11y.test.js
│   └── wcag-compliance.test.js
├── visual/
│   ├── visual-regression.spec.js
│   └── __snapshots__/
├── performance/
│   └── lighthouse.config.js
└── .e2erc
```

## Quick Start

### 1. Install Dependencies

```bash
npm install --save-dev \
  vitest \
  @vitest/ui \
  @vitest/coverage-v8 \
  @playwright/test \
  msw \
  @percy/playwright \
  axe-playwright \
  @axe-core/playwright \
  lighthouse \
  @lhci/cli@*
```

### 2. Run Tests Locally

```bash
# Unit tests (fast)
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests (full browser automation)
npm run test:e2e

# All tests
npm run test

# Watch mode (useful during development)
npm run test:watch

# Coverage report
npm run test:coverage

# Visual regression
npm run test:visual

# Accessibility audit
npm run test:a11y
```

### 3. View Test Results

```bash
# HTML coverage report
open coverage/index.html

# Vitest UI (live dashboard)
npm run test:ui

# Playwright UI (step through tests)
npm run test:e2e:ui
```

---

## Test Categories

### Unit Tests (✓ Fast)
**Purpose**: Test pure functions and isolated component logic
**Framework**: Vitest
**Location**: `tests/unit/`
**Target**: 100% coverage for utilities, services
**Execution**: < 5 seconds

**Files**:
- `utils/dom.test.js` - DOM manipulation utilities
- `utils/storage.test.js` - localStorage wrapper
- `services/api.test.js` - API service with MSW mocking
- `components/*.test.js` - Component logic (non-DOM)

**Example Run**:
```bash
npm run test:unit
# ✓ tests/unit/utils/dom.test.js (15 tests)
# ✓ tests/unit/utils/storage.test.js (12 tests)
# ✓ tests/unit/services/api.test.js (20 tests)
# ... Total: 50+ tests, 100% coverage
```

### Integration Tests (✓ Medium Speed)
**Purpose**: Test component interactions and workflows
**Framework**: Vitest with jsdom
**Location**: `tests/integration/`
**Target**: 70%+ coverage for components
**Execution**: 10-15 seconds

**Files**:
- `app-bootstrap.test.js` - App initialization
- `gallery-lightbox.test.js` - Gallery → Lightbox interaction
- `contact-form.test.js` - Form validation → submission
- `theme-i18n.test.js` - Theme + language switching

**Example Run**:
```bash
npm run test:integration
# ✓ tests/integration/app-bootstrap.test.js (8 tests)
# ✓ tests/integration/gallery-lightbox.test.js (12 tests)
# ... Total: 30+ tests, 70%+ coverage
```

### E2E Tests (⚠ Slower)
**Purpose**: Test complete user journeys in real browser
**Framework**: Playwright
**Location**: `tests/e2e/`
**Target**: 100% critical paths
**Execution**: 2-3 minutes

**Files**:
- `gallery-browsing.spec.js` - View artworks, filter, lightbox
- `contact-form.spec.js` - Fill form, validate, submit
- `theme-language.spec.js` - Switch theme, language
- `mobile-menu.spec.js` - Mobile navigation

**Example Run**:
```bash
npm run test:e2e
# ✓ gallery-browsing.spec.js (6 tests)
# ✓ contact-form.spec.js (4 tests)
# ✓ theme-language.spec.js (3 tests)
# ✓ mobile-menu.spec.js (3 tests)
# Total: 16 E2E tests
```

### Accessibility Tests (✓ Important)
**Purpose**: Ensure WCAG 2.1 AA/AAA compliance
**Framework**: Playwright + axe-core + Pa11y
**Location**: `tests/accessibility/`
**Target**: Zero violations
**Execution**: 30-45 seconds

**Validation**:
- Color contrast (WCAG AA minimum)
- ARIA attributes and labels
- Keyboard navigation
- Focus management
- Form field associations
- Semantic HTML

**Example Run**:
```bash
npm run test:a11y
# Scanning home page for accessibility issues...
# ✓ Color contrast: PASS
# ✓ ARIA labels: PASS
# ✓ Keyboard navigation: PASS
# Total violations: 0
```

### Visual Regression Tests (⚠ Manual Review)
**Purpose**: Detect unintended UI changes
**Framework**: Playwright + Percy
**Location**: `tests/visual/`
**Target**: 100% coverage of pages
**Execution**: 1-2 minutes

**Coverage**:
- Home page (desktop, mobile, dark mode)
- Gallery page (with filters)
- Contact form (with validation)
- Lightbox (opened state)

**Example Run**:
```bash
npm run test:visual
# Uploading snapshots to Percy...
# ✓ Home - Desktop
# ✓ Home - Mobile
# ✓ Home - Dark Mode
# Review at: https://percy.io/builds/...
```

### Performance Tests (📊 Metrics)
**Purpose**: Monitor Core Web Vitals and performance budget
**Framework**: Lighthouse CI
**Location**: `lighthouse.config.js`
**Target**: LCP <1.5s, FID <100ms, CLS <0.1
**Execution**: 2-3 minutes per page

**Metrics Tracked**:
- First Contentful Paint (FCP): <1.0s
- Largest Contentful Paint (LCP): <1.5s
- First Input Delay (FID): <100ms
- Cumulative Layout Shift (CLS): <0.1
- Total Blocking Time (TBT): <150ms
- Performance Score: >90

**Example Run**:
```bash
npm run lighthouse
# Testing http://localhost:8000...
# ✓ LCP: 1.2s (target: 1.5s)
# ✓ FID: 45ms (target: 100ms)
# ✓ CLS: 0.08 (target: 0.1)
# Performance Score: 95/100
```

---

## Running Tests

### Local Development

```bash
# Watch mode - rerun tests on file change
npm run test:watch

# Run specific test file
npm run test:unit -- dom.test.js

# Run with coverage
npm run test:coverage

# Run tests matching pattern
npm run test -- --grep "Gallery"

# UI mode - visual dashboard
npm run test:ui
```

### Before Committing

```bash
# Full test suite (unit + integration)
npm test

# Check coverage
npm run test:coverage
```

### CI/CD (GitHub Actions)

Tests run automatically on:
- Every push to main/develop
- Every pull request
- Scheduled nightly runs

View results in GitHub Actions tab.

---

## Mocking Strategy

### API Mocking with MSW (Mock Service Worker)

All tests use MSW for API interception. This provides:
- ✓ No real network calls
- ✓ Consistent test data
- ✓ Easy error simulation
- ✓ Works in unit, integration, and E2E tests

**Setup**:
```javascript
// tests/mocks/handlers.js
export const handlers = [
  http.get('/api/artworks', () => HttpResponse.json(mockArtworks)),
  http.post('/api/contact', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ success: true });
  }),
];

// Use in tests:
import { server } from '../mocks/server.js';

test('should fetch artworks', async () => {
  const artworks = await artworksAPI.getAll();
  expect(artworks).toBeTruthy();
});

test('should handle API error', async () => {
  server.use(http.get('/api/artworks', () => HttpResponse.error()));
  await expect(artworksAPI.getAll()).rejects.toThrow();
});
```

### DOM Mocking

Tests use real jsdom for DOM operations:
```javascript
beforeEach(() => {
  document.body.innerHTML = `
    <form id="contact-form">
      <input id="name" />
      <button type="submit">Send</button>
    </form>
  `;
});
```

---

## Debugging Tests

### Debug Single Test

```bash
# Run with verbose output
npm test -- --reporter=verbose gallery.test.js

# Debug in Chrome DevTools
node --inspect-brk ./node_modules/vitest/vitest.mjs run gallery.test.js
```

### View Playwright Browser

```bash
# Run E2E tests with visible browser
npm run test:e2e -- --headed

# Step through tests one by one
npm run test:e2e:ui
```

### Print Debug Info

```javascript
test('gallery loads', async () => {
  const artworks = await artworksAPI.getAll();
  console.log('Artworks loaded:', artworks.length);
  expect(artworks.length).toBeGreaterThan(0);
});
```

### Screenshot on Failure

```javascript
test('lightbox opens', async ({ page }) => {
  try {
    await page.click('.gallery-item');
    const lightbox = await page.locator('#lightbox');
    expect(lightbox).toBeVisible();
  } catch (error) {
    await page.screenshot({ path: 'failure-screenshot.png' });
    throw error;
  }
});
```

---

## Writing Tests: Best Practices

### Unit Test Template

```javascript
import { describe, it, expect, beforeEach } from 'vitest';

describe('Component Name', () => {
  // Setup before each test
  beforeEach(() => {
    // Reset state, clear DOM, etc.
  });

  // Simple, focused test
  it('should do one specific thing', () => {
    // Arrange: Set up test data
    const data = { name: 'Test' };

    // Act: Call the function
    const result = transform(data);

    // Assert: Check the result
    expect(result).toBe('EXPECTED');
  });

  // Test error conditions
  it('should handle invalid input', () => {
    expect(() => transform(null)).toThrow();
  });

  // Test edge cases
  it('should handle empty array', () => {
    const result = transform([]);
    expect(result).toEqual([]);
  });
});
```

### Integration Test Template

```javascript
describe('Feature: Gallery + Lightbox', () => {
  beforeEach(async () => {
    document.body.innerHTML = `
      <div class="gallery-grid"></div>
      <div id="lightbox"></div>
    `;
    setupMockAPI();
  });

  it('should open lightbox when gallery item clicked', async () => {
    // Given: Gallery is loaded
    const gallery = new Gallery({ containerSelector: '.gallery-grid' });
    await new Promise(r => setTimeout(r, 100)); // Wait for render

    // When: User clicks artwork
    const item = document.querySelector('.gallery-item');
    item.click();

    // Then: Lightbox opens
    const lightbox = document.getElementById('lightbox');
    expect(lightbox.getAttribute('aria-hidden')).toBe('false');
  });
});
```

### E2E Test Template

```javascript
import { test, expect } from '@playwright/test';

test.describe('User Story: Browse Gallery', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000/gallery.html');
    await page.waitForLoadState('networkidle');
  });

  test('user can view artworks', async ({ page }) => {
    // Given: Gallery page loads
    const items = await page.locator('.gallery-item').count();

    // When: Page is fully loaded
    // Then: Artworks are visible
    expect(items).toBeGreaterThan(0);
  });

  test('user can filter by category', async ({ page }) => {
    // When: User clicks Nature filter
    await page.click('button:has-text("Nature")');
    await page.waitForTimeout(300); // Animation

    // Then: Only nature artworks shown
    const items = await page.locator('[data-category="nature"]').count();
    expect(items).toBeGreaterThan(0);
  });
});
```

### What NOT to Do

```javascript
// ❌ DON'T: Test implementation details
it('should call transformArtwork()', () => {
  const spy = jest.spyOn(gallery, 'transformArtwork');
  gallery.render(artworks);
  expect(spy).toHaveBeenCalled(); // Implementation detail!
});

// ✅ DO: Test behavior/outcome
it('should display artwork title', () => {
  gallery.render(artworks);
  const title = document.querySelector('.gallery-item h3');
  expect(title.textContent).toBe('Artwork 1');
});

// ❌ DON'T: Hard timeouts
it('should show loading', async () => {
  gallery.load();
  await new Promise(r => setTimeout(r, 2000)); // Flaky!
  expect(document.querySelector('.loaded')).toBeTruthy();
});

// ✅ DO: Explicit waits
it('should show loading', async () => {
  gallery.load();
  await waitFor(() => document.querySelector('.loaded'));
  expect(document.querySelector('.loaded')).toBeTruthy();
});
```

---

## Coverage Reports

### View Coverage

```bash
# Generate HTML report
npm run test:coverage

# Open report in browser
open coverage/index.html
```

### Coverage Targets

```
┌─────────────────────┬─────────┬─────────┬─────────┐
│ File                │ Line %  │ Branch %│ Function│
├─────────────────────┼─────────┼─────────┼─────────┤
│ utils/dom.js        │ 100%    │ 100%    │ 100%    │
│ utils/storage.js    │ 100%    │ 100%    │ 100%    │
│ services/api.js     │ 100%    │ 100%    │ 100%    │
│ components/         │         │         │         │
│  FormValidator.js   │ 95%     │ 90%     │ 95%     │
│  Gallery.js         │ 90%     │ 85%     │ 90%     │
│  Theme.js           │ 95%     │ 90%     │ 95%     │
│ (other components)  │ 85%     │ 80%     │ 85%     │
├─────────────────────┼─────────┼─────────┼─────────┤
│ TOTAL               │ 80%+    │ 75%+    │ 80%+    │
└─────────────────────┴─────────┴─────────┴─────────┘
```

---

## CI/CD Integration

Tests run automatically in GitHub Actions. View results:

1. Go to GitHub repo
2. Click "Actions" tab
3. Select latest workflow run
4. View test results and coverage

**Workflow Files**:
- `.github/workflows/test.yml` - Unit + integration tests
- `.github/workflows/e2e.yml` - E2E tests
- `.github/workflows/performance.yml` - Lighthouse CI
- `.github/workflows/accessibility.yml` - a11y tests

---

## Troubleshooting

### Tests Timeout
```javascript
// Increase timeout for slow tests
test('slow operation', async () => {
  // test code
}, 10000); // 10 second timeout
```

### DOM not ready
```javascript
// Wait for elements
beforeEach(async () => {
  document.body.innerHTML = '<div id="test"></div>';
  await new Promise(r => setTimeout(r, 0)); // Let DOM settle
});
```

### API calls fail in tests
- Check MSW handlers are set up (see `tests/mocks/handlers.js`)
- Verify server is listening: `beforeAll(() => server.listen())`
- Check URL matches in handlers

### E2E flakiness
- Use `waitFor()` instead of hard timeouts
- Use `data-testid` attributes for stable selectors
- Increase timeout in playwright.config.js for slow CI

---

## Performance Tips

### Run Tests in Parallel
```bash
# Already configured - Vitest runs in parallel by default
npm test
```

### Skip Slow Tests During Development
```bash
# Skip E2E tests
npm run test:unit

# Skip accessibility tests
npm run test:unit test:integration
```

### Use Watch Mode
```bash
# Only rerun affected tests
npm run test:watch
```

---

## Resources

### Testing Documentation
- [Vitest Docs](https://vitest.dev)
- [Playwright Docs](https://playwright.dev)
- [Testing Library Best Practices](https://testing-library.com/docs)
- [MSW Documentation](https://mswjs.io)

### Quality Standards
- [JavaScript Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)
- [WCAG 2.1 Standards](https://www.w3.org/WAI/WCAG21/quickref/)

### Tools
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [axe-core](https://github.com/dequelabs/axe-core)
- [Percy Visual Testing](https://percy.io)

---

## Contributing Tests

When adding new features:

1. **Write tests first** (TDD preferred):
   ```bash
   npm run test:watch
   # Red: Test fails
   # Green: Implement feature
   # Refactor: Clean up code
   ```

2. **Follow naming conventions**:
   - Test files: `ComponentName.test.js`
   - Test names: describe user behavior in plain English
   - Test structure: Given-When-Then format

3. **Ensure coverage**:
   ```bash
   npm run test:coverage
   # Aim for 80%+ total coverage
   ```

4. **Run before committing**:
   ```bash
   npm test
   npm run test:e2e
   ```

5. **Update this README** if adding new test categories

---

## Support

For questions or issues:
1. Check test output for clear error messages
2. Run with `--reporter=verbose` for details
3. Use Playwright UI mode for debugging
4. Review test templates in this README

---

**Test Suite Version**: 1.0 | **Last Updated**: 2024-11-28 | **Status**: Ready for Implementation
