import { DEFAULT_SETTINGS, sanitizeSettings } from "./themes.js";

const SETTINGS_KEY = "themeStudioSettings";
const WALLPAPER_PREFIX = "themeStudioWallpaper:";

function storageGet(area, key) {
  return new Promise((resolve, reject) => {
    chrome.storage[area].get(key, result => {
      const error = chrome.runtime.lastError;
      if (error) reject(new Error(error.message));
      else resolve(result);
    });
  });
}

function storageSet(area, values) {
  return new Promise((resolve, reject) => {
    chrome.storage[area].set(values, () => {
      const error = chrome.runtime.lastError;
      if (error) reject(new Error(error.message));
      else resolve();
    });
  });
}

function storageRemove(area, key) {
  return new Promise((resolve, reject) => {
    chrome.storage[area].remove(key, () => {
      const error = chrome.runtime.lastError;
      if (error) reject(new Error(error.message));
      else resolve();
    });
  });
}

export async function loadSettings() {
  try {
    const result = await storageGet("sync", SETTINGS_KEY);
    if (result?.[SETTINGS_KEY]) return sanitizeSettings(result[SETTINGS_KEY]);
  } catch {
    // Sync storage can be unavailable or exceed quotas; check local fallback next.
  }
  try {
    const result = await storageGet("local", SETTINGS_KEY);
    return sanitizeSettings(result?.[SETTINGS_KEY] || DEFAULT_SETTINGS);
  } catch {
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export async function saveSettings(settings) {
  const safe = sanitizeSettings(settings);
  try {
    await storageSet("sync", { [SETTINGS_KEY]: safe });
  } catch {
    // Keep settings usable even when sync storage is unavailable.
    await storageSet("local", { [SETTINGS_KEY]: safe });
  }
  return safe;
}

export async function resetSettings() {
  const settings = structuredClone(DEFAULT_SETTINGS);
  let syncSucceeded = false;
  try {
    await storageSet("sync", { [SETTINGS_KEY]: settings });
    syncSucceeded = true;
  } catch {
    await storageSet("local", { [SETTINGS_KEY]: settings });
  }
  if (syncSucceeded) {
    try { await storageRemove("local", SETTINGS_KEY); } catch { /* no local fallback to clean up */ }
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
    reader.onload = () => {
      if (typeof reader.result !== "string" || !/^data:image\/(png|jpeg|webp);base64,/.test(reader.result)) {
        reject(new Error("The selected file did not decode as a supported image."));
      } else resolve(reader.result);
    };
    reader.readAsDataURL(file);
  });

  const id = crypto.randomUUID();
  await storageSet("local", { [WALLPAPER_PREFIX + id]: dataUrl });
  return { kind: "custom", id };
}

export async function getWallpaperDataUrl(wallpaper) {
  if (!wallpaper || wallpaper.kind !== "custom") return null;
  try {
    const result = await storageGet("local", WALLPAPER_PREFIX + wallpaper.id);
    const value = result?.[WALLPAPER_PREFIX + wallpaper.id];
    return typeof value === "string" && /^data:image\/(png|jpeg|webp);base64,/.test(value) ? value : null;
  } catch {
    return null;
  }
}

export async function deleteWallpaper(wallpaper) {
  if (!wallpaper || wallpaper.kind !== "custom") return;
  await storageRemove("local", WALLPAPER_PREFIX + wallpaper.id);
}