export const BACKGROUND_KEY = "aurelius-background";
export const THEME_BACKGROUNDS = { dark: "#262626", light: "#faf7f3" };

export function normalizeHex(value: string): string | null {
  const hex = value.trim().replace(/^#/, "");
  if (/^[\da-f]{3}$/i.test(hex)) return `#${hex.split("").map((c) => c + c).join("").toLowerCase()}`;
  return /^[\da-f]{6}$/i.test(hex) ? `#${hex.toLowerCase()}` : null;
}