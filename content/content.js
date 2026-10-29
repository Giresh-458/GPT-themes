(() => {
  "use strict";
  const ROOT_ATTRIBUTE = "data-chatgpt-theme-studio";
  const WRAPPER_ATTRIBUTE = "data-gpts-wallpaper-wrapper";
  let observer = null;
  let scanQueued = false;

  function clamp(value, min, max, fallback) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  }
  function cssColor(value, fallback) {
    return typeof value === "string" && value.length < 100 ? value : fallback;
  }
  function root() { return document.documentElement; }
  function withOpacity(color, multiplier) {
    if (typeof color !== "string") return color;
    const rgb = color.match(/^rgba?\\(\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)(?:\\s*,\\s*([\\d.]+))?\\s*\\)$/i);
    if (rgb) {
      const alpha = (rgb[4] === undefined ? 1 : Number(rgb[4])) * multiplier;
      return "rgba(" + rgb[1] + ", " + rgb[2] + ", " + rgb[3] + ", " + Math.max(0, Math.min(1, alpha)) + ")";
    }
    const hex = color.match(/^#([0-9a-f]{6})$/i);
    if (hex) {
      const value = hex[1];
      return "rgba(" + parseInt(value.slice(0,2),16) + ", " + parseInt(value.slice(2,4),16) + ", " + parseInt(value.slice(4,6),16) + ", " + Math.max(0, Math.min(1, multiplier)) + ")";
    }
    return color;
  }

  function apply(settings) {
    if (!settings || typeof settings !== "object") return;
    const theme = settings.theme || {};
    const custom = settings.customizations || {};
    const colors = theme.colors || {};
    root().setAttribute(ROOT_ATTRIBUTE, "true");
    root().style.setProperty("--gpts-text", cssColor(colors.text, "#f7f5ff"));
    root().style.setProperty("--gpts-muted", cssColor(colors.muted, "#d5d4ea"));
    const surface = cssColor(colors.surface, "rgba(30, 42, 86, 0.79)");
    const surfaceStrong = cssColor(colors.surfaceStrong, "rgba(25, 34, 69, 0.91)");
    const transparency = clamp(custom.transparency, 45, 96, 79) / 100;
    root().style.setProperty("--gpts-surface", surface);
    root().style.setProperty("--gpts-surface-strong", surfaceStrong);
    root().style.setProperty("--gpts-surface-effective", withOpacity(surface, transparency));
    root().style.setProperty("--gpts-surface-strong-effective", withOpacity(surfaceStrong, transparency));
    root().style.setProperty("--gpts-border", cssColor(colors.border, "rgba(226, 228, 255, 0.27)"));
    root().style.setProperty("--gpts-accent", cssColor(colors.accent, "#b6c7ff"));
    root().style.setProperty("--gpts-shadow", cssColor(colors.shadow, "rgba(5, 9, 34, 0.34)"));
    root().style.setProperty("--gpts-blur", clamp(custom.blur, 0, 30, 18) + "px");
    root().style.setProperty("--gpts-overlay", String(clamp(custom.overlay, 0, 0.7, 0.26)));
    root().style.setProperty("--gpts-transparency", String(Math.round(transparency * 100)));
    root().style.setProperty("--gpts-border-strength", String(clamp(custom.borderStrength, 0, 2, 1)));
    root().style.setProperty("--gpts-shadow-strength", String(clamp(custom.shadowStrength, 0, 2, 1)));
    startWrapperObserver();
    queueWrapperScan();
  }

  function setDataUrl(dataUrl) {
    root().style.setProperty("--gpts-wallpaper", 'url("' + dataUrl + '")');
  }

  function reset() {
    if (observer) observer.disconnect();
    observer = null;
    document.querySelectorAll("[" + WRAPPER_ATTRIBUTE + '="true"]').forEach(el => el.removeAttribute(WRAPPER_ATTRIBUTE));
    root().removeAttribute(ROOT_ATTRIBUTE);
    for (const name of [
      "--gpts-text", "--gpts-muted", "--gpts-surface", "--gpts-surface-strong",
      "--gpts-surface-effective", "--gpts-surface-strong-effective",
      "--gpts-border", "--gpts-accent", "--gpts-shadow", "--gpts-blur",
      "--gpts-overlay", "--gpts-transparency", "--gpts-border-strength",
      "--gpts-shadow-strength", "--gpts-wallpaper"
    ]) root().style.removeProperty(name);
  }

  function isProtectedElement(el) {
    if (!(el instanceof HTMLElement)) return true;
    if (el.matches("form,button,input,textarea,select,article,[role='textbox'],[contenteditable='true'],[role='dialog'],[role='alert'],[role='menu'],[role='menuitem'],[data-message-author-role],[data-testid*='conversation-turn'],[class*='Composer'],[class*='Message'],[class*='message'],[class*='Card'],[class*='card'],[class*='Prose'],[class*='markdown']")) return true;
    if (el.querySelector("button,input,textarea,select,[role='textbox'],[contenteditable='true'],[role='dialog'],[role='menu']") && /composer|card|message|conversation-turn/i.test(String(el.className))) return true;
    return false;
  }

  function scanWallpaperOccluders() {
    scanQueued = false;
    if (!root().hasAttribute(ROOT_ATTRIBUTE)) return;
    const main = document.querySelector("main");
    if (!main) return;
    const mainRect = main.getBoundingClientRect();
    const viewportArea = Math.max(window.innerWidth, 1) * Math.max(window.innerHeight, 1);
    const candidates = new Set();
    main.querySelectorAll("div,section,article,nav,header").forEach(el => {
      if (el === main || isProtectedElement(el)) return;
      const rect = el.getBoundingClientRect();
      if (rect.width < Math.max(480, mainRect.width * 0.68) || rect.height < Math.max(110, window.innerHeight * 0.12)) return;
      if (rect.width * rect.height > viewportArea * 1.5) return;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return;
      const color = style.backgroundColor.match(/rgba?\(([^)]+)\)/i);
      if (!color) return;
      const parts = color[1].split(",").map(v => Number.parseFloat(v.trim()));
      const alpha = parts.length >= 4 ? parts[3] : 1;
      if (!Number.isFinite(alpha) || alpha < 0.78) return;
      if (style.backgroundImage !== "none" && !/gradient/i.test(style.backgroundImage)) return;
      const classes = typeof el.className === "string" ? el.className : "";
      if (/button|input|composer|message|bubble|card|modal|dialog|popover|tooltip|markdown|prose/i.test(classes)) return;
      candidates.add(el);
    });
    document.querySelectorAll("[" + WRAPPER_ATTRIBUTE + '="true"]').forEach(el => {
      if (!candidates.has(el)) el.removeAttribute(WRAPPER_ATTRIBUTE);
    });
    candidates.forEach(el => el.setAttribute(WRAPPER_ATTRIBUTE, "true"));
  }

  function queueWrapperScan() {
    if (scanQueued) return;
    scanQueued = true;
    requestAnimationFrame(scanWallpaperOccluders);
  }

  function startWrapperObserver() {
    if (observer || !document.documentElement) return;
    observer = new MutationObserver(records => {
      if (!root().hasAttribute(ROOT_ATTRIBUTE)) return;
      if (records.some(record => record.type === "childList" || (record.type === "attributes" && record.target !== root()))) queueWrapperScan();
    });
    observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "style"] });
    window.addEventListener("resize", queueWrapperScan, { passive: true });
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
      root().style.removeProperty("--gpts-wallpaper");
      sendResponse({ ok: true });
    } else if (message?.type === "CHATGPT_THEME_STUDIO_SET_BUILTIN_WALLPAPER") {
      const svg = message.svg;
      if (typeof svg === "string" && svg.length < 90000 && svg.startsWith("<svg ")) {
        const dataUrl = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
        setDataUrl(dataUrl);
        queueWrapperScan();
        sendResponse({ ok: true });
      } else {
        sendResponse({ ok: false, error: "Invalid built-in wallpaper." });
      }
    }
    return true;
  });
})();