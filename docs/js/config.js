/**
 * Application Configuration
 * Central configuration file for all constants and settings
 * @module config
 */

export const CONFIG = {
  // API endpoints
  api: {
    artworks: 'js/artworks.json',
    translations: 'js/translations.json',
    contactForm: 'https://formspree.io/f/xgvbwebq',
  },

  // Storage keys
  storage: {
    theme: 'theme',
    language: 'language',
    inquiryMessage: 'inquiryMessage',
  },

  // Theme constants
  theme: {
    light: 'light',
    dark: 'dark',
    attribute: 'data-theme',
  },

  // Language constants
  language: {
    default: 'en',
    supported: ['en', 'ua'],
  },

  // Navigation structure
  navigation: {
    items: [
      { href: 'index.html', key: 'nav.home', image: 'img/artist.jpeg' },
      { href: 'gallery.html', key: 'nav.gallery', image: 'img/galleries.jpeg' },
      { href: 'about.html', key: 'nav.about', image: 'img/about-me.jpeg' },
      { href: 'contact.html', key: 'nav.contact', image: 'img/contact-bg.jpg' },
    ],
  },

  // UI constants
  ui: {
    // Animation timings (ms)
    animations: {
      fast: 200,
      normal: 300,
      slow: 600,
      parallax: 40,
      grain: 40000,
      organic: 60000,
    },

    // Breakpoints (px)
    breakpoints: {
      mobile: 768,
      tablet: 1024,
      desktop: 1440,
    },

    // Gallery settings
    gallery: {
      featuredCount: 6,
      lazyLoadThreshold: 3,
      observerThreshold: 0.1,
      observerRootMargin: '0px 0px -80px 0px',
    },

    // Lightbox settings
    lightbox: {
      swipeThreshold: 50,
      doubleTapDelay: 300,
      zoomMin: 1,
      zoomMax: 4,
      imageMaxWidth: 85, // % of viewport on desktop
    },

    // Carousel settings
    carousel: {
      autoplayDelay: 3000,
      transitionDuration: 600,
      pauseOnHover: true,
      loop: true,
    },

    // Scroll-to-top button
    scrollToTop: {
      showAfterScroll: 300, // px
      animationDuration: 600, // ms
    },

    // Animation settings
    parallax: {
      mobileDisabled: true,
      speeds: {
        heroImage: 0.3,
        featuredItem: 0.08,
        aboutImage: 0.12,
        galleryItem: 0.15,
      },
    },

    // Scroll hint
    scrollHint: {
      fadeDelay: 50,
      autoRemoveDelay: 4000,
    },
  },

  // Form validation
  validation: {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    errorMessages: {
      nameRequired: 'Please enter your name',
      emailRequired: 'Please enter your email',
      emailInvalid: 'Please enter a valid email address',
      messageRequired: 'Please enter a message',
    },
  },

  // Feature flags
  features: {
    parallaxEnabled: true,
    magneticHoverEnabled: true,
    analyticsEnabled: false,
  },
};

// Freeze config to prevent accidental mutations
Object.freeze(CONFIG);
Object.freeze(CONFIG.api);
Object.freeze(CONFIG.storage);
Object.freeze(CONFIG.theme);
Object.freeze(CONFIG.language);
Object.freeze(CONFIG.ui);
Object.freeze(CONFIG.validation);
Object.freeze(CONFIG.features);

export default CONFIG;
