# ChatGPT Theme Studio

A Manifest V3 Chrome extension that adds customizable wallpaper and glass-style surfaces to ChatGPT.

## Current status

Saved settings are applied when the popup opens and are also restored by the extension service worker after a matching ChatGPT tab finishes loading or settings change. The live appearance still depends on ChatGPT's changing DOM and must be checked in Chrome against the target reference image.

## Features

- Five built-in themes: Twilight, Aurora, Rose Quartz, Midnight, and Arctic.
- Wallpaper selection, local custom image uploads, blur/transparency/overlay controls, and saved presets.
- Preview, apply, cancel, and reset controls.
- Theme settings stored through Chrome storage; custom wallpaper data is kept locally.
- No analytics or remote executable code.

## Privacy and network behavior

The default Twilight photo is requested from Unsplash at `images.unsplash.com`. That image request requires an internet connection. Other built-in wallpapers are bundled SVGs, and uploaded wallpapers are stored locally. ChatGPT conversations are not read or sent anywhere by this extension; the content script only styles the page.

## Development

No build step is required. In Chrome, open `chrome://extensions`, enable Developer mode, and choose **Load unpacked** for the directory containing `manifest.json`.

Run checks with:

```sh
npm test
npm run check
```

These static checks do not replace live browser tests. Before declaring the visual match complete, verify wallpaper visibility, legibility, navigation, message content, composer typing and sending, special composer modes, reset, and narrow/wide layouts in Chrome. Do not treat the presence of a CI workflow as evidence of a passing run; check the actual run result.
