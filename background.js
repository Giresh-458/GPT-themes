import { DEFAULT_SETTINGS, REMOTE_WALLPAPERS, WALLPAPERS, getTheme, sanitizeSettings } from "./src/themes.js";
import { getWallpaperDataUrl, loadSettings } from "./src/storage.js";

const CHATGPT_URLS = ["https://chatgpt.com/*", "https://chat.openai.com/*"];

function isChatGPTUrl(url) {
  return typeof url === "string" && /^https:\/\/(chatgpt\.com|chat\.openai\.com)\//.test(url);
}

async function sendToTab(tabId, message) {
  try {
    await chrome.tabs.sendMessage(tabId, message);
    return true;
  } catch {
    // A navigation can complete before the content script is ready; a later
    // completed navigation or opening the popup will apply the theme again.
    return false;
  }
}

async function applyToTab(tabId, url) {
  if (!isChatGPTUrl(url)) return;
  const settings = sanitizeSettings(await loadSettings().catch(() => DEFAULT_SETTINGS));
  const theme = getTheme(settings);
  await sendToTab(tabId, {
    type: "CHATGPT_THEME_STUDIO_APPLY",
    settings: { theme, customizations: settings.customizations }
  });

  if (settings.wallpaper?.kind === "custom") {
    const dataUrl = await getWallpaperDataUrl(settings.wallpaper);
    if (dataUrl) {
      await sendToTab(tabId, { type: "CHATGPT_THEME_STUDIO_SET_WALLPAPER", dataUrl });
      return;
    }
  }

  const wallpaperId = settings.wallpaper?.id || theme.wallpaper;
  const remoteUrl = REMOTE_WALLPAPERS[wallpaperId];
  if (remoteUrl) {
    await sendToTab(tabId, { type: "CHATGPT_THEME_STUDIO_SET_REMOTE_WALLPAPER", url: remoteUrl });
    return;
  }

  const svg = WALLPAPERS[wallpaperId] || WALLPAPERS[theme.wallpaper] || WALLPAPERS.twilight;
  await sendToTab(tabId, { type: "CHATGPT_THEME_STUDIO_SET_BUILTIN_WALLPAPER", svg });
}

async function applyToOpenChatGPTTabs() {
  let tabs = [];
  try {
    tabs = await chrome.tabs.query({ url: CHATGPT_URLS });
  } catch {
    return;
  }
  await Promise.all(tabs.filter(tab => Number.isInteger(tab.id) && isChatGPTUrl(tab.url))
    .map(tab => applyToTab(tab.id, tab.url)));
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "CHATGPT_THEME_STUDIO_CONTENT_READY" || !Number.isInteger(sender.tab?.id)) return;
  const url = sender.tab.url;
  if (!isChatGPTUrl(url)) {
    sendResponse({ ok: false, error: "Unsupported page." });
    return;
  }
  void applyToTab(sender.tab.id, url).then(
    () => sendResponse({ ok: true }),
    () => sendResponse({ ok: false, error: "Could not restore saved theme." })
  );
  return true;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && isChatGPTUrl(tab.url)) {
    void applyToTab(tabId, tab.url);
  }
});

chrome.runtime.onInstalled.addListener(() => { void applyToOpenChatGPTTabs(); });
chrome.storage.onChanged.addListener((changes, area) => {
  if ((area === "sync" || area === "local") && changes.themeStudioSettings) {
    void applyToOpenChatGPTTabs();
  }
});
