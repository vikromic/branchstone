# Branchstone.art - Design Fix Implementation Guide

Ready-to-implement code snippets for the highest-priority design improvements.

---

## FIX #1: Form Validation States (Critical)

### Problem
Contact form lacks visual feedback for validation errors. Users don't know if their input is valid until attempting to submit.

### Solution
Add CSS for error states + form field styling improvements.

**File to Edit:** `/docs/css/11-contact.css`

**Add this CSS:**

```css
/* ========================================
   FORM FIELD STATES
   ======================================== */

/* Base form field styling */
.form-field {
    margin-bottom: 1.5rem;
    display: flex;
    flex-direction: column;
}

.form-field label {
    font-size: 0.95rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: var(--text-color);
    display: block;
}

.form-field input,
.form-field textarea {
    padding: 0.75rem 1rem;
    border: 1.5px solid var(--border-color);
    border-radius: var(--radius-md);
    font-family: inherit;
    font-size: 1rem;
    background-color: var(--card-background);
    color: var(--text-color);
    transition: all var(--transition-normal) ease;
    line-height: 1.5;
}

/* Focus state */
.form-field input:focus,
.form-field textarea:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 3px rgba(139, 120, 93, 0.1);
    background-color: var(--card-background);
}

/* Error state */
.form-field.error input,
.form-field.error textarea {
    border-color: #d32f2f;
    background-color: rgba(211, 47, 47, 0.05);
}

.form-field.error input:focus,
.form-field.error textarea:focus {
    box-shadow: 0 0 0 3px rgba(211, 47, 47, 0.15);
}

/* Error message styling */
.form-error {
    display: none;
    color: #d32f2f;
    font-size: 0.875rem;
    margin-top: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
}

.form-error::before {
    content: '!';
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    background: #d32f2f;
    color: white;
    border-radius: 50%;
    font-weight: bold;
    font-size: 0.75rem;
    flex-shrink: 0;
}

.form-field.error .form-error {
    display: flex;
}

/* Success state (optional) */
.form-field.success input,
.form-field.success textarea {
    border-color: #4caf50;
    background-color: rgba(76, 175, 80, 0.05);
}

.form-field.success input:focus,
.form-field.success textarea:focus {
    box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.15);
}

/* Disabled state */
.form-field input:disabled,
.form-field textarea:disabled {
    background-color: var(--border-color);
    color: var(--secondary-text);
    cursor: not-allowed;
    opacity: 0.6;
}

/* Form submission feedback */
.form-feedback {
    display: none;
    padding: 1rem;
    border-radius: var(--radius-md);
    margin-bottom: 1.5rem;
    font-weight: 500;
}

.form-feedback.success {
    display: block;
    background-color: rgba(76, 175, 80, 0.1);
    border-left: 4px solid #4caf50;
    color: #2e7d32;
}

.form-feedback.error {
    display: block;
    background-color: rgba(211, 47, 47, 0.1);
    border-left: 4px solid #d32f2f;
    color: #c62828;
}

/* Loading state on submit button */
.submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.submit-btn.loading {
    position: relative;
    color: transparent;
}

.submit-btn.loading::after {
    content: '';
    position: absolute;
    width: 16px;
    height: 16px;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: #ffffff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
}

@keyframes spin {
    to {
        transform: translate(-50%, -50%) rotate(360deg);
    }
}
```

**HTML Structure (Update contact.html):**

```html
<form class="contact-form" id="contact-form">
    <div class="form-feedback" id="form-feedback"></div>

    <div class="form-field" id="field-name">
        <label for="name">Full Name *</label>
        <input
            type="text"
            id="name"
            name="name"
            required
            aria-describedby="error-name"
            data-validate="required|minlength:2"
        >
        <div class="form-error" id="error-name"></div>
    </div>

    <div class="form-field" id="field-email">
        <label for="email">Email Address *</label>
        <input
            type="email"
            id="email"
            name="email"
            required
            aria-describedby="error-email"
            data-validate="required|email"
        >
        <div class="form-error" id="error-email"></div>
    </div>

    <div class="form-field" id="field-subject">
        <label for="subject">Subject</label>
        <input
            type="text"
            id="subject"
            name="subject"
            data-validate="minlength:5"
        >
        <div class="form-error" id="error-subject"></div>
    </div>

    <div class="form-field" id="field-message">
        <label for="message">Message *</label>
        <textarea
            id="message"
            name="message"
            rows="5"
            required
            aria-describedby="error-message"
            data-validate="required|minlength:10"
        ></textarea>
        <div class="form-error" id="error-message"></div>
    </div>

    <button type="submit" class="submit-btn">Send Message</button>
</form>
```

**JavaScript Validation (Add to app.js):**

```javascript
class FormValidator {
    constructor(formId) {
        this.form = document.getElementById(formId);
        if (!this.form) return;

        this.form.addEventListener('blur', (e) => this.validateField(e.target), true);
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    validateField(field) {
        if (!field.dataset.validate) return true;

        const validations = field.dataset.validate.split('|');
        const fieldContainer = field.closest('.form-field');
        const errorDiv = fieldContainer.querySelector('.form-error');

        for (const validation of validations) {
            const [rule, param] = validation.split(':');
            const error = this.checkRule(field.value, rule, param);

            if (error) {
                fieldContainer.classList.add('error');
                errorDiv.textContent = error;
                return false;
            }
        }

        fieldContainer.classList.remove('error');
        fieldContainer.classList.add('success');
        errorDiv.textContent = '';
        return true;
    }

    checkRule(value, rule, param) {
        switch (rule) {
            case 'required':
                return !value.trim() ? 'This field is required' : null;
            case 'email':
                return !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                    ? 'Please enter a valid email address'
                    : null;
            case 'minlength':
                return value.length < parseInt(param)
                    ? `Minimum ${param} characters required`
                    : null;
            default:
                return null;
        }
    }

    handleSubmit(e) {
        e.preventDefault();

        const fields = this.form.querySelectorAll('[data-validate]');
        let isValid = true;

        fields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
            }
        });

        if (!isValid) return;

        this.submitForm();
    }

    submitForm() {
        const submitBtn = this.form.querySelector('.submit-btn');
        const feedback = document.getElementById('form-feedback');

        submitBtn.classList.add('loading');
        submitBtn.disabled = true;

        // Replace with actual form submission (Formspree, etc.)
        fetch(this.form.action, {
            method: 'POST',
            body: new FormData(this.form)
        })
        .then(response => response.json())
        .then(data => {
            feedback.classList.add('success');
            feedback.classList.remove('error');
            feedback.textContent = 'Thank you! Your message has been sent successfully.';
            this.form.reset();

            // Reset field states
            this.form.querySelectorAll('.form-field').forEach(field => {
                field.classList.remove('error', 'success');
            });
        })
        .catch(error => {
            feedback.classList.add('error');
            feedback.classList.remove('success');
            feedback.textContent = 'Error sending message. Please try again.';
        })
        .finally(() => {
            submitBtn.classList.remove('loading');
            submitBtn.disabled = false;
        });
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    new FormValidator('contact-form');
});
```

---

## FIX #2: Mobile Menu Focus Trap (Critical)

### Problem
Mobile menu doesn't trap focus, preventing keyboard users from efficiently navigating. Escape key doesn't close menu.

### Solution
Implement proper focus management.

**File to Edit:** `/docs/js/app.js`

**Add this JavaScript:**

```javascript
class MobileMenuManager {
    constructor() {
        this.toggle = document.getElementById('mobile-menu-toggle');
        this.menu = document.getElementById('mobile-nav-menu');
        this.overlay = document.getElementById('mobile-menu-overlay');

        if (!this.toggle || !this.menu) return;

        this.toggle.addEventListener('click', () => this.toggleMenu());
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
    }

    toggleMenu() {
        if (this.menu.classList.contains('active')) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        this.menu.classList.add('active');
        this.toggle.classList.add('active');

        // Trap focus
        this.setupFocusTrap();

        // Focus first menu item
        const firstLink = this.menu.querySelector('a');
        if (firstLink) {
            // Use setTimeout to ensure DOM has updated
            setTimeout(() => firstLink.focus(), 100);
        }

        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }

    closeMenu() {
        this.menu.classList.remove('active');
        this.toggle.classList.remove('active');

        // Return focus to toggle button
        this.toggle.focus();

        // Re-enable body scroll
        document.body.style.overflow = '';
    }

    setupFocusTrap() {
        const focusableElements = this.menu.querySelectorAll(
            'a, button, [tabindex]'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        this.menu.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                // Shift + Tab on first element → jump to last
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                // Tab on last element → jump to first
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        });
    }

    handleKeydown(e) {
        // Escape key closes menu
        if (e.key === 'Escape' && this.menu.classList.contains('active')) {
            e.preventDefault();
            this.closeMenu();
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    new MobileMenuManager();
});
```

---

## FIX #3: Hover State Contrast (Critical)

### Problem
Some interactive elements have insufficient contrast on hover states, failing WCAG AA (4.5:1 required).

### Solution
Improve hover state colors in light theme.

**File to Edit:** `/docs/css/04-gallery.css` and `/docs/css/05-buttons.css`

**Update filter button hover:**

```css
/* Current (FAILS contrast) */
.filter-btn:hover {
    border-color: var(--accent-color);
    color: var(--accent-color);
}

/* FIXED */
.filter-btn:hover {
    border-color: var(--accent-color);
    color: var(--accent-color);
    background-color: rgba(139, 120, 93, 0.08);  /* Very light brown background */
    box-shadow: 0 2px 8px rgba(139, 120, 93, 0.1);
}
```

**Update secondary button hover:**

```css
/* Current (MARGINAL) */
.btn-secondary:hover {
    background-color: var(--card-background);
    border-color: var(--text-color);
}

/* FIXED - Add darker background */
.btn-secondary:hover {
    background-color: var(--border-color);
    border-color: var(--text-color);
    color: var(--text-color);
}

/* Dark theme adjustment */
[data-theme="dark"] .btn-secondary:hover {
    background-color: rgba(139, 120, 93, 0.15);
    border-color: var(--accent-color);
    color: var(--accent-color);
}
```

**Update navigation link hover:**

```css
/* In 03-header.css, desktop nav section */

/* Current */
#mobile-nav-menu a:hover {
    color: var(--accent-color);
}

/* FIXED - Add underline effect */
#mobile-nav-menu a:hover::after {
    width: 100%;
    background-color: var(--accent-color);  /* Make underline darker */
}

/* Enhance contrast in dark theme */
[data-theme="dark"] #mobile-nav-menu a:hover {
    color: var(--accent-color);  /* Already sufficient contrast */
}
```

---

## FIX #4: Gallery Empty State (Critical)

### Problem
If gallery JSON fails to load, users see blank page with no error message or recovery option.

### Solution
Add empty/error state messaging.

**File to Edit:** `/docs/css/04-gallery.css` and update gallery.html

**Add CSS:**

```css
/* ========================================
   GALLERY EMPTY/ERROR STATES
   ======================================== */

.gallery-empty-state {
    display: none;
    text-align: center;
    padding: 4rem 2rem;
    min-height: 400px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
}

.gallery-empty-state.active {
    display: flex;
}

.gallery-empty-state-icon {
    width: 80px;
    height: 80px;
    opacity: 0.3;
    margin-bottom: 1rem;
}

.gallery-empty-state h3 {
    font-size: 1.75rem;
    margin: 0;
    color: var(--text-color);
}

.gallery-empty-state p {
    font-size: 1rem;
    color: var(--secondary-text);
    margin: 0;
    max-width: 400px;
}

.gallery-empty-state .btn-primary {
    margin-top: 1rem;
}
```

**HTML (Update gallery.html inside featured-carousel):**

```html
<div class="carousel" id="featured-carousel">
    <div class="carousel-track" id="featured-artworks">
        <!-- Dynamically loaded from artworks.json -->
    </div>

    <!-- Empty state - shown when no artworks load -->
    <div class="gallery-empty-state" id="gallery-empty-state">
        <svg class="gallery-empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M9 9l3-3 4 4 5-5m0 0h-2.5m2.5 0v2.5"/>
        </svg>
        <h3>Gallery Loading</h3>
        <p>The gallery is loading. Please wait a moment.</p>
        <button class="btn-primary" onclick="location.reload()">Try Again</button>
    </div>

    <div class="carousel-controls">
        <button class="carousel-prev" aria-label="Previous artwork">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6"/>
            </svg>
        </button>
        <button class="carousel-next" aria-label="Next artwork">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 18l6-6-6-6"/>
            </svg>
        </button>
    </div>

    <div class="carousel-indicators"></div>
</div>
```

**JavaScript (In app.js or gallery-specific JS):**

```javascript
async function loadGallery() {
    const container = document.getElementById('featured-artworks');
    const emptyState = document.getElementById('gallery-empty-state');

    try {
        const response = await fetch('data/artworks.json');

        if (!response.ok) {
            throw new Error('Failed to load gallery');
        }

        const artworks = await response.json();

        if (!artworks || artworks.length === 0) {
            emptyState.classList.add('active');
            return;
        }

        // Render artworks
        container.innerHTML = artworks.map(artwork => `
            <div class="carousel-item">
                <img src="${artwork.image}" alt="${artwork.title}" loading="lazy">
                <div class="gallery-item-info">
                    <h3>${artwork.title}</h3>
                    <p>${artwork.year}</p>
                </div>
            </div>
        `).join('');

        emptyState.classList.remove('active');

    } catch (error) {
        console.error('Gallery load error:', error);
        emptyState.querySelector('h3').textContent = 'Gallery Unavailable';
        emptyState.querySelector('p').textContent = 'We\'re having trouble loading the gallery. Please try again later.';
        emptyState.classList.add('active');
    }
}

// Load on page load
document.addEventListener('DOMContentLoaded', loadGallery);
```

---

## FIX #5: Focus Indicator Standardization (High Priority)

### Problem
Form inputs and text links lack visible focus indicators.

### Solution
Add consistent focus styling across all interactive elements.

**File to Edit:** `/docs/css/11-contact.css` (already included in Fix #1)

**For text links in base styles, add to `/docs/css/02-base.css`:**

```css
/* Enhanced link focus indicators */
a:focus-visible {
    outline: 2px solid var(--accent-color);
    outline-offset: 2px;
    border-radius: 2px;
}

/* Ensure text links have visible focus */
body a:not([class*="btn"]):focus-visible {
    outline: 2px solid var(--accent-color);
    outline-offset: 2px;
}
```

**In footer links (06-footer.css):**

```css
.footer-nav a:focus-visible,
.footer-social-link:focus-visible {
    outline: 2px solid var(--accent-color);
    outline-offset: 2px;
}
```

---

## FIX #6: Touch Target Size on Mobile (High Priority)

### Problem
Text buttons and filter buttons don't meet 44px minimum touch target on mobile.

### Solution
Increase padding on mobile devices.

**File to Edit:** `/docs/css/05-buttons.css`

**Add mobile overrides:**

```css
/* Mobile: Ensure all buttons meet 44px minimum */
@media (max-width: 768px) {
    /* Text button sizing */
    .btn-text {
        padding: 0.75rem 1.5rem;
        min-height: 44px;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
    }

    /* All primary buttons */
    .btn-primary,
    .btn-primary-large {
        padding: 0.875rem 2rem;
        min-height: 44px;
    }

    /* All secondary buttons */
    .btn-secondary,
    .btn-secondary-large {
        padding: 0.875rem 2rem;
        min-height: 44px;
    }

    /* Filter buttons in gallery */
    .filter-btn {
        padding: 0.75rem 1.5rem;
        min-height: 44px;
    }

    /* Submit buttons */
    .submit-btn {
        padding: 0.875rem 2rem;
        min-height: 44px;
    }

    /* Ensure spacing between buttons */
    button + button,
    a.btn-primary + a.btn-secondary,
    a.btn-secondary + a.btn-primary {
        margin-left: 0.5rem;
    }
}
```

---

## FIX #7: Dark Theme Button Variants (High Priority)

### Problem
Primary buttons don't adapt to dark theme, reducing contrast and readability.

### Solution
Create dark theme-specific button colors.

**File to Edit:** `/docs/css/05-buttons.css`

**Add dark theme styles:**

```css
/* Dark theme button variants */
[data-theme="dark"] .btn-primary,
[data-theme="dark"] .btn-primary-large,
[data-theme="dark"] .submit-btn,
[data-theme="dark"] .inquire-btn {
    background-color: #D4A574;  /* Lighter brown for dark background */
    color: #2A2622;  /* Dark text on light button */
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
}

[data-theme="dark"] .btn-primary:hover,
[data-theme="dark"] .btn-primary-large:hover,
[data-theme="dark"] .submit-btn:hover,
[data-theme="dark"] .inquire-btn:hover {
    background-color: #E8B88D;  /* Even lighter on hover */
    box-shadow:
        0 4px 12px rgba(0, 0, 0, 0.5),
        0 12px 40px rgba(0, 0, 0, 0.3);
}

[data-theme="dark"] .btn-secondary,
[data-theme="dark"] .btn-secondary-large {
    border-color: rgba(255, 255, 255, 0.3);
    color: var(--text-color);
}

[data-theme="dark"] .btn-secondary:hover,
[data-theme="dark"] .btn-secondary-large:hover {
    background-color: rgba(255, 255, 255, 0.1);
    border-color: var(--accent-color);
    color: var(--accent-color);
}

/* Text buttons in dark theme */
[data-theme="dark"] .btn-text {
    color: var(--accent-color);
}

[data-theme="dark"] .btn-text:hover {
    color: #E8B88D;
}
```

---

## Implementation Priority

**Week 1 (Critical):**
1. Fix #1 - Form validation states
2. Fix #2 - Mobile menu focus trap
3. Fix #3 - Hover state contrast
4. Fix #4 - Gallery empty state

**Week 2 (High):**
1. Fix #5 - Focus indicators
2. Fix #6 - Touch target sizing
3. Fix #7 - Dark theme buttons

**Testing:**
- Test on actual mobile devices (iOS + Android)
- Test with keyboard navigation only
- Test with screen reader (VoiceOver / NVDA)
- Verify contrast ratios with WebAIM tool
- Test in both light and dark modes

---

## Verification Checklist After Implementation

- [ ] Form validation errors display on blur
- [ ] Form submission shows loading state
- [ ] Mobile menu opens/closes with Escape key
- [ ] Tab focus doesn't escape mobile menu
- [ ] All hover states have 4.5:1+ contrast
- [ ] All buttons are 44x44px minimum on mobile
- [ ] Dark theme buttons have proper contrast
- [ ] Gallery shows empty state message on load failure
- [ ] All focus indicators visible (keyboard nav)
- [ ] Accessibility score improves to 90+

---

**Total Implementation Time:** 8-12 hours of development
**Testing Time:** 3-4 hours
**Review Time:** 1-2 hours

