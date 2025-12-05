/**
 * Inquiry FAB (Floating Action Button) Component
 * Mobile-only floating action button for quick access to favorites and contact
 * @module components/InquiryFAB
 */

import { createElement } from '../utils/dom.js';

export class InquiryFAB {
  /**
   * @param {Object} options - FAB options
   * @param {string} options.containerSelector - Parent container selector (default: body)
   */
  constructor(options = {}) {
    this.containerSelector = options.containerSelector || 'body';
    this.state = {
      expanded: false,
      favoritesCount: 0,
    };

    // Only initialize on mobile
    if (window.innerWidth > 768) {
      return;
    }

    this.init();
  }

  /**
   * Initialize FAB
   * @private
   */
  init() {
    this.updateFavoritesCount();
    this.render();
    this.attachEventListeners();

    // Listen for favorites changes from other components
    window.addEventListener('storage', () => {
      this.updateFavoritesCount();
    });

    // Custom event for same-tab favorites updates
    window.addEventListener('favoritesUpdated', () => {
      this.updateFavoritesCount();
    });
  }

  /**
   * Update favorites count from localStorage
   * @private
   */
  updateFavoritesCount() {
    try {
      const favorites = JSON.parse(localStorage.getItem('branchstone_favorites') || '[]');
      this.state.favoritesCount = favorites.length;

      // Update badge if FAB is already rendered
      if (this.badgeEl) {
        this.badgeEl.textContent = this.state.favoritesCount;
        this.badgeEl.style.display = this.state.favoritesCount > 0 ? 'flex' : 'none';
      }
    } catch (error) {
      console.warn('Failed to read favorites:', error);
      this.state.favoritesCount = 0;
    }
  }

  /**
   * Render FAB
   * @private
   */
  render() {
    // Create FAB container
    this.fabContainer = createElement('div', {
      className: 'inquiry-fab',
      role: 'group',
      'aria-label': 'Quick actions',
    });

    // Main button
    this.mainButton = createElement('button', {
      className: 'inquiry-fab-main',
      type: 'button',
      'aria-label': 'Open quick actions',
      'aria-expanded': 'false',
    });

    // Plus icon for main button
    const plusIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    plusIcon.setAttribute('viewBox', '0 0 24 24');
    plusIcon.setAttribute('fill', 'none');
    plusIcon.setAttribute('stroke', 'currentColor');
    plusIcon.setAttribute('stroke-width', '2');
    plusIcon.innerHTML = '<path d="M12 5v14M5 12h14"/>';
    this.mainButton.appendChild(plusIcon);

    // Badge count
    this.badgeEl = createElement('span', {
      className: 'inquiry-fab-badge',
      'aria-label': `${this.state.favoritesCount} favorites`,
    });
    this.badgeEl.textContent = this.state.favoritesCount;
    this.badgeEl.style.display = this.state.favoritesCount > 0 ? 'flex' : 'none';
    this.mainButton.appendChild(this.badgeEl);

    // Options container (hidden by default)
    this.optionsContainer = createElement('div', {
      className: 'inquiry-fab-options',
      'aria-hidden': 'true',
    });

    // Save to Favorites button
    const favoritesButton = createElement('button', {
      className: 'inquiry-fab-option',
      type: 'button',
      'aria-label': 'View favorites',
      dataset: { action: 'favorites' },
    });

    const heartIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    heartIcon.setAttribute('viewBox', '0 0 24 24');
    heartIcon.setAttribute('fill', 'none');
    heartIcon.setAttribute('stroke', 'currentColor');
    heartIcon.setAttribute('stroke-width', '2');
    heartIcon.innerHTML =
      '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>';

    const favoritesLabel = createElement('span');
    favoritesLabel.textContent = 'Favorites';

    favoritesButton.appendChild(heartIcon);
    favoritesButton.appendChild(favoritesLabel);

    // Contact Artist button
    const contactButton = createElement('button', {
      className: 'inquiry-fab-option',
      type: 'button',
      'aria-label': 'Contact artist',
      dataset: { action: 'contact' },
    });

    const messageIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    messageIcon.setAttribute('viewBox', '0 0 24 24');
    messageIcon.setAttribute('fill', 'none');
    messageIcon.setAttribute('stroke', 'currentColor');
    messageIcon.setAttribute('stroke-width', '2');
    messageIcon.innerHTML =
      '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>';

    const contactLabel = createElement('span');
    contactLabel.textContent = 'Contact';

    contactButton.appendChild(messageIcon);
    contactButton.appendChild(contactLabel);

    // Assemble options
    this.optionsContainer.appendChild(favoritesButton);
    this.optionsContainer.appendChild(contactButton);

    // Assemble FAB
    this.fabContainer.appendChild(this.optionsContainer);
    this.fabContainer.appendChild(this.mainButton);

    // Append to body
    const container = document.querySelector(this.containerSelector) || document.body;
    container.appendChild(this.fabContainer);
  }

  /**
   * Attach event listeners
   * @private
   */
  attachEventListeners() {
    // Main button click - toggle expansion
    this.mainButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleExpanded();
    });

    // Options click handlers
    this.optionsContainer.addEventListener('click', (e) => {
      const button = e.target.closest('.inquiry-fab-option');
      if (!button) return;

      const action = button.dataset.action;

      if (action === 'favorites') {
        this.handleFavorites();
      } else if (action === 'contact') {
        this.handleContact();
      }

      // Collapse after action
      this.collapse();
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (this.state.expanded && !this.fabContainer.contains(e.target)) {
        this.collapse();
      }
    });

    // Keyboard support - Escape to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.state.expanded) {
        this.collapse();
        this.mainButton.focus();
      }
    });
  }

  /**
   * Toggle expanded state
   * @private
   */
  toggleExpanded() {
    if (this.state.expanded) {
      this.collapse();
    } else {
      this.expand();
    }
  }

  /**
   * Expand FAB options
   * @private
   */
  expand() {
    this.state.expanded = true;
    this.fabContainer.classList.add('expanded');
    this.mainButton.setAttribute('aria-expanded', 'true');
    this.mainButton.setAttribute('aria-label', 'Close quick actions');
    this.optionsContainer.setAttribute('aria-hidden', 'false');
  }

  /**
   * Collapse FAB options
   * @private
   */
  collapse() {
    this.state.expanded = false;
    this.fabContainer.classList.remove('expanded');
    this.mainButton.setAttribute('aria-expanded', 'false');
    this.mainButton.setAttribute('aria-label', 'Open quick actions');
    this.optionsContainer.setAttribute('aria-hidden', 'true');
  }

  /**
   * Handle favorites action
   * @private
   */
  handleFavorites() {
    // Filter gallery to show only favorited items
    try {
      const favorites = JSON.parse(localStorage.getItem('branchstone_favorites') || '[]');

      if (favorites.length === 0) {
        alert('You have no favorited artworks yet. Tap the heart icon on any artwork to add it to favorites.');
        return;
      }

      // Filter gallery items to show only favorites
      const galleryItems = document.querySelectorAll('.gallery-item');
      let visibleCount = 0;

      galleryItems.forEach((item) => {
        const artworkId = item.querySelector('.favorite-btn')?.dataset?.artworkId;
        const isFavorited = favorites.includes(artworkId);

        item.classList.toggle('filtered-out', !isFavorited);
        item.setAttribute('aria-hidden', (!isFavorited).toString());

        if (isFavorited) {
          visibleCount++;
        }
      });

      // Announce to screen readers
      const announcement = `Showing ${visibleCount} favorited artworks`;
      this.announceToScreenReader(announcement);

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.warn('Failed to filter favorites:', error);
    }
  }

  /**
   * Handle contact action
   * @private
   */
  handleContact() {
    window.location.href = 'contact.html';
  }

  /**
   * Announce message to screen readers
   * @private
   * @param {string} message - Message to announce
   */
  announceToScreenReader(message) {
    const announcement = createElement('div', {
      className: 'sr-only',
      'aria-live': 'polite',
      'aria-atomic': 'true',
    });
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.fabContainer) {
      this.fabContainer.remove();
    }
  }
}

export default InquiryFAB;
