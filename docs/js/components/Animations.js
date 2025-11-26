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

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            // Performance hint
            entry.target.style.willChange = 'transform, opacity, filter';

            // Staggered animation
            setTimeout(() => {
              entry.target.classList.add('is-visible');

              // Remove will-change after animation
              setTimeout(() => {
                entry.target.style.willChange = 'auto';
              }, 1000);
            }, index * 100);

            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: CONFIG.ui.gallery.observerThreshold,
        rootMargin: CONFIG.ui.gallery.observerRootMargin,
      }
    );

    elements.forEach(element => observer.observe(element));
    this.observers.set('scroll', observer);
  }

  /**
   * Initialize parallax effects
   * @private
   */
  initParallax() {
    const elements = [
      { selector: '.hero-bg-image', speed: CONFIG.ui.parallax.speeds.heroImage },
      { selector: '.featured-item', speed: CONFIG.ui.parallax.speeds.featuredItem },
      { selector: '.home-about-image', speed: CONFIG.ui.parallax.speeds.aboutImage },
      { selector: '.gallery-item', speed: CONFIG.ui.parallax.speeds.galleryItem },
    ];

    const updateParallax = () => {
      const scrolled = window.pageYOffset;

      elements.forEach(item => {
        const targets = $$(item.selector);
        targets.forEach((el, index) => {
          const rect = el.getBoundingClientRect();
          const elementTop = rect.top + scrolled;
          const viewportHeight = window.innerHeight;

          // Only apply parallax when element is in viewport
          if (rect.top < viewportHeight && rect.bottom > 0) {
            const distance = scrolled - elementTop + viewportHeight;
            const movement = distance * item.speed;

            // Add slight variation for gallery items
            const variation = item.selector === '.gallery-item' ? (index % 3 - 1) * 0.05 : 0;
            const finalMovement = movement + (movement * variation);

            el.style.transform = `translateY(${finalMovement}px)`;
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
   */
  refresh() {
    // Re-observe new elements
    const observer = this.observers.get('scroll');
    if (observer) {
      const elements = $$('.animate-on-scroll:not(.is-visible)');
      elements.forEach(element => observer.observe(element));
    }
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
