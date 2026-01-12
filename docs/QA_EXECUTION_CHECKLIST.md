# QA Execution Checklist
**Quick Reference for Test Execution**
**Version:** 1.0 | **Date:** 2026-01-11

---

## Setup

```bash
cd /Users/vik/Workspace/branchstone/docs
python3 -m http.server 8000
# Open: http://localhost:8000/gallery.html
```

---

## Critical Path Tests (Must Pass Before Release)

### Ukrainian Filter Fix Validation
- [ ] **EN-001:** All artworks visible with "All" filter active
- [ ] **EN-002:** Each collection filters correctly (6 collections)
- [ ] **UK-001:** Language switch to Ukrainian successful
- [ ] **UK-002:** "Глибокий океан" filter works (ONLY this button highlighted) ⚠️ PRIMARY FIX
- [ ] **UK-003:** All 6 Ukrainian collections filter correctly (buttons don't all highlight) ⚠️ PRIMARY FIX
- [ ] **UK-004:** Filter state preserved during language switch
- [ ] **Mobile:** Mobile filter dropdown works in both languages

### Light Theme Background Update
- [ ] **VIS-001:** Background color is `#F5F3F0` (not `#FAF9F7`)
- [ ] **VIS-003:** Text contrast meets WCAG AA (≥4.5:1 for all text)
- [ ] **TOG-001:** Theme toggle works (light ↔ dark)
- [ ] **TOG-002:** Theme persists across navigation and refresh

### Critical Regressions
- [ ] Gallery cards display correctly
- [ ] Artwork modal opens
- [ ] Favorites work
- [ ] No console errors
- [ ] Mobile responsive

---

## Browser Matrix (P0 - Critical)

| Browser | Desktop | Mobile | Status | Notes |
|---------|---------|--------|--------|-------|
| Chrome (latest) | ☐ | ☐ | | |
| Safari (latest) | ☐ | ☐ | | |
| Firefox (latest) | ☐ | - | | |

---

## Key Test Scenarios

### Scenario 1: Ukrainian Filter Smoke Test (5 min)
1. Open `http://localhost:8000/gallery.html?lang=uk`
2. Click each Ukrainian collection filter button
3. **Verify:** ONLY clicked button highlights (not all buttons)
4. **Verify:** Correct artworks displayed for each collection

**Pass Criteria:** All 6 filters work correctly, no multi-button highlighting

---

### Scenario 2: Language Switch Test (3 min)
1. Start in English, apply "Deep Ocean" filter
2. Switch to Ukrainian
3. **Verify:** Filter persists, "Глибокий океан" button active
4. Switch back to English
5. **Verify:** "Deep Ocean" filter still active

**Pass Criteria:** Filter state preserved across language switches

---

### Scenario 3: Light Theme Visual Check (2 min)
1. Open any page
2. DevTools → Inspect `<body>` → Computed Styles
3. **Verify:** `--bg-primary: #F5F3F0`
4. Use contrast checker on primary text
5. **Verify:** Contrast ratio ≥4.5:1

**Pass Criteria:** Background updated, contrast compliant

---

### Scenario 4: Mobile Filter Test (3 min)
1. Resize to 375px width
2. Tap "Фільтри" (Ukrainian)
3. Tap "Бурі" collection
4. **Verify:** Dropdown closes, filter applied
5. **Verify:** Desktop filter syncs

**Pass Criteria:** Mobile filter works, syncs with desktop

---

### Scenario 5: Rapid Filter Clicking (Edge Case - 1 min)
1. Rapidly click different filter buttons (10 clicks in 2 seconds)
2. Wait for animations to settle
3. **Verify:** No errors, stable state, only last clicked button active

**Pass Criteria:** No crashes, no stuck animations

---

## Accessibility Quick Checks

- [ ] **Keyboard:** Tab to filter buttons, Enter/Space activates
- [ ] **Screen Reader:** VoiceOver announces button states
- [ ] **Focus Visible:** Clear focus indicator on all interactive elements
- [ ] **Reduced Motion:** Animations disabled when OS setting active

---

## Defect Severity Guide

| Severity | Definition | Example |
|----------|------------|---------|
| **Critical** | Feature broken, no workaround | All Ukrainian filters highlight all buttons (original bug) |
| **High** | Major functionality impaired | Filter state lost on language switch |
| **Medium** | Minor functionality issue, workaround exists | Animation glitchy on one browser |
| **Low** | Cosmetic, no impact on functionality | Hover state color slightly off |

---

## Quick Defect Report

```
### [DEF-XXX] Brief Title
**Severity:** Critical/High/Medium/Low
**Browser:** Chrome 120 / Safari 17 / etc.
**Locale:** en / uk
**Steps:**
1. ...
2. ...
3. ...
**Expected:** ...
**Actual:** ...
**Console Errors:** [paste if any]
```

---

## Test Completion Criteria

### Minimum (Release Blocker)
✓ All Ukrainian filter tests pass (TC-F1-UK-002, TC-F1-UK-003)
✓ No regression in English filters
✓ Background color updated correctly
✓ WCAG contrast ratios pass
✓ No console errors
✓ Chrome + Safari tested (desktop + mobile)

### Recommended (Ship with Confidence)
✓ Mobile filter tests pass
✓ Edge cases handled gracefully
✓ Keyboard navigation works
✓ Theme toggle works
✓ Firefox tested

---

## Common Issues & Troubleshooting

### Issue: "All buttons highlight in Ukrainian"
**Cause:** Collection name not mapped to canonical slug
**Fix:** Check `getCanonicalCollectionSlug()` method includes all collection slugs

### Issue: "Filter state lost on language switch"
**Cause:** Filter not persisting to localStorage or URL
**Fix:** Verify `saveCollectionToStorage()` and `updateURLWithCollection()` called

### Issue: "Background color looks wrong"
**Solution:** Hard refresh (Cmd+Shift+R / Ctrl+Shift+R) to clear CSS cache

### Issue: "Text too low contrast"
**Solution:** Measure with WebAIM tool, report if <4.5:1

---

## Sign-off

**Tester:** ___________________________
**Date:** ___________________________
**Result:** ☐ PASS  ☐ FAIL  ☐ CONDITIONAL PASS

**Notes:**
_________________________________
_________________________________
_________________________________
