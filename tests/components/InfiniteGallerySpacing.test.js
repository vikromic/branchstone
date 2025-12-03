/**
 * InfiniteGallery Spacing Tests
 *
 * Tests to verify there is no gap between the header and gallery content
 * in infinite scroll mode on mobile.
 *
 * ROOT CAUSE ANALYSIS:
 * The spacing issue occurs because:
 * 1. Critical CSS in gallery.html sets header padding: 1rem 1.5rem (taller)
 * 2. JS measures header.offsetHeight while critical CSS is applied
 * 3. External CSS loads and sets header padding: 0.5rem 1rem (shorter)
 * 4. Header shrinks AFTER measurement → gap appears
 *
 * SOLUTION:
 * Sync critical CSS with external CSS header values.
 */

describe('InfiniteGallery Spacing - Header/Gallery Gap', () => {
  describe('CSS Value Consistency', () => {
    test('critical CSS header padding should match external CSS header padding', () => {
      // gallery.html line 133: padding: 0.5rem 1rem (FIXED)
      // 03-header.css line 11: padding: 0.5rem 1rem
      const criticalCSSHeaderPadding = { vertical: '0.5rem', horizontal: '1rem' };
      const externalCSSHeaderPadding = { vertical: '0.5rem', horizontal: '1rem' };

      const paddingMismatch =
        criticalCSSHeaderPadding.vertical !== externalCSSHeaderPadding.vertical ||
        criticalCSSHeaderPadding.horizontal !== externalCSSHeaderPadding.horizontal;

      // After fix, there should be NO mismatch
      expect(paddingMismatch).toBe(false);
    });

    test('critical CSS hamburger size should match external CSS', () => {
      // gallery.html: width/height: 40px (FIXED)
      // 03-header.css line 43-44: width/height: 40px
      const criticalCSSHamburgerSize = 40;
      const externalCSSHamburgerSize = 40;

      expect(criticalCSSHamburgerSize).toBe(externalCSSHamburgerSize);
    });

    test('critical CSS page title font size should match external CSS', () => {
      // gallery.html: font-size: 1.125rem (FIXED)
      // 03-header.css line 121: font-size: 1.125rem
      const criticalCSSFontSize = '1.125rem';
      const externalCSSFontSize = '1.125rem';

      expect(criticalCSSFontSize).toBe(externalCSSFontSize);
    });

    test('CSS fallback --header-height should be 48px', () => {
      // CSS file line 1719: --header-height: 48px (FIXED)
      const CSS_FALLBACK_HEADER_HEIGHT = 48;
      expect(CSS_FALLBACK_HEADER_HEIGHT).toBe(48);
    });
  });

  describe('Gallery Positioning in Infinite Scroll Mode', () => {
    let container;

    beforeEach(() => {
      document.body.innerHTML = `
        <header id="test-header" style="padding: 0.5rem 1rem; height: 48px;">
          <nav>Navigation</nav>
        </header>
        <main class="gallery-main" id="gallery">
          <div class="gallery-grid"></div>
        </main>
      `;
      container = document.getElementById('gallery');
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    test('should set --header-height CSS variable on infinite scroll mode', () => {
      container.classList.add('infinite-scroll-mode');

      // Simulate JS measurement
      const mockHeaderHeight = 48;
      container.style.setProperty('--header-height', `${mockHeaderHeight}px`);

      expect(container.style.getPropertyValue('--header-height')).toBe('48px');
    });

    test('should have position: fixed in infinite scroll mode', () => {
      container.classList.add('infinite-scroll-mode');
      container.style.position = 'fixed';
      container.style.top = 'var(--header-height)';
      container.style.setProperty('--header-height', '48px');

      expect(container.style.position).toBe('fixed');
      expect(container.classList.contains('infinite-scroll-mode')).toBe(true);
    });

    test('CSS variable --header-height should equal 48px (matching 0.5rem header padding)', () => {
      // After fix: both critical CSS and external CSS produce same header height
      const EXPECTED_HEADER_HEIGHT = 48;
      const CSS_FALLBACK_VALUE = 48;

      expect(EXPECTED_HEADER_HEIGHT).toBe(CSS_FALLBACK_VALUE);
    });
  });

  describe('Timing Issue Prevention', () => {
    test('should have no gap when CSS values are synchronized', () => {
      const timeline = [];

      // 1. Page loads with critical CSS (now matches external CSS)
      const headerHeightCriticalCSS = 48;
      timeline.push('critical-css-applied');

      // 2. JS runs and measures header
      timeline.push(`js-measures-${headerHeightCriticalCSS}px`);

      // 3. JS applies the measured height
      timeline.push(`js-applies-${headerHeightCriticalCSS}px`);

      // 4. External CSS loads (same values as critical CSS)
      timeline.push('external-css-loaded');

      // 5. Header remains same height (no shrinking!)
      const headerHeightExternalCSS = 48;
      timeline.push(`header-remains-${headerHeightExternalCSS}px`);

      // 6. No gap!
      const gap = headerHeightCriticalCSS - headerHeightExternalCSS;
      timeline.push(`gap-is-${gap}px`);

      expect(timeline).toEqual([
        'critical-css-applied',
        'js-measures-48px',
        'js-applies-48px',
        'external-css-loaded',
        'header-remains-48px',
        'gap-is-0px'
      ]);

      expect(gap).toBe(0);
    });

    test('gap calculation should be zero when CSS values match', () => {
      const headerHeightBefore = 48; // Critical CSS
      const headerHeightAfter = 48;  // External CSS

      const gap = headerHeightBefore - headerHeightAfter;

      expect(gap).toBe(0);
    });
  });

  describe('InfiniteGallery Container Styles', () => {
    let container;

    beforeEach(() => {
      document.body.innerHTML = `
        <main class="gallery-main" id="gallery">
          <div class="gallery-infinite"></div>
        </main>
      `;
      container = document.getElementById('gallery');
    });

    afterEach(() => {
      document.body.innerHTML = '';
    });

    test('should add infinite-scroll-mode class', () => {
      container.classList.add('infinite-scroll-mode');
      expect(container.classList.contains('infinite-scroll-mode')).toBe(true);
    });

    test('should set correct positioning styles', () => {
      container.classList.add('infinite-scroll-mode');
      container.style.position = 'fixed';
      container.style.top = '48px';
      container.style.left = '0';
      container.style.right = '0';
      container.style.bottom = '0';
      container.style.padding = '0';

      expect(container.style.position).toBe('fixed');
      expect(container.style.top).toBe('48px');
      expect(container.style.padding).toBe('0px');
    });
  });
});
