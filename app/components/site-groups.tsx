import { FormattedMessage, useIntl } from "react-intl"

import { SiteCard } from "~/components/site-card"
import type { CaddySite } from "~/lib/caddyfile.server"
import type { MessageId } from "~/lib/i18n"
import type { ServiceCategory } from "~/lib/service-catalog"
import {
  getCategorySiteGroups,
  getServiceSiteGroups,
  getSiteHref,
  type SiteGroupOption,
  type SiteStatusMap,
} from "~/lib/site-view"

type SiteGroupsProps = {
  groupBy: SiteGroupOption
  onCheckSite: (site: CaddySite, force?: boolean) => void
  sites: CaddySite[]
  statuses: SiteStatusMap
}

export function SiteGroups({
  groupBy,
  onCheckSite,
  sites,
  statuses,
}: SiteGroupsProps) {
  const intl = useIntl()
  const groups = getCategorySiteGroups(sites)

  return (
    <section className="space-y-7">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[0.7rem] font-semibold tracking-[0.35em] text-primary uppercase">
            <FormattedMessage id="home.sites.eyebrow" />
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            <FormattedMessage id="home.sites.title" />
          </h2>
        </div>
        <p className="font-mono text-sm text-muted-foreground">
          <FormattedMessage
            id="home.sites.count"
            values={{ count: sites.length }}
          />
        </p>
      </div>

      {groupBy === "none" ? (
        <CardGrid onCheckSite={onCheckSite} sites={sites} statuses={statuses} />
      ) : null}

      {groupBy === "service" ? (
        <div className="space-y-6">
          {getServiceSiteGroups(sites).map((serviceGroup) => (
            <ServiceGroup
              key={serviceGroup.key}
              onCheckSite={onCheckSite}
              serviceGroup={serviceGroup}
              statuses={statuses}
            />
          ))}
        </div>
      ) : null}

      {groupBy === "category" ? (
        <div className="space-y-8">
          {groups.map((group) => (
            <CategoryGroupHeader
              key={group.category}
              category={group.category}
              count={group.sites.length}
            >
              <CardGrid
                onCheckSite={onCheckSite}
                sites={group.sites}
                statuses={statuses}
              />
            </CategoryGroupHeader>
          ))}
        </div>
      ) : null}

      {groupBy === "category-service" ? (
        <div className="space-y-8">
          {groups.map((group) => (
            <CategoryGroupHeader
              key={group.category}
              category={group.category}
              count={group.sites.length}
            >
              <div className="space-y-4">
                {group.serviceGroups.map((serviceGroup) => (
                  <ServiceGroup
                    key={serviceGroup.key}
                    onCheckSite={onCheckSite}
                    serviceGroup={serviceGroup}
                    statuses={statuses}
                  />
                ))}
              </div>
            </CategoryGroupHeader>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function CategoryGroupHeader({
  category,
  children,
  count,
}: {
  category: ServiceCategory
  children: React.ReactNode
  count: number
}) {
  const intl = useIntl()

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-primary/40 to-transparent" />
        <h3 className="font-mono text-xs font-semibold tracking-[0.3em] text-muted-foreground uppercase">
          {intl.formatMessage({
            id: getCategoryMessageId(category),
          })}{" "}
          <span className="text-primary">/{count}</span>
        </h3>
      </div>
      {children}
    </div>
  )
}

function ServiceGroup({
  onCheckSite,
  serviceGroup,
  statuses,
}: {
  onCheckSite: (site: CaddySite, force?: boolean) => void
  serviceGroup: ReturnType<typeof getServiceSiteGroups>[number]
  statuses: SiteStatusMap
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 pl-1">
        <div className="size-1.5 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
        <h4 className="font-mono text-[0.7rem] font-semibold tracking-[0.22em] text-primary uppercase">
          {serviceGroup.name}{" "}
          <span className="text-muted-foreground">
            /{serviceGroup.sites.length}
          </span>
        </h4>
      </div>
      <CardGrid
        onCheckSite={onCheckSite}
        sites={serviceGroup.sites}
        statuses={statuses}
      />
    </div>
  )
}

function CardGrid({
  onCheckSite,
  sites,
  statuses,
}: {
  onCheckSite: (site: CaddySite, force?: boolean) => void
  sites: CaddySite[]
  statuses: SiteStatusMap
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sites.map((site) => (
        <SiteCard
          key={site.id}
          href={getSiteHref(site)}
          onCheck={() => onCheckSite(site, true)}
          site={site}
          status={statuses[site.id] ?? { status: "unknown" }}
        />
      ))}
    </div>
  )
}

function getCategoryMessageId(category: ServiceCategory): MessageId {
  return `home.category.${category}` as MessageId
}
