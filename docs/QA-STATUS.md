# QA status — ChatGPT Theme Studio

Audit date: 2026-10-29

## Scope

Reviewed the current `main` implementation and pushed a follow-up fix for saved-theme restoration. The changes are intended for the supplied reference: a scenic wallpaper behind translucent blue/purple glass surfaces.

## Findings from source inspection

| Area | Finding | Action |
|---|---|---|
| Theme persistence | Before this fix, the content script only received settings when the popup sent messages. A page reload removed the theme until the popup was opened again. | Added an MV3 module service worker that reapplies saved settings after ChatGPT tabs finish loading and when saved settings change. |
| CSS compatibility | Runtime detection uses DOM-size, opacity, and class-name heuristics to find opaque wrappers. ChatGPT's DOM can change and the heuristic can miss surfaces or mark an unintended wrapper. | Kept the fallback; it remains a browser-regression risk, not a proven universal fix. Scans are now throttled and ignore message/composer-heavy regions to reduce repeated work. |
| Remote wallpaper | Twilight requests a static image from Unsplash. Host permission is declared, but source inspection alone cannot establish whether the current ChatGPT CSP/network policy will allow the image in every environment. | Documented the external request and kept the URL allowlisted in the content script. |
| Custom wallpapers | Image type and file size are checked; decoded pixel dimensions are not constrained. | Existing behavior retained; test large-dimension images in Chrome before claiming full validation. |
| Popup lifecycle | Preview state is applied to the page before commit; closing the popup without choosing Apply/Cancel does not provide a guaranteed cleanup event. | Remains an unresolved behavior to test and improve. |

## Verification status

| Check | Status | Evidence |
|---|---|---|
| Current source and manifest inspection | Completed | Files fetched from the repository's `main` branch and reviewed. |
| Node unit tests | Pending | Must run `npm test` or inspect a real GitHub Actions result after merge. |
| JavaScript syntax checks | Pending | `npm run check` now includes `background.js`; must run or confirm CI. |
| Manifest JSON parse | Pending | CI includes a JSON parse check; no successful run is claimed here. |
| Chrome extension load | Not verified | No live Chrome extension runtime was available to this audit. |
| Theme persistence after reload | Source fix added; runtime not verified | Service worker applies settings after the content-script readiness handshake, on completed ChatGPT navigation, and on saved-settings changes. |
| Transparency and contrast control wiring | Source-reviewed and logic-smoke-checked | Higher transparency now lowers surface alpha; the contrast overlay is a dark gradient over the wallpaper. Visual balance still needs Chrome review. |
| Reference screenshot match | Not verified | No after-change screenshot was captured in a live browser. |
| Composer typing/sending and special modes | Not verified | Requires live interaction tests. |
| Responsive layout, menus, code blocks, tables, contrast | Not verified | Requires live visual and interaction regression tests. |

## Manual acceptance checklist

- [ ] Load the unpacked extension from the updated repository.
- [ ] Select each built-in theme; confirm the wallpaper and glass surfaces render.
- [ ] Reload a ChatGPT tab without opening the popup; confirm the saved theme returns.
- [ ] Change settings and confirm already-open ChatGPT tabs update.
- [ ] Type, edit, attach files, use special composer modes, and send a message.
- [ ] Inspect sidebar, conversation header, user/assistant messages, code blocks, tables, menus, and dialogs.
- [ ] Test light/dark appearance and narrow/wide viewports.
- [ ] Test custom wallpaper upload, cancel, reset, missing image data, and offline use.
- [ ] Check console errors, text contrast, and screenshot similarity to the supplied reference.

## Additional static audit (2026-10-29)

- Reviewed the committed manifest, service worker, content script, stylesheet, settings sanitizer, popup/storage code, and test suite from GitHub.
- Ran parse smoke checks for the retrieved JavaScript sources in the available JavaScript runtime after normalizing ES-module syntax. This is not the same as `node --check` on the files.
- Exercised theme sanitization, numeric bounds, preset filtering, manifest JSON parsing, wallpaper configuration, and source-level guards in the available runtime. These checks passed. The repository's actual `npm test` and `npm run check` commands have not been run.
- Fixed two control-direction mismatches found during review: transparency now reduces surface opacity as the label implies, and the contrast overlay darkens the wallpaper instead of fading the wallpaper itself.
- Throttled the document-wide wrapper scan to avoid running it every animation frame during rapid DOM updates, and skip scanning when mutations occur inside common message/composer content. The heuristic itself remains unvalidated in Chrome.

## Honest completion criterion

Do not mark the visual work as complete until the static checks pass and the manual Chrome checklist is exercised. The source change improves persistence, but it does not prove the final appearance or all ChatGPT routes are correct.
