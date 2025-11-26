/**
 * DOM Utility Functions
 * Pure functions for common DOM operations
 * @module utils/dom
 */

/**
 * Safely query a single element
 * @param {string} selector - CSS selector
 * @param {Element} context - Context element (default: document)
 * @returns {Element|null} Found element or null
 */
export function $(selector, context = document) {
  return context.querySelector(selector);
}

/**
 * Safely query all elements
 * @param {string} selector - CSS selector
 * @param {Element} context - Context element (default: document)
 * @returns {Element[]} Array of elements
 */
export function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

/**
 * Add event listener with automatic cleanup tracking
 * @param {Element} element - Target element
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @param {Object|boolean} options - Event options
 * @returns {Function} Cleanup function
 */
export function on(element, event, handler, options = {}) {
  if (!element) return () => {};

  element.addEventListener(event, handler, options);
  return () => element.removeEventListener(event, handler, options);
}

/**
 * Create an element with attributes and children
 * @param {string} tag - HTML tag name
 * @param {Object} attrs - Element attributes
 * @param {Array|string} children - Child elements or text
 * @returns {Element} Created element
 */
export function createElement(tag, attrs = {}, children = []) {
  const element = document.createElement(tag);

  // Set attributes
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    } else if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      element.setAttribute(key, value);
    }
  });

  // Add children
  const childArray = Array.isArray(children) ? children : [children];
  childArray.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else if (child instanceof Element) {
      element.appendChild(child);
    }
  });

  return element;
}

/**
 * Toggle multiple classes on an element
 * @param {Element} element - Target element
 * @param {string[]} classes - Classes to toggle
 * @param {boolean} force - Force add/remove
 */
export function toggleClasses(element, classes, force) {
  if (!element) return;
  classes.forEach(className => element.classList.toggle(className, force));
}

/**
 * Get all focusable elements within a container
 * @param {Element} container - Container element
 * @returns {Element[]} Focusable elements
 */
export function getFocusableElements(container) {
  const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  return $$(selector, container);
}

/**
 * Set multiple attributes at once
 * @param {Element} element - Target element
 * @param {Object} attrs - Attributes to set
 */
export function setAttributes(element, attrs) {
  if (!element) return;
  Object.entries(attrs).forEach(([key, value]) => {
    element.setAttribute(key, value);
  });
}

/**
 * Announce message to screen readers
 * @param {string} message - Message to announce
 * @param {string} priority - 'polite' or 'assertive'
 */
export function announceToScreenReader(message, priority = 'polite') {
  const announcement = createElement('div', {
    role: 'status',
    'aria-live': priority,
    'aria-atomic': 'true',
    className: 'sr-only',
  }, message);

  document.body.appendChild(announcement);
  setTimeout(() => announcement.remove(), 1000);
}

/**
 * Debounce function execution
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function execution
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in ms
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Request animation frame with fallback
 * @param {Function} callback - Callback function
 * @returns {Function} Cancel function
 */
export function requestFrame(callback) {
  const id = requestAnimationFrame(callback);
  return () => cancelAnimationFrame(id);
}
