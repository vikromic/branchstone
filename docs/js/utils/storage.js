/**
 * Storage Utility Functions
 * Safe localStorage/sessionStorage wrapper with error handling
 * @module utils/storage
 */

/**
 * Check if storage is available
 * @param {string} type - 'localStorage' or 'sessionStorage'
 * @returns {boolean} True if storage is available
 */
function isStorageAvailable(type) {
  try {
    const storage = window[type];
    const test = '__storage_test__';
    storage.setItem(test, test);
    storage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Get item from storage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if not found
 * @param {string} storageType - 'localStorage' or 'sessionStorage'
 * @returns {*} Stored value or default
 */
export function getStorageItem(key, defaultValue = null, storageType = 'localStorage') {
  if (!isStorageAvailable(storageType)) {
    console.warn(`${storageType} is not available`);
    return defaultValue;
  }

  try {
    const item = window[storageType].getItem(key);
    if (item === null) return defaultValue;

    // Try to parse JSON, fallback to raw string
    try {
      return JSON.parse(item);
    } catch {
      return item;
    }
  } catch (error) {
    console.error(`Error reading from ${storageType}:`, error);
    return defaultValue;
  }
}

/**
 * Set item in storage
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @param {string} storageType - 'localStorage' or 'sessionStorage'
 * @returns {boolean} True if successful
 */
export function setStorageItem(key, value, storageType = 'localStorage') {
  if (!isStorageAvailable(storageType)) {
    console.warn(`${storageType} is not available`);
    return false;
  }

  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    window[storageType].setItem(key, serialized);
    return true;
  } catch (error) {
    console.error(`Error writing to ${storageType}:`, error);
    return false;
  }
}

/**
 * Remove item from storage
 * @param {string} key - Storage key
 * @param {string} storageType - 'localStorage' or 'sessionStorage'
 * @returns {boolean} True if successful
 */
export function removeStorageItem(key, storageType = 'localStorage') {
  if (!isStorageAvailable(storageType)) {
    return false;
  }

  try {
    window[storageType].removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing from ${storageType}:`, error);
    return false;
  }
}

/**
 * Clear all items from storage
 * @param {string} storageType - 'localStorage' or 'sessionStorage'
 * @returns {boolean} True if successful
 */
export function clearStorage(storageType = 'localStorage') {
  if (!isStorageAvailable(storageType)) {
    return false;
  }

  try {
    window[storageType].clear();
    return true;
  } catch (error) {
    console.error(`Error clearing ${storageType}:`, error);
    return false;
  }
}
