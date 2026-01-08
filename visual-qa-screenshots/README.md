# Visual QA Screenshots Directory

Store all visual QA screenshots here following the naming convention below.

## Naming Convention

```
[breakpoint]-[state]-[description].png
```

### Components

**Breakpoint**:
- `mobile-320px`
- `mobile-375px`
- `mobile-390px`
- `mobile-428px`
- `tablet-640px`
- `tablet-768px`
- `tablet-1023px`
- `desktop-1024px`
- `desktop-1280px`
- `desktop-1440px`
- `desktop-1920px`

**State**:
- `initial` - Page load state
- `loaded` - After images loaded
- `hover` - Hover state (desktop)
- `focus` - Focus state (keyboard nav)
- `filter-all` - All filter active
- `filter-[name]` - Specific filter active
- `transition` - During filter animation
- `dark-mode` - Dark theme
- `reduced-motion` - With reduced motion enabled
- `issue-[number]` - Documenting a specific issue

**Description**:
- Brief descriptor of what's shown
- Use hyphens between words
- Keep under 30 characters

## Examples

Good filenames:
```
mobile-375px-initial-load.png
desktop-1440px-hover-overlay.png
tablet-768px-filter-nature-active.png
desktop-1920px-issue-001-card-overlap.png
mobile-320px-dark-mode-contrast.png
desktop-1440px-reduced-motion-instant.png
```

Bad filenames:
```
screenshot.png                    # Too generic
IMG_1234.png                      # Not descriptive
1440px.png                        # Missing state and description
desktop-hover.png                 # Missing specific breakpoint
issue.png                         # Missing context
```

## Screenshot Guidelines

### What to Capture

**Full Page**:
- Initial load state
- After all images loaded
- Filter transition sequences

**Specific Element**:
- Hover state issues
- Overlay positioning problems
- Grid alignment issues
- Individual card problems

**Comparison Shots** (save as pairs):
```
desktop-1440px-before-filter.png
desktop-1440px-after-filter.png
```

### Quality Standards

- **Resolution**: Use actual screen resolution (don't scale)
- **Format**: PNG (lossless)
- **Annotations**: Use image editor to highlight issues
- **Cropping**: Crop to relevant area, include context

### How to Capture

**Mac**:
- Full screen: `Cmd + Shift + 3`
- Selection: `Cmd + Shift + 4` → drag selection
- Window: `Cmd + Shift + 4` → press Space → click window

**Chrome DevTools**:
- Device toolbar → More options (⋮) → Capture screenshot
- Full page: Command menu (`Cmd+Shift+P`) → "Capture full size screenshot"

**Firefox DevTools**:
- Developer toolbar (`Shift+F2`) → `screenshot --fullpage`

## Organization

### By Severity
Create subdirectories if many issues found:

```
visual-qa-screenshots/
├── critical/
│   ├── desktop-1440px-issue-001-overlap.png
│   └── mobile-375px-issue-002-horizontal-scroll.png
├── high/
│   ├── tablet-768px-issue-003-distorted-image.png
│   └── desktop-1920px-issue-004-hover-overflow.png
├── medium/
│   └── desktop-1440px-issue-005-spacing-gap.png
├── low/
│   └── desktop-1440px-issue-006-animation-timing.png
└── reference/
    ├── mobile-375px-initial-correct.png
    ├── desktop-1440px-hover-correct.png
    └── tablet-768px-filter-correct.png
```

### By Breakpoint
Alternative organization:

```
visual-qa-screenshots/
├── mobile/
│   ├── 320px-initial.png
│   ├── 375px-hover.png
│   └── 390px-filter.png
├── tablet/
│   ├── 768px-initial.png
│   └── 1023px-transition.png
└── desktop/
    ├── 1024px-initial.png
    ├── 1440px-hover.png
    └── 1920px-dark-mode.png
```

## Linking to Report

Reference screenshots in `visual-qa-report.md`:

```markdown
**Screenshot**: `desktop-1440px-issue-001-overlap.png`
```

Or with path:
```markdown
**Screenshot**: `visual-qa-screenshots/critical/desktop-1440px-issue-001-overlap.png`
```

## Storage

- Store locally during testing
- Include in git if issues need to be tracked
- Consider `.gitignore` for reference screenshots (can be large)
- Compress if needed: use TinyPNG or similar

## Cleanup

After testing complete:
- Delete duplicate screenshots
- Remove low-value reference shots
- Keep only documented issues + key reference states
- Archive or compress large sets

---

**Current State**: Empty - Ready for test screenshots
**Next Step**: Begin testing and save screenshots here
