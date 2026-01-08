/**
 * Grid Validation Script
 * Run this in the browser console on http://localhost:8000/gallery.html
 * to verify the size-driven grid is working correctly
 */

(function validateGrid() {
  console.log('🔍 Gallery Grid Validation Starting...\n');

  // 1. Check grid container
  const grid = document.querySelector('.bento-grid');
  if (!grid) {
    console.error('❌ Grid container not found!');
    return;
  }
  console.log('✅ Grid container found');

  // 2. Check grid CSS properties
  const gridStyles = window.getComputedStyle(grid);
  const gridAutoRows = gridStyles.gridAutoRows;
  const gridAutoFlow = gridStyles.gridAutoFlow;
  console.log(`Grid auto-rows: ${gridAutoRows}`);
  console.log(`Grid auto-flow: ${gridAutoFlow}`);

  if (gridAutoFlow !== 'dense') {
    console.warn('⚠️  grid-auto-flow should be "dense"');
  }

  // 3. Check artwork cards
  const cards = document.querySelectorAll('.artwork-card');
  console.log(`\n📦 Found ${cards.length} artwork cards\n`);

  // 4. Count by size
  const sizeCounts = {
    small: 0,
    medium: 0,
    large: 0,
    missing: 0
  };

  cards.forEach((card, index) => {
    const size = card.getAttribute('data-size');
    if (!size) {
      sizeCounts.missing++;
      console.warn(`⚠️  Card ${index} missing data-size attribute`);
    } else {
      sizeCounts[size] = (sizeCounts[size] || 0) + 1;
    }
  });

  console.log('Size Distribution:');
  console.log(`  Small: ${sizeCounts.small}`);
  console.log(`  Medium: ${sizeCounts.medium}`);
  console.log(`  Large: ${sizeCounts.large}`);
  console.log(`  Missing: ${sizeCounts.missing}`);

  // 5. Check for overlaps (basic bounding box check)
  console.log('\n🔍 Checking for overlaps...');
  let overlapCount = 0;

  const rects = Array.from(cards).map(card => ({
    card,
    rect: card.getBoundingClientRect()
  }));

  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const r1 = rects[i].rect;
      const r2 = rects[j].rect;

      // Check if rectangles overlap
      const overlap = !(
        r1.right <= r2.left ||
        r1.left >= r2.right ||
        r1.bottom <= r2.top ||
        r1.top >= r2.bottom
      );

      if (overlap) {
        overlapCount++;
        const c1 = rects[i].card.querySelector('.artwork-card__title')?.textContent || 'Unknown';
        const c2 = rects[j].card.querySelector('.artwork-card__title')?.textContent || 'Unknown';
        console.error(`❌ OVERLAP DETECTED: "${c1}" and "${c2}"`);
      }
    }
  }

  if (overlapCount === 0) {
    console.log('✅ No overlaps detected!');
  } else {
    console.error(`❌ Found ${overlapCount} overlaps`);
  }

  // 6. Check aspect ratios are set
  console.log('\n🎨 Checking aspect ratios...');
  let aspectRatioCount = 0;

  cards.forEach(card => {
    const styles = window.getComputedStyle(card);
    if (styles.aspectRatio && styles.aspectRatio !== 'auto') {
      aspectRatioCount++;
    }
  });

  console.log(`✅ ${aspectRatioCount}/${cards.length} cards have aspect-ratio set`);

  // 7. Check grid row spans
  console.log('\n📏 Checking grid row spans...');

  cards.forEach((card, index) => {
    const size = card.getAttribute('data-size');
    const styles = window.getComputedStyle(card);
    const gridRow = styles.gridRow || styles.gridRowEnd;

    if (index < 5) {
      console.log(`Card ${index} (${size}): grid-row = ${gridRow}`);
    }
  });

  console.log('\n✅ Validation Complete!');
  console.log('\nExpected counts (from artworks.json):');
  console.log('  Small: 9, Medium: 15, Large: 5, Empty->Medium: 1');
})();
