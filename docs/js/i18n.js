/**
 * Branchstone i18n - Internationalization System
 * Supports English (default) and Ukrainian languages
 * Features: URL routing, localStorage persistence, dynamic content loading
 */

// ========================================
// CONSTANTS
// ========================================

const LANGUAGES = {
  EN: 'en',
  UK: 'uk'
};

const STORAGE_KEY = 'branchstone.language';
const GEO_CHECKED_KEY = 'branchstone.geoChecked';
const URL_PARAM = 'lang';
const TRANSLATIONS_BASE_PATH = 'json_data';

// Countries that should default to Ukrainian
const UKRAINIAN_COUNTRIES = ['UA']; // Ukraine country code

// Default language (English - no separate JSON file needed, uses hardcoded HTML)
const DEFAULT_LANGUAGE = LANGUAGES.EN;

// ========================================
// I18N MANAGER CLASS
// ========================================

export class I18nManager {
  constructor() {
    this.currentLanguage = DEFAULT_LANGUAGE;
    this.translations = {};
    this.initialized = false;
  }

  /**
   * Initialize i18n system
   * 1. Detect language from URL > localStorage > geolocation > default
   * 2. Load translations if needed
   * 3. Apply translations to page
   * 4. Initialize language switcher
   */
  async init() {
    try {
      console.log('[i18n] Initializing internationalization system...');

      // Detect language (may trigger geolocation check)
      this.currentLanguage = await this.detectLanguageWithGeo();
      console.log('[i18n] Detected language:', this.currentLanguage);

      // Load translations if not English
      if (this.currentLanguage !== DEFAULT_LANGUAGE) {
        await this.loadTranslations(this.currentLanguage);
        this.applyTranslations();
      }

      // Update HTML lang attribute
      document.documentElement.setAttribute('lang', this.currentLanguage);

      // Initialize language switcher
      this.initLanguageSwitcher();

      this.initialized = true;
      console.log('[i18n] Initialization complete');

      return true;
    } catch (error) {
      console.error('[i18n] Initialization failed:', error);
      // Fallback to English on error
      this.currentLanguage = DEFAULT_LANGUAGE;
      return false;
    }
  }

  /**
   * Detect language with geolocation fallback
   * Priority: URL param > localStorage > geolocation > default
   */
  async detectLanguageWithGeo() {
    // 1. Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get(URL_PARAM);
    if (urlLang && this.isValidLanguage(urlLang)) {
      console.log('[i18n] Language from URL:', urlLang);
      this.saveLanguagePreference(urlLang);
      return urlLang;
    }

    // 2. Check localStorage for user preference
    const savedLang = this.getLanguagePreference();
    if (savedLang && this.isValidLanguage(savedLang)) {
      console.log('[i18n] Language from localStorage:', savedLang);
      return savedLang;
    }

    // 3. Check if we've already done geolocation detection
    const geoChecked = this.hasGeoBeenChecked();
    if (!geoChecked) {
      console.log('[i18n] No saved preference, checking geolocation...');
      const geoLang = await this.detectLanguageByGeolocation();
      if (geoLang) {
        console.log('[i18n] Language from geolocation:', geoLang);
        this.saveLanguagePreference(geoLang);
        return geoLang;
      }
    }

    // 4. Default
    console.log('[i18n] Using default language:', DEFAULT_LANGUAGE);
    return DEFAULT_LANGUAGE;
  }

  /**
   * Detect language based on user's country via IP geolocation
   * @returns {string|null} Language code or null if detection fails
   */
  async detectLanguageByGeolocation() {
    try {
      // Use ip-api.com (free, no API key required, 45 requests/minute)
      const response = await fetch('https://ip-api.com/json/?fields=countryCode', {
        signal: AbortSignal.timeout(3000) // 3 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const countryCode = data.countryCode;

      console.log('[i18n] Detected country:', countryCode);

      // Mark that we've checked geolocation
      this.markGeoChecked();

      // Check if country should use Ukrainian
      if (UKRAINIAN_COUNTRIES.includes(countryCode)) {
        return LANGUAGES.UK;
      }

      return null; // Use default language
    } catch (error) {
      console.warn('[i18n] Geolocation detection failed:', error.message);
      // Mark as checked even on failure to avoid repeated attempts
      this.markGeoChecked();
      return null;
    }
  }

  /**
   * Check if geolocation has already been checked this session
   */
  hasGeoBeenChecked() {
    try {
      return sessionStorage.getItem(GEO_CHECKED_KEY) === 'true';
    } catch (e) {
      return false;
    }
  }

  /**
   * Mark that geolocation has been checked
   */
  markGeoChecked() {
    try {
      sessionStorage.setItem(GEO_CHECKED_KEY, 'true');
    } catch (e) {
      // sessionStorage not available
    }
  }

  /**
   * Detect language from URL param > localStorage > default
   * Priority: ?lang=uk > localStorage > en
   */
  detectLanguage() {
    // 1. Check URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const urlLang = urlParams.get(URL_PARAM);
    if (urlLang && this.isValidLanguage(urlLang)) {
      console.log('[i18n] Language from URL:', urlLang);
      // Save to localStorage for persistence
      this.saveLanguagePreference(urlLang);
      return urlLang;
    }

    // 2. Check localStorage
    const savedLang = this.getLanguagePreference();
    if (savedLang && this.isValidLanguage(savedLang)) {
      console.log('[i18n] Language from localStorage:', savedLang);
      return savedLang;
    }

    // 3. Default
    console.log('[i18n] Using default language:', DEFAULT_LANGUAGE);
    return DEFAULT_LANGUAGE;
  }

  /**
   * Validate language code
   */
  isValidLanguage(lang) {
    return Object.values(LANGUAGES).includes(lang);
  }

  /**
   * Load translations from JSON file
   */
  async loadTranslations(lang) {
    if (lang === DEFAULT_LANGUAGE) {
      console.log('[i18n] Skipping translation load for default language');
      return;
    }

    try {
      const response = await fetch(`${TRANSLATIONS_BASE_PATH}/${lang}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load translations: ${response.status}`);
      }

      this.translations = await response.json();
      console.log('[i18n] Loaded translations for', lang);
    } catch (error) {
      console.error('[i18n] Failed to load translations:', error);
      throw error;
    }
  }

  /**
   * Get translation by key path (e.g., 'nav.home')
   * Supports nested keys with dot notation
   */
  t(keyPath, fallback = '') {
    if (this.currentLanguage === DEFAULT_LANGUAGE) {
      return fallback; // Return fallback for English (uses hardcoded HTML)
    }

    const keys = keyPath.split('.');
    let value = this.translations;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        console.warn(`[i18n] Missing translation for key: ${keyPath}`);
        return fallback || keyPath;
      }
    }

    return value || fallback || keyPath;
  }

  /**
   * Apply translations to current page
   * Updates all elements with [data-i18n] attributes
   */
  applyTranslations() {
    if (this.currentLanguage === DEFAULT_LANGUAGE) {
      console.log('[i18n] Skipping translation application for default language');
      return;
    }

    console.log('[i18n] Applying translations to page...');

    // Find all elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');
    console.log(`[i18n] Found ${elements.length} translatable elements`);

    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);

      if (translation && translation !== key) {
        // Determine what to update based on element type
        if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
          // For inputs/textareas, update placeholder
          element.placeholder = translation;
        } else {
          // For other elements, update text content
          element.textContent = translation;
        }
      }
    });

    console.log('[i18n] Translations applied');
  }

  /**
   * Switch to a different language
   */
  async switchLanguage(newLang) {
    if (!this.isValidLanguage(newLang)) {
      console.error('[i18n] Invalid language:', newLang);
      return false;
    }

    if (newLang === this.currentLanguage) {
      console.log('[i18n] Already using language:', newLang);
      return true;
    }

    console.log('[i18n] Switching language to:', newLang);

    // Update URL parameter
    const url = new URL(window.location);
    if (newLang !== DEFAULT_LANGUAGE) {
      url.searchParams.set(URL_PARAM, newLang);
    } else {
      url.searchParams.delete(URL_PARAM);
    }

    // Save preference
    this.saveLanguagePreference(newLang);

    // Reload page with new language
    window.location.href = url.toString();

    return true;
  }

  /**
   * Get language preference from localStorage
   */
  getLanguagePreference() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      console.warn('[i18n] Failed to read from localStorage:', error);
      return null;
    }
  }

  /**
   * Save language preference to localStorage
   */
  saveLanguagePreference(lang) {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
      console.log('[i18n] Saved language preference:', lang);
    } catch (error) {
      console.warn('[i18n] Failed to save to localStorage:', error);
    }
  }

  /**
   * Initialize language switcher UI
   * Finds all switcher buttons (desktop and mobile) and adds event listeners
   */
  initLanguageSwitcher() {
    const switchers = document.querySelectorAll('.language-switcher');
    if (switchers.length === 0) {
      console.warn('[i18n] Language switcher elements not found');
      return;
    }

    switchers.forEach(switcher => {
      // Update switcher UI to show current language
      this.updateSwitcherUI(switcher);

      // Add click handler
      switcher.addEventListener('click', (e) => {
        e.preventDefault();
        const targetLang = this.currentLanguage === LANGUAGES.EN ? LANGUAGES.UK : LANGUAGES.EN;
        this.switchLanguage(targetLang);
      });
    });

    console.log(`[i18n] Language switcher initialized (${switchers.length} instances)`);
  }

  /**
   * Update language switcher button to show current language
   */
  updateSwitcherUI(switcher) {
    const label = switcher.querySelector('.language-switcher__label');
    const icon = switcher.querySelector('.language-switcher__icon');

    if (label) {
      label.textContent = this.currentLanguage === LANGUAGES.EN ? 'EN' : 'UA';
    }

    // Update aria-label for accessibility
    const langName = this.currentLanguage === LANGUAGES.EN ? 'Ukrainian' : 'English';
    switcher.setAttribute('aria-label', `Switch to ${langName}`);
  }

  /**
   * Get current language
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  /**
   * Check if using Ukrainian
   */
  isUkrainian() {
    return this.currentLanguage === LANGUAGES.UK;
  }

  /**
   * Check if using English
   */
  isEnglish() {
    return this.currentLanguage === LANGUAGES.EN;
  }
}

// ========================================
// SINGLETON INSTANCE
// ========================================

let i18nInstance = null;

/**
 * Get singleton instance of I18nManager
 */
export function getI18n() {
  if (!i18nInstance) {
    i18nInstance = new I18nManager();
  }
  return i18nInstance;
}

/**
 * Initialize i18n system (called from main.js)
 */
export async function initI18n() {
  const i18n = getI18n();
  return await i18n.init();
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Translate a key (shorthand for getI18n().t())
 */
export function t(key, fallback = '') {
  return getI18n().t(key, fallback);
}

/**
 * Get current language
 */
export function getCurrentLanguage() {
  return getI18n().getCurrentLanguage();
}

/**
 * Switch language
 */
export function switchLanguage(lang) {
  return getI18n().switchLanguage(lang);
}
