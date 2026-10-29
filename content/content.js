(() => {
  "use strict";
  const ROOT_ATTRIBUTE = "data-chatgpt-theme-studio";

  function clamp(value, min, max, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  }
  function cssColor(value, fallback) {
    return typeof value === "string" && value.length < 100 ? value : fallback;
  }

  function apply(settings) {
    if (!settings || typeof settings !== "object") return;
    const theme = settings.theme || {};
    const custom = settings.customizations || {};
    const colors = theme.colors || {};
    document.documentElement.setAttribute(ROOT_ATTRIBUTE, "true");
    document.documentElement.style.setProperty("--gpts-text", cssColor(colors.text, "#f7f5ff"));
    document.documentElement.style.setProperty("--gpts-muted", cssColor(colors.muted, "#d5d4ea"));
    document.documentElement.style.setProperty("--gpts-surface", cssColor(colors.surface, "rgba(30, 42, 86, 0.85)"));
    document.documentElement.style.setProperty("--gpts-surface-strong", cssColor(colors.surfaceStrong, "rgba(25, 34, 69, 0.93)"));
    document.documentElement.style.setProperty("--gpts-border", cssColor(colors.border, "rgba(226, 228, 255, 0.27)"));
    document.documentElement.style.setProperty("--gpts-accent", cssColor(colors.accent, "#b6c7ff"));
    document.documentElement.style.setProperty("--gpts-shadow", cssColor(colors.shadow, "rgba(5, 9, 34, 0.34)"));
    document.documentElement.style.setProperty("--gpts-blur", clamp(custom.blur, 0, 30, 18) + "px");
    document.documentElement.style.setProperty("--gpts-overlay", String(clamp(custom.overlay, 0, 0.7, 0.26)));
    document.documentElement.style.setProperty("--gpts-transparency", String(clamp(custom.transparency, 45, 96, 79)));
    document.documentElement.style.setProperty("--gpts-border-strength", String(clamp(custom.borderStrength, 0, 2, 1)));
    document.documentElement.style.setProperty("--gpts-shadow-strength", String(clamp(custom.shadowStrength, 0, 2, 1)));
  }

  function setDataUrl(dataUrl) {
    document.documentElement.style.setProperty("--gpts-wallpaper", 'url("' + dataUrl + '")');
  }
  function reset() {
    document.documentElement.removeAttribute(ROOT_ATTRIBUTE);
    for (const name of [
      "--gpts-text", "--gpts-muted", "--gpts-surface", "--gpts-surface-strong",
      "--gpts-border", "--gpts-accent", "--gpts-shadow", "--gpts-blur",
      "--gpts-overlay", "--gpts-transparency", "--gpts-border-strength",
      "--gpts-shadow-strength", "--gpts-wallpaper"
    ]) document.documentElement.style.removeProperty(name);
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "CHATGPT_THEME_STUDIO_APPLY") {
      apply(message.settings);
      sendResponse({ ok: true });
    } else if (message?.type === "CHATGPT_THEME_STUDIO_RESET") {
      reset();
      sendResponse({ ok: true });
    } else if (message?.type === "CHATGPT_THEME_STUDIO_SET_WALLPAPER") {
      const url = message.dataUrl;
      if (typeof url === "string" && /^data:image\/(png|jpeg|webp);base64,/.test(url)) {
        setDataUrl(url);
        sendResponse({ ok: true });
      } else {
        sendResponse({ ok: false, error: "Invalid local wallpaper data." });
      }
    } else if (message?.type === "CHATGPT_THEME_STUDIO_CLEAR_WALLPAPER") {
      document.documentElement.style.removeProperty("--gpts-wallpaper");
      sendResponse({ ok: true });
    } else if (message?.type === "CHATGPT_THEME_STUDIO_SET_BUILTIN_WALLPAPER") {
      const svg = message.svg;
      // This SVG is packaged in the extension source, not collected from the website.
      if (typeof svg === "string" && svg.length < 90000 && svg.startsWith("<svg ")) {
        const dataUrl = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
        setDataUrl(dataUrl);
        sendResponse({ ok: true });
      } else {
        sendResponse({ ok: false, error: "Invalid built-in wallpaper." });
      }
    }
    return true;
  });
})();