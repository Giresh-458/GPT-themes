import assert from "node:assert/strict";
import { DEFAULT_SETTINGS, THEMES, sanitizeSettings, clampNumber, getTheme } from "../src/themes.js";

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