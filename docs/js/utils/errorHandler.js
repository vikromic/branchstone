/**
 * Centralized Error Handler
 * Production-grade error handling with graceful degradation
 * @module errorHandler
 */

/**
 * Error severity levels
 */
export const ErrorLevel = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
};

/**
 * Error context for tracking
 */
class ErrorContext {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.errorCount = 0;
    this.maxErrors = 10; // Circuit breaker threshold
  }

  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  incrementErrorCount() {
    this.errorCount++;
    return this.errorCount >= this.maxErrors;
  }

  reset() {
    this.errorCount = 0;
  }
}

const errorContext = new ErrorContext();

/**
 * Error handler configuration
 */
const config = {
  enableLogging: true,
  enableUI: true,
  logToConsole: true,
  timeout: 5000, // UI error message timeout
};

/**
 * Log error to console with structured format
 * @private
 */
function logError(error, context = {}) {
  if (!config.logToConsole) {
    return;
  }

  const errorData = {
    timestamp: new Date().toISOString(),
    sessionId: errorContext.sessionId,
    message: error.message || String(error),
    stack: error.stack,
    level: context.level || ErrorLevel.ERROR,
    component: context.component,
    action: context.action,
    metadata: context.metadata,
  };

  // Use appropriate console method based on level
  switch (context.level) {
    case ErrorLevel.INFO:
      console.info('[ErrorHandler]', errorData);
      break;
    case ErrorLevel.WARNING:
      console.warn('[ErrorHandler]', errorData);
      break;
    case ErrorLevel.CRITICAL:
      console.error('[ErrorHandler] CRITICAL:', errorData);
      break;
    default:
      console.error('[ErrorHandler]', errorData);
  }
}

/**
 * Display user-friendly error UI
 * @private
 */
function showErrorUI(message, options = {}) {
  if (!config.enableUI) {
    return;
  }

  // Remove any existing error messages
  const existingError = document.getElementById('app-error-notification');
  if (existingError) {
    existingError.remove();
  }

  const errorDiv = document.createElement('div');
  errorDiv.id = 'app-error-notification';
  errorDiv.setAttribute('role', 'alert');
  errorDiv.setAttribute('aria-live', 'assertive');
  errorDiv.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    max-width: 400px;
    background: ${options.level === ErrorLevel.WARNING ? '#fff3cd' : '#f8d7da'};
    color: ${options.level === ErrorLevel.WARNING ? '#856404' : '#721c24'};
    border: 1px solid ${options.level === ErrorLevel.WARNING ? '#ffeaa7' : '#f5c6cb'};
    border-radius: 8px;
    padding: 1rem 1.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 10000;
    font-family: 'Inter', sans-serif;
    font-size: 0.875rem;
    line-height: 1.5;
    animation: slideIn 0.3s ease-out;
  `;

  errorDiv.innerHTML = `
    <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink: 0; margin-top: 2px;">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <div style="flex: 1;">
        <strong style="display: block; margin-bottom: 0.25rem;">
          ${options.level === ErrorLevel.WARNING ? 'Warning' : 'Error'}
        </strong>
        <p style="margin: 0;">${message}</p>
        ${options.recoverable ? '<p style="margin: 0.5rem 0 0; font-size: 0.8rem; opacity: 0.9;">The page will continue to function with limited features.</p>' : ''}
      </div>
      <button
        onclick="this.parentElement.parentElement.remove()"
        aria-label="Close notification"
        style="background: transparent; border: none; cursor: pointer; padding: 0; color: inherit; opacity: 0.7; transition: opacity 0.2s;"
        onmouseover="this.style.opacity='1'"
        onmouseout="this.style.opacity='0.7'">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  `;

  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(errorDiv);

  // Auto-remove after timeout
  if (config.timeout > 0) {
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => errorDiv.remove(), 300);
      }
    }, config.timeout);
  }
}

/**
 * Handle error with graceful degradation
 * @param {Error|string} error - Error object or message
 * @param {Object} context - Error context
 * @param {string} context.component - Component name where error occurred
 * @param {string} context.action - Action being performed
 * @param {string} context.level - Error severity level
 * @param {boolean} context.showUI - Whether to show UI notification
 * @param {boolean} context.recoverable - Whether the app can continue
 * @param {Object} context.metadata - Additional metadata
 * @returns {void}
 */
export function handleError(error, context = {}) {
  // Convert string to Error object
  const errorObj = error instanceof Error ? error : new Error(String(error));

  // Log error
  if (config.enableLogging) {
    logError(errorObj, context);
  }

  // Check circuit breaker
  const shouldBreak = errorContext.incrementErrorCount();
  if (shouldBreak) {
    console.error('[ErrorHandler] Circuit breaker triggered: Too many errors in session');
    showErrorUI('Multiple errors detected. Please refresh the page.', {
      level: ErrorLevel.CRITICAL,
      recoverable: false,
    });
    return;
  }

  // Show UI notification for user-facing errors
  if (context.showUI !== false) {
    const message = context.userMessage || 'An unexpected error occurred.';
    showErrorUI(message, {
      level: context.level || ErrorLevel.ERROR,
      recoverable: context.recoverable !== false,
    });
  }
}

/**
 * Wrap async function with error boundary
 * @param {Function} fn - Async function to wrap
 * @param {Object} context - Error context
 * @returns {Function} Wrapped function
 */
export function withErrorBoundary(fn, context = {}) {
  return async function (...args) {
    try {
      return await fn.apply(this, args);
    } catch (error) {
      handleError(error, {
        component: context.component || 'Unknown',
        action: context.action || fn.name || 'Unknown action',
        level: context.level || ErrorLevel.ERROR,
        showUI: context.showUI !== false,
        recoverable: context.recoverable !== false,
        userMessage: context.userMessage,
        metadata: { args: context.includeArgs ? args : undefined },
      });

      // Return fallback value if provided
      if (context.fallback !== undefined) {
        return context.fallback;
      }

      // Re-throw if not recoverable
      if (context.recoverable === false) {
        throw error;
      }
    }
  };
}

/**
 * Wrap synchronous function with error boundary
 * @param {Function} fn - Function to wrap
 * @param {Object} context - Error context
 * @returns {Function} Wrapped function
 */
export function withSyncErrorBoundary(fn, context = {}) {
  return function (...args) {
    try {
      return fn.apply(this, args);
    } catch (error) {
      handleError(error, {
        component: context.component || 'Unknown',
        action: context.action || fn.name || 'Unknown action',
        level: context.level || ErrorLevel.ERROR,
        showUI: context.showUI !== false,
        recoverable: context.recoverable !== false,
        userMessage: context.userMessage,
        metadata: { args: context.includeArgs ? args : undefined },
      });

      // Return fallback value if provided
      if (context.fallback !== undefined) {
        return context.fallback;
      }

      // Re-throw if not recoverable
      if (context.recoverable === false) {
        throw error;
      }
    }
  };
}

/**
 * Global error handler for unhandled errors
 */
export function initGlobalErrorHandler() {
  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    handleError(event.reason, {
      component: 'Global',
      action: 'Unhandled Promise Rejection',
      level: ErrorLevel.ERROR,
      showUI: true,
      recoverable: true,
      userMessage: 'An unexpected error occurred. The page will continue to function.',
    });
  });

  // Global error handler
  window.addEventListener('error', (event) => {
    // Ignore script loading errors (already handled by modules)
    if (event.message.includes('Script error')) {
      return;
    }

    handleError(event.error || event.message, {
      component: 'Global',
      action: 'Uncaught Error',
      level: ErrorLevel.ERROR,
      showUI: true,
      recoverable: true,
      userMessage: 'An unexpected error occurred. The page will continue to function.',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  console.info('[ErrorHandler] Global error handlers initialized');
}

/**
 * Configure error handler
 * @param {Object} options - Configuration options
 */
export function configure(options) {
  Object.assign(config, options);
}

/**
 * Reset error context (useful for testing)
 */
export function resetContext() {
  errorContext.reset();
}

export default {
  handleError,
  withErrorBoundary,
  withSyncErrorBoundary,
  initGlobalErrorHandler,
  configure,
  resetContext,
  ErrorLevel,
};
