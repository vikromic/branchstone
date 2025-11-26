/**
 * Theme Manager Component
 * Handles light/dark theme toggling with system preference support
 * @module components/Theme
 */

import { $, on, setAttributes } from '../utils/dom.js';
import { getStorageItem, setStorageItem } from '../utils/storage.js';
import CONFIG from '../config.js';

export class ThemeManager {
  /**
   * @param {Object} options - Theme options
   * @param {string} options.toggleSelector - Toggle button selector
   */
  constructor(options = {}) {
    this.toggle = $(options.toggleSelector || '#theme-toggle');
    this.currentTheme = this.getInitialTheme();

    if (!this.toggle) return;

    this.init();
  }

  /**
   * Initialize theme manager
   * @private
   */
  init() {
    this.applyTheme(this.currentTheme);
    this.attachEventListeners();
    this.watchSystemPreference();
  }

  /**
   * Get initial theme from storage or system preference
   * @private
   * @returns {string} Theme name
   */
  getInitialTheme() {
    const stored = getStorageItem(CONFIG.storage.theme);
    if (stored === CONFIG.theme.light || stored === CONFIG.theme.dark) {
      return stored;
    }
    return this.getSystemThemePreference();
  }

  /**
   * Get system theme preference
   * @private
   * @returns {string} Theme name
   */
  getSystemThemePreference() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return CONFIG.theme.dark;
    }
    return CONFIG.theme.light;
  }

  /**
   * Attach event listeners
   * @private
   */
  attachEventListeners() {
    on(this.toggle, 'click', () => this.toggleTheme());
  }

  /**
   * Watch for system preference changes
   * @private
   */
  watchSystemPreference() {
    if (!window.matchMedia) return;

    const userPreference = getStorageItem(CONFIG.storage.theme);
    if (userPreference) return; // Don't watch if user has explicit preference

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    on(mediaQuery, 'change', (e) => {
      const newTheme = e.matches ? CONFIG.theme.dark : CONFIG.theme.light;
      this.applyTheme(newTheme);
    });
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const newTheme = this.currentTheme === CONFIG.theme.dark
      ? CONFIG.theme.light
      : CONFIG.theme.dark;

    this.applyTheme(newTheme);
    setStorageItem(CONFIG.storage.theme, newTheme);
  }

  /**
   * Apply theme to document
   * @param {string} theme - Theme name
   */
  applyTheme(theme) {
    this.currentTheme = theme;
    document.documentElement.setAttribute(CONFIG.theme.attribute, theme);
    this.updateToggleLabel(theme);
  }

  /**
   * Update toggle button label for accessibility
   * @private
   * @param {string} theme - Current theme
   */
  updateToggleLabel(theme) {
    const label = theme === CONFIG.theme.dark
      ? 'Switch to light mode'
      : 'Switch to dark mode';
    setAttributes(this.toggle, { 'aria-label': label });
  }

  /**
   * Get current theme
   * @returns {string} Current theme name
   */
  getTheme() {
    return this.currentTheme;
  }
}

export default ThemeManager;
