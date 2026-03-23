# 🎨 Branchstone: Gallery Sentinel (CLAUDE.md)

## 🧭 Product Reality
- **Branchstone is gallery-first.** `gallery.html` is the primary product surface, the main proof of quality, and the fastest path to collector intent.
- **Homepage is a funnel, not the destination.** `index.html` must guide users into the gallery with minimal friction, then get out of the way.
- **Secondary pages support the gallery.** `about.html`, `commissions.html`, and `contact.html` exist to build trust, answer objections, and complete inquiry flow without stealing focus from the work.
- **When priorities conflict, protect the art.** Favor faster artwork discovery, better artwork inspection, cleaner inquiry flow, and calmer mobile browsing over decorative complexity.

## 🔁 Continuous Ralph-Loop Mode
- **Operate in an endless improvement loop.** There is no final “done” state; each pass should leave the experience measurably better.
- **Do not anchor to a fixed bug list.** Re-scout the live site every iteration and choose the highest-leverage improvement visible now.
- **Avoid overfitting to one past issue.** A solved problem is not a permanent priority; fresh observation always wins.
- **If no obvious bug exists, improve quality anyway.** Reduce friction in hierarchy, spacing, touch ergonomics, motion, readability, resilience, perceived performance, or architectural clarity.
- **Ship coherent units.** Each iteration should revolve around one clear improvement theme or one tightly related bundle, not random scattered tweaks.
- **For open-ended Ralph operation, think in long batches.** It is acceptable to run very large iteration batches such as `500`, then inspect the accumulated result and launch the next batch.
- **Safety cap, not finish line.** In open-ended hardening mode, the iteration cap exists to bound unattended runtime, not to declare the site complete.
- **If a personality overlay is enabled, prefer `Mission Control`.** It should reinforce telemetry, verification, and go/no-go discipline without overriding the gallery-first priorities in this file.

## 📱 Page Priority & Audit Order
1. **Gallery mobile browse state**: first paint, header chrome, collection filters, artwork density, card legibility, card actions.
2. **Gallery interaction states**: deep-linked artwork, modal open/close, swipe or tap ergonomics, favorites, inquiry entry points.
3. **Homepage-to-gallery funnel**: hero, featured works, CTA clarity, how quickly the user reaches real art.
4. **Supporting pages**: about, commissions, contact, legal.
5. **Desktop refinement**: only after mobile gallery quality is protected.

## 👀 Mandatory Scouting Protocol
- **Run the site locally** from the `/docs` directory before making decisions.
- **Use Playwright `/chrome` before any edit and before any commit.** No exceptions.
- **Scout mobile first** at multiple narrow widths. Treat common phone widths such as `360`, `390`, and `430` as required checkpoints unless the task explicitly says otherwise.
- **Start every audit on `gallery.html`.** Inspect at least:
  - initial load and first artwork visibility
  - filter pill discoverability and horizontal scroll behavior
  - artwork card readability and tap targets
  - favorites and inquiry affordances
  - modal entry, close behavior, and deep-link state
- **Then inspect `index.html` as the funnel** into the gallery, not as the primary destination.
- **Proof of Sight is mandatory.** Before proposing or making changes, record what you actually observed in the live DOM, screenshot, or interaction flow.

## 🎯 Universal Friction Hunt
On every loop, search for the most meaningful issue or opportunity in these categories:

- **Art prominence:** anything that visually competes with, crops, muddies, or delays the artwork.
- **Touch ergonomics:** cramped controls, weak thumb-zone placement, accidental taps, poor close targets, hard-to-swipe areas.
- **Hierarchy and pacing:** too much copy before the art, muddy headings, weak CTA order, broken rhythm, cheap-looking density.
- **Motion and polish:** non-physical easing, janky transitions, blocked interactions, non-interruptible states, reflow-heavy animation.
- **Performance and perceived speed:** slow first useful paint, unstable card loading, expensive effects, redundant DOM or CSS complexity.
- **Accessibility and resilience:** focus handling, contrast, reduced-motion respect, keyboard flow, long text overflow, translation stress, deep-link robustness.
- **Architecture and maintainability:** duplicated CSS/JS, div-soup, leaky responsibilities, missing abstractions, fragile state coupling.

## 🌟 Aesthetic & Interaction Standard
- **The UI is the Invisible Frame.** It should feel premium, calm, and precise while remaining visually subordinate to the artwork.
- **Use Apple Liquid Glass discipline.** Continuous curvature, refined translucency, precise borders, and neutral depth are expected when glass surfaces appear.
- **Protect art safety.** No tinted glows, noisy gradients, attention-stealing animations, or intrusive overlays that contaminate the artwork.
- **Preserve generous breathing room.** The gallery should feel curated, not crowded, especially on mobile.
- **Honor spring-like physicality.** Motion must feel weighted, smooth, and interruptible.
- **Never animate layout properties.** Restrict animation to `transform`, `opacity`, and other non-reflow triggers.

## 🧪 Verification & Regression Discipline
- **Verify the exact touched flow in `/chrome` after every change.**
- **Re-check adjacent gallery states.** If a change touches gallery cards, also re-check filters, modal entry, and first-scroll rhythm. If it touches the homepage funnel, re-check gallery landing quality.
- **Compare against your earlier Proof of Sight.** State what is better now and confirm what did not regress.
- **No commit without zero-regression confidence** in layout, art prominence, touch comfort, and perceived performance.
- **If the change feels cheaper, revert it.** Quality bar matters more than keeping work.
- **A successful iteration is commit-worthy.** If an iteration produced a verified net improvement and updated the evolution log, commit it immediately.
- **Do not commit failed or unverified passes.** If the change regressed the UI, could not be verified, or did not produce a clear improvement, keep working without committing that pass.

## 📝 Logging & Commit Hygiene
- **Update `docs/EVOLUTION_LOG.md` every iteration.** Record:
  - what you observed
  - what you changed
  - what you verified
  - why the result is a net improvement
- **Commit after each successful iteration** using Conventional Commit format.
- **Success means:** proof-of-sight before change, verified improvement after change, no observed regression in adjacent gallery states, and evolution log updated.
- **High-iteration Ralph runs may create many commits.** That is acceptable. Prioritize auditability and rollback safety over a tidy commit count.
- **Never claim the site is finished.** After logging and verification, continue scouting for the next highest-leverage improvement until the human stops the loop.
