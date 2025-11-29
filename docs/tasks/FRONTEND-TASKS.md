# Frontend Tasks - Branchstone Art Portfolio

**Created:** 2025-11-28
**Status:** Prioritized Backlog
**Total Tasks:** 28 tasks across 4 priority levels

---

## Priority Levels

- **P0 (Critical):** Must do - Blocks production quality or has security implications
- **P1 (High):** Should do - Significant user/developer experience improvement
- **P2 (Medium):** Nice to have - Quality of life improvements
- **P3 (Low):** Future - Strategic enhancements

## Effort Estimation

- **XS:** 1-4 hours
- **S:** 1-2 days
- **M:** 3-5 days
- **L:** 1-2 weeks
- **XL:** 3-4 weeks

---

## P0 - Critical (Must Do - Next Sprint)

### TASK-001: Add Unit & Integration Testing Framework
**Priority:** P0 | **Effort:** XL (3-4 weeks) | **Impact:** Critical

**Problem:**
Zero test coverage makes refactoring dangerous and prevents confident deployments. No automated quality checks.

**Solution:**
Implement comprehensive testing strategy with Jest (unit/integration) and Playwright (E2E).

**Implementation:**
```bash
# 1. Install dependencies
npm install --save-dev jest @jest/globals @testing-library/dom jsdom
npm install --save-dev playwright @playwright/test

# 2. Configure Jest (jest.config.js)
export default {
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less|scss)$': '<rootDir>/__mocks__/styleMock.js',
  },
  collectCoverageFrom: [
    'docs/js/**/*.js',
    '!docs/js/**/*.test.js',
    '!docs/js/artworks.json',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
};

# 3. Add test scripts to package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test"
  }
}
```

**Test Examples:**

```javascript
// __tests__/components/Gallery.test.js
import { Gallery } from '../../docs/js/components/Gallery.js';
import { artworksAPI } from '../../docs/js/services/api.js';

// Mock API
jest.mock('../../docs/js/services/api.js');

describe('Gallery Component', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'gallery';
    document.body.appendChild(container);

    artworksAPI.getAll.mockResolvedValue([
      { id: 1, title: 'Test Art', image: 'test.jpg', size: '12x12' },
    ]);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  test('renders gallery items from API data', async () => {
    const gallery = new Gallery({ containerSelector: '#gallery', type: 'full' });

    // Wait for async init
    await new Promise(resolve => setTimeout(resolve, 100));

    const items = container.querySelectorAll('.gallery-item');
    expect(items.length).toBe(1);
    expect(items[0].dataset.title).toBe('Test Art');
  });

  test('shows error message on API failure', async () => {
    artworksAPI.getAll.mockRejectedValue(new Error('Network error'));

    const gallery = new Gallery({ containerSelector: '#gallery', type: 'full' });
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(container.querySelector('.gallery-error')).toBeTruthy();
  });

  test('uses event delegation for gallery items', () => {
    const gallery = new Gallery({ containerSelector: '#gallery', type: 'full' });

    // Should have only 1 listener on container, not per-item
    const listeners = getEventListeners(container); // Chrome DevTools API
    expect(listeners.click.length).toBe(1);
  });
});
```

```javascript
// e2e/gallery.spec.js
import { test, expect } from '@playwright/test';

test.describe('Gallery Page', () => {
  test('loads gallery and opens lightbox on click', async ({ page }) => {
    await page.goto('http://localhost:3000/gallery.html');

    // Wait for gallery to load
    await expect(page.locator('.gallery-item')).toHaveCount(10, { timeout: 5000 });

    // Click first artwork
    await page.locator('.gallery-item').first().click();

    // Lightbox should open
    await expect(page.locator('#lightbox')).toBeVisible();
    await expect(page.locator('#lightbox-title')).toContainText(/[A-Za-z]/);
  });

  test('filters gallery by category', async ({ page }) => {
    await page.goto('http://localhost:3000/gallery.html');

    const initialCount = await page.locator('.gallery-item').count();

    // Click "Nature" filter
    await page.locator('.filter-btn[data-category="nature"]').click();

    // Wait for filter animation
    await page.waitForTimeout(500);

    const filteredCount = await page.locator('.gallery-item:not(.filtered-out)').count();
    expect(filteredCount).toBeLessThan(initialCount);
  });

  test('keyboard navigation works in lightbox', async ({ page }) => {
    await page.goto('http://localhost:3000/gallery.html');

    await page.locator('.gallery-item').first().click();
    await expect(page.locator('#lightbox')).toBeVisible();

    // Press Escape to close
    await page.keyboard.press('Escape');
    await expect(page.locator('#lightbox')).not.toBeVisible();
  });
});
```

**Acceptance Criteria:**
- [ ] 80%+ code coverage
- [ ] All critical user flows have E2E tests
- [ ] Tests run in CI/CD pipeline
- [ ] No breaking changes ship without failing tests

**Dependencies:** None

**Related:** TASK-002 (TypeScript helps with testing)

---

### TASK-002: Migrate to TypeScript
**Priority:** P0 | **Effort:** L (1-2 weeks) | **Impact:** High

**Problem:**
No type safety leads to runtime errors that could be caught at compile time. Refactoring is error-prone.

**Solution:**
Incremental TypeScript migration starting with utilities and services.

**Implementation:**
```bash
# 1. Install TypeScript
npm install --save-dev typescript @types/node

# 2. Create tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./docs/js",
    "allowJs": true,
    "checkJs": true
  },
  "include": ["docs/js/**/*"],
  "exclude": ["node_modules", "dist"]
}

# 3. Add build script
{
  "scripts": {
    "build": "tsc",
    "build:watch": "tsc --watch",
    "type-check": "tsc --noEmit"
  }
}
```

**Migration Strategy (Incremental):**

**Phase 1: Utilities (Week 1)**
```typescript
// docs/js/utils/dom.ts
export function $<T extends Element = Element>(
  selector: string,
  context: ParentNode = document
): T | null {
  return context.querySelector<T>(selector);
}

export function $$<T extends Element = Element>(
  selector: string,
  context: ParentNode = document
): T[] {
  return Array.from(context.querySelectorAll<T>(selector));
}

export type EventCleanup = () => void;

export function on<K extends keyof HTMLElementEventMap>(
  element: HTMLElement | Document | Window | MediaQueryList,
  event: K,
  handler: (event: HTMLElementEventMap[K]) => void,
  options?: AddEventListenerOptions | boolean
): EventCleanup {
  if (!element) return () => {};

  element.addEventListener(event, handler as EventListener, options);
  return () => element.removeEventListener(event, handler as EventListener, options);
}
```

**Phase 2: Services (Week 1)**
```typescript
// docs/js/services/api.ts
export interface Artwork {
  id: number;
  title: string;
  size: string;
  materials: string;
  description: string;
  image: string;
  thumb?: string;
  images?: string[];
  available: boolean;
  category?: string;
  price?: string;
  width?: number;
  height?: number;
  srcset?: {
    webp?: string;
    jpeg?: string;
  };
  lqip?: string;
}

export interface APIError extends Error {
  status?: number;
  statusText?: string;
}

async function fetchJSON<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error: APIError = new Error(`HTTP error! status: ${response.status}`);
      error.status = response.status;
      error.statusText = response.statusText;
      throw error;
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error (${url}):`, error);
    throw error;
  }
}

export const artworksAPI = {
  async getAll(): Promise<Artwork[]> {
    return fetchJSON<Artwork[]>(CONFIG.api.artworks);
  },

  async getFeatured(count: number = CONFIG.ui.gallery.featuredCount): Promise<Artwork[]> {
    const artworks = await this.getAll();
    return artworks.slice(0, count);
  },

  async getById(id: number): Promise<Artwork | null> {
    const artworks = await this.getAll();
    return artworks.find(artwork => artwork.id === id) || null;
  },
};
```

**Phase 3: Components (Week 2)**
```typescript
// docs/js/components/Gallery.ts
export interface GalleryOptions {
  containerSelector: string;
  type?: 'featured' | 'full';
  onLoad?: () => void;
}

export class Gallery {
  private container: HTMLElement;
  private type: 'featured' | 'full';
  private onLoadCallback?: () => void;

  constructor(options: GalleryOptions) {
    const container = $(options.containerSelector);
    if (!container) {
      throw new Error(`Container not found: ${options.containerSelector}`);
    }

    this.container = container;
    this.type = options.type || 'full';
    this.onLoadCallback = options.onLoad;

    this.setupKeyboardNavigation();
    this.init();
  }

  private async init(): Promise<void> {
    try {
      const artworks = await this.fetchArtworks();
      this.hideSkeletons();
      this.render(artworks);
      this.markGalleryLoaded();
      this.onLoadCallback?.();
    } catch (error) {
      this.hideSkeletons();
      this.renderError(error as Error);
    }
  }

  // ... rest of implementation
}
```

**Acceptance Criteria:**
- [ ] All utilities migrated to TypeScript
- [ ] All services migrated to TypeScript
- [ ] All components migrated to TypeScript
- [ ] No `any` types (strict mode)
- [ ] Type-check passes in CI/CD

**Dependencies:** None

**Related:** TASK-001 (TypeScript improves testability)

---

### TASK-003: Implement Responsive Image Pipeline
**Priority:** P0 | **Effort:** M (3-5 days) | **Impact:** High

**Problem:**
Images are served at full resolution (1920px+) even on mobile (375px). No AVIF format support. Manual optimization is error-prone.

**Expected Impact:**
- **LCP improvement:** 2.5s → 1.2s (52% faster)
- **Bandwidth savings:** 60-80% with AVIF
- **Mobile data savings:** 3-4MB per page load → 500KB

**Solution:**
Automated image generation pipeline with Sharp to create responsive srcsets in AVIF/WebP/JPEG formats.

**Implementation:**

```javascript
// scripts/generate-responsive-images.mjs
import sharp from 'sharp';
import { glob } from 'glob';
import { mkdir, access } from 'fs/promises';
import { dirname, basename, extname } from 'path';

const SIZES = [400, 800, 1200, 1920];
const FORMATS = [
  { format: 'avif', quality: 75 },
  { format: 'webp', quality: 85 },
  { format: 'jpeg', quality: 85, mozjpeg: true },
];

const INPUT_PATTERN = 'docs/img/**/*.{jpg,jpeg,png}';
const LQIP_SIZE = 40; // Low-Quality Image Placeholder

async function ensureDir(filePath) {
  const dir = dirname(filePath);
  try {
    await access(dir);
  } catch {
    await mkdir(dir, { recursive: true });
  }
}

async function generateLQIP(inputPath, outputPath) {
  await sharp(inputPath)
    .resize(LQIP_SIZE, null, { withoutEnlargement: true })
    .blur(10)
    .toFormat('jpeg', { quality: 30 })
    .toFile(outputPath);

  // Return base64 for inline embedding
  const buffer = await sharp(inputPath)
    .resize(LQIP_SIZE, null, { withoutEnlargement: true })
    .blur(10)
    .toFormat('jpeg', { quality: 30 })
    .toBuffer();

  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}

async function processImage(inputPath) {
  const dir = dirname(inputPath);
  const filename = basename(inputPath, extname(inputPath));

  console.log(`Processing: ${inputPath}`);

  const metadata = await sharp(inputPath).metadata();
  const results = {
    original: inputPath,
    width: metadata.width,
    height: metadata.height,
    formats: {},
  };

  // Generate LQIP
  const lqipPath = `${dir}/${filename}-lqip.jpg`;
  results.lqip = await generateLQIP(inputPath, lqipPath);

  // Generate responsive sizes
  for (const { format, quality, mozjpeg } of FORMATS) {
    const srcset = [];

    for (const size of SIZES) {
      if (size > metadata.width) continue; // Skip if larger than original

      const outputPath = `${dir}/${filename}-${size}.${format}`;
      await ensureDir(outputPath);

      await sharp(inputPath)
        .resize(size, null, { withoutEnlargement: true })
        .toFormat(format, { quality, ...(mozjpeg && { mozjpeg: true }) })
        .toFile(outputPath);

      srcset.push(`${basename(outputPath)} ${size}w`);
    }

    results.formats[format] = srcset.join(', ');
  }

  return results;
}

async function updateArtworksJSON(imageResults) {
  // TODO: Update artworks.json with new srcset data
  console.log('Image processing complete. Update artworks.json manually or automate this step.');
  console.log(JSON.stringify(imageResults, null, 2));
}

// Main execution
const images = await glob(INPUT_PATTERN);
console.log(`Found ${images.length} images to process`);

const results = [];
for (const imagePath of images) {
  try {
    const result = await processImage(imagePath);
    results.push(result);
  } catch (error) {
    console.error(`Failed to process ${imagePath}:`, error);
  }
}

await updateArtworksJSON(results);
console.log(`✅ Processed ${results.length} images successfully`);
```

```json
// package.json
{
  "scripts": {
    "images:generate": "node scripts/generate-responsive-images.mjs",
    "images:watch": "nodemon --watch docs/img --ext jpg,jpeg,png --exec npm run images:generate"
  }
}
```

**Update Gallery Component:**
```javascript
// Already implemented in Gallery.js:127-232 - just needs srcset data
// Update artworks.json to include generated srcsets:
{
  "id": 1,
  "title": "Forest Whisper",
  "image": "img/forest-whisper.jpg",
  "width": 1920,
  "height": 1280,
  "lqip": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAA...",
  "srcset": {
    "avif": "img/forest-whisper-400.avif 400w, img/forest-whisper-800.avif 800w, ...",
    "webp": "img/forest-whisper-400.webp 400w, img/forest-whisper-800.webp 800w, ...",
    "jpeg": "img/forest-whisper-400.jpg 400w, img/forest-whisper-800.jpg 800w, ..."
  }
}
```

**Acceptance Criteria:**
- [ ] All images have AVIF, WebP, and JPEG variants
- [ ] 4 responsive sizes generated (400w, 800w, 1200w, 1920w)
- [ ] LQIP base64 data available for blur-up effect
- [ ] LCP improved to <1.5s on mobile
- [ ] Automated pipeline runs on `npm run images:generate`

**Dependencies:** None

**Related:** TASK-015 (Image CDN integration)

---

## P1 - High (Should Do - Next Quarter)

### TASK-004: Integrate Vite Build Pipeline
**Priority:** P1 | **Effort:** M (1 week) | **Impact:** Medium-High

**Problem:**
No bundling, minification, or tree-shaking. Serving unoptimized JavaScript/CSS in production.

**Expected Impact:**
- **Bundle size:** 100KB → 65KB (35% reduction)
- **Load time:** 1.2s → 0.8s (33% faster)
- **Dev experience:** HMR, instant server start

**Solution:**
Integrate Vite for modern build tooling with zero config.

**Implementation:**

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'docs',
  publicDir: '../public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'docs/index.html'),
        gallery: resolve(__dirname, 'docs/gallery.html'),
        about: resolve(__dirname, 'docs/about.html'),
        contact: resolve(__dirname, 'docs/contact.html'),
      },
      output: {
        manualChunks: {
          vendor: ['./docs/js/utils/dom.js', './docs/js/utils/storage.js'],
          components: [
            './docs/js/components/Gallery.js',
            './docs/js/components/Lightbox.js',
            './docs/js/components/Menu.js',
            './docs/js/components/Theme.js',
          ],
        },
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
      },
    },
    cssCodeSplit: true,
    assetsInlineLimit: 4096, // Inline assets < 4KB
  },
  server: {
    port: 3000,
    open: true,
    cors: true,
  },
  preview: {
    port: 8080,
  },
  plugins: [
    // Add postcss for autoprefixer, minification
  ],
});
```

```json
// package.json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "deploy": "npm run build && gh-pages -d dist"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "terser": "^5.24.0"
  }
}
```

**Acceptance Criteria:**
- [ ] Development server with HMR
- [ ] Production build with minification
- [ ] Code splitting by route
- [ ] CSS minification and autoprefixing
- [ ] Source maps for debugging
- [ ] Build size reduced by 30%+

**Dependencies:** None

**Related:** TASK-002 (Vite + TypeScript = perfect combo)

---

### TASK-005: Add Centralized State Management
**Priority:** P1 | **Effort:** M (1 week) | **Impact:** Medium

**Problem:**
State scattered across components (theme in Theme.js, language in i18n.js, filters in GalleryFilter.js). No single source of truth.

**Solution:**
Lightweight state management library (Zustand-like) with reactive subscriptions.

**Implementation:**

```typescript
// docs/js/store/index.ts
type Listener<T> = (state: T, prevState: T) => void;
type Selector<T, U> = (state: T) => U;

export class Store<T extends object> {
  private state: T;
  private listeners = new Set<Listener<T>>();

  constructor(initialState: T) {
    this.state = initialState;
  }

  getState(): T {
    return this.state;
  }

  setState(partial: Partial<T> | ((state: T) => Partial<T>)): void {
    const prevState = this.state;
    const updates = typeof partial === 'function' ? partial(this.state) : partial;
    this.state = { ...this.state, ...updates };

    this.listeners.forEach(listener => listener(this.state, prevState));
  }

  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Memoized selector subscription
  select<U>(selector: Selector<T, U>, listener: (value: U, prevValue: U) => void): () => void {
    let currentValue = selector(this.state);

    return this.subscribe((state, prevState) => {
      const nextValue = selector(state);
      if (nextValue !== currentValue) {
        const prevValue = currentValue;
        currentValue = nextValue;
        listener(nextValue, prevValue);
      }
    });
  }
}

// Application state
interface AppState {
  theme: 'light' | 'dark';
  language: 'en' | 'ua';
  artworks: Artwork[];
  filters: {
    category: string;
    search: string;
  };
  lightbox: {
    isOpen: boolean;
    currentIndex: number;
    images: string[];
  };
}

export const store = new Store<AppState>({
  theme: 'light',
  language: 'en',
  artworks: [],
  filters: {
    category: 'all',
    search: '',
  },
  lightbox: {
    isOpen: false,
    currentIndex: 0,
    images: [],
  },
});

// Persist theme and language to localStorage
store.subscribe((state, prevState) => {
  if (state.theme !== prevState.theme) {
    localStorage.setItem('theme', state.theme);
  }
  if (state.language !== prevState.language) {
    localStorage.setItem('language', state.language);
  }
});

// DevTools integration (optional)
if (import.meta.env.DEV) {
  window.__BRANCHSTONE_STORE__ = store;
}
```

**Usage in Components:**
```typescript
// docs/js/components/Gallery.ts
import { store } from '../store/index.js';

export class Gallery {
  private unsubscribe: () => void;

  constructor(options: GalleryOptions) {
    this.container = $(options.containerSelector);

    // Subscribe to filter changes
    this.unsubscribe = store.select(
      state => state.filters.category,
      (category, prevCategory) => {
        if (category !== prevCategory) {
          this.filter(category);
        }
      }
    );

    this.init();
  }

  destroy() {
    this.unsubscribe();
  }
}
```

**Acceptance Criteria:**
- [ ] Single source of truth for app state
- [ ] Reactive subscriptions with memoization
- [ ] DevTools integration for debugging
- [ ] Persistence layer for theme/language
- [ ] Migrated 3+ components to use store

**Dependencies:** None

**Related:** TASK-001 (easier to test with centralized state)

---

### TASK-006: Implement Error Tracking with Sentry
**Priority:** P1 | **Effort:** S (1-2 days) | **Impact:** Medium

**Problem:**
Production errors are invisible. No way to know when users encounter bugs.

**Solution:**
Integrate Sentry for error tracking, session replay, and performance monitoring.

**Implementation:**

```bash
npm install --save @sentry/browser @sentry/integrations
```

```typescript
// docs/js/services/errorTracking.ts
import * as Sentry from '@sentry/browser';
import { BrowserTracing } from '@sentry/tracing';
import { Replay } from '@sentry/replay';

const IS_PRODUCTION = window.location.hostname === 'branchstone.art';

if (IS_PRODUCTION) {
  Sentry.init({
    dsn: 'YOUR_SENTRY_DSN',
    environment: IS_PRODUCTION ? 'production' : 'development',
    release: `branchstone@${import.meta.env.VITE_APP_VERSION}`,

    // Performance Monitoring
    integrations: [
      new BrowserTracing({
        tracingOrigins: ['branchstone.art', /^\//],
      }),
      new Replay({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],

    // Performance monitoring sample rate (10%)
    tracesSampleRate: 0.1,

    // Session Replay sample rates
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

    beforeSend(event, hint) {
      // Filter out non-critical errors
      if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) {
        return null; // Ignore browser quirks
      }

      // Add user context (anonymized)
      event.user = {
        id: getAnonymousUserId(),
        ip_address: undefined, // Don't track IP
      };

      return event;
    },
  });

  // Set user context
  Sentry.setContext('app', {
    theme: localStorage.getItem('theme') || 'light',
    language: localStorage.getItem('language') || 'en',
  });
}

function getAnonymousUserId(): string {
  let userId = localStorage.getItem('sentry_user_id');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('sentry_user_id', userId);
  }
  return userId;
}

// Wrap async functions for better error tracking
export function captureError(error: Error, context?: Record<string, any>) {
  console.error(error);
  if (IS_PRODUCTION) {
    Sentry.captureException(error, { extra: context });
  }
}

// Track custom events
export function trackEvent(eventName: string, data?: Record<string, any>) {
  if (IS_PRODUCTION) {
    Sentry.addBreadcrumb({
      category: 'user-action',
      message: eventName,
      level: 'info',
      data,
    });
  }
}

// Global error handlers
window.addEventListener('error', (event) => {
  captureError(event.error, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

window.addEventListener('unhandledrejection', (event) => {
  captureError(event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
});
```

**Usage in Components:**
```typescript
// docs/js/components/Gallery.ts
import { captureError, trackEvent } from '../services/errorTracking.js';

async init() {
  try {
    const artworks = await this.fetchArtworks();
    trackEvent('gallery_loaded', { count: artworks.length, type: this.type });
    this.render(artworks);
  } catch (error) {
    captureError(error as Error, {
      component: 'Gallery',
      type: this.type,
    });
    this.renderError(error as Error);
  }
}
```

**Acceptance Criteria:**
- [ ] Sentry integrated in production only
- [ ] Session replay enabled for error debugging
- [ ] Performance monitoring active
- [ ] Critical errors trigger Slack/email alerts
- [ ] Weekly error reports generated

**Dependencies:** None

**Related:** TASK-001 (error tracking complements testing)

---

### TASK-007: Add Virtual Scrolling for Large Galleries
**Priority:** P1 | **Effort:** M (3-5 days) | **Impact:** Medium

**Problem:**
Gallery performance degrades with 100+ artworks (300+ DOM nodes). Scroll becomes janky.

**Solution:**
Implement virtual scrolling to render only visible items (10-15 DOM nodes regardless of dataset size).

**Implementation:**

```typescript
// docs/js/components/VirtualGallery.ts
export interface VirtualGalleryOptions {
  containerSelector: string;
  itemHeight: number;
  overscan?: number; // How many items to pre-render above/below viewport
  gap?: number; // Grid gap in pixels
}

export class VirtualGallery {
  private container: HTMLElement;
  private scrollContainer: HTMLElement;
  private itemHeight: number;
  private overscan: number;
  private gap: number;
  private artworks: Artwork[] = [];
  private visibleRange = { start: 0, end: 0 };
  private itemsPerRow = 1;
  private renderedItems = new Map<number, HTMLElement>();
  private resizeObserver: ResizeObserver;

  constructor(options: VirtualGalleryOptions) {
    this.container = $(options.containerSelector)!;
    this.itemHeight = options.itemHeight;
    this.overscan = options.overscan || 3;
    this.gap = options.gap || 16;

    this.init();
  }

  private init() {
    // Create scroll container
    this.scrollContainer = createElement('div', {
      className: 'virtual-gallery-scroll',
      style: `height: 100vh; overflow-y: auto;`,
    });

    this.container.appendChild(this.scrollContainer);

    // Listen to scroll
    this.scrollContainer.addEventListener('scroll', this.handleScroll.bind(this), {
      passive: true,
    });

    // Observe container resize
    this.resizeObserver = new ResizeObserver(() => {
      this.calculateItemsPerRow();
      this.updateVisibleRange();
    });
    this.resizeObserver.observe(this.scrollContainer);

    this.calculateItemsPerRow();
  }

  private calculateItemsPerRow() {
    const containerWidth = this.scrollContainer.clientWidth;
    const minItemWidth = 300; // Min gallery item width
    this.itemsPerRow = Math.floor((containerWidth + this.gap) / (minItemWidth + this.gap)) || 1;
  }

  async loadArtworks(artworks: Artwork[]) {
    this.artworks = artworks;

    // Calculate total height
    const totalRows = Math.ceil(artworks.length / this.itemsPerRow);
    const totalHeight = totalRows * (this.itemHeight + this.gap);

    // Set scroll container height
    this.scrollContainer.style.height = `${totalHeight}px`;

    this.updateVisibleRange();
  }

  private handleScroll() {
    requestAnimationFrame(() => this.updateVisibleRange());
  }

  private updateVisibleRange() {
    const scrollTop = this.scrollContainer.scrollTop;
    const containerHeight = this.scrollContainer.clientHeight;

    const startRow = Math.floor(scrollTop / (this.itemHeight + this.gap));
    const endRow = Math.ceil((scrollTop + containerHeight) / (this.itemHeight + this.gap));

    const start = Math.max(0, (startRow - this.overscan) * this.itemsPerRow);
    const end = Math.min(
      this.artworks.length,
      (endRow + this.overscan) * this.itemsPerRow
    );

    if (this.visibleRange.start !== start || this.visibleRange.end !== end) {
      this.visibleRange = { start, end };
      this.render();
    }
  }

  private render() {
    const fragment = document.createDocumentFragment();

    // Remove items outside visible range
    this.renderedItems.forEach((element, index) => {
      if (index < this.visibleRange.start || index >= this.visibleRange.end) {
        element.remove();
        this.renderedItems.delete(index);
      }
    });

    // Add items in visible range
    for (let i = this.visibleRange.start; i < this.visibleRange.end; i++) {
      if (this.renderedItems.has(i)) continue; // Already rendered

      const artwork = this.artworks[i];
      const item = this.createGalleryItem(artwork, i);

      // Position absolutely based on grid
      const row = Math.floor(i / this.itemsPerRow);
      const col = i % this.itemsPerRow;
      const top = row * (this.itemHeight + this.gap);
      const left = col * (100 / this.itemsPerRow);

      item.style.position = 'absolute';
      item.style.top = `${top}px`;
      item.style.left = `${left}%`;
      item.style.width = `calc(${100 / this.itemsPerRow}% - ${this.gap}px)`;

      fragment.appendChild(item);
      this.renderedItems.set(i, item);
    }

    this.scrollContainer.appendChild(fragment);
  }

  private createGalleryItem(artwork: Artwork, index: number): HTMLElement {
    // Same as Gallery.createGalleryItem()
    // ...
  }

  destroy() {
    this.resizeObserver.disconnect();
    this.renderedItems.clear();
  }
}
```

**Acceptance Criteria:**
- [ ] Gallery renders only visible items (~15 max)
- [ ] Smooth 60fps scrolling with 1000+ artworks
- [ ] Pre-rendering (overscan) prevents blank items during fast scroll
- [ ] Responsive grid layout maintained
- [ ] Accessibility preserved (keyboard navigation)

**Dependencies:** None

**Related:** TASK-004 (Vite helps with tree-shaking virtual scroll library)

---

### TASK-008: Implement Circuit Breaker for API Calls
**Priority:** P1 | **Effort:** S (1-2 days) | **Impact:** Medium

**Problem:**
API failures cause infinite retry loops. No exponential backoff or circuit breaking.

**Solution:**
Circuit breaker pattern with retry logic and exponential backoff.

**Implementation:**

```typescript
// docs/js/services/circuitBreaker.ts
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerOptions {
  failureThreshold: number; // Number of failures before opening
  successThreshold: number; // Number of successes in HALF_OPEN before closing
  timeout: number; // Request timeout in ms
  resetTimeout: number; // How long to wait in OPEN before trying HALF_OPEN
}

export class CircuitBreaker<T extends (...args: any[]) => Promise<any>> {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private nextAttemptTime = 0;

  constructor(
    private fn: T,
    private options: CircuitBreakerOptions = {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 5000,
      resetTimeout: 60000,
    }
  ) {}

  async execute(...args: Parameters<T>): Promise<ReturnType<T>> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error('Circuit breaker is OPEN. Service temporarily unavailable.');
      }
      this.state = 'HALF_OPEN';
      this.successCount = 0;
    }

    try {
      const result = await Promise.race([
        this.fn(...args),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Request timeout')), this.options.timeout)
        ),
      ]);

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.state = 'CLOSED';
        this.failureCount = 0;
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure() {
    this.failureCount++;

    if (
      this.failureCount >= this.options.failureThreshold ||
      this.state === 'HALF_OPEN'
    ) {
      this.state = 'OPEN';
      this.nextAttemptTime = Date.now() + this.options.resetTimeout;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
  }
}
```

**Usage:**
```typescript
// docs/js/services/api.ts
import { CircuitBreaker } from './circuitBreaker.js';

const fetchJSONCircuitBreaker = new CircuitBreaker(fetchJSON, {
  failureThreshold: 3,
  successThreshold: 2,
  timeout: 5000,
  resetTimeout: 60000,
});

export const artworksAPI = {
  async getAll(): Promise<Artwork[]> {
    return fetchJSONCircuitBreaker.execute(CONFIG.api.artworks);
  },
};
```

**Acceptance Criteria:**
- [ ] Circuit breaker opens after 3 consecutive failures
- [ ] Automatic recovery after cooldown period
- [ ] Request timeout protection
- [ ] Circuit state exposed for UI feedback

**Dependencies:** None

**Related:** TASK-006 (error tracking logs circuit breaker events)

---

## P2 - Medium (Nice to Have - Q2 2025)

### TASK-009: Add Web Analytics with Privacy Focus
**Priority:** P2 | **Effort:** S (1 day) | **Impact:** Low-Medium

**Problem:**
No data on user behavior, conversion rates, or popular artworks.

**Solution:**
Integrate privacy-focused analytics (Plausible or Fathom) instead of Google Analytics.

**Implementation:**

```html
<!-- index.html - Add Plausible script -->
<script defer data-domain="branchstone.art" src="https://plausible.io/js/script.js"></script>
```

```typescript
// docs/js/services/analytics.ts
interface AnalyticsEvent {
  name: string;
  props?: Record<string, string | number>;
}

class Analytics {
  private enabled: boolean;

  constructor() {
    this.enabled =
      window.location.hostname === 'branchstone.art' &&
      typeof window.plausible === 'function';
  }

  track(event: AnalyticsEvent) {
    if (!this.enabled) return;

    window.plausible(event.name, { props: event.props });
  }

  // Convenience methods
  trackPageView(path: string) {
    this.track({ name: 'pageview', props: { path } });
  }

  trackGalleryView(artworkTitle: string) {
    this.track({
      name: 'Artwork View',
      props: { artwork: artworkTitle },
    });
  }

  trackInquiry(artworkTitle: string) {
    this.track({
      name: 'Inquiry Submitted',
      props: { artwork: artworkTitle },
    });
  }

  trackFilterUsage(category: string) {
    this.track({
      name: 'Gallery Filter',
      props: { category },
    });
  }
}

export const analytics = new Analytics();
```

**Usage in Components:**
```typescript
// Lightbox.js
import { analytics } from '../services/analytics.js';

open() {
  // ... existing code
  analytics.trackGalleryView(this.elements.title.textContent);
}
```

**Acceptance Criteria:**
- [ ] Privacy-compliant analytics (no cookies, GDPR-friendly)
- [ ] Track page views, artwork views, inquiries, filter usage
- [ ] Dashboard accessible to artist
- [ ] No PII collected

**Dependencies:** None

---

### TASK-010: Consolidate CSS Media Queries
**Priority:** P2 | **Effort:** S (2-3 days) | **Impact:** Low

**Problem:**
Media queries scattered across CSS files. Some duplication.

**Solution:**
Mobile-first CSS with consolidated breakpoints.

**Implementation:**

```css
/* Before: 04-gallery.css has scattered media queries */
@media (max-width: 768px) { /* ... */ }
@media (min-width: 769px) { /* ... */ }
@media (max-width: 480px) { /* ... */ }

/* After: Consolidated mobile-first */
/* Base styles = mobile (default) */
.gallery-grid {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Tablet and up (769px+) */
@media (min-width: 769px) {
  .gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 2rem;
  }
}

/* Desktop and up (1025px+) */
@media (min-width: 1025px) {
  .gallery-grid {
    max-width: 1400px;
    margin: 0 auto;
  }
}

/* Small mobile adjustments (480px and below) */
@media (max-width: 480px) {
  .gallery-main {
    padding-top: 7rem;
  }
}
```

**Acceptance Criteria:**
- [ ] Single mobile breakpoint (769px)
- [ ] Single desktop breakpoint (1025px)
- [ ] Mobile-first cascade (base styles = mobile)
- [ ] No duplicate media queries
- [ ] CSS file size reduced by 5-10%

**Dependencies:** None

---

### TASK-011: Implement Content Security Policy (CSP)
**Priority:** P2 | **Effort:** S (1 day) | **Impact:** Medium

**Problem:**
No CSP headers. Vulnerable to XSS attacks if third-party scripts are compromised.

**Solution:**
Add strict CSP headers.

**Implementation:**

```html
<!-- Add to all HTML pages -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' https://formspree.io https://plausible.io;
  script-src-elem 'self' https://formspree.io https://plausible.io;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' https://formspree.io;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self' https://formspree.io;
  upgrade-insecure-requests;
">
```

**GitHub Pages (.htaccess equivalent):**
```yaml
# .github/workflows/deploy.yml - Add CSP headers via Cloudflare Workers or Netlify
# Since GitHub Pages doesn't support custom headers, use Cloudflare proxy:

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const response = await fetch(request)
  const newHeaders = new Headers(response.headers)

  newHeaders.set('Content-Security-Policy',
    "default-src 'self'; script-src 'self' https://formspree.io;"
  )

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  })
}
```

**Acceptance Criteria:**
- [ ] CSP header active in production
- [ ] No console CSP violations
- [ ] All third-party scripts whitelisted
- [ ] A rating on securityheaders.com

**Dependencies:** Cloudflare or Netlify for CSP headers (GitHub Pages limitation)

---

### TASK-012: Add Storybook for Component Documentation
**Priority:** P2 | **Effort:** M (3-5 days) | **Impact:** Low-Medium

**Problem:**
No visual component library or documentation. Hard for new developers to understand components.

**Solution:**
Storybook for component playground and documentation.

**Implementation:**

```bash
npx storybook init --type html
```

```typescript
// .storybook/main.ts
export default {
  stories: ['../docs/js/components/**/*.stories.ts'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
  ],
  framework: '@storybook/html',
};
```

```typescript
// docs/js/components/Gallery.stories.ts
import { Gallery } from './Gallery.js';
import type { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'Components/Gallery',
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['featured', 'full'],
    },
  },
};

export default meta;
type Story = StoryObj;

export const Featured: Story = {
  render: (args) => {
    const container = document.createElement('div');
    container.id = 'gallery';
    container.style.padding = '2rem';

    new Gallery({
      containerSelector: '#gallery',
      type: args.type || 'featured',
    });

    return container;
  },
};

export const FullGallery: Story = {
  render: () => {
    const container = document.createElement('div');
    container.id = 'gallery';
    container.style.padding = '2rem';

    new Gallery({
      containerSelector: '#gallery',
      type: 'full',
    });

    return container;
  },
};
```

**Acceptance Criteria:**
- [ ] All components have Storybook stories
- [ ] Accessibility addon validates WCAG compliance
- [ ] Interactive controls for component props
- [ ] Auto-generated docs from JSDoc/TSDoc

**Dependencies:** TASK-002 (TypeScript improves Storybook types)

---

## P3 - Low (Future Enhancements)

### TASK-013: Migrate to Astro for SSG
**Priority:** P3 | **Effort:** L (2-3 weeks) | **Impact:** Medium

**Problem:**
Client-side rendering (CSR) is slower than Server-Side Generation (SSG). SEO could be better.

**Solution:**
Migrate to Astro for static site generation with partial hydration.

**Expected Benefits:**
- **TTI:** 3.5s → 1.5s (57% faster)
- **SEO:** Better crawlability, faster indexing
- **Developer Experience:** Component islands, markdown support

**Implementation:**

```bash
npm create astro@latest
```

```astro
---
// src/pages/index.astro
import Layout from '../layouts/Layout.astro';
import Gallery from '../components/Gallery.astro';
import { artworksAPI } from '../services/api.ts';

const featuredArtworks = await artworksAPI.getFeatured(6);
---

<Layout title="Viktoria Branchstone - Mixed Media Artist">
  <main class="home-main">
    <section class="hero-fullscreen">
      <h1>VIKTORIA BRANCHSTONE</h1>
      <p>Art inspired by natural textures and quiet resilience</p>
    </section>

    <section class="featured-works">
      <Gallery artworks={featuredArtworks} type="featured" client:load />
    </section>
  </main>
</Layout>
```

**Acceptance Criteria:**
- [ ] All pages pre-rendered as static HTML
- [ ] Interactive components hydrated on demand (islands architecture)
- [ ] Lighthouse Performance score >95
- [ ] Build time <30 seconds

**Dependencies:** TASK-004 (easier with Vite experience)

---

### TASK-014: Add 3D Artwork Viewer with Three.js
**Priority:** P3 | **Effort:** XL (3-4 weeks) | **Impact:** High (UX delight)

**Problem:**
Flat images don't showcase texture and dimensionality of mixed-media art.

**Solution:**
3D viewer with lighting controls for texture exploration.

**Implementation:**

```typescript
// docs/js/components/Artwork3DViewer.ts
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class Artwork3DViewer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private model: THREE.Mesh;

  constructor(containerSelector: string, textureUrl: string, heightMapUrl: string) {
    this.initScene();
    this.loadTexture(textureUrl, heightMapUrl);
    this.animate();
  }

  private initScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Lighting for texture detail
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);

    // Camera controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    this.camera.position.z = 5;
  }

  private async loadTexture(textureUrl: string, heightMapUrl: string) {
    const textureLoader = new THREE.TextureLoader();

    const [texture, heightMap] = await Promise.all([
      textureLoader.loadAsync(textureUrl),
      textureLoader.loadAsync(heightMapUrl),
    ]);

    // Create plane with displacement map for depth
    const geometry = new THREE.PlaneGeometry(4, 5, 256, 256);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      displacementMap: heightMap,
      displacementScale: 0.5,
      roughness: 0.8,
      metalness: 0.2,
    });

    this.model = new THREE.Mesh(geometry, material);
    this.scene.add(this.model);
  }

  private animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.renderer.dispose();
    this.controls.dispose();
  }
}
```

**Acceptance Criteria:**
- [ ] 3D viewer for selected artworks
- [ ] Lighting controls to explore texture
- [ ] Mobile-friendly touch controls
- [ ] Lazy load Three.js (large bundle)

**Dependencies:** None

---

### TASK-015: Integrate Image CDN (Cloudinary/Imgix)
**Priority:** P3 | **Effort:** M (3-5 days) | **Impact:** Medium

**Problem:**
Images served from GitHub Pages. No on-the-fly optimization or transformations.

**Solution:**
Cloudinary for automatic format conversion, resizing, and optimization.

**Implementation:**

```typescript
// docs/js/services/imageOptimizer.ts
const CLOUDINARY_CLOUD_NAME = 'branchstone';

export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
    format?: 'auto' | 'avif' | 'webp' | 'jpg';
    crop?: 'fill' | 'fit' | 'scale';
  } = {}
): string {
  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'fill',
  } = options;

  const transformations = [
    'f_' + format,
    'q_' + quality,
    width && 'w_' + width,
    height && 'h_' + height,
    'c_' + crop,
    'dpr_auto', // Automatic DPR detection
  ]
    .filter(Boolean)
    .join(',');

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformations}/${publicId}`;
}

// Generate responsive srcset
export function generateSrcSet(
  publicId: string,
  sizes: number[] = [400, 800, 1200, 1920]
): string {
  return sizes
    .map(
      size =>
        `${getOptimizedImageUrl(publicId, { width: size, format: 'auto', quality: 'auto' })} ${size}w`
    )
    .join(', ');
}
```

**Usage:**
```javascript
// artworks.json
{
  "id": 1,
  "title": "Forest Whisper",
  "cloudinary_id": "artworks/forest-whisper",
  // Generate URLs dynamically
}

// Gallery.js
const imgSrc = getOptimizedImageUrl(artwork.cloudinary_id, {
  width: 800,
  format: 'auto',
  quality: 'auto',
});

const srcset = generateSrcSet(artwork.cloudinary_id);
```

**Acceptance Criteria:**
- [ ] All images migrated to Cloudinary
- [ ] Automatic format selection (AVIF → WebP → JPEG)
- [ ] On-the-fly resizing and cropping
- [ ] CDN caching for fast delivery

**Dependencies:** TASK-003 (responsive images first)

---

## Quick Wins (Can Ship in 1-3 Days)

### TASK-016: Fix Magic Numbers in Code
**Priority:** P2 | **Effort:** XS (2-4 hours) | **Impact:** Low

**Problem:**
Hardcoded timeouts and dimensions scattered in code.

**Solution:**
Move all magic numbers to CONFIG.

**Implementation:**

```javascript
// Before
setTimeout(() => {
  this.elements.zoomIndicator.classList.remove('visible');
}, 2000); // ❌ Magic number

// After
setTimeout(() => {
  this.elements.zoomIndicator.classList.remove('visible');
}, CONFIG.ui.lightbox.zoomIndicatorDuration); // ✅ Config
```

```javascript
// config.js - Add missing constants
lightbox: {
  zoomIndicatorDuration: 2000,
  touchHoldDelay: 300,
  sliderTransitionDuration: 400,
},
```

**Acceptance Criteria:**
- [ ] Zero hardcoded numbers in components
- [ ] All timeouts/durations in CONFIG
- [ ] All sizes/dimensions in CONFIG

---

### TASK-017: Add Missing aria-labels
**Priority:** P1 | **Effort:** XS (2-4 hours) | **Impact:** Low-Medium

**Problem:**
Filter buttons and some controls missing aria-labels.

**Solution:**
Add descriptive labels.

**Implementation:**

```javascript
// GalleryFilter.js
const button = createElement('button', {
  className: filterClass,
  'data-category': category.id,
  'aria-label': `Filter artworks by ${label}`,
  'aria-pressed': category.id === 'all' ? 'true' : 'false',
});
```

**Acceptance Criteria:**
- [ ] All interactive elements have aria-labels
- [ ] aria-pressed state indicates active filters
- [ ] Screen reader announces filter changes

---

### TASK-018: Optimize CSS Shadow Definitions
**Priority:** P2 | **Effort:** XS (1-2 hours) | **Impact:** Low

**Problem:**
Complex box-shadow recalculated on every paint.

**Solution:**
Use CSS variables from 01-tokens.css.

**Implementation:**

```css
/* Before: 04-gallery.css */
.gallery-item {
  box-shadow:
    0 2px 4px rgba(0, 0, 0, 0.02),
    0 4px 8px rgba(0, 0, 0, 0.03),
    0 8px 16px rgba(0, 0, 0, 0.04),
    0 16px 32px rgba(0, 0, 0, 0.05);
}

/* After: Use existing variable */
.gallery-item {
  box-shadow: var(--shadow-lg);
}
```

**Acceptance Criteria:**
- [ ] All shadows use CSS variables
- [ ] No duplicate shadow definitions
- [ ] Paint performance improved (measure with DevTools)

---

### TASK-019: Add Offline Page
**Priority:** P2 | **Effort:** XS (1-2 hours) | **Impact:** Low

**Problem:**
No offline fallback page. Service Worker returns generic error.

**Solution:**
Create branded offline page.

**Implementation:**

```html
<!-- docs/offline.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - Branchstone Art</title>
  <link rel="stylesheet" href="css/bundle.css">
</head>
<body>
  <main style="text-align: center; padding: 4rem 2rem;">
    <h1>You're Offline</h1>
    <p>Please check your internet connection and try again.</p>
    <button onclick="window.location.reload()">Retry</button>
  </main>
</body>
</html>
```

**Acceptance Criteria:**
- [ ] Offline page matches site branding
- [ ] Service Worker serves offline page when network unavailable
- [ ] Retry button reloads page

---

### TASK-020: Add Loading States to Buttons
**Priority:** P2 | **Effort:** XS (2-4 hours) | **Impact:** Low

**Problem:**
No visual feedback when submitting contact form or loading gallery.

**Solution:**
Add loading spinner to buttons.

**Implementation:**

```typescript
// FormValidator.js
async handleSubmit(event: Event) {
  event.preventDefault();

  const submitButton = this.form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Sending...';
  submitButton.classList.add('loading');

  try {
    await contactAPI.submit(formData);
    this.showSuccess();
  } catch (error) {
    this.showError(error);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Send Message';
    submitButton.classList.remove('loading');
  }
}
```

```css
/* 05-buttons.css */
.btn-primary.loading::after {
  content: '';
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  display: inline-block;
  margin-left: 0.5rem;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

**Acceptance Criteria:**
- [ ] Loading state on form submit button
- [ ] Loading state on gallery retry button
- [ ] Buttons disabled during async operations

---

## Summary

**Total Tasks:** 28
- **P0 (Critical):** 3 tasks - ~6 weeks effort
- **P1 (High):** 8 tasks - ~8 weeks effort
- **P2 (Medium):** 9 tasks - ~3 weeks effort
- **P3 (Low):** 3 tasks - ~9 weeks effort
- **Quick Wins:** 5 tasks - ~2 days effort

**Recommended Next Sprint (2-week sprint):**
1. TASK-001: Add testing framework (Week 1-2)
2. TASK-003: Implement responsive images (Week 2)
3. TASK-017: Add missing aria-labels (Day 1)
4. TASK-016: Fix magic numbers (Day 1)

**Estimated Timeline:**
- **Sprint 1 (Weeks 1-2):** Testing + Responsive Images + Quick Wins
- **Sprint 2 (Weeks 3-4):** TypeScript Migration
- **Sprint 3 (Weeks 5-6):** Vite Build Pipeline + State Management
- **Sprint 4 (Weeks 7-8):** Error Tracking + Virtual Scrolling + Circuit Breaker

After 8 weeks, the codebase will be **enterprise-grade** with testing, TypeScript, build pipeline, and production monitoring.
