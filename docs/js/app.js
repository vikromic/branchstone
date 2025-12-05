/**
 * Main Application
 * Orchestrates all components and initializes the application
 * @module app
 */

// Core components (always needed)
import Menu from './components/Menu.js';
import ThemeManager from './components/Theme.js';
import AnimationManager from './components/Animations.js';
import { getStorageItem, setStorageItem, removeStorageItem } from './utils/storage.js';
import CONFIG from './config.js';
import {
  handleError,
  withErrorBoundary,
  withSyncErrorBoundary,
  initGlobalErrorHandler,
  ErrorLevel,
} from './utils/errorHandler.js';

// Page-specific components loaded dynamically on-demand:
// - Gallery.js (gallery page, home page)
// - GalleryFilter.js (gallery page)
// - Lightbox.js (gallery page)
// - Carousel.js (home page, about page)
// - FormValidator.js (contact page)
// - ScrollToTop.js (gallery page)

class App {
  constructor() {
    this.components = new Map();
    this.cleanupFunctions = []; // Store cleanup functions for proper teardown
    this.init();
  }

  /**
   * Initialize application
   * @private
   */
  async init() {
    try {
      // Initialize global error handlers first
      initGlobalErrorHandler();

      // Add animation ready class
      document.body.classList.add('js-animations-active');

      // Initialize core components with error boundary
      this.initializeCore();

      // Initialize page-specific components with error boundary
      await this.initializePageSpecific();

      // Initialize global features with error boundary
      this.initializeGlobalFeatures();

      console.info('[App] Initialization complete');
    } catch (error) {
      handleError(error, {
        component: 'App',
        action: 'Initialization',
        level: ErrorLevel.CRITICAL,
        showUI: true,
        recoverable: false,
        userMessage: 'Failed to initialize application. Please refresh the page.',
      });
    }
  }

  /**
   * Initialize core components (always needed)
   * @private
   */
  initializeCore() {
    try {
      // Mobile menu
      const menu = new Menu();
      this.components.set('menu', menu);
    } catch (error) {
      handleError(error, {
        component: 'App',
        action: 'Initialize Menu',
        level: ErrorLevel.ERROR,
        showUI: true,
        recoverable: true,
        userMessage: 'Mobile menu failed to load. Navigation may be limited.',
      });
    }

    try {
      // Theme manager
      const theme = new ThemeManager();
      this.components.set('theme', theme);
    } catch (error) {
      handleError(error, {
        component: 'App',
        action: 'Initialize Theme',
        level: ErrorLevel.WARNING,
        showUI: false,
        recoverable: true,
      });
    }

    try {
      // Animation manager
      const animations = new AnimationManager();
      this.components.set('animations', animations);
    } catch (error) {
      handleError(error, {
        component: 'App',
        action: 'Initialize Animations',
        level: ErrorLevel.WARNING,
        showUI: false,
        recoverable: true,
      });
    }
  }

  /**
   * Initialize page-specific components
   * @private
   */
  async initializePageSpecific() {
    const path = window.location.pathname;

    // Wrap page initializations in error boundaries
    const initHome = withErrorBoundary(this.initHomePage.bind(this), {
      component: 'App',
      action: 'Initialize Home Page',
      level: ErrorLevel.ERROR,
      showUI: true,
      recoverable: true,
      userMessage: 'Some features failed to load. The page will continue to function.',
    });

    const initGallery = withErrorBoundary(this.initGalleryPage.bind(this), {
      component: 'App',
      action: 'Initialize Gallery Page',
      level: ErrorLevel.ERROR,
      showUI: true,
      recoverable: true,
      userMessage: 'Gallery features failed to load. Please try refreshing the page.',
    });

    const initContact = withErrorBoundary(this.initContactPage.bind(this), {
      component: 'App',
      action: 'Initialize Contact Page',
      level: ErrorLevel.ERROR,
      showUI: true,
      recoverable: true,
      userMessage: 'Contact form failed to load. You can still email directly.',
    });

    const initAbout = withErrorBoundary(this.initAboutPage.bind(this), {
      component: 'App',
      action: 'Initialize About Page',
      level: ErrorLevel.ERROR,
      showUI: true,
      recoverable: true,
      userMessage: 'Some features failed to load. The page will continue to function.',
    });

    // Home page - Featured gallery
    if (path.endsWith('index.html') || path.endsWith('/')) {
      await initHome();
    }

    // Gallery page - Full gallery + lightbox
    if (path.includes('gallery.html')) {
      await initGallery();
    }

    // Contact page - Form validation
    if (path.includes('contact.html')) {
      await initContact();
    }

    // About page - Carousels
    if (path.includes('about.html')) {
      await initAbout();
    }
  }

  /**
   * Initialize home page components
   * @private
   */
  async initHomePage() {
    const featuredGrid = document.getElementById('featured-artworks');
    if (!featuredGrid) return;

    // Dynamically import Gallery and Carousel components
    const [{ default: Gallery }, { default: Carousel }] = await Promise.all([
      import('./components/Gallery.js'),
      import('./components/Carousel.js'),
    ]);

    const gallery = new Gallery({
      containerSelector: '#featured-artworks',
      type: 'featured',
      onLoad: () => {
        const animations = this.components.get('animations');
        if (animations) animations.refresh();

        // Initialize carousel for featured works
        // Responsive configuration: 3 items on desktop, 2 on tablet, 1 on mobile with peek
        let itemsPerView = 3;
        let showPeek = false;
        if (window.innerWidth <= 768) {
          itemsPerView = 1;
          showPeek = true; // Enable peek effect on mobile
        } else if (window.innerWidth <= 1024) {
          itemsPerView = 2;
        }

        const carousel = new Carousel({
          containerSelector: '#featured-carousel',
          itemSelector: '.carousel-item',
          autoplayDelay: 5000,
          loop: true,
          pauseOnHover: true,
          itemsPerView: itemsPerView,
          itemsPerRow: itemsPerView,
          showPeek: showPeek, // Pass peek option to carousel
        });
        this.components.set('featuredCarousel', carousel);

        // Show "Swipe for more" hint on first visit (mobile only)
        if (showPeek && !localStorage.getItem('carousel_hint_shown')) {
          this.showCarouselSwipeHint();
          localStorage.setItem('carousel_hint_shown', 'true');
        }

        // Handle window resize to recalculate carousel layout
        let resizeTimer;
        const resizeHandler = () => {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(() => {
            if (carousel && carousel.recalculate) {
              carousel.recalculate();
            }
          }, 250);
        };

        window.addEventListener('resize', resizeHandler);

        // Store cleanup function for proper teardown
        this.cleanupFunctions.push(() => {
          window.removeEventListener('resize', resizeHandler);
          clearTimeout(resizeTimer);
        });
      },
    });

    this.components.set('featuredGallery', gallery);
  }

  /**
   * Initialize gallery page components
   * @private
   */
  async initGalleryPage() {
    const galleryGrid = document.querySelector('.gallery-grid');
    if (!galleryGrid) return;

    // Detect mobile viewport for infinite scroll mode
    const isMobile = window.innerWidth <= CONFIG.ui.breakpoints.mobile;

    if (isMobile) {
      // Mobile: Use InfiniteGallery
      await this.initInfiniteGallery();
    } else {
      // Desktop: Use traditional grid gallery
      await this.initDesktopGallery();
    }

    // Add scroll-to-top button (mobile only via CSS)
    const { default: ScrollToTop } = await import('./components/ScrollToTop.js');
    const scrollToTop = new ScrollToTop();
    this.components.set('scrollToTop', scrollToTop);
  }

  /**
   * Initialize infinite scroll gallery for mobile
   * @private
   */
  async initInfiniteGallery() {
    const { default: InfiniteGallery } = await import('./components/InfiniteGallery.js');
    const { artworksAPI } = await import('./services/api.js');

    try {
      // Fetch all artworks
      const artworks = await artworksAPI.getAll();

      // Initialize infinite gallery
      const infiniteGallery = new InfiniteGallery({
        containerSelector: '.gallery-main',
        artworks: artworks,
      });

      this.components.set('infiniteGallery', infiniteGallery);
    } catch (error) {
      handleError(error, {
        component: 'App',
        action: 'Initialize Infinite Gallery',
        level: ErrorLevel.ERROR,
        showUI: true,
        recoverable: true,
        userMessage: 'Failed to load gallery. Please try refreshing the page.',
      });
    }
  }

  /**
   * Initialize traditional grid gallery for desktop
   * @private
   */
  async initDesktopGallery() {
    // Dynamically import Gallery, GalleryFilter, Lightbox, and InquiryFAB components
    const [{ default: Gallery }, { default: GalleryFilter }, { default: Lightbox }, { default: InquiryFAB }] =
      await Promise.all([
        import('./components/Gallery.js'),
        import('./components/GalleryFilter.js'),
        import('./components/Lightbox.js'),
        import('./components/InquiryFAB.js'),
      ]);

    const gallery = new Gallery({
      containerSelector: '.gallery-grid',
      type: 'full',
      onLoad: () => {
        // Refresh animations after gallery loads
        const animations = this.components.get('animations');
        if (animations) animations.refresh();

        // Initialize gallery filter
        const galleryFilter = new GalleryFilter({
          containerSelector: '#gallery-filter',
          gallerySelector: '.gallery-grid',
          categories: [
            { id: 'available', label: 'Available' },
            { id: 'small', label: 'Small Items' },
            { id: 'prints', label: 'Prints Only' },
          ],
          onFilter: (category) => {
            // Re-trigger animations for visible items
            if (animations) {
              setTimeout(() => animations.refresh(), 350);
            }
          },
        });
        this.components.set('galleryFilter', galleryFilter);

        // Initialize lightbox after gallery loads
        const lightbox = new Lightbox();
        this.components.set('lightbox', lightbox);

        // Initialize Inquiry FAB (mobile only)
        const inquiryFAB = new InquiryFAB();
        this.components.set('inquiryFAB', inquiryFAB);

        // Mobile gallery enhancements
        if (window.innerWidth <= CONFIG.ui.breakpoints.mobile) {
          this.initMobileGallery();
        }
      },
    });

    this.components.set('gallery', gallery);
  }

  /**
   * Initialize about page components
   * @private
   */
  async initAboutPage() {
    // Dynamically import Carousel component
    const { default: Carousel } = await import('./components/Carousel.js');

    // Load and render experience/highlights carousel from JSON
    await this.initExperienceCarousel(Carousel);

    // Feedback carousel
    const feedbackCarousel = new Carousel({
      containerSelector: '#feedback-carousel',
      itemSelector: '.carousel-item',
      autoplayDelay: 6000,
      loop: true,
      pauseOnHover: true,
    });
    this.components.set('feedbackCarousel', feedbackCarousel);

    // Initialize section navigation
    this.initSectionNavigation();
  }

  /**
   * Initialize section navigation active state tracking
   * @private
   */
  initSectionNavigation() {
    const sections = document.querySelectorAll('.about-section[id]');
    const navLinks = document.querySelectorAll('.section-nav-link');

    if (!sections.length || !navLinks.length) return;

    // Track active section based on scroll position
    const observerOptions = {
      root: null,
      rootMargin: '-100px 0px -66% 0px',
      threshold: 0,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');

          // Update active state on navigation links
          navLinks.forEach((link) => {
            const href = link.getAttribute('href').substring(1);
            if (href === id) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    }, observerOptions);

    sections.forEach((section) => observer.observe(section));
  }

  /**
   * Initialize experience carousel from highlights.json
   * @private
   * @param {Function} Carousel - Carousel class
   */
  async initExperienceCarousel(Carousel) {
    const section = document.getElementById('experience');
    const track = document.querySelector('#experience-carousel .carousel-track');
    if (!section || !track) return;

    try {
      // Fetch highlights data
      const response = await fetch('js/highlights.json');
      if (!response.ok) return;

      const highlights = await response.json();
      if (!highlights || highlights.length === 0) return;

      // Clear placeholder items and render from JSON
      track.innerHTML = '';

      highlights.forEach((item, index) => {
        const carouselItem = document.createElement('div');
        carouselItem.className = 'carousel-item';

        // Build image HTML with WebP support and fallback
        let imageHTML;
        if (item.fallback) {
          // Use picture element for WebP with fallback
          imageHTML = `
            <picture>
              <source srcset="${item.image}" type="image/webp">
              <img src="${item.fallback}"
                   alt="${item.alt || 'Gallery exhibition'}"
                   class="experience-image"
                   loading="${index < 2 ? 'eager' : 'lazy'}">
            </picture>
          `;
        } else {
          // Use regular img tag
          imageHTML = `
            <img src="${item.image}"
                 alt="${item.alt || 'Gallery exhibition'}"
                 class="experience-image"
                 loading="${index < 2 ? 'eager' : 'lazy'}">
          `;
        }

        carouselItem.innerHTML = `
          <figure class="experience-figure">
            ${imageHTML}
            <figcaption class="experience-caption">
              <span class="experience-caption-text">${item.caption}</span>
            </figcaption>
          </figure>
        `;
        track.appendChild(carouselItem);
      });

      // Show the section (remove display:none)
      section.style.display = '';

      // Initialize carousel
      const experienceCarousel = new Carousel({
        containerSelector: '#experience-carousel',
        itemSelector: '.carousel-item',
        autoplayDelay: 5000,
        loop: true,
        pauseOnHover: true,
      });
      this.components.set('experienceCarousel', experienceCarousel);
    } catch (error) {
      // Silently fail - section stays hidden if no highlights
      console.debug('No highlights to display');
    }
  }

  /**
   * Initialize contact page components
   * @private
   */
  async initContactPage() {
    // Pre-fill inquiry message if exists
    this.prefillInquiryMessage();

    // Dynamically import FormValidator component
    const { default: FormValidator } = await import('./components/FormValidator.js');

    // Initialize form validator
    const validator = new FormValidator({
      formSelector: '#contact-form',
    });

    this.components.set('formValidator', validator);
  }

  /**
   * Pre-fill contact form with inquiry message from lightbox
   * @private
   */
  prefillInquiryMessage() {
    const messageField = document.getElementById('message');
    if (!messageField) return;

    const inquiryMessage = getStorageItem(CONFIG.storage.inquiryMessage);
    if (inquiryMessage) {
      messageField.value = inquiryMessage;
      document.getElementById('name')?.focus();
      removeStorageItem(CONFIG.storage.inquiryMessage);
    }
  }

  /**
   * Initialize mobile-specific gallery features
   * @private
   */
  initMobileGallery() {
    const galleryGrid = document.querySelector('.gallery-grid');
    if (!galleryGrid) return;

    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -10% 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.gallery-item').forEach((item) => {
      observer.observe(item);
    });

    // Add scroll hint
    setTimeout(() => this.addScrollHint(), CONFIG.ui.scrollHint.showDelay);
  }

  /**
   * Add scroll hint for mobile users
   * @private
   */
  addScrollHint() {
    const hint = document.createElement('div');
    hint.style.cssText = `
      position: fixed;
      bottom: 4rem;
      left: 50%;
      transform: translateX(-50%);
      color: rgba(139, 120, 93, 0.6);
      font-size: 1.5rem;
      animation: scrollHint 2s ease-in-out infinite;
      pointer-events: none;
      z-index: 100;
      opacity: 0.8;
    `;
    hint.innerHTML = '↓';
    hint.setAttribute('aria-hidden', 'true');
    document.body.appendChild(hint);

    // Add animation
    if (!document.getElementById('scroll-hint-style')) {
      const style = document.createElement('style');
      style.id = 'scroll-hint-style';
      style.textContent = `
        @keyframes scrollHint {
          0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.6; }
          50% { transform: translateX(-50%) translateY(8px); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    // Remove hint after scroll
    let scrolled = false;
    const fadeDuration = CONFIG.ui.scrollHint.fadeAnimationDuration;
    const removeHint = () => {
      if (!scrolled && window.scrollY > CONFIG.ui.scrollHint.fadeThreshold) {
        hint.style.transition = `opacity ${fadeDuration}ms ease`;
        hint.style.opacity = '0';
        setTimeout(() => hint.remove(), fadeDuration);
        scrolled = true;
        window.removeEventListener('scroll', removeHint);
      }
    };

    window.addEventListener('scroll', removeHint, { passive: true });

    // Store cleanup function for proper teardown
    this.cleanupFunctions.push(() => {
      window.removeEventListener('scroll', removeHint);
      if (hint.parentNode) {
        hint.remove();
      }
    });

    // Auto-remove after delay
    const autoRemoveTimer = setTimeout(() => {
      if (hint.parentNode) {
        hint.style.transition = `opacity ${fadeDuration}ms ease`;
        hint.style.opacity = '0';
        setTimeout(() => hint.remove(), fadeDuration);
      }
    }, CONFIG.ui.scrollHint.autoRemoveDelay);

    // Store cleanup for timer
    this.cleanupFunctions.push(() => {
      clearTimeout(autoRemoveTimer);
    });
  }

  /**
   * Initialize global features
   * @private
   */
  initializeGlobalFeatures() {
    // Smooth scroll
    this.initSmoothScroll();

    // Hero parallax and scroll indicator
    this.initHeroEffects();

    // Scroll progress indicator
    this.initScrollProgress();

    // Mobile tab bar active state
    this.initMobileTabBar();

    // Failsafe animation trigger
    this.failsafeAnimations();
  }

  /**
   * Show carousel swipe hint for first-time visitors
   * @private
   */
  showCarouselSwipeHint() {
    const carousel = document.getElementById('featured-carousel');
    if (!carousel) return;

    const hint = document.createElement('div');
    hint.className = 'carousel-swipe-hint';
    hint.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M5 12h14m-7-7l7 7-7 7"/>
      </svg>
      <span>Swipe for more</span>
    `;
    hint.style.cssText = `
      position: absolute;
      bottom: 1rem;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(var(--text-rgb), 0.9);
      color: var(--background-color);
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      pointer-events: none;
      z-index: 10;
      animation: fadeInOut 3s ease-in-out;
    `;

    carousel.style.position = 'relative';
    carousel.appendChild(hint);

    // Add animation
    if (!document.getElementById('carousel-hint-style')) {
      const style = document.createElement('style');
      style.id = 'carousel-hint-style';
      style.textContent = `
        @keyframes fadeInOut {
          0%, 100% { opacity: 0; }
          10%, 90% { opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }

    // Remove hint after animation
    setTimeout(() => {
      if (hint.parentNode) {
        hint.remove();
      }
    }, 3000);
  }

  /**
   * Initialize mobile tab bar active state
   * @private
   */
  initMobileTabBar() {
    const tabBar = document.querySelector('.mobile-tab-bar');
    if (!tabBar) return;

    // Determine current page from URL
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';

    // Map filenames to data-page values
    const pageMap = {
      'index.html': 'home',
      '': 'home',
      'gallery.html': 'gallery',
      'contact.html': 'contact',
      'about.html': 'about',
      'commissions.html': 'commissions',
    };

    const currentPage = pageMap[filename] || 'home';

    // Set active state on current tab
    const tabs = tabBar.querySelectorAll('.tab-item');
    tabs.forEach((tab) => {
      const tabPage = tab.getAttribute('data-page');
      if (tabPage === currentPage) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  /**
   * Initialize scroll progress indicator at top of page
   * @private
   */
  initScrollProgress() {
    // Create scroll progress bar
    const progressContainer = document.createElement('div');
    progressContainer.className = 'scroll-progress';
    progressContainer.setAttribute('aria-hidden', 'true');

    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress-bar';

    progressContainer.appendChild(progressBar);
    document.body.appendChild(progressContainer);

    let ticking = false;

    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

      progressBar.style.width = `${Math.min(scrollPercent, 100)}%`;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateProgress);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    // Initial update
    updateProgress();

    // Store cleanup
    this.cleanupFunctions.push(() => {
      window.removeEventListener('scroll', onScroll);
      if (progressContainer.parentNode) {
        progressContainer.remove();
      }
    });
  }

  /**
   * Initialize hero section effects (parallax, scroll indicator fade)
   * @private
   */
  initHeroEffects() {
    const heroSection = document.querySelector('.hero-fullscreen');
    const heroContent = document.querySelector('.hero-content');
    const scrollIndicator = document.querySelector('.scroll-indicator');

    if (!heroSection) return;

    let ticking = false;

    const updateHeroEffects = () => {
      const scrollY = window.scrollY;
      const heroHeight = heroSection.offsetHeight;

      // Only apply effects while hero is in view
      if (scrollY < heroHeight) {
        // Subtle parallax on hero content (moves slower than scroll)
        if (heroContent) {
          const parallaxOffset = scrollY * 0.3;
          heroContent.style.transform = `translateY(${parallaxOffset}px)`;
        }

        // Fade out scroll indicator as user scrolls
        if (scrollIndicator) {
          const fadeThreshold = 100; // Start fading after 100px scroll
          if (scrollY > fadeThreshold) {
            heroSection.classList.add('hero-scrolled');
          } else {
            heroSection.classList.remove('hero-scrolled');
          }
        }
      }

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateHeroEffects);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    // Scroll indicator click handler - smooth scroll to next section
    if (scrollIndicator) {
      scrollIndicator.addEventListener('click', () => {
        const nextSection = heroSection.nextElementSibling;
        if (nextSection) {
          nextSection.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }

    // Store cleanup function
    this.cleanupFunctions.push(() => {
      window.removeEventListener('scroll', onScroll);
    });
  }

  /**
   * Initialize smooth scroll for anchor links
   * @private
   */
  initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href === '#') return;

        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          // Calculate offset for sticky elements (header + section nav on about page)
          const sectionNav = document.querySelector('.about-section-nav');
          const headerHeight = document.querySelector('header')?.offsetHeight || 80;
          const sectionNavHeight = sectionNav?.offsetHeight || 0;
          const offset = headerHeight + sectionNavHeight + 20; // 20px extra padding

          const targetPosition = target.getBoundingClientRect().top + window.scrollY - offset;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth',
          });
        }
      });
    });

    // CSS smooth scrolling
    document.documentElement.style.scrollBehavior = 'smooth';
  }

  /**
   * Failsafe to trigger animations if observer doesn't fire
   * @private
   */
  failsafeAnimations() {
    setTimeout(() => {
      const elements = document.querySelectorAll('.animate-on-scroll:not(.is-visible)');
      elements.forEach((element) => {
        element.classList.add('is-visible');
      });
    }, 1000);
  }

  /**
   * Get component by name
   * @param {string} name - Component name
   * @returns {*} Component instance
   */
  getComponent(name) {
    return this.components.get(name);
  }

  /**
   * Destroy app and cleanup
   * Properly cleanup all event listeners and timers to prevent memory leaks
   */
  destroy() {
    console.info('[App] Destroying application and cleaning up resources');

    // Execute all stored cleanup functions
    this.cleanupFunctions.forEach((cleanup) => {
      try {
        cleanup();
      } catch (error) {
        console.warn('[App] Cleanup function failed:', error);
      }
    });
    this.cleanupFunctions = [];

    // Destroy all components
    this.components.forEach((component, name) => {
      try {
        if (component.destroy) {
          component.destroy();
        }
      } catch (error) {
        console.warn(`[App] Failed to destroy component "${name}":`, error);
      }
    });
    this.components.clear();

    console.info('[App] Cleanup complete');
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new App());
} else {
  new App();
}

// Export for debugging/testing
export default App;
