import { AlertTriangle, FileText, Globe2, Server } from "lucide-react"

import type { Route } from "./+types/home"

export function meta() {
  return [
    { title: "Caddy UI" },
    {
      name: "description",
      content: "Dashboard local pour visualiser les sites declares dans Caddy.",
    },
  ]
}

export async function loader() {
  const { loadCaddyfileSites } = await import("~/lib/caddyfile.server")

  return loadCaddyfileSites()
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { error, path, sites, warnings } = loaderData
  const hasSites = sites.length > 0

  return (
    <main className="min-h-svh bg-muted/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-5 rounded-2xl border bg-background p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <Server className="size-3.5" />
              Caddy dashboard
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">
                Sites exposes par Caddy
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Lecture cote serveur du Caddyfile configure. Pour cibler un
                fichier specifique, lance l'app avec{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                  CADDYFILE_PATH=/chemin/vers/Caddyfile.j2
                </code>
                .
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Source
            </p>
            <p className="mt-1 max-w-sm truncate font-mono text-xs">{path}</p>
          </div>
        </header>

        {error ? (
          <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0" />
              <div className="space-y-2">
                <h2 className="font-medium">Configuration illisible</h2>
                <p className="text-sm text-destructive/90">{error.message}</p>
                <p className="text-xs text-destructive/80">
                  Code: <span className="font-mono">{error.code}</span>
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {warnings.length > 0 ? (
          <section className="rounded-2xl border bg-card p-5">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
              <div className="space-y-2">
                <h2 className="font-medium">Avertissements de lecture</h2>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        ) : null}

        {!error && !hasSites ? (
          <section className="rounded-2xl border border-dashed bg-background p-10 text-center">
            <FileText className="mx-auto size-10 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-medium">Aucun site detecte</h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
              Le fichier a ete lu, mais aucun bloc de site top-level n'a ete
              trouve. Les blocs globaux et snippets Caddy sont ignores.
            </p>
          </section>
        ) : null}

        {hasSites ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Sites detectes
                </h2>
                <p className="text-sm text-muted-foreground">
                  {sites.length} bloc{sites.length > 1 ? "s" : ""} de site
                  trouve{sites.length > 1 ? "s" : ""}.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {sites.map((site) => (
                <article
                  key={site.id}
                  className="rounded-2xl border bg-background p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Globe2 className="size-4" />
                        Ligne {site.sourceLine}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {site.addresses.map((address) => (
                          <span
                            key={address}
                            className="rounded-full border bg-muted px-3 py-1 font-mono text-xs"
                          >
                            {address}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {site.warnings.length > 0 ? (
                    <div className="mt-4 rounded-xl bg-muted p-3 text-xs text-muted-foreground">
                      {site.warnings.map((warning) => (
                        <p key={warning}>{warning}</p>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}
