/**
 * MobileMenuManager - Mobile menu functionality
 * Handles mobile menu open/close, focus trapping, and body scroll locking
 */

export class MobileMenuManager {
  constructor() {
    this.menuToggle = null;
    this.mobileMenu = null;
    this.backdrop = null;
    this.menuLinks = null;
  }

  /**
   * Initialize the mobile menu
   */
  init() {
    this.menuToggle = document.querySelector('.header__menu-toggle');
    this.mobileMenu = document.getElementById('mobile-menu');
    this.backdrop = this.mobileMenu?.querySelector('.mobile-menu__backdrop');
    this.menuLinks = this.mobileMenu?.querySelectorAll('.mobile-menu__link');

    if (!this.menuToggle || !this.mobileMenu) return;

    this._attachEventListeners();
  }

  /**
   * Open the mobile menu
   */
  open() {
    this.mobileMenu.hidden = false;
    this.menuToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';

    // Focus first link after animation
    setTimeout(() => {
      const firstLink = this.mobileMenu.querySelector('.mobile-menu__link');
      if (firstLink) firstLink.focus();
    }, 300);
  }

  /**
   * Close the mobile menu
   */
  close() {
    this.mobileMenu.hidden = true;
    this.menuToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    this.menuToggle.focus();
  }

  /**
   * Attach event listeners
   * @private
   */
  _attachEventListeners() {
    // Toggle button click
    this.menuToggle.addEventListener('click', () => {
      const isOpen = this.menuToggle.getAttribute('aria-expanded') === 'true';
      isOpen ? this.close() : this.open();
    });

    // Backdrop click
    this.backdrop?.addEventListener('click', () => this.close());

    // Close on link click
    this.menuLinks?.forEach(link => {
      link.addEventListener('click', () => this.close());
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.mobileMenu.hidden) {
        this.close();
      }
    });
  }
}
