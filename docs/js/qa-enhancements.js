/**
 * QA Testing Enhancements - JavaScript Fixes
 * Addresses JavaScript-related fixes from QA testing report
 * Date: December 14, 2025
 */

(function () {
  'use strict';

  // ========================================
  // MED-004: Dark Mode Toggle - Dynamic Aria Label
  // ========================================

  const enhanceThemeToggleAccessibility = () => {
    const themeToggle = document.querySelector('.header__theme-toggle');
    if (!themeToggle) return;

    // Update aria-label based on current theme
    const updateAriaLabel = () => {
      const currentTheme = document.body.getAttribute('data-theme') || 'light';
      const newLabel = currentTheme === 'dark'
        ? 'Switch to light mode'
        : 'Switch to dark mode';
      themeToggle.setAttribute('aria-label', newLabel);
    };

    // Initial update
    updateAriaLabel();

    // Listen for theme changes
    const observer = new MutationObserver(updateAriaLabel);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-theme']
    });
  };

  // ========================================
  // MED-009: Lightbox Image Alt Text - Ensure Updates
  // ========================================

  const enhanceLightboxAccessibility = () => {
    const lightbox = document.querySelector('[data-lightbox]') ||
                     document.querySelector('.modal-overlay');
    if (!lightbox) return;

    const lightboxImage = lightbox.querySelector('[data-lightbox-image]') ||
                         lightbox.querySelector('.lightbox__image');

    if (!lightboxImage) return;

    // Add loading state when image changes
    const originalSrcSetter = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src').set;

    Object.defineProperty(lightboxImage, 'src', {
      set: function(value) {
        // Add loading state
        this.classList.add('is-loading');

        // Call original setter
        originalSrcSetter.call(this, value);

        // Remove loading state when loaded
        this.addEventListener('load', () => {
          this.classList.remove('is-loading');
        }, { once: true });

        // Handle error
        this.addEventListener('error', () => {
          this.classList.remove('is-loading');
          this.alt = 'Failed to load image';
        }, { once: true });
      },
      get: function() {
        return this.getAttribute('src');
      }
    });

    // Ensure alt text is always set
    const ensureAltText = () => {
      if (!lightboxImage.alt || lightboxImage.alt.trim() === '') {
        lightboxImage.alt = 'Artwork image';
      }
    };

    // Check periodically
    const altTextObserver = new MutationObserver(ensureAltText);
    altTextObserver.observe(lightboxImage, {
      attributes: true,
      attributeFilter: ['src', 'alt']
    });

    ensureAltText();
  };

  // ========================================
  // MED-011: Instagram Links - External Link Indicators
  // ========================================

  const enhanceExternalLinks = () => {
    const externalLinks = document.querySelectorAll('a[target="_blank"]');

    externalLinks.forEach(link => {
      const currentLabel = link.getAttribute('aria-label') || link.textContent;

      // Add "Opens in new tab" to aria-label
      if (!currentLabel.includes('Opens in new tab')) {
        link.setAttribute('aria-label', `${currentLabel} (Opens in new tab)`);
      }

      // Ensure security attributes
      if (!link.hasAttribute('rel')) {
        link.setAttribute('rel', 'noopener noreferrer');
      } else {
        const rel = link.getAttribute('rel');
        if (!rel.includes('noopener')) {
          link.setAttribute('rel', `${rel} noopener`);
        }
        if (!rel.includes('noreferrer')) {
          link.setAttribute('rel', `${rel} noreferrer`);
        }
      }
    });
  };

  // ========================================
  // LOW-002: Copyright Year Auto-Update
  // ========================================

  const updateCopyrightYear = () => {
    const yearElement = document.getElementById('copyright-year');
    if (yearElement) {
      const currentYear = new Date().getFullYear();
      yearElement.textContent = currentYear;
    }
  };

  // ========================================
  // LOW-008: Smooth Scroll with Reduced Motion Support
  // ========================================

  const enhanceScrollBehavior = () => {
    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Apply scroll behavior
    document.documentElement.style.scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';

    // Listen for changes in motion preference
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      document.documentElement.style.scrollBehavior = e.matches ? 'auto' : 'smooth';
    });
  };

  // ========================================
  // LOW-009: Newsletter Message Auto-Dismiss
  // ========================================

  const enhanceNewsletterMessages = () => {
    const messageEl = document.getElementById('newsletter-message');
    if (!messageEl) return;

    // Auto-dismiss after 5 seconds
    const autoDismissMessage = () => {
      const isVisible = messageEl.classList.contains('newsletter__message--success') ||
                       messageEl.classList.contains('newsletter__message--error');

      if (isVisible) {
        setTimeout(() => {
          messageEl.className = 'newsletter__message';
          messageEl.textContent = '';
        }, 5000);
      }
    };

    // Watch for class changes
    const observer = new MutationObserver(autoDismissMessage);
    observer.observe(messageEl, {
      attributes: true,
      attributeFilter: ['class']
    });
  };

  // ========================================
  // LOW-010: Back to Top Button - Show After 100vh
  // ========================================

  const enhanceBackToTopButton = () => {
    const backToTopButton = document.querySelector('[data-back-to-top]') ||
                           document.querySelector('.back-to-top');
    if (!backToTopButton) return;

    let ticking = false;

    const updateButtonVisibility = () => {
      const scrolled = window.pageYOffset;
      const viewportHeight = window.innerHeight;

      // Show after scrolling past viewport height (100vh)
      if (scrolled > viewportHeight) {
        backToTopButton.classList.add('is-visible');
        backToTopButton.setAttribute('aria-hidden', 'false');
        backToTopButton.setAttribute('tabindex', '0');
      } else {
        backToTopButton.classList.remove('is-visible');
        backToTopButton.setAttribute('aria-hidden', 'true');
        backToTopButton.setAttribute('tabindex', '-1');
      }

      ticking = false;
    };

    const requestButtonUpdate = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateButtonVisibility);
        ticking = true;
      }
    };

    window.addEventListener('scroll', requestButtonUpdate, { passive: true });

    // Initial check
    updateButtonVisibility();
  };

  // ========================================
  // HIGH-006: Form Validation - Enhanced Visual Feedback
  // ========================================

  const enhanceFormValidation = () => {
    const forms = document.querySelectorAll('[data-form], form');

    forms.forEach(form => {
      const inputs = form.querySelectorAll('input, textarea, select');

      inputs.forEach(input => {
        // Real-time validation on input
        input.addEventListener('input', () => {
          // Clear error state on input
          if (input.classList.contains('has-error')) {
            input.classList.remove('has-error');
            input.setAttribute('aria-invalid', 'false');

            const errorEl = input.nextElementSibling;
            if (errorEl && errorEl.classList.contains('field-error')) {
              errorEl.style.display = 'none';
            }
          }

          // Show success state for valid fields (only if field has value)
          if (input.value.trim() && input.validity.valid) {
            input.classList.add('is-valid');
          } else {
            input.classList.remove('is-valid');
          }
        });

        // Validate on blur
        input.addEventListener('blur', () => {
          if (input.value.trim()) {
            if (!input.validity.valid) {
              input.classList.add('has-error');
              input.classList.remove('is-valid');
              input.setAttribute('aria-invalid', 'true');
            } else {
              input.classList.add('is-valid');
              input.classList.remove('has-error');
              input.setAttribute('aria-invalid', 'false');
            }
          }
        });
      });
    });
  };

  // ========================================
  // HIGH-007: Loading States for Async Operations
  // ========================================

  const enhanceLoadingStates = () => {
    // Add loading state to favorite buttons
    document.addEventListener('click', (e) => {
      const favoriteBtn = e.target.closest('.artwork-card__favorite');
      if (favoriteBtn) {
        // Visual feedback - button state
        favoriteBtn.style.pointerEvents = 'none';
        setTimeout(() => {
          favoriteBtn.style.pointerEvents = '';
        }, 300);
      }
    });

    // Enhance form submit buttons
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        const submitBtn = form.querySelector('[type="submit"]');
        if (submitBtn && !submitBtn.classList.contains('is-loading')) {
          submitBtn.classList.add('is-loading');
          submitBtn.disabled = true;

          // Remove loading state after timeout (fallback)
          setTimeout(() => {
            submitBtn.classList.remove('is-loading');
            submitBtn.disabled = false;
          }, 10000);
        }
      });
    });
  };

  // ========================================
  // HIGH-004: Mobile Filter Dropdown - Enhanced Keyboard Navigation
  // ========================================

  const enhanceMobileFilterAccessibility = () => {
    const dropdown = document.getElementById('mobile-filter-dropdown');
    const toggle = document.querySelector('.mobile-filter-toggle');

    if (!dropdown || !toggle) return;

    // Ensure Escape key closes dropdown
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !dropdown.hidden) {
        const closeButton = dropdown.querySelector('.mobile-filter-dropdown__close');
        if (closeButton) {
          closeButton.click();
        }

        // Return focus to toggle
        toggle.focus();
      }
    });

    // Improve focus management
    dropdown.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const focusableElements = dropdown.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Trap focus within dropdown
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    });
  };

  // ========================================
  // Accessibility: Form Input Font Size (Prevent iOS Zoom)
  // ========================================

  const preventMobileInputZoom = () => {
    if (window.innerWidth <= 767) {
      const inputs = document.querySelectorAll(
        'input[type="text"], input[type="email"], input[type="tel"], input[type="search"], textarea, select'
      );

      inputs.forEach(input => {
        const computedFontSize = window.getComputedStyle(input).fontSize;
        const fontSize = parseFloat(computedFontSize);

        // iOS zooms if font-size is < 16px
        if (fontSize < 16) {
          input.style.fontSize = '16px';
        }
      });
    }
  };

  // ========================================
  // Performance: Image Loading Optimization
  // ========================================

  const optimizeImageLoading = () => {
    // Add loading states to images
    const images = document.querySelectorAll('img[loading="lazy"]');

    images.forEach(img => {
      if (!img.complete) {
        img.classList.add('lazy-loading');

        img.addEventListener('load', () => {
          img.classList.remove('lazy-loading');
          img.classList.add('lazy-loaded');
        }, { once: true });

        img.addEventListener('error', () => {
          img.classList.remove('lazy-loading');
          img.classList.add('lazy-error');
          // Set fallback alt text
          img.alt = img.alt || 'Image failed to load';
        }, { once: true });
      }
    });
  };

  // ========================================
  // MED-008: Update Filter Count Badge Dynamically
  // ========================================

  const updateFilterCountBadge = () => {
    const toggle = document.querySelector('.mobile-filter-toggle');
    const countBadge = toggle?.querySelector('.mobile-filter-toggle__count');
    const label = toggle?.querySelector('.mobile-filter-toggle__label');

    if (!toggle || !countBadge) return;

    // Watch for filter changes
    document.addEventListener('click', (e) => {
      const filterButton = e.target.closest('[data-filter], [data-mobile-filter]');
      if (!filterButton) return;

      const filter = filterButton.getAttribute('data-filter') ||
                    filterButton.getAttribute('data-mobile-filter');

      setTimeout(() => {
        if (filter === 'all') {
          countBadge.hidden = true;
          countBadge.removeAttribute('aria-label');
          if (label) label.textContent = 'Filters';
        } else {
          countBadge.hidden = false;
          countBadge.textContent = '1';
          countBadge.setAttribute('aria-label', '1 active filter');
          if (label) label.textContent = filterButton.textContent.trim();
        }
      }, 50);
    });
  };

  // ========================================
  // INITIALIZATION
  // ========================================

  const initQAEnhancements = () => {
    try {
      enhanceThemeToggleAccessibility();
      enhanceLightboxAccessibility();
      enhanceExternalLinks();
      updateCopyrightYear();
      enhanceScrollBehavior();
      enhanceNewsletterMessages();
      enhanceBackToTopButton();
      enhanceFormValidation();
      enhanceLoadingStates();
      enhanceMobileFilterAccessibility();
      preventMobileInputZoom();
      optimizeImageLoading();
      updateFilterCountBadge();

      console.log('QA enhancements initialized successfully');
    } catch (error) {
      console.error('Error initializing QA enhancements:', error);
    }
  };

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQAEnhancements);
  } else {
    initQAEnhancements();
  }

  // Re-run on page show (for back/forward cache)
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      initQAEnhancements();
    }
  });
})();
