import { Monitor, Moon, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { useIntl } from "react-intl"

import { Button } from "~/components/ui/button"
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
  SUPPORTED_LOCALES,
  isLocale,
  type Locale,
} from "~/lib/i18n"
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  isThemePreference,
  type ThemePreference,
} from "~/lib/theme"

const themeOptions = [
  { value: "light", icon: Sun, labelId: "controls.theme.light" },
  { value: "dark", icon: Moon, labelId: "controls.theme.dark" },
  { value: "system", icon: Monitor, labelId: "controls.theme.system" },
] as const

type AppControlsProps = {
  compact?: boolean
}

export function AppControls({ compact = false }: AppControlsProps) {
  const intl = useIntl()
  const locale = isLocale(intl.locale) ? intl.locale : DEFAULT_LOCALE
  const [theme, setTheme] = useState<ThemePreference>(DEFAULT_THEME)

  useEffect(() => {
    const storedTheme = getStoredTheme()

    setTheme(storedTheme)
    applyTheme(storedTheme)

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const syncSystemTheme = () => {
      if (getStoredTheme() === "system") {
        applyTheme("system")
      }
    }

    mediaQuery.addEventListener("change", syncSystemTheme)

    return () => mediaQuery.removeEventListener("change", syncSystemTheme)
  }, [])

  function updateTheme(nextTheme: ThemePreference) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    } catch {
      // Storage can be unavailable in privacy-restricted contexts.
    }

    setTheme(nextTheme)
    applyTheme(nextTheme)
  }

  function updateLocale(nextLocale: Locale) {
    if (nextLocale === locale) {
      return
    }

    document.cookie = `${encodeURIComponent(LOCALE_COOKIE_NAME)}=${encodeURIComponent(
      nextLocale
    )}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`
    window.location.reload()
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-2 text-sm shadow-[inset_0_1px_0_color-mix(in_oklch,var(--primary),transparent_75%)] sm:p-3">
      {!compact ? (
        <div className="mb-3 font-mono text-[0.62rem] font-semibold tracking-[0.3em] text-muted-foreground uppercase">
          {intl.formatMessage({ id: "controls.panel.label" })}
        </div>
      ) : null}
      <div
        className={
          compact
            ? "flex flex-wrap items-center gap-2"
            : "flex flex-col gap-3 sm:items-end"
        }
      >
        <label className="flex items-center gap-2">
          <span
            className={
              compact ? "sr-only" : "text-xs font-medium text-muted-foreground"
            }
          >
            {intl.formatMessage({ id: "controls.language.label" })}
          </span>
          <select
            className="h-8 rounded-lg border border-primary/20 bg-background/70 px-2 font-mono text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={locale}
            onChange={(event) => updateLocale(event.target.value as Locale)}
          >
            {SUPPORTED_LOCALES.map((supportedLocale) => (
              <option key={supportedLocale} value={supportedLocale}>
                {supportedLocale.toUpperCase()}
              </option>
            ))}
          </select>
        </label>

        <div
          aria-label={intl.formatMessage({ id: "controls.theme.label" })}
          className="flex flex-wrap gap-1.5"
          role="group"
        >
          {themeOptions.map((option) => {
            const Icon = option.icon
            const label = intl.formatMessage({ id: option.labelId })

            return (
              <Button
                key={option.value}
                aria-label={label}
                aria-pressed={theme === option.value}
                onClick={() => updateTheme(option.value)}
                size="sm"
                type="button"
                variant={theme === option.value ? "default" : "outline"}
              >
                <Icon />
                <span className={compact ? "sr-only" : "hidden sm:inline"}>
                  {label}
                </span>
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function getStoredTheme(): ThemePreference {
  let storedTheme: string | null = null

  try {
    storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
  } catch {
    return DEFAULT_THEME
  }

  return isThemePreference(storedTheme) ? storedTheme : DEFAULT_THEME
}

function applyTheme(theme: ThemePreference) {
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
  const useDark = theme === "dark" || (theme === "system" && systemDark)

  document.documentElement.classList.toggle("dark", useDark)
  document.documentElement.style.colorScheme = useDark ? "dark" : "light"
}
