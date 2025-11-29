/**
 * Animations Module
 * Handles scroll animations, parallax effects, and intersection observers
 * @module components/Animations
 */

import { $$, requestFrame } from '../utils/dom.js';
import CONFIG from '../config.js';

export class AnimationManager {
  constructor() {
    this.observers = new Map();
    this.rafId = null;
    this.ticking = false;
    this.scrollHandler = null;

    this.init();
  }

  /**
   * Initialize animations
   * @private
   */
  init() {
    this.initScrollAnimations();

    if (CONFIG.features.parallaxEnabled && window.innerWidth > CONFIG.ui.breakpoints.mobile) {
      this.initParallax();
    }
  }

  /**
   * Initialize scroll-triggered animations
   * @private
   */
  initScrollAnimations() {
    const elements = $$('.animate-on-scroll');
    if (elements.length === 0) return;

    const viewportHeight = window.innerHeight;

    // Only animate elements that are BELOW the initial viewport
    // Elements in viewport on load stay visible immediately (no animation delay)
    const elementsToAnimate = [];

    elements.forEach(element => {
      const rect = element.getBoundingClientRect();
      // Element is below viewport - mark for deferred animation
      if (rect.top > viewportHeight) {
        element.classList.add('animate-deferred');
        elementsToAnimate.push(element);
      }
      // Elements in viewport stay visible (no class added = instant visible via CSS)
    });

    if (elementsToAnimate.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            requestAnimationFrame(() => {
              entry.target.classList.add('is-visible');
            });
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );

    elementsToAnimate.forEach(element => observer.observe(element));
    this.observers.set('scroll', observer);
  }

  /**
   * Initialize parallax effects for featured items and about image
   * @private
   */
  initParallax() {
    const elements = [
      { selector: '.featured-item', speed: CONFIG.ui.parallax.speeds.featuredItem },
      { selector: '.home-about-image', speed: CONFIG.ui.parallax.speeds.aboutImage },
    ];

    const updateParallax = () => {
      const scrolled = window.pageYOffset;
      const viewportHeight = window.innerHeight;

      elements.forEach(({ selector, speed }) => {
        $$(selector).forEach(el => {
          const rect = el.getBoundingClientRect();

          // Only apply parallax when element is in viewport
          if (rect.top < viewportHeight && rect.bottom > 0) {
            const elementTop = rect.top + scrolled;
            const distance = scrolled - elementTop + viewportHeight;
            el.style.transform = `translateY(${distance * speed}px)`;
          }
        });
      });

      this.ticking = false;
    };

    this.scrollHandler = () => {
      if (!this.ticking) {
        this.rafId = requestFrame(updateParallax);
        this.ticking = true;
      }
    };

    window.addEventListener('scroll', this.scrollHandler, { passive: true });
    updateParallax(); // Initial call
  }

  /**
   * Refresh animations (call after dynamic content load)
   * Only animates elements below current viewport
   */
  refresh() {
    const observer = this.observers.get('scroll');
    const viewportHeight = window.innerHeight;

    // Find new elements not yet processed
    const elements = $$('.animate-on-scroll:not(.is-visible):not(.animate-deferred)');

    elements.forEach(element => {
      const rect = element.getBoundingClientRect();
      // Only animate elements below viewport
      if (rect.top > viewportHeight) {
        element.classList.add('animate-deferred');
        if (observer) {
          observer.observe(element);
        }
      }
      // Elements in viewport stay visible immediately
    });
  }

  /**
   * Destroy all animations and observers
   */
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler);
      this.scrollHandler = null;
    }
  }
}

export default AnimationManager;
