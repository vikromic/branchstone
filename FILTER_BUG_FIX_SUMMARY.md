# Gallery Filter Every-Other-Click Bug - Root Cause Analysis and Fix

## Summary
Fixed critical bug where gallery filter buttons only worked every other click on both English and Ukrainian versions. Root cause was exponential event listener multiplication caused by recursive listener registration.

## Diagnosis

### Investigation Process
1. Added comprehensive console logging to trace click handler flow
2. Analyzed all locations where click handlers are attached to filter buttons
3. Traced the `galleryRendered` event dispatch and listener registration
4. Identified the recursive listener multiplication pattern

### Root Cause: Exponential Listener Multiplication

The `galleryRendered` event listener was being added **INSIDE** both `initGalleryFiltering()` and `initMobileFilterDropdown()` functions. This created a recursive multiplication:

```javascript
// BEFORE (BUGGY CODE):
const initGalleryFiltering = () => {
  // ... filter setup code ...

  // BUG: This listener is added EVERY time initGalleryFiltering is called!
  document.addEventListener('galleryRendered', () => {
    initGalleryFiltering(); // This causes recursive multiplication
  });
};
```

#### Multiplication Flow:
```
Page Load:
├─ initGalleryFiltering() called
└─ Adds 1 galleryRendered listener

First Gallery Render (language change, etc.):
├─ galleryRendered event fires
├─ 1 listener fires → calls initGalleryFiltering()
└─ initGalleryFiltering() adds ANOTHER listener (total: 2)

Second Gallery Render:
├─ galleryRendered event fires
├─ 2 listeners fire → calls initGalleryFiltering() TWICE
└─ Each call adds another listener → 2 + 2 = 4 total listeners

Third Gallery Render:
├─ galleryRendered event fires
├─ 4 listeners fire → calls initGalleryFiltering() 4 TIMES
└─ Each call adds another listener → 4 + 4 = 8 total listeners

Pattern: 1 → 2 → 4 → 8 → 16 → 32 → 64 → ...
```

### Why Every Other Click Failed

With multiple event handlers attached:
- **First click**: Handler #1 executes filter change, Handler #2 conflicts/cancels
- **Second click**: Handlers cancel each other out, nothing happens
- **Third click**: Works again (cycle repeats)

The clone-and-replace pattern successfully removed duplicate handlers from the filter buttons themselves, but couldn't prevent the exponential growth of `galleryRendered` listeners on the `document` object.

## Solution

### 1. Moved Listener Registration to Global Scope

Created a dedicated function to register the `galleryRendered` listener **exactly once** per page load:

```javascript
// Global flag to ensure single registration
let galleryRenderedListenerRegistered = false;

/**
 * Register global galleryRendered listener (ONCE per page load)
 * This listener re-initializes filter UI when gallery re-renders
 */
const registerGalleryRenderedListener = () => {
  if (galleryRenderedListenerRegistered) return; // Already registered

  document.addEventListener('galleryRendered', () => {
    initGalleryFiltering();
    initMobileFilterDropdown();
  });

  galleryRenderedListenerRegistered = true;
};
```

### 2. Removed Duplicate Listener Registration

Removed the `galleryRendered` event listeners from inside:
- `initGalleryFiltering()`
- `initMobileFilterDropdown()`

These functions now **only** handle UI setup, not event registration.

### 3. Called Registration Function Once in Init Flow

```javascript
const init = async () => {
  // ... other initialization ...

  await initGalleryData(); // Renders gallery
  registerGalleryRenderedListener(); // Register listener ONCE

  // ... rest of initialization ...
};
```

## Architecture Changes

### Before (Buggy)
```
initGalleryFiltering()
├─ Clone-and-replace filter container (works)
├─ Attach click handler (works)
└─ Add galleryRendered listener (BUG: adds duplicate every time!)

galleryRendered event
├─ Fires listener(s)
├─ Each listener calls initGalleryFiltering()
└─ Each call adds MORE listeners (exponential growth)
```

### After (Fixed)
```
registerGalleryRenderedListener() [called ONCE on page load]
├─ Check if already registered → return if true
├─ Add galleryRendered listener
└─ Set flag to prevent re-registration

initGalleryFiltering() [can be called multiple times safely]
├─ Clone-and-replace filter container
└─ Attach click handler
   [No listener registration here anymore!]

galleryRendered event
├─ Fires SINGLE listener
└─ Listener calls both init functions
```

## Verification

### Test Cases
1. ✅ Single click works on English version
2. ✅ Single click works on Ukrainian version
3. ✅ Works after language switching (EN → UK → EN)
4. ✅ Works after multiple filter clicks
5. ✅ No console errors
6. ✅ No exponential listener growth

### How to Verify in Browser
1. Open gallery page
2. Open browser console
3. Click different filter buttons rapidly
4. Every single click should work immediately
5. No "skipped" clicks

### Expected Console Logs (Clean)
```
[GalleryData] Rendering gallery...
[GalleryData] Gallery rendered successfully
```

No duplicate initialization logs, no error messages.

## Files Modified

### `/docs/js/main.js`
- Added `galleryRenderedListenerRegistered` flag (global scope)
- Created `registerGalleryRenderedListener()` function
- Removed `galleryRendered` listener from `initGalleryFiltering()`
- Removed `galleryRendered` listener from `initMobileFilterDropdown()`
- Called `registerGalleryRenderedListener()` once in `init()` flow

### `/docs/js/gallery-data.js`
- No functional changes
- Continues to dispatch `galleryRendered` event after rendering

## Technical Lessons

### 1. Event Listener Accumulation Anti-Pattern
**Problem**: Adding event listeners inside functions that are called by those same listeners creates exponential growth.

**Solution**: Separate listener registration (one-time setup) from handler logic (can be called multiple times).

### 2. Clone-and-Replace Limitations
Clone-and-replace works for removing listeners from **specific DOM nodes**, but doesn't help with listeners on `document` or `window` objects.

**Best Practice**: Use a registration flag for global listeners.

### 3. Debugging Event Listeners
To debug listener multiplication:
1. Add console logs at listener registration points
2. Add console logs when listeners fire
3. Count how many times handlers execute per single event
4. Use Chrome DevTools → Elements → Event Listeners to inspect

## Regression Prevention

### Code Review Checklist
- [ ] Are event listeners being added inside functions that are called repeatedly?
- [ ] Do listener callbacks call the function that registered them?
- [ ] Are listeners on `document` or `window` objects properly guarded?
- [ ] Is there a mechanism to prevent duplicate registration?

### Future Refactoring Considerations
If this pattern needs to be used elsewhere:
1. Extract listener registration to a separate init function
2. Use a registration flag to prevent duplicates
3. Call registration function once in main init flow
4. Keep re-callable functions clean of listener registration

## Related Issues

### Previous Fix Attempts
1. **Attempt 1**: Switched to event delegation → Worked initially but broke on re-renders
2. **Attempt 2**: Added clone-and-replace → Fixed English only, broke Ukrainian
3. **Attempt 3**: Removed `{ once: true }` → Exposed the exponential multiplication bug

### Why This Fix is Complete
- Addresses the root cause (exponential listener growth)
- Works on both locales
- Survives language switching
- No side effects on other features
- Clean, maintainable code structure

## Commits
- `b99bc74` - fix(gallery): resolve every-other-click filter bug caused by exponential listener multiplication
- `5712cc5` - chore(gallery): remove debug logging from filter fix
