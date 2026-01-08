/**
 * Visual QA Validation Script for Gallery Changes
 * Tests gap reduction and aspect ratio fixes
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

const GALLERY_URL = 'http://localhost:8000/gallery.html';
const SCREENSHOT_DIR = path.join(__dirname, 'visual-qa-screenshots');

// Breakpoints to test
const BREAKPOINTS = [
  { name: 'mobile-small', width: 375, height: 812 },
  { name: 'mobile-medium', width: 414, height: 896 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop-small', width: 1024, height: 768 },
  { name: 'desktop-medium', width: 1280, height: 800 },
  { name: 'desktop-large', width: 1920, height: 1080 }
];

// Known artworks to verify orientation
const TEST_ARTWORKS = [
  { name: 'Born Of Burn', dimensions: '16 x 20 in', expectedOrientation: 'vertical' },
  { name: 'By Marks and Fire', dimensions: '20 x 16 in', expectedOrientation: 'horizontal' }
];

async function ensureScreenshotDir() {
  try {
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });
    console.log(`✓ Screenshot directory ready: ${SCREENSHOT_DIR}`);
  } catch (error) {
    console.error('Failed to create screenshot directory:', error);
    throw error;
  }
}

async function captureFullPageScreenshot(page, filename) {
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({
    path: filepath,
    fullPage: true,
    type: 'png'
  });
  console.log(`  📸 Captured: ${filename}`);
  return filepath;
}

async function testBreakpoint(browser, breakpoint) {
  console.log(`\n📱 Testing ${breakpoint.name} (${breakpoint.width}x${breakpoint.height})`);

  const page = await browser.newPage();
  await page.setViewport({
    width: breakpoint.width,
    height: breakpoint.height,
    deviceScaleFactor: 2
  });

  console.log('  ⏳ Loading gallery...');
  await page.goto(GALLERY_URL, { waitUntil: 'networkidle0' });

  // Wait for images to load
  await page.waitForSelector('.artwork-card__image.loaded', { timeout: 10000 });

  // Give extra time for all images to load
  await page.waitForTimeout(2000);

  // Capture full page
  await captureFullPageScreenshot(page, `${breakpoint.name}-full.png`);

  // Check for visual issues
  const issues = await page.evaluate(() => {
    const problems = [];

    // Check for horizontal scroll
    if (document.documentElement.scrollWidth > window.innerWidth) {
      problems.push({
        type: 'horizontal-scroll',
        message: `Horizontal scrollbar detected (width: ${document.documentElement.scrollWidth}px vs viewport: ${window.innerWidth}px)`
      });
    }

    // Check for overlapping elements
    const cards = Array.from(document.querySelectorAll('.artwork-card'));
    for (let i = 0; i < cards.length; i++) {
      for (let j = i + 1; j < cards.length; j++) {
        const rect1 = cards[i].getBoundingClientRect();
        const rect2 = cards[j].getBoundingClientRect();

        // Check if rectangles overlap (with 5px tolerance)
        const overlaps = !(
          rect1.right < rect2.left - 5 ||
          rect1.left > rect2.right + 5 ||
          rect1.bottom < rect2.top - 5 ||
          rect1.top > rect2.bottom + 5
        );

        if (overlaps) {
          problems.push({
            type: 'overlap',
            message: `Cards overlap: "${cards[i].querySelector('.artwork-card__title')?.textContent}" and "${cards[j].querySelector('.artwork-card__title')?.textContent}"`
          });
        }
      }
    }

    // Check for console errors
    return problems;
  });

  if (issues.length > 0) {
    console.log('  ⚠️  Issues detected:');
    issues.forEach(issue => console.log(`    - ${issue.type}: ${issue.message}`));
  } else {
    console.log('  ✅ No layout issues detected');
  }

  // Analyze grid gaps
  const gapAnalysis = await page.evaluate(() => {
    const grid = document.querySelector('.bento-grid');
    if (!grid) return null;

    const computedStyle = window.getComputedStyle(grid);
    const gap = computedStyle.gap || computedStyle.rowGap;

    return {
      gap,
      gridTemplateColumns: computedStyle.gridTemplateColumns,
      gridAutoRows: computedStyle.gridAutoRows
    };
  });

  if (gapAnalysis) {
    console.log(`  📏 Grid configuration:`);
    console.log(`    - Gap: ${gapAnalysis.gap}`);
    console.log(`    - Columns: ${gapAnalysis.gridTemplateColumns}`);
    console.log(`    - Auto rows: ${gapAnalysis.gridAutoRows}`);
  }

  await page.close();
  return { breakpoint: breakpoint.name, issues };
}

async function testSpecificArtworks(browser) {
  console.log('\n🎨 Testing specific artworks for orientation...');

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
  await page.goto(GALLERY_URL, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.artwork-card__image.loaded', { timeout: 10000 });
  await page.waitForTimeout(2000);

  for (const artwork of TEST_ARTWORKS) {
    console.log(`\n  🖼️  Testing: ${artwork.name} (${artwork.dimensions})`);

    const artworkData = await page.evaluate((artworkName) => {
      const cards = Array.from(document.querySelectorAll('.artwork-card'));
      const card = cards.find(c =>
        c.querySelector('.artwork-card__title')?.textContent === artworkName
      );

      if (!card) return null;

      const img = card.querySelector('.artwork-card__image');
      const rect = card.getBoundingClientRect();
      const imgRect = img.getBoundingClientRect();

      return {
        cardWidth: rect.width,
        cardHeight: rect.height,
        imgWidth: imgRect.width,
        imgHeight: imgRect.height,
        aspectRatio: card.style.aspectRatio,
        objectFit: window.getComputedStyle(img).objectFit,
        dimensions: card.getAttribute('data-dimensions'),
        isVertical: rect.height > rect.width
      };
    }, artwork.name);

    if (!artworkData) {
      console.log(`    ❌ Artwork not found in gallery`);
      continue;
    }

    console.log(`    - Card dimensions: ${artworkData.cardWidth.toFixed(0)}w x ${artworkData.cardHeight.toFixed(0)}h`);
    console.log(`    - Aspect ratio: ${artworkData.aspectRatio}`);
    console.log(`    - Object-fit: ${artworkData.objectFit}`);
    console.log(`    - Orientation: ${artworkData.isVertical ? 'vertical (taller)' : 'horizontal (wider)'}`);

    const expectedVertical = artwork.expectedOrientation === 'vertical';
    if (artworkData.isVertical === expectedVertical) {
      console.log(`    ✅ Correct orientation!`);
    } else {
      console.log(`    ❌ WRONG orientation! Expected ${artwork.expectedOrientation}`);
    }

    // Take a close-up screenshot of this artwork
    const element = await page.evaluateHandle((artworkName) => {
      const cards = Array.from(document.querySelectorAll('.artwork-card'));
      return cards.find(c =>
        c.querySelector('.artwork-card__title')?.textContent === artworkName
      );
    }, artwork.name);

    if (element) {
      const filename = `artwork-${artwork.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      await element.asElement().screenshot({
        path: path.join(SCREENSHOT_DIR, filename),
        type: 'png'
      });
      console.log(`    📸 Captured close-up: ${filename}`);
    }
  }

  await page.close();
}

async function checkConsoleErrors(browser) {
  console.log('\n🔍 Checking for console errors...');

  const page = await browser.newPage();
  const consoleMessages = [];
  const errors = [];

  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    errors.push(`Page error: ${error.message}`);
  });

  await page.goto(GALLERY_URL, { waitUntil: 'networkidle0' });
  await page.waitForTimeout(3000);

  if (errors.length > 0) {
    console.log('  ❌ Console errors detected:');
    errors.forEach(err => console.log(`    - ${err}`));
  } else {
    console.log('  ✅ No console errors');
  }

  // Show info/log messages
  const infos = consoleMessages.filter(m => m.type === 'log' || m.type === 'info');
  if (infos.length > 0) {
    console.log('\n  ℹ️  Console logs:');
    infos.slice(0, 5).forEach(msg => console.log(`    - ${msg.text}`));
    if (infos.length > 5) {
      console.log(`    ... and ${infos.length - 5} more`);
    }
  }

  await page.close();
  return errors;
}

async function measureGapReduction(browser) {
  console.log('\n📐 Measuring gap sizes across breakpoints...');

  const results = [];

  for (const breakpoint of BREAKPOINTS) {
    const page = await browser.newPage();
    await page.setViewport({ width: breakpoint.width, height: breakpoint.height });
    await page.goto(GALLERY_URL, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.bento-grid', { timeout: 5000 });

    const gapInfo = await page.evaluate(() => {
      const grid = document.querySelector('.bento-grid');
      const style = window.getComputedStyle(grid);
      const gapValue = style.gap;
      const gapPx = parseFloat(gapValue);

      return {
        gap: gapValue,
        gapPx,
        gridAutoRows: style.gridAutoRows
      };
    });

    results.push({
      breakpoint: breakpoint.name,
      width: breakpoint.width,
      ...gapInfo
    });

    console.log(`  ${breakpoint.name} (${breakpoint.width}px): gap = ${gapInfo.gap} (${gapInfo.gapPx}px)`);

    await page.close();
  }

  return results;
}

async function run() {
  console.log('🚀 Visual QA Validation Starting...\n');
  console.log('Target: ' + GALLERY_URL);

  await ensureScreenshotDir();

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    // Test 1: Check console errors
    const errors = await checkConsoleErrors(browser);

    // Test 2: Measure gap reduction
    const gapResults = await measureGapReduction(browser);

    // Test 3: Test all breakpoints
    const breakpointResults = [];
    for (const breakpoint of BREAKPOINTS) {
      const result = await testBreakpoint(browser, breakpoint);
      breakpointResults.push(result);
    }

    // Test 4: Test specific artworks for orientation
    await testSpecificArtworks(browser);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 VALIDATION SUMMARY');
    console.log('='.repeat(60));

    console.log('\n✅ Gap Reduction Results:');
    gapResults.forEach(r => {
      console.log(`  ${r.breakpoint.padEnd(20)} ${r.gap.padEnd(15)} (${r.gapPx}px)`);
    });

    const totalIssues = breakpointResults.reduce((sum, r) => sum + r.issues.length, 0);
    console.log(`\n${totalIssues === 0 ? '✅' : '⚠️'}  Layout Issues: ${totalIssues} found`);

    if (errors.length > 0) {
      console.log(`❌ Console Errors: ${errors.length} errors detected`);
    } else {
      console.log('✅ Console: No errors');
    }

    console.log(`\n📁 Screenshots saved to: ${SCREENSHOT_DIR}`);
    console.log('\n✨ Validation complete!\n');

  } catch (error) {
    console.error('\n❌ Validation failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the validation
run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
