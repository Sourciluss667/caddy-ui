import enMessages from "~/lib/messages/en"
import frMessages from "~/lib/messages/fr"

export const DEFAULT_LOCALE = "en"
export const LOCALE_COOKIE_NAME = "caddy-ui-locale"
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365
export const SUPPORTED_LOCALES = ["en", "fr"] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]
export type MessageId = keyof typeof enMessages
export type Messages = Record<MessageId, string>

const messagesByLocale = {
  en: enMessages,
  fr: frMessages,
} satisfies Record<Locale, Messages>

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && SUPPORTED_LOCALES.includes(value as Locale)
  )
}

export function getMessages(locale: Locale): Messages {
  return messagesByLocale[locale] ?? messagesByLocale[DEFAULT_LOCALE]
}

export function getLocaleFromRequest(request: Request): Locale {
  const cookies = parseCookieHeader(request.headers.get("Cookie"))
  const locale = cookies[LOCALE_COOKIE_NAME]

  return isLocale(locale) ? locale : DEFAULT_LOCALE
}

export function getLocaleFromMatches(
  matches: readonly ({ id?: string; data?: unknown } | undefined)[]
): Locale {
  const rootMatch = matches.find((match) => match?.id === "root")

  if (isRecord(rootMatch?.data) && isLocale(rootMatch.data.locale)) {
    return rootMatch.data.locale
  }

  return DEFAULT_LOCALE
}

function parseCookieHeader(cookieHeader: string | null) {
  const cookies: Record<string, string> = {}

  if (!cookieHeader) {
    return cookies
  }

  for (const cookie of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = cookie.trim().split("=")
    const name = safeDecodeURIComponent(rawName)
    const value = safeDecodeURIComponent(rawValue.join("="))

    if (!name || value === null) {
      continue
    }

    cookies[name] = value
  }

  return cookies
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}
