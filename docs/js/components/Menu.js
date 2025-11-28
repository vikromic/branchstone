/**
 * Mobile Menu Component
 * Handles mobile navigation menu with accessibility features
 * @module components/Menu
 */

import { $, on, setAttributes, getFocusableElements } from '../utils/dom.js';

export class Menu {
  /**
   * @param {Object} options - Menu options
   * @param {string} options.toggleSelector - Toggle button selector
   * @param {string} options.menuSelector - Menu element selector
   * @param {string} options.overlaySelector - Overlay element selector
   */
  constructor(options = {}) {
    this.toggleButton = $(options.toggleSelector || '#mobile-menu-toggle');
    this.menu = $(options.menuSelector || '#mobile-nav-menu');
    this.overlay = $(options.overlaySelector || '#mobile-menu-overlay');
    this.body = document.body;
    this.isOpen = false;
    this.cleanupFunctions = [];

    if (!this.toggleButton || !this.menu || !this.overlay) {
      return;
    }

    this.init();
  }

  /**
   * Initialize menu
   * @private
   */
  init() {
    this.setInitialAttributes();
    this.attachEventListeners();
    this.updatePageTitle();
  }

  /**
   * Set initial ARIA attributes
   * @private
   */
  setInitialAttributes() {
    setAttributes(this.toggleButton, {
      'aria-expanded': 'false',
    });
    setAttributes(this.menu, {
      'aria-hidden': 'true',
    });
  }

  /**
   * Attach all event listeners
   * @private
   */
  attachEventListeners() {
    this.cleanupFunctions.push(
      on(this.toggleButton, 'click', (e) => {
        e.stopPropagation();
        this.toggleMenu();
      }),
      on(this.overlay, 'click', (e) => {
        // Only close if clicking directly on overlay, not on menu items
        if (e.target === this.overlay) {
          this.close();
        }
      }),
      on(document, 'keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      })
    );

    // Prevent clicks on menu from bubbling to overlay
    this.cleanupFunctions.push(
      on(this.menu, 'click', (e) => e.stopPropagation())
    );

    // Close menu when clicking nav links, then navigate
    const navLinks = this.menu.querySelectorAll('a');
    navLinks.forEach(link => {
      this.cleanupFunctions.push(on(link, 'click', (e) => {
        // Get the href before closing
        const href = link.getAttribute('href');
        // Close the menu
        this.close();
        // If href exists, navigate after a small delay to allow menu close animation
        if (href && href !== '#') {
          setTimeout(() => {
            window.location.href = href;
          }, 50);
        }
      }));
    });

    // Setup hover effects if hover background exists
    this.setupHoverEffects(navLinks);
  }

  /**
   * Setup hover reveal effects
   * @private
   * @param {NodeList} navLinks - Navigation links
   */
  setupHoverEffects(navLinks) {
    const hoverBg = $('#menu-hover-bg');
    if (!hoverBg) return;

    navLinks.forEach(link => {
      this.cleanupFunctions.push(
        on(link, 'mouseenter', () => {
          const img = link.getAttribute('data-hover-img');
          if (img) {
            hoverBg.style.backgroundImage = `url('${img}')`;
            hoverBg.classList.add('visible');
          }
        }),
        on(link, 'mouseleave', () => {
          hoverBg.classList.remove('visible');
        })
      );
    });
  }

  /**
   * Toggle menu open/close
   */
  toggleMenu() {
    this.isOpen ? this.close() : this.open();
  }

  /**
   * Open menu
   */
  open() {
    this.isOpen = true;
    this.toggleButton.classList.add('active');
    this.menu.classList.add('active');
    this.overlay.classList.add('active');

    setAttributes(this.toggleButton, { 'aria-expanded': 'true' });
    setAttributes(this.menu, { 'aria-hidden': 'false' });

    this.body.style.overflow = 'hidden';
    this.body.classList.add('menu-open');

    // Focus first menu item
    this.focusFirstMenuItem();
  }

  /**
   * Close menu
   */
  close() {
    this.isOpen = false;
    this.toggleButton.classList.remove('active');
    this.menu.classList.remove('active');
    this.overlay.classList.remove('active');

    setAttributes(this.toggleButton, { 'aria-expanded': 'false' });
    setAttributes(this.menu, { 'aria-hidden': 'true' });

    this.body.style.overflow = '';
    this.body.classList.remove('menu-open');

    // Return focus to toggle button
    this.toggleButton.focus();
  }

  /**
   * Focus first menu item for keyboard navigation
   * @private
   */
  focusFirstMenuItem() {
    const focusableElements = getFocusableElements(this.menu);
    if (focusableElements.length > 0) {
      setTimeout(() => focusableElements[0].focus(), 100);
    }
  }

  /**
   * Update mobile page title based on current page
   * @private
   */
  updatePageTitle() {
    const mobilePageTitle = $('#mobile-page-title');
    if (!mobilePageTitle) return;

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const pageTitles = {
      'index.html': 'Home',
      'gallery.html': 'Gallery',
      'about.html': 'About',
      'contact.html': 'Contact',
    };

    const title = pageTitles[currentPage] || 'Home';
    mobilePageTitle.textContent = title;
    mobilePageTitle.setAttribute('data-translate', `nav.${title.toLowerCase()}`);
  }

  /**
   * Destroy menu and cleanup event listeners
   */
  destroy() {
    this.cleanupFunctions.forEach(cleanup => cleanup?.());
    this.cleanupFunctions = [];
    if (this.isOpen) {
      this.close();
    }
  }
}

export default Menu;
