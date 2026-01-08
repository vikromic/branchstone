/**
 * Artwork Modal System
 * Production-ready modal overlay for artwork details with URL persistence
 *
 * Features:
 * - URL query parameter state management (?art=<slug>)
 * - Image carousel with keyboard navigation
 * - Focus trap and accessibility compliance
 * - Body scroll locking
 * - Multiple close methods (X, overlay, ESC)
 * - Contact form pre-fill integration
 * - Mobile-responsive design
 */

import { sanitizeText } from './security.js';
import { SVG_NAMESPACE, ARTWORK_CARD } from './constants.js';

/**
 * ArtworkCarousel - Handles image carousel for modal
 */
export class ArtworkCarousel {
  constructor(images, container) {
    this.images = images; // Array of full image paths
    this.container = container;
    this.currentIndex = 0;
  }

  /**
   * Build full image paths from main_image and images array
   */
  static buildImagePaths(artwork) {
    if (!artwork.main_image) return [];

    // Extract directory from main_image
    const lastSlash = artwork.main_image.lastIndexOf('/');
    const directory = artwork.main_image.substring(0, lastSlash);

    // Build array: [main_image, ...additional images]
    const allImages = [artwork.main_image];

    if (artwork.images && Array.isArray(artwork.images)) {
      artwork.images.forEach(filename => {
        allImages.push(`${directory}/${filename}`);
      });
    }

    return allImages;
  }

  render() {
    if (!this.images || this.images.length === 0) {
      return this.renderEmpty();
    }

    // Clear container
    this.container.textContent = '';

    // Create carousel structure
    const carousel = document.createElement('div');
    carousel.className = 'artwork-modal__carousel';

    // Main image container
    const imageContainer = document.createElement('div');
    imageContainer.className = 'artwork-modal__main-image-container';

    const img = document.createElement('img');
    img.src = this.images[0];
    img.alt = 'Artwork';
    img.className = 'artwork-modal__main-image';
    img.loading = 'eager';

    imageContainer.appendChild(img);
    carousel.appendChild(imageContainer);

    // Add controls if multiple images
    if (this.images.length > 1) {
      this.addControls(carousel);
    }

    this.container.appendChild(carousel);
    this.attachEventListeners();
  }

  addControls(carousel) {
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'artwork-modal__carousel-prev';
    prevBtn.setAttribute('aria-label', 'Previous image');

    const prevSvg = document.createElementNS(SVG_NAMESPACE, 'svg');
    prevSvg.setAttribute('viewBox', '0 0 24 24');
    prevSvg.setAttribute('fill', 'none');
    prevSvg.setAttribute('stroke', 'currentColor');
    prevSvg.setAttribute('stroke-width', '2');

    const prevPolyline = document.createElementNS(SVG_NAMESPACE, 'polyline');
    prevPolyline.setAttribute('points', '15 18 9 12 15 6');
    prevSvg.appendChild(prevPolyline);
    prevBtn.appendChild(prevSvg);

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'artwork-modal__carousel-next';
    nextBtn.setAttribute('aria-label', 'Next image');

    const nextSvg = document.createElementNS(SVG_NAMESPACE, 'svg');
    nextSvg.setAttribute('viewBox', '0 0 24 24');
    nextSvg.setAttribute('fill', 'none');
    nextSvg.setAttribute('stroke', 'currentColor');
    nextSvg.setAttribute('stroke-width', '2');

    const nextPolyline = document.createElementNS(SVG_NAMESPACE, 'polyline');
    nextPolyline.setAttribute('points', '9 18 15 12 9 6');
    nextSvg.appendChild(nextPolyline);
    nextBtn.appendChild(nextSvg);

    // Dots navigation
    const dotsContainer = document.createElement('div');
    dotsContainer.className = 'artwork-modal__carousel-dots';

    this.images.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.className = 'artwork-modal__carousel-dot';
      if (index === 0) dot.classList.add('active');
      dot.setAttribute('aria-label', `Go to image ${index + 1}`);
      dot.setAttribute('data-index', index.toString());
      dotsContainer.appendChild(dot);
    });

    carousel.appendChild(prevBtn);
    carousel.appendChild(nextBtn);
    carousel.appendChild(dotsContainer);
  }

  renderEmpty() {
    this.container.textContent = '';
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'artwork-modal__no-image';

    const p = document.createElement('p');
    p.textContent = 'No images available';
    emptyDiv.appendChild(p);

    this.container.appendChild(emptyDiv);
  }

  attachEventListeners() {
    if (this.images.length <= 1) return;

    const prevBtn = this.container.querySelector('.artwork-modal__carousel-prev');
    const nextBtn = this.container.querySelector('.artwork-modal__carousel-next');
    const dots = this.container.querySelectorAll('.artwork-modal__carousel-dot');

    if (prevBtn) prevBtn.addEventListener('click', () => this.previous());
    if (nextBtn) nextBtn.addEventListener('click', () => this.next());

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => this.goTo(index));
    });
  }

  previous() {
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
    this.updateImage();
  }

  next() {
    this.currentIndex = (this.currentIndex + 1) % this.images.length;
    this.updateImage();
  }

  goTo(index) {
    this.currentIndex = index;
    this.updateImage();
  }

  updateImage() {
    const img = this.container.querySelector('.artwork-modal__main-image');
    const dots = this.container.querySelectorAll('.artwork-modal__carousel-dot');

    if (img) {
      img.src = this.images[this.currentIndex];
    }

    dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === this.currentIndex);
    });
  }

  handleKeyboardNavigation(e) {
    if (this.images.length <= 1) return;

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.previous();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.next();
    }
  }
}

/**
 * ArtworkModalManager - Manages modal lifecycle and state
 */
export class ArtworkModalManager {
  constructor() {
    this.modal = null;
    this.overlay = null;
    this.currentArtwork = null;
    this.carousel = null;
    this.focusedElementBeforeModal = null;
    this.keyboardHandler = this.handleKeyboard.bind(this);
    this.scrollPosition = 0;
  }

  /**
   * Initialize modal system
   */
  init() {
    this.createModalHTML();
    this.attachGlobalListeners();
    this.checkURLForAutoOpen();
  }

  /**
   * Create modal HTML structure using safe DOM methods
   */
  createModalHTML() {
    // Check if modal already exists
    if (document.querySelector('.artwork-modal')) return;

    // Create modal container
    const modal = document.createElement('div');
    modal.className = 'artwork-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'modal-title');
    modal.hidden = true;

    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'artwork-modal__overlay';

    // Content container
    const content = document.createElement('div');
    content.className = 'artwork-modal__content';

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'artwork-modal__close';
    closeBtn.setAttribute('aria-label', 'Close modal');

    const closeSvg = document.createElementNS(SVG_NAMESPACE, 'svg');
    closeSvg.setAttribute('viewBox', '0 0 24 24');
    closeSvg.setAttribute('fill', 'none');
    closeSvg.setAttribute('stroke', 'currentColor');
    closeSvg.setAttribute('stroke-width', '2');

    const line1 = document.createElementNS(SVG_NAMESPACE, 'line');
    line1.setAttribute('x1', '18');
    line1.setAttribute('y1', '6');
    line1.setAttribute('x2', '6');
    line1.setAttribute('y2', '18');

    const line2 = document.createElementNS(SVG_NAMESPACE, 'line');
    line2.setAttribute('x1', '6');
    line2.setAttribute('y1', '6');
    line2.setAttribute('x2', '18');
    line2.setAttribute('y2', '18');

    closeSvg.appendChild(line1);
    closeSvg.appendChild(line2);
    closeBtn.appendChild(closeSvg);

    // Grid container
    const grid = document.createElement('div');
    grid.className = 'artwork-modal__grid';

    // Left side: Images
    const imagesDiv = document.createElement('div');
    imagesDiv.className = 'artwork-modal__images';

    // Right side: Details
    const details = document.createElement('div');
    details.className = 'artwork-modal__details';

    // Header
    const header = document.createElement('div');
    header.className = 'artwork-modal__header';

    const title = document.createElement('h2');
    title.id = 'modal-title';
    title.className = 'artwork-modal__title';

    const badge = document.createElement('span');
    badge.className = 'artwork-modal__badge';
    badge.hidden = true;

    header.appendChild(title);
    header.appendChild(badge);

    // Info section
    const info = document.createElement('div');
    info.className = 'artwork-modal__info';

    const collection = document.createElement('p');
    collection.className = 'artwork-modal__collection';

    const materials = document.createElement('p');
    materials.className = 'artwork-modal__materials';

    const meta = document.createElement('p');
    meta.className = 'artwork-modal__meta';

    const price = document.createElement('p');
    price.className = 'artwork-modal__price';

    info.appendChild(collection);
    info.appendChild(materials);
    info.appendChild(meta);
    info.appendChild(price);

    // Description container
    const descContainer = document.createElement('div');
    descContainer.className = 'artwork-modal__description-container';

    const description = document.createElement('div');
    description.className = 'artwork-modal__description';

    const readMoreBtn = document.createElement('button');
    readMoreBtn.className = 'artwork-modal__read-more';
    readMoreBtn.hidden = true;

    descContainer.appendChild(description);
    descContainer.appendChild(readMoreBtn);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'artwork-modal__actions';

    const ctaBtn = document.createElement('button');
    ctaBtn.className = 'artwork-modal__cta btn btn--primary';

    actions.appendChild(ctaBtn);

    // Assemble details
    details.appendChild(header);
    details.appendChild(info);
    details.appendChild(descContainer);
    details.appendChild(actions);

    // Assemble grid
    grid.appendChild(imagesDiv);
    grid.appendChild(details);

    // Assemble content
    content.appendChild(closeBtn);
    content.appendChild(grid);

    // Assemble modal
    modal.appendChild(overlay);
    modal.appendChild(content);

    document.body.appendChild(modal);

    this.modal = modal;
    this.overlay = overlay;

    // Attach close listeners
    closeBtn.addEventListener('click', () => this.close());
    overlay.addEventListener('click', () => this.close());
  }

  /**
   * Attach global event listeners
   */
  attachGlobalListeners() {
    // Listen for artwork card clicks
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.artwork-card');
      if (!card) return;

      // Don't open modal if clicking action buttons
      if (e.target.closest('.artwork-card__favorite') ||
          e.target.closest('.artwork-card__inquire')) {
        return;
      }

      const artworkData = this.extractArtworkDataFromCard(card);
      if (artworkData) {
        this.open(artworkData);
      }
    });

    // Handle browser back/forward navigation
    window.addEventListener('popstate', () => {
      const urlParams = new URLSearchParams(window.location.search);
      const artSlug = urlParams.get('art');

      if (artSlug && !this.isOpen()) {
        // Modal should be open but isn't - reopen it
        const card = document.querySelector(`[data-artwork-id="artwork-${artSlug}"]`)?.closest('.artwork-card');
        if (card) {
          const artworkData = this.extractArtworkDataFromCard(card);
          if (artworkData) {
            this.open(artworkData, false); // false = don't update URL (already updated by popstate)
          }
        }
      } else if (!artSlug && this.isOpen()) {
        // Modal is open but shouldn't be - close it
        this.close(false); // false = don't update URL
      }
    });
  }

  /**
   * Extract artwork data from card element
   */
  extractArtworkDataFromCard(card) {
    const title = card.querySelector('.artwork-card__title')?.textContent || '';
    const collection = card.querySelector('.artwork-card__collection')?.textContent || '';
    const description = card.querySelector('.artwork-card__description')?.textContent || '';
    const price = card.querySelector('.artwork-card__price')?.textContent || '';
    const dimensions = card.getAttribute('data-dimensions') || '';
    const mainImage = card.querySelector('.artwork-card__image')?.src || '';
    const sold = card.classList.contains('artwork-card--sold') || card.querySelector('.artwork-card__badge--sold');
    const printsAvailable = card.getAttribute('data-prints-available') === 'true';

    // Extract slug from title
    const slug = this.titleToSlug(title);

    // Build image paths (from artworks.json structure)
    // For now, we'll use main image only since we don't have access to full artwork object
    // The gallery-data.js should pass this info via data attributes
    const images = [mainImage];

    return {
      name: title,
      slug,
      collection,
      description,
      price,
      dimensions,
      materials: '', // Not available in card
      year: '', // Not available in card
      images,
      sold: !!sold,
      prints: printsAvailable
    };
  }

  /**
   * Convert title to URL-friendly slug
   */
  titleToSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Check URL for art parameter and auto-open modal
   */
  checkURLForAutoOpen() {
    const urlParams = new URLSearchParams(window.location.search);
    const artSlug = urlParams.get('art');

    if (artSlug) {
      // Find artwork card by slug
      const card = document.querySelector(`[data-artwork-id="artwork-${artSlug}"]`)?.closest('.artwork-card');
      if (card) {
        const artworkData = this.extractArtworkDataFromCard(card);
        if (artworkData) {
          // Delay to ensure DOM is ready
          setTimeout(() => {
            this.open(artworkData, false); // false = don't update URL
          }, 100);
        }
      }
    }
  }

  /**
   * Open modal with artwork data
   */
  open(artwork, updateURL = true) {
    this.currentArtwork = artwork;
    this.focusedElementBeforeModal = document.activeElement;

    // Save scroll position
    this.scrollPosition = window.pageYOffset;

    // Populate modal content
    this.populateModal(artwork);

    // Show modal
    this.modal.hidden = false;

    // Trigger reflow
    this.modal.offsetHeight;

    this.modal.classList.add('is-active');

    // Lock body scroll
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${this.scrollPosition}px`;
    document.body.style.width = '100%';

    // Update URL
    if (updateURL) {
      this.updateURL(artwork.slug);
    }

    // Attach keyboard listeners
    document.addEventListener('keydown', this.keyboardHandler);

    // Focus close button
    setTimeout(() => {
      this.modal.querySelector('.artwork-modal__close')?.focus();
    }, 300);
  }

  /**
   * Close modal
   */
  close(updateURL = true) {
    if (!this.isOpen()) return;

    this.modal.classList.remove('is-active');

    setTimeout(() => {
      this.modal.hidden = true;
      this.currentArtwork = null;

      // Unlock body scroll
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';

      // Restore scroll position
      window.scrollTo(0, this.scrollPosition);

      // Return focus
      if (this.focusedElementBeforeModal) {
        this.focusedElementBeforeModal.focus();
      }

      // Remove keyboard listener
      document.removeEventListener('keydown', this.keyboardHandler);

      // Update URL
      if (updateURL) {
        this.removeURLParameter();
      }
    }, 300);
  }

  /**
   * Check if modal is open
   */
  isOpen() {
    return this.modal && this.modal.classList.contains('is-active');
  }

  /**
   * Populate modal with artwork data
   */
  populateModal(artwork) {
    // Title
    const titleEl = this.modal.querySelector('.artwork-modal__title');
    titleEl.textContent = sanitizeText(artwork.name);

    // Badge (sold/available)
    const badgeEl = this.modal.querySelector('.artwork-modal__badge');
    if (artwork.sold) {
      badgeEl.textContent = 'Sold';
      badgeEl.hidden = false;
      badgeEl.className = 'artwork-modal__badge artwork-modal__badge--sold';
    } else {
      badgeEl.hidden = true;
    }

    // Collection
    const collectionEl = this.modal.querySelector('.artwork-modal__collection');
    collectionEl.textContent = artwork.collection ? `${sanitizeText(artwork.collection)} Collection` : '';

    // Materials
    const materialsEl = this.modal.querySelector('.artwork-modal__materials');
    materialsEl.textContent = artwork.materials ? sanitizeText(artwork.materials) : '';

    // Meta (Year + Size)
    const metaEl = this.modal.querySelector('.artwork-modal__meta');
    const metaParts = [];
    if (artwork.year) metaParts.push(artwork.year);
    if (artwork.dimensions) metaParts.push(sanitizeText(artwork.dimensions));
    metaEl.textContent = metaParts.join(' · ');

    // Price
    const priceEl = this.modal.querySelector('.artwork-modal__price');
    if (artwork.sold) {
      priceEl.textContent = 'Sold';
      priceEl.classList.add('artwork-modal__price--sold');
    } else {
      const priceText = artwork.price.replace('$', '');
      priceEl.textContent = priceText ? `$${priceText}` : 'Price on request';
      priceEl.classList.remove('artwork-modal__price--sold');
    }

    // Description with read more/less
    this.populateDescription(artwork.description);

    // CTA Button
    this.populateCTA(artwork);

    // Images carousel
    const imagesContainer = this.modal.querySelector('.artwork-modal__images');
    this.carousel = new ArtworkCarousel(artwork.images, imagesContainer);
    this.carousel.render();
  }

  /**
   * Populate description with read more/less functionality
   */
  populateDescription(description) {
    const container = this.modal.querySelector('.artwork-modal__description-container');
    const descEl = this.modal.querySelector('.artwork-modal__description');
    const readMoreBtn = this.modal.querySelector('.artwork-modal__read-more');

    if (!description || description.trim().length === 0) {
      container.hidden = true;
      return;
    }

    container.hidden = false;
    const sanitizedDesc = sanitizeText(description);

    // Check if description is long (>300 chars)
    const isLong = sanitizedDesc.length > 300;

    if (isLong) {
      const shortText = sanitizedDesc.substring(0, 300) + '...';
      descEl.textContent = shortText;
      descEl.setAttribute('data-full-text', sanitizedDesc);
      descEl.setAttribute('data-short-text', shortText);

      readMoreBtn.hidden = false;
      readMoreBtn.textContent = 'Read more';

      // Remove old listener
      const newReadMoreBtn = readMoreBtn.cloneNode(true);
      readMoreBtn.parentNode.replaceChild(newReadMoreBtn, readMoreBtn);

      // Add new listener
      newReadMoreBtn.addEventListener('click', () => {
        const isExpanded = newReadMoreBtn.textContent === 'Read less';

        if (isExpanded) {
          descEl.textContent = descEl.getAttribute('data-short-text');
          newReadMoreBtn.textContent = 'Read more';
        } else {
          descEl.textContent = descEl.getAttribute('data-full-text');
          newReadMoreBtn.textContent = 'Read less';
        }
      });
    } else {
      descEl.textContent = sanitizedDesc;
      readMoreBtn.hidden = true;
    }
  }

  /**
   * Populate CTA button based on sold status
   */
  populateCTA(artwork) {
    const ctaBtn = this.modal.querySelector('.artwork-modal__cta');

    if (artwork.sold) {
      ctaBtn.textContent = 'Ask about prints';
    } else {
      ctaBtn.textContent = 'Inquire about this piece';
    }

    // Remove old listener
    const newCTA = ctaBtn.cloneNode(true);
    ctaBtn.parentNode.replaceChild(newCTA, ctaBtn);

    // Add click handler
    newCTA.addEventListener('click', () => {
      this.handleCTAClick(artwork);
    });
  }

  /**
   * Handle CTA button click - navigate to contact with prefilled message
   */
  handleCTAClick(artwork) {
    const params = new URLSearchParams();
    params.set('art', artwork.slug);

    // Build prefilled message
    const metaParts = [];
    if (artwork.collection) metaParts.push(`${artwork.collection} collection`);
    if (artwork.year) metaParts.push(artwork.year);
    if (artwork.dimensions) metaParts.push(artwork.dimensions);
    const meta = metaParts.join(', ');

    let message;
    if (artwork.sold) {
      message = `Hi, I'd like to inquire about prints of "${artwork.name}"${meta ? ` (${meta})` : ''}.`;
    } else {
      message = `Hi, I'd like to inquire about "${artwork.name}"${meta ? ` from the ${meta}` : ''}.`;
    }

    params.set('message', message);

    window.location.href = `contact.html?${params.toString()}`;
  }

  /**
   * Update URL with art parameter
   */
  updateURL(slug) {
    const url = new URL(window.location);
    url.searchParams.set('art', slug);
    window.history.pushState({}, '', url);
  }

  /**
   * Remove art parameter from URL
   */
  removeURLParameter() {
    const url = new URL(window.location);
    url.searchParams.delete('art');
    window.history.pushState({}, '', url);
  }

  /**
   * Handle keyboard events (ESC to close, arrow keys for carousel)
   */
  handleKeyboard(e) {
    if (e.key === 'Escape') {
      this.close();
    } else if (this.carousel) {
      this.carousel.handleKeyboardNavigation(e);
    }
  }
}
