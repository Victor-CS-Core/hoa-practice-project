export interface PaletteEntry {
  name: string;
  utility: string;
  hexLight: string;
  hexDark: string;
}

export const SURFACES: PaletteEntry[] = [
  {
    name: "page",
    utility: "bg-page",
    hexLight: "#fafaf9",
    hexDark: "#111827",
  },
  {
    name: "surface",
    utility: "bg-surface",
    hexLight: "#ffffff",
    hexDark: "#0f172a",
  },
  {
    name: "hairline",
    utility: "border-hairline",
    hexLight: "#e7e5e4",
    hexDark: "#334155",
  },
];

export const TEXT: PaletteEntry[] = [
  {
    name: "ink-body",
    utility: "text-ink-body",
    hexLight: "#44403c",
    hexDark: "#e7e5e4",
  },
  {
    name: "ink-display",
    utility: "text-ink-display",
    hexLight: "#1c1917",
    hexDark: "#f8fafc",
  },
  {
    name: "ink-muted",
    utility: "text-ink-muted",
    hexLight: "#78716c",
    hexDark: "#d6d3d1",
  },
];

export const SPLASH: PaletteEntry[] = [
  {
    name: "accent",
    utility: "bg-accent / text-accent",
    hexLight: "#2f7a5b",
    hexDark: "#3ea77d",
  },
  {
    name: "accent-faded",
    utility: "bg-accent-faded",
    hexLight: "#ecfdf5",
    hexDark: "#052e2b",
  },
  {
    name: "accent-display",
    utility: "bg-accent-display / text-accent-display",
    hexLight: "#245f47",
    hexDark: "#8ee1bc",
  },
  {
    name: "signal",
    utility: "bg-signal / text-signal",
    hexLight: "#be7f3d",
    hexDark: "#d3ab69",
  },
  {
    name: "signal-faded",
    utility: "bg-signal-faded",
    hexLight: "#f8ecd9",
    hexDark: "#2e2516",
  },
  {
    name: "signal-display",
    utility: "bg-signal-display / text-signal-display",
    hexLight: "#8a5a2b",
    hexDark: "#f1d6a7",
  },
  {
    name: "danger",
    utility: "bg-danger / text-danger",
    hexLight: "oklch(64% 0.22 25)",
    hexDark: "oklch(72% 0.20 22)",
  },
  {
    name: "danger-faded",
    utility: "bg-danger-faded",
    hexLight: "oklch(96% 0.025 25)",
    hexDark: "oklch(22% 0.05 22)",
  },
  {
    name: "danger-display",
    utility: "bg-danger-display / text-danger-display",
    hexLight: "oklch(55% 0.20 25)",
    hexDark: "oklch(82% 0.18 22)",
  },
];

export const FONTS = {
  display: "Inter",
  body: "DM Sans",
};

