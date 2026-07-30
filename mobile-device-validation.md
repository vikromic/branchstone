# Branchstone physical mobile device validation

This is the executable physical-browser gate for final mobile UX approval. It proves behavior on real iOS Safari and Android Chrome hardware; simulator, responsive mode, Lighthouse, and desktop touch emulation do not satisfy it.

**Status: READY / NOT EXECUTED / NO DEVICE RESULTS**

## Evidence boundary

Test one immutable production artifact. Before the first device run, record:

- exact base commit SHA, complete `git status --porcelain=v1`, and deterministic source-bundle digest;
- deterministic served-closure digest covering compiled HTML/assets, every artwork master, catalog JSON, icon, and manifest actually delivered to the phones;
- test URL, build identifier, test date, and operator;
- every device's public model name, OS version, browser version, CSS viewport, DPR, orientation, display zoom, and text-size setting;
- network type and whether the run is cold or warm;
- screen-recording and screenshot locations, using device aliases rather than serial numbers or owner names.

Never record device serial numbers, Apple/Google account identifiers, notifications, contacts, or unrelated personal information in this repository. Use a clean browser profile or private tab and disable notification previews before recording.

If source, generated assets, artwork masters, build tooling, or deployment output changes, the artifact identity changes and every device lane must be rerun. A retry caused by a product failure remains a failed result; rerun only when the evidence harness itself failed.

## Build and serve the exact artifact

Install the locked dependencies once:

```bash
npm ci
```

`.stage` alone is not a deployable closure: artwork masters, catalog JSON, favicon, and the web manifest remain under `docs/`. Start the bounded device-audit harness:

```bash
npm run device:audit -- --host 0.0.0.0 --port 8082
```

The harness:

- runs the full test suite, production client/SSR build, localized prerender, and artifact verifier before opening a listener;
- records base HEAD, dirty-state count, and a source digest covering tracked plus untracked non-ignored files, including `docs/img/`;
- assembles `.stage`, artwork masters, catalog JSON, favicon, manifest, robots, sitemap, and CNAME into an isolated temporary closure;
- rejects symbolic links and path traversal, serves no SPA fallback, emits correct MIME types, and marks every response `no-store`;
- records served-closure file count, byte count, and digest before listening;
- accepts exact-path `error`, `stall`, `stall-entry gallery`, `stall-entry contact`, `release`, `clear`, `status`, and `quit` commands on its local standard input only; every injected request increments and logs the armed fault's `hits` count;
- recomputes both source and closure digests on `quit`, reports `MATCH` or `DRIFT`, and removes only its validated temporary closure.

Record the complete pre/post identity output. Open the printed LAN URL from each phone on the same private Wi-Fi network. VPNs, firewalls, guest networks, and Wi-Fi client isolation can block access. If an HTTPS staging deployment is used instead, record its immutable deployment ID and prove that it serves the same closure digest.

Before testing, use the browser network inspector to prove that `/img/...`, `/favicon.svg`, `/site.webmanifest`, `/assets/...`, and both EN/UK HTML documents return their real content types rather than an HTML fallback. End with `quit`; both post-run digests must report `MATCH`, and bounded temporary-closure cleanup must complete. A mismatch or interrupted cleanup invalidates the evidence.

Do not use a LAN URL to judge production TLS, CDN, cache, or canonical-domain behavior. Do not use a public URL unless its exact deployed revision is independently identified.

### Deterministic fault commands

Use a fresh private tab for every case and record the exact command, path, start time, recovery time, and capture timestamp.

Immediate image error:

```text
error /img/born_of_burn/3.webp
status
clear
```

Arm `error`, then open or reload the browser case before issuing `status`. The recorded status must show the exact path, mode, and `hits >= 1`; a merely armed fault with zero hits proves nothing. Keep the corresponding browser network row showing the harness HTTP 503.

For the 15-second stall, replace `error` with `stall`, wait until the recovery state appears, then issue `status`. It must show `hits >= 1` and `heldRequests >= 1` before using `clear` to fail the held request and pressing Retry. Use `release` instead of `clear` only when explicitly checking late-load recovery.

Gallery and Contact hydration fallback:

```text
stall-entry gallery
status
release

stall-entry contact
status
release
```

For Gallery, load the Gallery document and wait longer than four seconds before `status` and `release`; for Contact, load Contact and wait longer than eight seconds. In each case `status` must show the exact built module, `hits >= 1`, and `heldRequests >= 1`. Retain the module's pending network row. `quit` is the only successful end to the audit session because it emits the post-run digests and bounded cleanup result. SIGINT, SIGTERM, or standard-input EOF still perform bounded cleanup but mark the session `INVALID` and exit nonzero.

## Required physical matrix

Use four independent hardware lanes. Record `window.innerWidth`, `window.innerHeight`, `devicePixelRatio`, and `visualViewport` from the physical page; marketed screen size is not evidence.

| Lane | Browser | Required portrait CSS width | Primary locale | Assigned hand |
| --- | --- | ---: | --- | --- |
| IOS-320 | Current Safari on a physical iPhone | exactly 320 px | EN | left |
| IOS-430 | Current Safari on a different physical iPhone | exactly 430 px | UK | right |
| AND-320 | Current stable Chrome on a physical Android phone | exactly 320 px | UK | right |
| AND-430 | Current stable Chrome on a different physical Android phone | exactly 430 px | EN | left |

Hardware display zoom may be used to reach an endpoint only when it is recorded and remains fixed for the lane. Desktop responsive mode or a remotely overridden viewport does not satisfy a physical endpoint. A near value is useful diagnostic evidence but leaves that lane `NOT_RUN`; it must not be rounded to 320 or 430.

Each lane runs at its normal text setting and again with an exact platform/browser 200% text setting: Safari Page Zoom at 200% on iOS and Chrome accessibility text scaling at 200% on Android. Capture the settings screen and the resulting geometry. If that exact setting is unavailable, record `NOT_RUN`; do not substitute “largest”, “closest”, or desktop zoom.

Use the physical browser's remote inspector only to record geometry and state, never to drive an acceptance interaction. Capture this object at normal text, 200% text, and reduced motion:

```js
JSON.stringify({
  innerWidth,
  innerHeight,
  dpr: devicePixelRatio,
  visualViewport: visualViewport && {
    width: visualViewport.width,
    height: visualViewport.height,
    scale: visualViewport.scale,
    offsetTop: visualViewport.offsetTop,
  },
  rootFont: getComputedStyle(document.documentElement).fontSize,
  reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
})
```

The primary locale allocation ensures both EN and UK run on both browser families. On every lane, rerun D1, D2, D6, and D8 in the opposite locale. If the available hardware cannot expose all four exact endpoint lanes, the matrix is incomplete; emulator evidence may diagnose the gap but cannot fill it.

## Global observations

For every journey below, record:

- visible route and locale before and after;
- first input, assigned hand, regrip count, second-hand use, OS reachability use, and measured target size;
- unexpected wait, no-progress pause, accidental activation, mis-tap, or gesture conflict;
- horizontal overflow, covered controls, safe-area collision, scroll trap, lost scroll/filter/modal state, or artwork crop/deformation;
- loading, empty, offline, recovery, and validation feedback;
- screen-recording timestamp and a screenshot for any failure.

Use real finger input. Do not attach a mouse, keyboard, or automation bridge for the acceptance run.

Run D1–D5 and D7–D10 with only the assigned hand. D6 may use both hands for text entry, but route selection, field focus, error correction, keyboard dismissal, and the final action must remain reachable with the assigned hand. A required second-hand assist or OS reachability mode fails the journey. More than one regrip, or any repeated regrip/mis-tap across two lanes, is a usability finding rather than a note.

## Journeys

Run D1–D10 in the primary locale on all four normal-setting lanes. Run D1, D2, D6, and D8 in the opposite locale and repeat those four journeys at exact 200% text.

| ID | Start and action | Required result |
| --- | --- | --- |
| D1 — Primary IA | Cold Home. Open Index and visit Works, Exhibitions, Practice, and Contact in order, returning through browser Back where appropriate. | All four destinations are immediately identifiable and reachable; Home remains the wordmark destination; no covered Index control, route loss, or scroll trap. |
| D2 — Full Works archive | Open Works and scan from the first through the thirty-second preview. Filter All → Available → Collected → All. Open **The Place That Stays / Місце, Що Залишається**, move to the next work, then Close. Also open modal sentinels July Pines, Whales, Compass, and low-resolution Born Of Burn. | All 32 bounded previews resolve without crop or deformation; localized counts change 32 → 19 → 13 → 32; portrait, landscape, near-square, and low-resolution compositions remain honest; adjacent navigation works; Close returns within one viewport of the matching opener with filter state preserved. |
| D3 — Saved and history | From a mid-page work, Save it, open Index → Saved Works, then use native Back and Forward. | Saved state is visible; Back restores Saved → Index → page in order; Forward restores layers; route, locale, body scroll, and focus/context do not disappear. |
| D4 — Locale continuity | Open a non-first work, switch EN ↔ UK, then use adjacent navigation and Close. | The same work and modal state survive the locale change; labels, work details, counts, availability, and routes are localized without context loss. |
| D5 — Browser chrome and safe areas | Scroll Works and each editorial route until browser chrome collapses and returns; rotate once to landscape and back to portrait. | Header, Index, filters, modal controls, and content never sit under browser chrome, notch, home indicator, or cutout; no horizontal overflow or jump to the wrong record. |
| D6 — Contact keyboard | Open Contact, focus and complete each field with the on-screen keyboard, trigger one validation error, correct it, dismiss the keyboard, and stop before external handoff. | Focused fields and validation remain visible; the keyboard does not cover the active field or final action; scroll lock releases; copy accurately describes the email/clipboard handoff and never claims a server submission. |
| D7 — Native navigation | With a work modal open, use native Back/back-swipe and then Forward. Separately exercise Index → Saved Back/Forward. On iOS, cancel one partial edge-swipe before committing another. On Android, press Back once with the Contact keyboard open and again after it closes. | Modal history, shell layers, and keyboard unwind exactly once in the expected order; canceled swipe changes nothing; no accidental route exit, double close, stale overlay, blank page, lost focus, or lost scroll position. |
| D8 — Accessibility state | Enable reduced motion, prove the media query is true, reload Home and Works, complete D1, and open a work. Repeat D1, D2, and D6 at exact 200% text. | Semantic content is fully resolved without frozen animation midpoints; primary controls measure at least 44×44 CSS px; text reflows without clipping, overlap, hidden content, or horizontal page scrolling. |
| D9 — Deterministic loading and recovery | With browser cache and origin storage cleared, use the recorded `device:audit` commands for four separate cold cases: `error /img/born_of_burn/3.webp`; `stall` on the same path for more than 15 seconds; `stall-entry gallery` for more than 4 seconds; and `stall-entry contact` for more than 8 seconds. For every case capture `status` after the physical browser request and prove `hits >= 1`; stalled cases must also show `heldRequests >= 1`. Retain the matching browser network row, clear/release exactly as specified above, then Retry or allow hydration. Airplane Mode or an unspecified “slow network” is not sufficient evidence. | Immediate error and 15-second stall produce distinct honest localized recovery states; the work remains actionable; Retry resolves without stale UI or focus loss. At 4 seconds Gallery exposes the complete progressive archive, and at 8 seconds Contact exposes the direct-email fallback; releasing the script hydrates cleanly without duplicate content or a dead control. |
| D10 — Touch and GPU feel | On Home, perform ten deliberate vertical swipes across several works, including reversing direction. Then scan Works quickly and open/close three works. | Each settled Home gesture advances at most one work; no gesture is captured by hidden horizontal controls; no visible tearing, sustained stutter, accidental zoom, dead tap, or scroll lock remains. Record any repeatable hitch with timestamp and device temperature/network state. |

## Per-lane record

Create one row per journey:

```text
run_id,source_digest,served_closure_digest,evidence_id,device_alias,device_model,os_version,browser_version,css_viewport,dpr,visual_viewport,browser_chrome_state,orientation,text_scale,text_scale_proof,display_zoom,reduced_motion_proof,network,fault_injection_method,fault_path,fault_hit_count,held_request_count,network_trace_id,locale,journey_id,cold_or_warm,assigned_hand,regrips,second_hand_used,reachability_mode,mistaps,measured_target,start_route,end_route,native_navigation_action,keyboard_visual_viewport,result,overflow,overlap,safe_area,scroll_trap,context_loss,artwork_integrity,loading_recovery,touch_gpu,notes,capture_timestamp
```

Allowed `result` values are `PASS`, `FAIL`, and `NOT_RUN`. Blank cells are not passes. Keep the evidence sheet and recordings outside the repository when they contain personal device information; commit only a redacted aggregate and issue references.

## Approval

Physical-device `APPROVE` requires:

- pre/post source-bundle and served-closure digests match exactly, and all four lanes use that one immutable closure;
- all four measured physical viewport endpoints are exactly 320 or 430 CSS px as assigned;
- D1–D10 pass in the assigned primary locale on every normal-setting lane; D1, D2, D6, and D8 also pass in the opposite locale and at exact 200% text;
- all 32 index previews and the four orientation/resolution modal sentinels preserve the real composition;
- the immediate image error, 15-second image stall, 4-second Gallery hydration fallback, and 8-second Contact fallback are separately proven with deterministic cache-safe fault injection, a matching browser network trace, and harness status showing the exact fault path with `hits >= 1` (`heldRequests >= 1` before releasing every stall);
- assigned-hand journeys need no second-hand assist or reachability mode, primary targets measure at least 44×44 CSS px, and no repeatable regrip/mis-tap friction remains;
- zero horizontal overflow, covered primary control, safe-area collision, scroll trap, artwork crop/deformation, lost locale, lost filter/scroll/modal state, unreachable route, crash, blank screen, or forced reload;
- no unresolved repeatable browser-family defect and no unresolved P0, P1, or unaccepted P2;
- recordings prove iOS committed and canceled edge back-swipe, Android system Back with and without the keyboard, keyboard/visual-viewport geometry, dynamic browser chrome, reduced motion media-query state, exact 200% text setting, deterministic recovery/fallback states, and the Home touch journey.

Any unmet condition is `REJECT` or `NOT EXECUTED`, never a partial pass. Fix the verified cause, create a new immutable artifact, and rerun the entire affected browser family; rerun all four lanes when shared shell, Gallery, typography, media, or build output changes.

This gate and `mobile-usability-validation.md` must both pass on the same immutable artifact before `design-qa.md` may state overall final mobile UX `APPROVE`.
