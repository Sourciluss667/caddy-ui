import { IntlProvider } from "react-intl"

import type { Locale, Messages } from "~/lib/i18n"

type AppIntlProviderProps = {
  children: React.ReactNode
  locale: Locale
  messages: Messages
}

export function AppIntlProvider({
  children,
  locale,
  messages,
}: AppIntlProviderProps) {
  return (
    <IntlProvider defaultLocale="en" locale={locale} messages={messages}>
      {children}
    </IntlProvider>
  )
}
