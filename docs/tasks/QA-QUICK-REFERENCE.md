# QA Testing - Quick Reference Guide

**Location**: `/Users/denysmalyshev/Workspace/Projects/petprojects/branchstone/`

---

## 📋 Main Documentation Files

### 1. QA-EXECUTIVE-SUMMARY.md (START HERE)
**Best for**: Stakeholders, project managers, high-level overview
**Contents**:
- Current state & risks (0% coverage)
- Proposed solution & timeline
- Top 10 critical tests
- Success criteria & metrics
- Cost-benefit analysis
**Read time**: 10 minutes

### 2. QA-STRATEGY-001-testing-plan.md (FOR ARCHITECTS)
**Best for**: QA leads, tech leads, test framework selection
**Contents**:
- Comprehensive testing gap analysis
- Framework recommendations with rationale
- Test coverage roadmap (0% → 80%)
- Complete test design for all categories
- 8-week implementation roadmap
- Anti-patterns & testing gotchas
- Quality gates & metrics
**Read time**: 30-40 minutes

### 3. QA-TASKS-001-implementation.md (FOR DEVELOPERS)
**Best for**: QA automation engineers, test writers
**Contents**:
- 28 detailed implementation tasks
- Acceptance criteria for each task
- Code examples & test templates
- Dependencies & effort estimates
- Task breakdown by phase
- npm scripts reference
**Read time**: 45-60 minutes

### 4. tests/README.md (FOR TESTERS)
**Best for**: Test execution, debugging, local development
**Contents**:
- Quick start guide
- Test execution commands
- Test category explanations
- Mock setup & debugging tips
- Writing tests best practices
- Performance troubleshooting
**Read time**: 20-30 minutes

---

## 🎯 Key Numbers at a Glance

### Coverage Targets
```
Week 1:   50 tests   →  5% coverage
Week 2:  100 tests   → 15% coverage (Quick wins)
Week 4:  150 tests   → 55% coverage
Week 6:  200 tests   → 80% coverage (TARGET)
Week 8:  220 tests   → 85% coverage
```

### Test Distribution
```
Unit Tests:        120+ tests (60%)
Integration Tests:  30+ tests (15%)
E2E Tests:          16+ tests (8%)
Accessibility:      20+ tests (10%)
Visual Regression:  15+ tests (7%)
─────────────────────────────
TOTAL:            220+ tests
```

### Timeline
```
Phase 1: Foundation (Weeks 1-2)
├─ Utils, API, Setup
├─ 50 tests, 20% coverage

Phase 2: Components (Weeks 3-4)
├─ Unit tests for all components
├─ 150 tests, 55% coverage

Phase 3: Integration (Weeks 4-5)
├─ Component interactions
├─ 180 tests, 70% coverage

Phase 4: E2E (Weeks 5-6)
├─ Critical user paths
├─ 200 tests, 80% coverage

Phase 5: Performance & A11y (Weeks 6-7)
├─ Lighthouse, axe-core
├─ 210 tests, 82% coverage

Phase 6: Polish (Week 8)
├─ Optimization, documentation
├─ 220 tests, 85%+ coverage
```

---

## 🛠️ Testing Framework Stack

### Core Frameworks

| Framework | Purpose | Language | ROI | Status |
|-----------|---------|----------|-----|--------|
| **Vitest** | Unit & Integration | JavaScript | ⭐⭐⭐⭐⭐ | Free |
| **Playwright** | E2E & Visual | JavaScript | ⭐⭐⭐⭐ | Free |
| **MSW** | API Mocking | JavaScript | ⭐⭐⭐⭐⭐ | Free |
| **axe-core** | Accessibility | JavaScript | ⭐⭐⭐⭐ | Free |
| **Lighthouse** | Performance | CLI | ⭐⭐⭐⭐⭐ | Free |
| **Percy** | Visual Regression | Cloud | ⭐⭐⭐⭐ | $99/mo (free OSS) |

### Cost
**Total**: Free (except optional Percy at $99/month)

---

## 📁 File Locations

### Documentation (Read Order)
```
docs/tasks/
├── QA-EXECUTIVE-SUMMARY.md           ← START HERE (10 min)
├── QA-STRATEGY-001-testing-plan.md   ← DETAILED PLAN (40 min)
├── QA-TASKS-001-implementation.md    ← TASK BREAKDOWN (60 min)
└── QA-QUICK-REFERENCE.md             ← This file
```

### Test Infrastructure
```
tests/
├── README.md                  ← How to run tests
├── setup.js                   ← Vitest environment
├── vitest.config.js          ← Unit/integration config
├── playwright.config.js      ← E2E config
├── mocks/
│   ├── handlers.js            ← API mock data
│   ├── server.js              ← Vitest MSW setup
│   └── browser.js             ← E2E MSW setup
├── unit/
│   ├── components/            ← Component logic tests
│   ├── services/              ← API service tests
│   └── utils/                 ← Utility function tests
├── integration/               ← Component interaction tests
├── e2e/                       ← Complete user flow tests
├── accessibility/             ← WCAG compliance tests
├── visual/                    ← Visual regression tests
└── performance/               ← Lighthouse config
```

### CI/CD (GitHub Actions)
```
.github/workflows/
├── test.yml                   ← Unit + integration tests
├── e2e.yml                    ← E2E tests
├── performance.yml            ← Lighthouse CI
└── accessibility.yml          ← a11y tests
```

---

## 🚀 Quick Commands

### Local Testing
```bash
# Watch mode (auto-rerun on changes)
npm run test:watch

# Run specific test file
npm test -- dom.test.js

# Coverage report
npm run test:coverage

# View in browser
open coverage/index.html
```

### E2E Testing
```bash
# Run all E2E tests
npm run test:e2e

# Run with visible browser
npm run test:e2e -- --headed

# Interactive mode (step through)
npm run test:e2e:ui
```

### Performance
```bash
# Run Lighthouse
npm run lighthouse

# Against live site
lighthouse https://branchstone.art
```

### All Tests
```bash
# Full suite
npm test && npm run test:e2e

# With coverage
npm run test:coverage
```

---

## 🎓 Top 10 Tests to Implement First

### Quick Wins (Implement Week 1)

1. **DOM Utility Tests** (1 day)
   ```
   tests/unit/utils/dom.test.js
   Tests: 15+
   Functions: $, $$, createElement, on, setAttributes
   ROI: 100% (foundation)
   ```

2. **Storage Utility Tests** (1 day)
   ```
   tests/unit/utils/storage.test.js
   Tests: 12+
   Functions: setStorageItem, getStorageItem, removeStorageItem
   ROI: High
   ```

3. **API Service Tests** (2 days)
   ```
   tests/unit/services/api.test.js
   Tests: 20+
   Coverage: Success, 400/404/500 errors, network errors
   ROI: Critical
   ```

### Core Features (Implement Week 2-3)

4. **FormValidator Component** (2 days)
   ```
   tests/unit/components/FormValidator.test.js
   Tests: 15+
   Coverage: Email validation, required fields, error display
   ROI: Critical (contact form)
   ```

5. **Gallery Component** (2 days)
   ```
   tests/unit/components/Gallery.test.js
   Tests: 20+
   Coverage: API loading, skeleton loaders, error handling
   ROI: Critical (main feature)
   ```

6. **Gallery + Lightbox Integration** (2 days)
   ```
   tests/integration/gallery-lightbox.test.js
   Tests: 12+
   Coverage: Click to open, navigation, keyboard control
   ROI: Critical
   ```

### User Journeys (Implement Week 4-5)

7. **Gallery Browsing E2E** (2 days)
   ```
   tests/e2e/gallery-browsing.spec.js
   Tests: 6
   Scenarios: Load → Filter → View → Lightbox → Close
   ROI: High (regression prevention)
   ```

8. **Contact Form E2E** (1.5 days)
   ```
   tests/e2e/contact-form.spec.js
   Tests: 4
   Scenarios: Fill → Validate → Submit → Success
   ROI: Critical (business feature)
   ```

9. **Theme & Language E2E** (1.5 days)
   ```
   tests/e2e/theme-language.spec.js
   Tests: 3
   Scenarios: Toggle theme → Persist → Switch language
   ROI: High
   ```

10. **Accessibility Audit** (1.5 days)
    ```
    tests/accessibility/a11y.test.js
    Tests: 20+
    Coverage: WCAG 2.1 AA/AAA compliance
    ROI: Legal + user inclusion
    ```

---

## 📊 Test Coverage by Component

### Target Coverage

```
Component               Unit  Integration  E2E  Accessibility  Total
─────────────────────────────────────────────────────────────────
utils/dom.js           100%      -          -      -           100%
utils/storage.js       100%      -          -      -           100%
services/api.js        100%      95%        100%   -           100%
FormValidator.js       95%       90%        100%   100%         95%
Gallery.js             90%       85%        100%   95%          90%
Lightbox.js            80%       85%        100%   95%          85%
Menu.js                80%       80%        100%   95%          85%
Theme.js               95%       90%        100%   -            95%
Carousel.js            80%       75%        -      90%          80%
GalleryFilter.js       80%       80%        100%   -            80%
Animations.js          75%       70%        -      -            75%
i18n.js                85%       80%        100%   -            85%
─────────────────────────────────────────────────────────────────
OVERALL                87%       82%        100%   95%          80%+
```

---

## ✅ Success Metrics

### Code Quality
- [ ] 80%+ overall coverage
- [ ] 100% coverage for utils, services
- [ ] 90%+ coverage for critical components
- [ ] Zero code coverage regressions

### Test Execution
- [ ] Unit tests < 5 seconds
- [ ] All tests < 2 minutes locally
- [ ] CI/CD < 15 minutes total
- [ ] Zero flaky tests

### Quality Gates
- [ ] All tests passing on PR
- [ ] Performance budgets met
- [ ] Zero accessibility violations
- [ ] No console errors/warnings

### User Experience
- [ ] LCP < 1.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] 100/100 Lighthouse Accessibility

---

## 🔍 Testing Concepts Quick Glossary

### Test Types

**Unit Test**: Tests single function/component in isolation
```javascript
test('$() returns element', () => {
  const el = $('#test');
  expect(el).toBeTruthy();
});
```

**Integration Test**: Tests multiple components working together
```javascript
test('Gallery + Lightbox opens on click', async () => {
  const gallery = new Gallery();
  gallery.render(artworks);
  document.querySelector('.gallery-item').click();
  expect(lightbox.isOpen).toBe(true);
});
```

**E2E Test**: Tests complete user journey in real browser
```javascript
test('user views artwork in lightbox', async ({ page }) => {
  await page.goto('/gallery.html');
  await page.click('.gallery-item');
  await expect(page.locator('#lightbox')).toBeVisible();
});
```

**Accessibility Test**: Tests WCAG 2.1 compliance
```javascript
test('form has proper ARIA labels', async ({ page }) => {
  await injectAxe(page);
  await checkA11y(page);
});
```

### Test Layers (Testing Pyramid)

```
          △ E2E Tests (5-10 tests, slow but valuable)
         /|\
        / | \
       /  |  \
      / Integration \ (20-30 tests)
     /    |    \
    / Unit Tests \ (100+ tests, fast)
   /_______|_____\
```

### Test Structure (Given-When-Then)

```javascript
test('user can filter gallery by category', async ({ page }) => {
  // Given: Gallery is loaded
  await page.goto('/gallery.html');

  // When: User clicks "Nature" filter
  await page.click('button:has-text("Nature")');

  // Then: Only nature artworks are shown
  const items = await page.locator('[data-category="nature"]').count();
  expect(items).toBeGreaterThan(0);
});
```

---

## 🐛 Common Issues & Solutions

### Issue: Tests Timeout
**Solution**: Use explicit waits instead of timeouts
```javascript
// ❌ BAD
await new Promise(r => setTimeout(r, 2000));

// ✅ GOOD
await page.waitForSelector('.loaded');
```

### Issue: Flaky Tests
**Solution**: Ensure test isolation, no shared state
```javascript
// ❌ BAD - Shared state
let gallery;
describe('Gallery', () => {
  before(() => { gallery = new Gallery(); });
  // All tests use same gallery instance
});

// ✅ GOOD - Fresh instance per test
describe('Gallery', () => {
  beforeEach(() => { gallery = new Gallery(); });
  // Fresh instance for each test
});
```

### Issue: API Tests Fail
**Solution**: Verify MSW handlers are set up
```javascript
// Check tests/mocks/handlers.js exists
// Check beforeAll(() => server.listen()) in tests/setup.js
// Check URL matches in handlers
```

---

## 📞 Getting Help

### Documentation (Priority Order)
1. **tests/README.md** - How to run tests locally
2. **QA-STRATEGY-001-testing-plan.md** - Test design guide
3. **QA-TASKS-001-implementation.md** - Task breakdowns
4. Framework docs: Vitest, Playwright, MSW

### Common Tasks

**Write a unit test**
→ See tests/unit/utils/dom.test.js example
→ Follow Given-When-Then structure

**Debug flaky E2E test**
→ Run with `--headed` flag to see browser
→ Use `page.screenshot()` to debug visual state

**View test coverage**
→ Run `npm run test:coverage`
→ Open `coverage/index.html` in browser

---

## 🎬 Getting Started (Next 3 Days)

### Day 1: Setup
1. Read QA-EXECUTIVE-SUMMARY.md (10 min)
2. Create test directory structure (5 min)
3. Install dependencies: `npm install --save-dev vitest playwright msw` (5 min)
4. Review tests/README.md (15 min)
5. **Status**: Infrastructure ready

### Day 2: Foundation Tests
1. Write DOM utility tests (3-4 hours)
2. Write Storage utility tests (2-3 hours)
3. **Output**: 27 tests, 20% coverage
4. **Time**: 6-7 hours

### Day 3: API Service
1. Setup MSW mocking (1-2 hours)
2. Write API service tests (3-4 hours)
3. Get all tests passing (1 hour)
4. **Output**: 50+ tests, 30% coverage
5. **Time**: 5-7 hours

### Status After 3 Days
- [ ] Infrastructure ready
- [ ] 50+ tests passing
- [ ] 30% coverage achieved
- [ ] CI/CD skeleton in place
- [ ] Foundation for all future tests

---

## 📈 Progress Tracking

### Weekly Checklist

**Week 1**
- [ ] Framework setup complete
- [ ] Utils tests done (27 tests)
- [ ] MSW mocking working
- [ ] npm test scripts created
- [ ] Target: 50 tests, 20% coverage

**Week 2**
- [ ] API service tests done
- [ ] FormValidator tests done
- [ ] GitHub Actions workflow set up
- [ ] Coverage reporting enabled
- [ ] Target: 100 tests, 40% coverage

**Weeks 3-4**
- [ ] All component unit tests
- [ ] Integration tests
- [ ] Target: 150 tests, 60% coverage

**Weeks 5-6**
- [ ] E2E critical path tests
- [ ] Lighthouse CI setup
- [ ] axe-core accessibility tests
- [ ] Target: 200 tests, 80% coverage

**Week 7**
- [ ] Visual regression tests
- [ ] Performance tuning
- [ ] Flaky test fixes
- [ ] Target: 220 tests, 85% coverage

**Week 8**
- [ ] Documentation complete
- [ ] Team training
- [ ] Go live
- [ ] Final: 220+ tests, 85%+ coverage

---

## 💾 File Reference

### Configuration Files to Create

```javascript
// vitest.config.js
export default {
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    coverage: { ... }
  }
}

// playwright.config.js
export default {
  webServer: { url: 'http://localhost:8000' },
  use: { baseURL: 'http://localhost:8000' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ]
}
```

### npm Scripts to Add

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
    "test:a11y": "vitest tests/accessibility/",
    "serve": "python -m http.server 8000 -d docs"
  }
}
```

---

**Last Updated**: 2024-11-28 | **Version**: 1.0 | **Status**: Ready to Use

For detailed information, refer to the comprehensive planning documents:
- **QA-EXECUTIVE-SUMMARY.md** - Overview & timeline
- **QA-STRATEGY-001-testing-plan.md** - Detailed strategy
- **QA-TASKS-001-implementation.md** - Task breakdowns
- **tests/README.md** - How to run tests
