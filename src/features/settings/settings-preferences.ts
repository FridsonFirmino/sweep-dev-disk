const storageKey = "sweep-dev-disk-scan-settings";

export interface SettingsPreferences {
  projectDirectories: string[];
  excludedDirectories: string[];
  followSymbolicLinks: boolean;
  scanHiddenDirectories: boolean;
}

export const defaultSettingsPreferences: SettingsPreferences = {
  projectDirectories: [],
  excludedDirectories: [],
  followSymbolicLinks: false,
  scanHiddenDirectories: false,
};

export function readSettingsPreferences(): SettingsPreferences {
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) return defaultSettingsPreferences;
    const parsed: unknown = JSON.parse(saved);
    if (!parsed || typeof parsed !== "object") return defaultSettingsPreferences;

    const value = parsed as Partial<SettingsPreferences>;
    return {
      projectDirectories: Array.isArray(value.projectDirectories)
        ? value.projectDirectories.filter((item): item is string => typeof item === "string")
        : [],
      excludedDirectories: Array.isArray(value.excludedDirectories)
        ? value.excludedDirectories.filter((item): item is string => typeof item === "string")
        : [],
      followSymbolicLinks: value.followSymbolicLinks === true,
      scanHiddenDirectories: value.scanHiddenDirectories === true,
    };
  } catch {
    return defaultSettingsPreferences;
  }
}

export function saveSettingsPreferences(preferences: SettingsPreferences) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(preferences));
  } catch {
    // Preferences remain available for the current session if storage is unavailable.
  }
}
