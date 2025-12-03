/**
 * Lightbox Component Tests
 * Tests open/close, keyboard navigation, swipe gestures, and zoom functionality
 */

import { Lightbox } from '../../docs/js/components/Lightbox.js';

describe('Lightbox Component', () => {
  let lightbox;
  let lightboxElement;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div id="lightbox" style="display: none;">
        <div class="lightbox-image-container">
          <img id="lightbox-img" src="" alt="">
        </div>
        <div class="lightbox-content">
          <h2 id="lightbox-title"></h2>
          <p id="lightbox-size"></p>
          <p id="lightbox-materials"></p>
          <p id="lightbox-description"></p>
          <p id="lightbox-price"></p>
          <p id="lightbox-availability" class="hidden"></p>
          <p id="lightbox-prints" class="hidden"></p>
        </div>
        <button class="close-lightbox">Close</button>
        <button id="prev-btn">Previous</button>
        <button id="next-btn">Next</button>
        <div id="slider-indicator"></div>
        <button class="inquire-btn">Inquire</button>
      </div>
      <div class="gallery-grid">
        <div class="gallery-item"
             data-title="Test Artwork"
             data-size="20x30 cm"
             data-materials="Oil on canvas"
             data-description="Test description"
             data-img="/img/test.jpg"
             data-available="true"
             data-images='["/img/test-1.jpg", "/img/test-2.jpg"]'>
        </div>
      </div>
    `;
    lightboxElement = document.getElementById('lightbox');
  });

  afterEach(() => {
    if (lightbox) {
      lightbox = null;
    }
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should_initialize_with_valid_elements', () => {
      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
        triggerSelector: '.gallery-item',
      });

      expect(lightbox.lightbox).toBe(lightboxElement);
      expect(lightbox.triggerSelector).toBe('.gallery-item');
    });

    it('should_not_throw_when_lightbox_missing', () => {
      expect(() => {
        lightbox = new Lightbox({
          lightboxSelector: '#nonexistent',
        });
      }).not.toThrow();
    });

    it('should_set_initial_aria_attributes', () => {
      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
      });

      expect(lightboxElement.getAttribute('aria-hidden')).toBe('true');
    });

    it('should_create_zoom_indicator', () => {
      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
      });

      const zoomIndicator = document.querySelector('.zoom-indicator');
      expect(zoomIndicator).toBeInTheDocument();
    });
  });

  describe('Open and Close', () => {
    it('should_open_lightbox_when_trigger_clicked', () => {
      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
        triggerSelector: '.gallery-item',
      });

      const trigger = document.querySelector('.gallery-item');
      trigger.click();

      jest.runAllTimers();

      expect(lightboxElement.style.display).toBe('flex');
      expect(lightboxElement.getAttribute('aria-hidden')).toBe('false');
      expect(lightbox.state.isOpen).toBe(true);
    });

    it('should_close_lightbox_when_close_button_clicked', () => {
      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
      });

      lightbox.open();
      jest.runAllTimers();

      const closeBtn = document.querySelector('.close-lightbox');
      closeBtn.click();

      // Close is now animated - run timers for animation to complete
      jest.runAllTimers();

      expect(lightboxElement.style.display).toBe('none');
      expect(lightboxElement.getAttribute('aria-hidden')).toBe('true');
      expect(lightbox.state.isOpen).toBe(false);
    });

    it('should_close_lightbox_when_escape_pressed', () => {
      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
      });

      lightbox.open();

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      expect(lightbox.state.isOpen).toBe(false);
    });

    it('should_close_when_clicking_backdrop', () => {
      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
      });

      lightbox.open();

      // Simulate clicking on lightbox background (not a child)
      const event = new MouseEvent('click', { bubbles: true });
      Object.defineProperty(event, 'target', { value: lightboxElement });
      lightboxElement.dispatchEvent(event);

      expect(lightbox.state.isOpen).toBe(false);
    });

    it('should_restore_focus_after_closing', () => {
      const button = document.createElement('button');
      button.id = 'trigger-button';
      document.body.appendChild(button);
      button.focus();

      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
      });

      const trigger = document.querySelector('.gallery-item');
      lightbox.openFromTrigger(trigger);
      lightbox.close();

      expect(document.activeElement).toBe(button);
    });
  });

  describe('Content Display', () => {
    it('should_display_artwork_information', () => {
      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
      });

      const trigger = document.querySelector('.gallery-item');
      lightbox.openFromTrigger(trigger);

      expect(document.getElementById('lightbox-title').textContent).toBe('Test Artwork');
      expect(document.getElementById('lightbox-size').textContent).toContain('20x30 cm');
      expect(document.getElementById('lightbox-materials').textContent).toContain('Oil on canvas');
      expect(document.getElementById('lightbox-description').textContent).toBe('Test description');
    });

    it('should_parse_images_array_from_json', () => {
      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
      });

      const trigger = document.querySelector('.gallery-item');
      lightbox.openFromTrigger(trigger);

      expect(lightbox.state.images).toEqual(['/img/test-1.jpg', '/img/test-2.jpg']);
    });

    it('should_fallback_to_single_image_when_json_invalid', () => {
      const trigger = document.querySelector('.gallery-item');
      trigger.dataset.images = 'invalid json';

      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
      });

      lightbox.openFromTrigger(trigger);

      expect(lightbox.state.images).toEqual(['/img/test.jpg']);
    });

    it('should_display_current_image', () => {
      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
      });

      const trigger = document.querySelector('.gallery-item');
      lightbox.openFromTrigger(trigger);

      // Check that the first image is in the state
      expect(lightbox.state.images[0]).toContain('/img/test-1.jpg');
      expect(lightbox.state.currentIndex).toBe(0);
    });
  });

  describe('Navigation', () => {
    it('should_show_next_image_on_next_button_click', () => {
      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
      });

      const trigger = document.querySelector('.gallery-item');
      lightbox.openFromTrigger(trigger);

      const nextBtn = document.getElementById('next-btn');
      nextBtn.click();

      // Navigation uses transitionToImage with setTimeout for cross-fade
      jest.runAllTimers();

      // Check state updated to next image
      expect(lightbox.state.currentIndex).toBe(1);
      expect(lightbox.state.images[1]).toContain('/img/test-2.jpg');
    });

    it('should_show_previous_image_on_prev_button_click', () => {
      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
      });

      const trigger = document.querySelector('.gallery-item');
      lightbox.openFromTrigger(trigger);

      lightbox.showNext();
      lightbox.showPrevious();

      // Check state updated back to first image
      expect(lightbox.state.currentIndex).toBe(0);
      expect(lightbox.state.images[0]).toContain('/img/test-1.jpg');
    });

    it('should_loop_to_first_image_after_last', () => {
      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
      });

      const trigger = document.querySelector('.gallery-item');
      lightbox.openFromTrigger(trigger);

      lightbox.showNext();
      lightbox.showNext();

      expect(lightbox.state.currentIndex).toBe(0);
    });

    it('should_navigate_with_arrow_keys', () => {
      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
      });

      const trigger = document.querySelector('.gallery-item');
      lightbox.openFromTrigger(trigger);

      const rightArrow = new KeyboardEvent('keydown', { key: 'ArrowRight' });
      document.dispatchEvent(rightArrow);

      // Navigation uses transitionToImage with setTimeout for cross-fade
      jest.runAllTimers();

      expect(lightbox.state.currentIndex).toBe(1);

      const leftArrow = new KeyboardEvent('keydown', { key: 'ArrowLeft' });
      document.dispatchEvent(leftArrow);

      // Run timers again for the second navigation
      jest.runAllTimers();

      expect(lightbox.state.currentIndex).toBe(0);
    });

    it('should_hide_navigation_buttons_for_single_image', () => {
      const trigger = document.querySelector('.gallery-item');
      trigger.dataset.images = '';

      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
      });

      lightbox.openFromTrigger(trigger);

      const prevBtn = document.getElementById('prev-btn');
      const nextBtn = document.getElementById('next-btn');

      expect(prevBtn.style.display).toBe('none');
      expect(nextBtn.style.display).toBe('none');
    });

    it('should_display_indicator_with_current_position', () => {
      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
      });

      const trigger = document.querySelector('.gallery-item');
      lightbox.openFromTrigger(trigger);

      const indicator = document.getElementById('slider-indicator');
      expect(indicator.textContent).toBe('1 / 2');
    });
  });

  describe('Swipe Gestures', () => {
    it('should_navigate_next_on_left_swipe', () => {
      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
      });

      const trigger = document.querySelector('.gallery-item');
      lightbox.openFromTrigger(trigger);

      const img = document.getElementById('lightbox-img');

      // Simulate swipe left with sufficient distance (100px > 50px threshold)
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 200 }],
      });
      img.dispatchEvent(touchStart);

      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 50 }],
      });
      img.dispatchEvent(touchEnd);

      // Navigation uses transitionToImage with setTimeout for cross-fade
      jest.runAllTimers();

      expect(lightbox.state.currentIndex).toBe(1);
    });

    it('should_navigate_previous_on_right_swipe', () => {
      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
      });

      const trigger = document.querySelector('.gallery-item');
      lightbox.openFromTrigger(trigger);

      // Set to second image first
      lightbox.state.currentIndex = 1;

      const img = document.getElementById('lightbox-img');

      // Simulate swipe right with sufficient distance (150px > 50px threshold)
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 50 }],
      });
      img.dispatchEvent(touchStart);

      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 200 }],
      });
      img.dispatchEvent(touchEnd);

      // Navigation uses transitionToImage with setTimeout for cross-fade
      jest.runAllTimers();

      expect(lightbox.state.currentIndex).toBe(0);
    });

    it('should_not_navigate_on_small_swipe', () => {
      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
      });

      const trigger = document.querySelector('.gallery-item');
      lightbox.openFromTrigger(trigger);

      const img = document.getElementById('lightbox-img');

      // Simulate small swipe (below threshold)
      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 150 }],
      });
      img.dispatchEvent(touchStart);

      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 140 }],
      });
      img.dispatchEvent(touchEnd);

      expect(lightbox.state.currentIndex).toBe(0);
    });
  });

  describe('Zoom Functionality', () => {
    it('should_zoom_in_on_double_tap', () => {
      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
      });

      lightbox.open();

      const img = document.getElementById('lightbox-img');

      // First tap
      img.click();
      jest.advanceTimersByTime(100);

      // Second tap (within double tap delay)
      img.click();

      expect(lightbox.state.scale).toBeGreaterThan(1);
    });

    it('should_zoom_out_on_second_double_tap', () => {
      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
      });

      lightbox.open();

      const img = document.getElementById('lightbox-img');

      // First double tap - zoom in
      img.click();
      jest.advanceTimersByTime(100);
      img.click();

      jest.advanceTimersByTime(400);

      // Second double tap - zoom out
      img.click();
      jest.advanceTimersByTime(100);
      img.click();

      expect(lightbox.state.scale).toBe(1);
    });

    it('should_apply_zoom_transformation_to_image', () => {
      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
      });

      lightbox.open();

      lightbox.state.scale = 2;
      lightbox.applyZoom();

      const img = document.getElementById('lightbox-img');
      expect(img.style.transform).toContain('scale(2)');
    });

    it('should_reset_zoom_on_close', () => {
      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
      });

      lightbox.open();

      lightbox.state.scale = 2;
      lightbox.state.translateX = 50;
      lightbox.state.translateY = 50;

      lightbox.close();

      // Close is now animated - run timers for animation to complete
      jest.runAllTimers();

      expect(lightbox.state.scale).toBe(1);
      expect(lightbox.state.translateX).toBe(0);
      expect(lightbox.state.translateY).toBe(0);
    });

    it('should_update_zoom_indicator_when_zoomed', () => {
      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
      });

      lightbox.open();

      lightbox.state.scale = 2.5;
      lightbox.updateZoomIndicator();

      const zoomIndicator = document.querySelector('.zoom-indicator');
      expect(zoomIndicator.classList.contains('visible')).toBe(true);
    });

    it('should_hide_zoom_indicator_when_not_zoomed', () => {
      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
      });

      lightbox.open();

      lightbox.state.scale = 1;
      lightbox.updateZoomIndicator();

      const zoomIndicator = document.querySelector('.zoom-indicator');
      expect(zoomIndicator.classList.contains('visible')).toBe(false);
    });
  });

  describe('Focus Trap', () => {
    it('should_trap_focus_within_lightbox_when_open', () => {
      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
      });

      lightbox.open();

      const focusableElements = lightboxElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      expect(focusableElements.length).toBeGreaterThan(0);
      expect(lightbox.focusTrapHandler).toBeDefined();
    });

    it('should_remove_focus_trap_when_closed', () => {
      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
      });

      lightbox.open();
      lightbox.close();

      // Close is now animated - run timers for animation to complete
      jest.runAllTimers();

      expect(lightbox.handlers.has('focusTrap')).toBe(false);
    });
  });

  describe('Inquiry Feature', () => {
    it('should_store_inquiry_message_in_localStorage', () => {
      // Store original location to restore later
      const originalHref = window.location.href;

      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
      });

      const trigger = document.querySelector('.gallery-item');
      lightbox.openFromTrigger(trigger);

      // Suppress the jsdom navigation error by catching it
      const consoleError = console.error;
      console.error = jest.fn();

      const inquireBtn = document.querySelector('.inquire-btn');
      try {
        inquireBtn.click();
      } catch (e) {
        // Ignore navigation error from jsdom
      }

      console.error = consoleError;

      const stored = localStorage.getItem('inquiryMessage');
      expect(stored).toContain('Test Artwork');
      expect(stored).toContain('20x30 cm');
    });

    it('should_navigate_to_contact_page_on_inquiry', () => {
      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
      });

      const trigger = document.querySelector('.gallery-item');
      lightbox.openFromTrigger(trigger);

      // Test that the inquiry button exists and is clickable
      // We can't fully test navigation in jsdom, so we verify the setup
      const inquireBtn = document.querySelector('.inquire-btn');
      expect(inquireBtn).not.toBeNull();
      expect(inquireBtn.textContent).toBe('Inquire');

      // Verify localStorage is set before navigation (the actual behavior)
      // Suppress jsdom navigation error
      const consoleError = console.error;
      console.error = jest.fn();

      try {
        inquireBtn.click();
      } catch (e) {
        // Ignore navigation error
      }

      console.error = consoleError;

      // The message should be stored before navigation
      const stored = localStorage.getItem('inquiryMessage');
      expect(stored).toBeTruthy();
    });
  });

  describe('Video Support', () => {
    it('should_display_video_when_media_is_video_type', () => {
      const trigger = document.querySelector('.gallery-item');
      trigger.dataset.images = JSON.stringify([
        { type: 'video', webm: '/video/test.webm', mp4: '/video/test.mp4' },
      ]);

      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
      });

      lightbox.openFromTrigger(trigger);

      const video = document.querySelector('.lightbox-video');
      expect(video).toBeInTheDocument();
    });

    it('should_hide_image_when_showing_video', () => {
      const trigger = document.querySelector('.gallery-item');
      trigger.dataset.images = JSON.stringify([
        { type: 'video', webm: '/video/test.webm' },
      ]);

      lightbox = new Lightbox({
        lightboxSelector: '#lightbox',
      });

      lightbox.openFromTrigger(trigger);

      const img = document.getElementById('lightbox-img');
      expect(img.style.display).toBe('none');
    });
  });
});
