# 🎨 Branchstone: Gallery Sentinel (CLAUDE.md)

## 🛠️ Technical Stack & Context
- **Frontend:** Vanilla HTML5, CSS3, Vanilla JS (ES6+).
- **Environment:** Static site served from the `/docs` directory (GitHub Pages).
- **Grid:** Strict 8px base unit.
- **Target:** Mobile-First and Responsive. The UI is "The Invisible Frame" for the art. Ensure flawless touch interactions, prioritize screen real estate for artwork on small screens, and heavily optimize mobile rendering performance.

## 🌟 Core Philosophy: "Apple Liquid Glass" & The Art First
The UI must feel like physical hardware. Luxury is defined by the depth of the glass and the precision of the corners. The UI exists solely to elevate the art, never to distract from it.

- **Perfect Corners (Squircles):** Use continuous curvature for all frames and buttons. Concentric Rule: Inner Radius = Outer Radius - Padding.
- **Liquid Glass Spec:** `backdrop-filter: blur(40px)` with `bg-white/[0.02]`. Highlight: `border-t-white/12` (Top edge glow) + `border-x-white/5`.
- **Depth:** Rich shadows (`shadow-[0_20px_50px_rgba(0,0,0,0.3)]`).
- **Image Treatment:** Every artwork frame must have a subtle `1px` inner-stroke to separate the art from the glass container.

## 🏎️ ProMotion Fluidity & Interactions
Motion must feel like a physical weight on a spring.
- **Spring Physics & Fluidity:** Always use fluid, smooth easing.
- **Zero-Reflow Performance:** Never animate layout-triggering properties (`width`, `height`, `top`, `left`). Exclusively animate `transform` and `opacity`.
- **Interruptible Modals:** Image expansions and lightboxes must be interruptible (users can close before the "open" animation finishes).

## 📏 Space, Rhythm, and Aesthetics (Artist Domain)
- **The Golden Gap:** Generous spacing between artworks. Art needs massive breathing room.
- **Internal Breathing:** Modals and captions must maintain substantial padding.
- **Information Lasagna:** Keep a strict z-index hierarchy: 1. Deep background -> 2. Art Content -> 3. Glass Overlays -> 4. Minimal HUD.
- **Art Safety:** Neutrality is critical. UI elements must not cast color-tinted shadows or glows onto the artwork. Avoid flickering; pulse animations must be slow and elegant.

## 🤖 Mandatory Verification & Ralph-Loop Protocol
- **Continuous Improvement (+1% Rule):** Every single iteration MUST leave the UI/UX visually, structurally, or performantly at least 1% better than before. 
- **0 Regression Verification:** Rigorously test against the previous baseline. Check layout, rendering, and art safety before proceeding to the next loop iteration.
- **FORCE_CHROME Integration:** Usage of the `/chrome` tool (browser interaction) is strictly MANDATORY. You must not commit code without Proof of Sight.
- **Proof of Sight:** Clearly describe the specific visual state or layout artifact you observed via `/chrome` before proposing changes.
- **Continuous Refactoring (The Zen Pass):** Relentlessly simplify CSS and JS. Eliminate "div-soup". Keep JS lightweight, favoring native APIs (like `IntersectionObserver`).
- **Evolution Log:** Meticulously record all visual and architectural changes in `docs/EVOLUTION_LOG.md`. Revert (`git reset --hard`) if a change makes the site feel "cheap".
