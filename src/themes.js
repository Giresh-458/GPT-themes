export const THEME_VERSION = 1;

function svgWallpaper({ skyTop, skyBottom, glow, ridgeA, ridgeB, water, stars = false, aurora = false, rose = false }) {
  const starField = stars ? Array.from({ length: 34 }, (_, i) => {
    const x = (i * 73 + 19) % 1200;
    const y = (i * 37 + 11) % 420;
    const radius = i % 6 === 0 ? 1.8 : 1;
    const opacity = (0.2 + (i % 5) * 0.1).toFixed(2);
    return `<circle cx="${x}" cy="${y}" r="${radius}" fill="#fff" opacity="${opacity}"/>`;
  }).join("") : "";

  const northernGlow = aurora
    ? '<path d="M0 210 C150 35 300 160 445 92 S720 35 900 130 S1080 155 1200 70 L1200 300 C1000 210 870 240 690 190 S310 275 0 325Z" fill="#72f3d0" opacity=".14"/><path d="M80 180 C230 80 330 180 480 118 S760 66 960 165" fill="none" stroke="#b3ffe7" stroke-width="26" opacity=".12" filter="url(#blur)"/>'
    : "";
  const pinkGlow = rose
    ? '<path d="M0 115 C200 35 340 130 510 85 S850 40 1200 105 L1200 260 C900 205 550 235 0 275Z" fill="#ffb6df" opacity=".18"/>'
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${skyTop}"/><stop offset="1" stop-color="${skyBottom}"/></linearGradient>
      <linearGradient id="lake" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${water}"/><stop offset="1" stop-color="#071326"/></linearGradient>
      <radialGradient id="sun"><stop stop-color="${glow}" stop-opacity=".95"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></radialGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="25"/></filter>
      <linearGradient id="reflection" x1="0" y1="0" x2="0" y2="1"><stop stop-color="${glow}" stop-opacity=".44"/><stop offset="1" stop-color="${glow}" stop-opacity="0"/></linearGradient>
    </defs>
    <rect width="1200" height="800" fill="url(#sky)"/>
    <ellipse cx="850" cy="335" rx="390" ry="260" fill="url(#sun)"/>
    ${starField}${northernGlow}${pinkGlow}
    <path d="M0 475 L110 355 185 425 330 265 430 395 540 320 645 433 755 310 865 410 1015 285 1115 395 1200 325 1200 800 0 800Z" fill="${ridgeA}"/>
    <path d="M0 520 L150 410 245 490 365 355 475 474 585 390 720 500 830 385 970 480 1090 360 1200 460 1200 800 0 800Z" fill="${ridgeB}"/>
    <path d="M330 265 L294 308 330 296 360 330 386 323 430 395 398 352 370 310 352 287Z" fill="#d8dcef" opacity=".5"/>
    <path d="M755 310 L716 357 754 344 786 370 814 356 865 410 830 370 797 330 778 320Z" fill="#e6d8f3" opacity=".32"/>
    <path d="M0 505 Q190 488 360 512 T720 507 T1200 503 L1200 800 0 800Z" fill="url(#lake)"/>
    <path d="M670 510 Q840 505 1020 512 T1200 509 L1200 800 900 800Z" fill="url(#reflection)"/>
    <g opacity=".24" stroke="${glow}" stroke-width="2">
      <path d="M620 552 Q820 548 1060 558"/><path d="M700 583 Q880 579 1130 588"/>
      <path d="M780 624 Q910 621 1080 630"/><path d="M550 672 Q760 665 940 674"/>
    </g>
    <g fill="#071b24" opacity=".8">
      <path d="M0 540 L28 505 55 540 74 490 103 542 132 506 166 550 166 800 0 800Z"/>
      <path d="M1040 520 L1065 474 1090 523 1121 460 1154 525 1182 484 1200 518 1200 800 1040 800Z"/>
    </g>
    <rect width="1200" height="800" fill="#07142c" opacity=".12"/>
  </svg>`;
}

export const WALLPAPERS = {
  twilight: svgWallpaper({
    skyTop: "#29396f", skyBottom: "#d785a1", glow: "#ffd3ae",
    ridgeA: "#24345b", ridgeB: "#152947", water: "#355071"
  }),
  aurora: svgWallpaper({
    skyTop: "#071f35", skyBottom: "#256a70", glow: "#a3ffda",
    ridgeA: "#102f45", ridgeB: "#0b263a", water: "#174455",
    stars: true, aurora: true
  }),
  rose: svgWallpaper({
    skyTop: "#533b72", skyBottom: "#e4a2bd", glow: "#ffe2e9",
    ridgeA: "#5b4068", ridgeB: "#342b50", water: "#423b65",
    rose: true
  }),
  midnight: svgWallpaper({
    skyTop: "#050b1c", skyBottom: "#263153", glow: "#879bda",
    ridgeA: "#17233a", ridgeB: "#0b172b", water: "#121e35",
    stars: true
  }),
  arctic: svgWallpaper({
    skyTop: "#8cb9d7", skyBottom: "#eaf5fa", glow: "#ffffff",
    ridgeA: "#7896b2", ridgeB: "#486887", water: "#9dbed1",
    stars: false
  })
};

export const THEMES = [
  {
    id: "twilight",
    name: "Twilight Glass",
    description: "Blue-violet glass with a calm twilight atmosphere.",
    colors: {
      text: "#f7f5ff", muted: "#d5d4ea",
      surface: "rgba(30, 42, 86, 0.79)", surfaceStrong: "rgba(25, 34, 69, 0.91)",
      border: "rgba(226, 228, 255, 0.27)", accent: "#b6c7ff",
      shadow: "rgba(5, 9, 34, 0.34)"
    },
    blur: 18, transparency: 79, overlay: 0.26, wallpaper: "twilight"
  },
  {
    id: "aurora",
    name: "Aurora Glass",
    description: "Deep teal surfaces with aurora-inspired highlights.",
    colors: {
      text: "#f0fffc", muted: "#c9e9e5",
      surface: "rgba(15, 55, 60, 0.84)", surfaceStrong: "rgba(10, 40, 47, 0.93)",
      border: "rgba(162, 255, 230, 0.28)", accent: "#7ce8d1",
      shadow: "rgba(1, 25, 28, 0.36)"
    },
    blur: 16, transparency: 84, overlay: 0.3, wallpaper: "aurora"
  },
  {
    id: "rose",
    name: "Rose Quartz Glass",
    description: "Soft rose and plum with high-contrast text.",
    colors: {
      text: "#fff7fc", muted: "#f0d9eb",
      surface: "rgba(75, 39, 76, 0.84)", surfaceStrong: "rgba(52, 27, 57, 0.94)",
      border: "rgba(255, 221, 246, 0.3)", accent: "#ffc0e5",
      shadow: "rgba(37, 8, 37, 0.35)"
    },
    blur: 17, transparency: 84, overlay: 0.34, wallpaper: "rose"
  },
  {
    id: "midnight",
    name: "Midnight Glass",
    description: "Quiet charcoal-indigo surfaces and restrained light.",
    colors: {
      text: "#f5f7ff", muted: "#c4cbe0",
      surface: "rgba(17, 22, 39, 0.9)", surfaceStrong: "rgba(11, 15, 28, 0.96)",
      border: "rgba(204, 215, 255, 0.2)", accent: "#a7baff",
      shadow: "rgba(0, 0, 0, 0.42)"
    },
    blur: 14, transparency: 90, overlay: 0.42, wallpaper: "midnight"
  },
  {
    id: "arctic",
    name: "Arctic Glass",
    description: "Cool silver-blue glass with dark readable text.",
    colors: {
      text: "#162338", muted: "#33445c",
      surface: "rgba(237, 246, 255, 0.87)", surfaceStrong: "rgba(247, 251, 255, 0.96)",
      border: "rgba(255, 255, 255, 0.84)", accent: "#355d98",
      shadow: "rgba(31, 60, 95, 0.18)"
    },
    blur: 20, transparency: 87, overlay: 0.08, wallpaper: "arctic"
  }
];

export const DEFAULT_SETTINGS = {
  schemaVersion: THEME_VERSION,
  activeThemeId: "twilight",
  customizations: {
    blur: 18, transparency: 79, overlay: 0.26,
    borderStrength: 1, shadowStrength: 1
  },
  wallpaper: { kind: "built-in", id: "twilight" },
  customPresets: []
};

export function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
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

export function sanitizeSettings(input) {
  const src = input && typeof input === "object" ? input : {};
  const defaults = structuredClone(DEFAULT_SETTINGS);
  const themeId = THEMES.some(t => t.id === src.activeThemeId) ? src.activeThemeId : defaults.activeThemeId;
  const custom = src.customizations && typeof src.customizations === "object" ? src.customizations : {};
  const presets = Array.isArray(src.customPresets)
    ? src.customPresets
      .filter(p => p && typeof p === "object" && typeof p.id === "string" &&
        typeof p.name === "string" && p.name.trim() && p.settings && typeof p.settings === "object")
      .map(p => ({
        id: p.id.slice(0, 80),
        name: p.name.trim().slice(0, 60),
        settings: {
          activeThemeId: THEMES.some(t => t.id === p.settings.activeThemeId) ? p.settings.activeThemeId : defaults.activeThemeId,
          customizations: {
            blur: clampNumber(p.settings.customizations?.blur, 0, 30, defaults.customizations.blur),
            transparency: clampNumber(p.settings.customizations?.transparency, 45, 96, defaults.customizations.transparency),
            overlay: clampNumber(p.settings.customizations?.overlay, 0, 0.7, defaults.customizations.overlay),
            borderStrength: clampNumber(p.settings.customizations?.borderStrength, 0, 2, 1),
            shadowStrength: clampNumber(p.settings.customizations?.shadowStrength, 0, 2, 1)
          },
          wallpaper: sanitizeWallpaper(p.settings.wallpaper)
        }
      })).slice(0, 50)
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

export function getTheme(settings) {
  return THEMES.find(t => t.id === settings.activeThemeId) || THEMES[0];
}