import {
  AlertTriangle,
  Asterisk,
  Cable,
  FileSearch,
  Globe2,
  HomeIcon,
  Server,
} from "lucide-react"
import { useMemo, useState } from "react"
import { FormattedMessage, useIntl, type IntlShape } from "react-intl"

import { getStatusSummary, useDomainStatus } from "~/hooks/use-domain-status"
import { HudShell } from "~/components/hud-shell"
import { HudStat } from "~/components/hud-stat"
import { SiteGroups } from "~/components/site-groups"
import { SiteToolbar } from "~/components/site-toolbar"
import type { CaddyfileLoadError } from "~/lib/caddyfile.server"
import { getLocaleFromMatches, getMessages, type MessageId } from "~/lib/i18n"
import {
  DEFAULT_SITE_VIEW_FILTERS,
  getVisibleSites,
  type SiteViewFilters,
} from "~/lib/site-view"

import type { Route } from "./+types/home"

const caddyfileErrorMessageIds: Partial<Record<string, MessageId>> = {
  EACCES: "home.error.load.EACCES",
  ENOENT: "home.error.load.ENOENT",
  EPERM: "home.error.load.EPERM",
  UNKNOWN: "home.error.load.UNKNOWN",
}

export function meta({ matches }: Route.MetaArgs) {
  const locale = getLocaleFromMatches(matches)
  const messages = getMessages(locale)

  return [
    { title: messages["home.meta.title"] },
    {
      name: "description",
      content: messages["home.meta.description"],
    },
  ]
}

export async function loader() {
  const { loadCaddyfileSites } = await import("~/lib/caddyfile.server")

  return loadCaddyfileSites()
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const intl = useIntl()
  const { error, path, sites, warnings } = loaderData
  const hasSites = sites.length > 0
  const loadErrorMessage = error ? getCaddyfileErrorMessage(intl, error) : null
  const publicSites = sites.filter((site) => site.isPublic).length
  const localSites = sites.filter((site) => site.isLocal).length
  const wildcardSites = sites.filter((site) => site.isWildcard).length
  const upstreams = sites.reduce(
    (total, site) => total + site.upstreams.length,
    0
  )
  const [filters, setFilters] = useState<SiteViewFilters>(
    DEFAULT_SITE_VIEW_FILTERS
  )
  const { checkAll, checkSite, statuses } = useDomainStatus(sites)
  const visibleSites = useMemo(
    () => getVisibleSites(sites, filters, statuses),
    [filters, sites, statuses]
  )
  const statusSummary = getStatusSummary(sites, statuses)

  return (
    <HudShell
      collapseLabel={intl.formatMessage({ id: "home.header.collapse" })}
      compactStats={
        <>
          <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-primary">
            {sites.length} {intl.formatMessage({ id: "home.stats.sites" })}
          </span>
          <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-2 py-1 text-emerald-200">
            {statusSummary.up} {intl.formatMessage({ id: "home.status.up" })}
          </span>
          <span className="rounded-full border border-rose-300/25 bg-rose-300/10 px-2 py-1 text-rose-200">
            {statusSummary.down}{" "}
            {intl.formatMessage({ id: "home.status.down" })}
          </span>
        </>
      }
      eyebrow={<FormattedMessage id="home.badge" />}
      expandLabel={intl.formatMessage({ id: "home.header.expand" })}
      source={path}
      sourceLabel={<FormattedMessage id="home.source" />}
      subtitle={
        <FormattedMessage
          id="home.intro"
          values={{
            command: (
              <code className="rounded border border-primary/20 bg-primary/10 px-1.5 py-0.5 font-mono text-xs text-primary">
                CADDYFILE_PATH=/path/to/Caddyfile
              </code>
            ),
          }}
        />
      }
      title={<FormattedMessage id="home.title" />}
    >
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <HudStat
          icon={<Server className="size-4" />}
          label={<FormattedMessage id="home.stats.sites" />}
          value={sites.length}
        />
        <HudStat
          icon={<Globe2 className="size-4" />}
          label={<FormattedMessage id="home.stats.public" />}
          value={publicSites}
        />
        <HudStat
          icon={<HomeIcon className="size-4" />}
          label={<FormattedMessage id="home.stats.local" />}
          value={localSites}
        />
        <HudStat
          icon={<Cable className="size-4" />}
          label={<FormattedMessage id="home.stats.upstreams" />}
          value={upstreams}
        />
        <HudStat
          icon={<Asterisk className="size-4" />}
          label={<FormattedMessage id="home.stats.wildcards" />}
          value={wildcardSites}
        />
        <HudStat
          icon={<Globe2 className="size-4" />}
          label={<FormattedMessage id="home.status.up" />}
          value={statusSummary.up}
        />
        <HudStat
          icon={<AlertTriangle className="size-4" />}
          label={<FormattedMessage id="home.status.down" />}
          value={statusSummary.down}
        />
        <HudStat
          icon={<FileSearch className="size-4" />}
          label={<FormattedMessage id="home.status.unknown" />}
          value={statusSummary.unknown}
        />
      </section>

      <div className="space-y-5">
        {error ? (
          <section className="hud-panel border-destructive/40 bg-destructive/10 p-6 text-destructive">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0" />
              <div className="space-y-2">
                <h2 className="font-mono text-sm font-semibold tracking-[0.25em] uppercase">
                  <FormattedMessage id="home.error.title" />
                </h2>
                <p className="text-sm text-destructive/90">
                  {loadErrorMessage}
                </p>
                <p className="text-xs text-destructive/80">
                  <FormattedMessage id="home.error.code" />{" "}
                  <span className="font-mono">{error.code}</span>
                </p>
              </div>
            </div>
          </section>
        ) : null}

        {warnings.length > 0 ? (
          <section className="hud-panel border-amber-300/30 bg-amber-300/10 p-5 text-amber-100">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0" />
              <div className="space-y-2">
                <h2 className="font-mono text-sm font-semibold tracking-[0.25em] uppercase">
                  <FormattedMessage id="home.warnings.title" />
                </h2>
                <ul className="space-y-1 text-sm text-amber-100/80">
                  {warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        ) : null}
      </div>

      {!error && !hasSites ? (
        <section className="hud-panel hud-scan p-10 text-center">
          <FileSearch className="mx-auto size-12 text-primary" />
          <h2 className="mt-5 text-2xl font-semibold tracking-tight">
            <FormattedMessage id="home.empty.title" />
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
            <FormattedMessage id="home.empty.description" />
          </p>
        </section>
      ) : null}

      {hasSites ? (
        <>
          <SiteToolbar
            filters={filters}
            onFiltersChange={setFilters}
            onRefreshStatuses={() => void checkAll(true)}
            statusSummary={statusSummary}
            totalCount={sites.length}
            visibleCount={visibleSites.length}
          />
          <SiteGroups
            groupBy={filters.groupBy}
            onCheckSite={(site, force) => void checkSite(site, force)}
            sites={visibleSites}
            statuses={statuses}
          />
        </>
      ) : null}
    </HudShell>
  )
}

function getCaddyfileErrorMessage(intl: IntlShape, error: CaddyfileLoadError) {
  const messageId = caddyfileErrorMessageIds[error.code]

  if (messageId) {
    return intl.formatMessage({ id: messageId })
  }

  return error.detail ?? intl.formatMessage({ id: "home.error.load.UNKNOWN" })
}
