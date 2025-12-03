# JavaScript Architecture - Branchstone Portfolio

## 📁 Directory Structure

```
js/
├── config.js                 # Central configuration (all constants)
├── app.js                    # Main application orchestrator
├── i18n.js                   # Internationalization module
├── theme-init.js             # Early theme initialization (prevents FOUC)
│
├── components/               # UI Components
│   ├── Menu.js              # Mobile navigation menu
│   ├── Theme.js             # Theme manager (light/dark)
│   ├── Lightbox.js          # Gallery lightbox with zoom
│   ├── Gallery.js           # Artwork gallery renderer
│   ├── Carousel.js          # Image carousel with autoplay
│   ├── ScrollToTop.js       # Scroll-to-top button
│   ├── Animations.js        # Scroll & parallax animations
│   └── FormValidator.js     # Form validation with accessibility
│
├── services/                # Data Layer
│   └── api.js               # API service (fetch artworks, translations)
│
├── utils/                   # Pure Utilities
│   ├── dom.js               # DOM helpers ($, $$, on, createElement)
│   └── storage.js           # localStorage wrapper with error handling
│
├── artworks.json            # Artwork data
├── translations.json        # i18n translations
│
├── .eslintrc.json           # ESLint configuration (Google style)
└── .prettierrc.json         # Prettier configuration
```

## 🚀 Quick Start

### Import and Use Components

```javascript
// Example: Using Gallery component
import Gallery from './components/Gallery.js';

const gallery = new Gallery({
  containerSelector: '.gallery-grid',
  type: 'full',
  onLoad: () => console.log('Gallery loaded!')
});
```

### Import Configuration

```javascript
import CONFIG from './config.js';

console.log(CONFIG.ui.breakpoints.mobile); // 768
console.log(CONFIG.api.artworks); // 'js/artworks.json'
```

### Import Utilities

```javascript
import { $, $$, on } from './utils/dom.js';
import { getStorageItem, setStorageItem } from './utils/storage.js';

const element = $('#my-element');
const theme = getStorageItem('theme', 'light');
```

## 📖 Module Documentation

### Core Modules

#### **config.js**
Central configuration for all constants. Frozen object (immutable).

**Exports**: `CONFIG`

**Contains**:
- API endpoints
- Storage keys
- UI constants (breakpoints, animations)
- Gallery settings
- Validation rules
- Feature flags

#### **app.js**
Main application orchestrator. Initializes all components.

**Exports**: `App` (class)

**Auto-initializes on DOM ready**

#### **i18n.js**
Internationalization module.

**Global API** (backwards compatibility):
- `window.getTranslation(key)` → Get translation
- `window.switchLanguage(lang)` → Switch language
- `window.currentLang` → Current language

### Components

Each component is a class with a clean API:

```javascript
// Menu
const menu = new Menu({ toggleSelector, menuSelector, overlaySelector });
menu.open();
menu.close();
menu.toggle();

// Lightbox
const lightbox = new Lightbox({ lightboxSelector, triggerSelector });
lightbox.open();
lightbox.close();
lightbox.showNext();
lightbox.showPrevious();
lightbox.refresh();

// Gallery
const gallery = new Gallery({ containerSelector, type, onLoad });
gallery.reload();
gallery.clear();

// ThemeManager
const theme = new ThemeManager({ toggleSelector });
theme.toggleTheme();
theme.applyTheme('dark');
theme.getTheme();

// AnimationManager
const animations = new AnimationManager();
animations.refresh();
animations.destroy();

// FormValidator
const validator = new FormValidator({ formSelector, rules });
validator.validateAll();
validator.validateField('email');
validator.getData();
validator.reset();
```

### Services

#### **api.js**
Data fetching with error handling.

```javascript
import { artworksAPI, translationsAPI, contactAPI } from './services/api.js';

// Artworks
const artworks = await artworksAPI.getAll();
const featured = await artworksAPI.getFeatured(6);
const artwork = await artworksAPI.getById(1);

// Translations
const translations = await translationsAPI.getAll();
const enTranslations = await translationsAPI.getLanguage('en');

// Contact
await contactAPI.submit({ name, email, message });
```

### Utilities

#### **dom.js**
Pure DOM utility functions.

```javascript
import {
  $, $$, on, createElement, setAttributes,
  getFocusableElements, announceToScreenReader
} from './utils/dom.js';

// Query
const element = $('#id');
const elements = $$('.class');

// Events (with cleanup)
const cleanup = on(element, 'click', handler);
cleanup(); // Remove listener

// Create
const div = createElement('div', { className: 'test' }, 'Content');

// Attributes
setAttributes(element, { role: 'button', tabindex: '0' });

// Accessibility
const focusable = getFocusableElements(container);
announceToScreenReader('Message loaded', 'polite');
```

#### **storage.js**
Safe localStorage wrapper.

```javascript
import {
  getStorageItem, setStorageItem,
  removeStorageItem, clearStorage
} from './utils/storage.js';

const theme = getStorageItem('theme', 'light');
setStorageItem('theme', 'dark');
removeStorageItem('theme');
clearStorage();
```

## 🎯 Design Principles

### 1. Single Responsibility
Each module has one clear job:
- `Menu` handles menu interactions
- `Lightbox` handles image gallery
- `Gallery` handles artwork display

### 2. Dependency Injection
Components accept configuration via options:

```javascript
new Lightbox({
  lightboxSelector: '#custom-lightbox',
  triggerSelector: '.custom-trigger'
});
```

### 3. Immutability
- `CONFIG` is frozen (Object.freeze)
- State managed explicitly in components

### 4. Error Handling
All API calls handle errors gracefully:

```javascript
try {
  const data = await artworksAPI.getAll();
} catch (error) {
  // Show user-friendly message
  console.error('Error loading data:', error);
}
```

### 5. Accessibility
All components:
- Support keyboard navigation
- Have proper ARIA attributes
- Manage focus
- Announce to screen readers

## 🧪 Testing

### Unit Tests (Recommended: Vitest)

```javascript
// Example: utils/dom.test.js
import { $, createElement } from '../dom.js';

test('$ returns element', () => {
  document.body.innerHTML = '<div id="test"></div>';
  expect($('#test')).toBeTruthy();
});
```

### Integration Tests (Recommended: Playwright)

```javascript
// Example: gallery.spec.js
test('gallery loads artworks', async ({ page }) => {
  await page.goto('/gallery.html');
  const count = await page.locator('.gallery-item').count();
  expect(count).toBeGreaterThan(0);
});
```

## 🔧 Development

### Linting
```bash
npx eslint js/**/*.js
```

### Formatting
```bash
npx prettier --write js/**/*.js
```

### Local Server
```bash
python -m http.server 8000
# or
npx serve docs
```

## 📚 Documentation

- **ARCHITECTURE.md** - Complete architecture documentation
- **REFACTOR_SUMMARY.md** - Refactor details and migration guide
- **CODE_QUALITY.md** - Code quality standards and best practices

## ⚠️ Important Notes

### ES6 Modules
All files use ES6 modules (`import`/`export`). Requires:
- Modern browser (Chrome 89+, Firefox 88+, Safari 14+)
- `type="module"` in script tags
- Served via HTTP (not file://)

### Backwards Compatibility
Global APIs preserved for compatibility:
- `window.getTranslation(key)`
- `window.switchLanguage(lang)`
- `window.currentLang`

## 🚀 Next Steps

1. **Add Tests**: Unit tests with Vitest, E2E with Playwright
2. **Build Process**: Add Vite for bundling and minification
3. **TypeScript**: Migrate to TypeScript for type safety
4. **CI/CD**: Automate testing and deployment

---

**Version**: 2.2.0
**Last Updated**: 2025-12-03
**Architecture**: Clean Architecture + ES6 Modules
