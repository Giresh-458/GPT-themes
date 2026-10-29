# QA status — ChatGPT Theme Studio

Audit date: 2026-10-29

## Scope

Reviewed the current `main` implementation and made a follow-up fix on `fix/persistence-and-qa-audit` for saved-theme restoration. The changes are intended for the supplied reference: a scenic wallpaper behind translucent blue/purple glass surfaces.

## Findings from source inspection

| Area | Finding | Action |
|---|---|---|
| Theme persistence | Before this fix, the content script only received settings when the popup sent messages. A page reload removed the theme until the popup was opened again. | Added an MV3 module service worker that reapplies saved settings after ChatGPT tabs finish loading and when saved settings change. |
| CSS compatibility | Runtime detection uses DOM-size, opacity, and class-name heuristics to find opaque wrappers. ChatGPT's DOM can change and the heuristic can miss surfaces or mark an unintended wrapper. | Kept the fallback because it addresses the previously observed central opaque band; it remains a browser-regression risk, not a proven universal fix. |
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
| Theme persistence after reload | Source fix added; runtime not verified | Service worker applies settings on completed ChatGPT navigation and storage changes. |
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

## Honest completion criterion

Do not mark the visual work as complete until the static checks pass and the manual Chrome checklist is exercised. The source change improves persistence, but it does not prove the final appearance or all ChatGPT routes are correct.
