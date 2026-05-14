import type { CaddySite } from "~/lib/caddyfile.server"
import type { DomainStatusSnapshot } from "~/lib/domain-status"
import { SERVICE_CATEGORIES, type ServiceCategory } from "~/lib/service-catalog"

export const SITE_SCOPE_FILTERS = ["all", "local", "public"] as const
export const SITE_STATUS_FILTERS = [
  "all",
  "up",
  "down",
  "checking",
  "unknown",
] as const
export const SITE_SORT_OPTIONS = [
  "service",
  "host",
  "category",
  "status",
  "line",
  "scope",
] as const
export const SITE_GROUP_OPTIONS = [
  "category-service",
  "category",
  "service",
  "none",
] as const

export type SiteScopeFilter = (typeof SITE_SCOPE_FILTERS)[number]
export type SiteStatusFilter = (typeof SITE_STATUS_FILTERS)[number]
export type SiteSortOption = (typeof SITE_SORT_OPTIONS)[number]
export type SiteGroupOption = (typeof SITE_GROUP_OPTIONS)[number]

export type SiteStatusMap = Record<string, DomainStatusSnapshot>

export type SiteViewFilters = {
  category: ServiceCategory | "all"
  groupBy: SiteGroupOption
  query: string
  scope: SiteScopeFilter
  sort: SiteSortOption
  status: SiteStatusFilter
  wildcardOnly: boolean
}

export type ServiceSiteGroup = {
  key: string
  name: string
  sites: CaddySite[]
}

export type CategorySiteGroup = {
  category: ServiceCategory
  serviceGroups: ServiceSiteGroup[]
  sites: CaddySite[]
}

const statusSortRank = {
  down: 0,
  checking: 1,
  unknown: 2,
  up: 3,
} satisfies Record<Exclude<SiteStatusFilter, "all">, number>

export const DEFAULT_SITE_VIEW_FILTERS: SiteViewFilters = {
  category: "all",
  groupBy: "none",
  query: "",
  scope: "all",
  sort: "service",
  status: "all",
  wildcardOnly: false,
}

export function getSiteHref(site: CaddySite) {
  for (const address of site.addresses) {
    const href = getAddressHref(address)

    if (href) {
      return href
    }
  }

  return null
}

export function getSiteStatus(
  site: CaddySite,
  statuses: SiteStatusMap
): Exclude<SiteStatusFilter, "all"> {
  return statuses[site.id]?.status ?? "unknown"
}

export function getVisibleSites(
  sites: CaddySite[],
  filters: SiteViewFilters,
  statuses: SiteStatusMap
) {
  const query = filters.query.trim().toLowerCase()

  return sites
    .filter((site) => {
      if (
        filters.category !== "all" &&
        site.service.category !== filters.category
      ) {
        return false
      }

      if (filters.scope === "local" && !site.isLocal) {
        return false
      }

      if (filters.scope === "public" && !site.isPublic) {
        return false
      }

      if (
        filters.status !== "all" &&
        getSiteStatus(site, statuses) !== filters.status
      ) {
        return false
      }

      if (filters.wildcardOnly && !site.isWildcard) {
        return false
      }

      if (!query) {
        return true
      }

      return getSearchText(site).includes(query)
    })
    .sort((left, right) => compareSites(left, right, filters.sort, statuses))
}

export function getCategorySiteGroups(sites: CaddySite[]) {
  return SERVICE_CATEGORIES.map((category) => {
    const categorySites = sites.filter(
      (site) => site.service.category === category
    )

    return {
      category,
      serviceGroups: getServiceSiteGroups(categorySites),
      sites: categorySites,
    }
  }).filter((group) => group.sites.length > 0)
}

export function getServiceSiteGroups(sites: CaddySite[]): ServiceSiteGroup[] {
  const groups = new Map<string, ServiceSiteGroup>()

  for (const site of sites) {
    const key = site.service.key
    const group = groups.get(key)

    if (group) {
      group.sites.push(site)
    } else {
      groups.set(key, {
        key,
        name: site.service.name,
        sites: [site],
      })
    }
  }

  return Array.from(groups.values())
}

function compareSites(
  left: CaddySite,
  right: CaddySite,
  sort: SiteSortOption,
  statuses: SiteStatusMap
) {
  if (sort === "host") {
    return left.primaryHost.localeCompare(right.primaryHost)
  }

  if (sort === "category") {
    return (
      left.service.category.localeCompare(right.service.category) ||
      left.service.name.localeCompare(right.service.name) ||
      left.primaryHost.localeCompare(right.primaryHost)
    )
  }

  if (sort === "status") {
    const leftStatus = getSiteStatus(left, statuses)
    const rightStatus = getSiteStatus(right, statuses)

    return (
      statusSortRank[leftStatus] - statusSortRank[rightStatus] ||
      left.service.name.localeCompare(right.service.name) ||
      left.primaryHost.localeCompare(right.primaryHost)
    )
  }

  if (sort === "line") {
    return left.sourceLine - right.sourceLine
  }

  if (sort === "scope") {
    return (
      Number(right.isPublic) - Number(left.isPublic) ||
      left.service.name.localeCompare(right.service.name) ||
      left.primaryHost.localeCompare(right.primaryHost)
    )
  }

  return (
    left.service.name.localeCompare(right.service.name) ||
    left.primaryHost.localeCompare(right.primaryHost)
  )
}

function getSearchText(site: CaddySite) {
  return [
    site.primaryHost,
    site.service.name,
    site.service.category,
    ...site.addresses,
    ...site.hostnames,
    ...site.upstreams.map((upstream) => upstream.raw),
  ]
    .join(" ")
    .toLowerCase()
}

function getAddressHref(address: string) {
  const trimmedAddress = address.trim()

  if (
    !trimmedAddress ||
    trimmedAddress.startsWith(":") ||
    trimmedAddress.startsWith("*.")
  ) {
    return null
  }

  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmedAddress)
    ? trimmedAddress
    : `https://${trimmedAddress}`

  try {
    const url = new URL(withProtocol)

    if (url.hostname.startsWith("*.")) {
      return null
    }

    return url.toString()
  } catch {
    return null
  }
}
