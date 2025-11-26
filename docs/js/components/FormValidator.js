/**
 * Form Validator Component
 * Handles form validation with accessibility features
 * @module components/FormValidator
 */

import { $, on, setAttributes } from '../utils/dom.js';
import CONFIG from '../config.js';

export class FormValidator {
  /**
   * @param {Object} options - Validator options
   * @param {string} options.formSelector - Form selector
   * @param {Object} options.rules - Validation rules
   */
  constructor(options = {}) {
    this.form = $(options.formSelector || '#contact-form');
    this.rules = options.rules || this.getDefaultRules();

    if (!this.form) return;

    this.fields = new Map();
    this.init();
  }

  /**
   * Get default validation rules
   * @private
   * @returns {Object} Validation rules
   */
  getDefaultRules() {
    return {
      name: {
        required: true,
        errorMessage: CONFIG.validation.errorMessages.nameRequired,
      },
      email: {
        required: true,
        pattern: CONFIG.validation.email,
        errorMessages: {
          required: CONFIG.validation.errorMessages.emailRequired,
          pattern: CONFIG.validation.errorMessages.emailInvalid,
        },
      },
      message: {
        required: true,
        errorMessage: CONFIG.validation.errorMessages.messageRequired,
      },
    };
  }

  /**
   * Initialize form validator
   * @private
   */
  init() {
    this.cacheFields();
    this.attachEventListeners();
    this.form.setAttribute('novalidate', ''); // Use custom validation
  }

  /**
   * Cache form fields
   * @private
   */
  cacheFields() {
    Object.keys(this.rules).forEach(fieldName => {
      const field = $(`#${fieldName}`, this.form);
      const errorElement = $(`#${fieldName}-error`, this.form);

      if (field && errorElement) {
        this.fields.set(fieldName, { field, errorElement });
      }
    });
  }

  /**
   * Attach event listeners
   * @private
   */
  attachEventListeners() {
    // Form submission
    on(this.form, 'submit', (e) => {
      if (!this.validateAll()) {
        e.preventDefault();
        this.focusFirstInvalid();
      }
    });

    // Real-time validation
    this.fields.forEach(({ field }, fieldName) => {
      // Validate on blur
      on(field, 'blur', () => this.validateField(fieldName));

      // Clear error on input
      on(field, 'input', () => {
        if (field.value.trim()) {
          this.clearFieldError(fieldName);
        }
      });
    });
  }

  /**
   * Validate all fields
   * @returns {boolean} True if all fields are valid
   */
  validateAll() {
    let isValid = true;

    this.fields.forEach((_, fieldName) => {
      if (!this.validateField(fieldName)) {
        isValid = false;
      }
    });

    return isValid;
  }

  /**
   * Validate single field
   * @param {string} fieldName - Field name
   * @returns {boolean} True if field is valid
   */
  validateField(fieldName) {
    const { field, errorElement } = this.fields.get(fieldName) || {};
    if (!field || !errorElement) return true;

    const rule = this.rules[fieldName];
    const value = field.value.trim();

    // Check required
    if (rule.required && !value) {
      const message = rule.errorMessages?.required || rule.errorMessage;
      this.showFieldError(fieldName, message);
      return false;
    }

    // Check pattern
    if (rule.pattern && value && !rule.pattern.test(value)) {
      const message = rule.errorMessages?.pattern || rule.errorMessage;
      this.showFieldError(fieldName, message);
      return false;
    }

    // Check custom validator
    if (rule.validator && !rule.validator(value)) {
      this.showFieldError(fieldName, rule.errorMessage);
      return false;
    }

    this.clearFieldError(fieldName);
    return true;
  }

  /**
   * Show field error
   * @private
   * @param {string} fieldName - Field name
   * @param {string} message - Error message
   */
  showFieldError(fieldName, message) {
    const { field, errorElement } = this.fields.get(fieldName) || {};
    if (!field || !errorElement) return;

    errorElement.textContent = message;
    setAttributes(field, { 'aria-invalid': 'true' });
  }

  /**
   * Clear field error
   * @private
   * @param {string} fieldName - Field name
   */
  clearFieldError(fieldName) {
    const { field, errorElement } = this.fields.get(fieldName) || {};
    if (!field || !errorElement) return;

    errorElement.textContent = '';
    setAttributes(field, { 'aria-invalid': 'false' });
  }

  /**
   * Focus first invalid field
   * @private
   */
  focusFirstInvalid() {
    const firstInvalid = this.form.querySelector('[aria-invalid="true"]');
    if (firstInvalid) {
      firstInvalid.focus();
    }
  }

  /**
   * Reset form validation
   */
  reset() {
    this.fields.forEach((_, fieldName) => {
      this.clearFieldError(fieldName);
    });
  }

  /**
   * Get form data
   * @returns {Object} Form data
   */
  getData() {
    const data = {};
    this.fields.forEach(({ field }, fieldName) => {
      data[fieldName] = field.value.trim();
    });
    return data;
  }
}

export default FormValidator;
