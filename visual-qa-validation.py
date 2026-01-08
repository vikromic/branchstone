#!/usr/bin/env python3
"""
Visual QA Validation Script for Gallery Changes
Tests gap reduction and aspect ratio fixes
"""

import asyncio
import os
from pathlib import Path
from playwright.async_api import async_playwright

GALLERY_URL = 'http://localhost:8000/gallery.html'
SCREENSHOT_DIR = Path(__file__).parent / 'visual-qa-screenshots'

# Breakpoints to test
BREAKPOINTS = [
    {'name': 'mobile-small', 'width': 375, 'height': 812},
    {'name': 'mobile-medium', 'width': 414, 'height': 896},
    {'name': 'tablet', 'width': 768, 'height': 1024},
    {'name': 'desktop-small', 'width': 1024, 'height': 768},
    {'name': 'desktop-medium', 'width': 1280, 'height': 800},
    {'name': 'desktop-large', 'width': 1920, 'height': 1080}
]

# Known artworks to verify orientation
TEST_ARTWORKS = [
    {'name': 'Born Of Burn', 'dimensions': '16 x 20 in', 'expectedOrientation': 'vertical'},
    {'name': 'By Marks and Fire', 'dimensions': '20 x 16 in', 'expectedOrientation': 'horizontal'}
]


async def ensure_screenshot_dir():
    """Create screenshot directory if it doesn't exist"""
    SCREENSHOT_DIR.mkdir(exist_ok=True)
    print(f"✓ Screenshot directory ready: {SCREENSHOT_DIR}")


async def capture_full_page_screenshot(page, filename):
    """Capture full page screenshot"""
    filepath = SCREENSHOT_DIR / filename
    await page.screenshot(path=str(filepath), full_page=True, type='png')
    print(f"  📸 Captured: {filename}")
    return filepath


async def test_breakpoint(context, breakpoint):
    """Test a specific breakpoint"""
    print(f"\n📱 Testing {breakpoint['name']} ({breakpoint['width']}x{breakpoint['height']})")

    page = await context.new_page()
    await page.set_viewport_size({'width': breakpoint['width'], 'height': breakpoint['height']})

    print('  ⏳ Loading gallery...')
    await page.goto(GALLERY_URL, wait_until='networkidle')

    # Wait for images to load
    try:
        await page.wait_for_selector('.artwork-card__image.loaded', timeout=10000)
    except Exception as e:
        print(f"  ⚠️  Warning: Timeout waiting for images: {e}")

    # Give extra time for all images to load
    await asyncio.sleep(2)

    # Capture full page
    await capture_full_page_screenshot(page, f"{breakpoint['name']}-full.png")

    # Check for visual issues
    issues = await page.evaluate("""() => {
        const problems = [];

        // Check for horizontal scroll
        if (document.documentElement.scrollWidth > window.innerWidth) {
            problems.push({
                type: 'horizontal-scroll',
                message: `Horizontal scrollbar detected (width: ${document.documentElement.scrollWidth}px vs viewport: ${window.innerWidth}px)`
            });
        }

        // Check for overlapping elements (sample check, not exhaustive)
        const cards = Array.from(document.querySelectorAll('.artwork-card')).slice(0, 10);
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
                    const title1 = cards[i].querySelector('.artwork-card__title')?.textContent;
                    const title2 = cards[j].querySelector('.artwork-card__title')?.textContent;
                    problems.push({
                        type: 'overlap',
                        message: `Cards overlap: "${title1}" and "${title2}"`
                    });
                }
            }
        }

        return problems;
    }""")

    if issues:
        print('  ⚠️  Issues detected:')
        for issue in issues:
            print(f"    - {issue['type']}: {issue['message']}")
    else:
        print('  ✅ No layout issues detected')

    # Analyze grid gaps
    gap_analysis = await page.evaluate("""() => {
        const grid = document.querySelector('.bento-grid');
        if (!grid) return null;

        const computedStyle = window.getComputedStyle(grid);
        const gap = computedStyle.gap || computedStyle.rowGap;

        return {
            gap: gap,
            gridTemplateColumns: computedStyle.gridTemplateColumns,
            gridAutoRows: computedStyle.gridAutoRows
        };
    }""")

    if gap_analysis:
        print(f"  📏 Grid configuration:")
        print(f"    - Gap: {gap_analysis['gap']}")
        print(f"    - Columns: {gap_analysis['gridTemplateColumns']}")
        print(f"    - Auto rows: {gap_analysis['gridAutoRows']}")

    await page.close()
    return {'breakpoint': breakpoint['name'], 'issues': issues}


async def test_specific_artworks(context):
    """Test specific artworks for correct orientation"""
    print('\n🎨 Testing specific artworks for orientation...')

    page = await context.new_page()
    await page.set_viewport_size({'width': 1280, 'height': 800})
    await page.goto(GALLERY_URL, wait_until='networkidle')

    try:
        await page.wait_for_selector('.artwork-card__image.loaded', timeout=10000)
    except:
        pass

    await asyncio.sleep(2)

    for artwork in TEST_ARTWORKS:
        print(f"\n  🖼️  Testing: {artwork['name']} ({artwork['dimensions']})")

        artwork_data = await page.evaluate(f"""(artworkName) => {{
            const cards = Array.from(document.querySelectorAll('.artwork-card'));
            const card = cards.find(c =>
                c.querySelector('.artwork-card__title')?.textContent === artworkName
            );

            if (!card) return null;

            const img = card.querySelector('.artwork-card__image');
            const rect = card.getBoundingClientRect();
            const imgRect = img.getBoundingClientRect();

            return {{
                cardWidth: rect.width,
                cardHeight: rect.height,
                imgWidth: imgRect.width,
                imgHeight: imgRect.height,
                aspectRatio: card.style.aspectRatio,
                objectFit: window.getComputedStyle(img).objectFit,
                dimensions: card.getAttribute('data-dimensions'),
                isVertical: rect.height > rect.width
            }};
        }}""", artwork['name'])

        if not artwork_data:
            print(f"    ❌ Artwork not found in gallery")
            continue

        print(f"    - Card dimensions: {artwork_data['cardWidth']:.0f}w x {artwork_data['cardHeight']:.0f}h")
        print(f"    - Aspect ratio: {artwork_data['aspectRatio']}")
        print(f"    - Object-fit: {artwork_data['objectFit']}")
        print(f"    - Orientation: {'vertical (taller)' if artwork_data['isVertical'] else 'horizontal (wider)'}")

        expected_vertical = artwork['expectedOrientation'] == 'vertical'
        if artwork_data['isVertical'] == expected_vertical:
            print(f"    ✅ Correct orientation!")
        else:
            print(f"    ❌ WRONG orientation! Expected {artwork['expectedOrientation']}")

        # Take a close-up screenshot of this artwork
        element = await page.query_selector(f"text={artwork['name']}")
        if element:
            # Get the parent card
            card = await element.evaluate_handle("el => el.closest('.artwork-card')")
            if card:
                filename = f"artwork-{artwork['name'].lower().replace(' ', '-')}.png"
                await card.screenshot(path=str(SCREENSHOT_DIR / filename), type='png')
                print(f"    📸 Captured close-up: {filename}")

    await page.close()


async def check_console_errors(context):
    """Check for console errors"""
    print('\n🔍 Checking for console errors...')

    page = await context.new_page()
    console_messages = []
    errors = []

    page.on('console', lambda msg: console_messages.append({'type': msg.type, 'text': msg.text}))
    page.on('pageerror', lambda error: errors.append(f"Page error: {error}"))

    await page.goto(GALLERY_URL, wait_until='networkidle')
    await asyncio.sleep(3)

    # Check console messages for errors
    for msg in console_messages:
        if msg['type'] == 'error':
            errors.append(msg['text'])

    if errors:
        print('  ❌ Console errors detected:')
        for err in errors:
            print(f"    - {err}")
    else:
        print('  ✅ No console errors')

    # Show info/log messages
    infos = [m for m in console_messages if m['type'] in ['log', 'info']]
    if infos:
        print('\n  ℹ️  Console logs:')
        for msg in infos[:5]:
            print(f"    - {msg['text']}")
        if len(infos) > 5:
            print(f"    ... and {len(infos) - 5} more")

    await page.close()
    return errors


async def measure_gap_reduction(context):
    """Measure gap sizes across breakpoints"""
    print('\n📐 Measuring gap sizes across breakpoints...')

    results = []

    for breakpoint in BREAKPOINTS:
        page = await context.new_page()
        await page.set_viewport_size({'width': breakpoint['width'], 'height': breakpoint['height']})
        await page.goto(GALLERY_URL, wait_until='networkidle')

        try:
            await page.wait_for_selector('.bento-grid', timeout=5000)
        except:
            pass

        gap_info = await page.evaluate("""() => {
            const grid = document.querySelector('.bento-grid');
            const style = window.getComputedStyle(grid);
            const gapValue = style.gap;
            const gapPx = parseFloat(gapValue);

            return {
                gap: gapValue,
                gapPx: gapPx,
                gridAutoRows: style.gridAutoRows
            };
        }""")

        result = {
            'breakpoint': breakpoint['name'],
            'width': breakpoint['width'],
            **gap_info
        }
        results.append(result)

        print(f"  {breakpoint['name']:20} gap = {gap_info['gap']:15} ({gap_info['gapPx']}px)")

        await page.close()

    return results


async def run():
    """Main execution function"""
    print('🚀 Visual QA Validation Starting...\n')
    print('Target: ' + GALLERY_URL)

    await ensure_screenshot_dir()

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(device_scale_factor=2)

        try:
            # Test 1: Check console errors
            errors = await check_console_errors(context)

            # Test 2: Measure gap reduction
            gap_results = await measure_gap_reduction(context)

            # Test 3: Test all breakpoints
            breakpoint_results = []
            for breakpoint in BREAKPOINTS:
                result = await test_breakpoint(context, breakpoint)
                breakpoint_results.append(result)

            # Test 4: Test specific artworks for orientation
            await test_specific_artworks(context)

            # Summary
            print('\n' + '=' * 60)
            print('📊 VALIDATION SUMMARY')
            print('=' * 60)

            print('\n✅ Gap Reduction Results:')
            for r in gap_results:
                print(f"  {r['breakpoint']:20} {r['gap']:15} ({r['gapPx']}px)")

            total_issues = sum(len(r['issues']) for r in breakpoint_results)
            status = '✅' if total_issues == 0 else '⚠️'
            print(f"\n{status}  Layout Issues: {total_issues} found")

            if errors:
                print(f"❌ Console Errors: {len(errors)} errors detected")
            else:
                print('✅ Console: No errors')

            print(f"\n📁 Screenshots saved to: {SCREENSHOT_DIR}")
            print('\n✨ Validation complete!\n')

        except Exception as error:
            print(f'\n❌ Validation failed: {error}')
            raise
        finally:
            await browser.close()


if __name__ == '__main__':
    try:
        asyncio.run(run())
    except KeyboardInterrupt:
        print('\n\n⚠️  Validation interrupted by user')
    except Exception as e:
        print(f'\n❌ Fatal error: {e}')
        exit(1)
