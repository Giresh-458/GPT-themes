import { THEMES, DEFAULT_SETTINGS, WALLPAPERS, REMOTE_WALLPAPERS, getTheme, sanitizeSettings } from "../src/themes.js";
import { loadSettings, saveSettings, resetSettings, saveWallpaper, getWallpaperDataUrl, deleteWallpaper } from "../src/storage.js";

const $ = id => document.getElementById(id);
let committed = await loadSettings();
let draft = structuredClone(committed);
let previewTimer = null;
let toastTimer = null;
let newlyUploadedWallpaper = null;
const saveStatus = $("saveStatus");
const toast = $("toast");

function tell(message, isError = false) {
  toast.textContent = message;
  toast.style.borderColor = isError ? "#ff9eac88" : "#ffffff27";
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2600);
}
function setStatus(text) { saveStatus.textContent = text; }
function isDirty() { return JSON.stringify(draft) !== JSON.stringify(committed); }

function themeSwatch(theme) {
  return `linear-gradient(135deg, ${theme.colors.surfaceStrong}, ${theme.colors.accent}), ${theme.colors.surface}`;
}
function renderThemes() {
  const grid = $("themeGrid");
  grid.replaceChildren();
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
    button.addEventListener("click", async () => {
      draft.activeThemeId = theme.id;
      if (draft.wallpaper.kind !== "custom") draft.wallpaper = { kind: "built-in", id: theme.wallpaper };
      syncControls();
      await previewDraft();
    });
    grid.append(button);
  }
}
function syncControls() {
  $("transparency").value = draft.customizations.transparency;
  $("blur").value = draft.customizations.blur;
  $("overlay").value = Math.round(draft.customizations.overlay * 100);
  $("transparencyValue").value = draft.customizations.transparency + "%";
  $("blurValue").value = draft.customizations.blur + " px";
  $("overlayValue").value = Math.round(draft.customizations.overlay * 100) + "%";
  $("wallpaperStatus").textContent = draft.wallpaper.kind === "custom"
    ? "Custom wallpaper stored locally."
    : "Bundled wallpaper selected.";
  renderThemes();
  renderPresets();
  $("applyChanges").disabled = !isDirty();
  $("cancelChanges").disabled = !isDirty();
}
async function sendToActiveTab(message) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !/^https:\/\/(chatgpt\.com|chat\.openai\.com)\//.test(tab.url || "")) return;
  try {
    await chrome.tabs.sendMessage(tab.id, message);
  } catch {
    // A tab opened before installation may need a reload to inject the content script.
  }
}
async function applyVisual(settings) {
  const theme = getTheme(settings);
  await sendToActiveTab({
    type: "CHATGPT_THEME_STUDIO_APPLY",
    settings: { theme, customizations: settings.customizations }
  });
  if (settings.wallpaper?.kind === "custom") {
    const url = await getWallpaperDataUrl(settings.wallpaper);
    if (url) {
      await sendToActiveTab({ type: "CHATGPT_THEME_STUDIO_SET_WALLPAPER", dataUrl: url });
      return;
    }
    tell("Saved custom wallpaper is unavailable on this device. Using the bundled wallpaper.", true);
  }
  const wallpaperId = settings.wallpaper?.id || theme.wallpaper;
  const remoteUrl = REMOTE_WALLPAPERS[wallpaperId];
  if (remoteUrl) {
    await sendToActiveTab({ type: "CHATGPT_THEME_STUDIO_SET_REMOTE_WALLPAPER", url: remoteUrl });
    return;
  }
  const svg = WALLPAPERS[wallpaperId] || WALLPAPERS[theme.wallpaper] || WALLPAPERS.twilight;
  await sendToActiveTab({ type: "CHATGPT_THEME_STUDIO_SET_BUILTIN_WALLPAPER", svg });
}
async function previewDraft() {
  setStatus("Preview only");
  try {
    await applyVisual(draft);
    syncControls();
  } catch (error) {
    tell("Preview failed: " + error.message, true);
  }
}
async function commitDraft() {
  try {
    setStatus("Saving…");
    committed = await saveSettings(draft);
    draft = structuredClone(committed);
    if (newlyUploadedWallpaper && newlyUploadedWallpaper.id !== committed.wallpaper.id) {
      await deleteWallpaper(newlyUploadedWallpaper);
    }
    newlyUploadedWallpaper = null;
    await applyVisual(committed);
    syncControls();
    setStatus("Saved");
    tell("Changes saved.");
  } catch (error) {
    setStatus("Not saved");
    tell("Could not save settings: " + error.message, true);
  }
}
async function cancelDraft() {
  clearTimeout(previewTimer);
  draft = structuredClone(committed);
  if (newlyUploadedWallpaper) {
    try { await deleteWallpaper(newlyUploadedWallpaper); } catch { /* saved settings remain intact */ }
  }
  newlyUploadedWallpaper = null;
  syncControls();
  await applyVisual(committed);
  setStatus("Restored");
  tell("Preview cancelled; saved settings restored.");
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
    use.type = "button"; use.textContent = "Preview";
    use.addEventListener("click", async () => {
      draft.activeThemeId = preset.settings.activeThemeId;
      draft.customizations = structuredClone(preset.settings.customizations);
      draft.wallpaper = structuredClone(preset.settings.wallpaper);
      syncControls();
      await previewDraft();
    });
    const rename = document.createElement("button");
    rename.type = "button"; rename.textContent = "Rename";
    rename.addEventListener("click", async () => {
      const next = window.prompt("Rename preset", preset.name);
      if (next === null) return;
      if (!next.trim()) return tell("Preset name cannot be empty.", true);
      preset.name = next.trim().slice(0, 60);
      syncControls();
      await commitDraft();
    });
    const remove = document.createElement("button");
    remove.type = "button"; remove.textContent = "Delete";
    remove.addEventListener("click", async () => {
      if (!window.confirm(`Delete “${preset.name}”? This does not affect your current theme.`)) return;
      draft.customPresets = draft.customPresets.filter(p => p.id !== preset.id);
      syncControls();
      await commitDraft();
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
    setStatus("Preview only");
    $("applyChanges").disabled = false;
    $("cancelChanges").disabled = false;
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => previewDraft(), 120);
  });
}

$("wallpaperFile").addEventListener("change", async event => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const wallpaper = await saveWallpaper(file);
    if (newlyUploadedWallpaper) {
      try { await deleteWallpaper(newlyUploadedWallpaper); } catch { /* best-effort temporary cleanup */ }
    }
    newlyUploadedWallpaper = wallpaper;
    draft.wallpaper = wallpaper;
    await previewDraft();
    tell("Wallpaper selected for preview. Apply to save.");
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
  syncControls();
  await commitDraft();
});
$("applyChanges").addEventListener("click", commitDraft);
$("cancelChanges").addEventListener("click", cancelDraft);
$("resetButton").addEventListener("click", async () => {
  if (!window.confirm("Reset current settings to Twilight Glass? Saved presets will remain.")) return;
  clearTimeout(previewTimer);
  draft = structuredClone(DEFAULT_SETTINGS);
  syncControls();
  await previewDraft();
  await commitDraft();
  await sendToActiveTab({ type: "CHATGPT_THEME_STUDIO_RESET" });
  await applyVisual(committed);
  setStatus("Reset");
});
chrome.storage.onChanged.addListener((changes, area) => {
  if ((area === "sync" || area === "local") && changes.themeStudioSettings) {
    loadSettings().then(settings => {
      committed = settings;
      draft = structuredClone(settings);
      newlyUploadedWallpaper = null;
      syncControls();
      applyVisual(committed);
    });
  }
});
draft = sanitizeSettings(draft);
syncControls();
await applyVisual(committed);
setStatus("Ready");