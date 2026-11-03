import { useEffect, useState } from "react";

export type ThemePreference = "light" | "dark" | "system";

const storageKey = "sweep-dev-disk-theme";

function readPreference(): ThemePreference {
  const saved = window.localStorage.getItem(storageKey);
  return saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(readPreference);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      const isDark = preference === "dark" || (preference === "system" && (media?.matches ?? true));
      document.documentElement.dataset.theme = isDark ? "dark" : "light";
      document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    };

    applyTheme();
    media?.addEventListener("change", applyTheme);
    return () => media?.removeEventListener("change", applyTheme);
  }, [preference]);

  const changePreference = (next: ThemePreference) => {
    window.localStorage.setItem(storageKey, next);
    setPreference(next);
  };

  return { preference, setPreference: changePreference };
}
