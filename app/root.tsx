import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useLoaderData,
  useRouteLoaderData,
} from "react-router"

import { AppIntlProvider } from "~/components/intl-provider"
import { ThemeScript } from "~/components/theme-script"
import { DEFAULT_LOCALE, getLocaleFromRequest, getMessages } from "~/lib/i18n"

import type { Route } from "./+types/root"
import "./app.css"

export function links() {
  return [
    { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    { rel: "shortcut icon", href: "/favicon.svg", type: "image/svg+xml" },
  ]
}

export function loader({ request }: Route.LoaderArgs) {
  const locale = getLocaleFromRequest(request)

  return {
    locale,
    messages: getMessages(locale),
  }
}

export function Layout({ children }: { children: React.ReactNode }) {
  const rootData = useRouteLoaderData<typeof loader>("root")
  const locale = rootData?.locale ?? DEFAULT_LOCALE

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <ThemeScript />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  const { locale, messages } = useLoaderData<typeof loader>()

  return (
    <AppIntlProvider locale={locale} messages={messages}>
      <Outlet />
    </AppIntlProvider>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const rootData = useRouteLoaderData<typeof loader>("root")
  const messages = rootData?.messages ?? getMessages(DEFAULT_LOCALE)
  let message = messages["app.error.oops"]
  let details = messages["app.error.unexpected"]
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : messages["app.error.title"]
    details =
      error.status === 404
        ? messages["app.error.notFound"]
        : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
