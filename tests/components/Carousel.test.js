/**
 * Carousel Component Tests
 * Tests navigation, autoplay, infinite loop, and race condition fixes
 */

import { Carousel } from '../../docs/js/components/Carousel.js';

describe('Carousel Component', () => {
  let carousel;
  let container;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div class="carousel" id="test-carousel">
        <div class="carousel-track">
          <div class="carousel-item">Item 1</div>
          <div class="carousel-item">Item 2</div>
          <div class="carousel-item">Item 3</div>
        </div>
        <div class="carousel-controls">
          <button class="carousel-prev">Previous</button>
          <button class="carousel-next">Next</button>
        </div>
        <div class="carousel-indicators"></div>
      </div>
    `;
    container = document.getElementById('test-carousel');
  });

  afterEach(() => {
    if (carousel) {
      carousel.destroy();
      carousel = null;
    }
    document.body.innerHTML = '';
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should_initialize_with_valid_container', () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
        itemSelector: '.carousel-item',
      });

      expect(carousel.container).toBe(container);
      expect(carousel.items.length).toBe(3);
    });

    it('should_not_throw_when_container_missing', () => {
      expect(() => {
        carousel = new Carousel({
          containerSelector: '#nonexistent',
        });
      }).not.toThrow();
    });

    it('should_set_default_options', () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
      });

      expect(carousel.loop).toBe(true);
      expect(carousel.pauseOnHover).toBe(true);
      expect(carousel.itemsPerView).toBe(1);
    });

    it('should_mark_first_item_as_active', () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
      });

      const firstItem = carousel.items[0];
      expect(firstItem.classList.contains('active')).toBe(true);
      expect(firstItem.getAttribute('aria-hidden')).toBe('false');
    });

    it('should_setup_indicators', () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
      });

      const indicators = container.querySelectorAll('.carousel-indicator');
      expect(indicators.length).toBe(3);
    });
  });

  describe('Navigation - Next/Previous', () => {
    it('should_navigate_to_next_item', async () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
      });

      await carousel.next();

      expect(carousel.currentIndex).toBe(1);
      expect(carousel.items[1].classList.contains('active')).toBe(true);
    });

    it('should_navigate_to_previous_item', async () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
      });

      carousel.goTo(1);
      await carousel.previous();

      expect(carousel.currentIndex).toBe(0);
    });

    it('should_loop_to_first_after_last', async () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
        loop: true,
      });

      carousel.goTo(2);
      await carousel.next();

      expect(carousel.currentIndex).toBe(0);
    });

    it('should_loop_to_last_from_first', async () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
        loop: true,
      });

      await carousel.previous();

      expect(carousel.currentIndex).toBe(2);
    });

    it('should_not_loop_when_loop_disabled', async () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
        loop: false,
      });

      carousel.goTo(2);
      await carousel.next();

      expect(carousel.currentIndex).toBe(2);
    });

    it('should_trigger_navigation_on_button_click', async () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
      });

      const nextBtn = container.querySelector('.carousel-next');
      nextBtn.click();

      // Wait for async navigation to complete
      await carousel.transitionQueue;

      expect(carousel.currentIndex).toBe(1);
    });

    it('should_trigger_previous_on_button_click', async () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
      });

      carousel.goTo(1);

      const prevBtn = container.querySelector('.carousel-prev');
      prevBtn.click();

      // Wait for async navigation to complete
      await carousel.transitionQueue;

      expect(carousel.currentIndex).toBe(0);
    });
  });

  describe('Autoplay', () => {
    it('should_start_autoplay_on_init', () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
        autoplayDelay: 1000,
      });

      expect(carousel.autoplayTimer).not.toBeNull();
    });

    it('should_advance_to_next_slide_after_delay', async () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
        autoplayDelay: 1000,
      });

      jest.advanceTimersByTime(1100);

      // Wait for async navigation
      await carousel.transitionQueue;

      expect(carousel.currentIndex).toBe(1);
    });

    it('should_stop_autoplay_when_paused', () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
        autoplayDelay: 1000,
      });

      carousel.pause();

      const initialIndex = carousel.currentIndex;
      jest.advanceTimersByTime(2000);

      expect(carousel.currentIndex).toBe(initialIndex);
    });

    it('should_restart_autoplay_when_play_called', async () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
        autoplayDelay: 1000,
      });

      carousel.pause();
      carousel.play();

      jest.advanceTimersByTime(1100);
      await carousel.transitionQueue;

      expect(carousel.currentIndex).toBeGreaterThan(0);
    });

    it('should_pause_on_hover_when_enabled', () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
        pauseOnHover: true,
        autoplayDelay: 1000,
      });

      const mouseEnter = new MouseEvent('mouseenter');
      container.dispatchEvent(mouseEnter);

      const initialIndex = carousel.currentIndex;
      jest.advanceTimersByTime(2000);

      expect(carousel.currentIndex).toBe(initialIndex);
    });

    it('should_resume_on_mouse_leave', async () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
        pauseOnHover: true,
        autoplayDelay: 1000,
      });

      const mouseEnter = new MouseEvent('mouseenter');
      container.dispatchEvent(mouseEnter);

      const mouseLeave = new MouseEvent('mouseleave');
      container.dispatchEvent(mouseLeave);

      jest.advanceTimersByTime(1100);
      await carousel.transitionQueue;

      expect(carousel.currentIndex).toBeGreaterThan(0);
    });

    it('should_restart_autoplay_after_manual_navigation', async () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
        autoplayDelay: 1000,
      });

      const nextBtn = container.querySelector('.carousel-next');
      nextBtn.click();
      await carousel.transitionQueue;

      jest.advanceTimersByTime(1100);
      await carousel.transitionQueue;

      expect(carousel.currentIndex).toBe(2);
    });
  });

  describe('Race Condition Prevention', () => {
    it('should_not_navigate_when_transition_in_progress', async () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
      });

      carousel.isTransitioning = true;
      const initialIndex = carousel.currentIndex;

      await carousel.next();

      expect(carousel.currentIndex).toBe(initialIndex);
    });

    it('should_reset_transition_flag_after_navigation', async () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
      });

      await carousel.next();

      expect(carousel.isTransitioning).toBe(false);
    });

    it('should_not_autoplay_during_transition', async () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
        autoplayDelay: 500,
      });

      carousel.isTransitioning = true;
      const initialIndex = carousel.currentIndex;

      jest.advanceTimersByTime(600);
      await carousel.transitionQueue;

      expect(carousel.currentIndex).toBe(initialIndex);
    });

    it('should_queue_multiple_transitions', async () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
      });

      // Fire multiple transitions rapidly
      carousel.next();
      carousel.next();
      carousel.next();

      // Wait for all to complete
      await carousel.transitionQueue;

      // Should have advanced 3 times (with loop back to 0)
      expect(carousel.currentIndex).toBe(0);
    });
  });

  describe('Infinite Loop (Multi-item)', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div class="carousel" id="multi-carousel">
          <div class="carousel-track">
            <div class="carousel-item">Item 1</div>
            <div class="carousel-item">Item 2</div>
            <div class="carousel-item">Item 3</div>
            <div class="carousel-item">Item 4</div>
            <div class="carousel-item">Item 5</div>
          </div>
          <div class="carousel-controls">
            <button class="carousel-prev">Previous</button>
            <button class="carousel-next">Next</button>
          </div>
        </div>
      `;
      container = document.getElementById('multi-carousel');
    });

    it('should_clone_items_for_infinite_scroll', () => {
      carousel = new Carousel({
        containerSelector: '#multi-carousel',
        itemsPerView: 3,
        itemsPerRow: 3,
        loop: true,
      });

      const track = container.querySelector('.carousel-track');
      const clones = track.querySelectorAll('.carousel-clone');

      expect(clones.length).toBeGreaterThan(0);
    });

    it('should_position_at_original_first_item_initially', () => {
      carousel = new Carousel({
        containerSelector: '#multi-carousel',
        itemsPerView: 3,
        itemsPerRow: 3,
        loop: true,
      });

      const cloneCount = Math.max(3, 3);
      expect(carousel.currentIndex).toBe(cloneCount);
    });

    it('should_advance_by_itemsPerRow_on_next', async () => {
      // Use real timers for this test since it recreates DOM in beforeEach
      jest.useRealTimers();

      carousel = new Carousel({
        containerSelector: '#multi-carousel',
        itemsPerView: 3,
        itemsPerRow: 2,
        loop: true,
      });

      const initialIndex = carousel.currentIndex;

      // For multi-item carousel, next() returns a promise that resolves after 600ms
      await carousel.next();

      // Wait for transition to complete
      await new Promise(resolve => setTimeout(resolve, 700));

      expect(carousel.currentIndex).toBe(initialIndex + 2);

      // Restore fake timers for other tests
      jest.useFakeTimers();
    }, 10000);

    it('should_calculate_translation_based_on_item_width', () => {
      carousel = new Carousel({
        containerSelector: '#multi-carousel',
        itemsPerView: 3,
        loop: true,
      });

      const track = container.querySelector('.carousel-track');
      expect(track.style.transform).toContain('translateX');
    });
  });

  describe('Swipe Gestures', () => {
    it('should_navigate_next_on_left_swipe', async () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
      });

      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 200 }],
      });
      container.dispatchEvent(touchStart);

      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 100 }],
      });
      container.dispatchEvent(touchEnd);

      await carousel.transitionQueue;

      expect(carousel.currentIndex).toBe(1);
    });

    it('should_navigate_previous_on_right_swipe', async () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
      });

      carousel.goTo(1);

      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 100 }],
      });
      container.dispatchEvent(touchStart);

      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 200 }],
      });
      container.dispatchEvent(touchEnd);

      await carousel.transitionQueue;

      expect(carousel.currentIndex).toBe(0);
    });

    it('should_not_navigate_on_small_swipe', () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
      });

      const touchStart = new TouchEvent('touchstart', {
        touches: [{ clientX: 150 }],
      });
      container.dispatchEvent(touchStart);

      const touchEnd = new TouchEvent('touchend', {
        changedTouches: [{ clientX: 140 }],
      });
      container.dispatchEvent(touchEnd);

      expect(carousel.currentIndex).toBe(0);
    });
  });

  describe('Indicators', () => {
    it('should_update_active_indicator_on_navigation', async () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
      });

      await carousel.next();

      const indicators = container.querySelectorAll('.carousel-indicator');
      expect(indicators[0].classList.contains('active')).toBe(false);
      expect(indicators[1].classList.contains('active')).toBe(true);
    });

    it('should_navigate_to_specific_slide_on_indicator_click', () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
      });

      const indicators = container.querySelectorAll('.carousel-indicator');
      indicators[2].click();

      expect(carousel.currentIndex).toBe(2);
    });

    it('should_restart_autoplay_after_indicator_click', async () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
        autoplayDelay: 1000,
      });

      const indicators = container.querySelectorAll('.carousel-indicator');
      indicators[1].click();

      jest.advanceTimersByTime(1100);
      await carousel.transitionQueue;

      expect(carousel.currentIndex).toBe(2);
    });

    it('should_not_show_indicators_for_multi_item_carousel', () => {
      document.body.innerHTML = `
        <div class="carousel" id="multi-carousel">
          <div class="carousel-track">
            <div class="carousel-item">Item 1</div>
            <div class="carousel-item">Item 2</div>
            <div class="carousel-item">Item 3</div>
          </div>
          <div class="carousel-controls">
            <button class="carousel-prev">Previous</button>
            <button class="carousel-next">Next</button>
          </div>
          <div class="carousel-indicators"></div>
        </div>
      `;

      carousel = new Carousel({
        containerSelector: '#multi-carousel',
        itemsPerView: 2,
      });

      const indicatorsContainer = document.querySelector('.carousel-indicators');
      expect(indicatorsContainer.innerHTML).toBe('');
    });
  });

  describe('Accessibility', () => {
    it('should_set_aria_hidden_on_inactive_items', () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
      });

      expect(carousel.items[0].getAttribute('aria-hidden')).toBe('false');
      expect(carousel.items[1].getAttribute('aria-hidden')).toBe('true');
      expect(carousel.items[2].getAttribute('aria-hidden')).toBe('true');
    });

    it('should_update_aria_hidden_on_navigation', async () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
      });

      await carousel.next();

      expect(carousel.items[0].getAttribute('aria-hidden')).toBe('true');
      expect(carousel.items[1].getAttribute('aria-hidden')).toBe('false');
    });

    it('should_set_aria_label_on_indicators', () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
      });

      const indicators = container.querySelectorAll('.carousel-indicator');
      expect(indicators[0].getAttribute('aria-label')).toBe('Go to slide 1');
      expect(indicators[1].getAttribute('aria-label')).toBe('Go to slide 2');
    });
  });

  describe('Lifecycle Methods', () => {
    it('should_destroy_carousel_and_cleanup', () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
        autoplayDelay: 1000,
      });

      carousel.destroy();

      expect(carousel.autoplayTimer).toBeNull();
    });

    it('should_recalculate_dimensions', () => {
      carousel = new Carousel({
        containerSelector: '#test-carousel',
        itemsPerView: 3,
      });

      expect(() => {
        carousel.recalculate();
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should_handle_empty_carousel', () => {
      document.body.innerHTML = `
        <div class="carousel" id="empty-carousel">
          <div class="carousel-track"></div>
        </div>
      `;

      expect(() => {
        carousel = new Carousel({
          containerSelector: '#empty-carousel',
        });
      }).not.toThrow();
    });

    it('should_handle_single_item_carousel', async () => {
      document.body.innerHTML = `
        <div class="carousel" id="single-carousel">
          <div class="carousel-track">
            <div class="carousel-item">Only Item</div>
          </div>
          <div class="carousel-controls">
            <button class="carousel-next">Next</button>
          </div>
        </div>
      `;

      carousel = new Carousel({
        containerSelector: '#single-carousel',
        loop: true,
      });

      await carousel.next();

      expect(carousel.currentIndex).toBe(0);
    });
  });
});
