/**
 * Constants Module
 * Central configuration for the Branchstone Art application
 * All magic numbers and configuration values in one place
 */

export const THEME = {
  STORAGE_KEY: 'branchstone-theme',
  DEFAULT: 'light',
  DARK: 'dark',
  LIGHT: 'light'
};

export const SCROLL = {
  THRESHOLD: 100,
  TRIGGER_BACK_TO_TOP: 300,
  HEADER_HIDE_THRESHOLD: 150,
  ANIMATION_DELAY: 100,
  PARALLAX_SPEED: 0.4
};

export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1200
};

export const ANIMATION = {
  DURATION_SHORT: 200,
  DURATION_MEDIUM: 300,
  DURATION_LONG: 500,
  STAGGER_DELAY: 50,
  DEBOUNCE_DELAY: 100,
  TOAST_DURATION: 2000,
  TOAST_EXTENDED_DURATION: 4000,
  MESSAGE_AUTO_DISMISS: 5000
};

export const STORAGE_KEYS = {
  THEME: 'branchstone-theme',
  FAVORITES: 'branchstone_favorites',
  NEWSLETTER_SUBSCRIBERS: 'newsletter_subscribers',
  PENDING_INQUIRY: 'pendingInquiry',
  COMMISSION_DRAFT: 'branchstone_commission_draft',
  HERO_CARD_DISMISSED: 'heroCardDismissed'
};

export const TIMING = {
  ONE_HOUR: 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  STALE_DATA_TIMEOUT: 60 * 60 * 1000 // 1 hour
};

export const TOUCH = {
  HORIZONTAL_THRESHOLD: 50,
  VERTICAL_THRESHOLD: 100,
  SWIPE_CLOSE_THRESHOLD: 100
};

export const FORM = {
  SUBMIT_TIMEOUT: 10000,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

export const LIGHTBOX = {
  CROSSFADE_DURATION: 300,
  FOCUS_DELAY: 100
};

export const WIZARD = {
  TOTAL_STEPS: 4
};

export const HAPTIC = {
  PATTERNS: {
    LIGHT: [10],
    MEDIUM: [20],
    HEAVY: [30],
    SUCCESS: [10, 50, 10]
  }
};

export const INTERSECTION_OBSERVER = {
  SCROLL_ANIMATION: {
    rootMargin: '0px 0px -100px 0px',
    threshold: 0.1
  },
  ARTWORK_CARDS: {
    rootMargin: '0px 0px -10px 0px',
    threshold: 0.1
  },
  STATS_COUNTER: {
    rootMargin: '0px',
    threshold: 0.3
  }
};

export const SELECTORS = {
  // Common selectors used throughout the app
  HEADER: '[data-header], .header',
  THEME_TOGGLE: '[data-theme-toggle], .header__theme-toggle',
  MOBILE_MENU: '#mobile-menu',
  MOBILE_MENU_TOGGLE: '.header__menu-toggle',
  LIGHTBOX: '[data-lightbox], [data-lightbox-modal], .modal-overlay',
  FAVORITES_BUTTON: '.artwork-card__favorite',
  FAVORITES_PANEL: '.favorites-panel',
  BACK_TO_TOP: '[data-back-to-top], .back-to-top',
  SKIP_LINK: '[data-skip-link]',
  ARTWORK_CARD: '.artwork-card'
};

export const ARIA = {
  HIDDEN: 'aria-hidden',
  EXPANDED: 'aria-expanded',
  PRESSED: 'aria-pressed',
  LABEL: 'aria-label',
  INVALID: 'aria-invalid',
  LIVE: 'aria-live',
  ATOMIC: 'aria-atomic'
};

export const DATA_ATTRIBUTES = {
  THEME: 'data-theme',
  ANIMATE: 'data-animate',
  FILTER: 'data-filter',
  COLLECTION: 'data-collection',
  ARTWORK_ID: 'data-artwork-id',
  PRINTS_AVAILABLE: 'data-prints-available'
};

// Email configuration
export const CONTACT = {
  EMAIL: 'contact@branchstoneart.com',
  DEFAULT_SUBJECT: 'Website Contact Form'
};

// Feature flags (for gradual rollout or A/B testing)
export const FEATURES = {
  HAPTIC_FEEDBACK: true,
  MOBILE_BOTTOM_NAV: true,
  PARALLAX_EFFECTS: true,
  STATS_ANIMATION: true
};

// Gallery configuration
export const GALLERY = {
  FILTER_STAGGER_DELAY: 50,
  FILTER_FADE_DURATION: 200,
  FILTER_FADE_DURATION_MULTIPLIER: 1.5,
  FILTER_TRANSLATE_SHOW: 20,
  FILTER_TRANSLATE_HIDE: -20,
  DEFAULT_ASPECT_RATIO_MEDIUM: 1,
  DEFAULT_ASPECT_RATIO_OTHER: 0.8,
  IMAGE_FADE_DURATION: 300
};

// SVG namespace
export const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

// Artwork card configuration
export const ARTWORK_CARD = {
  SVG_VIEWBOX_DEFAULT: '0 0 24 24',
  SVG_STROKE_WIDTH: '2',
  IMAGE_LOADING: 'lazy'
};

// URL paths - centralized to prevent hardcoding throughout the codebase
export const URLS = {
  GALLERY: 'gallery.html',
  CONTACT: 'contact.html',
  INDEX: 'index.html',
  COMMISSIONS: 'commissions.html',
  ARTWORKS_JSON: './artworks.json',
  FEEDBACKS_JSON: 'feedbacks.json',
  PLACEHOLDER_IMAGE: 'img/placeholder.webp'
};

// Swipe gesture thresholds
export const SWIPE = {
  HORIZONTAL_THRESHOLD: 50,
  VERTICAL_THRESHOLD: 100,
  CLOSE_THRESHOLD: 100
};

// Text truncation thresholds
export const TEXT = {
  DESCRIPTION_LONG_THRESHOLD: 300,
  MOBILE_DESCRIPTION_TRUNCATE: 240
};

// Scroll thresholds
export const SCROLL_THRESHOLDS = {
  STICKY: 300,
  BOTTOM_NAV: 150,
  BOTTOM_NAV_HIDE: 200
};
