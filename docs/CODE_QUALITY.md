# Code Quality Guide - Branchstone Portfolio

## Overview
This document outlines the code quality standards, accessibility practices, and performance optimizations implemented in the Branchstone artist portfolio website.

## Accessibility (WCAG 2.1 AA Compliance)

### Implemented Features

#### 1. **Keyboard Navigation**
- Skip navigation link for keyboard users
- Focus trap in lightbox modal
- Proper focus management in mobile menu
- All interactive elements accessible via keyboard (Tab, Enter, Space, Escape)

#### 2. **ARIA Attributes**
- Mobile menu: `aria-expanded`, `aria-hidden`
- Lightbox: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- Form fields: `aria-required`, `aria-invalid`, `aria-describedby`
- Screen reader announcements for dynamic content

#### 3. **Screen Reader Support**
- `.sr-only` class for visually hidden content
- Live regions for dynamic announcements (`role="status"`, `aria-live="polite"`)
- Descriptive `aria-label` attributes on all buttons and links
- Proper alt text for all images

#### 4. **Focus Management**
- Visible focus indicators on all interactive elements
- Focus returns to trigger element when modals close
- First focusable element receives focus when modals open

#### 5. **Color Contrast**
- All text meets WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
- Theme toggle supports system preferences (`prefers-color-scheme`)
- Error messages use accessible colors in both light and dark modes

### Testing Checklist
- [ ] Test with keyboard only (no mouse)
- [ ] Test with screen reader (NVDA, JAWS, VoiceOver)
- [ ] Verify color contrast with tools (e.g., axe DevTools)
- [ ] Test with browser zoom at 200%
- [ ] Verify focus order is logical

## Performance Optimizations

### Implemented Optimizations

#### 1. **Asset Loading**
- Preload critical CSS and hero images
- Font loading with `media="print"` trick for async loading
- Lazy loading for below-the-fold images
- DNS prefetch for Google Fonts

#### 2. **JavaScript**
- Throttled scroll listeners with `requestAnimationFrame`
- Debounced resize handlers
- Event delegation where appropriate
- `will-change` set dynamically (not globally)
- Passive event listeners for scroll/touch events

#### 3. **CSS**
- Hardware acceleration with `transform: translateZ(0)`
- Reduced animation on mobile for battery savings
- CSS containment for independent rendering
- Efficient selectors (avoid deep nesting)

#### 4. **Images**
- Appropriate image sizes
- Next steps: Implement responsive images with `srcset/sizes`
- Next steps: Convert to WebP/AVIF formats
- Next steps: Add width/height attributes to prevent CLS

### Performance Budget
- Lighthouse Performance score: Target ≥90
- First Contentful Paint (FCP): ≤2.5s
- Largest Contentful Paint (LCP): ≤2.5s
- Cumulative Layout Shift (CLS): <0.1
- Interaction to Next Paint (INP): <200ms

## Code Standards

### JavaScript

#### Style Guide
- Use `const` by default, `let` when reassignment needed
- Never use `var`
- Descriptive function and variable names
- Single responsibility principle for functions
- Error handling with try/catch for async operations
- Fallback UI for failed fetch requests

#### Structure
```javascript
// Good: Clear, descriptive, with error handling
function fetchArtworks() {
    return fetch('js/artworks.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error loading artworks:', error);
            showErrorMessage('Unable to load gallery');
        });
}
```

#### Accessibility in JS
- Always manage focus when showing/hiding content
- Add/remove ARIA attributes dynamically
- Announce dynamic changes to screen readers
- Trap focus in modals

### HTML

#### Semantic Structure
- Use semantic elements (`<header>`, `<main>`, `<nav>`, `<section>`)
- Proper heading hierarchy (h1 → h2 → h3, no skipping)
- Forms with associated labels
- Buttons for actions, links for navigation

#### Attributes
- `lang` attribute on `<html>`
- `alt` text on all images
- `aria-label` on icon-only buttons
- `role` when semantic elements aren't sufficient

### CSS

#### Naming Conventions
- BEM-style naming for components: `.block__element--modifier`
- Descriptive class names, not presentational
- CSS custom properties for theming

#### Organization
1. Reset/normalize
2. CSS variables
3. Base styles
4. Layout
5. Components
6. Utilities
7. Media queries

#### Best Practices
- Mobile-first approach
- Avoid `!important` (use specificity)
- Use CSS custom properties for theming
- Logical properties where appropriate (`inline`, `block`)
- Container queries for component-level responsiveness

## Security

### Implemented
- Honeypot field for spam protection on contact form
- `novalidate` with custom validation (better UX)
- No inline event handlers (use addEventListener)
- No eval() or similar dangerous functions

### Recommended
- Add Content Security Policy (CSP) headers
- Subresource Integrity (SRI) for external resources
- HTTPS only (already configured in meta tags)

## Browser Support

### Target Browsers
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers on iOS 14+ and Android 10+

### Progressive Enhancement
- Core functionality works without JavaScript
- Fallbacks for CSS features (using @supports)
- Polyfills avoided (modern browsers only)

## File Structure

```
docs/
├── css/
│   └── style.css           # All styles (consider splitting)
├── js/
│   ├── theme-init.js       # Theme initialization (runs early)
│   ├── main.js             # Main application logic
│   ├── translations.js     # i18n system
│   └── artworks.json       # Content data
├── img/                    # Images and artwork
├── index.html              # Home page
├── gallery.html            # Gallery page
├── about.html              # About page
├── contact.html            # Contact page
├── robots.txt              # SEO
└── sitemap.xml             # SEO
```

## Maintenance

### Regular Tasks
- [ ] Update sitemap.xml when adding new pages
- [ ] Test accessibility after major changes
- [ ] Run Lighthouse audits periodically
- [ ] Update dependencies (fonts, external services)
- [ ] Monitor form submissions for spam

### Future Improvements
1. **Images**: Implement responsive images with srcset
2. **Build Process**: Add minification/bundling (Vite/Parcel)
3. **Analytics**: Add privacy-friendly analytics (Plausible/Fathom)
4. **Monitoring**: Add error tracking (Sentry)
5. **Testing**: Add automated accessibility tests (axe)
6. **CMS**: Consider headless CMS for artwork management

## Resources

### Accessibility
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project](https://www.a11yproject.com/)

### Performance
- [Web.dev Performance](https://web.dev/performance/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### Testing Tools
- **Accessibility**: axe DevTools, WAVE, Lighthouse
- **Performance**: Lighthouse, WebPageTest, Chrome DevTools
- **SEO**: Google Search Console, SEO analyzers

---

Last updated: 2025-01-09
Maintained by: UI/UX Designer Agent
