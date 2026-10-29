# ChatGPT Theme Studio

A privacy-conscious Manifest V3 Chrome extension for a glassmorphism theme layer on ChatGPT.

## Project status

The extension now applies a full-page wallpaper and glass surface layer using observed ChatGPT DOM patterns plus a guarded fallback for large opaque layout wrappers. ChatGPT's DOM changes over time, so the landing page, conversation view, special composer modes, and responsive layouts still require browser regression testing.

## Design principles

- Preserve normal ChatGPT behavior and composer semantics.
- Do not claim browser/DOM verification unless it has actually been performed.
- Use local storage for local preferences and uploaded wallpaper data; synchronize only small settings where supported.
- Avoid remote executable code and analytics. The default Twilight photo is hotlinked from Unsplash; other built-in wallpapers are bundled SVGs, and custom uploads remain local.
- Keep all extension effects clearly scoped and reversible.
- Prefer readable surfaces and sufficient contrast over decorative transparency.

## Planned initial themes

1. Twilight Glass
2. Aurora Glass
3. Rose Quartz Glass
4. Midnight Glass
5. Arctic Glass

## Development

No build toolchain is required for the initial vanilla JavaScript implementation. Load the extension using Chrome's **Load unpacked** flow by selecting the directory containing `manifest.json`.

The default Twilight wallpaper loads a static image from Unsplash, so the first use of that theme requires an internet connection and sends an ordinary image request to images.unsplash.com. Other bundled wallpapers and uploaded custom wallpapers do not use that remote image. Real-browser verification requires Chrome with an authenticated ChatGPT session. Automated static checks are not a substitute for testing the live composer, navigation, menus, and special modes.

## Verification status

The initial commit establishes the repository baseline. Do not interpret this README or a successful package operation as evidence that the extension has passed live-browser verification.
