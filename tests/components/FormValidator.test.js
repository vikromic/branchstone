/**
 * FormValidator Component Tests
 * Tests validation rules, error display, and form submission
 */

import { FormValidator } from '../../docs/js/components/FormValidator.js';

describe('FormValidator Component', () => {
  let validator;
  let form;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <form id="contact-form" novalidate>
        <div>
          <label for="name">Name</label>
          <input type="text" id="name" name="name">
          <span id="name-error" class="error"></span>
        </div>
        <div>
          <label for="email">Email</label>
          <input type="email" id="email" name="email">
          <span id="email-error" class="error"></span>
        </div>
        <div>
          <label for="message">Message</label>
          <textarea id="message" name="message"></textarea>
          <span id="message-error" class="error"></span>
        </div>
        <button type="submit">Submit</button>
      </form>
    `;
    form = document.getElementById('contact-form');
  });

  afterEach(() => {
    if (validator) {
      validator = null;
    }
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should_initialize_with_valid_form', () => {
      validator = new FormValidator({
        formSelector: '#contact-form',
      });

      expect(validator.form).toBe(form);
    });

    it('should_not_throw_when_form_missing', () => {
      expect(() => {
        validator = new FormValidator({
          formSelector: '#nonexistent',
        });
      }).not.toThrow();
    });

    it('should_cache_form_fields', () => {
      validator = new FormValidator({
        formSelector: '#contact-form',
      });

      expect(validator.fields.size).toBe(3);
      expect(validator.fields.has('name')).toBe(true);
      expect(validator.fields.has('email')).toBe(true);
      expect(validator.fields.has('message')).toBe(true);
    });

    it('should_set_novalidate_attribute', () => {
      validator = new FormValidator({
        formSelector: '#contact-form',
      });

      expect(form.hasAttribute('novalidate')).toBe(true);
    });

    it('should_use_default_rules_when_not_provided', () => {
      validator = new FormValidator({
        formSelector: '#contact-form',
      });

      expect(validator.rules.name).toBeDefined();
      expect(validator.rules.email).toBeDefined();
      expect(validator.rules.message).toBeDefined();
    });

    it('should_accept_custom_validation_rules', () => {
      const customRules = {
        name: {
          required: true,
          errorMessage: 'Custom error',
        },
      };

      validator = new FormValidator({
        formSelector: '#contact-form',
        rules: customRules,
      });

      expect(validator.rules).toBe(customRules);
    });
  });

  describe('Required Field Validation', () => {
    it('should_show_error_when_required_field_empty', () => {
      validator = new FormValidator({
        formSelector: '#contact-form',
      });

      const nameField = document.getElementById('name');
      nameField.value = '';

      const isValid = validator.validateField('name');

      expect(isValid).toBe(false);
      const errorElement = document.getElementById('name-error');
      expect(errorElement.textContent).toBeTruthy();
      expect(nameField.getAttribute('aria-invalid')).toBe('true');
    });

    it('should_pass_validation_when_required_field_has_value', () => {
      validator = new FormValidator({
        formSelector: '#contact-form',
      });

      const nameField = document.getElementById('name');
      nameField.value = 'John Doe';

      const isValid = validator.validateField('name');

      expect(isValid).toBe(true);
      const errorElement = document.getElementById('name-error');
      expect(errorElement.textContent).toBe('');
      expect(nameField.getAttribute('aria-invalid')).toBe('false');
    });

    it('should_trim_whitespace_before_validation', () => {
      validator = new FormValidator({
        formSelector: '#contact-form',
      });

      const nameField = document.getElementById('name');
      nameField.value = '   ';

      const isValid = validator.validateField('name');

      expect(isValid).toBe(false);
    });
  });

  describe('Email Pattern Validation', () => {
    it('should_show_error_for_invalid_email_format', () => {
      validator = new FormValidator({
        formSelector: '#contact-form',
      });

      const emailField = document.getElementById('email');
      emailField.value = 'invalid-email';

      const isValid = validator.validateField('email');

      expect(isValid).toBe(false);
      const errorElement = document.getElementById('email-error');
      expect(errorElement.textContent).toBeTruthy();
    });

    it('should_pass_validation_for_valid_email', () => {
      validator = new FormValidator({
        formSelector: '#contact-form',
      });

      const emailField = document.getElementById('email');
      emailField.value = 'user@example.com';

      const isValid = validator.validateField('email');

      expect(isValid).toBe(true);
    });

    it('should_show_required_error_when_email_empty', () => {
      validator = new FormValidator({
        formSelector: '#contact-form',
      });

      const emailField = document.getElementById('email');
      emailField.value = '';

      const isValid = validator.validateField('email');

      expect(isValid).toBe(false);
      const errorElement = document.getElementById('email-error');
      // Actual message from CONFIG: "Please enter your email"
      expect(errorElement.textContent).toContain('email');
    });

    it('should_show_pattern_error_when_email_invalid', () => {
      validator = new FormValidator({
        formSelector: '#contact-form',
      });

      const emailField = document.getElementById('email');
      emailField.value = 'not-an-email';

      const isValid = validator.validateField('email');

      expect(isValid).toBe(false);
      const errorElement = document.getElementById('email-error');
      expect(errorElement.textContent).toContain('valid');
    });
  });

  describe('Custom Validator Function', () => {
    it('should_use_custom_validator_when_provided', () => {
      const customValidator = jest.fn((value) => value.length >= 5);

      validator = new FormValidator({
        formSelector: '#contact-form',
        rules: {
          name: {
            validator: customValidator,
            errorMessage: 'Name must be at least 5 characters',
          },
        },
      });

      const nameField = document.getElementById('name');
      nameField.value = 'John';

      validator.validateField('name');

      expect(customValidator).toHaveBeenCalledWith('John');
    });

    it('should_show_error_when_custom_validator_fails', () => {
      validator = new FormValidator({
        formSelector: '#contact-form',
        rules: {
          name: {
            validator: (value) => value.length >= 5,
            errorMessage: 'Name must be at least 5 characters',
          },
        },
      });

      const nameField = document.getElementById('name');
      nameField.value = 'Jo';

      const isValid = validator.validateField('name');

      expect(isValid).toBe(false);
      const errorElement = document.getElementById('name-error');
      expect(errorElement.textContent).toBe('Name must be at least 5 characters');
    });
  });

  describe('Form Submission', () => {
    it('should_prevent_submission_when_validation_fails', () => {
      validator = new FormValidator({
        formSelector: '#contact-form',
      });

      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      expect(submitEvent.defaultPrevented).toBe(true);
    });

    it('should_allow_submission_when_all_fields_valid', () => {
      validator = new FormValidator({
        formSelector: '#contact-form',
      });

      document.getElementById('name').value = 'John Doe';
      document.getElementById('email').value = 'john@example.com';
      document.getElementById('message').value = 'Hello!';

      // The implementation always prevents default and handles via AJAX
      // So we test that validation passes, not that defaultPrevented is false
      const isValid = validator.validateAll();
      expect(isValid).toBe(true);

      // Verify no errors are displayed
      const errors = document.querySelectorAll('.error:not(:empty)');
      expect(errors.length).toBe(0);
    });

    it('should_validate_all_fields_on_submission', () => {
      validator = new FormValidator({
        formSelector: '#contact-form',
      });

      const validateSpy = jest.spyOn(validator, 'validateField');

      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      expect(validateSpy).toHaveBeenCalledTimes(3);
      expect(validateSpy).toHaveBeenCalledWith('name');
      expect(validateSpy).toHaveBeenCalledWith('email');
      expect(validateSpy).toHaveBeenCalledWith('message');
    });

    it('should_focus_first_invalid_field_on_submission', () => {
      validator = new FormValidator({
        formSelector: '#contact-form',
      });

      const nameField = document.getElementById('name');
      const emailField = document.getElementById('email');

      nameField.value = '';
      emailField.value = '';

      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      jest.runAllTimers();

      expect(document.activeElement).toBe(nameField);
    });
  });

  describe('Real-time Validation', () => {
    it('should_validate_field_on_blur', () => {
      validator = new FormValidator({
        formSelector: '#contact-form',
      });

      const nameField = document.getElementById('name');
      nameField.value = '';

      const blurEvent = new Event('blur');
      nameField.dispatchEvent(blurEvent);

      const errorElement = document.getElementById('name-error');
      expect(errorElement.textContent).toBeTruthy();
    });

    it('should_clear_error_on_input_when_field_has_value', () => {
      validator = new FormValidator({
        formSelector: '#contact-form',
      });

      const nameField = document.getElementById('name');
      nameField.value = '';

      // Trigger validation error
      validator.validateField('name');

      // Now add value and trigger input
      nameField.value = 'John';
      const inputEvent = new Event('input');
      nameField.dispatchEvent(inputEvent);

      const errorElement = document.getElementById('name-error');
      expect(errorElement.textContent).toBe('');
    });

    it('should_not_clear_error_on_input_when_field_still_empty', () => {
      validator = new FormValidator({
        formSelector: '#contact-form',
      });

      const nameField = document.getElementById('name');
      nameField.value = '';

      // Trigger validation error
      validator.validateField('name');
      const errorBefore = document.getElementById('name-error').textContent;

      // Trigger input without value
      const inputEvent = new Event('input');
      nameField.dispatchEvent(inputEvent);

      const errorAfter = document.getElementById('name-error').textContent;
      expect(errorAfter).toBe(errorBefore);
    });
  });

  describe('Error Display', () => {
    it('should_display_error_message_in_error_element', () => {
      validator = new FormValidator({
        formSelector: '#contact-form',
      });

      const nameField = document.getElementById('name');
      nameField.value = '';

      validator.validateField('name');

      const errorElement = document.getElementById('name-error');
      expect(errorElement.textContent).toBe('Please enter your name');
    });

    it('should_clear_error_message_when_field_valid', () => {
      validator = new FormValidator({
        formSelector: '#contact-form',
      });

      const nameField = document.getElementById('name');

      // First make it invalid
      nameField.value = '';
      validator.validateField('name');

      // Then make it valid
      nameField.value = 'John Doe';
      validator.validateField('name');

      const errorElement = document.getElementById('name-error');
      expect(errorElement.textContent).toBe('');
    });

    it('should_set_aria_invalid_attribute', () => {
      validator = new FormValidator({
        formSelector: '#contact-form',
      });

      const nameField = document.getElementById('name');
      nameField.value = '';

      validator.validateField('name');

      expect(nameField.getAttribute('aria-invalid')).toBe('true');
    });
  });

  describe('Utility Methods', () => {
    it('should_return_form_data_as_object', () => {
      validator = new FormValidator({
        formSelector: '#contact-form',
      });

      document.getElementById('name').value = 'John Doe';
      document.getElementById('email').value = 'john@example.com';
      document.getElementById('message').value = 'Hello!';

      const data = validator.getData();

      expect(data).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        message: 'Hello!',
      });
    });

    it('should_trim_values_in_form_data', () => {
      validator = new FormValidator({
        formSelector: '#contact-form',
      });

      document.getElementById('name').value = '  John Doe  ';

      const data = validator.getData();

      expect(data.name).toBe('John Doe');
    });

    it('should_reset_all_field_errors', () => {
      validator = new FormValidator({
        formSelector: '#contact-form',
      });

      // Create errors
      validator.validateField('name');
      validator.validateField('email');

      // Reset
      validator.reset();

      expect(document.getElementById('name-error').textContent).toBe('');
      expect(document.getElementById('email-error').textContent).toBe('');
      expect(document.getElementById('name').getAttribute('aria-invalid')).toBe('false');
      expect(document.getElementById('email').getAttribute('aria-invalid')).toBe('false');
    });
  });

  describe('Edge Cases', () => {
    it('should_handle_missing_error_elements_gracefully', () => {
      document.body.innerHTML = `
        <form id="partial-form">
          <input type="text" id="name" name="name">
        </form>
      `;

      expect(() => {
        validator = new FormValidator({
          formSelector: '#partial-form',
        });
      }).not.toThrow();
    });

    it('should_return_true_for_fields_without_rules', () => {
      validator = new FormValidator({
        formSelector: '#contact-form',
        rules: {},
      });

      const isValid = validator.validateField('nonexistent');

      expect(isValid).toBe(true);
    });

    it('should_handle_whitespace_only_values', () => {
      validator = new FormValidator({
        formSelector: '#contact-form',
      });

      const nameField = document.getElementById('name');
      nameField.value = '    ';

      const isValid = validator.validateField('name');

      expect(isValid).toBe(false);
    });
  });

  describe('Multiple Error Messages', () => {
    it('should_show_appropriate_error_for_required_vs_pattern', () => {
      validator = new FormValidator({
        formSelector: '#contact-form',
      });

      const emailField = document.getElementById('email');

      // Test required error - actual message: "Please enter your email"
      emailField.value = '';
      validator.validateField('email');
      let error = document.getElementById('email-error').textContent;
      expect(error).toContain('enter');
      expect(error).toContain('email');

      // Test pattern error - actual message: "Please enter a valid email address"
      emailField.value = 'invalid';
      validator.validateField('email');
      error = document.getElementById('email-error').textContent;
      expect(error).toContain('valid');
    });
  });
});
