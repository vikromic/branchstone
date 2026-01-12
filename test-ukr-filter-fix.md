# Ukrainian Gallery Filter Click Test

## Quick Test (1 minute)

1. Start server:
   ```bash
   cd /Users/vik/Workspace/branchstone/docs
   python3 -m http.server 8000
   ```

2. Open Ukrainian gallery:
   http://localhost:8000/gallery.html?lang=uk

3. Click "Глибокий океан" button 3 times in a row
   - ✅ PASS: Each click works (filters gallery)
   - ❌ FAIL: Every other click works (old bug)

4. Click through all 6 collection buttons:
   - Глибокий океан
   - Золота
   - Про Попіл і Квіти
   - Бурі
   - Спокій Лісу
   - Йдучи її слідами

   - ✅ PASS: ONLY the clicked button is highlighted
   - ❌ FAIL: Multiple buttons highlighted at once (old bug)

## Root Cause (Fixed)

The `galleryRendered` event listeners in `main.js` used `{ once: true }`, meaning they only fired once per page load.

**Bug sequence:**
1. Language switch to Ukrainian → `galleryRendered` fires
2. Listeners fire with `{ once: true }` → listeners consumed
3. User clicks filter → `galleryRendered` fires again
4. But listeners are gone → filters NOT re-initialized
5. Old event handlers remain → duplicate clicks

**Fix:**
- Removed `{ once: true }` from both desktop and mobile filter listeners
- Now filters re-initialize on EVERY `galleryRendered` event
- Clone-and-replace pattern prevents duplicate handlers
