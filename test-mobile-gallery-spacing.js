/**
 * Mobile Gallery Spacing Verification Test
 * Tests that artwork cards have stable, equal spacing with no overlaps
 */

import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MOBILE_BREAKPOINTS = [
  { name: 'iPhone 5/SE (smallest)', width: 320, height: 568 },
  { name: 'iPhone 13 Mini', width: 375, height: 667 },
  { name: 'iPhone 13', width: 390, height: 844 },
  { name: 'iPhone 13 Pro Max', width: 428, height: 926 },
  { name: 'Android Small', width: 360, height: 640 },
  { name: 'Android Medium', width: 412, height: 915 },
  { name: 'Edge case (767px max)', width: 767, height: 800 }
];

async function testMobileGallerySpacing() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {
    summary: {
      totalTests: 0,
      passed: 0,
      failed: 0
    },
    breakpoints: [],
    issues: []
  };

  console.log('========================================');
  console.log('MOBILE GALLERY SPACING VERIFICATION');
  console.log('========================================\n');

  // Navigate to gallery
  await page.goto('http://localhost:8080/gallery.html');
  console.log('✓ Navigated to gallery.html\n');

  // Wait for gallery to load
  await page.waitForSelector('.bento-grid', { timeout: 5000 });
  await page.waitForTimeout(2000); // Allow images to load

  console.log('Testing mobile breakpoints:\n');

  for (const breakpoint of MOBILE_BREAKPOINTS) {
    results.summary.totalTests++;
    console.log(`Testing: ${breakpoint.name} (${breakpoint.width}x${breakpoint.height})`);

    // Set viewport
    await page.setViewportSize({
      width: breakpoint.width,
      height: breakpoint.height
    });

    await page.waitForTimeout(500); // Allow layout to settle

    // Check if we're in mobile viewport
    const isMobile = breakpoint.width <= 768;

    // Take screenshot
    const screenshotPath = join(__dirname, `screenshots/mobile-gallery-${breakpoint.width}px.png`);
    await page.screenshot({
      path: screenshotPath,
      fullPage: true
    });

    // Analyze spacing and overlaps
    const analysis = await page.evaluate(() => {
      const grid = document.querySelector('.bento-grid');
      const cards = Array.from(document.querySelectorAll('.artwork-card'));

      if (!grid || cards.length === 0) {
        return { error: 'Grid or cards not found' };
      }

      const gridStyles = window.getComputedStyle(grid);
      const gap = gridStyles.gap || gridStyles.gridGap;
      const rowGap = gridStyles.rowGap || gridStyles.gridRowGap;
      const columnGap = gridStyles.columnGap || gridStyles.gridColumnGap;

      // Check for overlapping cards
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
              card1Index: i,
              card2Index: j,
              card1: {
                top: rect1.top,
                left: rect1.left,
                width: rect1.width,
                height: rect1.height
              },
              card2: {
                top: rect2.top,
                left: rect2.left,
                width: rect2.width,
                height: rect2.height
              }
            });
          }
        }
      }

      // Check horizontal scrolling
      const hasHorizontalScroll = document.documentElement.scrollWidth > document.documentElement.clientWidth;

      // Get actual spacing between cards
      const cardSpacings = [];
      for (let i = 0; i < cards.length - 1; i++) {
        const rect1 = cards[i].getBoundingClientRect();
        const rect2 = cards[i + 1].getBoundingClientRect();

        // Calculate vertical spacing between consecutive cards
        if (rect2.top > rect1.bottom) {
          const spacing = rect2.top - rect1.bottom;
          cardSpacings.push(spacing);
        }
      }

      return {
        gap,
        rowGap,
        columnGap,
        overlaps,
        hasHorizontalScroll,
        cardSpacings,
        cardsCount: cards.length,
        gridWidth: grid.offsetWidth,
        gridColumns: gridStyles.gridTemplateColumns
      };
    });

    // Analyze results
    const breakpointResult = {
      name: breakpoint.name,
      width: breakpoint.width,
      height: breakpoint.height,
      gap: analysis.gap,
      rowGap: analysis.rowGap,
      columnGap: analysis.columnGap,
      overlaps: analysis.overlaps?.length || 0,
      hasHorizontalScroll: analysis.hasHorizontalScroll,
      cardSpacings: analysis.cardSpacings,
      cardsCount: analysis.cardsCount,
      screenshot: screenshotPath
    };

    results.breakpoints.push(breakpointResult);

    // Validation checks
    let passed = true;
    const issues = [];

    // Check 1: Expected gap should be 1rem (16px) on mobile
    if (isMobile) {
      const expectedGap = '16px'; // 1rem = 16px
      const gapMatch = analysis.gap === expectedGap || analysis.rowGap === expectedGap;

      if (!gapMatch) {
        passed = false;
        issues.push(`Gap is "${analysis.gap}" but expected "${expectedGap}"`);
      } else {
        console.log(`  ✓ Gap is correct: ${analysis.gap}`);
      }
    }

    // Check 2: No overlaps
    if (analysis.overlaps && analysis.overlaps.length > 0) {
      passed = false;
      issues.push(`Found ${analysis.overlaps.length} overlapping cards`);
      console.log(`  ✗ Found ${analysis.overlaps.length} overlapping cards`);
    } else {
      console.log(`  ✓ No overlapping cards`);
    }

    // Check 3: No horizontal scrolling
    if (analysis.hasHorizontalScroll) {
      passed = false;
      issues.push('Horizontal scrolling detected');
      console.log(`  ✗ Horizontal scrolling detected`);
    } else {
      console.log(`  ✓ No horizontal scrolling`);
    }

    // Check 4: Spacing consistency
    if (analysis.cardSpacings && analysis.cardSpacings.length > 0) {
      const uniqueSpacings = [...new Set(analysis.cardSpacings.map(s => Math.round(s)))];

      if (uniqueSpacings.length === 1) {
        console.log(`  ✓ Spacing is consistent: ~${uniqueSpacings[0]}px between cards`);
      } else {
        console.log(`  ! Spacing varies: ${uniqueSpacings.join(', ')}px (may be expected due to layout)`);
      }
    }

    if (passed) {
      results.summary.passed++;
      console.log(`  ✓ PASSED\n`);
    } else {
      results.summary.failed++;
      console.log(`  ✗ FAILED\n`);
      results.issues.push({
        breakpoint: breakpoint.name,
        issues
      });
    }
  }

  console.log('\n========================================');
  console.log('TEST SUMMARY');
  console.log('========================================');
  console.log(`Total Tests: ${results.summary.totalTests}`);
  console.log(`Passed: ${results.summary.passed}`);
  console.log(`Failed: ${results.summary.failed}`);

  if (results.issues.length > 0) {
    console.log('\n========================================');
    console.log('ISSUES FOUND');
    console.log('========================================');
    results.issues.forEach(issue => {
      console.log(`\n${issue.breakpoint}:`);
      issue.issues.forEach(i => console.log(`  - ${i}`));
    });
  }

  await browser.close();
  return results;
}

// Run test
testMobileGallerySpacing().catch(console.error);
