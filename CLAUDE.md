# 🎨 Branchstone: Gallery Sentinel (CLAUDE.md)

## 🛠️ Technical Stack & Context
- **Frontend:** Vanilla HTML5, CSS3, Vanilla JS (ES6+).
- **Environment:** Static site served from the `/docs` directory (GitHub Pages).
- **Grid:** Strict 8px base unit.
- **Target:** Desktop-First (1440p+). The UI is "The Invisible Frame" for the art.

## 🌟 Core Philosophy: "Apple Liquid Glass"
The UI must feel like physical hardware. Luxury is defined by the depth of the glass and the precision of the corners.

- **Perfect Corners (Squircles):** Use continuous curvature for all frames and buttons.
    - *Outer Radius:* `rounded-[2rem]` (32px).
    - *Concentric Rule:* Inner Radius = Outer Radius - Padding.
- **Liquid Glass Spec:**
    - **Surface:** `backdrop-filter: blur(40px)` with `bg-white/[0.02]`.
    - **Specular Highlight:** `border-t-[1.5px] border-t-white/12` (Top edge glow) + `border-x-[1px] border-x-white/5`.
    - **Depth:** `shadow-[0_20px_50px_rgba(0,0,0,0.3)]`.
- **Image Treatment:** Every artwork frame must have a subtle `1px` inner-stroke to separate the art from the glass container.

## 🏎️ ProMotion Fluidity (120Hz Logic)
Motion must feel like a physical weight on a spring.
- **Spring Physics:** Use `{ stiffness: 120, damping: 20, mass: 0.8 }`.
- **Zero-Reflow:** Never animate `width`, `height`, or `top/left`. Only use `transform: scale()` and `translate3d()`.
- **Interruptible Lightbox:** Image expansions must be interruptible (users can close before the "open" animation finishes).

## 📏 Spacing & Rhythm (Gallery Layout)
- **The Golden Gap:** Minimum `gap-12` (48px) between art pieces. Art needs massive breathing room.
- **Internal Breathing:** Modals and captions must maintain `p-10` (40px) padding.
- **Information Lasagna:** 1. Background (#050505) -> 2. Art Content -> 3. Glass Overlays -> 4. Minimal HUD.

## 🧪 Code Simplification (The Zen Pass)
- **Rule:** Run `/simplify` on all CSS and JS every 3 iterations.
- **Goal:** Remove "div-soup." Prefer modern CSS (Grid/Flex) over legacy floats or positioning.
- **Vanilla Integrity:** Keep JS lightweight. Use `IntersectionObserver` for reveals instead of heavy scroll libraries.

## ⚠️ Photosensitive & Art Safety
- **The 2Hz Rule:** No flickering. Pulse/Fade animations must be $\ge 400ms$ sine-waves.
- **Neutrality:** UI elements must not cast color-tinted shadows onto the artwork.

## 🤖 Mandatory Tool Usage (Eyes-On)
- **FORCE_CHROME:** No commits without a 1440p `/chrome` audit.
- **Proof of Sight:** Describe a specific visual artifact (e.g., "The caption text is 2px off-center") before editing.

## 🧬 Evolutionary Loop & Logging
- **The 1% Rule:** Fix one micro-interaction or alignment error per iteration.
- **Log:** All changes must be recorded in `docs/EVOLUTION_LOG.md`.
- **Revert Trigger:** If a change makes the site feel "cheap" or "Standard Web," `git reset --hard`.
