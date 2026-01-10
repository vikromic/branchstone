# Carousel Dot Debug Instructions

## What Changed

Added comprehensive debug logging to `/Users/vik/Workspace/branchstone/docs/js/artwork-modal.js` to track what's actually happening with carousel dots.

## Files Modified
- `/Users/vik/Workspace/branchstone/docs/js/artwork-modal.js`

## Debug Logging Added

The following methods now have extensive console logging:

1. **`updateCarouselDots()`** - Shows:
   - Current index
   - Number of dots found
   - Before state: which dots have `is-active` class
   - Which dot had `is-active` removed
   - Which dot gets `is-active` added
   - After state: final class state of all dots

2. **`previous()`, `next()`, `goTo()`** - Shows:
   - Index transitions (old → new)

## How to Test

### Step 1: Clear Browser Cache (CRITICAL!)

**Option A - Hard Refresh:**
- Chrome/Edge: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Firefox: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Safari: `Cmd+Option+R`

**Option B - DevTools Cache Disable:**
1. Open DevTools (F12)
2. Go to Network tab
3. Check "Disable cache"
4. Keep DevTools open while testing

**Option C - Clear All Cache:**
- Chrome: Settings → Privacy → Clear browsing data → Cached images and files
- Firefox: Settings → Privacy → Clear Data → Cached Web Content
- Safari: Develop → Empty Caches

### Step 2: Open Page & Console

1. Navigate to: `http://localhost:8000/gallery.html` (or your dev server)
2. Open browser console: `F12` or `Cmd+Option+I`
3. Make sure Console tab is visible

### Step 3: Open a Multi-Image Artwork Modal

Click on any artwork card that has multiple images (carousel dots visible)

### Step 4: Watch Console Output

You should see logs like:

```
[ArtworkCarousel] Rendering carousel with 3 images
[ArtworkCarousel] Multiple images detected, adding controls
[ArtworkCarousel] Carousel rendered successfully
[Carousel] ========== updateCarouselDots START ==========
[Carousel] currentIndex: 0
[Carousel] Found dots: 3
[Carousel] Dots array: [{index: 0, hasActive: false, classes: "artwork-modal__carousel-dot"}, ...]
[Carousel] Added is-active to dot 0
[Carousel] Dot classes after add: artwork-modal__carousel-dot is-active
[Carousel] After update: [{index: 0, hasActive: true, classes: "artwork-modal__carousel-dot is-active"}, ...]
[Carousel] ========== updateCarouselDots END ==========
```

### Step 5: Navigate Carousel

Click next/previous buttons or arrow keys and watch logs:

```
[Carousel] next() - index changed from 0 to 1
[Carousel] ========== updateCarouselDots START ==========
[Carousel] currentIndex: 1
[Carousel] Found dots: 3
[Carousel] Removed is-active from dot 0
[Carousel] Added is-active to dot 1
[Carousel] ========== updateCarouselDots END ==========
```

### Step 6: Click on Dots Directly

Click on different dots and verify:
- Console shows `goTo()` being called
- `updateCarouselDots()` runs
- Correct dot index gets `is-active`

## What to Report Back

Please provide:

1. **Screenshot of console output** showing the debug logs
2. **Visual confirmation**: Do the dots visually highlight correctly now?
3. **Specific issue**: If dots still don't work, what exactly happens?
   - Does the console show correct index?
   - Does the console show `is-active` being added to the right dot?
   - Is the CSS class applied but not styled?
   - Does nothing happen at all?

## Troubleshooting

### If you see old logs (no debug output):
- Cache not cleared! See Step 1 above
- Try opening in Incognito/Private window

### If console shows errors:
- Report the exact error message
- Include the full stack trace

### If dots work in console but not visually:
- This is a CSS issue, not JavaScript
- Check if `.artwork-modal__carousel-dot.is-active` CSS exists
- Use browser inspector to check actual DOM element classes

## Expected Behavior

After fix:
- Initial render: Dot 0 has `is-active` class
- Click next: Dot 1 gets `is-active`, dot 0 loses it
- Click dot 2: Dot 2 gets `is-active`, previous dot loses it
- Console logs confirm every state change

## Next Steps

Based on console output, we can determine:
1. If the JS is running correctly (console shows right behavior)
2. If there's a CSS problem (JS correct, visual wrong)
3. If there's a different carousel interfering (unexpected behavior)
4. If cache is still an issue (no debug logs at all)
