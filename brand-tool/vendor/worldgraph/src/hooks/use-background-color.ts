import { useEffect, useState } from "react";
import { BACKGROUND_KEY, normalizeHex, THEME_BACKGROUNDS } from "@/lib/backgroundColor";

export function useBackgroundColor(theme: "dark" | "light") {
  const [custom, setCustom] = useState<string | null>(null);
  useEffect(() => {
    const saved = localStorage.getItem(BACKGROUND_KEY);
    if (saved) setCustom(normalizeHex(saved));
  }, []);
  const background = custom ?? THEME_BACKGROUNDS[theme];
  useEffect(() => {
    document.documentElement.style.setProperty("--background", background);
    return () => { document.documentElement.style.removeProperty("--background"); };
  }, [background]);
  const chooseBackground = (value: string) => {
    const hex = normalizeHex(value);
    if (!hex) return;
    setCustom(hex);
    localStorage.setItem(BACKGROUND_KEY, hex);
  };
  const resetBackground = () => {
    setCustom(null);
    localStorage.removeItem(BACKGROUND_KEY);
  };
  return { background, chooseBackground, resetBackground };
}