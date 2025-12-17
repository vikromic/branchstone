/**
 * Branchstone Art - Main JavaScript
 * Premium artist portfolio website
 * All features initialized on DOMContentLoaded
 */

// Import foundational modules
import { THEME, SCROLL, ANIMATION, STORAGE_KEYS, TIMING } from './constants.js';
import { debounce, prefersReducedMotion, trapFocus, smoothScrollTo } from './utils.js';
import { isValidImageUrl, sanitizeText } from './security.js';
import * as storage from './storage.js';

// Import feature modules
import { LightboxManager } from './lightbox-manager.js';
import { FavoritesManager } from './favorites-manager.js';
import { FormValidator } from './form-validator.js';
import { MobileMenuManager } from './mobile-menu-manager.js';
import { ScrollManager } from './scroll-manager.js';
import { GalleryDataManager } from './gallery-data.js';

(function () {
  'use strict';

  // ========================================
  // 1. THEME TOGGLE
  // ========================================

  const initThemeToggle = () => {
    // Support both data-theme-toggle and class-based selectors
    const toggleButton = document.querySelector('[data-theme-toggle]') ||
                        document.querySelector('.header__theme-toggle');

    if (!toggleButton) {
      console.warn('[Theme] Toggle button not found');
      return;
    }

    // Get initial theme
    const getInitialTheme = () => {
      const savedTheme = storage.getItem(STORAGE_KEYS.THEME);
      if (savedTheme && (savedTheme === THEME.DARK || savedTheme === THEME.LIGHT)) {
        return savedTheme;
      }

      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? THEME.DARK : THEME.LIGHT;
    };

    // Set theme
    const setTheme = (theme, animate = true) => {
      // Validate theme value
      if (theme !== THEME.DARK && theme !== THEME.LIGHT) {
        console.warn('[Theme] Invalid theme value:', theme);
        theme = THEME.LIGHT;
      }

      // Apply theme to document root and body for maximum compatibility
      document.documentElement.setAttribute('data-theme', theme);
      document.body.setAttribute('data-theme', theme);

      // Save to storage
      const saved = storage.setItem(STORAGE_KEYS.THEME, theme);

      if (!saved) {
        console.warn('[Theme] Failed to save theme to storage');
      }
    };

    // Toggle theme
    const toggleTheme = () => {
      const currentTheme = document.body.getAttribute('data-theme') || THEME.LIGHT;
      const newTheme = currentTheme === THEME.DARK ? THEME.LIGHT : THEME.DARK;
      setTheme(newTheme);
    };

    // Initialize - get and apply initial theme
    const initialTheme = getInitialTheme();
    setTheme(initialTheme, false);

    // Event listener
    toggleButton.addEventListener('click', toggleTheme);

    // Listen for system preference changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      // Only auto-switch if user hasn't manually set a preference
      if (!storage.hasItem(STORAGE_KEYS.THEME)) {
        setTheme(e.matches ? THEME.DARK : THEME.LIGHT, false);
      }
    });
  };

  // ========================================
  // 2. MOBILE NAVIGATION (Legacy - redirects to unified handler)
  // ========================================

  const initMobileNavigation = () => {
    // This function is kept for backwards compatibility
    // The unified initMobileMenu handles all mobile menu functionality
    return;
  };

  // ========================================
  // MOBILE MENU TOGGLE (Unified)
  // ========================================

  const initMobileMenu = () => {
    const mobileMenuManager = new MobileMenuManager();
    mobileMenuManager.init();
  };

  // ========================================
  // 3. SCROLL ANIMATIONS & BEHAVIOR
  // ========================================

  const initScrollAnimations = () => {
    const scrollManager = new ScrollManager();
    scrollManager.init();
  };

  const initArtworkScrollAnimations = () => {
    // Handled by ScrollManager in initScrollAnimations
    return;
  };

  // ========================================
  // 4. GALLERY DATA LOADING
  // ========================================

  const initGalleryData = async () => {
    // Only run on gallery page
    if (!document.querySelector('.bento-grid')) {
      console.log('[Gallery] Bento grid not found, skipping gallery initialization');
      return null;
    }

    console.log('[Gallery] Initializing gallery data manager...');
    const galleryManager = new GalleryDataManager();
    const success = await galleryManager.init();

    console.log('[Gallery] Init result:', success);

    if (success) {
      console.log('[Gallery] Initializing gallery-dependent features...');
      // Re-initialize features that depend on gallery cards
      // These need to be called after gallery is rendered
      initLightbox();
      initFavorites();
      initArtworkOverlays();
      initArtworkInquiry();
      initGalleryFiltering();
      initMobileFilterDropdown();
      console.log('[Gallery] All features initialized');
    } else {
      console.error('[Gallery] Failed to initialize gallery');
    }

    return galleryManager;
  };

  // ========================================
  // 5. GALLERY FILTERING
  // ========================================

  // Shared gallery filtering state (accessible to both desktop and mobile filters)
  let isGalleryFiltering = false;

  const filterGallery = (filter) => {
    if (isGalleryFiltering) return;
    isGalleryFiltering = true;

    const artworkCards = document.querySelectorAll('[data-collection]');

    artworkCards.forEach((card, index) => {
      const collection = card.getAttribute('data-collection');
      const shouldShow = filter === 'all' || collection === filter;

      if (shouldShow) {
        card.style.display = '';

        if (!prefersReducedMotion()) {
          card.style.opacity = '0';
          card.style.transform = 'translateY(20px)';

          setTimeout(() => {
            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, index * 50);
        }
      } else {
        if (!prefersReducedMotion()) {
          card.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
          card.style.opacity = '0';
          card.style.transform = 'translateY(-20px)';

          setTimeout(() => {
            card.style.display = 'none';
          }, 200);
        } else {
          card.style.display = 'none';
        }
      }
    });

    // Reset flag after animations complete
    const totalDuration = 200 + (artworkCards.length * 50);
    setTimeout(() => { isGalleryFiltering = false; }, totalDuration);
  };

  const initGalleryFiltering = () => {
    const filterButtons = document.querySelectorAll('[data-filter]');
    const artworkCards = document.querySelectorAll('[data-collection]');

    if (filterButtons.length === 0 || artworkCards.length === 0) return;

    const updateActiveButton = (activeButton) => {
      filterButtons.forEach(button => {
        button.classList.remove('tag-active');
        button.setAttribute('aria-pressed', 'false');
      });

      activeButton.classList.add('tag-active');
      activeButton.setAttribute('aria-pressed', 'true');
    };

    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        const filter = button.getAttribute('data-filter');
        filterGallery(filter);
        updateActiveButton(button);
      });
    });
  };

  // ========================================
  // 6. LIGHTBOX
  // ========================================

  const initLightbox = () => {
    const lightboxManager = new LightboxManager();
    lightboxManager.init();
  };

  // ========================================
  // 6. SMOOTH SCROLL
  // ========================================

  const initSmoothScroll = () => {
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    const header = document.querySelector('[data-header]');
    const headerOffset = header ? header.offsetHeight : 0;

    anchorLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');

        // Ignore empty or hash-only links
        if (href === '#' || href === '#!') return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();

        smoothScrollTo(href, headerOffset + 20);

        // Update URL
        if (history.pushState) {
          history.pushState(null, null, href);
        } else {
          window.location.hash = href;
        }
      });
    });
  };

  // ========================================
  // 7. FORM HANDLING
  // ========================================

  const initFormHandling = () => {
    const formValidator = new FormValidator();
    formValidator.init();
  };

  // ========================================
  // 8. HEADER SCROLL BEHAVIOR
  // ========================================

  const initHeaderScroll = () => {
    // Handled by ScrollManager in initScrollAnimations
    return;
  };

  // ========================================
  // HERO PARALLAX EFFECT
  // ========================================

  const initHeroParallax = () => {
    // Handled by ScrollManager in initScrollAnimations
    return;
  };

  // ========================================
  // 9. LAZY LOADING ENHANCEMENT
  // ========================================

  const initLazyLoading = () => {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');

    lazyImages.forEach(img => {
      // Add blur placeholder class
      if (!img.complete) {
        img.classList.add('lazy-loading');
      }

      // Fade in on load
      img.addEventListener('load', () => {
        if (!prefersReducedMotion()) {
          img.style.transition = 'opacity 0.3s ease';
        }
        img.classList.remove('lazy-loading');
        img.classList.add('lazy-loaded');
      });

      // Handle error
      img.addEventListener('error', () => {
        img.classList.remove('lazy-loading');
        img.classList.add('lazy-error');
      });
    });
  };

  // ========================================
  // 10. SKIP LINK FUNCTIONALITY
  // ========================================

  const initSkipLink = () => {
    const skipLink = document.querySelector('[data-skip-link]');
    if (!skipLink) return;

    skipLink.addEventListener('click', (e) => {
      const target = skipLink.getAttribute('href');
      const element = document.querySelector(target);

      if (element) {
        e.preventDefault();

        // Make element focusable
        element.setAttribute('tabindex', '-1');
        element.focus();

        // Smooth scroll
        smoothScrollTo(target, 0);

        // Remove tabindex after focus
        element.addEventListener('blur', () => {
          element.removeAttribute('tabindex');
        }, { once: true });
      }
    });
  };

  // ========================================
  // 11. NEWSLETTER FORM HANDLING
  // ========================================

  const initNewsletter = () => {
    const form = document.getElementById('newsletter-form');
    if (!form) return;

    const messageEl = document.getElementById('newsletter-message');
    const emailInput = form.querySelector('input[type="email"]');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Email validation
    const isValidEmail = (email) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // Show message
    const showMessage = (text, type) => {
      messageEl.textContent = text;
      messageEl.className = `newsletter__message newsletter__message--${type}`;
    };

    // Clear message
    const clearMessage = () => {
      messageEl.className = 'newsletter__message';
    };

    // Form submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = emailInput.value.trim();

      // Validate email
      if (!email || !isValidEmail(email)) {
        showMessage('Please enter a valid email address.', 'error');
        emailInput.focus();
        return;
      }

      // Disable form
      submitBtn.disabled = true;
      submitBtn.textContent = 'Subscribing...';
      clearMessage();

      try {
        // Simulate API call (replace with actual endpoint in production)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Store in localStorage as backup
        const subscribers = storage.getItem(STORAGE_KEYS.NEWSLETTER_SUBSCRIBERS) || [];
        if (!subscribers.includes(email)) {
          subscribers.push(email);
          storage.setItem(STORAGE_KEYS.NEWSLETTER_SUBSCRIBERS, subscribers);
        }

        showMessage('Thank you for subscribing! Check your inbox for a welcome message.', 'success');
        form.reset();
        emailInput.blur();
      } catch (error) {
        console.error('Newsletter subscription error:', error);
        showMessage('Something went wrong. Please try again.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Subscribe';
      }
    });

    // Clear error on input
    emailInput.addEventListener('input', () => {
      if (messageEl.classList.contains('newsletter__message--error')) {
        clearMessage();
      }
    });
  };

  // ========================================
  // 12. STATISTICS COUNTER ANIMATION
  // ========================================

  const initStatsCounter = () => {
    if (prefersReducedMotion()) {
      // If reduced motion is preferred, just show the stats immediately
      const statItems = document.querySelectorAll('[data-stat-item]');
      statItems.forEach(item => item.classList.add('is-visible'));
      return;
    }

    const statItems = document.querySelectorAll('[data-stat-item]');
    if (statItems.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.3
    };

    const animateValue = (element, start, end, duration, suffix = '') => {
      const range = end - start;
      const increment = range / (duration / 16); // 60fps
      let current = start;

      const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
          current = end;
          clearInterval(timer);
        }
        element.textContent = Math.floor(current) + suffix;
      }, 16);
    };

    const handleIntersection = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');

          // Animate the number
          const numberEl = entry.target.querySelector('[data-stat-number]');
          if (numberEl) {
            const targetValue = parseInt(numberEl.getAttribute('data-stat-number'));
            const text = numberEl.textContent;
            const hasPlus = text.includes('+');
            const hasPercent = text.includes('%');
            const suffix = hasPlus ? '+' : hasPercent ? '%' : '';

            // Start animation
            animateValue(numberEl, 0, targetValue, 1500, suffix);
          }

          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    statItems.forEach(item => {
      observer.observe(item);
    });
  };

  // ========================================
  // 13. FAVORITES SYSTEM
  // ========================================

  const initFavorites = () => {
    const favoritesManager = new FavoritesManager();
    favoritesManager.init();
  };

  // ========================================
  // 14. FAVORITES PANEL
  // ========================================

  const initFavoritesPanel = () => {
    const STORAGE_KEY = STORAGE_KEYS.FAVORITES;
    const panel = document.querySelector('.favorites-panel');
    const backdrop = document.querySelector('.favorites-backdrop');
    const favoritesButton = document.querySelector('.header__favorites');
    const closeButton = panel?.querySelector('.favorites-panel__close');
    const favoritesList = panel?.querySelector('.favorites-list');
    const emptyState = panel?.querySelector('.favorites-empty');
    const countEl = panel?.querySelector('[data-count]');
    const selectedCountEl = panel?.querySelector('[data-selected-count]');
    const pluralEl = panel?.querySelector('[data-plural]');
    const clearAllButton = panel?.querySelector('.favorites-panel__clear');
    const inquireButton = panel?.querySelector('.favorites-panel__inquire');

    if (!panel || !backdrop) return;

    let focusedElementBeforePanel = null;

    // Get favorites data with full artwork details
    const getFavoritesData = () => {
      const favoriteIds = storage.getItem(STORAGE_KEY);
      if (!favoriteIds || !Array.isArray(favoriteIds)) return [];

      const favoritesData = [];

        // Get artwork data from DOM
        favoriteIds.forEach(id => {
          const artworkCard = document.querySelector(`[data-artwork-id="${id}"]`);
          if (artworkCard) {
            const parentCard = artworkCard.closest('.artwork-card');
            if (parentCard) {
              const titleEl = parentCard.querySelector('.artwork-card__title');
              const collectionEl = parentCard.querySelector('.artwork-card__collection');
              const priceEl = parentCard.querySelector('.artwork-card__price');
              const imageEl = parentCard.querySelector('.artwork-card__image');

              favoritesData.push({
                id,
                title: titleEl?.textContent || 'Untitled',
                collection: collectionEl?.textContent || '',
                price: priceEl?.textContent || '',
                image: imageEl?.src || ''
              });
            }
          }
        });

        return favoritesData;
    };

    // Create favorite item element (safe DOM creation)
    const createFavoriteItem = (item) => {
      const li = document.createElement('li');
      li.className = 'favorite-item';
      li.setAttribute('data-favorite-id', item.id);

      // Image wrapper
      const imageWrapper = document.createElement('div');
      imageWrapper.className = 'favorite-item__image-wrapper';
      const img = document.createElement('img');
      img.src = item.image;
      img.alt = item.title;
      img.className = 'favorite-item__image';
      img.loading = 'lazy';
      imageWrapper.appendChild(img);

      // Details
      const details = document.createElement('div');
      details.className = 'favorite-item__details';

      const title = document.createElement('h3');
      title.className = 'favorite-item__title';
      title.textContent = item.title;

      const collection = document.createElement('p');
      collection.className = 'favorite-item__collection';
      collection.textContent = item.collection;

      const price = document.createElement('p');
      price.className = 'favorite-item__price';
      price.textContent = item.price;

      details.appendChild(title);
      details.appendChild(collection);
      details.appendChild(price);

      // Actions
      const actions = document.createElement('div');
      actions.className = 'favorite-item__actions';

      const removeBtn = document.createElement('button');
      removeBtn.className = 'favorite-item__remove';
      removeBtn.setAttribute('aria-label', `Remove ${item.title} from favorites`);
      removeBtn.setAttribute('data-remove-id', item.id);
      removeBtn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';

      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeFavorite(item.id);
      });

      actions.appendChild(removeBtn);

      // Assemble
      li.appendChild(imageWrapper);
      li.appendChild(details);
      li.appendChild(actions);

      return li;
    };

    // Render favorites list
    const renderFavorites = () => {
      const favorites = getFavoritesData();

      // Update count displays
      const count = favorites.length;
      if (countEl) countEl.textContent = count;
      if (selectedCountEl) selectedCountEl.textContent = count;
      if (pluralEl) pluralEl.textContent = count === 1 ? '' : 's';

      // Show/hide empty state
      if (favorites.length === 0) {
        favoritesList.innerHTML = '';
        emptyState.classList.add('is-visible');
        clearAllButton.disabled = true;
        inquireButton.disabled = true;
      } else {
        emptyState.classList.remove('is-visible');
        clearAllButton.disabled = false;
        inquireButton.disabled = false;

        // Clear and render list items
        favoritesList.innerHTML = '';
        favorites.forEach(item => {
          favoritesList.appendChild(createFavoriteItem(item));
        });
      }
    };

    // Remove individual favorite
    const removeFavorite = (artworkId) => {
      const favorites = storage.getItem(STORAGE_KEY) || [];
      const index = favorites.indexOf(artworkId);

      if (index > -1) {
        // Animate removal
        const item = favoritesList.querySelector(`[data-favorite-id="${artworkId}"]`);
        if (item) {
          item.classList.add('is-removing');
          setTimeout(() => {
            favorites.splice(index, 1);
            storage.setItem(STORAGE_KEY, favorites);

              // Update favorites button state
              const favButton = document.querySelector(`[data-artwork-id="${artworkId}"]`);
              if (favButton) {
                favButton.classList.remove('is-favorited');
                favButton.setAttribute('aria-label', 'Add to favorites');
              }

              // Update header count
              const headerCount = document.querySelector('.header__favorites-count');
              if (headerCount) {
                headerCount.textContent = favorites.length;
                headerCount.classList.toggle('has-items', favorites.length > 0);
              }

              renderFavorites();
            }, 300);
          }
        }
      }
    };

    // Clear all favorites
    const clearAllFavorites = () => {
      if (confirm('Are you sure you want to clear all favorites?')) {
        storage.setItem(STORAGE_KEY, []);

        // Update all favorite buttons
        document.querySelectorAll('.artwork-card__favorite.is-favorited').forEach(btn => {
          btn.classList.remove('is-favorited');
          btn.setAttribute('aria-label', 'Add to favorites');
        });

        // Update header count
        const headerCount = document.querySelector('.header__favorites-count');
        if (headerCount) {
          headerCount.textContent = '0';
          headerCount.classList.remove('has-items');
        }

        renderFavorites();
      }
    };

    // State guard for rapid toggling
    let panelTransitioning = false;

    // Open panel
    const openPanel = () => {
      if (panelTransitioning) return;
      panelTransitioning = true;

      focusedElementBeforePanel = document.activeElement;

      renderFavorites();

      panel.hidden = false;
      backdrop.hidden = false;

      // Trigger reflow for transition
      panel.offsetHeight;
      backdrop.offsetHeight;

      panel.classList.add('is-active');
      backdrop.classList.add('is-active');
      document.body.style.overflow = 'hidden';

      // Focus close button after animation and reset transition flag
      setTimeout(() => {
        closeButton?.focus();
        panelTransitioning = false;
      }, 400);
    };

    // Close panel
    const closePanel = () => {
      if (panelTransitioning) return;
      panelTransitioning = true;

      panel.classList.remove('is-active');
      backdrop.classList.remove('is-active');

      // Wait for CSS transition to complete before hiding panel
      setTimeout(() => {
        panel.hidden = true;
        backdrop.hidden = true;
        document.body.style.overflow = '';

        // Return focus
        if (focusedElementBeforePanel) {
          focusedElementBeforePanel.focus();
        }

        panelTransitioning = false;
      }, 400);
    };

    // Handle inquire button
    const handleInquire = () => {
      const favorites = getFavoritesData();
      if (favorites.length === 0) return;

      // Store inquiry data in storage
      storage.setItem(STORAGE_KEYS.PENDING_INQUIRY, {
        artworks: favorites,
        timestamp: Date.now()
      });

      // Navigate to contact page
      window.location.href = 'contact.html';
    };

    // Event listeners
    favoritesButton?.addEventListener('click', openPanel);
    closeButton?.addEventListener('click', closePanel);
    backdrop?.addEventListener('click', closePanel);
    clearAllButton?.addEventListener('click', clearAllFavorites);
    inquireButton?.addEventListener('click', handleInquire);

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && panel.classList.contains('is-active')) {
        closePanel();
      }
    });

    // Focus trap
    panel?.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;

      const focusableElements = panel.querySelectorAll(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    });

    // Swipe-to-close support for mobile (bottom sheet)
    if (window.innerWidth <= 767) {
      let touchStartY = 0;
      let touchEndY = 0;

      panel.addEventListener('touchstart', (e) => {
        touchStartY = e.changedTouches[0].screenY;
      }, { passive: true });

      panel.addEventListener('touchmove', (e) => {
        const currentY = e.changedTouches[0].screenY;
        const deltaY = currentY - touchStartY;

        // Only allow dragging down
        if (deltaY > 0 && !panel.querySelector('.favorites-panel__content').scrollTop) {
          e.preventDefault();
          panel.style.transform = `translateY(${deltaY}px)`;
        }
      });

      panel.addEventListener('touchend', (e) => {
        touchEndY = e.changedTouches[0].screenY;
        const deltaY = touchEndY - touchStartY;

        // If dragged down more than 100px, close panel
        if (deltaY > 100) {
          closePanel();
        } else {
          // Reset position
          panel.style.transform = '';
        }
      }, { passive: true });
    }
  };

  // ========================================
  // 15. CONTACT FORM INQUIRY PRE-FILL
  // ========================================

  const initInquiryPrefill = () => {
    // Only run on contact page
    if (!document.querySelector('.main') || !window.location.pathname.includes('contact')) return;

    const inquiryData = storage.getItemWithExpiration(STORAGE_KEYS.PENDING_INQUIRY, TIMING.ONE_HOUR);
    if (!inquiryData) return;

    const { artworks, timestamp } = inquiryData;

      // Pre-fill form
      const subjectField = document.querySelector('[name="subject"]');
      const messageField = document.querySelector('[name="message"]');

      if (subjectField && messageField) {
        // Set subject
        if (subjectField.tagName === 'SELECT') {
          const artworkOption = Array.from(subjectField.options).find(
            opt => opt.textContent.toLowerCase().includes('artwork') ||
                   opt.textContent.toLowerCase().includes('inquiry')
          );
          if (artworkOption) {
            subjectField.value = artworkOption.value;
          }
        } else {
          subjectField.value = 'Artwork Inquiry';
        }

        // Build message
        let message = "I'm interested in learning more about the following pieces:\n\n";
        artworks.forEach(artwork => {
          message += `• ${artwork.title}`;
          if (artwork.collection) message += ` (${artwork.collection})`;
          if (artwork.price) message += ` - ${artwork.price}`;
          message += '\n';
        });
        message += '\n';

        messageField.value = message;

        // Scroll to form
        messageField.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // Clear inquiry data
        storage.removeItem(STORAGE_KEYS.PENDING_INQUIRY);
      }
  };

  // ========================================
  // 16. BACK TO TOP BUTTON
  // ========================================

  const initBackToTop = () => {
    const backToTopButton = document.querySelector('[data-back-to-top]');
    if (!backToTopButton) return;

    const SCROLL_TRIGGER = SCROLL.TRIGGER_BACK_TO_TOP;

    // Show/hide button based on scroll position
    const handleScroll = () => {
      const scrolled = window.pageYOffset > SCROLL_TRIGGER;

      if (scrolled) {
        backToTopButton.classList.add('is-visible');
        backToTopButton.setAttribute('aria-hidden', 'false');
      } else {
        backToTopButton.classList.remove('is-visible');
        backToTopButton.setAttribute('aria-hidden', 'true');
      }
    };

    // Scroll to top smoothly
    const scrollToTop = (e) => {
      e.preventDefault();

      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth'
      });

      // Focus on skip link after scrolling to top
      setTimeout(() => {
        const skipLink = document.querySelector('[data-skip-link]');
        if (skipLink) {
          skipLink.focus();
        }
      }, 100);
    };

    // Event listeners
    window.addEventListener('scroll', debounce(handleScroll, 100));
    backToTopButton.addEventListener('click', scrollToTop);

    // Keyboard support
    backToTopButton.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        scrollToTop(e);
      }
    });

    // Initial check
    handleScroll();
  };

  // ========================================
  // 17. ARTWORK CARD OVERLAYS
  // ========================================

  const initArtworkOverlays = () => {
    const artworkCards = document.querySelectorAll('.artwork-card');

    artworkCards.forEach(card => {
      // Skip if overlay already exists
      if (card.querySelector('.artwork-card__overlay')) return;

      // Get card data
      const title = card.querySelector('.artwork-card__title')?.textContent || '';
      const collection = card.querySelector('.artwork-card__collection')?.textContent || '';

      // Create overlay element
      const overlay = document.createElement('div');
      overlay.className = 'artwork-card__overlay';
      overlay.setAttribute('aria-hidden', 'true');

      // Build overlay content using safe DOM methods (prevents XSS)
      const titleEl = document.createElement('h3');
      titleEl.className = 'artwork-card__overlay-title';
      titleEl.textContent = title; // Safe: textContent escapes HTML

      const collectionEl = document.createElement('p');
      collectionEl.className = 'artwork-card__overlay-collection';
      collectionEl.textContent = collection; // Safe: textContent escapes HTML

      const ctaSpan = document.createElement('span');
      ctaSpan.className = 'artwork-card__overlay-cta';
      ctaSpan.textContent = 'View Details ';

      // Create SVG using namespace-aware methods
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
      svg.setAttribute('aria-hidden', 'true');

      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('d', 'M5 12h14M12 5l7 7-7 7');
      svg.appendChild(path);
      ctaSpan.appendChild(svg);

      overlay.appendChild(titleEl);
      overlay.appendChild(collectionEl);
      overlay.appendChild(ctaSpan);

      // Insert overlay before the content div (so it's behind the favorite button)
      const imageWrapper = card.querySelector('.artwork-card__image');
      if (imageWrapper) {
        imageWrapper.parentNode.insertBefore(overlay, imageWrapper.nextSibling);
      } else {
        card.appendChild(overlay);
      }
    });
  };

  // ========================================
  // STICKY INQUIRY BUTTON (Mobile Gallery)
  // ========================================

  const initStickyInquiryButton = () => {
    const stickyButton = document.getElementById('sticky-inquiry-btn');
    if (!stickyButton) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateStickyButton = () => {
      const currentScrollY = window.scrollY;

      // Show button after scrolling 300px down
      if (currentScrollY > 300) {
        stickyButton.classList.add('is-visible');
      } else {
        stickyButton.classList.remove('is-visible');
      }

      lastScrollY = currentScrollY;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateStickyButton);
        ticking = true;
      }
    };

    // Add scroll listener
    window.addEventListener('scroll', onScroll, { passive: true });

    // Click handler - redirect to contact page
    stickyButton.addEventListener('click', () => {
      window.location.href = 'contact.html';
    });
  };

  // ========================================
  // MOBILE FILTER DROPDOWN
  // ========================================

  const initMobileFilterDropdown = () => {
    const toggle = document.querySelector('.mobile-filter-toggle');
    const dropdown = document.getElementById('mobile-filter-dropdown');
    const closeButton = dropdown?.querySelector('.mobile-filter-dropdown__close');
    const mobileFilterButtons = document.querySelectorAll('[data-mobile-filter]');
    const desktopFilterButtons = document.querySelectorAll('[data-filter]');

    if (!toggle || !dropdown) return;

    let focusedElementBeforeDropdown = null;

    // Open dropdown
    const openDropdown = () => {
      focusedElementBeforeDropdown = document.activeElement;

      dropdown.hidden = false;
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';

      // Focus first filter option after animation
      setTimeout(() => {
        const firstButton = dropdown.querySelector('.mobile-filter-chip');
        if (firstButton) firstButton.focus();
      }, 300);
    };

    // Close dropdown
    const closeDropdown = () => {
      dropdown.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';

      // Return focus
      if (focusedElementBeforeDropdown) {
        focusedElementBeforeDropdown.focus();
      }
    };

    // Update filter count badge
    const updateFilterCount = () => {
      const countBadge = toggle.querySelector('.mobile-filter-toggle__count');
      const label = toggle.querySelector('.mobile-filter-toggle__label');
      if (!countBadge || !label) return;

      // Find active filter
      let activeFilterName = 'All';
      mobileFilterButtons.forEach(button => {
        if (button.classList.contains('mobile-filter-chip--active')) {
          const filter = button.getAttribute('data-filter');
          if (filter !== 'all') {
            activeFilterName = button.textContent.trim();
          }
        }
      });

      // Update label and badge
      if (activeFilterName !== 'All') {
        label.textContent = activeFilterName;
        countBadge.textContent = '1';
        countBadge.hidden = false;
        countBadge.setAttribute('aria-label', '1 active filter');
      } else {
        label.textContent = 'Filters';
        countBadge.hidden = true;
        countBadge.removeAttribute('aria-label');
      }
    };

    // Sync mobile and desktop filters
    const syncFilters = (activeFilter) => {
      // Update mobile buttons
      mobileFilterButtons.forEach(button => {
        if (button.getAttribute('data-filter') === activeFilter) {
          button.classList.add('mobile-filter-chip--active');
          button.setAttribute('aria-pressed', 'true');
        } else {
          button.classList.remove('mobile-filter-chip--active');
          button.setAttribute('aria-pressed', 'false');
        }
      });

      // Update desktop buttons
      desktopFilterButtons.forEach(button => {
        if (button.getAttribute('data-filter') === activeFilter) {
          button.classList.add('tag-active');
          button.setAttribute('aria-pressed', 'true');
        } else {
          button.classList.remove('tag-active');
          button.setAttribute('aria-pressed', 'false');
        }
      });

      updateFilterCount();
    };

    // Event listeners
    toggle.addEventListener('click', () => {
      const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
      isExpanded ? closeDropdown() : openDropdown();
    });

    closeButton?.addEventListener('click', closeDropdown);

    // Close on backdrop click
    dropdown.addEventListener('click', (e) => {
      if (e.target === dropdown || e.target.classList.contains('mobile-filter-dropdown')) {
        closeDropdown();
      }
    });

    // Mobile filter chip selection
    mobileFilterButtons.forEach(button => {
      button.addEventListener('click', () => {
        const filter = button.getAttribute('data-filter');

        // Apply the filter to the gallery
        filterGallery(filter);

        // Update UI states
        syncFilters(filter);

        // Close dropdown after short delay
        setTimeout(closeDropdown, 300);
      });
    });

    // Sync desktop filter clicks to mobile
    desktopFilterButtons.forEach(button => {
      button.addEventListener('click', () => {
        const filter = button.getAttribute('data-filter');

        // Apply the filter to the gallery
        filterGallery(filter);

        // Update UI states
        syncFilters(filter);
      });
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !dropdown.hidden) {
        closeDropdown();
      }
    });

    // Focus trap
    dropdown.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;

      const focusableElements = dropdown.querySelectorAll(
        'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable.focus();
        }
      }
    });

    // Initialize count
    updateFilterCount();
  };

  // ========================================
  // COMMISSION WIZARD
  // ========================================

  const initCommissionWizard = () => {
    const wizardForm = document.querySelector('[data-wizard-form]');
    if (!wizardForm) return;

    const STORAGE_KEY = STORAGE_KEYS.COMMISSION_DRAFT;
    const TOTAL_STEPS = 4;

    let currentStep = 1;
    let formData = {};

    // Get all wizard elements
    const steps = wizardForm.querySelectorAll('[data-wizard-step]');
    const progressBar = wizardForm.querySelector('[data-wizard-progress-bar]');
    const progressIndicators = wizardForm.querySelectorAll('[data-step-indicator]');
    const nextButtons = wizardForm.querySelectorAll('[data-wizard-next]');
    const prevButtons = wizardForm.querySelectorAll('[data-wizard-prev]');
    const summaryContainer = wizardForm.querySelector('[data-wizard-summary]');
    const successMessage = wizardForm.querySelector('.wizard-success');
    const resetButton = wizardForm.querySelector('[data-wizard-reset]');

    // Field labels for summary
    const fieldLabels = {
      'name': 'Name',
      'email': 'Email',
      'commission-type': 'Commission Type',
      'size': 'Preferred Size',
      'budget': 'Budget Range',
      'colors': 'Color Preferences',
      'timeline': 'Timeline',
      'theme': 'Vision / Theme',
      'referral': 'How You Heard'
    };

    // Field value formatters
    const formatValue = (name, value) => {
      if (!value) return 'Not specified';

      // Format commission type
      if (name === 'commission-type') {
        return value.charAt(0).toUpperCase() + value.slice(1).replace('-', ' ');
      }

      return value;
    };

    // Load saved draft from localStorage
    const loadDraft = () => {
      const saved = storage.getItemWithExpiration(STORAGE_KEY, TIMING.ONE_DAY);
      if (saved && saved.data) {
        formData = saved.data;
        restoreFormFields();
      }
    };

    // Save draft to localStorage
    const saveDraft = () => {
      const allFields = wizardForm.querySelectorAll('[data-wizard-field]');
      const data = {};

      allFields.forEach(field => {
        if (field.type === 'radio') {
          if (field.checked) {
            data[field.name] = field.value;
          }
        } else {
          data[field.name || field.id] = field.value;
        }
      });

      storage.setItemWithTimestamp(STORAGE_KEY, { data });
      formData = data;
    };

    // Restore form fields from saved data
    const restoreFormFields = () => {
      Object.entries(formData).forEach(([name, value]) => {
        const field = wizardForm.querySelector(`[name="${name}"], #${name}`);
        if (field) {
          if (field.type === 'radio') {
            const radioOption = wizardForm.querySelector(`[name="${name}"][value="${value}"]`);
            if (radioOption) radioOption.checked = true;
          } else {
            field.value = value;
          }
        }
      });
    };

    // Update progress bar and indicators
    const updateProgress = () => {
      const progress = (currentStep / TOTAL_STEPS) * 100;
      if (progressBar) {
        progressBar.style.width = `${progress}%`;
      }

      // Update progress indicators
      progressIndicators.forEach((indicator, index) => {
        const stepNumber = index + 1;

        if (stepNumber < currentStep) {
          indicator.classList.add('wizard-progress__step--completed');
          indicator.classList.remove('wizard-progress__step--active');
        } else if (stepNumber === currentStep) {
          indicator.classList.add('wizard-progress__step--active');
          indicator.classList.remove('wizard-progress__step--completed');
        } else {
          indicator.classList.remove('wizard-progress__step--active');
          indicator.classList.remove('wizard-progress__step--completed');
        }
      });

      // Update ARIA
      const progressElement = wizardForm.closest('.section-form').querySelector('[role="progressbar"]');
      if (progressElement) {
        progressElement.setAttribute('aria-valuenow', currentStep);
      }
    };

    // Show specific step
    const showStep = (stepNumber) => {
      // Hide all steps
      steps.forEach(step => {
        step.hidden = true;
        step.classList.remove('wizard-step--active');
      });

      // Show target step
      const targetStep = wizardForm.querySelector(`[data-wizard-step="${stepNumber}"]`);
      if (targetStep) {
        targetStep.hidden = false;

        // Use setTimeout to allow hidden attribute to take effect before adding active class
        setTimeout(() => {
          targetStep.classList.add('wizard-step--active');
        }, 10);

        // Focus first input in the step
        setTimeout(() => {
          const firstInput = targetStep.querySelector('input:not([type="radio"]), textarea, select');
          if (firstInput && !firstInput.value) {
            firstInput.focus();
          }
        }, 100);
      }

      currentStep = stepNumber;
      updateProgress();
      saveDraft();

      // Scroll to form top
      const formTop = wizardForm.getBoundingClientRect().top + window.pageYOffset - 100;
      window.scrollTo({
        top: formTop,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth'
      });
    };

    // Validate current step
    const validateStep = (stepNumber) => {
      const step = wizardForm.querySelector(`[data-wizard-step="${stepNumber}"]`);
      if (!step) return true;

      const requiredFields = step.querySelectorAll('[required]');
      let isValid = true;

      requiredFields.forEach(field => {
        const value = field.value.trim();
        const errorElement = document.getElementById(`${field.id}-error`);

        if (!value) {
          isValid = false;
          field.classList.add('has-error');
          field.setAttribute('aria-invalid', 'true');

          if (errorElement) {
            errorElement.textContent = 'This field is required';
            errorElement.style.display = 'block';
          }
        } else if (field.type === 'email' && !isValidEmail(value)) {
          isValid = false;
          field.classList.add('has-error');
          field.setAttribute('aria-invalid', 'true');

          if (errorElement) {
            errorElement.textContent = 'Please enter a valid email address';
            errorElement.style.display = 'block';
          }
        } else {
          field.classList.remove('has-error');
          field.setAttribute('aria-invalid', 'false');

          if (errorElement) {
            errorElement.style.display = 'none';
          }
        }
      });

      return isValid;
    };

    // Email validation helper
    const isValidEmail = (email) => {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    // Update summary on final step
    const updateSummary = () => {
      if (!summaryContainer) return;

      summaryContainer.innerHTML = '';

      const allFields = wizardForm.querySelectorAll('[data-wizard-field]');
      const summaryData = {};

      allFields.forEach(field => {
        let value = '';
        const name = field.name || field.id;

        if (field.type === 'radio' && field.checked) {
          value = field.value;
        } else if (field.type !== 'radio') {
          value = field.value;
        }

        if (value && name) {
          summaryData[name] = value;
        }
      });

      // Build summary list
      Object.entries(summaryData).forEach(([name, value]) => {
        const label = fieldLabels[name] || name;
        const formattedValue = formatValue(name, value);

        const item = document.createElement('div');
        item.className = 'wizard-summary__item';

        const dt = document.createElement('dt');
        dt.className = 'wizard-summary__label';
        dt.textContent = label;

        const dd = document.createElement('dd');
        dd.className = 'wizard-summary__value';
        dd.textContent = formattedValue;

        item.appendChild(dt);
        item.appendChild(dd);
        summaryContainer.appendChild(item);
      });
    };

    // Handle next button clicks
    nextButtons.forEach(button => {
      button.addEventListener('click', () => {
        if (validateStep(currentStep)) {
          if (currentStep < TOTAL_STEPS) {
            showStep(currentStep + 1);

            // Update summary when reaching final step
            if (currentStep === TOTAL_STEPS) {
              updateSummary();
            }
          }
        }
      });
    });

    // Handle previous button clicks
    prevButtons.forEach(button => {
      button.addEventListener('click', () => {
        if (currentStep > 1) {
          showStep(currentStep - 1);
        }
      });
    });

    // Handle form submission
    wizardForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!validateStep(currentStep)) {
        return;
      }

      // Get submit button
      const submitButton = wizardForm.querySelector('[type="submit"]');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = 'Submitting...';
      }

      try {
        // Simulate API submission
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Hide form steps
        steps.forEach(step => {
          step.hidden = true;
          step.classList.remove('wizard-step--active');
        });

        // Show success message
        if (successMessage) {
          successMessage.hidden = false;
          successMessage.classList.add('visible');
        }

        // Clear saved draft
        storage.removeItem(STORAGE_KEY);

        // Scroll to success message
        setTimeout(() => {
          successMessage.scrollIntoView({
            behavior: prefersReducedMotion() ? 'auto' : 'smooth',
            block: 'center'
          });
        }, 100);

      } catch (error) {
        console.error('Form submission error:', error);
        const errorMessage = wizardForm.querySelector('.form__message--error');
        if (errorMessage) {
          errorMessage.style.display = 'block';
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Submit Request';
        }
      }
    });

    // Handle reset button
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        wizardForm.reset();
        formData = {};
        storage.removeItem(STORAGE_KEY);

        if (successMessage) {
          successMessage.hidden = true;
          successMessage.classList.remove('visible');
        }

        showStep(1);
      });
    }

    // Auto-save on field changes
    const autoSaveFields = wizardForm.querySelectorAll('[data-wizard-field]');
    autoSaveFields.forEach(field => {
      field.addEventListener('change', saveDraft);
      if (field.tagName !== 'SELECT' && field.type !== 'radio') {
        field.addEventListener('input', debounce(saveDraft, 500));
      }
    });

    // Clear field errors on input
    const allInputs = wizardForm.querySelectorAll('input, textarea, select');
    allInputs.forEach(field => {
      field.addEventListener('input', () => {
        if (field.classList.contains('has-error')) {
          field.classList.remove('has-error');
          field.setAttribute('aria-invalid', 'false');

          const errorElement = document.getElementById(`${field.id}-error`);
          if (errorElement) {
            errorElement.style.display = 'none';
          }
        }
      });
    });

    // Initialize
    loadDraft();
    updateProgress();
  };

  // ========================================
  // ARTWORK INQUIRY BUTTONS
  // ========================================

  const initArtworkInquiry = () => {
    const inquiryButtons = document.querySelectorAll('.artwork-card__inquire');

    inquiryButtons.forEach(btn => {
      const artworkId = btn.dataset.artworkId;

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Get artwork details from the card
        const card = btn.closest('.artwork-card');
        if (!card) return;

        const titleEl = card.querySelector('.artwork-card__title');
        const collectionEl = card.querySelector('.artwork-card__collection');
        const priceEl = card.querySelector('.artwork-card__price');

        const artworkData = {
          id: artworkId,
          title: titleEl?.textContent || 'Untitled',
          collection: collectionEl?.textContent || '',
          price: priceEl?.textContent || ''
        };

        // Store inquiry data in storage
        storage.setItem(STORAGE_KEYS.PENDING_INQUIRY, {
          artworks: [artworkData],
          timestamp: Date.now()
        });

        // Navigate to contact page
        window.location.href = 'contact.html';
      });
    });
  };

  // ========================================
  // MOBILE BOTTOM NAVIGATION BAR
  // ========================================

  const initMobileBottomNav = () => {
    // Check if we're on mobile
    if (window.innerWidth >= 768) return;

    // Check if bottom nav already exists
    if (document.querySelector('.mobile-bottom-nav')) return;

    // Create bottom navigation
    const nav = document.createElement('nav');
    nav.className = 'mobile-bottom-nav';
    nav.setAttribute('aria-label', 'Mobile navigation');

    // Get current page to set active state
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Navigation items with icons
    const navItems = [
      {
        href: 'index.html',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>',
        label: 'Home',
        page: 'index.html'
      },
      {
        href: 'gallery.html',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>',
        label: 'Gallery',
        page: 'gallery.html'
      },
      {
        href: 'commissions.html',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>',
        label: 'Commissions',
        page: 'commissions.html'
      },
      {
        href: 'contact.html',
        icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>',
        label: 'Contact',
        page: 'contact.html'
      }
    ];

    // Build navigation HTML
    const ul = document.createElement('ul');
    ul.className = 'mobile-bottom-nav__list';

    navItems.forEach(item => {
      const li = document.createElement('li');
      li.className = 'mobile-bottom-nav__item';

      const a = document.createElement('a');
      a.href = item.href;
      a.className = 'mobile-bottom-nav__link';

      // Set active state
      const isActive = currentPage === item.page ||
                       (currentPage === '' && item.page === 'index.html');
      if (isActive) {
        a.classList.add('mobile-bottom-nav__link--active');
        a.setAttribute('aria-current', 'page');
      }

      a.innerHTML = `
        <span class="mobile-bottom-nav__icon">${item.icon}</span>
        <span class="mobile-bottom-nav__label">${item.label}</span>
      `;

      li.appendChild(a);
      ul.appendChild(li);
    });

    nav.appendChild(ul);
    document.body.appendChild(nav);

    // Scroll behavior - hide on scroll down, show on scroll up
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateNavVisibility = () => {
      const currentScrollY = window.scrollY;

      // Only hide/show after scrolling past threshold
      if (currentScrollY > 150) {
        if (currentScrollY > lastScrollY && currentScrollY > 200) {
          // Scrolling down - hide nav
          nav.classList.add('mobile-bottom-nav--hidden');
        } else if (currentScrollY < lastScrollY) {
          // Scrolling up - show nav
          nav.classList.remove('mobile-bottom-nav--hidden');
        }
      } else {
        // At top of page - always show
        nav.classList.remove('mobile-bottom-nav--hidden');
      }

      lastScrollY = currentScrollY;
      ticking = false;
    };

    const requestNavUpdate = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateNavVisibility);
        ticking = true;
      }
    };

    window.addEventListener('scroll', requestNavUpdate, { passive: true });
  };

  // ========================================
  // HAPTIC FEEDBACK UTILITY
  // ========================================

  const triggerHapticFeedback = (intensity = 'light') => {
    // Check if vibration API is supported
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30],
        success: [10, 50, 10]
      };

      navigator.vibrate(patterns[intensity] || patterns.light);
    }
  };

  // ========================================
  // ENHANCED FAVORITES WITH HAPTIC FEEDBACK
  // ========================================

  const enhanceFavoritesWithHaptics = () => {
    const favoriteButtons = document.querySelectorAll('.artwork-card__favorite');

    favoriteButtons.forEach(btn => {
      const originalClickHandler = btn.onclick;

      btn.addEventListener('click', (e) => {
        // Trigger haptic feedback
        triggerHapticFeedback('light');

        // Add visual feedback class
        btn.classList.add('haptic-feedback');
        setTimeout(() => {
          btn.classList.remove('haptic-feedback');
        }, 300);
      }, { capture: true }); // Use capture to run before other handlers
    });
  };

  // ========================================
  // SIMPLE TOAST NOTIFICATION
  // ========================================

  const showSimpleToast = (message, duration = 4000) => {
    const toast = document.createElement('div');
    toast.className = 'simple-toast';
    toast.textContent = message;
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');

    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 100);

    // Auto-hide
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  };

  // ========================================
  // HERO CARD CLOSE FUNCTIONALITY
  // ========================================

  const initHeroCardClose = () => {
    const heroContent = document.querySelector('.section-hero__content');
    const closeButton = document.querySelector('.hero-card-close');
    const showButton = document.querySelector('.hero-show-info');
    const heroSection = document.querySelector('.section-hero');

    if (!heroContent || !closeButton) return;

    // Close button click
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      heroContent.classList.add('is-hidden');
      // Save state to sessionStorage
      sessionStorage.setItem('heroCardDismissed', 'true');
      // Show toast notification
      showSimpleToast('Tap ⓘ to restore');
    });

    // Show button click
    if (showButton) {
      showButton.addEventListener('click', (e) => {
        e.stopPropagation();
        heroContent.classList.remove('is-hidden');
        sessionStorage.removeItem('heroCardDismissed');
      });
    }

    // Click outside to close
    if (heroSection) {
      heroSection.addEventListener('click', (e) => {
        // Only close if clicking on the section itself, not the content card
        if (e.target === heroSection || e.target.classList.contains('section-hero__background') || e.target.classList.contains('section-hero__background-image')) {
          heroContent.classList.add('is-hidden');
          sessionStorage.setItem('heroCardDismissed', 'true');
        }
      });
    }

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !heroContent.classList.contains('is-hidden')) {
        heroContent.classList.add('is-hidden');
        sessionStorage.setItem('heroCardDismissed', 'true');
      }
    });

    // Restore dismissed state from sessionStorage
    if (sessionStorage.getItem('heroCardDismissed') === 'true') {
      heroContent.classList.add('is-hidden');
    }
  };

  // ========================================
  // INITIALIZATION
  // ========================================

  const init = async () => {
    try {
      // Initialize all features
      initThemeToggle();
      initMobileMenu();
      initMobileNavigation();
      initScrollAnimations();
      initArtworkScrollAnimations();

      // Load gallery data first (this will also init gallery-dependent features)
      await initGalleryData();

      // Continue with other features
      initSmoothScroll();
      initFormHandling();
      initCommissionWizard();
      initHeaderScroll();
      initHeroParallax();
      initLazyLoading();
      initSkipLink();
      initNewsletter();
      initStatsCounter();
      initFavoritesPanel();
      initInquiryPrefill();
      initBackToTop();
      initStickyInquiryButton();

      // NEW: Mobile UX improvements
      initMobileBottomNav();
      enhanceFavoritesWithHaptics();

      // Hero card close functionality
      initHeroCardClose();

      // Set dynamic copyright year
      const yearElement = document.getElementById('copyright-year');
      if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
      }
    } catch (error) {
      console.error('Branchstone Art: Initialization error', error);
    }
  };

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Handle page show (for back/forward cache)
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      init();
    }
  });
})();
