import type { ReactNode } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useLayoutEffect, useState } from "react"

import { AppControls } from "~/components/app-controls"
import { Button } from "~/components/ui/button"

const HEADER_COLLAPSED_STORAGE_KEY = "caddy-ui-header-collapsed"
const HEADER_STATE_COLLAPSED = "collapsed"
const HEADER_STATE_EXPANDED = "expanded"

type HudShellProps = {
  children: ReactNode
  collapseLabel: string
  compactStats: ReactNode
  eyebrow: ReactNode
  expandLabel: string
  source: ReactNode
  sourceLabel: ReactNode
  subtitle: ReactNode
  title: ReactNode
}

export function HudShell({
  children,
  collapseLabel,
  compactStats,
  eyebrow,
  expandLabel,
  source,
  sourceLabel,
  subtitle,
  title,
}: HudShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(true)

  useLayoutEffect(() => {
    setIsCollapsed(getStoredHeaderCollapsed())
  }, [])

  function updateCollapsed(nextIsCollapsed: boolean) {
    setIsCollapsed(nextIsCollapsed)

    try {
      window.localStorage.setItem(
        HEADER_COLLAPSED_STORAGE_KEY,
        nextIsCollapsed ? HEADER_STATE_COLLAPSED : HEADER_STATE_EXPANDED
      )
    } catch {
      // Storage can be unavailable in privacy-restricted contexts.
    }
  }

  return (
    <main className="hud-grid min-h-svh overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,color-mix(in_oklch,var(--primary),transparent_72%),transparent_30%),radial-gradient(circle_at_80%_0%,color-mix(in_oklch,var(--hud-amber),transparent_80%),transparent_28%),linear-gradient(180deg,color-mix(in_oklch,var(--background),black_8%),var(--background))]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-64 bg-gradient-to-b from-primary/10 to-transparent blur-3xl" />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {isCollapsed ? (
          <header className="hud-panel sticky top-3 z-30 overflow-hidden p-3">
            <div className="relative z-10 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  aria-controls="caddy-ui-hud-header"
                  aria-expanded={false}
                  aria-label={expandLabel}
                  onClick={() => updateCollapsed(false)}
                  size="icon-sm"
                  type="button"
                  variant="outline"
                >
                  <ChevronDown />
                </Button>
                <div className="min-w-0">
                  <p className="font-mono text-[0.62rem] font-semibold tracking-[0.3em] text-primary uppercase">
                    {eyebrow}
                  </p>
                  <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
                    {title}
                  </h1>
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="flex flex-wrap gap-2 font-mono text-xs text-muted-foreground">
                  {compactStats}
                </div>
                <div className="max-w-sm truncate rounded-lg border border-primary/15 bg-primary/5 px-3 py-2 font-mono text-xs text-muted-foreground">
                  <span className="text-primary">{sourceLabel}</span> {source}
                </div>
                <AppControls compact />
              </div>
            </div>
          </header>
        ) : (
          <header className="hud-panel hud-scan relative overflow-hidden p-5 sm:p-7">
            <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-[0.68rem] font-semibold tracking-[0.32em] text-primary uppercase shadow-[0_0_24px_color-mix(in_oklch,var(--primary),transparent_80%)]">
                    <span className="size-1.5 rounded-full bg-primary shadow-[0_0_16px_var(--primary)]" />
                    {eyebrow}
                  </div>
                  <Button
                    aria-controls="caddy-ui-hud-header"
                    aria-expanded={true}
                    aria-label={collapseLabel}
                    onClick={() => updateCollapsed(true)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <ChevronUp />
                    {collapseLabel}
                  </Button>
                </div>

                <div className="space-y-3" id="caddy-ui-hud-header">
                  <h1 className="max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-foreground sm:text-6xl">
                    {title}
                  </h1>
                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                    {subtitle}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:min-w-80">
                <AppControls />
                <div className="rounded-xl border border-primary/15 bg-black/[0.03] p-4 dark:bg-white/[0.03]">
                  <p className="font-mono text-[0.62rem] font-semibold tracking-[0.3em] text-muted-foreground uppercase">
                    {sourceLabel}
                  </p>
                  <p className="mt-2 truncate font-mono text-xs text-foreground">
                    {source}
                  </p>
                </div>
              </div>
            </div>
          </header>
        )}

        {children}
      </div>
    </main>
  )
}

function getStoredHeaderCollapsed() {
  try {
    const storedHeaderState = window.localStorage.getItem(
      HEADER_COLLAPSED_STORAGE_KEY
    )

    if (storedHeaderState === HEADER_STATE_EXPANDED) {
      return false
    }

    if (storedHeaderState === HEADER_STATE_COLLAPSED) {
      return true
    }

    // Backward compatibility with the previous boolean value.
    return storedHeaderState === null ? true : storedHeaderState !== "false"
  } catch {
    return true
  }
}
