# ChatGPT Theme Studio

A privacy-first Manifest V3 Chrome extension for a glassmorphism theme layer on ChatGPT.

## Project status

This repository is being initialized from scratch. The initial implementation deliberately does **not** guess at ChatGPT's private or unstable DOM structure. The page-theme adapter remains conservative until selectors can be verified against a live authenticated ChatGPT session.

## Design principles

- Preserve normal ChatGPT behavior and composer semantics.
- Do not claim browser/DOM verification unless it has actually been performed.
- Use local storage for local preferences and uploaded wallpaper data; synchronize only small settings where supported.
- Avoid remote executable code, analytics, and external image dependencies.
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

Real-browser verification requires Chrome with an authenticated ChatGPT session. Automated static checks are not a substitute for testing the live composer, navigation, menus, and special modes.

## Verification status

The initial commit establishes the repository baseline. Do not interpret this README or a successful package operation as evidence that the extension has passed live-browser verification.
