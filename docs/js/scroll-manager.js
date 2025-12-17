/**
 * ScrollManager - Consolidated scroll handling
 * Manages scroll-based animations, header behavior, and parallax effects
 */

import { SCROLL, ANIMATION } from './constants.js';
import { prefersReducedMotion } from './utils.js';

export class ScrollManager {
  constructor() {
    this.observers = [];
    this.scrollHandlers = [];
  }

  /**
   * Initialize all scroll-based features
   */
  init() {
    this.initScrollAnimations();
    this.initArtworkScrollAnimations();
    this.initHeaderScroll();
    this.initHeroParallax();
  }

  /**
   * Initialize general scroll animations for elements with [data-animate]
   */
  initScrollAnimations() {
    if (prefersReducedMotion()) return;

    const animatedElements = document.querySelectorAll('[data-animate]');
    if (animatedElements.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -100px 0px',
      threshold: 0.1
    };

    const handleIntersection = (entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Stagger animations for lists
          const delay = entry.target.hasAttribute('data-animate-stagger')
            ? index * ANIMATION.STAGGER_DELAY
            : 0;

          setTimeout(() => {
            entry.target.classList.add('is-animated');
          }, delay);

          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    animatedElements.forEach(element => {
      observer.observe(element);
    });

    this.observers.push(observer);
  }

  /**
   * Initialize artwork card scroll animations
   */
  initArtworkScrollAnimations() {
    if (prefersReducedMotion()) return;

    const artworkCards = document.querySelectorAll('.artwork-card');
    if (artworkCards.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -10px 0px',
      threshold: 0.1
    };

    const handleIntersection = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    artworkCards.forEach(card => {
      observer.observe(card);
    });

    this.observers.push(observer);
  }

  /**
   * Initialize header scroll behavior (shadow and hide-on-scroll)
   */
  initHeaderScroll() {
    const header = document.querySelector('[data-header]') || document.querySelector('.header');
    if (!header) return;

    let lastScrollY = window.pageYOffset;
    let ticking = false;

    const handleScroll = () => {
      const currentScrollY = window.pageYOffset;
      const scrolled = currentScrollY > SCROLL.THRESHOLD;

      // Add/remove scrolled state (for shadow effect)
      if (scrolled) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }

      // Hide-on-scroll behavior (mobile only)
      // Only activate after scrolling past the threshold to avoid hiding at page top
      if (currentScrollY > SCROLL.THRESHOLD) {
        if (currentScrollY > lastScrollY && currentScrollY > SCROLL.HEADER_HIDE_THRESHOLD) {
          // Scrolling down - hide header
          header.classList.add('header--hidden');
        } else if (currentScrollY < lastScrollY) {
          // Scrolling up - show header
          header.classList.remove('header--hidden');
        }
      } else {
        // At top of page - always show header
        header.classList.remove('header--hidden');
      }

      lastScrollY = currentScrollY;
      ticking = false;
    };

    const requestScrollUpdate = () => {
      if (!ticking) {
        window.requestAnimationFrame(handleScroll);
        ticking = true;
      }
    };

    window.addEventListener('scroll', requestScrollUpdate, { passive: true });

    // Initial check
    handleScroll();

    this.scrollHandlers.push({ handler: requestScrollUpdate, element: window });
  }

  /**
   * Initialize hero parallax effect
   */
  initHeroParallax() {
    if (prefersReducedMotion()) return;

    const hero = document.querySelector('.section-hero');
    const heroImage = document.querySelector('.section-hero__background-image');

    if (!hero || !heroImage) return;

    hero.classList.add('has-parallax');

    let ticking = false;

    const updateParallax = () => {
      const scrolled = window.pageYOffset;
      const heroHeight = hero.offsetHeight;

      // Only apply parallax while hero is in view
      if (scrolled < heroHeight) {
        const offset = scrolled * 0.4; // Parallax speed multiplier
        heroImage.style.transform = `translateY(${offset}px)`;
      }

      ticking = false;
    };

    const requestParallaxUpdate = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    };

    window.addEventListener('scroll', requestParallaxUpdate, { passive: true });

    this.scrollHandlers.push({ handler: requestParallaxUpdate, element: window });
  }

  /**
   * Cleanup observers and event listeners
   */
  destroy() {
    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    // Remove scroll event listeners
    this.scrollHandlers.forEach(({ handler, element }) => {
      element.removeEventListener('scroll', handler);
    });
    this.scrollHandlers = [];
  }
}
