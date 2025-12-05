/**
 * InquiryFAB Component Tests
 * Tests FAB expand/collapse, favorites badge, and actions
 */

import { InquiryFAB } from '../../docs/js/components/InquiryFAB.js';

describe('InquiryFAB Component', () => {
  let fab;
  let originalInnerWidth;

  beforeEach(() => {
    document.body.innerHTML = '<div id="gallery"></div>';
    originalInnerWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
    localStorage.clear();
  });

  afterEach(() => {
    if (fab) {
      fab.destroy();
      fab = null;
    }
    document.body.innerHTML = '';
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, writable: true });
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should_initialize_on_mobile_viewport', () => {
      fab = new InquiryFAB({ containerSelector: '#gallery' });

      const fabElement = document.querySelector('.inquiry-fab');
      expect(fabElement).toBeInTheDocument();
    });

    it('should_not_initialize_on_desktop_viewport', () => {
      Object.defineProperty(window, 'innerWidth', { value: 1200, writable: true });

      fab = new InquiryFAB({ containerSelector: '#gallery' });

      const fabElement = document.querySelector('.inquiry-fab');
      expect(fabElement).not.toBeInTheDocument();
    });

    it('should_set_correct_aria_attributes', () => {
      fab = new InquiryFAB({ containerSelector: '#gallery' });

      const fabElement = document.querySelector('.inquiry-fab');
      expect(fabElement.getAttribute('role')).toBe('group');
      expect(fabElement.getAttribute('aria-label')).toBe('Quick actions');
    });
  });

  describe('Expand/Collapse', () => {
    it('should_expand_on_main_button_click', () => {
      fab = new InquiryFAB({ containerSelector: '#gallery' });

      const mainButton = document.querySelector('.inquiry-fab-main');
      mainButton.click();

      const fabElement = document.querySelector('.inquiry-fab');
      expect(fabElement.classList.contains('expanded')).toBe(true);
      expect(mainButton.getAttribute('aria-expanded')).toBe('true');
    });

    it('should_collapse_on_second_click', () => {
      fab = new InquiryFAB({ containerSelector: '#gallery' });

      const mainButton = document.querySelector('.inquiry-fab-main');
      mainButton.click();
      mainButton.click();

      const fabElement = document.querySelector('.inquiry-fab');
      expect(fabElement.classList.contains('expanded')).toBe(false);
      expect(mainButton.getAttribute('aria-expanded')).toBe('false');
    });

    it('should_collapse_on_escape_key', () => {
      fab = new InquiryFAB({ containerSelector: '#gallery' });

      const mainButton = document.querySelector('.inquiry-fab-main');
      mainButton.click();

      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);

      const fabElement = document.querySelector('.inquiry-fab');
      expect(fabElement.classList.contains('expanded')).toBe(false);
    });

    it('should_collapse_on_outside_click', () => {
      fab = new InquiryFAB({ containerSelector: '#gallery' });

      const mainButton = document.querySelector('.inquiry-fab-main');
      mainButton.click();

      document.body.click();

      const fabElement = document.querySelector('.inquiry-fab');
      expect(fabElement.classList.contains('expanded')).toBe(false);
    });
  });

  describe('Favorites Badge', () => {
    it('should_hide_badge_when_no_favorites', () => {
      fab = new InquiryFAB({ containerSelector: '#gallery' });

      const badge = document.querySelector('.inquiry-fab-badge');
      expect(badge.style.display).toBe('none');
    });

    it('should_show_badge_with_count_when_favorites_exist', () => {
      localStorage.setItem('branchstone_favorites', JSON.stringify(['art1', 'art2']));

      fab = new InquiryFAB({ containerSelector: '#gallery' });

      const badge = document.querySelector('.inquiry-fab-badge');
      expect(badge.style.display).toBe('flex');
      expect(badge.textContent).toBe('2');
    });

    it('should_update_badge_on_favoritesUpdated_event', () => {
      fab = new InquiryFAB({ containerSelector: '#gallery' });

      localStorage.setItem('branchstone_favorites', JSON.stringify(['art1', 'art2', 'art3']));
      window.dispatchEvent(new CustomEvent('favoritesUpdated'));

      const badge = document.querySelector('.inquiry-fab-badge');
      expect(badge.textContent).toBe('3');
    });

    it('should_handle_invalid_localStorage_data', () => {
      localStorage.setItem('branchstone_favorites', 'invalid json');

      fab = new InquiryFAB({ containerSelector: '#gallery' });

      const badge = document.querySelector('.inquiry-fab-badge');
      expect(badge.style.display).toBe('none');
    });
  });

  describe('Actions', () => {
    it('should_trigger_contact_navigation_on_contact_action', () => {
      fab = new InquiryFAB({ containerSelector: '#gallery' });

      const mainButton = document.querySelector('.inquiry-fab-main');
      mainButton.click();

      const contactBtn = document.querySelector('[data-action="contact"]');
      expect(contactBtn).toBeInTheDocument();
      expect(contactBtn.getAttribute('data-action')).toBe('contact');
    });

    it('should_alert_when_no_favorites_on_favorites_action', () => {
      fab = new InquiryFAB({ containerSelector: '#gallery' });

      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

      const mainButton = document.querySelector('.inquiry-fab-main');
      mainButton.click();

      const favoritesBtn = document.querySelector('[data-action="favorites"]');
      favoritesBtn.click();

      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining('no favorited artworks')
      );

      alertSpy.mockRestore();
    });

    it('should_collapse_after_action', () => {
      fab = new InquiryFAB({ containerSelector: '#gallery' });

      const mainButton = document.querySelector('.inquiry-fab-main');
      mainButton.click();

      const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

      const favoritesBtn = document.querySelector('[data-action="favorites"]');
      favoritesBtn.click();

      const fabElement = document.querySelector('.inquiry-fab');
      expect(fabElement.classList.contains('expanded')).toBe(false);

      alertSpy.mockRestore();
    });
  });

  describe('Cleanup', () => {
    it('should_remove_fab_element_on_destroy', () => {
      fab = new InquiryFAB({ containerSelector: '#gallery' });

      expect(document.querySelector('.inquiry-fab')).toBeInTheDocument();

      fab.destroy();

      expect(document.querySelector('.inquiry-fab')).not.toBeInTheDocument();
    });
  });
});
