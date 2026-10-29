import { DEFAULT_SETTINGS, sanitizeSettings } from "./themes.js";

const SETTINGS_KEY = "themeStudioSettings";
const WALLPAPER_PREFIX = "themeStudioWallpaper:";

function chromeCall(fn, ...args) {
  return new Promise((resolve, reject) => {
    fn(...args, result => {
      const err = chrome.runtime.lastError;
      if (err) reject(new Error(err.message));
      else resolve(result);
    });
  });
}

export async function loadSettings() {
  try {
    const result = await chromeCall(chrome.storage.sync.get, SETTINGS_KEY);
    if (!result || !result[SETTINGS_KEY]) return structuredClone(DEFAULT_SETTINGS);
    return sanitizeSettings(result[SETTINGS_KEY]);
  } catch {
    try {
      const result = await chromeCall(chrome.storage.local.get, SETTINGS_KEY);
      return sanitizeSettings(result?.[SETTINGS_KEY] || DEFAULT_SETTINGS);
    } catch {
      return structuredClone(DEFAULT_SETTINGS);
    }
  }
}

export async function saveSettings(settings) {
  const safe = sanitizeSettings(settings);
  try {
    await chromeCall(chrome.storage.sync.set, { [SETTINGS_KEY]: safe });
  } catch {
    await chromeCall(chrome.storage.local.set, { [SETTINGS_KEY]: safe });
  }
  return safe;
}

export async function resetSettings() {
  const settings = structuredClone(DEFAULT_SETTINGS);
  try {
    await chromeCall(chrome.storage.sync.set, { [SETTINGS_KEY]: settings });
  } catch {
    await chromeCall(chrome.storage.local.set, { [SETTINGS_KEY]: settings });
  }
  return settings;
}

export async function saveWallpaper(file) {
  const maxBytes = 5 * 1024 * 1024;
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!file || !allowedTypes.includes(file.type)) {
    throw new Error("Choose a JPEG, PNG, or WebP image.");
  }
  if (file.size <= 0 || file.size > maxBytes) {
    throw new Error("Wallpaper must be smaller than 5 MB.");
  }

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read this image."));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });

  const id = crypto.randomUUID();
  await chromeCall(chrome.storage.local.set, { [WALLPAPER_PREFIX + id]: dataUrl });
  return { kind: "custom", id };
}

export async function getWallpaperDataUrl(wallpaper) {
  if (!wallpaper || wallpaper.kind !== "custom") return null;
  try {
    const result = await chromeCall(chrome.storage.local.get, WALLPAPER_PREFIX + wallpaper.id);
    const value = result?.[WALLPAPER_PREFIX + wallpaper.id];
    return typeof value === "string" && value.startsWith("data:image/") ? value : null;
  } catch {
    return null;
  }
}

export async function deleteWallpaper(wallpaper) {
  if (!wallpaper || wallpaper.kind !== "custom") return;
  await chromeCall(chrome.storage.local.remove, WALLPAPER_PREFIX + wallpaper.id);
}