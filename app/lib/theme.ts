export const DEFAULT_THEME = "system"
export const THEME_STORAGE_KEY = "caddy-ui-theme"
export const THEME_VALUES = ["light", "dark", "system"] as const

export type ThemePreference = (typeof THEME_VALUES)[number]

export function isThemePreference(value: unknown): value is ThemePreference {
  return (
    typeof value === "string" && THEME_VALUES.includes(value as ThemePreference)
  )
}

export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var storedPreference = localStorage.getItem("${THEME_STORAGE_KEY}");
    var preference =
      storedPreference === "light" ||
      storedPreference === "dark" ||
      storedPreference === "system"
        ? storedPreference
        : "${DEFAULT_THEME}";
    var systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var useDark = preference === "dark" || (preference === "system" && systemDark);

    document.documentElement.classList.toggle("dark", useDark);
    document.documentElement.style.colorScheme = useDark ? "dark" : "light";
  } catch (_) {}
})();
`
