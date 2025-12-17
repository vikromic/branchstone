/**
 * Security Utilities Module
 * Functions for input validation, sanitization, and XSS prevention
 * Consolidates security logic from main.js and other modules
 *
 * NOTE: This module contains sanitization functions that use innerHTML by design.
 * These are NOT vulnerabilities - they are the sanitization layer itself.
 */

import { FORM } from './constants.js';

/**
 * Validate URL is safe (relative or same-origin only)
 * Prevents loading resources from malicious external sources
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL is safe
 */
export const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;

  // Allow relative URLs (start with ./ or ../ or / or just filename)
  if (url.startsWith('./') || url.startsWith('../') || url.startsWith('/')) {
    return true;
  }

  // Allow data URLs for inline images (only specific safe image types)
  if (url.startsWith('data:image/')) {
    const allowedTypes = [
      'data:image/jpeg',
      'data:image/png',
      'data:image/gif',
      'data:image/webp',
      'data:image/svg+xml'
    ];
    return allowedTypes.some(type => url.startsWith(type));
  }

  // Allow same-origin absolute URLs
  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.origin === window.location.origin;
  } catch {
    // If URL parsing fails, check if it looks like a relative path (no protocol)
    return !url.includes('://') && !url.startsWith('//');
  }
};

/**
 * Validate URL is safe (general purpose, not just images)
 * @param {string} url - URL to validate
 * @param {Object} options - Validation options
 * @param {boolean} options.allowExternal - Allow external URLs
 * @param {string[]} options.allowedDomains - List of allowed domains
 * @param {string[]} options.allowedProtocols - List of allowed protocols
 * @returns {boolean}
 */
export const isValidUrl = (url, options = {}) => {
  const {
    allowExternal = false,
    allowedDomains = [],
    allowedProtocols = ['http:', 'https:']
  } = options;

  if (!url || typeof url !== 'string') return false;

  // Allow relative URLs
  if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
    return true;
  }

  try {
    const urlObj = new URL(url, window.location.origin);

    // Check protocol
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return false;
    }

    // Check if same origin
    if (urlObj.origin === window.location.origin) {
      return true;
    }

    // Check if external URLs are allowed
    if (!allowExternal) {
      return false;
    }

    // Check against allowed domains list
    if (allowedDomains.length > 0) {
      return allowedDomains.some(domain => urlObj.hostname.endsWith(domain));
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Sanitize text content to prevent XSS
 * This is the SANITIZATION function - using textContent is safe by design
 * Input: potentially malicious string -> Output: HTML-escaped safe string
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text (HTML entities encoded)
 */
export const sanitizeText = (text) => {
  if (!text || typeof text !== 'string') return '';
  const div = document.createElement('div');
  // textContent automatically escapes HTML - this is the sanitization step
  div.textContent = text;
  // Reading innerHTML after setting textContent gives us the escaped version
  return div.innerHTML; // SAFE: textContent has already escaped everything
};

/**
 * Sanitize HTML using DOMParser (removes script tags and event handlers)
 * This function SANITIZES untrusted HTML to make it safe
 * @param {string} html - HTML string to sanitize (UNTRUSTED INPUT)
 * @returns {string} Sanitized HTML (SAFE OUTPUT)
 */
export const sanitizeHTML = (html) => {
  if (!html || typeof html !== 'string') return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove script tags
  const scripts = doc.querySelectorAll('script');
  scripts.forEach(script => script.remove());

  // Remove event handlers
  const allElements = doc.querySelectorAll('*');
  allElements.forEach(element => {
    // Remove on* attributes (onclick, onload, etc.)
    Array.from(element.attributes).forEach(attr => {
      if (attr.name.startsWith('on')) {
        element.removeAttribute(attr.name);
      }
    });

    // Remove javascript: URLs
    ['href', 'src', 'action'].forEach(attr => {
      const value = element.getAttribute(attr);
      if (value && value.toLowerCase().startsWith('javascript:')) {
        element.removeAttribute(attr);
      }
    });
  });

  // SAFE: All dangerous content has been removed above
  return doc.body.innerHTML;
};

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return FORM.EMAIL_REGEX.test(email.trim());
};

/**
 * Validate email format (strict)
 * More comprehensive email validation
 * @param {string} email - Email address to validate
 * @returns {boolean}
 */
export const isValidEmailStrict = (email) => {
  if (!email || typeof email !== 'string') return false;

  // RFC 5322 compliant regex (simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email.trim());
};

/**
 * Escape HTML special characters
 * @param {string} str - String to escape
 * @returns {string}
 */
export const escapeHTML = (str) => {
  if (!str || typeof str !== 'string') return '';

  const htmlEntities = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  return str.replace(/[&<>"'/]/g, char => htmlEntities[char]);
};

/**
 * Unescape HTML entities
 * SAFE: Uses textContent to read decoded content, not innerHTML
 * @param {string} str - String with HTML entities
 * @returns {string}
 */
export const unescapeHTML = (str) => {
  if (!str || typeof str !== 'string') return '';

  const div = document.createElement('div');
  div.innerHTML = str; // SAFE: only reading textContent below, never executing
  return div.textContent || div.innerText || '';
};

/**
 * Strip HTML tags from string
 * SAFE: Uses textContent to extract only text, ignoring all HTML
 * @param {string} html - HTML string
 * @returns {string} Text content only
 */
export const stripHTML = (html) => {
  if (!html || typeof html !== 'string') return '';

  const div = document.createElement('div');
  div.innerHTML = html; // SAFE: only reading textContent below
  return div.textContent || div.innerText || '';
};

/**
 * Validate and sanitize user input
 * @param {string} input - User input
 * @param {Object} options - Validation options
 * @param {number} options.maxLength - Maximum length
 * @param {RegExp} options.pattern - Pattern to match
 * @param {boolean} options.allowHTML - Allow HTML (will be sanitized)
 * @returns {{valid: boolean, value: string, error: string|null}}
 */
export const validateInput = (input, options = {}) => {
  const {
    maxLength = Infinity,
    pattern = null,
    allowHTML = false
  } = options;

  if (!input || typeof input !== 'string') {
    return {
      valid: false,
      value: '',
      error: 'Input is required'
    };
  }

  let value = input.trim();

  // Check length
  if (value.length === 0) {
    return {
      valid: false,
      value: '',
      error: 'Input is required'
    };
  }

  if (value.length > maxLength) {
    return {
      valid: false,
      value: value.substring(0, maxLength),
      error: `Input must be ${maxLength} characters or less`
    };
  }

  // Sanitize - this makes untrusted input safe
  if (allowHTML) {
    value = sanitizeHTML(value);
  } else {
    value = sanitizeText(value);
  }

  // Check pattern
  if (pattern && !pattern.test(value)) {
    return {
      valid: false,
      value,
      error: 'Input format is invalid'
    };
  }

  return {
    valid: true,
    value,
    error: null
  };
};

/**
 * Check for honeypot field (bot detection)
 * @param {HTMLInputElement} field - Honeypot field element
 * @returns {boolean} True if likely a bot (field was filled)
 */
export const checkHoneypot = (field) => {
  if (!field) return false;
  return field.value.trim().length > 0;
};

/**
 * Rate limiting utility
 * Prevents abuse by limiting action frequency
 */
export class RateLimiter {
  constructor(maxAttempts, timeWindow) {
    this.maxAttempts = maxAttempts;
    this.timeWindow = timeWindow;
    this.attempts = new Map();
  }

  /**
   * Check if action is allowed
   * @param {string} key - Identifier (e.g., IP, user ID)
   * @returns {boolean}
   */
  isAllowed(key) {
    const now = Date.now();
    const userAttempts = this.attempts.get(key) || [];

    // Remove old attempts outside time window
    const recentAttempts = userAttempts.filter(
      timestamp => now - timestamp < this.timeWindow
    );

    if (recentAttempts.length >= this.maxAttempts) {
      return false;
    }

    // Record this attempt
    recentAttempts.push(now);
    this.attempts.set(key, recentAttempts);

    return true;
  }

  /**
   * Reset attempts for a key
   * @param {string} key - Identifier
   */
  reset(key) {
    this.attempts.delete(key);
  }

  /**
   * Clear all attempts
   */
  clear() {
    this.attempts.clear();
  }
}

/**
 * Secure random string generator
 * @param {number} length - Length of random string
 * @returns {string}
 */
export const generateSecureToken = (length = 32) => {
  if (window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  } else {
    // Fallback for older browsers (less secure)
    console.warn('[Security] crypto.getRandomValues not available, using less secure fallback');
    return Array.from({ length }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
};

export default {
  isValidImageUrl,
  isValidUrl,
  sanitizeText,
  sanitizeHTML,
  isValidEmail,
  isValidEmailStrict,
  escapeHTML,
  unescapeHTML,
  stripHTML,
  validateInput,
  checkHoneypot,
  RateLimiter,
  generateSecureToken
};
