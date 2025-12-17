/**
 * Storage Module
 * Safe localStorage operations with validation and error handling
 * Consolidates storage logic from main.js and artist-feedback.js
 */

/**
 * Check if localStorage is available
 * @returns {boolean}
 */
export const isStorageAvailable = () => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Safely write data to localStorage with validation and error handling
 * @param {string} key - Storage key
 * @param {*} data - Data to store (will be JSON stringified)
 * @returns {boolean} Success status
 */
export const setItem = (key, data) => {
  // Validate key
  if (!key || typeof key !== 'string') {
    console.warn('[Storage] Invalid key:', key);
    return false;
  }

  // Validate data exists
  if (data === null || data === undefined) {
    console.warn('[Storage] Cannot store null/undefined data');
    return false;
  }

  if (!isStorageAvailable()) {
    console.warn('[Storage] localStorage not available');
    return false;
  }

  try {
    const serialized = JSON.stringify(data);

    // Check if serialization resulted in valid data
    if (!serialized || serialized === '{}' || serialized === 'null') {
      console.warn('[Storage] Invalid data for localStorage:', data);
      return false;
    }

    localStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    // Handle quota exceeded or other storage errors
    if (error.name === 'QuotaExceededError') {
      console.error('[Storage] Quota exceeded:', error);
    } else if (error.name === 'SecurityError') {
      console.error('[Storage] Access denied (private browsing?):', error);
    } else {
      console.error('[Storage] Failed to write:', error);
    }
    return false;
  }
};

/**
 * Safely read and validate data from localStorage
 * @param {string} key - Storage key
 * @returns {*|null} Parsed data or null if invalid/not found
 */
export const getItem = (key) => {
  if (!key || typeof key !== 'string') {
    console.warn('[Storage] Invalid key:', key);
    return null;
  }

  if (!isStorageAvailable()) {
    return null;
  }

  try {
    const item = localStorage.getItem(key);
    if (!item) {
      return null;
    }

    return JSON.parse(item);
  } catch (error) {
    console.error('[Storage] Failed to read:', error);
    // Clean up corrupted data
    removeItem(key);
    return null;
  }
};

/**
 * Remove item from localStorage
 * @param {string} key - Storage key
 * @returns {boolean} Success status
 */
export const removeItem = (key) => {
  if (!key || typeof key !== 'string') {
    console.warn('[Storage] Invalid key:', key);
    return false;
  }

  if (!isStorageAvailable()) {
    return false;
  }

  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('[Storage] Failed to remove:', error);
    return false;
  }
};

/**
 * Clear all localStorage data
 * @returns {boolean} Success status
 */
export const clear = () => {
  if (!isStorageAvailable()) {
    return false;
  }

  try {
    localStorage.clear();
    return true;
  } catch (error) {
    console.error('[Storage] Failed to clear:', error);
    return false;
  }
};

/**
 * Check if key exists in localStorage
 * @param {string} key - Storage key
 * @returns {boolean}
 */
export const hasItem = (key) => {
  if (!isStorageAvailable()) {
    return false;
  }

  try {
    return localStorage.getItem(key) !== null;
  } catch (error) {
    return false;
  }
};

/**
 * Get all keys in localStorage
 * @returns {string[]} Array of keys
 */
export const getAllKeys = () => {
  if (!isStorageAvailable()) {
    return [];
  }

  try {
    return Object.keys(localStorage);
  } catch (error) {
    console.error('[Storage] Failed to get keys:', error);
    return [];
  }
};

/**
 * Get item with expiration check
 * @param {string} key - Storage key
 * @param {number} maxAge - Maximum age in milliseconds
 * @returns {*|null} Data if not expired, null otherwise
 */
export const getItemWithExpiration = (key, maxAge) => {
  const data = getItem(key);

  if (!data || !data.timestamp) {
    return null;
  }

  const age = Date.now() - data.timestamp;

  if (age > maxAge) {
    removeItem(key);
    return null;
  }

  return data.value || data;
};

/**
 * Set item with timestamp for expiration checking
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @returns {boolean} Success status
 */
export const setItemWithTimestamp = (key, value) => {
  return setItem(key, {
    value,
    timestamp: Date.now()
  });
};

/**
 * Get storage size in bytes (approximate)
 * @returns {number} Size in bytes
 */
export const getStorageSize = () => {
  if (!isStorageAvailable()) {
    return 0;
  }

  try {
    let total = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  } catch (error) {
    console.error('[Storage] Failed to calculate size:', error);
    return 0;
  }
};

/**
 * Check if storage is near quota (approximate)
 * @returns {boolean}
 */
export const isStorageNearQuota = () => {
  const size = getStorageSize();
  const approximateQuota = 5 * 1024 * 1024; // Assume 5MB quota
  return size > approximateQuota * 0.9; // 90% threshold
};

/**
 * Namespace utilities for organized storage
 */
export class StorageNamespace {
  constructor(namespace) {
    this.namespace = namespace;
  }

  /**
   * Create namespaced key
   * @param {string} key - Key name
   * @returns {string} Namespaced key
   */
  _namespacedKey(key) {
    return `${this.namespace}:${key}`;
  }

  /**
   * Set item in namespace
   * @param {string} key - Key name
   * @param {*} value - Value to store
   * @returns {boolean}
   */
  setItem(key, value) {
    return setItem(this._namespacedKey(key), value);
  }

  /**
   * Get item from namespace
   * @param {string} key - Key name
   * @returns {*|null}
   */
  getItem(key) {
    return getItem(this._namespacedKey(key));
  }

  /**
   * Remove item from namespace
   * @param {string} key - Key name
   * @returns {boolean}
   */
  removeItem(key) {
    return removeItem(this._namespacedKey(key));
  }

  /**
   * Check if item exists in namespace
   * @param {string} key - Key name
   * @returns {boolean}
   */
  hasItem(key) {
    return hasItem(this._namespacedKey(key));
  }

  /**
   * Get all keys in namespace
   * @returns {string[]}
   */
  getAllKeys() {
    const allKeys = getAllKeys();
    const prefix = `${this.namespace}:`;
    return allKeys
      .filter(key => key.startsWith(prefix))
      .map(key => key.slice(prefix.length));
  }

  /**
   * Clear all items in namespace
   * @returns {boolean}
   */
  clear() {
    const keys = this.getAllKeys();
    let success = true;
    keys.forEach(key => {
      if (!this.removeItem(key)) {
        success = false;
      }
    });
    return success;
  }
}

/**
 * Create a namespaced storage instance
 * @param {string} namespace - Namespace prefix
 * @returns {StorageNamespace}
 */
export const createNamespace = (namespace) => {
  return new StorageNamespace(namespace);
};

// Export default instance with common methods
export default {
  setItem,
  getItem,
  removeItem,
  clear,
  hasItem,
  getAllKeys,
  getItemWithExpiration,
  setItemWithTimestamp,
  getStorageSize,
  isStorageNearQuota,
  isStorageAvailable,
  createNamespace
};
