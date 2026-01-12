/**
 * Branchstone Art - Main JavaScript
 * Premium artist portfolio website
 * All features initialized on DOMContentLoaded
 *
 * TODO [REFACTOR - Phase 3]: This file is too large (2400+ lines) and mixes concerns.
 * Suggested improvements:
 * 1. Extract gallery filtering logic into dedicated GalleryFilterManager
 *    - Handles filter state, URL persistence, and animation
 *    - Reduces duplication between desktop and mobile filter code
 * 2. Extract mobile-specific features into mobile-enhancements.js
 *    - Mobile bottom nav, sticky buttons, swipe gestures
 * 3. Extract panel management (favorites, filters) into dedicated managers
 * 4. Move testimonial/feedback loading into separate module
 * 5. Keep main.js focused on orchestration and initialization only
 */

// Import foundational modules
import { THEME, SCROLL, ANIMATION, STORAGE_KEYS, TIMING, GALLERY, TOUCH, SVG_NAMESPACE, ARTWORK_CARD, URLS, SWIPE, TEXT, SCROLL_THRESHOLDS } from './constants.js';
import { debounce, prefersReducedMotion, trapFocus, smoothScrollTo } from './utils.js';
import { isValidImageUrl, sanitizeText, isValidEmail, getURLParameter } from './security.js';
import * as storage from './storage.js';

// ========================================
// CONSTANTS
// ========================================

// Storage namespace to prevent key collision with other sites/apps
const STORAGE_PREFIX = 'branchstone_';

// Scroll and interaction thresholds (using constants from constants.js)
const SCROLL_THRESHOLD_STICKY = SCROLL_THRESHOLDS.STICKY;
const SCROLL_THRESHOLD_BOTTOM_NAV = SCROLL_THRESHOLDS.BOTTOM_NAV;
const SCROLL_THRESHOLD_BOTTOM_NAV_HIDE = SCROLL_THRESHOLDS.BOTTOM_NAV_HIDE;
const SWIPE_THRESHOLD_CLOSE = SWIPE.CLOSE_THRESHOLD;

// Import feature modules
import { FavoritesManager } from './favorites-manager.js';
import { FormValidator } from './form-validator.js';
import { MobileMenuManager } from './mobile-menu-manager.js';
import { ScrollManager } from './scroll-manager.js';
import { GalleryDataManager } from './gallery-data.js';
import { FeaturedCarousel } from './featured-carousel.js';
import { ArtworkModalManager } from './artwork-modal.js';
import { initI18n, getI18n } from './i18n.js';

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
    const container = document.querySelector('.bento-grid');
    if (!container) {
      console.log('[Gallery] Bento grid not found, skipping gallery initialization');
      return null;
    }

    console.log('[Gallery] Initializing gallery data manager...');
    const galleryManager = new GalleryDataManager();

    try {
      const success = await galleryManager.init();
      console.log('[Gallery] Init result:', success);

      if (success) {
        // Store gallery manager instance for filter persistence and header updates
        galleryManagerInstance = galleryManager;

        console.log('[Gallery] Initializing gallery-dependent features...');
        // Re-initialize features that depend on gallery cards
        // These need to be called after gallery is rendered
        initFavorites();
        initArtworkOverlays();
        initArtworkInquiry();
        initArtworkModal();
        initGalleryFiltering();
        initMobileFilterDropdown();
        console.log('[Gallery] All features initialized');
      } else {
        console.error('[Gallery] Failed to initialize gallery');
        // Display user-facing error message
        showGalleryError('Unable to load gallery. Please refresh the page to try again.');
      }

      return galleryManager;
    } catch (error) {
      console.error('[Gallery] Error during initialization:', error);
      // Display user-facing error message
      showGalleryError('An error occurred while loading the gallery. Please refresh the page.');
      return null;
    }
  };

  /**
   * Display a user-facing error message in the gallery container
   * Provides graceful fallback when gallery fails to load
   */
  const showGalleryError = (message) => {
    const container = document.querySelector('.bento-grid');
    if (!container) return;

    const errorDiv = document.createElement('div');
    errorDiv.className = 'gallery-error';
    errorDiv.setAttribute('role', 'alert');
    errorDiv.setAttribute('aria-live', 'polite');
    errorDiv.style.cssText = `
      padding: 2rem;
      text-align: center;
      color: var(--text-secondary);
      background: var(--sage-50);
      border: 1px solid var(--sage-200);
      border-radius: var(--radius-md);
      margin: 2rem 0;
    `;
    errorDiv.textContent = message;

    container.innerHTML = '';
    container.appendChild(errorDiv);
  };

  // ========================================
  // 5. GALLERY FILTERING
  // ========================================

  // Shared gallery filtering state (accessible to both desktop and mobile filters)
  // Note: Removed isGalleryFiltering debounce flag - was blocking clicks for 1750ms
  let galleryManagerInstance = null; // Store reference to gallery manager for header updates

  // Global flag to ensure galleryRendered listener is only registered once
  let galleryRenderedListenerRegistered = false;

  /**
   * Get collection name from URL query parameter
   * Safely retrieves the 'collection' parameter from the current page URL
   *
   * @returns {string|null} Collection name from URL or null if not present
   *
   * @example
   * // URL: gallery.html?collection=nature
   * getCollectionFromURL(); // Returns: 'nature'
   */
  const getCollectionFromURL = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('collection');
  };

  /**
   * Get collection name from localStorage
   */
  const getCollectionFromStorage = () => {
    return storage.getItem('branchstone.gallery.selectedCollection');
  };

  /**
   * Save collection to localStorage
   */
  const saveCollectionToStorage = (collectionName) => {
    if (collectionName && collectionName !== 'all') {
      storage.setItem('branchstone.gallery.selectedCollection', collectionName);
    } else {
      storage.removeItem('branchstone.gallery.selectedCollection');
    }
  };

  /**
   * Update URL with collection query parameter
   */
  const updateURLWithCollection = (collectionName) => {
    const url = new URL(window.location);

    if (collectionName && collectionName !== 'all') {
      url.searchParams.set('collection', collectionName);
    } else {
      url.searchParams.delete('collection');
    }

    // Use replaceState to avoid spamming browser history
    window.history.replaceState({}, '', url);
  };

  /**
   * Update gallery header based on selected collection
   */
  const updateGalleryHeader = (collectionName) => {
    const titleElement = document.getElementById('gallery-title');
    const subtitleElement = document.querySelector('.gallery-hero .subheading');

    if (!titleElement || !subtitleElement) return;

    if (!collectionName || collectionName === 'all') {
      // Reset to default - use i18n translations to preserve language
      const i18n = getI18n();
      titleElement.textContent = i18n.t('gallery.title', 'The Works');
      subtitleElement.textContent = i18n.t('gallery.subtitle', 'Nature inspired soul art. Each piece is meticulously crafted by hand, creating timeless works that blend traditional craft with modern design.');
    } else {
      // Get collection metadata from gallery manager
      if (galleryManagerInstance) {
        const metadata = galleryManagerInstance.getCollectionMetadata(collectionName);
        titleElement.textContent = metadata.name;
        subtitleElement.textContent = metadata.description || '';
      } else {
        // Fallback if metadata not available
        titleElement.textContent = collectionName;
        subtitleElement.textContent = '';
      }
    }
  };

  /**
   * Update collection description (mobile-only feature)
   * Shows/hides collection description with expand/collapse functionality
   *
   * @param {string|null} collectionName - Collection name to display description for, or null/'all' to hide
   *
   * @description
   * Mobile-only UX enhancement that shows detailed collection descriptions below the filter dropdown.
   * Features:
   * - Auto-detects if text is long (>240 chars) and adds "Read more/Show less" toggle
   * - Creates toggle button dynamically only when needed
   * - Removes toggle button when switching to short descriptions or 'all' view
   * - Only runs on mobile viewports (<=768px width)
   *
   * The 240-character threshold assumes ~80 chars per line on mobile, truncating at ~3 lines.
   *
   * @example
   * // Show description for Nature Spirits collection
   * updateCollectionDescription('Nature Spirits');
   *
   * @example
   * // Hide description when showing all works
   * updateCollectionDescription('all');
   */
  const updateCollectionDescription = (collectionName) => {
    // Only run on mobile
    if (window.innerWidth > 768) return;

    const descriptionContainer = document.getElementById('collection-description');
    const descriptionText = document.getElementById('collection-description-text');

    if (!descriptionContainer || !descriptionText) return;

    if (!collectionName || collectionName === 'all') {
      // Hide description when showing all works
      descriptionContainer.classList.remove('is-visible');
      descriptionText.textContent = '';
      descriptionText.classList.add('is-collapsed');
      descriptionText.classList.remove('is-expanded');
      // Remove toggle button if present
      const existingToggle = descriptionContainer.querySelector('.collection-description__toggle');
      if (existingToggle) existingToggle.remove();
    } else {
      // Show description for specific collection
      if (galleryManagerInstance) {
        const metadata = galleryManagerInstance.getCollectionMetadata(collectionName);
        const description = metadata.description || '';

        if (description) {
          // Set text content
          descriptionText.textContent = description;

          // Show container
          descriptionContainer.classList.add('is-visible');

          // Check if text is long enough to need truncation (~3 lines check)
          // Rough estimate: ~80 chars per line on mobile
          const needsTruncation = description.length > TEXT.MOBILE_DESCRIPTION_TRUNCATE;

          if (needsTruncation) {
            // Add collapsed class and toggle button
            descriptionText.classList.add('is-collapsed');
            descriptionText.classList.remove('is-expanded');

            // Remove existing toggle if present
            const existingToggle = descriptionContainer.querySelector('.collection-description__toggle');
            if (existingToggle) existingToggle.remove();

            // Create toggle button
            const toggleButton = document.createElement('button');
            toggleButton.className = 'collection-description__toggle';
            toggleButton.textContent = ' Read more';
            toggleButton.setAttribute('type', 'button');
            toggleButton.setAttribute('aria-expanded', 'false');
            toggleButton.setAttribute('aria-label', 'Read more about this collection');

            // Toggle handler
            toggleButton.addEventListener('click', (e) => {
              e.preventDefault();
              const isExpanded = descriptionText.classList.contains('is-expanded');

              if (isExpanded) {
                // Collapse
                descriptionText.classList.remove('is-expanded');
                descriptionText.classList.add('is-collapsed');
                toggleButton.textContent = ' Read more';
                toggleButton.setAttribute('aria-expanded', 'false');
                toggleButton.setAttribute('aria-label', 'Read more about this collection');
              } else {
                // Expand
                descriptionText.classList.remove('is-collapsed');
                descriptionText.classList.add('is-expanded');
                toggleButton.textContent = ' Show less';
                toggleButton.setAttribute('aria-expanded', 'true');
                toggleButton.setAttribute('aria-label', 'Show less about this collection');
              }
            });

            // Append toggle button inline after the text
            descriptionContainer.appendChild(toggleButton);
          } else {
            // Short text, no toggle needed
            descriptionText.classList.remove('is-collapsed');
            descriptionText.classList.add('is-expanded');
          }
        } else {
          // No description available
          descriptionContainer.classList.remove('is-visible');
        }
      }
    }
  };

  /**
   * Validate collection name against available collections
   */
  const isValidCollection = (collectionName) => {
    if (!collectionName || collectionName === 'all') return true;

    if (galleryManagerInstance) {
      const collections = galleryManagerInstance.getCollections();
      return collections.includes(collectionName);
    }

    return false;
  };

  /**
   * Get initial collection selection on page load
   * Priority: URL param > default 'all'
   *
   * Note: localStorage is intentionally NOT used for initial load to ensure
   * clean URLs always show all artworks. This provides predictable UX.
   * Collection state is still persisted to URL params for explicit filtering.
   */
  const getInitialCollection = () => {
    // 1. Check URL parameter
    const urlCollection = getCollectionFromURL();
    if (urlCollection && isValidCollection(urlCollection)) {
      console.log('[Gallery] Using collection from URL:', urlCollection);
      return urlCollection;
    }

    // 2. Default to 'all' (localStorage intentionally skipped)
    console.log('[Gallery] Using default collection: all');
    return 'all';
  };

  /**
   * Filter gallery artworks by collection with smooth animations
   * Handles both showing/hiding cards and updating persistence layer (URL + localStorage)
   *
   * @param {string} filter - Collection filter slug ('all' or collection slug like 'nature-spirits')
   * @param {boolean} [updatePersistence=true] - Whether to update URL and localStorage
   *
   * @description
   * This function orchestrates the gallery filtering process:
   * 1. Shows/hides artwork cards based on collection filter
   * 2. Animates transitions with stagger effect for visual polish
   * 3. Updates URL query parameters for deep linking
   * 4. Persists selection to localStorage for session continuity
   * 5. Updates gallery header and mobile description
   *
   * Animation respects prefers-reduced-motion for accessibility.
   * Uses debouncing via isGalleryFiltering flag to prevent rapid successive calls.
   *
   * @example
   * // Filter to show only "Nature Spirits" collection
   * filterGallery('nature-spirits');
   *
   * @example
   * // Show all artworks without updating persistence (used on initial load)
   * filterGallery('all', false);
   */
  const filterGallery = (filter, updatePersistence = true) => {
    // Note: Removed isGalleryFiltering debounce - it was blocking clicks for 1750ms
    // which made the UI feel unresponsive. Clicks now work immediately.

    const artworkCards = document.querySelectorAll('[data-collection]');

    // Get animation duration from CSS custom properties with fallbacks from constants
    const rootStyles = getComputedStyle(document.documentElement);
    const staggerDelay = parseInt(rootStyles.getPropertyValue('--gallery-filter-stagger-delay')) || GALLERY.FILTER_STAGGER_DELAY;
    const fadeDuration = parseInt(rootStyles.getPropertyValue('--gallery-filter-fade-duration')) || GALLERY.FILTER_FADE_DURATION;

    artworkCards.forEach((card, index) => {
      const collection = card.getAttribute('data-collection');
      const shouldShow = filter === 'all' || collection === filter;

      if (shouldShow) {
        // Remove hidden state immediately - use display instead of visibility
        card.style.display = '';

        if (!prefersReducedMotion()) {
          card.style.opacity = '0';
          card.style.transform = `translateY(${GALLERY.FILTER_TRANSLATE_SHOW}px)`;

          setTimeout(() => {
            card.style.transition = `opacity ${fadeDuration * GALLERY.FILTER_FADE_DURATION_MULTIPLIER}ms ease, transform ${fadeDuration * GALLERY.FILTER_FADE_DURATION_MULTIPLIER}ms ease`;
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }, index * staggerDelay);
        } else {
          // Immediate show for reduced motion
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }
      } else {
        if (!prefersReducedMotion()) {
          card.style.transition = `opacity ${fadeDuration}ms ease, transform ${fadeDuration}ms ease`;
          card.style.opacity = '0';
          card.style.transform = `translateY(${GALLERY.FILTER_TRANSLATE_HIDE}px)`;

          // Use display none to completely hide and remove from layout
          setTimeout(() => {
            card.style.display = 'none';
          }, fadeDuration);
        } else {
          // Immediate hide for reduced motion
          card.style.display = 'none';
        }
      }
    });

    // Update persistence and header if requested
    if (updatePersistence) {
      // Convert filter slug back to collection name
      const collectionName = filter === 'all' ? 'all' :
        (galleryManagerInstance?.slugToCollection(filter) || filter);

      saveCollectionToStorage(collectionName);
      updateURLWithCollection(collectionName);
      updateGalleryHeader(collectionName);
      updateCollectionDescription(collectionName);
    }

  };

  // Flag to ensure desktop filter handler is attached only once
  let desktopFilterHandlerAttached = false;

  // Update active button state (shared helper)
  const updateActiveFilterButton = (activeFilter) => {
    // Update desktop filter buttons
    document.querySelectorAll('.filter-controls [data-filter]').forEach(button => {
      const buttonFilter = button.getAttribute('data-filter');
      if (buttonFilter === activeFilter) {
        button.classList.add('is-active');
        button.setAttribute('aria-pressed', 'true');
      } else {
        button.classList.remove('is-active');
        button.setAttribute('aria-pressed', 'false');
      }
    });

    // Update mobile filter buttons
    document.querySelectorAll('[data-mobile-filter]').forEach(button => {
      const buttonFilter = button.getAttribute('data-filter');
      if (buttonFilter === activeFilter) {
        button.classList.add('mobile-filter-chip--active');
        button.setAttribute('aria-pressed', 'true');
      } else {
        button.classList.remove('mobile-filter-chip--active');
        button.setAttribute('aria-pressed', 'false');
      }
    });

    // Update mobile badge
    const mobileToggle = document.querySelector('.mobile-filter-toggle');
    if (mobileToggle) {
      const countBadge = mobileToggle.querySelector('.mobile-filter-toggle__count');
      const label = mobileToggle.querySelector('.mobile-filter-toggle__label');
      if (countBadge && label) {
        const activeButton = document.querySelector(`[data-mobile-filter][data-filter="${activeFilter}"]`);
        const activeFilterName = activeButton ? activeButton.textContent.trim() : 'All';

        if (activeFilter !== 'all' && activeFilterName !== 'All') {
          label.textContent = activeFilterName;
          countBadge.textContent = '1';
          countBadge.hidden = false;
          countBadge.setAttribute('aria-label', '1 active filter');
        } else {
          label.textContent = 'Filters';
          countBadge.hidden = true;
          countBadge.removeAttribute('aria-label');
        }
      }
    }
  };

  const initGalleryFiltering = () => {
    const filterButtons = document.querySelectorAll('.filter-controls [data-filter]');
    const artworkCards = document.querySelectorAll('[data-collection]');

    if (filterButtons.length === 0 || artworkCards.length === 0) return;

    // Attach click handler to DOCUMENT once - this survives any DOM changes
    // Using event delegation means we don't need to re-attach when buttons are re-rendered
    if (!desktopFilterHandlerAttached) {
      document.addEventListener('click', (e) => {
        // Only handle clicks on desktop filter buttons (inside .filter-controls, not mobile)
        const button = e.target.closest('.filter-controls [data-filter]');
        if (!button) return;

        const filter = button.getAttribute('data-filter');
        filterGallery(filter);
        updateActiveFilterButton(filter);
      });
      desktopFilterHandlerAttached = true;
    }

    // Get initial collection from URL/localStorage
    const initialCollection = getInitialCollection();
    const initialFilter = initialCollection === 'all' ? 'all' :
      galleryManagerInstance?.collectionToSlug(initialCollection) || 'all';

    console.log('[Gallery] Applying initial filter:', initialFilter, '(from collection:', initialCollection + ')');

    // Apply initial filter and update header
    updateGalleryHeader(initialCollection);
    updateCollectionDescription(initialCollection);
    filterGallery(initialFilter, false); // false = don't update persistence (already loaded from it)
    updateActiveFilterButton(initialFilter);
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
      // Add blur placeholder class AND data-loading attribute
      if (!img.complete) {
        img.classList.add('lazy-loading');
        img.setAttribute('data-loading', ''); // Activates placeholder styling
      }

      // Fade in on load
      img.addEventListener('load', () => {
        if (!prefersReducedMotion()) {
          img.style.transition = `opacity ${GALLERY.IMAGE_FADE_DURATION}ms ease`;
        }
        img.classList.remove('lazy-loading');
        img.classList.add('lazy-loaded');
        img.removeAttribute('data-loading'); // Remove placeholder state
      });

      // Handle error
      img.addEventListener('error', () => {
        img.classList.remove('lazy-loading');
        img.classList.add('lazy-error');
        img.removeAttribute('data-loading'); // Remove placeholder state on error
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

      // Disable form and set aria-busy for accessibility
      submitBtn.disabled = true;
      submitBtn.setAttribute('aria-busy', 'true');
      submitBtn.textContent = 'Subscribing...';
      form.setAttribute('aria-busy', 'true');
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
        submitBtn.removeAttribute('aria-busy');
        submitBtn.textContent = 'Subscribe';
        form.removeAttribute('aria-busy');
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
    const statItems = document.querySelectorAll('[data-stat-item]');
    if (statItems.length === 0) return;

    // Show all stats immediately without animation
    statItems.forEach(item => {
      item.classList.add('is-visible');
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
      window.location.href = URLS.CONTACT;
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

        // If dragged down more than swipe threshold, close panel
        if (deltaY > SWIPE_THRESHOLD_CLOSE) {
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

    const messageField = document.querySelector('[name="message"]');
    if (!messageField) return;

    // Check for URL query parameters first (from modal)
    const urlParams = new URLSearchParams(window.location.search);
    const urlMessage = urlParams.get('message');

    if (urlMessage) {
      // Pre-fill from URL parameters
      messageField.value = decodeURIComponent(urlMessage);

      // Scroll to form
      setTimeout(() => {
        messageField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);

      // Clean up URL
      const url = new URL(window.location);
      url.searchParams.delete('message');
      url.searchParams.delete('art');
      window.history.replaceState({}, '', url);

      return;
    }

    // Fallback: Check localStorage for pending inquiry (from favorites)
    const inquiryData = storage.getItemWithExpiration(STORAGE_KEYS.PENDING_INQUIRY, TIMING.ONE_HOUR);
    if (!inquiryData) return;

    const { artworks, timestamp } = inquiryData;

      // Pre-fill form
      const subjectField = document.querySelector('[name="subject"]');

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
      const dimensions = card.getAttribute('data-dimensions') || '';

      // Create overlay element
      const overlay = document.createElement('div');
      overlay.className = 'artwork-card__overlay';
      overlay.setAttribute('aria-hidden', 'true');

      // Build overlay content using safe DOM methods (prevents XSS)
      const titleEl = document.createElement('h3');
      titleEl.className = 'artwork-card__overlay-title';
      titleEl.textContent = title; // Safe: textContent escapes HTML

      // Add dimensions if available
      if (dimensions) {
        const dimensionsEl = document.createElement('p');
        dimensionsEl.className = 'artwork-card__overlay-dimensions';
        dimensionsEl.textContent = dimensions; // Safe: textContent escapes HTML
        overlay.appendChild(titleEl);
        overlay.appendChild(dimensionsEl);
      } else {
        overlay.appendChild(titleEl);
      }

      const collectionEl = document.createElement('p');
      collectionEl.className = 'artwork-card__overlay-collection';
      collectionEl.textContent = collection; // Safe: textContent escapes HTML

      const ctaSpan = document.createElement('span');
      ctaSpan.className = 'artwork-card__overlay-cta';
      ctaSpan.textContent = 'View Details ';

      // Create SVG using namespace-aware methods
      const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
      svg.setAttribute('viewBox', ARTWORK_CARD.SVG_VIEWBOX_DEFAULT);
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
      svg.setAttribute('aria-hidden', 'true');

      const path = document.createElementNS(SVG_NAMESPACE, 'path');
      path.setAttribute('d', 'M5 12h14M12 5l7 7-7 7');
      svg.appendChild(path);
      ctaSpan.appendChild(svg);

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
  // MOBILE FILTER DROPDOWN
  // ========================================

  // Flags to ensure mobile filter handlers are attached only once
  let mobileFilterHandlerAttached = false;
  let mobileToggleClickAttached = false;
  let mobileCloseClickAttached = false;
  let mobileDropdownBackdropAttached = false;
  let mobileDropdownFocusTrapAttached = false;

  const initMobileFilterDropdown = () => {
    const toggle = document.querySelector('.mobile-filter-toggle');
    const dropdown = document.getElementById('mobile-filter-dropdown');
    const closeButton = dropdown?.querySelector('.mobile-filter-dropdown__close');

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

      // Find active filter (query fresh to handle dynamically rendered buttons)
      let activeFilterName = 'All';
      const currentMobileFilterButtons = document.querySelectorAll('[data-mobile-filter]');
      currentMobileFilterButtons.forEach(button => {
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
      // Query fresh to handle dynamically rendered buttons
      const currentMobileFilterButtons = document.querySelectorAll('[data-mobile-filter]');
      currentMobileFilterButtons.forEach(button => {
        if (button.getAttribute('data-filter') === activeFilter) {
          button.classList.add('mobile-filter-chip--active');
          button.setAttribute('aria-pressed', 'true');
        } else {
          button.classList.remove('mobile-filter-chip--active');
          button.setAttribute('aria-pressed', 'false');
        }
      });

      // Update desktop buttons
      const currentDesktopFilterButtons = document.querySelectorAll('.filter-controls [data-filter]');
      currentDesktopFilterButtons.forEach(button => {
        if (button.getAttribute('data-filter') === activeFilter) {
          button.classList.add('is-active');
          button.setAttribute('aria-pressed', 'true');
        } else {
          button.classList.remove('is-active');
          button.setAttribute('aria-pressed', 'false');
        }
      });

      updateFilterCount();
    };

    // Initialize with current filter state
    const initialCollection = getInitialCollection();
    const initialFilter = initialCollection === 'all' ? 'all' :
      galleryManagerInstance?.collectionToSlug(initialCollection) || 'all';
    updateActiveFilterButton(initialFilter);

    // Event listeners - only attach once using global flags
    if (!mobileToggleClickAttached) {
      toggle.addEventListener('click', () => {
        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
        isExpanded ? closeDropdown() : openDropdown();
      });
      mobileToggleClickAttached = true;
    }

    if (closeButton && !mobileCloseClickAttached) {
      closeButton.addEventListener('click', closeDropdown);
      mobileCloseClickAttached = true;
    }

    // Close on backdrop click - only attach once
    if (!mobileDropdownBackdropAttached) {
      dropdown.addEventListener('click', (e) => {
        if (e.target === dropdown || e.target.classList.contains('mobile-filter-dropdown')) {
          closeDropdown();
        }
      });
      mobileDropdownBackdropAttached = true;
    }

    // Mobile filter chip selection - attach handler to document ONCE
    if (!mobileFilterHandlerAttached) {
      document.addEventListener('click', (e) => {
        // Only handle clicks on mobile filter chips
        const button = e.target.closest('[data-mobile-filter]');
        if (!button) return;

        const filter = button.getAttribute('data-filter');

        // Apply the filter to the gallery
        filterGallery(filter);

        // Update UI states using shared helper
        updateActiveFilterButton(filter);

        // Close dropdown after short delay (query fresh to avoid stale reference)
        const currentDropdown = document.getElementById('mobile-filter-dropdown');
        if (currentDropdown && !currentDropdown.hidden) {
          setTimeout(() => {
            currentDropdown.hidden = true;
            const toggle = document.querySelector('.mobile-filter-toggle');
            if (toggle) toggle.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
          }, 300);
        }
      });

      // Keyboard navigation - attach ONCE
      document.addEventListener('keydown', (e) => {
        // Query fresh to avoid stale reference
        const currentDropdown = document.getElementById('mobile-filter-dropdown');
        if (e.key === 'Escape' && currentDropdown && !currentDropdown.hidden) {
          currentDropdown.hidden = true;
          const toggle = document.querySelector('.mobile-filter-toggle');
          if (toggle) toggle.setAttribute('aria-expanded', 'false');
          document.body.style.overflow = '';
        }
      });

      mobileFilterHandlerAttached = true;
    }

    // Focus trap - only attach once using global flag
    if (!mobileDropdownFocusTrapAttached) {
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
      mobileDropdownFocusTrapAttached = true;
    }

    // Initialize count
    updateFilterCount();
  };

  /**
   * Register global galleryRendered listener (ONCE per page load)
   * This listener re-initializes filter UI when gallery re-renders (language change, etc.)
   *
   * CRITICAL: This must be called ONCE and only ONCE to avoid exponential listener multiplication.
   * Previous bug: Adding this listener inside initGalleryFiltering() caused each re-init to add
   * another listener, leading to 1 → 2 → 4 → 8 → ... listeners and every-other-click behavior.
   */
  const registerGalleryRenderedListener = () => {
    if (galleryRenderedListenerRegistered) return;

    document.addEventListener('galleryRendered', () => {
      initGalleryFiltering();
      initMobileFilterDropdown();
    });

    galleryRenderedListenerRegistered = true;
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
        submitButton.setAttribute('aria-busy', 'true');
        submitButton.textContent = 'Submitting...';
      }

      // Set aria-busy on form for accessibility
      wizardForm.setAttribute('aria-busy', 'true');

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
          successMessage.classList.add('is-visible');
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
          submitButton.removeAttribute('aria-busy');
          submitButton.textContent = 'Submit Request';
        }
        wizardForm.removeAttribute('aria-busy');
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
          successMessage.classList.remove('is-visible');
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
  // ARTWORK MODAL SYSTEM
  // ========================================

  const initArtworkModal = () => {
    // Only run on gallery page
    const container = document.querySelector('.bento-grid');
    if (!container) {
      console.log('[ArtworkModal] Gallery not found, skipping initialization');
      return;
    }

    console.log('[ArtworkModal] Initializing artwork modal system...');
    const modalManager = new ArtworkModalManager();
    modalManager.init();
    console.log('[ArtworkModal] Modal system initialized');

    // Check for artwork URL parameter (from Featured Works carousel)
    checkForArtworkAutoOpen();
  };

  /**
   * Check URL for artwork parameter and auto-open modal
   * Handles deep links from Featured Works carousel on home page
   */
  const checkForArtworkAutoOpen = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const artworkSlug = urlParams.get('artwork');

    if (!artworkSlug) return;

    console.log('[Gallery] Auto-opening artwork from URL parameter:', artworkSlug);

    // Find the artwork card by slug
    const artworkCard = document.querySelector(`[data-artwork-id="artwork-${artworkSlug}"]`)?.closest('.artwork-card');

    if (artworkCard) {
      console.log('[Gallery] Found artwork card, scrolling to position and opening modal');

      // Small delay to ensure modal system is fully initialized
      setTimeout(() => {
        // Scroll artwork card into view BEFORE opening modal
        // This ensures the gallery shows the artwork's position when modal closes
        artworkCard.scrollIntoView({
          behavior: prefersReducedMotion() ? 'auto' : 'smooth',
          block: 'center', // Center the card in the viewport
          inline: 'nearest'
        });

        // Wait for scroll to complete before opening modal
        // Smooth scroll typically takes 300-500ms
        setTimeout(() => {
          artworkCard.click();

          // Clean up URL parameter after opening modal
          // The modal will add its own 'art' parameter
          const url = new URL(window.location);
          url.searchParams.delete('artwork');
          window.history.replaceState({}, '', url);
        }, 400);
      }, 200);
    } else {
      console.warn('[Gallery] Artwork card not found for slug:', artworkSlug);

      // Clean up invalid URL parameter
      const url = new URL(window.location);
      url.searchParams.delete('artwork');
      window.history.replaceState({}, '', url);
    }
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
        window.location.href = URLS.CONTACT;
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
        a.classList.add('is-active');
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

    /**
     * Scroll behavior: hide nav when scrolling down, show when scrolling up
     * MEMORY LEAK PREVENTION: requestAnimationFrame with ticking flag
     */
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateNavVisibility = () => {
      const currentScrollY = window.scrollY;

      // Only hide/show after scrolling past threshold
      if (currentScrollY > SCROLL_THRESHOLD_BOTTOM_NAV) {
        if (currentScrollY > lastScrollY && currentScrollY > SCROLL_THRESHOLD_BOTTOM_NAV_HIDE) {
          // Scrolling down - hide nav
          nav.classList.add('is-hidden');
        } else if (currentScrollY < lastScrollY) {
          // Scrolling up - show nav
          nav.classList.remove('is-hidden');
        }
      } else {
        // At top of page - always show
        nav.classList.remove('is-hidden');
      }

      lastScrollY = currentScrollY;
      ticking = false;
    };

    /**
     * Throttled scroll handler using requestAnimationFrame
     * NOTE: Listener is page-lifetime scoped; cleanup not needed for multi-page app
     */
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
    // Sanitize message to prevent XSS
    const sanitizedMessage = sanitizeText(message);

    const toast = document.createElement('div');
    toast.className = 'simple-toast';
    // Use textContent (not innerHTML) for XSS protection
    toast.textContent = sanitizedMessage;
    // Add ARIA attributes for accessibility
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.setAttribute('aria-atomic', 'true');

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
  // FEATURED CAROUSEL (HOME PAGE)
  // ========================================

  const initFeaturedCarousel = async () => {
    const carouselContainer = document.querySelector('#featured-carousel');

    // Only run on home page
    if (!carouselContainer) {
      console.log('[FeaturedCarousel] Container not found, skipping initialization');
      return;
    }

    console.log('[FeaturedCarousel] Initializing featured carousel...');
    const carousel = new FeaturedCarousel('#featured-carousel');

    try {
      await carousel.init();
      console.log('[FeaturedCarousel] Initialized successfully');

      // Re-initialize favorites for carousel cards
      initFavorites();
    } catch (error) {
      console.error('[FeaturedCarousel] Initialization failed:', error);
    }
  };

  // ========================================
  // DYNAMIC FEEDBACK LOADING
  // ========================================

  const initDynamicFeedbacks = async () => {
    // Try to find testimonials container - different structure on different pages
    const testimonialsGrid = document.querySelector('.section-testimonials .testimonials-grid') ||
                             document.querySelector('.section--testimonials .grid--three-column');

    // Only run if testimonials grid exists
    if (!testimonialsGrid) {
      console.log('[Feedbacks] Testimonials grid not found, skipping initialization');
      return;
    }

    try {
      console.log('[Feedbacks] Loading feedbacks from JSON...');

      const response = await fetch(URLS.FEEDBACKS_JSON);
      if (!response.ok) {
        throw new Error(`Failed to load feedbacks: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const feedbacks = data.feedbacks;

      if (!feedbacks || !Array.isArray(feedbacks)) {
        throw new Error('Invalid feedbacks data structure');
      }

      console.log(`[Feedbacks] Loaded ${feedbacks.length} feedbacks`);

      // Determine which page we're on
      const isAboutPage = document.body.classList.contains('page-about') ||
                          window.location.pathname.includes('about.html');
      const isHomePage = !isAboutPage && (
        document.body.classList.contains('page-home') ||
        window.location.pathname.includes('index.html') ||
        window.location.pathname === '/' ||
        window.location.pathname === '/docs/'
      );

      // Select feedbacks to display
      let selectedFeedbacks = [];
      if (isHomePage) {
        // Home page: show first 5 feedbacks
        selectedFeedbacks = feedbacks.slice(0, 5);
      } else if (isAboutPage) {
        // About page: show 3 specific feedbacks (indices 0, 3, 5)
        selectedFeedbacks = [
          feedbacks[0],  // Sarah Mitchell
          feedbacks[3],  // David K.
          feedbacks[5]   // Emily Rodriguez
        ].filter(Boolean); // Filter out undefined if array is too short
      }

      // Clear existing testimonials by removing child nodes
      while (testimonialsGrid.firstChild) {
        testimonialsGrid.removeChild(testimonialsGrid.firstChild);
      }

      // Generate testimonial cards
      selectedFeedbacks.forEach(feedback => {
        const card = createTestimonialCard(feedback, isAboutPage);
        testimonialsGrid.appendChild(card);
      });

      console.log('[Feedbacks] Rendered successfully');

    } catch (error) {
      console.error('[Feedbacks] Error loading feedbacks:', error);

      // Graceful fallback: Keep existing hardcoded content
      // Don't clear the grid if loading fails, preserving any static testimonials
      console.warn('[Feedbacks] Using hardcoded testimonials as fallback - dynamic loading failed');

      // Optionally show a subtle notification to user (non-intrusive)
      // This is informational only - the page still works with fallback content
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Only show detailed error in development
        console.warn('[Feedbacks] Development mode: Check that collections.json exists and is accessible');
      }
    }
  };

  const createTestimonialCard = (feedback, isAboutPage) => {
    // Generate avatar initials from name
    const initials = feedback.name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .slice(0, 2);

    // Different structure for home page vs about page
    if (isAboutPage) {
      // About page structure: blockquote with footer
      const blockquote = document.createElement('blockquote');
      blockquote.className = 'testimonial-card';

      const quote = document.createElement('p');
      quote.className = 'testimonial-card__quote';
      quote.textContent = `" ${feedback.review}"`;

      const footer = document.createElement('footer');
      footer.className = 'testimonial-card__footer';

      const author = document.createElement('cite');
      author.className = 'testimonial-card__author';
      author.textContent = feedback.name;

      const role = document.createElement('span');
      role.className = 'testimonial-card__role';
      // Use title field if available, otherwise use location with a generic role
      role.textContent = feedback.title || `Collector, ${feedback.location}`;

      footer.appendChild(author);
      footer.appendChild(role);

      blockquote.appendChild(quote);
      blockquote.appendChild(footer);

      return blockquote;
    } else {
      // Home page structure: article with photo, quote, and footer
      const article = document.createElement('article');
      article.className = 'testimonial-card';

      const photoDiv = document.createElement('div');
      photoDiv.className = 'testimonial-card__photo';

      const avatar = document.createElement('div');
      avatar.className = 'testimonial-card__avatar';
      avatar.setAttribute('aria-hidden', 'true');
      avatar.textContent = initials;

      photoDiv.appendChild(avatar);

      const blockquote = document.createElement('blockquote');
      blockquote.className = 'testimonial-card__quote';
      blockquote.textContent = `"${feedback.review}"`;

      const footer = document.createElement('footer');
      footer.className = 'testimonial-card__footer';

      const author = document.createElement('cite');
      author.className = 'testimonial-card__author';
      author.textContent = feedback.name;

      const location = document.createElement('span');
      location.className = 'testimonial-card__location';
      location.textContent = feedback.location;

      footer.appendChild(author);
      footer.appendChild(location);

      article.appendChild(photoDiv);
      article.appendChild(blockquote);
      article.appendChild(footer);

      return article;
    }
  };

  // ========================================
  // HERO CARD CLOSE FUNCTIONALITY
  // ========================================

  const initHeroCardClose = () => {
    // Skip hero close/show logic on mobile - mobile uses inline hero instead
    if (window.innerWidth <= 768) return;

    const heroContent = document.querySelector('.section-hero__content');
    const closeButton = document.querySelector('.hero-card-close');
    const showButton = document.querySelector('.hero-show-info');
    const heroSection = document.querySelector('.section-hero');

    if (!heroContent || !closeButton) return;

    // Close button click
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      heroContent.classList.add('is-hidden');
      // Save state to sessionStorage with namespaced key
      sessionStorage.setItem(STORAGE_PREFIX + 'heroCardDismissed', 'true');
      // Show toast notification
      showSimpleToast('Tap ⓘ to restore');
    });

    // Show button click
    if (showButton) {
      showButton.addEventListener('click', (e) => {
        e.stopPropagation();
        heroContent.classList.remove('is-hidden');
        sessionStorage.removeItem(STORAGE_PREFIX + 'heroCardDismissed');
      });
    }

    // Click outside to close
    if (heroSection) {
      heroSection.addEventListener('click', (e) => {
        // Only close if clicking on the section itself, not the content card
        if (e.target === heroSection || e.target.classList.contains('section-hero__background') || e.target.classList.contains('section-hero__background-image')) {
          heroContent.classList.add('is-hidden');
          sessionStorage.setItem(STORAGE_PREFIX + 'heroCardDismissed', 'true');
        }
      });
    }

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !heroContent.classList.contains('is-hidden')) {
        heroContent.classList.add('is-hidden');
        sessionStorage.setItem(STORAGE_PREFIX + 'heroCardDismissed', 'true');
      }
    });

    // Restore dismissed state from sessionStorage using namespaced key
    if (sessionStorage.getItem(STORAGE_PREFIX + 'heroCardDismissed') === 'true') {
      heroContent.classList.add('is-hidden');
    }
  };

  // ========================================
  // INITIALIZATION
  // ========================================

  /**
   * Main initialization function - coordinates all feature initialization
   *
   * PHASES:
   * 1. CRITICAL FEATURES: Theme, mobile menu, scroll behaviors (must run first)
   * 2. DATA LOADING: Gallery and carousel data (async, may fail gracefully)
   * 3. ENHANCEMENT FEATURES: Forms, animations, UX improvements (can fail individually)
   *
   * ERROR ISOLATION: Each feature is isolated in its own init function.
   * If one feature fails, others continue to work. Errors are logged but not thrown.
   *
   * EVENT LISTENER CLEANUP NOTE:
   * - Most event listeners are persistent (page-lifetime scoped)
   * - SPA-style cleanup is not needed for this multi-page application
   * - Scroll listeners use requestAnimationFrame or debouncing to prevent memory leaks
   * - Modal/panel listeners are scoped to their lifecycle (open/close)
   *
   * MEMORY LEAK PREVENTION:
   * - Scroll handlers use passive listeners where possible
   * - Event delegation is used for dynamic content (gallery cards, filters)
   * - Panel/modal close handlers clean up their specific listeners
   */
  const init = async () => {
    try {
      console.log('[Main] Initializing... (readyState:', document.readyState + ')');

      // ===== PHASE 0: INTERNATIONALIZATION (must load FIRST) =====
      await initI18n();          // Load translations and apply to page

      // ===== PHASE 1: CRITICAL FEATURES (synchronous, must succeed) =====
      initThemeToggle();         // Theme must load first to prevent flash
      initMobileMenu();          // Mobile navigation
      initMobileNavigation();    // Legacy mobile nav support
      initScrollAnimations();    // Scroll-based UI behaviors
      initArtworkScrollAnimations(); // Artwork reveal animations

      // ===== PHASE 2: DATA LOADING (async, graceful degradation) =====
      // Gallery data loads artwork cards; failure shows error message but doesn't break page
      await initGalleryData();

      // Register global listener for gallery re-renders (MUST be called only once)
      registerGalleryRenderedListener();

      // Featured carousel on home page; failure is silent (carousel not critical)
      await initFeaturedCarousel();

      // Dynamic testimonials; failure falls back to hardcoded content
      await initDynamicFeedbacks();

      // ===== PHASE 3: ENHANCEMENT FEATURES (independent, fail-safe) =====
      initSmoothScroll();        // Smooth anchor scrolling
      initFormHandling();        // Form validation
      initCommissionWizard();    // Multi-step commission form
      initHeaderScroll();        // Header show/hide on scroll
      initHeroParallax();        // Hero section parallax effect
      initLazyLoading();         // Image lazy loading enhancements
      initSkipLink();            // Accessibility skip link
      initNewsletter();          // Newsletter subscription form
      initStatsCounter();        // Statistics display
      initFavoritesPanel();      // Favorites management panel
      initInquiryPrefill();      // Contact form pre-fill from favorites
      initBackToTop();           // Back to top button

      // Mobile UX enhancements
      initMobileBottomNav();        // Bottom navigation bar
      enhanceFavoritesWithHaptics(); // Haptic feedback for favorites

      // Hero card functionality
      initHeroCardClose();       // Hero card dismiss/restore

      // Set dynamic copyright year
      const yearElement = document.getElementById('copyright-year');
      if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
      }
    } catch (error) {
      // Top-level error handler - should rarely trigger due to individual try-catch in features
      console.error('Branchstone Art: Initialization error', error);
    }
  };

  // Run on DOM ready
  // ES6 modules are deferred, but we need to ensure DOM is fully loaded
  const startInit = () => {
    // Ensure body exists before initializing
    if (document.body) {
      init();
    } else {
      // Fallback: wait a bit and try again
      console.warn('[Main] Body not ready, retrying...');
      setTimeout(startInit, 50);
    }
  };

  if (document.readyState === 'loading') {
    // Still loading - wait for DOMContentLoaded
    document.addEventListener('DOMContentLoaded', startInit);
  } else {
    // DOM is already loaded (interactive or complete)
    // But ensure we're truly ready
    if (document.readyState === 'complete') {
      // Everything is loaded
      startInit();
    } else {
      // DOM is interactive but resources may still be loading
      // Wait for DOMContentLoaded to be safe
      document.addEventListener('DOMContentLoaded', startInit);
    }
  }

  // Handle page show (for back/forward cache)
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      init();
    }
  });
})();
