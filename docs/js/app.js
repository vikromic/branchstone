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
    this.init();
  }

  /**
   * Initialize application
   * @private
   */
  async init() {
    // Add animation ready class
    document.body.classList.add('js-animations-active');

    // Initialize core components
    this.initializeCore();

    // Initialize page-specific components
    await this.initializePageSpecific();

    // Initialize global features
    this.initializeGlobalFeatures();
  }

  /**
   * Initialize core components (always needed)
   * @private
   */
  initializeCore() {
    // Mobile menu
    const menu = new Menu();
    this.components.set('menu', menu);

    // Theme manager
    const theme = new ThemeManager();
    this.components.set('theme', theme);

    // Animation manager
    const animations = new AnimationManager();
    this.components.set('animations', animations);
  }

  /**
   * Initialize page-specific components
   * @private
   */
  async initializePageSpecific() {
    const path = window.location.pathname;

    // Home page - Featured gallery
    if (path.endsWith('index.html') || path.endsWith('/')) {
      await this.initHomePage();
    }

    // Gallery page - Full gallery + lightbox
    if (path.includes('gallery.html')) {
      await this.initGalleryPage();
    }

    // Contact page - Form validation
    if (path.includes('contact.html')) {
      await this.initContactPage();
    }

    // About page - Carousels
    if (path.includes('about.html')) {
      await this.initAboutPage();
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
    const [
      { default: Gallery },
      { default: Carousel }
    ] = await Promise.all([
      import('./components/Gallery.js'),
      import('./components/Carousel.js')
    ]);

    const gallery = new Gallery({
      containerSelector: '#featured-artworks',
      type: 'featured',
      onLoad: () => {
        const animations = this.components.get('animations');
        if (animations) animations.refresh();

        // Initialize carousel for featured works
        // Responsive configuration: 3 items on desktop, 2 on tablet, 1 on mobile
        let itemsPerView = 3;
        if (window.innerWidth <= 768) {
          itemsPerView = 1;
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
        });
        this.components.set('featuredCarousel', carousel);

        // Handle window resize to recalculate carousel layout
        let resizeTimer;
        window.addEventListener('resize', () => {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(() => {
            carousel.recalculate();
          }, 250);
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

    // Dynamically import Gallery, GalleryFilter, Lightbox, and ScrollToTop components
    const [
      { default: Gallery },
      { default: GalleryFilter },
      { default: Lightbox },
      { default: ScrollToTop }
    ] = await Promise.all([
      import('./components/Gallery.js'),
      import('./components/GalleryFilter.js'),
      import('./components/Lightbox.js'),
      import('./components/ScrollToTop.js')
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
            { id: 'prints', label: 'Prints Only' }
          ],
          onFilter: (category) => {
            // Re-trigger animations for visible items
            if (animations) {
              setTimeout(() => animations.refresh(), 350);
            }
          }
        });
        this.components.set('galleryFilter', galleryFilter);

        // Initialize lightbox after gallery loads
        const lightbox = new Lightbox();
        this.components.set('lightbox', lightbox);

        // Mobile gallery enhancements
        if (window.innerWidth <= CONFIG.ui.breakpoints.mobile) {
          this.initMobileGallery();
        }
      },
    });

    this.components.set('gallery', gallery);

    // Add scroll-to-top button (mobile only via CSS)
    const scrollToTop = new ScrollToTop();
    this.components.set('scrollToTop', scrollToTop);
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
        carouselItem.innerHTML = `
          <figure class="experience-figure">
            <img src="${item.image}"
                 alt="${item.alt || 'Gallery exhibition'}"
                 class="experience-image"
                 loading="${index < 2 ? 'eager' : 'lazy'}">
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
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.gallery-item').forEach(item => {
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

    // Auto-remove after delay
    setTimeout(() => {
      if (hint.parentNode) {
        hint.style.transition = `opacity ${fadeDuration}ms ease`;
        hint.style.opacity = '0';
        setTimeout(() => hint.remove(), fadeDuration);
      }
    }, CONFIG.ui.scrollHint.autoRemoveDelay);
  }

  /**
   * Initialize global features
   * @private
   */
  initializeGlobalFeatures() {
    // Smooth scroll
    this.initSmoothScroll();

    // Failsafe animation trigger
    this.failsafeAnimations();
  }

  /**
   * Initialize smooth scroll for anchor links
   * @private
   */
  initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href === '#') return;

        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
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
      elements.forEach(element => {
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
   */
  destroy() {
    this.components.forEach(component => {
      if (component.destroy) {
        component.destroy();
      }
    });
    this.components.clear();
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
