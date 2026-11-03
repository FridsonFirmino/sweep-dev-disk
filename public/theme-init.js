(() => {
  const root = globalThis.document.documentElement;
  try {
    const saved = globalThis.window.localStorage.getItem("sweep-dev-disk-theme");
    const isDark =
      saved === "dark" ||
      ((saved === "system" || saved === null) &&
        (globalThis.window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true));
    root.dataset.theme = isDark ? "dark" : "light";
    root.style.colorScheme = isDark ? "dark" : "light";
  } catch {
    root.dataset.theme = "dark";
    root.style.colorScheme = "dark";
  }
})();
