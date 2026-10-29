import { THEMES, DEFAULT_SETTINGS, getTheme, sanitizeSettings } from "../src/themes.js";
import { loadSettings, saveSettings, resetSettings, saveWallpaper, getWallpaperDataUrl, deleteWallpaper } from "../src/storage.js";

const $ = id => document.getElementById(id);
let committed = await loadSettings();
let draft = structuredClone(committed);
let previewTimer = null;

const themeGrid = $("themeGrid");
const saveStatus = $("saveStatus");
const toast = $("toast");

function tell(message, isError = false) {
  toast.textContent = message;
  toast.style.borderColor = isError ? "#ff9eac88" : "#ffffff27";
  toast.classList.add("visible");
  window.clearTimeout(tell.timer);
  tell.timer = window.setTimeout(() => toast.classList.remove("visible"), 2600);
}

function setStatus(text) { saveStatus.textContent = text; }

function themeSwatch(theme) {
  return `linear-gradient(135deg, ${theme.colors.surfaceStrong}, ${theme.colors.accent}55), ${theme.colors.surface}`;
}

function renderThemes() {
  themeGrid.replaceChildren();
  for (const theme of THEMES) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-card";
    button.setAttribute("aria-pressed", String(draft.activeThemeId === theme.id));
    button.setAttribute("aria-label", theme.name + ": " + theme.description);
    const swatch = document.createElement("span");
    swatch.className = "swatch";
    swatch.style.background = themeSwatch(theme);
    const name = document.createElement("span");
    name.className = "theme-name";
    name.textContent = theme.name.replace(" Glass", "");
    button.append(swatch, name);
    button.addEventListener("click", () => {
      draft.activeThemeId = theme.id;
      if (draft.wallpaper.kind !== "custom") draft.wallpaper = { kind: "built-in", id: theme.wallpaper };
      syncControls();
      renderThemes();
      persistDraft();
    });
    themeGrid.append(button);
  }
}

function syncControls() {
  $("transparency").value = draft.customizations.transparency;
  $("blur").value = draft.customizations.blur;
  $("overlay").value = Math.round(draft.customizations.overlay * 100);
  $("transparencyValue").value = draft.customizations.transparency + "%";
  $("blurValue").value = draft.customizations.blur + " px";
  $("overlayValue").value = Math.round(draft.customizations.overlay * 100) + "%";
  $("wallpaperStatus").textContent = draft.wallpaper.kind === "custom" ? "Custom wallpaper stored locally." : "Built-in atmosphere selected.";
  renderThemes();
  renderPresets();
}

async function sendToActiveTab(message) {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab?.id || !/^https:\/\/(chatgpt\.com|chat\.openai\.com)\//.test(tab.url || "")) return;
  try {
    await chrome.tabs.sendMessage(tab.id, message);
  } catch {
    // Page may have been loaded before installation; reload is required for the content script.
  }
}

async function applyPreview() {
  const theme = getTheme(draft);
  await sendToActiveTab({ type: "CHATGPT_THEME_STUDIO_APPLY", settings: { theme, customizations: draft.customizations } });
  const url = await getWallpaperDataUrl(draft.wallpaper);
  if (url) {
    await sendToActiveTab({ type: "CHATGPT_THEME_STUDIO_SET_WALLPAPER", dataUrl: url });
  }
}

async function persistDraft() {
  setStatus("Saving…");
  try {
    committed = await saveSettings(draft);
    draft = structuredClone(committed);
    await applyPreview();
    setStatus("Saved");
  } catch (error) {
    setStatus("Not saved");
    tell("Could not save settings: " + error.message, true);
  }
}

function renderPresets() {
  const list = $("presetList");
  list.replaceChildren();
  if (!draft.customPresets.length) {
    const empty = document.createElement("div");
    empty.className = "empty-presets";
    empty.textContent = "Saved looks will appear here.";
    list.append(empty);
    return;
  }
  for (const preset of draft.customPresets) {
    const item = document.createElement("div");
    item.className = "preset-item";
    const name = document.createElement("span");
    name.textContent = preset.name;
    const use = document.createElement("button");
    use.type = "button";
    use.textContent = "Apply";
    use.addEventListener("click", async () => {
      draft.activeThemeId = preset.settings.activeThemeId;
      draft.customizations = structuredClone(preset.settings.customizations);
      draft.wallpaper = structuredClone(preset.settings.wallpaper);
      syncControls();
      await persistDraft();
    });
    const rename = document.createElement("button");
    rename.type = "button";
    rename.textContent = "Rename";
    rename.addEventListener("click", async () => {
      const next = window.prompt("Rename preset", preset.name);
      if (next === null) return;
      const value = next.trim();
      if (!value) return tell("Preset name cannot be empty.", true);
      preset.name = value.slice(0, 60);
      await persistDraft();
      syncControls();
    });
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Delete";
    remove.addEventListener("click", async () => {
      if (!window.confirm(`Delete “${preset.name}”? This does not affect your current theme.`)) return;
      draft.customPresets = draft.customPresets.filter(p => p.id !== preset.id);
      await persistDraft();
      syncControls();
    });
    item.append(name, use, rename, remove);
    list.append(item);
  }
}

for (const [id, key, divisor] of [
  ["transparency", "transparency", 1],
  ["blur", "blur", 1],
  ["overlay", "overlay", 100]
]) {
  $(id).addEventListener("input", () => {
    draft.customizations[key] = Number($(id).value) / divisor;
    if (key === "overlay") draft.customizations.overlay = Math.min(0.7, Math.max(0, draft.customizations.overlay));
    $("transparencyValue").value = draft.customizations.transparency + "%";
    $("blurValue").value = draft.customizations.blur + " px";
    $("overlayValue").value = Math.round(draft.customizations.overlay * 100) + "%";
    setStatus("Previewing…");
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => persistDraft(), 250);
  });
}

$("wallpaperFile").addEventListener("change", async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const wallpaper = await saveWallpaper(file);
    if (draft.wallpaper.kind === "custom") await deleteWallpaper(draft.wallpaper);
    draft.wallpaper = wallpaper;
    await persistDraft();
    syncControls();
    tell("Wallpaper saved on this device.");
  } catch (error) {
    tell(error.message, true);
  } finally {
    event.target.value = "";
  }
});

$("savePreset").addEventListener("click", async () => {
  const name = $("presetName").value.trim();
  if (!name) return tell("Enter a name for this preset.", true);
  if (draft.customPresets.length >= 50) return tell("Preset limit reached (50).", true);
  draft.customPresets.push({
    id: crypto.randomUUID(),
    name: name.slice(0, 60),
    settings: {
      activeThemeId: draft.activeThemeId,
      customizations: structuredClone(draft.customizations),
      wallpaper: structuredClone(draft.wallpaper)
    }
  });
  $("presetName").value = "";
  await persistDraft();
  syncControls();
  tell("Preset saved.");
});

$("resetButton").addEventListener("click", async () => {
  if (!window.confirm("Reset theme settings to Twilight Glass? Your saved presets will remain.")) return;
  draft = await resetSettings();
  committed = structuredClone(draft);
  await sendToActiveTab({ type: "CHATGPT_THEME_STUDIO_RESET" });
  syncControls();
  await applyPreview();
  setStatus("Reset");
  tell("Theme settings reset. Saved presets were preserved.");
});

chrome.storage.onChanged.addListener((changes, area) => {
  if ((area === "sync" || area === "local") && changes.themeStudioSettings) {
    loadSettings().then(settings => {
      committed = settings;
      draft = structuredClone(settings);
      syncControls();
    });
  }
});

draft = sanitizeSettings(draft);
syncControls();
await applyPreview();
setStatus("Ready");