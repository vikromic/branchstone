## Branchstone Portfolio - Architecture Documentation

### Overview

This document describes the clean, modular architecture of the Branchstone artist portfolio website following Google-level best practices and Clean Architecture principles.

---

## Architecture Principles

### 1. **Separation of Concerns**
Each module has a single, well-defined responsibility:
- **Components**: UI interaction logic (Menu, Lightbox, Gallery, etc.)
- **Services**: Data fetching and external APIs
- **Utils**: Pure utility functions (DOM helpers, storage)
- **Config**: Centralized configuration and constants

### 2. **Dependency Rule**
Dependencies point inward:
- Components depend on Services and Utils
- Services depend on Config and Utils
- Utils depend only on Config
- Config has no dependencies (pure data)

### 3. **ES6 Modules**
- Native JavaScript modules (`import`/`export`)
- No bundler required (modern browsers support)
- Tree-shaking friendly
- Clear dependency graph

### 4. **Single Responsibility**
Each class/module does one thing well:
- `Menu` → mobile menu interactions
- `Lightbox` → image gallery lightbox
- `Gallery` → artwork loading and rendering
- `ThemeManager` → light/dark theme
- `FormValidator` → form validation

### 5. **Immutability**
- Config is frozen (Object.freeze)
- State managed explicitly
- No global mutable state

---

## Project Structure

```
docs/
├── js/
│   ├── config.js                 # Central configuration (frozen)
│   ├── app.js                    # Main application orchestrator
│   ├── i18n.js                   # Internationalization
│   │
│   ├── components/               # UI components
│   │   ├── Menu.js              # Mobile navigation menu
│   │   ├── Theme.js             # Theme manager (light/dark)
│   │   ├── Lightbox.js          # Image gallery lightbox
│   │   ├── Gallery.js           # Artwork gallery
│   │   ├── Animations.js        # Scroll & parallax animations
│   │   └── FormValidator.js     # Form validation
│   │
│   ├── services/                # Data layer
│   │   └── api.js               # API service (artworks, translations, contact)
│   │
│   ├── utils/                   # Pure utilities
│   │   ├── dom.js               # DOM helpers ($, $$, on, createElement)
│   │   └── storage.js           # localStorage wrapper
│   │
│   ├── theme-init.js            # Early theme initialization (blocks FOUC)
│   ├── artworks.json            # Artwork data
│   ├── highlights.json          # Gallery Experience carousel data
│   └── translations.json        # i18n translations
│
├── css/
│   └── style.css                # All styles (consider splitting)
│
├── img/                         # Images and artwork
│
├── index.html                   # Home page
├── gallery.html                 # Gallery page
├── about.html                   # About page (+ shipping policies, experience carousel)
├── commissions.html             # Commissions page with inquiry form
├── contact.html                 # Contact page
│
├── robots.txt                   # SEO
├── sitemap.xml                  # SEO
└── site.webmanifest            # PWA manifest
```

---

## Module Descriptions

### Core Modules

#### **config.js**
Central configuration for all constants.

**Exports**: `CONFIG` (frozen object)

**Contains**:
- API endpoints
- Storage keys
- UI constants (breakpoints, animation timings)
- Gallery settings
- Validation patterns
- Feature flags

**Usage**:
```javascript
import CONFIG from './config.js';

console.log(CONFIG.ui.breakpoints.mobile); // 768
```

#### **app.js**
Main application orchestrator. Initializes all components based on current page.

**Exports**: `App` (class)

**Responsibilities**:
- Initialize core components (Menu, Theme, Animations)
- Initialize page-specific components
- Setup global features (smooth scroll)
- Failsafe animations

**Lifecycle**:
1. DOM ready
2. Initialize core (Menu, Theme, Animations)
3. Detect current page
4. Initialize page-specific components
5. Setup global features

#### **i18n.js**
Internationalization and translation management.

**Exports**: `I18n` (singleton)

**Global API** (backwards compatibility):
- `window.getTranslation(key)` → string
- `window.switchLanguage(lang)` → void
- `window.currentLang` → string

**Methods**:
- `get(key, lang)` → Get translation
- `switch(lang)` → Switch language
- `applyTranslations()` → Apply to DOM

---

### Components

#### **Menu.js**
Mobile navigation menu with accessibility.

**Features**:
- ARIA attributes (expanded, hidden)
- Focus management
- Escape key support
- Hover effects
- Auto-close on nav click

**API**:
```javascript
const menu = new Menu({
  toggleSelector: '#mobile-menu-toggle',
  menuSelector: '#mobile-nav-menu',
  overlaySelector: '#mobile-menu-overlay'
});

menu.open();
menu.close();
menu.toggle();
```

#### **ThemeManager.js**
Light/dark theme with system preference support.

**Features**:
- Persists preference in localStorage
- Respects system preference (prefers-color-scheme)
- Watches for system changes
- ARIA labels

**API**:
```javascript
const theme = new ThemeManager({
  toggleSelector: '#theme-toggle'
});

theme.toggleTheme();
theme.applyTheme('dark');
theme.getTheme(); // 'light' | 'dark'
```

#### **Lightbox.js**
Full-featured image gallery lightbox.

**Features**:
- Multi-image support
- Swipe navigation (mobile)
- Pinch-to-zoom (mobile)
- Double-tap to zoom
- Keyboard navigation
- Focus trap
- Screen reader announcements
- Inquiry button → contact form

**API**:
```javascript
const lightbox = new Lightbox({
  lightboxSelector: '#lightbox',
  triggerSelector: '.gallery-item'
});

lightbox.open();
lightbox.close();
lightbox.showNext();
lightbox.showPrevious();
lightbox.refresh(); // Re-attach to new triggers
```

#### **Gallery.js**
Artwork gallery loading and rendering.

**Types**:
- `featured`: First 6 artworks (home page)
- `full`: All artworks (gallery page)

**Features**:
- Dynamic rendering
- Lazy loading images
- Error handling with fallback UI
- Keyboard accessible
- Artwork metadata (title, size, materials, description)

**API**:
```javascript
const gallery = new Gallery({
  containerSelector: '.gallery-grid',
  type: 'full', // or 'featured'
  onLoad: () => console.log('Gallery loaded!')
});

gallery.reload();
gallery.clear();
```

#### **AnimationManager.js**
Scroll animations and parallax effects.

**Features**:
- Intersection Observer for scroll animations
- Parallax on desktop (disabled on mobile)
- Performance optimized (will-change, requestAnimationFrame)
- Staggered animations

**API**:
```javascript
const animations = new AnimationManager();

animations.refresh(); // Re-observe new elements
animations.destroy(); // Cleanup
```

#### **FormValidator.js**
Form validation with accessibility.

**Features**:
- Custom validation rules
- Real-time feedback
- ARIA invalid states
- Accessible error messages
- Focus management

**API**:
```javascript
const validator = new FormValidator({
  formSelector: '#contact-form',
  rules: {
    name: { required: true, errorMessage: 'Name required' },
    email: { required: true, pattern: /^.+@.+\..+$/ }
  }
});

validator.validateAll(); // → boolean
validator.validateField('email'); // → boolean
validator.getData(); // → { name, email, ... }
validator.reset();
```

---

### Services

#### **api.js**
Data fetching service with error handling.

**Exports**:
- `artworksAPI`
- `translationsAPI`
- `contactAPI`

**Methods**:

**Artworks**:
```javascript
import { artworksAPI } from './services/api.js';

const artworks = await artworksAPI.getAll();
const featured = await artworksAPI.getFeatured(6);
const artwork = await artworksAPI.getById(1);
```

**Translations**:
```javascript
import { translationsAPI } from './services/api.js';

const translations = await translationsAPI.getAll();
const enTranslations = await translationsAPI.getLanguage('en');
```

**Contact**:
```javascript
import { contactAPI } from './services/api.js';

await contactAPI.submit({ name, email, message });
```

---

### Utilities

#### **dom.js**
Pure DOM utility functions.

**Functions**:
```javascript
import { $, $$, on, createElement } from './utils/dom.js';

// Query selectors
const element = $('#id');
const elements = $$('.class');

// Event listeners with cleanup
const cleanup = on(element, 'click', handler, { passive: true });
cleanup(); // Remove listener

// Create elements
const div = createElement('div', {
  className: 'my-class',
  'aria-label': 'Description',
  dataset: { id: '123' }
}, 'Content or [children]');

// Other helpers
setAttributes(element, { role: 'button', tabindex: '0' });
const focusable = getFocusableElements(container);
announceToScreenReader('Message', 'polite');
toggleClasses(element, ['class1', 'class2'], true);
```

#### **storage.js**
Safe localStorage wrapper with error handling.

**Functions**:
```javascript
import { getStorageItem, setStorageItem } from './utils/storage.js';

const theme = getStorageItem('theme', 'light');
setStorageItem('theme', 'dark');
removeStorageItem('theme');
clearStorage(); // Clear all
```

---

## Data Flow

### Example: Gallery Page Load

```
1. User loads gallery.html
   ↓
2. theme-init.js runs (inline, blocks FOUC)
   ↓
3. DOM ready → app.js init()
   ↓
4. App detects current page (gallery.html)
   ↓
5. Gallery component initialized
   ↓
6. Gallery.fetchArtworks() → artworksAPI.getAll()
   ↓
7. API fetches js/artworks.json
   ↓
8. Gallery.render(artworks)
   ↓
9. DOM updated with gallery items
   ↓
10. AnimationManager.refresh() → observes new elements
   ↓
11. Lightbox initialized → attaches to .gallery-item
   ↓
12. User clicks gallery item
   ↓
13. Lightbox.openFromTrigger()
   ↓
14. Focus trapped, keyboard navigation enabled
```

---

## Configuration Management

All hard-coded values extracted to `config.js`:

**Before** (main.js):
```javascript
const swipeThreshold = 50; // Magic number
localStorage.setItem('theme', theme); // Hard-coded key
fetch('js/artworks.json'); // Hard-coded URL
```

**After** (with CONFIG):
```javascript
import CONFIG from './config.js';

const swipeThreshold = CONFIG.ui.lightbox.swipeThreshold;
setStorageItem(CONFIG.storage.theme, theme);
await fetch(CONFIG.api.artworks);
```

**Benefits**:
- Single source of truth
- Easy to modify
- Type-safe (with TypeScript)
- Testable

---

## Coding Standards

### JavaScript (ESLint + Prettier)

**Style**:
- 2-space indentation
- Single quotes
- Semicolons required
- Trailing commas (multiline)
- `const` by default, `let` when needed
- No `var`

**Naming**:
- PascalCase for classes: `ThemeManager`
- camelCase for functions/variables: `fetchArtworks`
- UPPER_SNAKE_CASE for constants: `CONFIG.API_URL`
- Private methods prefixed with underscore (convention): `_init()`
- Descriptive names: `isMenuOpen` not `flag`

**Comments**:
- JSDoc for public APIs
- Inline comments for complex logic only
- No commented-out code

**Error Handling**:
- Try/catch for async operations
- User-friendly error messages
- Console warnings for non-critical errors

---

## Testing Recommendations

### Unit Tests (Recommended: Vitest)
```javascript
// Example: dom.test.js
import { $, createElement } from '../utils/dom.js';

test('$ returns element', () => {
  document.body.innerHTML = '<div id="test"></div>';
  expect($('#test')).toBeTruthy();
});

test('createElement creates element with attrs', () => {
  const el = createElement('div', { className: 'test' });
  expect(el.className).toBe('test');
});
```

### Integration Tests (Recommended: Playwright)
```javascript
// Example: gallery.spec.js
test('gallery loads artworks', async ({ page }) => {
  await page.goto('/gallery.html');
  await expect(page.locator('.gallery-item')).toHaveCount(13);
});

test('lightbox opens on gallery item click', async ({ page }) => {
  await page.goto('/gallery.html');
  await page.click('.gallery-item:first-child');
  await expect(page.locator('#lightbox')).toBeVisible();
});
```

---

## Performance Considerations

### 1. **Lazy Loading**
- Images lazy load below the fold
- Components initialize only on relevant pages

### 2. **Code Splitting**
- ES6 modules load on-demand
- Browser caches individual modules

### 3. **DOM Optimization**
- `will-change` set dynamically
- Passive event listeners where possible
- requestAnimationFrame for animations

### 4. **Memory Management**
- Event listeners cleaned up
- Observers disconnected
- Component destroy() methods

---

## Migration from Old Code

### Before (main.js ~1000 lines)
```javascript
// Everything in one file
document.addEventListener('DOMContentLoaded', function() {
  initializeMobileMenu();
  initializeLightbox();
  initializeThemeToggle();
  // ... 50+ functions
});
```

### After (Modular)
```javascript
// app.js (~200 lines)
import Menu from './components/Menu.js';
import ThemeManager from './components/Theme.js';

class App {
  constructor() {
    this.menu = new Menu();
    this.theme = new ThemeManager();
  }
}
```

**Lines of Code**:
- Before: main.js (1000+ lines)
- After: 10 modules (~100-300 lines each)

**Benefits**:
- Easier to understand
- Easier to test
- Easier to maintain
- Easier to extend

---

## Accessibility

All components follow WCAG 2.1 AA:

✅ Keyboard navigation
✅ Screen reader support (ARIA)
✅ Focus management
✅ Color contrast
✅ Error messages
✅ Skip links
✅ Semantic HTML

---

## Browser Support

- Chrome/Edge 89+ (2021)
- Firefox 88+ (2021)
- Safari 14+ (2020)
- Mobile browsers (iOS 14+, Android 10+)

**Why?** ES6 modules require modern browsers. No transpilation needed.

---

## Future Enhancements

1. **TypeScript** - Add type safety
2. **Build Process** - Vite for bundling and minification
3. **Service Worker** - Offline support
4. **Unit Tests** - Vitest test suite
5. **E2E Tests** - Playwright test suite
6. **CI/CD** - GitHub Actions for testing and deployment
7. **CMS Integration** - Headless CMS for artwork management
8. **Image CDN** - Cloudinary or similar for responsive images

---

## Troubleshooting

### Module not found
**Error**: `Failed to load module script`
**Solution**: Ensure correct path and `type="module"` in script tag

### localStorage not available
**Error**: `localStorage is not defined`
**Solution**: Storage utils handle this gracefully, returns default values

### Animations not working
**Solution**: Check that `.animate-on-scroll` class exists and AnimationManager initialized

### Form not validating
**Solution**: Ensure `#contact-form` exists and FormValidator initialized

---

**Last Updated**: 2025-01-14
**Version**: 2.1.0 (Commissions, Shipping, Video Support)
