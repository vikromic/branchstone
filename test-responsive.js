const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Viewport configurations
const viewports = [
  { name: 'Mobile Small (iPhone SE)', width: 320, height: 568, isMobile: true },
  { name: 'Mobile (iPhone 12/13)', width: 375, height: 667, isMobile: true },
  { name: 'Mobile Large (iPhone 14 Pro Max)', width: 428, height: 926, isMobile: true },
  { name: 'Tablet Portrait (iPad)', width: 768, height: 1024, isMobile: false },
  { name: 'Tablet Landscape (iPad)', width: 1024, height: 768, isMobile: false },
  { name: 'Desktop (Laptop)', width: 1280, height: 720, isMobile: false },
  { name: 'Desktop Large', width: 1440, height: 900, isMobile: false },
  { name: 'Desktop XL (Full HD)', width: 1920, height: 1080, isMobile: false }
];

// Pages to test
const pages = [
  { name: 'Homepage', url: 'http://localhost:8000/index.html' },
  { name: 'Gallery', url: 'http://localhost:8000/gallery.html' },
  { name: 'About', url: 'http://localhost:8000/about.html' },
  { name: 'Contact', url: 'http://localhost:8000/contact.html' },
  { name: 'Commissions', url: 'http://localhost:8000/commissions.html' }
];

// Create screenshots directory
const screenshotsDir = path.join(__dirname, 'test-screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Test results
const results = [];

async function testPage(browser, page, viewport, pageInfo) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    isMobile: viewport.isMobile,
    hasTouch: viewport.isMobile
  });

  const browserPage = await context.newPage();
  const issues = [];

  try {
    console.log(`Testing ${pageInfo.name} at ${viewport.name} (${viewport.width}x${viewport.height})`);

    // Navigate to page
    await browserPage.goto(pageInfo.url, { waitUntil: 'networkidle' });
    await browserPage.waitForTimeout(1000); // Allow animations to complete

    // Test 1: Check for horizontal overflow
    const scrollWidth = await browserPage.evaluate(() => document.body.scrollWidth);
    const clientWidth = await browserPage.evaluate(() => window.innerWidth);

    if (scrollWidth > clientWidth) {
      issues.push({
        type: 'HORIZONTAL_OVERFLOW',
        severity: 'HIGH',
        description: `Horizontal overflow detected: body width ${scrollWidth}px > viewport ${clientWidth}px`,
        element: 'body'
      });
    }

    // Test 2: Check for text overflow
    const textOverflows = await browserPage.evaluate(() => {
      const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, a, button');
      const overflows = [];

      elements.forEach(el => {
        if (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight) {
          // Check if it's actually visible overflow (not hidden by CSS)
          const style = window.getComputedStyle(el);
          if (style.overflow !== 'hidden' && style.textOverflow !== 'ellipsis') {
            const rect = el.getBoundingClientRect();
            overflows.push({
              tag: el.tagName,
              className: el.className,
              text: el.textContent.substring(0, 50),
              scrollWidth: el.scrollWidth,
              clientWidth: el.clientWidth,
              x: Math.round(rect.x),
              y: Math.round(rect.y)
            });
          }
        }
      });

      return overflows;
    });

    if (textOverflows.length > 0) {
      textOverflows.forEach(overflow => {
        issues.push({
          type: 'TEXT_OVERFLOW',
          severity: 'MEDIUM',
          description: `Text overflow in ${overflow.tag}.${overflow.className}: "${overflow.text.substring(0, 30)}..."`,
          element: `${overflow.tag} at (${overflow.x}, ${overflow.y})`,
          details: overflow
        });
      });
    }

    // Test 3: Check images
    const imageIssues = await browserPage.evaluate(() => {
      const images = document.querySelectorAll('img');
      const issues = [];

      images.forEach(img => {
        const rect = img.getBoundingClientRect();

        // Check if image extends beyond viewport
        if (rect.right > window.innerWidth) {
          issues.push({
            type: 'image-overflow',
            src: img.src.substring(img.src.lastIndexOf('/') + 1),
            width: rect.width,
            viewportWidth: window.innerWidth
          });
        }

        // Check if image is broken
        if (!img.complete || img.naturalWidth === 0) {
          issues.push({
            type: 'broken-image',
            src: img.src
          });
        }
      });

      return issues;
    });

    imageIssues.forEach(issue => {
      issues.push({
        type: issue.type === 'image-overflow' ? 'IMAGE_OVERFLOW' : 'BROKEN_IMAGE',
        severity: issue.type === 'broken-image' ? 'HIGH' : 'MEDIUM',
        description: issue.type === 'image-overflow'
          ? `Image ${issue.src} extends beyond viewport (${issue.width}px > ${issue.viewportWidth}px)`
          : `Broken image: ${issue.src}`,
        element: `img[src="${issue.src}"]`
      });
    });

    // Test 4: Navigation check
    const navIssues = await browserPage.evaluate((isMobile) => {
      const issues = [];
      const nav = document.querySelector('nav');
      const hamburger = document.querySelector('.hamburger, .mobile-menu-toggle, [class*="menu-toggle"]');
      const navLinks = document.querySelectorAll('nav a, nav button');

      if (isMobile) {
        if (!hamburger) {
          issues.push({
            type: 'missing-mobile-nav',
            description: 'No hamburger menu found on mobile viewport'
          });
        }

        // Check if nav links are hidden on mobile
        const visibleNavLinks = Array.from(navLinks).filter(link => {
          const style = window.getComputedStyle(link);
          const parentStyle = link.parentElement ? window.getComputedStyle(link.parentElement) : null;
          return style.display !== 'none' && (!parentStyle || parentStyle.display !== 'none');
        });

        if (visibleNavLinks.length > 3 && !hamburger) {
          issues.push({
            type: 'nav-overflow',
            description: `${visibleNavLinks.length} nav links visible on mobile without hamburger menu`
          });
        }
      }

      return issues;
    }, viewport.isMobile);

    navIssues.forEach(issue => {
      issues.push({
        type: 'NAV_ISSUE',
        severity: 'MEDIUM',
        description: issue.description,
        element: 'nav'
      });
    });

    // Test 5: Touch targets on mobile
    if (viewport.isMobile) {
      const touchTargetIssues = await browserPage.evaluate(() => {
        const interactive = document.querySelectorAll('a, button, input, select, textarea, [onclick]');
        const small = [];

        interactive.forEach(el => {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);

          if (style.display !== 'none' && style.visibility !== 'hidden') {
            if (rect.width < 44 || rect.height < 44) {
              small.push({
                tag: el.tagName,
                className: el.className,
                width: Math.round(rect.width),
                height: Math.round(rect.height),
                text: el.textContent.substring(0, 30)
              });
            }
          }
        });

        return small;
      });

      touchTargetIssues.forEach(target => {
        issues.push({
          type: 'SMALL_TOUCH_TARGET',
          severity: 'MEDIUM',
          description: `Touch target too small: ${target.tag}.${target.className} (${target.width}x${target.height}px, min 44x44px)`,
          element: `${target.tag} "${target.text}"`,
          details: target
        });
      });
    }

    // Test 6: Check for overlapping elements
    const overlaps = await browserPage.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('header, nav, main, section, article, aside, footer, .card, .gallery-item'));
      const overlapping = [];

      for (let i = 0; i < elements.length; i++) {
        for (let j = i + 1; j < elements.length; j++) {
          const rect1 = elements[i].getBoundingClientRect();
          const rect2 = elements[j].getBoundingClientRect();

          // Check if rectangles overlap
          if (!(rect1.right < rect2.left ||
                rect1.left > rect2.right ||
                rect1.bottom < rect2.top ||
                rect1.top > rect2.bottom)) {

            // Check if they're not parent-child
            if (!elements[i].contains(elements[j]) && !elements[j].contains(elements[i])) {
              overlapping.push({
                element1: elements[i].tagName + (elements[i].className ? '.' + elements[i].className.split(' ')[0] : ''),
                element2: elements[j].tagName + (elements[j].className ? '.' + elements[j].className.split(' ')[0] : '')
              });
            }
          }
        }
      }

      return overlapping;
    });

    overlaps.forEach(overlap => {
      issues.push({
        type: 'OVERLAPPING_ELEMENTS',
        severity: 'MEDIUM',
        description: `Elements overlap: ${overlap.element1} and ${overlap.element2}`,
        element: `${overlap.element1} + ${overlap.element2}`
      });
    });

    // Test 7: Footer position
    const footerIssue = await browserPage.evaluate(() => {
      const footer = document.querySelector('footer');
      if (!footer) return null;

      const rect = footer.getBoundingClientRect();
      const bodyHeight = document.body.scrollHeight;

      // Check if footer is floating in middle of page
      if (rect.bottom < window.innerHeight && bodyHeight > window.innerHeight) {
        return {
          footerBottom: Math.round(rect.bottom),
          viewportHeight: window.innerHeight,
          bodyHeight: Math.round(bodyHeight)
        };
      }

      return null;
    });

    if (footerIssue) {
      issues.push({
        type: 'FOOTER_POSITION',
        severity: 'LOW',
        description: `Footer not at bottom: footer at ${footerIssue.footerBottom}px, viewport ${footerIssue.viewportHeight}px`,
        element: 'footer',
        details: footerIssue
      });
    }

    // Take screenshot if there are issues
    if (issues.length > 0) {
      const screenshotName = `${pageInfo.name.toLowerCase()}-${viewport.width}x${viewport.height}.png`;
      const screenshotPath = path.join(screenshotsDir, screenshotName);
      await browserPage.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`  ⚠️  ${issues.length} issue(s) found - screenshot saved: ${screenshotName}`);
    } else {
      console.log(`  ✓ No issues found`);
    }

    results.push({
      viewport: viewport.name,
      viewportSize: `${viewport.width}x${viewport.height}`,
      page: pageInfo.name,
      url: pageInfo.url,
      issues: issues,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`  ✗ Error testing ${pageInfo.name} at ${viewport.name}: ${error.message}`);
    results.push({
      viewport: viewport.name,
      viewportSize: `${viewport.width}x${viewport.height}`,
      page: pageInfo.name,
      url: pageInfo.url,
      issues: [{
        type: 'TEST_ERROR',
        severity: 'CRITICAL',
        description: `Test failed: ${error.message}`,
        element: 'N/A'
      }],
      timestamp: new Date().toISOString()
    });
  } finally {
    await context.close();
  }
}

async function runTests() {
  console.log('Starting comprehensive cross-device testing...\n');
  console.log(`Testing ${pages.length} pages across ${viewports.length} viewport sizes (${pages.length * viewports.length} total tests)\n`);

  const browser = await chromium.launch({ headless: true });

  // Test each page at each viewport
  for (const pageInfo of pages) {
    console.log(`\n--- Testing ${pageInfo.name} ---`);
    for (const viewport of viewports) {
      await testPage(browser, null, viewport, pageInfo);
    }
  }

  await browser.close();

  // Generate summary report
  console.log('\n\n=== TEST SUMMARY ===\n');

  const totalTests = results.length;
  const testsWithIssues = results.filter(r => r.issues.length > 0).length;
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);

  console.log(`Total tests run: ${totalTests}`);
  console.log(`Tests with issues: ${testsWithIssues}`);
  console.log(`Total issues found: ${totalIssues}\n`);

  // Group issues by severity
  const issuesBySeverity = {
    CRITICAL: [],
    HIGH: [],
    MEDIUM: [],
    LOW: []
  };

  results.forEach(result => {
    result.issues.forEach(issue => {
      issuesBySeverity[issue.severity].push({
        ...issue,
        viewport: result.viewport,
        page: result.page
      });
    });
  });

  console.log('Issues by Severity:');
  Object.keys(issuesBySeverity).forEach(severity => {
    const count = issuesBySeverity[severity].length;
    if (count > 0) {
      console.log(`  ${severity}: ${count}`);
    }
  });

  // Group issues by type
  console.log('\nIssues by Type:');
  const issuesByType = {};
  results.forEach(result => {
    result.issues.forEach(issue => {
      if (!issuesByType[issue.type]) {
        issuesByType[issue.type] = [];
      }
      issuesByType[issue.type].push({
        ...issue,
        viewport: result.viewport,
        page: result.page
      });
    });
  });

  Object.keys(issuesByType).sort().forEach(type => {
    console.log(`  ${type}: ${issuesByType[type].length}`);
  });

  // Detailed issues report
  console.log('\n\n=== DETAILED ISSUES REPORT ===\n');

  results.forEach(result => {
    if (result.issues.length > 0) {
      console.log(`\n${result.page} @ ${result.viewport} (${result.viewportSize})`);
      console.log('─'.repeat(60));
      result.issues.forEach((issue, idx) => {
        console.log(`${idx + 1}. [${issue.severity}] ${issue.type}`);
        console.log(`   ${issue.description}`);
        console.log(`   Element: ${issue.element}`);
        if (issue.details) {
          console.log(`   Details: ${JSON.stringify(issue.details)}`);
        }
        console.log('');
      });
    }
  });

  // Save JSON report
  const reportPath = path.join(__dirname, 'test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    summary: {
      totalTests,
      testsWithIssues,
      totalIssues,
      issuesBySeverity: Object.keys(issuesBySeverity).map(sev => ({
        severity: sev,
        count: issuesBySeverity[sev].length
      })),
      issuesByType: Object.keys(issuesByType).map(type => ({
        type,
        count: issuesByType[type].length
      }))
    },
    results: results,
    timestamp: new Date().toISOString()
  }, null, 2));

  console.log(`\n\nFull test results saved to: ${reportPath}`);
  console.log(`Screenshots saved to: ${screenshotsDir}`);

  // Exit with error code if critical issues found
  if (issuesBySeverity.CRITICAL.length > 0) {
    process.exit(1);
  }
}

runTests().catch(console.error);
