(() => {
  "use strict";
  const ROOT_ATTRIBUTE = "data-chatgpt-theme-studio";
  const WRAPPER_ATTRIBUTE = "data-gpts-wallpaper-wrapper";
  const SIDEBAR_ATTRIBUTE = "data-gpts-sidebar-root";
  let observer = null;
  let scanQueued = false;
  let scanTimer = null;
  let resizeListenerAdded = false;

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
    const rgb = color.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/i);
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
    // The UI is a transparency percentage: higher values must reduce surface opacity.
    const surfaceOpacity = 1 - clamp(custom.transparency, 45, 96, 79) / 100;
    root().style.setProperty("--gpts-surface", surface);
    root().style.setProperty("--gpts-surface-strong", surfaceStrong);
    root().style.setProperty("--gpts-surface-effective", withOpacity(surface, surfaceOpacity));
    root().style.setProperty("--gpts-surface-strong-effective", withOpacity(surfaceStrong, surfaceOpacity));
    root().style.setProperty("--gpts-border", cssColor(colors.border, "rgba(226, 228, 255, 0.27)"));
    root().style.setProperty("--gpts-accent", cssColor(colors.accent, "#b6c7ff"));
    root().style.setProperty("--gpts-shadow", cssColor(colors.shadow, "rgba(5, 9, 34, 0.34)"));
    root().style.setProperty("--gpts-blur", clamp(custom.blur, 0, 30, 18) + "px");
    root().style.setProperty("--gpts-overlay", String(clamp(custom.overlay, 0, 0.7, 0.26)));
    root().style.setProperty("--gpts-transparency", String(Math.round((1 - surfaceOpacity) * 100)));
    root().style.setProperty("--gpts-border-strength", String(clamp(custom.borderStrength, 0, 2, 1)));
    root().style.setProperty("--gpts-shadow-strength", String(clamp(custom.shadowStrength, 0, 2, 1)));
    startWrapperObserver();
    queueWrapperScan();
  }

  function setDataUrl(dataUrl) {
    root().style.setProperty("--gpts-wallpaper", 'url("' + dataUrl + '")');
  }
  function setRemoteWallpaper(url) {
    let parsed;
    try { parsed = new URL(url); } catch { return false; }
    // Allow only the specific static Unsplash image used by the built-in Twilight theme.
    if (parsed.origin !== "https://images.unsplash.com" || parsed.pathname !== "/photo-1776348568867-24146d18b736") return false;
    root().style.setProperty("--gpts-wallpaper", 'url("' + parsed.href.replace(/["\\\\]/g, "") + '")');
    return true;
  }

  function reset() {
    if (observer) observer.disconnect();
    observer = null;
    if (scanTimer !== null) clearTimeout(scanTimer);
    scanTimer = null;
    scanQueued = false;
    document.querySelectorAll("[" + WRAPPER_ATTRIBUTE + '="true"]').forEach(el => el.removeAttribute(WRAPPER_ATTRIBUTE));
    document.querySelectorAll("[" + SIDEBAR_ATTRIBUTE + '="true"]').forEach(el => el.removeAttribute(SIDEBAR_ATTRIBUTE));
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
    if (!main || !document.body) return;
    const viewportArea = Math.max(window.innerWidth, 1) * Math.max(window.innerHeight, 1);
    const candidates = new Set();
    // Inspect page-wide layout wrappers so the wallpaper also shows behind headers
    // and responsive landing layouts, not just inside main.
    document.body.querySelectorAll("div,section,article,nav,header").forEach(el => {
      if (el === main || isProtectedElement(el)) return;
      const rect = el.getBoundingClientRect();
      if (rect.width < Math.max(480, window.innerWidth * 0.58) || rect.height < Math.max(110, window.innerHeight * 0.12)) return;
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

    // Find the outermost narrow, full-height ancestor containing navigation.
    // This works when ChatGPT changes the sidebar tag/class between routes.
    const nav = document.querySelector('nav[role="navigation"]');
    let sidebar = null;
    let current = nav;
    const sidebarMaxWidth = Math.max(420, window.innerWidth * 0.35);
    while (current && current !== document.body) {
      const rect = current.getBoundingClientRect();
      if (rect.width > 0 && rect.width <= sidebarMaxWidth && rect.height >= window.innerHeight * 0.55) {
        sidebar = current;
      } else if (rect.width > sidebarMaxWidth && sidebar) {
        break;
      }
      current = current.parentElement;
    }
    document.querySelectorAll("[" + SIDEBAR_ATTRIBUTE + '="true"]').forEach(el => {
      if (el !== sidebar) el.removeAttribute(SIDEBAR_ATTRIBUTE);
    });
    if (sidebar) sidebar.setAttribute(SIDEBAR_ATTRIBUTE, "true");
  }

  function queueWrapperScan() {
    if (scanQueued || scanTimer !== null) return;
    // Coalesce React's frequent mutations so large-page style inspection cannot
    // run once per animation frame while a conversation is streaming.
    scanTimer = setTimeout(() => {
      scanTimer = null;
      scanQueued = true;
      requestAnimationFrame(() => {
        scanQueued = false;
        scanWallpaperOccluders();
      });
    }, 120);
  }

  function mutationCanAffectLayout(record) {
    const target = record.target instanceof Element ? record.target : record.target.parentElement;
    if (!target) return false;
    if (target.closest("[data-message-author-role], [data-testid*='conversation-turn'], [role='textbox'], [contenteditable='true'], form, [class*='Composer'], [class*='Prose'], [class*='markdown']")) return false;
    return record.type === "childList" || (record.type === "attributes" && target !== root());
  }

  function startWrapperObserver() {
    if (observer || !document.documentElement) return;
    observer = new MutationObserver(records => {
      if (!root().hasAttribute(ROOT_ATTRIBUTE)) return;
      if (records.some(mutationCanAffectLayout)) queueWrapperScan();
    });
    observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ["class", "style"] });
    if (!resizeListenerAdded) {
      window.addEventListener("resize", queueWrapperScan, { passive: true });
      resizeListenerAdded = true;
    }
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
    } else if (message?.type === "CHATGPT_THEME_STUDIO_SET_REMOTE_WALLPAPER") {
      const ok = typeof message.url === "string" && setRemoteWallpaper(message.url);
      sendResponse({ ok, ...(ok ? {} : { error: "Remote wallpaper URL is not allowed." }) });
      if (ok) queueWrapperScan();
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
  // The ready handshake lets the service worker apply saved settings only after
  // this listener exists, avoiding a race with document_idle injection.
  try {
    chrome.runtime.sendMessage({ type: "CHATGPT_THEME_STUDIO_CONTENT_READY" }, () => {
      void chrome.runtime.lastError;
    });
  } catch {
    // The popup can still apply settings if the service worker is unavailable.
  }
})();