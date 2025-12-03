/**
 * Input Sanitization Utilities
 * Provides comprehensive sanitization for user-controlled data to prevent XSS attacks
 *
 * Security: Follows OWASP guidelines for output encoding and context-aware sanitization
 * CWE-79: Improper Neutralization of Input During Web Page Generation (XSS)
 *
 * @module utils/sanitize
 */

/**
 * Sanitize HTML content by escaping all potentially dangerous characters
 * Uses context-aware encoding for HTML content
 *
 * @param {string} input - Raw input string that may contain malicious content
 * @returns {string} Sanitized string safe for HTML context
 *
 * @example
 * sanitizeHTML('<script>alert("XSS")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
 */
export function sanitizeHTML(input) {
  if (typeof input !== 'string') {
    return '';
  }

  const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return input.replace(/[&<>"'/]/g, (char) => entityMap[char]);
}

/**
 * Sanitize text content for safe insertion into textContent
 * Note: textContent is inherently safe from XSS, but we still validate input
 *
 * @param {string} input - Text input
 * @returns {string} Sanitized text
 */
export function sanitizeText(input) {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove control characters except common whitespace
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Sanitize URL to prevent javascript: and data: URI XSS
 * Only allows http, https, mailto, and relative URLs
 *
 * @param {string} url - URL to sanitize
 * @returns {string} Safe URL or empty string if dangerous
 *
 * @example
 * sanitizeURL('javascript:alert(1)') // Returns: ''
 * sanitizeURL('https://example.com') // Returns: 'https://example.com'
 */
export function sanitizeURL(url) {
  if (typeof url !== 'string') {
    return '';
  }

  const trimmedURL = url.trim();

  // Empty URLs are safe
  if (trimmedURL === '') {
    return '';
  }

  // Allow relative URLs (starting with / or ./)
  if (trimmedURL.startsWith('/') || trimmedURL.startsWith('./') || trimmedURL.startsWith('../')) {
    return trimmedURL;
  }

  // Check against allowed protocols
  const allowedProtocols = ['http:', 'https:', 'mailto:'];

  try {
    const parsedURL = new URL(trimmedURL, window.location.href);

    if (allowedProtocols.includes(parsedURL.protocol)) {
      return parsedURL.href;
    }
  } catch (e) {
    // Invalid URL format, return empty
    return '';
  }

  // If we reach here, the URL is not safe
  return '';
}

/**
 * Sanitize attribute value for safe insertion into HTML attributes
 * Prevents breaking out of attribute context
 *
 * @param {string} input - Attribute value
 * @returns {string} Sanitized attribute value
 */
export function sanitizeAttribute(input) {
  if (typeof input !== 'string') {
    return '';
  }

  // Escape characters that could break out of attribute context
  const entityMap = {
    '"': '&quot;',
    "'": '&#x27;',
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
  };

  return input.replace(/["'&<>]/g, (char) => entityMap[char]);
}

/**
 * Create safe text node for DOM insertion
 * Uses native browser APIs to ensure text is properly escaped
 *
 * @param {string} text - Text to insert
 * @returns {Text} Text node safe for DOM insertion
 */
export function createSafeTextNode(text) {
  return document.createTextNode(sanitizeText(text || ''));
}

/**
 * Safely set element text content
 * Clears existing content and sets sanitized text
 *
 * @param {Element} element - Target element
 * @param {string} text - Text to set
 */
export function setSafeTextContent(element, text) {
  if (!element) {
    return;
  }

  // Clear existing content
  element.textContent = '';

  // Set sanitized text
  element.textContent = sanitizeText(text || '');
}

/**
 * Safely set element innerHTML with sanitized content
 * WARNING: Only use when HTML formatting is absolutely necessary
 * Prefer textContent or createSafeTextNode when possible
 *
 * @param {Element} element - Target element
 * @param {string} html - HTML content to sanitize and set
 */
export function setSafeHTML(element, html) {
  if (!element) {
    return;
  }

  // Clear existing content
  element.innerHTML = '';

  // Set sanitized HTML
  element.innerHTML = sanitizeHTML(html || '');
}

/**
 * Sanitize and validate data object for gallery/lightbox use
 * Ensures all properties are safe strings
 *
 * @param {Object} data - Data object with user-controlled values
 * @returns {Object} Sanitized data object
 */
export function sanitizeArtworkData(data) {
  if (!data || typeof data !== 'object') {
    return {};
  }

  return {
    title: sanitizeText(data.title || ''),
    size: sanitizeText(data.size || ''),
    materials: sanitizeText(data.materials || ''),
    description: sanitizeText(data.description || ''),
    price: sanitizeText(data.price || ''),
    image: sanitizeURL(data.img || data.image || ''),
    category: sanitizeText(data.category || 'uncategorized'),
    available: Boolean(data.available),
    soldOut: Boolean(data.soldOut),
    printsAvailable: Boolean(data.printsAvailable),
  };
}

/**
 * Validate and sanitize JSON data
 * Safely parses JSON and sanitizes string values
 *
 * @param {string} jsonString - JSON string to parse
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} Parsed and sanitized data or default value
 */
export function sanitizeJSON(jsonString, defaultValue = null) {
  if (typeof jsonString !== 'string') {
    return defaultValue;
  }

  try {
    const parsed = JSON.parse(jsonString);

    // If parsed value is a string, sanitize it
    if (typeof parsed === 'string') {
      return sanitizeText(parsed);
    }

    // If parsed value is an array of strings, sanitize each
    if (Array.isArray(parsed)) {
      return parsed.map((item) => (typeof item === 'string' ? sanitizeText(item) : item));
    }

    // If parsed value is an object, sanitize string properties
    if (parsed && typeof parsed === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === 'string') {
          sanitized[key] = sanitizeText(value);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    }

    return parsed;
  } catch (e) {
    console.warn('Failed to parse JSON:', e);
    return defaultValue;
  }
}

/**
 * Sanitization utility object for convenient access
 */
export const sanitize = {
  html: sanitizeHTML,
  text: sanitizeText,
  url: sanitizeURL,
  attribute: sanitizeAttribute,
  artworkData: sanitizeArtworkData,
  json: sanitizeJSON,
};

export default sanitize;
