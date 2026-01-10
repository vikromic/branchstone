/**
 * SwipeHandler - Unified touch/swipe gesture handler
 * Eliminates code duplication across carousel and modal components
 *
 * Features:
 * - Horizontal and vertical swipe detection
 * - Configurable thresholds
 * - Callback-based event system
 * - Prevents default behavior for horizontal swipes
 */

import { SWIPE } from './constants.js';

export class SwipeHandler {
  /**
   * Create a new SwipeHandler instance
   * @param {HTMLElement} element - Element to attach swipe listeners to
   * @param {Object} callbacks - Event callbacks
   * @param {Function} callbacks.onSwipeLeft - Called when user swipes left
   * @param {Function} callbacks.onSwipeRight - Called when user swipes right
   * @param {Function} callbacks.onSwipeUp - Called when user swipes up (optional)
   * @param {Function} callbacks.onSwipeDown - Called when user swipes down (optional)
   * @param {Object} options - Configuration options
   * @param {number} options.horizontalThreshold - Minimum horizontal swipe distance (default: 50)
   * @param {number} options.verticalThreshold - Minimum vertical swipe distance (default: 100)
   * @param {boolean} options.preventDefaultOnHorizontal - Prevent default for horizontal swipes (default: true)
   */
  constructor(element, callbacks = {}, options = {}) {
    this.element = element;
    this.callbacks = callbacks;

    // Configuration
    this.horizontalThreshold = options.horizontalThreshold || SWIPE.HORIZONTAL_THRESHOLD;
    this.verticalThreshold = options.verticalThreshold || SWIPE.VERTICAL_THRESHOLD;
    this.preventDefaultOnHorizontal = options.preventDefaultOnHorizontal !== false;

    // Touch tracking
    this.touchStart = { x: 0, y: 0 };
    this.touchEnd = { x: 0, y: 0 };

    // Bind methods
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);

    // Attach listeners
    this.attach();
  }

  /**
   * Attach touch event listeners to element
   */
  attach() {
    if (!this.element) return;

    this.element.addEventListener('touchstart', this.handleTouchStart, { passive: true });
    this.element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd, { passive: true });
  }

  /**
   * Detach touch event listeners from element
   */
  detach() {
    if (!this.element) return;

    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
  }

  /**
   * Handle touch start event
   * @param {TouchEvent} e - Touch event
   */
  handleTouchStart(e) {
    this.touchStart.x = e.changedTouches[0].screenX;
    this.touchStart.y = e.changedTouches[0].screenY;
  }

  /**
   * Handle touch move event
   * @param {TouchEvent} e - Touch event
   */
  handleTouchMove(e) {
    if (!this.preventDefaultOnHorizontal) return;

    const deltaX = Math.abs(e.changedTouches[0].screenX - this.touchStart.x);
    const deltaY = Math.abs(e.changedTouches[0].screenY - this.touchStart.y);

    // Only prevent default if horizontal swipe is more pronounced than vertical
    // This allows vertical scrolling while enabling horizontal swipes
    if (deltaX > deltaY) {
      e.preventDefault();
    }
  }

  /**
   * Handle touch end event
   * @param {TouchEvent} e - Touch event
   */
  handleTouchEnd(e) {
    this.touchEnd.x = e.changedTouches[0].screenX;
    this.touchEnd.y = e.changedTouches[0].screenY;
    this.detectSwipe();
  }

  /**
   * Detect swipe direction and trigger appropriate callback
   * @private
   */
  detectSwipe() {
    const deltaX = this.touchEnd.x - this.touchStart.x;
    const deltaY = this.touchEnd.y - this.touchStart.y;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine if horizontal or vertical swipe is more pronounced
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (absDeltaX > this.horizontalThreshold) {
        if (deltaX > 0) {
          // Swipe right
          this.callbacks.onSwipeRight?.();
        } else {
          // Swipe left
          this.callbacks.onSwipeLeft?.();
        }
      }
    } else {
      // Vertical swipe
      if (absDeltaY > this.verticalThreshold) {
        if (deltaY > 0) {
          // Swipe down
          this.callbacks.onSwipeDown?.();
        } else {
          // Swipe up
          this.callbacks.onSwipeUp?.();
        }
      }
    }
  }

  /**
   * Update callbacks
   * @param {Object} newCallbacks - New callback functions
   */
  updateCallbacks(newCallbacks) {
    this.callbacks = { ...this.callbacks, ...newCallbacks };
  }

  /**
   * Update configuration options
   * @param {Object} newOptions - New configuration options
   */
  updateOptions(newOptions) {
    if (newOptions.horizontalThreshold !== undefined) {
      this.horizontalThreshold = newOptions.horizontalThreshold;
    }
    if (newOptions.verticalThreshold !== undefined) {
      this.verticalThreshold = newOptions.verticalThreshold;
    }
    if (newOptions.preventDefaultOnHorizontal !== undefined) {
      this.preventDefaultOnHorizontal = newOptions.preventDefaultOnHorizontal;
    }
  }

  /**
   * Cleanup and remove event listeners
   */
  destroy() {
    this.detach();
    this.element = null;
    this.callbacks = {};
  }
}

export default SwipeHandler;
