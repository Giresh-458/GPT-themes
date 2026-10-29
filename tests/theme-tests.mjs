import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const manifest = JSON.parse(readFileSync(new URL("../manifest.json", import.meta.url), "utf8"));
const backgroundSource = readFileSync(new URL("../background.js", import.meta.url), "utf8");
const contentSource = readFileSync(new URL("../content/content.js", import.meta.url), "utf8");
assert.equal(manifest.manifest_version, 3, "extension must use Manifest V3");
assert.equal(manifest.background?.service_worker, "background.js", "saved themes must restore through the service worker");
assert.equal(manifest.background?.type, "module", "service worker must support ES module imports");
assert.ok(manifest.permissions.includes("storage"), "storage permission is required");
assert.ok(manifest.content_scripts.some(script => script.matches.includes("https://chatgpt.com/*")), "content script must target ChatGPT");
assert.ok(backgroundSource.includes("CHATGPT_THEME_STUDIO_CONTENT_READY"), "service worker must support the content-script readiness handshake");
assert.ok(contentSource.includes("CHATGPT_THEME_STUDIO_CONTENT_READY"), "content script must request saved settings after its listener is ready");
console.log("PASS: extension manifest and persistent theme restoration wiring");
import { DEFAULT_SETTINGS, THEMES, WALLPAPERS, REMOTE_WALLPAPERS, sanitizeSettings, clampNumber, getTheme } from "../src/themes.js";

assert.equal(THEMES.length, 5, "exactly five built-in themes");
assert.equal(new Set(THEMES.map(t => t.id)).size, 5, "theme IDs must be unique");
assert.equal(getTheme(DEFAULT_SETTINGS).id, "twilight");
assert.equal(clampNumber("14", 0, 30, 18), 14);
assert.equal(clampNumber(Number.NaN, 0, 30, 18), 18);
assert.equal(clampNumber(1000, 0, 30, 18), 30);

const sanitized = sanitizeSettings({
  activeThemeId: "not-a-theme",
  customizations: { blur: 1000, transparency: -1, overlay: "nan" },
  customPresets: [{ id: "ok", name: "  Personal  ", settings: { activeThemeId: "aurora", customizations: {}, wallpaper: {} } },
    { id: "broken", name: "", settings: {} }]
});
assert.equal(sanitized.activeThemeId, "twilight");
assert.equal(sanitized.customizations.blur, 30);
assert.equal(sanitized.customizations.transparency, 45);
assert.equal(sanitized.customizations.overlay, DEFAULT_SETTINGS.customizations.overlay);
assert.equal(sanitized.customPresets.length, 1);
assert.equal(sanitized.customPresets[0].name, "Personal");
assert.equal(sanitized.customPresets[0].settings.activeThemeId, "aurora");
assert.equal(sanitizeSettings(null).activeThemeId, "twilight");

for (const theme of THEMES) {
  assert.ok(theme.colors.text);
  assert.ok(theme.colors.surface);
  assert.ok(theme.colors.surfaceStrong);
  assert.ok(theme.blur >= 0 && theme.blur <= 30);
  assert.ok(theme.transparency >= 45 && theme.transparency <= 96);
}
console.log("PASS: theme configuration and sanitization tests");
assert.ok(WALLPAPERS.aurora.startsWith("<svg "), "bundled SVG wallpaper remains available");
assert.ok(REMOTE_WALLPAPERS.twilight.startsWith("https://images.unsplash.com/"), "Twilight photo wallpaper uses the expected static image host");
assert.ok(REMOTE_WALLPAPERS.twilight.includes("photo-1776348568867-24146d18b736"), "Twilight photo path is stable and allowlisted");
console.log("PASS: wallpaper configuration");
