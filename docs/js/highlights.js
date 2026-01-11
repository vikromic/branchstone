/**
 * Highlights Section - Load and render highlights from JSON
 * Handles desktop grid and mobile scroll-snap carousel with pagination
 */

class HighlightsManager {
  constructor() {
    this.highlights = [];
    this.gridElement = null;
    this.paginationElement = null;
    this.currentIndex = 0;
  }

  /**
   * Initialize the highlights manager
   */
  async init() {
    this.gridElement = document.querySelector('.highlights__grid');
    this.paginationElement = document.querySelector('.highlights__pagination');

    if (!this.gridElement) {
      console.warn('Highlights grid element not found');
      return;
    }

    try {
      await this.loadHighlights();
      this.renderHighlights();
      this.setupMobilePagination();
      this.setupScrollSync();
    } catch (error) {
      console.error('Error initializing highlights:', error);
      this.renderEmptyState();
    }
  }

  /**
   * Load highlights from JSON
   */
  async loadHighlights() {
    try {
      const response = await fetch('json_data/highlights.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (!data.highlights || !Array.isArray(data.highlights)) {
        throw new Error('Invalid highlights data format');
      }

      this.highlights = this.sortHighlights(data.highlights);
    } catch (error) {
      console.error('Error loading highlights:', error);
      throw error;
    }
  }

  /**
   * Sort highlights: featured first, then by order, then by date
   */
  sortHighlights(highlights) {
    return highlights.sort((a, b) => {
      // Featured items first
      if (a.isFeatured !== b.isFeatured) {
        return a.isFeatured ? -1 : 1;
      }

      // Then by order (if specified)
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }

      // Then by date (newest first)
      const dateA = this.parseDate(a.date);
      const dateB = this.parseDate(b.date);
      return dateB - dateA;
    });
  }

  /**
   * Parse date string (supports formats like "2025-01", "Mar 2025", "2025")
   */
  parseDate(dateStr) {
    if (!dateStr) return new Date(0);

    // Try parsing ISO format first
    const isoDate = new Date(dateStr);
    if (!isNaN(isoDate.getTime())) {
      return isoDate;
    }

    // Try parsing "Mon YYYY" format
    const monthYear = dateStr.match(/^([A-Za-z]+)\s+(\d{4})$/);
    if (monthYear) {
      return new Date(`${monthYear[1]} 1, ${monthYear[2]}`);
    }

    // Fallback to just year
    const year = dateStr.match(/\d{4}/);
    if (year) {
      return new Date(year[0], 0, 1);
    }

    return new Date(0);
  }

  /**
   * Render highlights to the grid
   */
  renderHighlights() {
    if (!this.gridElement) return;

    if (this.highlights.length === 0) {
      this.renderEmptyState();
      return;
    }

    // Clear existing content
    this.gridElement.textContent = '';

    // Create and append each card
    this.highlights.forEach(highlight => {
      const card = this.createHighlightCard(highlight);
      this.gridElement.appendChild(card);
    });
  }

  /**
   * Create a highlight card element (safe DOM construction)
   */
  createHighlightCard(highlight) {
    const hasLink = highlight.link?.url;
    const isExternal = highlight.link?.external !== false;

    // Create article element
    const article = document.createElement('article');
    article.className = 'highlight-card';

    // Create image wrapper
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'highlight-card__image-wrapper';

    const img = document.createElement('img');
    img.src = highlight.image || 'img/placeholder.jpg';
    img.alt = highlight.title || '';
    img.className = 'highlight-card__image';
    img.loading = 'lazy';

    imageWrapper.appendChild(img);

    // Create content wrapper
    const content = document.createElement('div');
    content.className = 'highlight-card__content';

    // Create meta information
    if (highlight.source || highlight.date) {
      const meta = document.createElement('div');
      meta.className = 'highlight-card__meta';

      if (highlight.source) {
        const source = document.createElement('span');
        source.className = 'highlight-card__source';
        source.textContent = highlight.source;
        meta.appendChild(source);
      }

      if (highlight.source && highlight.date) {
        const separator = document.createElement('span');
        separator.className = 'highlight-card__meta-separator';
        meta.appendChild(separator);
      }

      if (highlight.date) {
        const date = document.createElement('span');
        date.className = 'highlight-card__date';
        date.textContent = highlight.date;
        meta.appendChild(date);
      }

      content.appendChild(meta);
    }

    // Create title
    const title = document.createElement('h3');
    title.className = 'highlight-card__title';
    title.textContent = highlight.title || '';
    content.appendChild(title);

    // Create subtitle (optional)
    if (highlight.subtitle) {
      const subtitle = document.createElement('p');
      subtitle.className = 'highlight-card__subtitle';
      subtitle.textContent = highlight.subtitle;
      content.appendChild(subtitle);
    }

    // Create description (optional)
    if (highlight.description) {
      const description = document.createElement('p');
      description.className = 'highlight-card__description';
      description.textContent = highlight.description;
      content.appendChild(description);
    }

    // Create link indicator (optional)
    if (hasLink) {
      const linkIndicator = document.createElement('div');
      linkIndicator.className = 'highlight-card__link-indicator';

      const linkText = document.createElement('span');
      linkText.textContent = 'Read more';
      linkIndicator.appendChild(linkText);

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'highlight-card__link-icon');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('aria-hidden', 'true');

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M7 17L17 7M17 7H7M17 7V17');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');

      svg.appendChild(path);
      linkIndicator.appendChild(svg);
      content.appendChild(linkIndicator);
    }

    // If there's a link, wrap in anchor tag
    if (hasLink) {
      const link = document.createElement('a');
      link.href = highlight.link.url;
      link.className = 'highlight-card__link';
      link.setAttribute('aria-label', `${highlight.title} - ${highlight.source || ''}`);

      if (isExternal) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }

      link.appendChild(imageWrapper);
      link.appendChild(content);
      article.appendChild(link);
    } else {
      article.appendChild(imageWrapper);
      article.appendChild(content);
    }

    return article;
  }

  /**
   * Render empty state when no highlights
   */
  renderEmptyState() {
    if (!this.gridElement) return;

    this.gridElement.textContent = '';

    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'highlights__empty';
    emptyDiv.textContent = 'No highlights available at this time.';

    this.gridElement.appendChild(emptyDiv);
  }

  /**
   * Setup mobile pagination dots
   */
  setupMobilePagination() {
    if (!this.paginationElement || this.highlights.length === 0) return;

    // Only show pagination on mobile
    if (window.innerWidth >= 768) {
      this.paginationElement.textContent = '';
      return;
    }

    this.paginationElement.textContent = '';

    this.highlights.forEach((_, index) => {
      const button = document.createElement('button');
      button.className = 'highlights__dot';
      button.dataset.index = index;
      button.setAttribute('aria-label', `Go to highlight ${index + 1}`);
      button.setAttribute('aria-pressed', index === 0);

      if (index === 0) {
        button.classList.add('is-active');
      }

      button.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        this.scrollToHighlight(idx);
      });

      this.paginationElement.appendChild(button);
    });
  }

  /**
   * Setup scroll sync for mobile pagination
   */
  setupScrollSync() {
    if (!this.gridElement || this.highlights.length === 0) return;

    let scrollTimeout;
    this.gridElement.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.updateActiveDot();
      }, 100);
    });

    // Re-setup pagination on resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.setupMobilePagination();
      }, 250);
    });
  }

  /**
   * Scroll to a specific highlight (mobile)
   */
  scrollToHighlight(index) {
    if (!this.gridElement) return;

    const cards = this.gridElement.querySelectorAll('.highlight-card');
    if (cards[index]) {
      cards[index].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start'
      });
    }
  }

  /**
   * Update active dot based on scroll position
   */
  updateActiveDot() {
    if (!this.gridElement || !this.paginationElement) return;
    if (window.innerWidth >= 768) return;

    const cards = this.gridElement.querySelectorAll('.highlight-card');
    const scrollLeft = this.gridElement.scrollLeft;

    // Find the card that's most in view
    let closestIndex = 0;
    let closestDistance = Infinity;

    cards.forEach((card, index) => {
      const cardLeft = card.offsetLeft - this.gridElement.offsetLeft;
      const distance = Math.abs(scrollLeft - cardLeft);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    // Update dots
    this.paginationElement.querySelectorAll('.highlights__dot').forEach((dot, index) => {
      const isActive = index === closestIndex;
      dot.classList.toggle('is-active', isActive);
      dot.setAttribute('aria-pressed', isActive);
    });

    this.currentIndex = closestIndex;
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const manager = new HighlightsManager();
    manager.init();
  });
} else {
  const manager = new HighlightsManager();
  manager.init();
}

export default HighlightsManager;
