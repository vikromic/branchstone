# QA Automation Tasks: Implementation Roadmap

## Project Overview

**Goal**: Establish comprehensive test automation infrastructure for Branchstone Art Portfolio
**Scope**: 0% → 80%+ test coverage across 10 JavaScript components
**Timeline**: 8 weeks (18-24 days effort)
**Team**: 1 QA Automation Engineer

---

## Task Breakdown by Phase

### PHASE 1: Foundation & Setup (Weeks 1-2)

#### Task 1.1: Project Setup & Framework Installation

**Description**: Initialize Vitest, Playwright, and testing dependencies
**Acceptance Criteria**:
- [ ] `package.json` has all testing dependencies
- [ ] Vitest configured with ES6 module support
- [ ] Playwright browsers installed
- [ ] npm scripts for test execution created
- [ ] GitHub Actions template created

**Dependencies**: None (first task)

**Effort**: 1 day

**Files to Create**:
```
tests/
├── setup.js                    # Test environment setup
├── vitest.config.js           # Vitest configuration
└── playwright.config.js       # Playwright configuration

.github/workflows/
├── test.yml                   # CI/CD test workflow
└── performance.yml            # Lighthouse CI workflow
```

**Steps**:
1. Install packages: `npm install --save-dev vitest @vitest/ui msw @playwright/test @percy/playwright axe-playwright`
2. Create `tests/setup.js` - DOM/localStorage polyfills
3. Configure `vitest.config.js` - ESM, globals, coverage thresholds
4. Configure `playwright.config.js` - baseURL, timeouts, browsers
5. Create npm scripts in `package.json`:
   ```json
   "test": "vitest",
   "test:ui": "vitest --ui",
   "test:coverage": "vitest --coverage",
   "test:e2e": "playwright test",
   "test:visual": "playwright test --grep @visual"
   ```
6. Create `.github/workflows/test.yml` - GitHub Actions workflow

**Resources**:
- Vitest Setup: https://vitest.dev/guide/
- Playwright Config: https://playwright.dev/docs/test-configuration
- MSW Setup: https://mswjs.io/docs/getting-started

---

#### Task 1.2: DOM Utilities Test Suite

**Description**: Write comprehensive tests for `js/utils/dom.js` functions
**Acceptance Criteria**:
- [ ] All DOM utility functions have unit tests
- [ ] Tests cover success and error paths
- [ ] 100% coverage for dom.js
- [ ] No external API calls in tests

**Dependencies**: Task 1.1 (Framework setup)

**Effort**: 1 day

**File to Create**: `tests/unit/utils/dom.test.js` (80-100 lines)

**Test Cases** (Already provided in strategy document):

```javascript
// tests/unit/utils/dom.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { $, $$, on, createElement, setAttributes } from '../../../docs/js/utils/dom.js';

describe('DOM Utils - $()', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should return element by ID selector', () => {
    document.body.innerHTML = '<div id="test">content</div>';
    const el = $('#test');
    expect(el).toBeTruthy();
    expect(el.id).toBe('test');
  });

  it('should return null for non-existent selector', () => {
    const el = $('#nonexistent');
    expect(el).toBeNull();
  });

  it('should support context parameter', () => {
    document.body.innerHTML = '<div id="parent"><span id="child">text</span></div>';
    const parent = $('#parent');
    const child = $('#child', parent);
    expect(child.textContent).toBe('text');
  });
});

describe('DOM Utils - $$()', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should return array of elements', () => {
    document.body.innerHTML = '<div class="item">1</div><div class="item">2</div>';
    const items = $$('.item');
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(2);
  });

  it('should return empty array when no matches', () => {
    const items = $$('.nonexistent');
    expect(items).toEqual([]);
  });
});

describe('DOM Utils - createElement()', () => {
  it('should create element with attributes', () => {
    const el = createElement('button', { className: 'btn', id: 'submit' }, 'Click');
    expect(el.tagName).toBe('BUTTON');
    expect(el.className).toBe('btn');
    expect(el.id).toBe('submit');
    expect(el.textContent).toBe('Click');
  });

  it('should support dataset attributes', () => {
    const el = createElement('div', { dataset: { action: 'test', id: '123' } });
    expect(el.dataset.action).toBe('test');
    expect(el.dataset.id).toBe('123');
  });

  it('should support multiple children', () => {
    const el = createElement('div', {}, [
      createElement('span', {}, 'Child 1'),
      createElement('span', {}, 'Child 2')
    ]);
    expect(el.children.length).toBe(2);
  });
});

describe('DOM Utils - on()', () => {
  it('should attach event listener', () => {
    const el = document.createElement('button');
    const handler = vi.fn();
    on(el, 'click', handler);

    el.click();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should return cleanup function', () => {
    const el = document.createElement('button');
    const handler = vi.fn();
    const cleanup = on(el, 'click', handler);

    el.click();
    expect(handler).toHaveBeenCalledTimes(1);

    cleanup();
    el.click();
    expect(handler).toHaveBeenCalledTimes(1); // Not incremented
  });

  it('should handle null element gracefully', () => {
    const cleanup = on(null, 'click', () => {});
    expect(typeof cleanup).toBe('function');
    expect(() => cleanup()).not.toThrow();
  });
});

describe('DOM Utils - setAttributes()', () => {
  it('should set attributes on element', () => {
    const el = document.createElement('div');
    setAttributes(el, { 'aria-label': 'Test', 'data-id': '123' });

    expect(el.getAttribute('aria-label')).toBe('Test');
    expect(el.getAttribute('data-id')).toBe('123');
  });

  it('should support multiple attributes', () => {
    const el = document.createElement('div');
    setAttributes(el, { role: 'button', tabindex: '0', 'aria-pressed': 'false' });

    expect(el.getAttribute('role')).toBe('button');
    expect(el.getAttribute('tabindex')).toBe('0');
    expect(el.getAttribute('aria-pressed')).toBe('false');
  });
});
```

**Verification**:
```bash
npm test tests/unit/utils/dom.test.js
# Expected: 15+ tests passing, 100% coverage
```

---

#### Task 1.3: Storage Utilities Test Suite

**Description**: Write tests for `js/utils/storage.js` functions
**Acceptance Criteria**:
- [ ] All storage functions tested
- [ ] Tests for localStorage quota exceeded
- [ ] Tests for invalid JSON
- [ ] 100% coverage for storage.js

**Dependencies**: Task 1.1 (Framework setup)

**Effort**: 1 day

**File to Create**: `tests/unit/utils/storage.test.js` (70-80 lines)

**Test Cases**:

```javascript
// tests/unit/utils/storage.test.js
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setStorageItem, getStorageItem, removeStorageItem } from '../../../docs/js/utils/storage.js';

describe('Storage Utils', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('setStorageItem() & getStorageItem()', () => {
    it('should store and retrieve object', () => {
      const data = { name: 'Victoria', age: 30 };
      setStorageItem('user', data);

      const retrieved = getStorageItem('user');
      expect(retrieved).toEqual(data);
    });

    it('should store and retrieve string', () => {
      setStorageItem('message', 'Hello World');
      expect(getStorageItem('message')).toBe('Hello World');
    });

    it('should store and retrieve number', () => {
      setStorageItem('count', 42);
      expect(getStorageItem('count')).toBe(42);
    });

    it('should return null for non-existent key', () => {
      expect(getStorageItem('nonexistent')).toBeNull();
    });

    it('should handle complex nested objects', () => {
      const data = {
        user: {
          profile: {
            name: 'Victoria',
            artwork: ['art1', 'art2']
          }
        }
      };
      setStorageItem('complex', data);
      expect(getStorageItem('complex')).toEqual(data);
    });
  });

  describe('removeStorageItem()', () => {
    it('should delete key from storage', () => {
      setStorageItem('temp', 'value');
      expect(getStorageItem('temp')).toBe('value');

      removeStorageItem('temp');
      expect(getStorageItem('temp')).toBeNull();
    });

    it('should not throw for non-existent key', () => {
      expect(() => removeStorageItem('nonexistent')).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON gracefully', () => {
      localStorage.setItem('bad', 'not {valid json}');
      const result = getStorageItem('bad');

      expect(result).toBeNull();
    });

    it('should handle quota exceeded error', () => {
      // Mock localStorage.setItem to throw
      const originalSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = vi.fn(() => {
        throw new DOMException('QuotaExceededError');
      });

      expect(() => setStorageItem('test', 'value')).toThrow();

      Storage.prototype.setItem = originalSetItem;
    });
  });
});
```

**Verification**:
```bash
npm test tests/unit/utils/storage.test.js
# Expected: 12+ tests passing, 100% coverage
```

---

### PHASE 2: API & Services Testing (Weeks 2-3)

#### Task 2.1: Setup MSW (Mock Service Worker)

**Description**: Configure MSW for API mocking across all tests
**Acceptance Criteria**:
- [ ] MSW server configured for both Node (unit tests) and Browser (E2E)
- [ ] Mock handlers for all API endpoints created
- [ ] Test utilities for API mocking created
- [ ] Network interception working in Vitest

**Dependencies**: Task 1.1 (Framework setup)

**Effort**: 1.5 days

**Files to Create**:
```
tests/mocks/
├── handlers.js        # MSW request handlers
├── server.js          # MSW server setup (Node)
└── browser.js         # MSW server setup (Browser)
```

**Implementation**:

```javascript
// tests/mocks/handlers.js
import { http, HttpResponse } from 'msw';
import CONFIG from '../../docs/js/config.js';

export const mockArtworks = [
  {
    id: 1,
    title: 'Artwork 1',
    image: '/img/art1.jpg',
    thumb: '/img/art1-thumb.jpg',
    size: '50x70cm',
    materials: 'Oil on Canvas',
    description: 'Beautiful piece',
    available: true,
    category: 'nature'
  },
  {
    id: 2,
    title: 'Artwork 2',
    image: '/img/art2.jpg',
    thumb: '/img/art2-thumb.jpg',
    size: '40x60cm',
    materials: 'Watercolor',
    description: 'Serene landscape',
    available: false,
    category: 'ethereal'
  }
];

export const mockTranslations = {
  en: {
    'gallery.title': 'Gallery',
    'gallery.filter': 'Filter',
    'contact.form': 'Contact Form'
  },
  ua: {
    'gallery.title': 'Галерея',
    'gallery.filter': 'Фільтр',
    'contact.form': 'Форма контакту'
  }
};

export const handlers = [
  // Artworks API
  http.get(CONFIG.api.artworks, () => {
    return HttpResponse.json(mockArtworks);
  }),

  // Translations API
  http.get(CONFIG.api.translations, () => {
    return HttpResponse.json(mockTranslations);
  }),

  // Contact form API
  http.post(CONFIG.api.contactForm, async ({ request }) => {
    const body = await request.json();

    // Validate
    if (!body.name || !body.email) {
      return HttpResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    return HttpResponse.json({ success: true, id: 'msg-123' });
  }),
];

// Error handlers for testing failure paths
export const errorHandlers = {
  artworksNetworkError: http.get(CONFIG.api.artworks, () => {
    return HttpResponse.error();
  }),

  artworks500Error: http.get(CONFIG.api.artworks, () => {
    return HttpResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }),

  artworks404Error: http.get(CONFIG.api.artworks, () => {
    return HttpResponse.json(
      { error: 'Not Found' },
      { status: 404 }
    );
  }),

  contactFormTimeout: http.post(CONFIG.api.contactForm, async () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(HttpResponse.json({ error: 'Timeout' }, { status: 408 }));
      }, 10000);
    });
  }),
};
```

```javascript
// tests/mocks/server.js
import { setupServer } from 'msw/node';
import { handlers } from './handlers.js';

export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Clean up after all tests
afterAll(() => server.close());
```

```javascript
// tests/mocks/browser.js
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers.js';

export const worker = setupWorker(...handlers);
```

**Vitest Configuration Update**:

```javascript
// vitest.config.js - add to existing config
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'docs/js/theme-init.js'
      ]
    }
  }
});

// tests/setup.js
import { vi } from 'vitest';
import { server } from './mocks/server.js';

// Enable API mocking
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock fetch if needed (usually not required with MSW)
global.fetch = vi.fn();
```

**Verification**:
```bash
npm test tests/ -- --reporter=verbose
# Expected: Setup completes without errors
```

---

#### Task 2.2: API Service Unit Tests

**Description**: Write comprehensive tests for `js/services/api.js`
**Acceptance Criteria**:
- [ ] Tests for all API methods (artworksAPI, translationsAPI, contactAPI)
- [ ] Success and failure paths tested
- [ ] HTTP error codes handled (400, 404, 500, 503)
- [ ] Network errors handled
- [ ] 100% coverage for api.js

**Dependencies**: Task 2.1 (MSW setup)

**Effort**: 2 days

**File to Create**: `tests/unit/services/api.test.js` (150-180 lines)

**Test Cases**:

```javascript
// tests/unit/services/api.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { artworksAPI, translationsAPI, contactAPI } from '../../../docs/js/services/api.js';
import { server } from '../../mocks/server.js';
import { http, HttpResponse } from 'msw';
import CONFIG from '../../../docs/js/config.js';
import { mockArtworks, mockTranslations, errorHandlers } from '../../mocks/handlers.js';

describe('Artworks API', () => {
  describe('getAll()', () => {
    it('should fetch all artworks', async () => {
      const artworks = await artworksAPI.getAll();

      expect(Array.isArray(artworks)).toBe(true);
      expect(artworks.length).toBe(mockArtworks.length);
      expect(artworks[0].title).toBe('Artwork 1');
    });

    it('should handle network error', async () => {
      server.use(errorHandlers.artworksNetworkError);

      await expect(artworksAPI.getAll()).rejects.toThrow();
    });

    it('should handle HTTP 500 error', async () => {
      server.use(errorHandlers.artworks500Error);

      await expect(artworksAPI.getAll()).rejects.toThrow('HTTP error');
    });

    it('should handle HTTP 404 error', async () => {
      server.use(errorHandlers.artworks404Error);

      await expect(artworksAPI.getAll()).rejects.toThrow('HTTP error');
    });
  });

  describe('getFeatured(count)', () => {
    it('should return limited artworks', async () => {
      const featured = await artworksAPI.getFeatured(1);

      expect(Array.isArray(featured)).toBe(true);
      expect(featured.length).toBe(1);
      expect(featured[0]).toEqual(mockArtworks[0]);
    });

    it('should use default count from CONFIG', async () => {
      const featured = await artworksAPI.getFeatured();

      expect(featured.length).toBeLessThanOrEqual(CONFIG.ui.gallery.featuredCount);
    });

    it('should return empty array when count is 0', async () => {
      const featured = await artworksAPI.getFeatured(0);

      expect(featured).toEqual([]);
    });

    it('should handle count larger than available', async () => {
      const featured = await artworksAPI.getFeatured(100);

      expect(featured.length).toBe(mockArtworks.length);
    });
  });

  describe('getById(id)', () => {
    it('should return artwork by ID', async () => {
      const artwork = await artworksAPI.getById(1);

      expect(artwork).toBeTruthy();
      expect(artwork.id).toBe(1);
      expect(artwork.title).toBe('Artwork 1');
    });

    it('should return null for missing ID', async () => {
      const artwork = await artworksAPI.getById(999);

      expect(artwork).toBeNull();
    });

    it('should handle zero as ID', async () => {
      const artwork = await artworksAPI.getById(0);

      expect(artwork).toBeNull();
    });
  });
});

describe('Translations API', () => {
  describe('getAll()', () => {
    it('should fetch all translations', async () => {
      const translations = await translationsAPI.getAll();

      expect(translations).toEqual(mockTranslations);
      expect(translations.en).toBeTruthy();
      expect(translations.ua).toBeTruthy();
    });

    it('should handle network error', async () => {
      server.use(http.get(CONFIG.api.translations, () => HttpResponse.error()));

      await expect(translationsAPI.getAll()).rejects.toThrow();
    });
  });

  describe('getLanguage(lang)', () => {
    it('should return translations for specific language', async () => {
      const translations = await translationsAPI.getLanguage('en');

      expect(translations).toEqual(mockTranslations.en);
    });

    it('should fallback to default language', async () => {
      const translations = await translationsAPI.getLanguage('fr');

      expect(translations).toEqual(mockTranslations[CONFIG.language.default]);
    });

    it('should handle missing language gracefully', async () => {
      const translations = await translationsAPI.getLanguage('nonexistent');

      expect(translations).toBeTruthy();
    });
  });
});

describe('Contact API', () => {
  describe('submit(data)', () => {
    it('should submit contact form', async () => {
      const formData = {
        name: 'John Doe',
        email: 'john@example.com',
        message: 'I love your work!'
      };

      const result = await contactAPI.submit(formData);

      expect(result.success).toBe(true);
    });

    it('should reject incomplete form data', async () => {
      server.use(
        http.post(CONFIG.api.contactForm, () => {
          return HttpResponse.json(
            { error: 'Missing required fields' },
            { status: 400 }
          );
        })
      );

      const result = contactAPI.submit({ name: 'John' });

      await expect(result).rejects.toThrow('Form submission failed');
    });

    it('should handle HTTP 500 error', async () => {
      server.use(
        http.post(CONFIG.api.contactForm, () => {
          return HttpResponse.json(
            { error: 'Server error' },
            { status: 500 }
          );
        })
      );

      await expect(contactAPI.submit({})).rejects.toThrow('Form submission failed');
    });

    it('should handle network timeout', async () => {
      server.use(
        http.post(CONFIG.api.contactForm, async () => {
          await new Promise(resolve => setTimeout(resolve, 10000));
          return HttpResponse.json({ success: true });
        })
      );

      // Should reject due to test timeout
      const promise = contactAPI.submit({});
      await expect(promise).rejects.toThrow();
    });

    it('should send POST request with correct headers', async () => {
      let capturedRequest = null;

      server.use(
        http.post(CONFIG.api.contactForm, async ({ request }) => {
          capturedRequest = request;
          return HttpResponse.json({ success: true });
        })
      );

      await contactAPI.submit({ name: 'Test' });

      expect(capturedRequest.headers.get('Content-Type')).toBe('application/json');
      expect(capturedRequest.method).toBe('POST');
    });
  });
});

describe('API Error Logging', () => {
  it('should log API errors to console', async () => {
    const consoleSpy = vi.spyOn(console, 'error');

    server.use(errorHandlers.artworks500Error);

    try {
      await artworksAPI.getAll();
    } catch (e) {
      // Expected error
    }

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
```

**Verification**:
```bash
npm test tests/unit/services/api.test.js
# Expected: 20+ tests passing, 100% coverage for api.js
```

---

### PHASE 3: Component Unit Tests (Weeks 3-4)

#### Task 3.1: FormValidator Component Unit Tests

**Description**: Write unit tests for form validation logic
**Acceptance Criteria**:
- [ ] All validation methods tested
- [ ] Required field validation
- [ ] Email format validation
- [ ] Custom validator support
- [ ] Error display logic tested
- [ ] ARIA attributes tested
- [ ] 95%+ coverage for FormValidator.js

**Dependencies**: Task 1.1, Task 2.1 (Framework setup)

**Effort**: 2 days

**File to Create**: `tests/unit/components/FormValidator.test.js` (220-250 lines)

**Test Cases** (Already provided in strategy document)

---

#### Task 3.2: Theme Component Unit Tests

**Description**: Test theme manager and dark mode functionality
**Acceptance Criteria**:
- [ ] System preference detection
- [ ] Theme toggle functionality
- [ ] localStorage persistence
- [ ] CSS class management
- [ ] Media query matching
- [ ] 100% coverage for Theme.js

**Dependencies**: Task 1.1 (Framework setup)

**Effort**: 1 day

**File to Create**: `tests/unit/components/Theme.test.js` (100-120 lines)

---

#### Task 3.3: Gallery Component Unit Tests

**Description**: Test gallery loading, rendering, and error handling
**Acceptance Criteria**:
- [ ] Gallery initialization
- [ ] API integration with mocked data
- [ ] Skeleton loader management
- [ ] Error state rendering
- [ ] Keyboard navigation
- [ ] Lazy loading setup
- [ ] Image rendering logic
- [ ] 90%+ coverage for Gallery.js

**Dependencies**: Task 2.1, Task 2.2 (MSW setup + API tests)

**Effort**: 2 days

**File to Create**: `tests/unit/components/Gallery.test.js` (280-320 lines)

---

#### Task 3.4: Other Component Unit Tests

**Description**: Add unit tests for remaining components
**Acceptance Criteria**:
- [ ] Menu.js - Mobile menu toggle, keyboard trap, focus management
- [ ] Lightbox.js - Navigation, state management (covered in integration)
- [ ] GalleryFilter.js - Category filtering, visible toggle
- [ ] Carousel.js - Auto-play, navigation, loop behavior
- [ ] Animations.js - IntersectionObserver, refresh logic

**Dependencies**: Task 1.1 (Framework setup)

**Effort**: 2-3 days

**Files to Create**:
- `tests/unit/components/Menu.test.js`
- `tests/unit/components/GalleryFilter.test.js`
- `tests/unit/components/Carousel.test.js`
- `tests/unit/components/Animations.test.js`

---

### PHASE 4: Integration Tests (Weeks 4-5)

#### Task 4.1: App Bootstrap Integration Test

**Description**: Test app initialization and component lifecycle
**Acceptance Criteria**:
- [ ] All core components initialize
- [ ] Page-specific components load correctly
- [ ] Component cleanup on destroy
- [ ] Smooth scroll initialization
- [ ] Animation failsafe

**Dependencies**: Task 1.1, Task 2.1 (Framework setup)

**Effort**: 1.5 days

**File to Create**: `tests/integration/app-bootstrap.test.js` (120-150 lines)

---

#### Task 4.2: Gallery + Lightbox Integration

**Description**: Test gallery and lightbox working together
**Acceptance Criteria**:
- [ ] Clicking gallery item opens lightbox
- [ ] Lightbox shows correct artwork data
- [ ] Navigation between images
- [ ] Closing lightbox returns focus
- [ ] Keyboard navigation (arrows, escape)
- [ ] Touch gestures on mobile

**Dependencies**: Task 3.3, Task 2.1 (Gallery tests, MSW setup)

**Effort**: 2 days

**File to Create**: `tests/integration/gallery-lightbox.test.js` (200-240 lines)

---

#### Task 4.3: Contact Form Integration

**Description**: Test contact form with validation and submission
**Acceptance Criteria**:
- [ ] Form validation integration
- [ ] API submission
- [ ] Success state handling
- [ ] Error state handling
- [ ] Pre-fill from lightbox
- [ ] Accessibility features

**Dependencies**: Task 3.1, Task 2.2 (FormValidator, API tests)

**Effort**: 1.5 days

**File to Create**: `tests/integration/contact-form.test.js` (150-180 lines)

---

### PHASE 5: E2E Tests (Weeks 5-6)

#### Task 5.1: Critical User Path E2E Tests - Gallery Browsing

**Description**: E2E test for gallery discovery and viewing
**Test Scenarios**:
1. Load gallery page and view artworks
2. Filter gallery by category
3. View artwork in lightbox
4. Navigate with keyboard (arrows, escape)
5. View on mobile (responsive)

**Dependencies**: All Phase 1-4 tasks (Full app working)

**Effort**: 2 days

**File to Create**: `tests/e2e/gallery-browsing.spec.js` (250-300 lines)

---

#### Task 5.2: Critical User Path E2E Tests - Contact Form

**Description**: E2E test for contact form submission flow
**Test Scenarios**:
1. Open contact page
2. Fill form with valid data
3. Submit successfully
4. View success message
5. Validate error handling (invalid email, empty fields)
6. Mobile form interaction

**Dependencies**: All Phase 1-4 tasks

**Effort**: 1.5 days

**File to Create**: `tests/e2e/contact-form.spec.js` (200-250 lines)

---

#### Task 5.3: Critical User Path E2E Tests - Theme & Language

**Description**: E2E test for theme switching and i18n
**Test Scenarios**:
1. Toggle between light and dark theme
2. Theme persists after reload
3. Switch language on header
4. Translations update correctly
5. Verify across all pages

**Dependencies**: All Phase 1-4 tasks

**Effort**: 1.5 days

**File to Create**: `tests/e2e/theme-language.spec.js` (180-220 lines)

---

#### Task 5.4: Critical User Path E2E Tests - Mobile Menu

**Description**: E2E test for mobile navigation experience
**Test Scenarios**:
1. Mobile menu toggle open/close
2. Menu closes on navigation
3. Menu closes with escape key
4. Focus management (trap & return)
5. Responsive behavior on different viewports

**Dependencies**: All Phase 1-4 tasks

**Effort**: 1.5 days

**File to Create**: `tests/e2e/mobile-menu.spec.js` (150-180 lines)

---

### PHASE 6: Performance & Accessibility Testing (Weeks 6-7)

#### Task 6.1: Lighthouse CI Setup

**Description**: Configure performance budgets and CI integration
**Acceptance Criteria**:
- [ ] GitHub Actions workflow for Lighthouse
- [ ] Performance budgets defined (LCP, FID, CLS)
- [ ] Runs on PR and main branch
- [ ] Fails build on budget exceeded
- [ ] Historical tracking enabled

**Dependencies**: Task 1.1 (Framework setup)

**Effort**: 1 day

**Files to Create**:
- `lighthouse.config.js`
- `.github/workflows/performance.yml`

---

#### Task 6.2: Accessibility Testing with axe-core

**Description**: Automated accessibility testing for WCAG 2.1 AA/AAA
**Acceptance Criteria**:
- [ ] All pages tested with axe-core
- [ ] No critical/serious violations
- [ ] Form field labeling tested
- [ ] Color contrast verified
- [ ] Keyboard navigation tested
- [ ] Screen reader compatibility tested

**Dependencies**: Task 5.1-5.4 (E2E setup)

**Effort**: 1.5 days

**Files to Create**:
- `tests/accessibility/a11y.test.js`
- GitHub Actions workflow for a11y

---

#### Task 6.3: Mobile Responsive Testing

**Description**: Test across device viewport sizes and orientations
**Acceptance Criteria**:
- [ ] iPhone 12 (375x667)
- [ ] iPhone 12 Landscape (667x375)
- [ ] iPad (768x1024)
- [ ] Desktop (1920x1080)
- [ ] Touch interactions work correctly
- [ ] Responsive images load correctly

**Dependencies**: Task 5.1-5.4 (E2E tests)

**Effort**: 1 day

---

### PHASE 7: Visual Regression Testing (Week 7)

#### Task 7.1: Visual Regression Test Suite

**Description**: Set up Percy or BackstopJS for visual testing
**Acceptance Criteria**:
- [ ] Baseline screenshots captured
- [ ] Desktop and mobile snapshots
- [ ] Light and dark mode snapshots
- [ ] Interactive states (opened menu, lightbox)
- [ ] Regression detection on PR

**Dependencies**: Task 5.1-5.4 (Full E2E tests)

**Effort**: 1-2 days

**Files to Create**:
- `tests/visual/visual-regression.spec.js`
- Visual regression baseline images

---

### PHASE 8: CI/CD Optimization & Polish (Week 8)

#### Task 8.1: Test Execution Optimization

**Description**: Optimize test execution time and parallelization
**Acceptance Criteria**:
- [ ] Tests run in parallel (unit, integration, E2E)
- [ ] Flaky test identification and fixes
- [ ] Test caching optimized
- [ ] Total CI time < 15 minutes
- [ ] Clear test reporting

**Effort**: 1 day

---

#### Task 8.2: Coverage Report & Documentation

**Description**: Generate coverage reports and test documentation
**Acceptance Criteria**:
- [ ] Coverage report in HTML format
- [ ] 80%+ overall coverage achieved
- [ ] Per-file coverage visible
- [ ] Test execution guide documented
- [ ] Local test running instructions

**Effort**: 1 day

---

---

## Summary: Test Implementation Checklist

### Foundation (3-4 days)
- [ ] Task 1.1: Project setup
- [ ] Task 1.2: DOM utils tests
- [ ] Task 1.3: Storage utils tests

### Services (2-3 days)
- [ ] Task 2.1: MSW setup
- [ ] Task 2.2: API service tests

### Components - Unit (3-4 days)
- [ ] Task 3.1: FormValidator tests
- [ ] Task 3.2: Theme tests
- [ ] Task 3.3: Gallery tests
- [ ] Task 3.4: Other component tests

### Integration (2-3 days)
- [ ] Task 4.1: App bootstrap
- [ ] Task 4.2: Gallery + Lightbox
- [ ] Task 4.3: Contact form

### E2E Critical Paths (4-5 days)
- [ ] Task 5.1: Gallery browsing
- [ ] Task 5.2: Contact form
- [ ] Task 5.3: Theme & language
- [ ] Task 5.4: Mobile menu

### Performance & Accessibility (2-3 days)
- [ ] Task 6.1: Lighthouse CI
- [ ] Task 6.2: axe-core a11y
- [ ] Task 6.3: Mobile responsive

### Visual & Polish (2-3 days)
- [ ] Task 7.1: Visual regression
- [ ] Task 8.1: Test optimization
- [ ] Task 8.2: Coverage & docs

---

## npm Scripts Reference

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:unit": "vitest tests/unit/",
    "test:integration": "vitest tests/integration/",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:visual": "playwright test --grep @visual",
    "test:a11y": "vitest tests/accessibility/",
    "test:all": "npm run test && npm run test:e2e",
    "serve": "python -m http.server 8000 -d docs",
    "lighthouse": "lhci autorun"
  }
}
```

---

## Testing Metrics & Targets

```
Week 1:   20 tests,  5% coverage
Week 2:   50 tests,  15% coverage
Week 3:   80 tests,  35% coverage
Week 4:  100 tests,  50% coverage
Week 5:  120 tests,  65% coverage (add E2E)
Week 6:  130 tests,  75% coverage (add performance)
Week 7:  140 tests,  80% coverage
Week 8:  150 tests,  80%+ coverage (stable)
```

---

## Critical Success Factors

1. **Test Independence** - Each test must run standalone
2. **No Hard Sleeps** - Use explicit waits (waitFor*, busy-waiting with conditions)
3. **Stable Selectors** - Use `data-testid` attributes for reliable element selection
4. **Real User Behavior** - Test from user perspective, not implementation details
5. **Fast Feedback** - Run tests frequently (pre-commit hooks recommended)
6. **Clear Naming** - Test names should describe behavior in plain English

---

**Document Version**: 1.0 | **Last Updated**: 2024-11-28 | **Status**: Ready for Implementation
