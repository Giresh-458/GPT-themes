export const THEME_VERSION = 1;

export const THEMES = [
  {
    id: "twilight",
    name: "Twilight Glass",
    description: "Blue-violet glass with a calm twilight atmosphere.",
    colors: {
      text: "#f7f5ff",
      muted: "#d5d4ea",
      surface: "rgba(30, 42, 86, 0.79)",
      surfaceStrong: "rgba(25, 34, 69, 0.91)",
      border: "rgba(226, 228, 255, 0.27)",
      accent: "#b6c7ff",
      shadow: "rgba(5, 9, 34, 0.34)"
    },
    blur: 18,
    transparency: 79,
    overlay: 0.26,
    wallpaper: "twilight"
  },
  {
    id: "aurora",
    name: "Aurora Glass",
    description: "Deep teal surfaces with aurora-inspired highlights.",
    colors: {
      text: "#f0fffc",
      muted: "#c9e9e5",
      surface: "rgba(15, 55, 60, 0.84)",
      surfaceStrong: "rgba(10, 40, 47, 0.93)",
      border: "rgba(162, 255, 230, 0.28)",
      accent: "#7ce8d1",
      shadow: "rgba(1, 25, 28, 0.36)"
    },
    blur: 16,
    transparency: 84,
    overlay: 0.3,
    wallpaper: "aurora"
  },
  {
    id: "rose",
    name: "Rose Quartz Glass",
    description: "Soft rose and plum with high-contrast text.",
    colors: {
      text: "#fff7fc",
      muted: "#f0d9eb",
      surface: "rgba(75, 39, 76, 0.84)",
      surfaceStrong: "rgba(52, 27, 57, 0.94)",
      border: "rgba(255, 221, 246, 0.3)",
      accent: "#ffc0e5",
      shadow: "rgba(37, 8, 37, 0.35)"
    },
    blur: 17,
    transparency: 84,
    overlay: 0.34,
    wallpaper: "rose"
  },
  {
    id: "midnight",
    name: "Midnight Glass",
    description: "Quiet charcoal-indigo surfaces and restrained light.",
    colors: {
      text: "#f5f7ff",
      muted: "#c4cbe0",
      surface: "rgba(17, 22, 39, 0.9)",
      surfaceStrong: "rgba(11, 15, 28, 0.96)",
      border: "rgba(204, 215, 255, 0.2)",
      accent: "#a7baff",
      shadow: "rgba(0, 0, 0, 0.42)"
    },
    blur: 14,
    transparency: 90,
    overlay: 0.42,
    wallpaper: "midnight"
  },
  {
    id: "arctic",
    name: "Arctic Glass",
    description: "Cool silver-blue glass with dark readable text.",
    colors: {
      text: "#162338",
      muted: "#33445c",
      surface: "rgba(237, 246, 255, 0.87)",
      surfaceStrong: "rgba(247, 251, 255, 0.96)",
      border: "rgba(255, 255, 255, 0.84)",
      accent: "#355d98",
      shadow: "rgba(31, 60, 95, 0.18)"
    },
    blur: 20,
    transparency: 87,
    overlay: 0.08,
    wallpaper: "arctic"
  }
];

export const DEFAULT_SETTINGS = {
  schemaVersion: THEME_VERSION,
  activeThemeId: "twilight",
  customizations: {
    blur: 18,
    transparency: 79,
    overlay: 0.26,
    borderStrength: 1,
    shadowStrength: 1
  },
  wallpaper: {
    kind: "built-in",
    id: "twilight"
  },
  customPresets: []
};

export function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function sanitizeSettings(input) {
  const src = input && typeof input === "object" ? input : {};
  const defaults = structuredClone(DEFAULT_SETTINGS);
  const themeId = THEMES.some(t => t.id === src.activeThemeId)
    ? src.activeThemeId
    : defaults.activeThemeId;
  const custom = src.customizations && typeof src.customizations === "object"
    ? src.customizations
    : {};

  const presets = Array.isArray(src.customPresets)
    ? src.customPresets
        .filter(p => p && typeof p === "object" && typeof p.id === "string" &&
          typeof p.name === "string" && p.name.trim() &&
          p.settings && typeof p.settings === "object")
        .map(p => ({
          id: p.id.slice(0, 80),
          name: p.name.trim().slice(0, 60),
          settings: {
            activeThemeId: THEMES.some(t => t.id === p.settings.activeThemeId)
              ? p.settings.activeThemeId : defaults.activeThemeId,
            customizations: {
              blur: clampNumber(p.settings.customizations?.blur, 0, 30, defaults.customizations.blur),
              transparency: clampNumber(p.settings.customizations?.transparency, 45, 96, defaults.customizations.transparency),
              overlay: clampNumber(p.settings.customizations?.overlay, 0, 0.7, defaults.customizations.overlay),
              borderStrength: clampNumber(p.settings.customizations?.borderStrength, 0, 2, 1),
              shadowStrength: clampNumber(p.settings.customizations?.shadowStrength, 0, 2, 1)
            },
            wallpaper: sanitizeWallpaper(p.settings.wallpaper)
          }
        }))
        .slice(0, 50)
    : [];

  return {
    schemaVersion: THEME_VERSION,
    activeThemeId: themeId,
    customizations: {
      blur: clampNumber(custom.blur, 0, 30, defaults.customizations.blur),
      transparency: clampNumber(custom.transparency, 45, 96, defaults.customizations.transparency),
      overlay: clampNumber(custom.overlay, 0, 0.7, defaults.customizations.overlay),
      borderStrength: clampNumber(custom.borderStrength, 0, 2, 1),
      shadowStrength: clampNumber(custom.shadowStrength, 0, 2, 1)
    },
    wallpaper: sanitizeWallpaper(src.wallpaper),
    customPresets: presets
  };
}

export function sanitizeWallpaper(input) {
  if (!input || typeof input !== "object") return { kind: "built-in", id: "twilight" };
  if (input.kind === "custom" && typeof input.id === "string" &&
      /^[a-zA-Z0-9_-]{1,100}$/.test(input.id)) {
    return { kind: "custom", id: input.id };
  }
  const id = THEMES.some(t => t.id === input.id) ? input.id : "twilight";
  return { kind: "built-in", id };
}

export function getTheme(settings) {
  return THEMES.find(t => t.id === settings.activeThemeId) || THEMES[0];
}