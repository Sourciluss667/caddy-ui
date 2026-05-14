import {
  Asterisk,
  Cable,
  ExternalLink,
  FileCode2,
  LoaderCircle,
  Lock,
  RadioTower,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Waves,
} from "lucide-react"
import { useIntl } from "react-intl"

import { ServiceIcon } from "~/components/service-icon"
import { Button } from "~/components/ui/button"
import type { CaddySite } from "~/lib/caddyfile.server"
import type { DomainStatusSnapshot } from "~/lib/domain-status"
import type { MessageId } from "~/lib/i18n"
import type { ServiceCategory, ServiceMetadata } from "~/lib/service-catalog"
import { cn } from "~/lib/utils"

type SiteCardProps = {
  href: string | null
  onCheck: () => void
  site: CaddySite
  status: DomainStatusSnapshot
}

const accentClasses: Record<ServiceMetadata["accent"], string> = {
  amber: "text-amber-300 border-amber-300/30 bg-amber-300/10",
  blue: "text-sky-300 border-sky-300/30 bg-sky-300/10",
  cyan: "text-cyan-300 border-cyan-300/30 bg-cyan-300/10",
  green: "text-emerald-300 border-emerald-300/30 bg-emerald-300/10",
  orange: "text-orange-300 border-orange-300/30 bg-orange-300/10",
  purple: "text-violet-300 border-violet-300/30 bg-violet-300/10",
  rose: "text-rose-300 border-rose-300/30 bg-rose-300/10",
}

const statusClasses: Record<DomainStatusSnapshot["status"], string> = {
  checking: "border-sky-300/35 bg-sky-300/10 text-sky-200",
  down: "border-rose-300/40 bg-rose-300/10 text-rose-200",
  unknown: "border-muted-foreground/25 bg-muted/30 text-muted-foreground",
  up: "border-emerald-300/40 bg-emerald-300/10 text-emerald-200",
}

export function SiteCard({ href, onCheck, site, status }: SiteCardProps) {
  const intl = useIntl()
  const upstream = site.upstreams[0]
  const statusLabel = intl.formatMessage({
    id: `home.status.${status.status}` as MessageId,
  })

  return (
    <article className="hud-card group relative overflow-hidden p-5">
      <div className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-70" />

      <div className="flex items-start gap-4">
        <div
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-2xl border shadow-[0_0_28px_currentColor]",
            accentClasses[site.service.accent]
          )}
        >
          <ServiceIcon className="size-6" service={site.service} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-[0.62rem] font-semibold tracking-[0.3em] text-muted-foreground uppercase">
                {intl.formatMessage({
                  id: getCategoryMessageId(site.service.category),
                })}
              </p>
              <h3 className="mt-1 truncate text-xl font-semibold tracking-tight">
                {site.service.name}
              </h3>
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <span
                aria-live="polite"
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.65rem] uppercase",
                  statusClasses[status.status]
                )}
              >
                {status.status === "checking" ? (
                  <LoaderCircle className="size-3 animate-spin" />
                ) : (
                  <span className="size-1.5 rounded-full bg-current" />
                )}
                {statusLabel}
              </span>
              <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 font-mono text-[0.65rem] text-primary">
                {intl.formatMessage(
                  { id: "home.line" },
                  { line: site.sourceLine }
                )}
              </span>
            </div>
          </div>

          <div className="mt-4 flex min-w-0 items-center gap-2">
            {href ? (
              <a
                className="min-w-0 truncate font-mono text-sm text-foreground underline decoration-primary/30 underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
                href={href}
                rel="noreferrer"
                target="_blank"
              >
                {site.primaryHost}
              </a>
            ) : (
              <span className="min-w-0 truncate font-mono text-sm text-muted-foreground">
                {site.primaryHost}
              </span>
            )}
            {href ? (
              <ExternalLink
                aria-label={intl.formatMessage({ id: "home.card.open" })}
                className="size-3.5 shrink-0 text-primary"
              />
            ) : null}
          </div>

          {site.addresses.length > 1 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {site.addresses.slice(1).map((address) => (
                <span
                  key={address}
                  className="rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 font-mono text-[0.68rem] text-muted-foreground"
                >
                  {address}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-5 space-y-3 rounded-2xl border border-border/60 bg-background/40 p-3 font-mono text-xs">
        <TelemetryLine
          icon={<Cable className="size-3.5" />}
          label={intl.formatMessage({ id: "home.card.upstream" })}
          value={upstream ? formatUpstream(upstream) : "n/a"}
          wrap
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <TelemetryLine
            icon={<RadioTower className="size-3.5" />}
            label={intl.formatMessage({ id: "home.card.scope" })}
            value={intl.formatMessage({
              id: site.isLocal ? "home.scope.local" : "home.scope.public",
            })}
          />
          <TelemetryLine
            icon={<RotateCcw className="size-3.5" />}
            label={intl.formatMessage({ id: "home.card.checkedAt" })}
            value={
              status.checkedAt
                ? new Date(status.checkedAt).toLocaleTimeString(intl.locale)
                : "n/a"
            }
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <HudBadge
          active={site.hasHsts}
          icon={<ShieldCheck className="size-3.5" />}
        >
          {intl.formatMessage({ id: "home.badge.hsts" })}
        </HudBadge>
        <HudBadge
          active={site.hasTlsSkipVerify}
          icon={<ShieldAlert className="size-3.5" />}
          tone="warning"
        >
          {intl.formatMessage({ id: "home.badge.tlsSkipVerify" })}
        </HudBadge>
        <HudBadge
          active={site.hasStreamingHints}
          icon={<Waves className="size-3.5" />}
        >
          {intl.formatMessage({ id: "home.badge.streaming" })}
        </HudBadge>
        <HudBadge
          active={site.hasRestrictedHandle}
          icon={<Lock className="size-3.5" />}
        >
          {intl.formatMessage({ id: "home.badge.restricted" })}
        </HudBadge>
        <HudBadge
          active={site.isWildcard}
          icon={<Asterisk className="size-3.5" />}
        >
          {intl.formatMessage({ id: "home.badge.wildcard" })}
        </HudBadge>
      </div>

      {site.warnings.length > 0 ? (
        <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs text-amber-200">
          {site.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      <div className="mt-4">
        <Button
          className="relative z-10"
          disabled={!href || status.status === "checking"}
          onClick={onCheck}
          size="sm"
          type="button"
          variant="outline"
        >
          <RotateCcw />
          {intl.formatMessage({ id: "home.status.checkOne" })}
        </Button>
      </div>

      <div className="pointer-events-none absolute right-3 bottom-3 text-primary/20 transition-opacity group-hover:opacity-80">
        <FileCode2 className="size-14" />
      </div>
    </article>
  )
}

function TelemetryLine({
  icon,
  label,
  value,
  wrap = false,
}: {
  icon: React.ReactNode
  label: React.ReactNode
  value: React.ReactNode
  wrap?: boolean
}) {
  return (
    <div className="flex items-start gap-2 overflow-hidden">
      <span className="text-primary">{icon}</span>
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span
        className={cn(
          "min-w-0 text-foreground",
          wrap ? "break-all" : "truncate"
        )}
      >
        {value}
      </span>
    </div>
  )
}

function HudBadge({
  active,
  children,
  icon,
  tone = "default",
}: {
  active: boolean
  children: React.ReactNode
  icon: React.ReactNode
  tone?: "default" | "warning"
}) {
  if (!active) {
    return null
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[0.68rem]",
        tone === "warning"
          ? "border-amber-300/35 bg-amber-300/10 text-amber-200"
          : "border-primary/25 bg-primary/10 text-primary"
      )}
    >
      {icon}
      {children}
    </span>
  )
}

function formatUpstream(site: CaddySite["upstreams"][number]) {
  const port = site.port ? `:${site.port}` : ""
  const protocol = site.protocol ? `${site.protocol}://` : ""

  return `${protocol}${site.host}${port}`
}

function getCategoryMessageId(category: ServiceCategory): MessageId {
  return `home.category.${category}` as MessageId
}
