/**
 * Theme Initialization
 * Loads theme preference before page render to prevent FOUC (Flash of Unstyled Content)
 * Must be executed as early as possible in page load
 */
(function () {
    'use strict';

    const STORAGE_KEY = 'theme';
    const ATTR_NAME = 'data-theme';
    const THEME_DARK = 'dark';
    const THEME_LIGHT = 'light';

    /**
     * Get system theme preference
     * @returns {string} 'dark' or 'light'
     */
    function getSystemThemePreference() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return THEME_DARK;
        }
        return THEME_LIGHT;
    }

    /**
     * Get stored theme preference or fallback to system preference
     * @returns {string} 'dark' or 'light'
     */
    function getThemePreference() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === THEME_DARK || stored === THEME_LIGHT) {
                return stored;
            }
        } catch (e) {
            // localStorage not available or blocked
            console.warn('localStorage not available for theme storage');
        }
        return getSystemThemePreference();
    }

    // Apply theme immediately
    const theme = getThemePreference();
    document.documentElement.setAttribute(ATTR_NAME, theme);
})();
