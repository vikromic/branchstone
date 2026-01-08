/**
 * Visual QA Console Helpers
 *
 * Paste these functions into the browser console while testing gallery.html
 * to automatically check for common visual issues.
 *
 * Usage:
 * 1. Open /docs/gallery.html in browser
 * 2. Open DevTools Console (Cmd+Option+J or F12 → Console tab)
 * 3. Copy and paste this entire file into the console
 * 4. Run individual checks or runAllChecks()
 */

// ============================================
// LAYOUT CHECKS
// ============================================

/**
 * Check for overlapping elements in the gallery grid
 * Returns array of overlapping element pairs
 */
function checkForOverlaps() {
  console.log('🔍 Checking for overlapping cards...');

  const cards = Array.from(document.querySelectorAll('.artwork-card'));
  const overlaps = [];

  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const rect1 = cards[i].getBoundingClientRect();
      const rect2 = cards[j].getBoundingClientRect();

      // Check if rectangles overlap
      const isOverlapping = !(
        rect1.right < rect2.left ||
        rect1.left > rect2.right ||
        rect1.bottom < rect2.top ||
        rect1.top > rect2.bottom
      );

      if (isOverlapping) {
        overlaps.push({
          card1: cards[i].querySelector('.artwork-card__title')?.textContent || `Card ${i}`,
          card2: cards[j].querySelector('.artwork-card__title')?.textContent || `Card ${j}`,
          overlap: {
            horizontal: Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left),
            vertical: Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top)
          }
        });
      }
    }
  }

  if (overlaps.length === 0) {
    console.log('✅ No overlapping cards found');
  } else {
    console.error(`❌ Found ${overlaps.length} overlapping card pairs:`, overlaps);
  }

  return overlaps;
}

/**
 * Check grid alignment and consistency
 */
function checkGridAlignment() {
  console.log('🔍 Checking grid alignment...');

  const grid = document.querySelector('.bento-grid');
  if (!grid) {
    console.error('❌ Gallery grid not found');
    return null;
  }

  const computedStyle = window.getComputedStyle(grid);
  const cards = document.querySelectorAll('.artwork-card');

  const report = {
    columns: computedStyle.gridTemplateColumns,
    gap: computedStyle.gap,
    rowGap: computedStyle.rowGap,
    columnGap: computedStyle.columnGap,
    autoRows: computedStyle.gridAutoRows,
    cardCount: cards.length
  };

  console.log('Grid properties:', report);

  // Check aspect ratios
  const aspectRatios = Array.from(cards).map(card => {
    const rect = card.getBoundingClientRect();
    const ratio = rect.width / rect.height;
    return {
      element: card.querySelector('.artwork-card__title')?.textContent || 'Unknown',
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      ratio: ratio.toFixed(2),
      expectedRatio: '1.33' // 4:3 = 1.333...
    };
  });

  // Check if all ratios are close to 4:3
  const inconsistentRatios = aspectRatios.filter(item => {
    const diff = Math.abs(parseFloat(item.ratio) - 1.33);
    return diff > 0.1; // Allow 0.1 tolerance
  });

  if (inconsistentRatios.length > 0) {
    console.warn(`⚠️ ${inconsistentRatios.length} cards with inconsistent aspect ratios:`, inconsistentRatios);
  } else {
    console.log('✅ All cards maintain 4:3 aspect ratio');
  }

  return { grid: report, aspectRatios, inconsistentRatios };
}

/**
 * Check for horizontal overflow (scrolling)
 */
function checkHorizontalScroll() {
  console.log('🔍 Checking for horizontal scroll...');

  const bodyWidth = document.body.scrollWidth;
  const viewportWidth = document.documentElement.clientWidth;

  if (bodyWidth > viewportWidth) {
    const overflow = bodyWidth - viewportWidth;
    console.error(`❌ Horizontal overflow detected: ${overflow}px`);

    // Find elements wider than viewport
    const wideElements = Array.from(document.querySelectorAll('*')).filter(el => {
      const rect = el.getBoundingClientRect();
      return rect.right > viewportWidth;
    }).map(el => ({
      tag: el.tagName,
      class: el.className,
      width: Math.round(el.getBoundingClientRect().width),
      overflow: Math.round(el.getBoundingClientRect().right - viewportWidth)
    }));

    console.log('Elements causing overflow:', wideElements);
    return { hasOverflow: true, overflow, wideElements };
  } else {
    console.log('✅ No horizontal scroll detected');
    return { hasOverflow: false };
  }
}

// ============================================
// IMAGE CHECKS
// ============================================

/**
 * Check image loading states and aspect ratios
 */
function checkImages() {
  console.log('🔍 Checking images...');

  const images = Array.from(document.querySelectorAll('.artwork-card__image'));

  const report = {
    total: images.length,
    loaded: 0,
    loading: 0,
    broken: 0,
    distorted: []
  };

  images.forEach(img => {
    // Check loading state
    if (img.hasAttribute('data-loading')) {
      report.loading++;
    } else if (img.complete && img.naturalWidth > 0) {
      report.loaded++;
    } else if (img.complete && img.naturalWidth === 0) {
      report.broken++;
    }

    // Check for distortion
    if (img.complete && img.naturalWidth > 0) {
      const naturalRatio = img.naturalWidth / img.naturalHeight;
      const displayRatio = img.width / img.height;
      const diff = Math.abs(naturalRatio - displayRatio);

      if (diff > 0.1) {
        report.distorted.push({
          src: img.src.split('/').pop(),
          natural: `${img.naturalWidth}×${img.naturalHeight}`,
          display: `${img.width}×${img.height}`,
          naturalRatio: naturalRatio.toFixed(2),
          displayRatio: displayRatio.toFixed(2),
          difference: diff.toFixed(2)
        });
      }
    }
  });

  console.log('Image report:', report);

  if (report.broken > 0) {
    console.error(`❌ ${report.broken} broken images found`);
  }
  if (report.distorted.length > 0) {
    console.warn(`⚠️ ${report.distorted.length} distorted images:`, report.distorted);
  }
  if (report.loading > 0) {
    console.log(`⏳ ${report.loading} images still loading`);
  }
  if (report.loaded === report.total && report.broken === 0 && report.distorted.length === 0) {
    console.log('✅ All images loaded correctly without distortion');
  }

  return report;
}

// ============================================
// SPACING CHECKS
// ============================================

/**
 * Analyze spacing consistency
 */
function checkSpacing() {
  console.log('🔍 Checking spacing consistency...');

  const cards = document.querySelectorAll('.artwork-card');
  const spacingValues = {
    margins: new Set(),
    paddings: new Set(),
    gaps: new Set()
  };

  cards.forEach(card => {
    const style = window.getComputedStyle(card);
    spacingValues.margins.add(style.marginTop);
    spacingValues.margins.add(style.marginBottom);
    spacingValues.paddings.add(style.paddingTop);
    spacingValues.paddings.add(style.paddingBottom);
  });

  const grid = document.querySelector('.bento-grid');
  if (grid) {
    const gridStyle = window.getComputedStyle(grid);
    spacingValues.gaps.add(gridStyle.gap);
    spacingValues.gaps.add(gridStyle.rowGap);
  }

  const report = {
    uniqueMargins: Array.from(spacingValues.margins).filter(v => v !== '0px'),
    uniquePaddings: Array.from(spacingValues.paddings).filter(v => v !== '0px'),
    uniqueGaps: Array.from(spacingValues.gaps).filter(v => v !== 'normal')
  };

  console.log('Spacing values:', report);

  // Too many unique values might indicate inconsistency
  if (report.uniqueMargins.length > 5) {
    console.warn(`⚠️ Many unique margin values (${report.uniqueMargins.length}) - may indicate inconsistent spacing`);
  }
  if (report.uniquePaddings.length > 5) {
    console.warn(`⚠️ Many unique padding values (${report.uniquePaddings.length}) - may indicate inconsistent spacing`);
  }

  return report;
}

// ============================================
// DESIGN SYSTEM CHECKS
// ============================================

/**
 * Extract and analyze design tokens
 */
function analyzeDesignTokens() {
  console.log('🔍 Analyzing design token usage...');

  const elements = document.querySelectorAll('.artwork-card, .filter-controls .tag, .bento-grid');
  const tokens = {
    colors: new Set(),
    fontSizes: new Set(),
    fontWeights: new Set(),
    borderRadii: new Set()
  };

  elements.forEach(el => {
    const style = window.getComputedStyle(el);
    tokens.colors.add(style.color);
    tokens.colors.add(style.backgroundColor);
    tokens.fontSizes.add(style.fontSize);
    tokens.fontWeights.add(style.fontWeight);
    tokens.borderRadii.add(style.borderRadius);
  });

  const report = {
    colors: Array.from(tokens.colors).filter(c => c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent'),
    fontSizes: Array.from(tokens.fontSizes),
    fontWeights: Array.from(tokens.fontWeights),
    borderRadii: Array.from(tokens.borderRadii).filter(r => r !== '0px')
  };

  console.log('Design tokens:', report);

  // A good design system should have limited unique values
  if (report.colors.length > 15) {
    console.warn(`⚠️ Many unique colors (${report.colors.length}) - consider consolidating`);
  }
  if (report.fontSizes.length > 8) {
    console.warn(`⚠️ Many font sizes (${report.fontSizes.length}) - consider using type scale`);
  }

  return report;
}

// ============================================
// FILTER ANIMATION CHECKS
// ============================================

/**
 * Test filter animation stability
 * This will cycle through filters and check for issues
 */
function testFilterAnimations() {
  console.log('🔍 Testing filter animations...');
  console.log('This will cycle through filters - watch for visual issues');

  const filterButtons = document.querySelectorAll('[data-filter]');
  if (filterButtons.length === 0) {
    console.error('❌ No filter buttons found');
    return;
  }

  let currentIndex = 0;
  const interval = setInterval(() => {
    if (currentIndex >= filterButtons.length) {
      clearInterval(interval);
      console.log('✅ Filter animation test complete');

      // Final check
      setTimeout(() => {
        const overlaps = checkForOverlaps();
        if (overlaps.length === 0) {
          console.log('✅ No overlaps after filter cycling');
        } else {
          console.error('❌ Overlaps detected after filter cycling!');
        }
      }, 1000);

      return;
    }

    const button = filterButtons[currentIndex];
    console.log(`Clicking filter: ${button.textContent.trim()}`);
    button.click();
    currentIndex++;
  }, 1500); // 1.5s between clicks to allow animations to complete
}

// ============================================
// HOVER STATE CHECKS
// ============================================

/**
 * Check hover overlay positioning
 */
function checkHoverOverlays() {
  console.log('🔍 Checking hover overlay positioning...');
  console.log('Move your mouse over cards to test hover states');
  console.log('Overlays should stay within card bounds and not cause reflow');

  const cards = document.querySelectorAll('.artwork-card');

  cards.forEach((card, index) => {
    card.addEventListener('mouseenter', function checkOverlay() {
      const cardRect = card.getBoundingClientRect();
      const overlay = card.querySelector('.artwork-card__overlay');

      if (overlay) {
        const overlayRect = overlay.getBoundingClientRect();

        const issues = [];
        if (overlayRect.left < cardRect.left) issues.push('left overflow');
        if (overlayRect.right > cardRect.right) issues.push('right overflow');
        if (overlayRect.top < cardRect.top) issues.push('top overflow');
        if (overlayRect.bottom > cardRect.bottom) issues.push('bottom overflow');

        if (issues.length > 0) {
          console.error(`❌ Card ${index} hover overlay issues:`, issues);
        }
      }

      // Remove listener after first check
      card.removeEventListener('mouseenter', checkOverlay);
    });
  });
}

// ============================================
// REDUCED MOTION CHECK
// ============================================

/**
 * Check if reduced motion preference is respected
 */
function checkReducedMotion() {
  console.log('🔍 Checking reduced motion support...');

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  console.log(`Prefers reduced motion: ${prefersReducedMotion}`);

  if (prefersReducedMotion) {
    console.log('To test: Click filters and observe - transitions should be instant');
  } else {
    console.log('To test: Enable "Emulate CSS media feature prefers-reduced-motion" in DevTools > Rendering panel');
  }

  return prefersReducedMotion;
}

// ============================================
// ACCESSIBILITY CHECKS
// ============================================

/**
 * Check basic accessibility issues
 */
function checkAccessibility() {
  console.log('🔍 Checking accessibility...');

  const issues = [];

  // Check for missing alt text
  const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
  if (imagesWithoutAlt.length > 0) {
    issues.push(`${imagesWithoutAlt.length} images missing alt text`);
  }

  // Check for buttons without labels
  const buttonsWithoutLabel = Array.from(document.querySelectorAll('button')).filter(btn => {
    return !btn.textContent.trim() && !btn.getAttribute('aria-label');
  });
  if (buttonsWithoutLabel.length > 0) {
    issues.push(`${buttonsWithoutLabel.length} buttons without labels`);
  }

  // Check for interactive elements with tabindex=-1
  const noTabindex = document.querySelectorAll('button[tabindex="-1"], a[tabindex="-1"]');
  if (noTabindex.length > 0) {
    console.warn(`⚠️ ${noTabindex.length} interactive elements with tabindex="-1" (not keyboard accessible)`);
  }

  if (issues.length > 0) {
    console.error('❌ Accessibility issues found:', issues);
  } else {
    console.log('✅ Basic accessibility checks passed');
  }

  return issues;
}

// ============================================
// COMPREHENSIVE TEST RUNNER
// ============================================

/**
 * Run all checks
 */
function runAllChecks() {
  console.clear();
  console.log('═══════════════════════════════════════════════════════');
  console.log('  GALLERY VISUAL QA - AUTOMATED CHECKS');
  console.log('═══════════════════════════════════════════════════════\n');

  const results = {};

  console.log('\n--- LAYOUT CHECKS ---\n');
  results.overlaps = checkForOverlaps();
  results.grid = checkGridAlignment();
  results.horizontalScroll = checkHorizontalScroll();

  console.log('\n--- IMAGE CHECKS ---\n');
  results.images = checkImages();

  console.log('\n--- SPACING CHECKS ---\n');
  results.spacing = checkSpacing();

  console.log('\n--- DESIGN SYSTEM ---\n');
  results.designTokens = analyzeDesignTokens();

  console.log('\n--- ACCESSIBILITY ---\n');
  results.accessibility = checkAccessibility();

  console.log('\n--- REDUCED MOTION ---\n');
  results.reducedMotion = checkReducedMotion();

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  SUMMARY');
  console.log('═══════════════════════════════════════════════════════\n');

  // Summary
  let criticalIssues = 0;
  let warnings = 0;

  if (results.overlaps.length > 0) criticalIssues++;
  if (results.horizontalScroll.hasOverflow) criticalIssues++;
  if (results.images.broken > 0) criticalIssues++;
  if (results.images.distorted.length > 0) warnings++;
  if (results.accessibility.length > 0) criticalIssues++;

  console.log(`Critical Issues: ${criticalIssues}`);
  console.log(`Warnings: ${warnings}`);

  if (criticalIssues === 0 && warnings === 0) {
    console.log('\n✅ ALL AUTOMATED CHECKS PASSED!');
  } else if (criticalIssues === 0) {
    console.log('\n⚠️ No critical issues, but some warnings to review');
  } else {
    console.log('\n❌ Critical issues found - review details above');
  }

  console.log('\n═══════════════════════════════════════════════════════\n');

  console.log('MANUAL TESTS TO PERFORM:');
  console.log('1. Test hover states - run checkHoverOverlays()');
  console.log('2. Test filter animations - run testFilterAnimations()');
  console.log('3. Test at different breakpoints (resize window)');
  console.log('4. Test dark mode toggle');
  console.log('5. Test rapid filter toggling manually');
  console.log('6. Test keyboard navigation (Tab through elements)');

  return results;
}

// ============================================
// VIEWPORT HELPER
// ============================================

/**
 * Get current viewport info
 */
function getViewportInfo() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;

  let breakpoint = 'Unknown';
  if (width < 640) breakpoint = 'Mobile (1-column)';
  else if (width >= 640 && width < 768) breakpoint = 'Small Tablet (2-column)';
  else if (width >= 768 && width < 1024) breakpoint = 'Tablet (3-column)';
  else breakpoint = 'Desktop (4-column)';

  const info = {
    width,
    height,
    devicePixelRatio: dpr,
    breakpoint,
    orientation: width > height ? 'landscape' : 'portrait'
  };

  console.log('Current Viewport:', info);
  return info;
}

// ============================================
// EXPORT FOR CONSOLE
// ============================================

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║  GALLERY VISUAL QA CONSOLE HELPERS LOADED               ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');
console.log('Available functions:');
console.log('  • runAllChecks()           - Run all automated checks');
console.log('  • checkForOverlaps()       - Check for overlapping cards');
console.log('  • checkGridAlignment()     - Verify grid layout');
console.log('  • checkHorizontalScroll()  - Check for overflow');
console.log('  • checkImages()            - Validate images');
console.log('  • checkSpacing()           - Analyze spacing consistency');
console.log('  • analyzeDesignTokens()    - Check design system usage');
console.log('  • testFilterAnimations()   - Cycle through filters');
console.log('  • checkHoverOverlays()     - Monitor hover states');
console.log('  • checkAccessibility()     - Basic a11y checks');
console.log('  • checkReducedMotion()     - Verify reduced motion support');
console.log('  • getViewportInfo()        - Show current viewport info');
console.log('\n👉 Start with: runAllChecks()\n');
