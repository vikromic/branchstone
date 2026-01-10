/**
 * EMERGENCY DIAGNOSTIC: Carousel Dots Inline Style Test
 *
 * This script applies inline styles directly to carousel dots.
 * Inline styles have the highest specificity and will override any CSS.
 *
 * PURPOSE:
 * - If dots appear with this script, we know it's a CSS specificity issue
 * - If dots still don't appear, it's a JavaScript or DOM issue
 *
 * USAGE:
 * 1. Add this script AFTER your normal carousel initialization
 * 2. Or paste the applyInlineStylesToCarouselDots() function into browser console
 * 3. Refresh the page
 * 4. Report back: Do you see the dots now? Yes/No
 */

(function() {
  'use strict';

  console.log('🔍 DIAGNOSTIC: Carousel Dots Inline Style Test loaded');

  function applyInlineStylesToCarouselDots() {
    console.log('🔍 DIAGNOSTIC: Searching for carousel dot elements...');

    // Find all carousel dot elements
    const dots = document.querySelectorAll('.swiper-pagination-bullet');

    if (dots.length === 0) {
      console.error('❌ DIAGNOSTIC: No carousel dots found! This means:');
      console.error('   - JavaScript not initializing carousel');
      console.error('   - Wrong selector');
      console.error('   - Carousel library not loaded');
      return;
    }

    console.log(`✅ DIAGNOSTIC: Found ${dots.length} carousel dots`);
    console.log('🔍 DIAGNOSTIC: Applying emergency inline styles...');

    // Apply MAXIMUM visibility inline styles to each dot
    dots.forEach((dot, index) => {
      // Remove ALL existing styles first
      dot.removeAttribute('style');

      // Apply inline styles (highest specificity - will override everything)
      dot.style.cssText = `
        width: 16px !important;
        height: 16px !important;
        border-radius: 50% !important;
        background: white !important;
        opacity: 1 !important;
        display: inline-block !important;
        margin: 0 4px !important;
        cursor: pointer !important;
        border: 2px solid rgba(255,255,255,0.5) !important;
        transition: all 0.3s ease !important;
        position: relative !important;
        z-index: 1000 !important;
        box-shadow: 0 0 4px rgba(0,0,0,0.3) !important;
      `;

      // Extra styling for active dot
      if (dot.classList.contains('is-active') || dot.classList.contains('swiper-pagination-bullet-active')) {
        dot.style.background = '#007bff !important';
        dot.style.transform = 'scale(1.2) !important';
        console.log(`✅ DIAGNOSTIC: Dot ${index} is ACTIVE`);
      }

      console.log(`✅ DIAGNOSTIC: Applied inline styles to dot ${index}`, {
        classes: dot.className,
        computedWidth: window.getComputedStyle(dot).width,
        computedHeight: window.getComputedStyle(dot).height,
        computedOpacity: window.getComputedStyle(dot).opacity,
        computedBackground: window.getComputedStyle(dot).background
      });
    });

    // Also style the container
    const container = document.querySelector('.swiper-pagination');
    if (container) {
      container.style.cssText = `
        position: absolute !important;
        bottom: 20px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        z-index: 1000 !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        pointer-events: auto !important;
        background: rgba(255,0,0,0.2) !important;
        padding: 10px !important;
      `;
      console.log('✅ DIAGNOSTIC: Applied inline styles to pagination container');
      console.log('   (Red background added to container for visibility testing)');
    }

    console.log('');
    console.log('🎯 DIAGNOSTIC RESULTS:');
    console.log('='.repeat(60));
    console.log(`Total dots found: ${dots.length}`);
    console.log('Inline styles applied with !important flags');
    console.log('');
    console.log('❓ QUESTIONS FOR USER:');
    console.log('1. Do you see the dots NOW? (YES/NO)');
    console.log('2. Do you see a red background where dots should be? (YES/NO)');
    console.log('3. Open DevTools → Elements tab → Find .swiper-pagination-bullet');
    console.log('4. Check if "style" attribute is present with our inline styles');
    console.log('='.repeat(60));
  }

  // Run immediately when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Wait a bit for carousel to initialize
      setTimeout(applyInlineStylesToCarouselDots, 1000);
    });
  } else {
    // DOM already loaded
    setTimeout(applyInlineStylesToCarouselDots, 1000);
  }

  // Also expose function globally for manual testing in console
  window.applyInlineStylesToCarouselDots = applyInlineStylesToCarouselDots;
  console.log('💡 TIP: You can also run this manually by typing in console:');
  console.log('   applyInlineStylesToCarouselDots()');

})();

/**
 * BROWSER CONSOLE MANUAL TEST
 *
 * If you want to test this without adding the script file:
 *
 * 1. Open browser DevTools (F12)
 * 2. Go to Console tab
 * 3. Paste this entire code
 * 4. Press Enter
 * 5. Look at the console output
 * 6. Report back what you see
 */
