const HEX_COLOR_PATTERN = /^#?([0-9a-f]{6})$/i;

export const DEFAULT_PRIMARY_COLOR = "#2D9D6A";
export const BRAND_PRIMARY_COOKIE = "vt_brand_primary";

type RgbColor = {
  r: number;
  g: number;
  b: number;
};

export type BrandingTheme = {
  primaryColor: string;
};

export function normalizeHexColor(value: string | null | undefined) {
  if (!value) return null;
  const match = value.trim().match(HEX_COLOR_PATTERN);
  if (!match) return null;
  return `#${match[1].toUpperCase()}`;
}

function hexToRgb(hexColor: string): RgbColor {
  const normalized = normalizeHexColor(hexColor);
  if (!normalized) {
    throw new Error(`Invalid hex color: ${hexColor}`);
  }

  return {
    r: Number.parseInt(normalized.slice(1, 3), 16),
    g: Number.parseInt(normalized.slice(3, 5), 16),
    b: Number.parseInt(normalized.slice(5, 7), 16),
  };
}

function rgbToHex({ r, g, b }: RgbColor) {
  return `#${[r, g, b]
    .map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function mixColors(baseColor: string, mixColor: string, ratio: number) {
  const base = hexToRgb(baseColor);
  const mix = hexToRgb(mixColor);

  return rgbToHex({
    r: base.r * (1 - ratio) + mix.r * ratio,
    g: base.g * (1 - ratio) + mix.g * ratio,
    b: base.b * (1 - ratio) + mix.b * ratio,
  });
}

function getChannelLuminance(channel: number) {
  const value = channel / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function getRelativeLuminance(color: string) {
  const { r, g, b } = hexToRgb(color);
  return (
    0.2126 * getChannelLuminance(r) +
    0.7152 * getChannelLuminance(g) +
    0.0722 * getChannelLuminance(b)
  );
}

export function getContrastRatio(firstColor: string, secondColor: string) {
  const first = getRelativeLuminance(firstColor);
  const second = getRelativeLuminance(secondColor);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getBrandingTheme(primaryColor: string): BrandingTheme {
  return {
    primaryColor: normalizeHexColor(primaryColor) ?? DEFAULT_PRIMARY_COLOR,
  };
}

export function getBrandingThemeVariables(primaryColor: string) {
  const normalizedPrimary = normalizeHexColor(primaryColor) ?? DEFAULT_PRIMARY_COLOR;
  const primarySoft = mixColors(normalizedPrimary, "#FFFFFF", 0.88);
  const primaryForeground =
    getContrastRatio(normalizedPrimary, "#FFFFFF") >= 4.5 ? "#FFFFFF" : "#1A1A1A";

  return {
    "--accent": normalizedPrimary,
    "--accent-light": primarySoft,
    "--accent-foreground": primaryForeground,
  } as const;
}

export function isAccessibleBrandColor(primaryColor: string) {
  const normalizedPrimary = normalizeHexColor(primaryColor);
  if (!normalizedPrimary) return false;
  return getContrastRatio(normalizedPrimary, "#FFFFFF") >= 4.5;
}
