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

    if (!this.form) {
      return;
    }

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
    Object.keys(this.rules).forEach((fieldName) => {
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
    on(this.form, 'submit', async (e) => {
      e.preventDefault();

      if (!this.validateAll()) {
        this.focusFirstInvalid();
        this.announceErrors();
        return;
      }

      await this.handleFormSubmission();
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
    if (!field || !errorElement) {
      return true;
    }

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
    if (!field || !errorElement) {
      return;
    }

    errorElement.textContent = message;
    setAttributes(field, { 'aria-invalid': 'true' });

    // Add visual error class for enhanced feedback
    field.classList.add('field-error');

    // Add shake animation for immediate visual feedback
    field.classList.add('field-shake');
    setTimeout(() => field.classList.remove('field-shake'), 500);
  }

  /**
   * Clear field error
   * @private
   * @param {string} fieldName - Field name
   */
  clearFieldError(fieldName) {
    const { field, errorElement } = this.fields.get(fieldName) || {};
    if (!field || !errorElement) {
      return;
    }

    errorElement.textContent = '';
    setAttributes(field, { 'aria-invalid': 'false' });
    field.classList.remove('field-error');
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

  /**
   * Handle form submission with loading state
   * @private
   */
  async handleFormSubmission() {
    const submitBtn = this.form.querySelector('button[type="submit"]');

    if (!submitBtn) {
      return;
    }

    // Store original button text
    const originalText = submitBtn.textContent;

    try {
      // Set loading state
      this.setLoadingState(true, submitBtn, originalText);

      // Submit form
      const formData = new FormData(this.form);
      const response = await fetch(this.form.action, {
        method: this.form.method,
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        this.showFormMessage(
          'success',
          'Thank you! Your message has been sent successfully. I will respond within 24 hours.',
        );
        this.form.reset();
        this.reset();
        this.announceSuccess();
      } else {
        throw new Error('Form submission failed');
      }
    } catch (error) {
      this.showFormMessage(
        'error',
        'Sorry, there was an error sending your message. Please try emailing directly at thebranchstone@gmail.com',
      );
      this.announceError();
    } finally {
      // Remove loading state
      this.setLoadingState(false, submitBtn, originalText);
    }
  }

  /**
   * Set loading state on submit button
   * @private
   * @param {boolean} isLoading - Loading state
   * @param {Element} submitBtn - Submit button element
   * @param {string} originalText - Original button text
   */
  setLoadingState(isLoading, submitBtn, originalText) {
    if (isLoading) {
      submitBtn.disabled = true;
      submitBtn.classList.add('btn-loading');
      submitBtn.setAttribute('aria-busy', 'true');
      submitBtn.innerHTML = `
        <span class="loading-spinner" aria-hidden="true"></span>
        <span>Sending...</span>
      `;
    } else {
      submitBtn.disabled = false;
      submitBtn.classList.remove('btn-loading');
      submitBtn.setAttribute('aria-busy', 'false');
      submitBtn.textContent = originalText;
    }
  }

  /**
   * Show form success/error message
   * @private
   * @param {string} type - Message type ('success' or 'error')
   * @param {string} message - Message text
   */
  showFormMessage(type, message) {
    const formMessage = document.getElementById('form-message');
    if (!formMessage) {
      return;
    }

    formMessage.className = `form-message ${type} show`;
    formMessage.textContent = message;

    // Auto-hide success message after 5 seconds
    if (type === 'success') {
      setTimeout(() => {
        formMessage.classList.remove('show');
      }, 5000);
    }
  }

  /**
   * Announce validation errors to screen readers
   * @private
   */
  announceErrors() {
    const errorCount = this.form.querySelectorAll('[aria-invalid="true"]').length;
    const announcement = `Form validation failed. ${errorCount} ${errorCount === 1 ? 'field has' : 'fields have'} errors. Please correct them and try again.`;
    this.announce(announcement);
  }

  /**
   * Announce success to screen readers
   * @private
   */
  announceSuccess() {
    this.announce('Form submitted successfully. Thank you for your message.');
  }

  /**
   * Announce error to screen readers
   * @private
   */
  announceError() {
    this.announce('Form submission failed. Please try again or contact us directly via email.');
  }

  /**
   * Announce message to screen readers
   * @private
   * @param {string} text - Message to announce
   */
  announce(text) {
    // Use existing form-message for announcements
    const formMessage = document.getElementById('form-message');
    if (formMessage) {
      formMessage.setAttribute('role', 'status');
      formMessage.setAttribute('aria-live', 'polite');
      formMessage.setAttribute('aria-atomic', 'true');
      formMessage.textContent = text;
    }
  }
}

export default FormValidator;
