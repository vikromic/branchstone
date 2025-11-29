# QA Strategy & Testing Plan: Branchstone Art Portfolio

## Executive Summary

The Branchstone Art Portfolio currently has **zero test coverage (0%)** with no automated testing infrastructure. This document defines a comprehensive QA strategy to achieve production-quality assurance and prevent regressions across 10 core JavaScript components spanning galleries, lightbox, forms, themes, animations, and responsive design.

**Target**: 80%+ test coverage across critical user paths within 8 weeks

**Key Metrics**:
- Unit Test Coverage: 60%+ (pure functions, utilities, validators)
- Integration Test Coverage: 70%+ (component interactions, API integration)
- E2E Test Coverage: 100% critical user paths (5-8 tests)
- Performance Budget: LCP <1.5s, FID <100ms, CLS <0.1
- Accessibility Score: 100/100 (Lighthouse AAA compliance)
- Browser Coverage: 95%+ users across Chrome, Firefox, Safari, Edge

---

## Part 1: Testing Gap Analysis

### Current State Assessment

#### Test Coverage by Component

| Component | Type | Lines | Testability | Risk Level | Priority |
|-----------|------|-------|-------------|-----------|----------|
| Gallery.js | 418 | Complex API integration, DOM rendering | HIGH | P0 |
| Lightbox.js | 495 | Touch gestures, keyboard nav, state mgmt | MEDIUM | P0 |
| Menu.js | 272 | Focus trap, ARIA attrs, animation timing | MEDIUM | P1 |
| FormValidator.js | 217 | Validation logic, error states, accessibility | HIGH | P0 |
| GalleryFilter.js | 248 | Category filtering, DOM mutation, performance | MEDIUM | P1 |
| Carousel.js | 206 | Auto-play, touch swipe, loop logic | MEDIUM | P1 |
| Theme.js | 108 | localStorage, CSS variables, media queries | LOW | P2 |
| Animations.js | 144 | IntersectionObserver, performance | MEDIUM | P1 |
| api.js | 129 | Network requests, error handling, caching | HIGH | P0 |
| i18n.js | 156 | Language switching, translation fallback | MEDIUM | P1 |
| **Utils** (dom.js, storage.js) | 220 | Pure functions, easy to test | LOW | P2 |

**Critical Gaps**:
- ✗ No unit tests for validation logic
- ✗ No API mocking/stubbing
- ✗ No E2E test scenarios
- ✗ No performance testing setup
- ✗ No accessibility automated tests
- ✗ No visual regression tests
- ✗ No CI/CD pipeline

---

## Part 2: Recommended Testing Framework Stack

### Why These Frameworks?

#### Unit & Integration Testing: **Vitest** (Primary)
```
RATIONALE: Modern, lightweight, ESM-first, built for Vite
ADVANTAGES:
  ✓ Native ES6 module support (matches project structure)
  ✓ Fast hot module reloading (dev velocity)
  ✓ Jest-compatible API (low learning curve)
  ✓ Excellent TypeScript/JSDoc support
  ✓ Small bundle size for GitHub Pages
COST: Free, open source
```

**Alternative**: Jest (more mature ecosystem, heavier)

#### E2E Testing: **Playwright** (Primary)
```
RATIONALE: Best for modern SPA/static sites, excellent cross-browser
ADVANTAGES:
  ✓ Chrome, Firefox, Safari, Edge support (single API)
  ✓ Mobile emulation built-in (iOS/Android testing)
  ✓ Network throttling simulation (3G/4G testing)
  ✓ Screenshot/video recording (debugging)
  ✓ Accessibility testing via axe integration
  ✓ No flakiness (built-in waits, retry logic)
COST: Free, open source
```

**Alternative**: Cypress (easier DSL but less cross-browser support)

#### Visual Regression: **Percy** (Primary)
```
RATIONALE: Cloud-based visual testing with ML diffing
ADVANTAGES:
  ✓ Automatic baseline management
  ✓ Smart pixel diffing (ignores insignificant changes)
  ✓ PR integration (auto-comment on regressions)
  ✓ Historical comparisons
  ✓ Responsive breakpoint testing
COST: $99/month paid tier (free for open source)
ALTERNATIVE: BackstopJS (local, free)
```

#### Performance Testing: **Lighthouse CI** (Primary)
```
RATIONALE: Official Google tool, measures Core Web Vitals
ADVANTAGES:
  ✓ Measures LCP, FID, CLS (SERP signals)
  ✓ GitHub Actions integration
  ✓ Performance budgets with CI gates
  ✓ Mobile/desktop testing
COST: Free, open source
```

#### Accessibility Testing: **axe-core** + **Pa11y** (Integrated)
```
RATIONALE: WCAG 2.1 AA/AAA automated compliance
ADVANTAGES:
  ✓ Detects 90%+ of accessibility issues
  ✓ Integrates with Playwright/Jest
  ✓ No false positives (vetted rules)
  ✓ Standards-based (WCAG, Section 508, ARIA)
COST: Free, open source
```

#### API Mocking: **MSW (Mock Service Worker)** (Primary)
```
RATIONALE: Request interception at network level
ADVANTAGES:
  ✓ Works in both unit tests and E2E
  ✓ Zero code changes to application
  ✓ Realistic request/response simulation
  ✓ Service Worker integration for offline testing
COST: Free, open source
```

---

## Part 3: Test Suite Design & Coverage Roadmap

### Testing Pyramid for Branchstone

```
                    △ E2E (5-8 tests)
                   /|\
                  / | \
                 /  |  \  Integration (15-20 tests)
                /   |   \
               /    |    \
              /_____|_____\
             Unit Tests (60+ tests)
```

### Phase 1: Foundation (Weeks 1-2)

#### Setup & Utilities Testing (QUICK WIN - 2 days)
**Files**: `tests/unit/utils/`

**Tests to Write**:
```javascript
// tests/unit/utils/dom.test.js
describe('DOM Utils', () => {
  test('$() returns element or null', () => {
    document.body.innerHTML = '<div id="test">content</div>';
    expect($('#test')).toBeTruthy();
    expect($('#nonexistent')).toBeNull();
  });

  test('$$() returns array of elements', () => {
    document.body.innerHTML = '<div class="item">1</div><div class="item">2</div>';
    const items = $$('.item');
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(2);
  });

  test('createElement() builds elements with attributes', () => {
    const el = createElement('button', {
      className: 'btn',
      id: 'submit',
      dataset: { action: 'submit' }
    }, 'Click me');

    expect(el.tagName).toBe('BUTTON');
    expect(el.className).toBe('btn');
    expect(el.textContent).toBe('Click me');
    expect(el.dataset.action).toBe('submit');
  });

  test('on() attaches listener and returns cleanup function', () => {
    const el = document.createElement('div');
    const handler = jest.fn();
    const cleanup = on(el, 'click', handler);

    el.click();
    expect(handler).toHaveBeenCalledTimes(1);

    cleanup();
    el.click();
    expect(handler).toHaveBeenCalledTimes(1); // Still 1, not incremented
  });
});

// tests/unit/utils/storage.test.js
describe('Storage Utils', () => {
  beforeEach(() => localStorage.clear());

  test('setStorageItem() and getStorageItem()', () => {
    setStorageItem('user', { name: 'Victoria' });
    const user = getStorageItem('user');

    expect(user.name).toBe('Victoria');
  });

  test('removeStorageItem() deletes key', () => {
    setStorageItem('temp', 'value');
    removeStorageItem('temp');

    expect(getStorageItem('temp')).toBeNull();
  });

  test('handles invalid JSON gracefully', () => {
    localStorage.setItem('bad', 'not valid json');
    expect(getStorageItem('bad')).toBeNull(); // Or fallback value
  });

  test('handles storage quota exceeded', () => {
    // Mock localStorage.setItem to throw QuotaExceededError
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = jest.fn(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => setStorageItem('test', 'val')).not.toThrow();
    Storage.prototype.setItem = originalSetItem;
  });
});
```

**Effort**: 1-2 days | **ROI**: High (foundation for all other tests)

---

### Phase 2: API & Core Services (Weeks 2-3)

#### API Service Testing (CRITICAL)
**Files**: `tests/unit/services/api.test.js`

**Tests to Write**:
```javascript
// tests/unit/services/api.test.js
import { artworksAPI, translationsAPI, contactAPI } from '../../../docs/js/services/api.js';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const mockArtworks = [
  { id: 1, title: 'Artwork 1', image: 'img1.jpg', available: true },
  { id: 2, title: 'Artwork 2', image: 'img2.jpg', available: false },
];

const server = setupServer(
  http.get(/api\/artworks/, () => HttpResponse.json(mockArtworks)),
  http.get(/api\/translations/, () => HttpResponse.json({ en: {}, ua: {} })),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Artworks API', () => {
  test('getAll() returns all artworks', async () => {
    const artworks = await artworksAPI.getAll();
    expect(artworks).toHaveLength(2);
    expect(artworks[0].id).toBe(1);
  });

  test('getFeatured(count) returns limited artworks', async () => {
    const featured = await artworksAPI.getFeatured(1);
    expect(featured).toHaveLength(1);
    expect(featured[0].title).toBe('Artwork 1');
  });

  test('getById(id) returns artwork by ID', async () => {
    const artwork = await artworksAPI.getById(2);
    expect(artwork.title).toBe('Artwork 2');
  });

  test('getById() returns null for missing ID', async () => {
    const artwork = await artworksAPI.getById(999);
    expect(artwork).toBeNull();
  });

  test('handles network errors gracefully', async () => {
    server.use(
      http.get(/api\/artworks/, () => HttpResponse.error())
    );

    await expect(artworksAPI.getAll()).rejects.toThrow();
  });

  test('handles HTTP 500 errors', async () => {
    server.use(
      http.get(/api\/artworks/, () => HttpResponse.json({}, { status: 500 }))
    );

    await expect(artworksAPI.getAll()).rejects.toThrow();
  });
});

describe('Contact API', () => {
  test('submit() sends form data', async () => {
    server.use(
      http.post(/api\/contact/, () => HttpResponse.json({ success: true }))
    );

    const result = await contactAPI.submit({ name: 'John', email: 'john@example.com' });
    expect(result.success).toBe(true);
  });

  test('submit() handles submission errors', async () => {
    server.use(
      http.post(/api\/contact/, () => HttpResponse.json({}, { status: 500 }))
    );

    await expect(contactAPI.submit({})).rejects.toThrow('Form submission failed');
  });
});
```

**Effort**: 2-3 days | **ROI**: Critical (blocks all gallery/form features)

---

### Phase 3: Component Unit Tests (Weeks 3-4)

#### FormValidator Unit Tests (CRITICAL)
**Files**: `tests/unit/components/FormValidator.test.js`

**Tests to Write**:
```javascript
describe('FormValidator', () => {
  let validator;
  let form;

  beforeEach(() => {
    document.body.innerHTML = `
      <form id="contact-form">
        <input id="name" type="text" />
        <span id="name-error"></span>

        <input id="email" type="email" />
        <span id="email-error"></span>

        <textarea id="message"></textarea>
        <span id="message-error"></span>
      </form>
    `;
    form = document.getElementById('contact-form');
    validator = new FormValidator({ formSelector: '#contact-form' });
  });

  test('validateAll() returns false when required fields empty', () => {
    const valid = validator.validateAll();
    expect(valid).toBe(false);
  });

  test('validateField(name) validates required field', () => {
    const field = document.getElementById('name');
    const valid = validator.validateField('name');

    expect(valid).toBe(false);
    expect(field.getAttribute('aria-invalid')).toBe('true');
  });

  test('validates email format', () => {
    const emailField = document.getElementById('email');
    emailField.value = 'invalid-email';

    const valid = validator.validateField('email');
    expect(valid).toBe(false);
  });

  test('validates correct email format', () => {
    const emailField = document.getElementById('email');
    emailField.value = 'test@example.com';

    const valid = validator.validateField('email');
    expect(valid).toBe(true);
  });

  test('showFieldError() displays error message', () => {
    validator.showFieldError('email', 'Invalid email');
    const errorEl = document.getElementById('email-error');

    expect(errorEl.textContent).toBe('Invalid email');
    expect(document.getElementById('email').getAttribute('aria-invalid')).toBe('true');
  });

  test('clearFieldError() removes error', () => {
    const emailField = document.getElementById('email');
    validator.showFieldError('email', 'Error');
    validator.clearFieldError('email');

    const errorEl = document.getElementById('email-error');
    expect(errorEl.textContent).toBe('');
    expect(emailField.getAttribute('aria-invalid')).toBe('false');
  });

  test('validateAll() returns true when all fields valid', () => {
    document.getElementById('name').value = 'John Doe';
    document.getElementById('email').value = 'john@example.com';
    document.getElementById('message').value = 'Hi';

    const valid = validator.validateAll();
    expect(valid).toBe(true);
  });

  test('focusFirstInvalid() sets focus', () => {
    const nameField = document.getElementById('name');
    validator.showFieldError('name', 'Required');
    validator.focusFirstInvalid();

    expect(document.activeElement).toBe(nameField);
  });

  test('getData() returns form data', () => {
    document.getElementById('name').value = 'John Doe';
    document.getElementById('email').value = 'john@example.com';
    document.getElementById('message').value = 'Message';

    const data = validator.getData();
    expect(data).toEqual({
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Message'
    });
  });
});
```

**Effort**: 2 days | **ROI**: High (catches form bugs before deployment)

---

#### Theme Manager Unit Tests
**Files**: `tests/unit/components/Theme.test.js`

**Tests to Write**:
```javascript
describe('ThemeManager', () => {
  let theme;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    theme = new ThemeManager();
  });

  test('detects system dark mode preference', () => {
    // Mock matchMedia
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }));

    theme = new ThemeManager();
    expect(theme.isDarkMode()).toBe(true);
  });

  test('toggles theme', () => {
    theme.setDarkMode(true);
    expect(document.documentElement.classList.contains('dark-mode')).toBe(true);

    theme.setDarkMode(false);
    expect(document.documentElement.classList.contains('dark-mode')).toBe(false);
  });

  test('saves theme preference to localStorage', () => {
    theme.setDarkMode(true);
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  test('respects user preference over system preference', () => {
    localStorage.setItem('theme', 'light');
    theme = new ThemeManager();

    expect(theme.isDarkMode()).toBe(false);
  });
});
```

**Effort**: 1 day | **ROI**: Medium (UI feature with few edge cases)

---

#### Gallery Component Unit Tests
**Files**: `tests/unit/components/Gallery.test.js`

**Tests to Write** (Critical path only):
```javascript
describe('Gallery', () => {
  let gallery;
  const mockArtworks = [
    { id: 1, title: 'Art 1', image: 'img1.jpg', size: '50x70', materials: 'Oil', available: true },
    { id: 2, title: 'Art 2', image: 'img2.jpg', size: '40x60', materials: 'Watercolor', available: false },
  ];

  beforeEach(() => {
    document.body.innerHTML = '<div class="gallery-grid"></div>';
    setupMockAPI();
  });

  test('loads and renders artworks', async () => {
    gallery = new Gallery({ containerSelector: '.gallery-grid', type: 'full' });
    await new Promise(resolve => setTimeout(resolve, 100));

    const items = document.querySelectorAll('.gallery-item');
    expect(items.length).toBe(2);
  });

  test('hides skeleton loaders after loading', async () => {
    document.body.innerHTML = `
      <div class="gallery-grid">
        <div class="skeleton-item">Loading...</div>
      </div>
    `;

    gallery = new Gallery({ containerSelector: '.gallery-grid', type: 'full' });
    await new Promise(resolve => setTimeout(resolve, 100));

    const skeletons = document.querySelectorAll('.skeleton-item');
    expect(skeletons.length).toBe(0);
  });

  test('getFeatured(count) limits results', async () => {
    gallery = new Gallery({
      containerSelector: '.gallery-grid',
      type: 'featured',
    });
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should load only featured count
    const items = document.querySelectorAll('.carousel-item');
    expect(items.length).toBeLessThanOrEqual(3);
  });

  test('shows error message on API failure', async () => {
    mockAPIError();
    gallery = new Gallery({ containerSelector: '.gallery-grid' });
    await new Promise(resolve => setTimeout(resolve, 100));

    const error = document.querySelector('.gallery-error');
    expect(error).toBeTruthy();
    expect(error.textContent).toContain('Unable to load');
  });

  test('keyboard support: Enter opens gallery item', async () => {
    gallery = new Gallery({ containerSelector: '.gallery-grid', type: 'full' });
    await new Promise(resolve => setTimeout(resolve, 100));

    const item = document.querySelector('.gallery-item');
    const clickSpy = jest.spyOn(item, 'click');

    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    item.dispatchEvent(event);

    expect(clickSpy).toHaveBeenCalled();
  });

  test('clear() empties gallery', () => {
    document.body.innerHTML = '<div class="gallery-grid"><div class="gallery-item"></div></div>';
    gallery = new Gallery({ containerSelector: '.gallery-grid' });

    gallery.clear();
    expect(document.querySelectorAll('.gallery-item').length).toBe(0);
  });
});
```

**Effort**: 2 days | **ROI**: Critical (core feature)

---

### Phase 4: Integration Tests (Weeks 4-5)

#### App Bootstrap Integration Test
**Files**: `tests/integration/app-bootstrap.test.js`

**Tests to Write**:
```javascript
describe('App Bootstrap', () => {
  test('initializes all core components', async () => {
    document.body.innerHTML = `
      <button id="mobile-menu-toggle">Menu</button>
      <nav id="mobile-nav-menu"></nav>
      <div id="mobile-menu-overlay"></div>
    `;

    const app = new App();
    await new Promise(r => setTimeout(r, 100));

    expect(app.getComponent('menu')).toBeTruthy();
    expect(app.getComponent('theme')).toBeTruthy();
    expect(app.getComponent('animations')).toBeTruthy();
  });

  test('initializes page-specific components on gallery page', async () => {
    // Mock pathname
    Object.defineProperty(window, 'location', {
      value: { pathname: '/gallery.html' },
      writable: true
    });

    document.body.innerHTML = `
      <div class="gallery-grid"></div>
      <div id="gallery-filter"></div>
      <div id="lightbox"></div>
    `;

    setupMockAPI();
    const app = new App();
    await new Promise(r => setTimeout(r, 200));

    expect(app.getComponent('gallery')).toBeTruthy();
    expect(app.getComponent('galleryFilter')).toBeTruthy();
    expect(app.getComponent('lightbox')).toBeTruthy();
  });

  test('smooth scroll initialization', () => {
    document.body.innerHTML = `
      <a href="#section-1">Go to section</a>
      <section id="section-1">Content</section>
    `;

    const app = new App();
    expect(document.documentElement.style.scrollBehavior).toBe('smooth');
  });

  test('cleanup destroys all components', () => {
    const app = new App();
    const menu = app.getComponent('menu');
    const destroySpy = jest.spyOn(menu, 'destroy');

    app.destroy();
    expect(destroySpy).toHaveBeenCalled();
    expect(app.getComponent('menu')).toBeUndefined();
  });
});
```

**Effort**: 1-2 days | **ROI**: High (validates whole app initialization)

---

#### Gallery + Lightbox Integration Test
**Files**: `tests/integration/gallery-lightbox.test.js`

**Tests to Write**:
```javascript
describe('Gallery & Lightbox Integration', () => {
  let gallery, lightbox;

  beforeEach(async () => {
    document.body.innerHTML = `
      <div class="gallery-grid"></div>
      <div id="lightbox" aria-hidden="true">
        <div class="lightbox-image-container">
          <img id="lightbox-img" />
        </div>
        <div id="lightbox-title"></div>
        <button id="prev-btn">Prev</button>
        <button id="next-btn">Next</button>
        <button class="close-lightbox">Close</button>
      </div>
    `;

    setupMockAPI();
    gallery = new Gallery({ containerSelector: '.gallery-grid', type: 'full' });
    lightbox = new Lightbox();

    await new Promise(r => setTimeout(r, 100));
  });

  test('clicking gallery item opens lightbox', async () => {
    const item = document.querySelector('.gallery-item');
    item.click();

    await new Promise(r => setTimeout(r, 100));
    expect(lightbox.lightbox.getAttribute('aria-hidden')).toBe('false');
  });

  test('lightbox navigation: next button shows next image', () => {
    const item = document.querySelector('.gallery-item');
    item.click();

    const nextBtn = document.getElementById('next-btn');
    const currentIndex = lightbox.state.currentIndex;

    nextBtn.click();
    expect(lightbox.state.currentIndex).toBe(currentIndex + 1);
  });

  test('lightbox closes with Escape key', () => {
    const item = document.querySelector('.gallery-item');
    item.click();

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    document.dispatchEvent(event);

    expect(lightbox.lightbox.getAttribute('aria-hidden')).toBe('true');
  });

  test('lightbox keyboard navigation: arrow keys', () => {
    const item = document.querySelector('.gallery-item');
    item.click();
    const initialIndex = lightbox.state.currentIndex;

    const rightArrow = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    lightbox.lightbox.dispatchEvent(rightArrow);

    expect(lightbox.state.currentIndex).toBe(initialIndex + 1);
  });
});
```

**Effort**: 1-2 days | **ROI**: Critical (main user interaction)

---

### Phase 5: E2E Tests (Weeks 5-6)

#### E2E Test Suite with Playwright
**Files**: `tests/e2e/critical-paths.spec.js`

**Tests to Write**:
```javascript
// tests/e2e/gallery-browsing.spec.js
import { test, expect } from '@playwright/test';

test.describe('Gallery Browsing User Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000/gallery.html');
    await page.waitForLoadState('networkidle');
  });

  test('user can filter gallery by category', async ({ page }) => {
    // Given: User is on gallery page
    // When: User clicks on "Nature" filter
    await page.click('button:has-text("Nature")');

    // Then: Only nature artworks should display
    const items = await page.locator('.gallery-item').count();
    expect(items).toBeGreaterThan(0);

    // And: All visible items should have nature category
    const categories = await page.locator('.gallery-item[data-category="nature"]').count();
    expect(categories).toBe(items);
  });

  test('user can view artwork details in lightbox', async ({ page }) => {
    // Given: Gallery is loaded
    // When: User clicks on first artwork
    const firstItem = page.locator('.gallery-item').first();
    const title = await firstItem.getAttribute('data-title');
    await firstItem.click();

    // Then: Lightbox opens with artwork details
    const lightbox = page.locator('#lightbox');
    await expect(lightbox).toHaveAttribute('aria-hidden', 'false');

    // And: Artwork title is visible
    const lightboxTitle = page.locator('#lightbox-title');
    await expect(lightboxTitle).toContainText(title);
  });

  test('user can navigate through lightbox with keyboard', async ({ page }) => {
    // Given: Lightbox is open
    const firstItem = page.locator('.gallery-item').first();
    await firstItem.click();

    const lightbox = page.locator('#lightbox');
    await expect(lightbox).toHaveAttribute('aria-hidden', 'false');

    // When: User presses right arrow
    const initialTitle = await page.locator('#lightbox-title').textContent();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300); // Animation

    // Then: Next artwork is displayed
    const newTitle = await page.locator('#lightbox-title').textContent();
    expect(newTitle).not.toBe(initialTitle);
  });

  test('user can close lightbox with Escape key', async ({ page }) => {
    // Given: Lightbox is open
    const firstItem = page.locator('.gallery-item').first();
    await firstItem.click();

    const lightbox = page.locator('#lightbox');
    await expect(lightbox).toHaveAttribute('aria-hidden', 'false');

    // When: User presses Escape
    await page.keyboard.press('Escape');

    // Then: Lightbox is hidden
    await expect(lightbox).toHaveAttribute('aria-hidden', 'true');
  });

  test('gallery loads images with lazy loading', async ({ page }) => {
    // Given: Gallery page is loaded
    // When: User scrolls down
    const lastItem = page.locator('.gallery-item').last();
    await lastItem.scrollIntoViewIfNeeded();

    // Then: Images are loaded as needed
    const images = page.locator('.gallery-item picture img[loading="lazy"]');
    const loadedImages = await page.locator('.gallery-item picture img:not([loading])').count();

    expect(loadedImages).toBeGreaterThan(0);
  });

  test('gallery shows error message when API fails', async ({ page }) => {
    // Given: API will fail
    await page.route('**/api/artworks*', route => route.abort());

    // When: Page loads
    await page.reload();

    // Then: Error message is shown
    const error = page.locator('.gallery-error');
    await expect(error).toBeVisible();

    // And: Retry button is clickable
    const retryBtn = error.locator('button');
    await expect(retryBtn).toBeVisible();
  });
});

// tests/e2e/contact-form.spec.js
test.describe('Contact Form Submission', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8000/contact.html');
  });

  test('user can submit contact form with valid data', async ({ page }) => {
    // Given: Contact form is displayed
    // When: User fills in the form
    await page.fill('#name', 'John Doe');
    await page.fill('#email', 'john@example.com');
    await page.fill('#message', 'I love your artwork!');

    // And: User submits the form
    await page.click('button[type="submit"]');

    // Then: Form shows success message
    const successMsg = page.locator('.success-message');
    await expect(successMsg).toBeVisible();
  });

  test('form validates email format', async ({ page }) => {
    // Given: User enters invalid email
    await page.fill('#email', 'invalid-email');
    await page.fill('#name', 'John Doe');
    await page.fill('#message', 'Message');

    // When: User submits
    await page.click('button[type="submit"]');

    // Then: Error message appears
    const error = page.locator('#email-error');
    await expect(error).toContainText('valid email');
  });

  test('form shows error for empty required fields', async ({ page }) => {
    // Given: Form is empty
    // When: User submits
    await page.click('button[type="submit"]');

    // Then: All required field errors appear
    const nameError = page.locator('#name-error');
    const emailError = page.locator('#email-error');
    const messageError = page.locator('#message-error');

    await expect(nameError).toHaveText('required');
    await expect(emailError).toHaveText('required');
    await expect(messageError).toHaveText('required');
  });

  test('clearing error when user starts typing', async ({ page }) => {
    // Given: Form shows validation error
    await page.click('button[type="submit"]');
    const nameError = page.locator('#name-error');
    await expect(nameError).toHaveText('required');

    // When: User starts typing
    await page.fill('#name', 'John');

    // Then: Error is cleared
    await expect(nameError).toHaveText('');
  });
});

// tests/e2e/theme-switching.spec.js
test.describe('Theme Switching', () => {
  test('user can toggle theme', async ({ page }) => {
    await page.goto('http://localhost:8000');

    // Given: Light theme is active
    const html = page.locator('html');
    let isDark = await html.evaluate(el => el.classList.contains('dark-mode'));

    // When: User clicks theme toggle
    await page.click('[aria-label="Toggle theme"]');

    // Then: Theme changes
    const newIsDark = await html.evaluate(el => el.classList.contains('dark-mode'));
    expect(newIsDark).not.toBe(isDark);
  });

  test('theme preference persists across page reloads', async ({ page }) => {
    await page.goto('http://localhost:8000');

    // Given: User sets dark theme
    await page.click('[aria-label="Toggle theme"]');

    // When: User reloads page
    await page.reload();

    // Then: Dark theme is still active
    const html = page.locator('html');
    const isDark = await html.evaluate(el => el.classList.contains('dark-mode'));
    expect(isDark).toBe(true);
  });
});

// tests/e2e/mobile-menu.spec.js
test.describe('Mobile Menu', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone size

  test('user can open and close mobile menu', async ({ page }) => {
    await page.goto('http://localhost:8000');

    // Given: Mobile menu is closed
    const menu = page.locator('#mobile-nav-menu');
    await expect(menu).toHaveAttribute('aria-hidden', 'true');

    // When: User clicks menu toggle
    await page.click('#mobile-menu-toggle');

    // Then: Menu is open
    await expect(menu).toHaveAttribute('aria-hidden', 'false');

    // And: Menu toggle indicates opened state
    const toggle = page.locator('#mobile-menu-toggle');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  test('menu closes when user clicks a link', async ({ page }) => {
    await page.goto('http://localhost:8000');

    // Given: Menu is open
    await page.click('#mobile-menu-toggle');
    const menu = page.locator('#mobile-nav-menu');
    await expect(menu).toHaveAttribute('aria-hidden', 'false');

    // When: User clicks navigation link
    await page.click('#mobile-nav-menu a[href="/gallery.html"]');

    // Then: Menu closes
    await page.waitForTimeout(300); // Animation
    await expect(menu).toHaveAttribute('aria-hidden', 'true');
  });

  test('menu closes with Escape key', async ({ page }) => {
    await page.goto('http://localhost:8000');

    // Given: Menu is open
    await page.click('#mobile-menu-toggle');
    const menu = page.locator('#mobile-nav-menu');

    // When: User presses Escape
    await page.keyboard.press('Escape');

    // Then: Menu closes
    await expect(menu).toHaveAttribute('aria-hidden', 'true');
  });
});

// tests/e2e/accessibility.spec.js
test.describe('Accessibility Compliance', () => {
  test('gallery items are keyboard navigable', async ({ page }) => {
    await page.goto('http://localhost:8000/gallery.html');

    // Given: Gallery is loaded
    // When: User tabs to gallery item
    const firstItem = page.locator('.gallery-item').first();
    await firstItem.focus();

    // Then: Item is focused with visible outline
    const isFocused = await firstItem.evaluate(el => el === document.activeElement);
    expect(isFocused).toBe(true);

    // And: Item can be activated with Enter/Space
    await page.keyboard.press('Enter');
    const lightbox = page.locator('#lightbox');
    await expect(lightbox).toHaveAttribute('aria-hidden', 'false');
  });

  test('form has proper ARIA labels and descriptions', async ({ page }) => {
    await page.goto('http://localhost:8000/contact.html');

    // Check each form field has label
    const fields = ['name', 'email', 'message'];
    for (const field of fields) {
      const input = page.locator(`#${field}`);
      const label = page.locator(`label[for="${field}"]`);
      await expect(label).toBeVisible();
    }
  });

  test('color contrast meets WCAG AA standard', async ({ page }) => {
    await page.goto('http://localhost:8000');

    // Use axe accessibility testing
    const axeResults = await page.evaluate(() => {
      return new Promise(resolve => {
        axe.run((error, results) => {
          resolve(results);
        });
      });
    });

    expect(axeResults.violations.length).toBe(0);
  });

  test('page is navigable without mouse', async ({ page }) => {
    await page.goto('http://localhost:8000/gallery.html');

    // Given: User can only use keyboard
    // When: User tabs through page
    let tabCount = 0;
    while (tabCount < 10) {
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el && (el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'INPUT');
      });

      if (focused) tabCount++;
    }

    // Then: Can reach interactive elements via keyboard
    expect(tabCount).toBeGreaterThan(0);
  });
});
```

**Effort**: 3-4 days | **ROI**: Critical (validates entire user experience)

---

### Phase 6: Performance & Accessibility Testing (Weeks 6-7)

#### Performance Testing with Lighthouse CI
**Files**: `tests/performance/lighthouse.config.js`

**Configuration**:
```javascript
// lighthouse.config.js
export default {
  ci: {
    upload: {
      target: 'temporary-public-storage',
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['error', { minScore: 0.90 }],
        'categories:accessibility': ['error', { minScore: 1.0 }],
        'categories:best-practices': ['error', { minScore: 0.90 }],
        'categories:seo': ['error', { minScore: 0.90 }],
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'first-input-delay': ['error', { maxNumericValue: 100 }],
      },
    },
  },
};
```

**GitHub Actions Integration**:
```yaml
# .github/workflows/performance.yml
name: Performance Testing

on: [pull_request, push]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'

      - run: npm install

      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          configPath: './lighthouse.config.js'
          temporaryPublicStorage: true
```

**Metrics to Track**:
- LCP (Largest Contentful Paint): <1.5s
- FID (First Input Delay): <100ms
- CLS (Cumulative Layout Shift): <0.1
- Performance Score: >90
- Accessibility Score: 100

**Effort**: 1-2 days | **ROI**: High (prevents performance regressions)

---

#### Accessibility Testing with axe-core & Pa11y
**Files**: `tests/accessibility/a11y.test.js`

**Tests to Write**:
```javascript
// tests/accessibility/a11y.test.js
import { injectAxe, checkA11y } from 'axe-playwright';

describe('Accessibility (WCAG 2.1 AA/AAA)', () => {
  test('home page meets WCAG standards', async ({ page }) => {
    await page.goto('http://localhost:8000');
    await injectAxe(page);

    // Check for accessibility violations
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true }
    });
  });

  test('gallery page meets WCAG standards', async ({ page }) => {
    await page.goto('http://localhost:8000/gallery.html');
    await injectAxe(page);
    await checkA11y(page);
  });

  test('contact form meets WCAG standards', async ({ page }) => {
    await page.goto('http://localhost:8000/contact.html');
    await injectAxe(page);
    await checkA11y(page);
  });

  test('lightbox dialog meets accessibility standards', async ({ page }) => {
    await page.goto('http://localhost:8000/gallery.html');

    // Open lightbox
    await page.click('.gallery-item');
    const lightbox = page.locator('#lightbox');

    // Check dialog accessibility
    await injectAxe(page);
    await checkA11y(page, '#lightbox');
  });

  test('form validation errors are announced to screen readers', async ({ page }) => {
    await page.goto('http://localhost:8000/contact.html');

    // Fill invalid data
    await page.fill('#email', 'invalid');

    // Submit
    await page.click('button[type="submit"]');

    // Error should be associated with input
    const email = page.locator('#email');
    const errorId = await email.getAttribute('aria-describedby');

    expect(errorId).toBeTruthy();

    const error = page.locator(`#${errorId}`);
    await expect(error).toBeVisible();
  });

  test('skip-to-content link is keyboard accessible', async ({ page }) => {
    await page.goto('http://localhost:8000');

    // Tab to skip link (should be first focusable element)
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement.textContent);

    expect(focused).toContain('Skip to content');
  });

  test('images have meaningful alt text', async ({ page }) => {
    await page.goto('http://localhost:8000/gallery.html');

    // Check all images have alt or aria-label
    const images = await page.locator('img').all();

    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');

      expect(alt || ariaLabel).toBeTruthy();
    }
  });

  test('color contrast ratio meets WCAG AA standard', async ({ page }) => {
    await page.goto('http://localhost:8000');
    await injectAxe(page);

    // axe will check contrast as part of checkA11y
    await checkA11y(page);
  });

  test('mobile menu is keyboard trapped when open', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('http://localhost:8000');

    // Open menu
    await page.click('#mobile-menu-toggle');

    // Tab through menu elements
    const menuItems = page.locator('#mobile-nav-menu a');
    const itemCount = await menuItems.count();

    expect(itemCount).toBeGreaterThan(0);

    // Focus should stay within menu (tab trap)
    const firstItem = menuItems.first();
    await firstItem.focus();

    // Tab backwards (Shift+Tab) from first item should wrap
    // This requires custom implementation to test properly
  });
});
```

**Effort**: 1-2 days | **ROI**: High (accessibility = legal compliance + user inclusion)

---

### Phase 7: Visual Regression Testing (Week 7)

#### Visual Regression with Percy or BackstopJS
**Files**: `tests/visual/visual.spec.js`

**Playwright + Percy Integration**:
```javascript
// tests/visual/visual-regression.spec.js
import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Visual Regression Tests', () => {
  test('home page snapshot', async ({ page }) => {
    await page.goto('http://localhost:8000');
    await page.waitForLoadState('networkidle');

    // Desktop snapshot
    await percySnapshot(page, 'Home - Desktop');

    // Mobile snapshot
    await page.setViewportSize({ width: 375, height: 667 });
    await percySnapshot(page, 'Home - Mobile');
  });

  test('gallery page snapshot', async ({ page }) => {
    await page.goto('http://localhost:8000/gallery.html');
    await page.waitForLoadState('networkidle');

    // Desktop
    await percySnapshot(page, 'Gallery - Desktop');

    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await percySnapshot(page, 'Gallery - Mobile');
  });

  test('dark mode snapshot', async ({ page }) => {
    await page.goto('http://localhost:8000');

    // Toggle to dark mode
    await page.click('[aria-label="Toggle theme"]');
    await page.waitForTimeout(300); // Wait for transition

    await percySnapshot(page, 'Home - Dark Mode');
  });

  test('lightbox snapshot', async ({ page }) => {
    await page.goto('http://localhost:8000/gallery.html');
    await page.waitForLoadState('networkidle');

    // Open lightbox
    await page.click('.gallery-item');
    await page.waitForTimeout(300);

    await percySnapshot(page, 'Lightbox - Open');
  });

  test('form validation states snapshot', async ({ page }) => {
    await page.goto('http://localhost:8000/contact.html');

    // Show validation errors
    await page.click('button[type="submit"]');

    await percySnapshot(page, 'Contact Form - Validation Errors');
  });

  test('mobile menu open snapshot', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:8000');

    // Open menu
    await page.click('#mobile-menu-toggle');

    await percySnapshot(page, 'Mobile Menu - Open');
  });
});
```

**Effort**: 1 day | **ROI**: Medium (prevents UI regressions, requires manual review)

---

## Part 4: Test Implementation Roadmap

### 8-Week Implementation Timeline

| Week | Phase | Deliverables | Team Capacity |
|------|-------|--------------|---------------|
| 1-2 | Foundation | Setup, Utils tests, CI/CD | 2 days setup + 3 days tests |
| 2-3 | Services | API mocking, Service tests | 2-3 days |
| 3-4 | Components | Unit tests (Form, Theme, Gallery) | 3-4 days |
| 4-5 | Integration | App bootstrap, Gallery+Lightbox, Contact | 2-3 days |
| 5-6 | E2E Tests | Critical user paths (6-8 tests) | 3-4 days |
| 6-7 | Performance | Lighthouse CI setup, budgets | 1-2 days |
| 6-7 | Accessibility | axe-core, Pa11y setup, tests | 1-2 days |
| 7 | Visual | Percy or BackstopJS integration | 1 day |
| 8 | Polish | Flaky test fixes, CI optimization | 1-2 days |

**Total Effort**: 18-24 days ≈ 4-5 weeks with one QA engineer

---

## Part 5: Critical Test Scenarios (Priority Order)

### P0: Must Test (Week 2-4)

1. **Form Validation** - Email format, required fields, error display
2. **Gallery Loading** - API success/failure, skeleton loaders, rendering
3. **Lightbox Navigation** - Next/prev buttons, keyboard arrows, escape close
4. **API Service** - Success response, network errors, HTTP errors, fallbacks

### P1: Should Test (Week 4-5)

5. **Gallery Filtering** - Category filter, showing/hiding items
6. **Mobile Menu** - Open/close, keyboard trap, focus return
7. **Theme Switching** - Toggle, persistence, system preference detection
8. **Contact Form Submission** - Valid/invalid data, success/error states

### P2: Nice to Test (Week 5-6)

9. **Carousel Auto-play** - Timing, pause on hover, loop behavior
10. **Lazy Loading** - Image loading, above-fold priority
11. **Animations** - Scroll triggers, parallax, performance
12. **i18n** - Language switching, translation fallback

---

## Part 6: CI/CD Integration

### GitHub Actions Workflow Structure

```yaml
# .github/workflows/test.yml
name: Tests

on: [pull_request, push]

jobs:
  unit-integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
      - run: npm install
      - run: npm run test:unit  # Vitest
      - run: npm run test:integration
      - run: npm run coverage
      - uses: codecov/codecov-action@v3

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: 'npm'
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npm run test:e2e

  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:a11y

  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - uses: treosh/lighthouse-ci-action@v9

  visual:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npm run test:visual
      - uses: percy/cli@v1
        with:
          version: 1.0.0-beta.70
```

---

## Part 7: Quality Gates & Success Criteria

### Code Coverage Targets

```
Target Coverage by Deadline:

Week 4:  30% (Utils + API + Core components)
Week 6:  60% (All unit + integration tests)
Week 8:  80%+ (Added E2E + edge cases)
```

### Performance Budget

| Metric | Target | Threshold |
|--------|--------|-----------|
| LCP | < 1.5s | Budget: 1.5-2.0s |
| FID | < 100ms | Budget: 100-150ms |
| CLS | < 0.1 | Budget: 0.1-0.15 |
| TTI | < 2.5s | Budget: 2.5-3s |
| Coverage | 80%+ | Minimum: 75% |

### Accessibility Requirements

- WCAG 2.1 AA compliance (minimum)
- WCAG 2.1 AAA compliance (target)
- 100/100 Lighthouse Accessibility score
- No axe violations in automated tests

---

## Part 8: Quick Wins (This Week)

**Can implement in 2-3 days**:

1. **Utils Test Suite** (DOM, Storage helpers)
   - 12 tests, high ROI, quick wins
   - Blocks nothing, unblocks all other tests

2. **API Service Tests** (with MSW mocking)
   - 8 tests covering success/failure paths
   - Critical for gallery/form features

3. **CI/CD Skeleton**
   - GitHub Actions workflow structure
   - Local test runner (npm scripts)
   - Coverage reporting setup

**Output**: 50+ unit tests, 0% → 20% coverage in week 1

---

## Part 9: Anti-Patterns & Testing Gotchas

### Avoid These Testing Mistakes

1. ❌ Testing implementation details (private methods)
   - ✅ Test behavior and outcomes only

2. ❌ Hard sleep timeouts (`await new Promise(r => setTimeout(r, 5000))`)
   - ✅ Use `waitForSelector()`, `waitForNavigation()`, explicit waits

3. ❌ Shared test state (beforeAll with side effects)
   - ✅ Isolate each test, use beforeEach cleanup

4. ❌ Flaky selectors (text matching, dynamic IDs)
   - ✅ Use `data-testid` attributes, stable selectors

5. ❌ Testing DOM state instead of user behavior
   - ✅ Test "user sees X" not "DOM contains Y"

6. ❌ Over-mocking (mocking everything)
   - ✅ Mock external APIs, use real DOM/localStorage

7. ❌ Tests that depend on execution order
   - ✅ Each test must run independently

---

## Part 10: Success Metrics & KPIs

### By Week 4

- [ ] 40+ unit tests passing
- [ ] 20%+ code coverage
- [ ] CI/CD pipeline running
- [ ] Utils + Services fully tested

### By Week 6

- [ ] 80+ unit/integration tests
- [ ] 5-8 E2E tests passing
- [ ] 60%+ code coverage
- [ ] Performance budgets established

### By Week 8

- [ ] 100+ total tests
- [ ] 80%+ code coverage
- [ ] All critical paths E2E tested
- [ ] Zero accessibility violations
- [ ] Visual regressions tracked

---

## References & Resources

### Testing Frameworks
- Vitest: https://vitest.dev
- Playwright: https://playwright.dev
- Percy: https://percy.io
- Lighthouse: https://github.com/GoogleChrome/lighthouse-ci

### Best Practices
- Testing Trophy: https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications
- JavaScript Testing Best Practices: https://github.com/goldbergyoni/javascript-testing-best-practices
- Playwright Best Practices: https://playwright.dev/docs/best-practices

### Accessibility
- WCAG 2.1 Standards: https://www.w3.org/WAI/WCAG21/quickref/
- axe-core: https://github.com/dequelabs/axe-core
- Pa11y: https://pa11y.org

---

**Document Version**: 1.0 | **Last Updated**: 2024-11-28 | **Status**: Ready for Implementation
