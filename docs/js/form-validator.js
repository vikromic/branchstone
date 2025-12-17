/**
 * FormValidator - Form validation and submission handling
 * Handles validation, real-time feedback, honeypot, and form submission
 */

export class FormValidator {
  constructor() {
    this.forms = [];
  }

  /**
   * Initialize form validation for all forms with [data-form]
   */
  init() {
    const forms = document.querySelectorAll('[data-form]');
    forms.forEach(form => this._initializeForm(form));
  }

  /**
   * Initialize a single form
   * @private
   * @param {HTMLFormElement} form - Form element to initialize
   */
  _initializeForm(form) {
    const elements = {
      form,
      submitButton: form.querySelector('[type="submit"]'),
      successMessage: form.querySelector('[data-form-success]'),
      errorMessage: form.querySelector('[data-form-error]'),
      honeypot: form.querySelector('[data-honeypot]')
    };

    this.forms.push(elements);

    // Setup real-time validation
    this._setupRealTimeValidation(form);

    // Setup form submission
    form.addEventListener('submit', (e) => this._handleSubmit(e, elements));
  }

  /**
   * Validate email format
   * @private
   * @param {string} email - Email address to validate
   * @returns {boolean} True if valid
   */
  _isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * Show field error
   * @private
   * @param {HTMLElement} field - Form field element
   * @param {string} message - Error message
   */
  _showFieldError(field, message) {
    const errorElement = field.nextElementSibling;

    if (errorElement && errorElement.classList.contains('field-error')) {
      errorElement.textContent = message;
      errorElement.style.display = 'block';
    } else {
      const error = document.createElement('span');
      error.className = 'field-error';
      error.textContent = message;
      error.style.color = '#e74c3c';
      error.style.fontSize = '0.875rem';
      error.style.marginTop = '0.25rem';
      error.style.display = 'block';
      field.parentNode.insertBefore(error, field.nextSibling);
    }

    field.classList.add('has-error');
    field.setAttribute('aria-invalid', 'true');
  }

  /**
   * Clear field error
   * @private
   * @param {HTMLElement} field - Form field element
   */
  _clearFieldError(field) {
    const errorElement = field.nextElementSibling;

    if (errorElement && errorElement.classList.contains('field-error')) {
      errorElement.style.display = 'none';
    }

    field.classList.remove('has-error');
    field.setAttribute('aria-invalid', 'false');
  }

  /**
   * Validate form
   * @private
   * @param {HTMLFormElement} form - Form to validate
   * @param {HTMLElement} honeypot - Honeypot field
   * @returns {boolean} True if valid
   */
  _validateForm(form, honeypot) {
    let isValid = true;

    // Clear previous errors
    form.querySelectorAll('input, textarea, select').forEach(field => {
      this._clearFieldError(field);
    });

    // Check required fields
    form.querySelectorAll('[required]').forEach(field => {
      if (!field.value.trim()) {
        this._showFieldError(field, 'This field is required');
        isValid = false;
      }
    });

    // Validate email fields
    form.querySelectorAll('input[type="email"]').forEach(field => {
      if (field.value && !this._isValidEmail(field.value)) {
        this._showFieldError(field, 'Please enter a valid email address');
        isValid = false;
      }
    });

    // Honeypot check
    if (honeypot && honeypot.value) {
      isValid = false;
    }

    return isValid;
  }

  /**
   * Show success message
   * @private
   * @param {HTMLElement} successMessage - Success message element
   */
  _showSuccess(successMessage) {
    if (successMessage) {
      successMessage.style.display = 'block';
      successMessage.setAttribute('role', 'alert');
      setTimeout(() => {
        successMessage.style.display = 'none';
      }, 5000);
    }
  }

  /**
   * Show error message
   * @private
   * @param {HTMLElement} errorMessage - Error message element
   * @param {string} [message='Something went wrong. Please try again.'] - Error message text
   */
  _showError(errorMessage, message = 'Something went wrong. Please try again.') {
    if (errorMessage) {
      errorMessage.textContent = message;
      errorMessage.style.display = 'block';
      errorMessage.setAttribute('role', 'alert');
      setTimeout(() => {
        errorMessage.style.display = 'none';
      }, 5000);
    }
  }

  /**
   * Clear form
   * @private
   * @param {HTMLFormElement} form - Form to clear
   */
  _clearForm(form) {
    form.reset();
    form.querySelectorAll('input, textarea, select').forEach(field => {
      this._clearFieldError(field);
    });
  }

  /**
   * Setup real-time validation on blur and input
   * @private
   * @param {HTMLFormElement} form - Form element
   */
  _setupRealTimeValidation(form) {
    form.querySelectorAll('input, textarea, select').forEach(field => {
      // Validation on blur
      field.addEventListener('blur', () => {
        if (field.value) {
          if (field.hasAttribute('required') && !field.value.trim()) {
            this._showFieldError(field, 'This field is required');
          } else if (field.type === 'email' && !this._isValidEmail(field.value)) {
            this._showFieldError(field, 'Please enter a valid email address');
          } else {
            this._clearFieldError(field);
          }
        }
      });

      // Clear error on input
      field.addEventListener('input', () => {
        if (field.classList.contains('has-error')) {
          this._clearFieldError(field);
        }
      });
    });
  }

  /**
   * Handle form submission
   * @private
   * @param {Event} e - Submit event
   * @param {Object} elements - Form elements
   */
  async _handleSubmit(e, elements) {
    e.preventDefault();

    const { form, submitButton, successMessage, errorMessage, honeypot } = elements;

    if (!this._validateForm(form, honeypot)) {
      // Focus first error
      const firstError = form.querySelector('.has-error');
      if (firstError) firstError.focus();
      return;
    }

    // Disable submit button
    const originalButtonText = submitButton?.textContent || 'Send Message';
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Sending...';
    }

    // Collect form data
    const formData = new FormData(form);
    const formDataObj = Object.fromEntries(formData.entries());

    try {
      // Check if API endpoint exists (for production deployment)
      const apiEndpoint = form.getAttribute('action') || '/api/contact';

      // Only attempt API submission if endpoint is configured and not a placeholder
      if (apiEndpoint && apiEndpoint !== '#' && apiEndpoint !== '/api/contact') {
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formDataObj)
        });

        if (!response.ok) {
          throw new Error('Server error: ' + response.status);
        }

        this._showSuccess(successMessage);
        this._clearForm(form);
      } else {
        // No backend configured - use mailto fallback
        this._handleMailtoFallback(formDataObj, successMessage);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      this._showError(errorMessage, 'Unable to send message. Please email us directly at contact@branchstoneart.com');
    } finally {
      // Re-enable submit button
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    }
  }

  /**
   * Handle mailto fallback when no backend is configured
   * @private
   * @param {Object} formDataObj - Form data object
   * @param {HTMLElement} successMessage - Success message element
   */
  _handleMailtoFallback(formDataObj, successMessage) {
    const email = 'contact@branchstoneart.com';
    const subject = encodeURIComponent(formDataObj.subject || 'Website Contact Form');
    const name = formDataObj.name || 'A visitor';
    const userEmail = formDataObj.email || '';
    const message = formDataObj.message || '';

    const body = encodeURIComponent(
      'From: ' + name + '\nEmail: ' + userEmail + '\n\n' + message
    );

    // Open mailto link
    const mailtoLink = 'mailto:' + email + '?subject=' + subject + '&body=' + body;
    window.location.href = mailtoLink;

    // Show informative message using safe DOM methods (prevents XSS)
    if (successMessage) {
      // Clear existing content safely
      while (successMessage.firstChild) {
        successMessage.removeChild(successMessage.firstChild);
      }

      const strong = document.createElement('strong');
      strong.textContent = 'Opening your email client...';
      successMessage.appendChild(strong);

      successMessage.appendChild(document.createElement('br'));

      const fallbackText = document.createTextNode(
        'If it does not open automatically, please email us directly at contact@branchstoneart.com'
      );
      successMessage.appendChild(fallbackText);

      successMessage.style.display = 'block';
      successMessage.setAttribute('role', 'alert');
    }

    // Do not clear form immediately - user may need to copy details
    setTimeout(() => {
      if (confirm('Was the email sent successfully? Click OK to clear the form.')) {
        this._clearForm(form);
      }
    }, 2000);
  }
}
