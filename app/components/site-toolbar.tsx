import { RotateCcw, Search, SlidersHorizontal } from "lucide-react"
import { useIntl } from "react-intl"

import { Button } from "~/components/ui/button"
import type { MessageId } from "~/lib/i18n"
import { SERVICE_CATEGORIES, type ServiceCategory } from "~/lib/service-catalog"
import {
  DEFAULT_SITE_VIEW_FILTERS,
  SITE_GROUP_OPTIONS,
  SITE_SCOPE_FILTERS,
  SITE_SORT_OPTIONS,
  SITE_STATUS_FILTERS,
  type SiteGroupOption,
  type SiteScopeFilter,
  type SiteSortOption,
  type SiteStatusFilter,
  type SiteViewFilters,
} from "~/lib/site-view"

type SiteToolbarProps = {
  filters: SiteViewFilters
  onFiltersChange: (filters: SiteViewFilters) => void
  onRefreshStatuses: () => void
  statusSummary: {
    checking: number
    down: number
    unknown: number
    up: number
  }
  totalCount: number
  visibleCount: number
}

export function SiteToolbar({
  filters,
  onFiltersChange,
  onRefreshStatuses,
  statusSummary,
  totalCount,
  visibleCount,
}: SiteToolbarProps) {
  const intl = useIntl()

  function updateFilters(nextFilters: Partial<SiteViewFilters>) {
    onFiltersChange({
      ...filters,
      ...nextFilters,
    })
  }

  return (
    <section className="hud-toolbar grid gap-4 p-4 lg:grid-cols-[1.4fr_repeat(5,minmax(0,1fr))_auto] lg:items-end">
      <label className="space-y-2">
        <span className="hud-label">
          {intl.formatMessage({ id: "home.filters.search" })}
        </span>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className="hud-input pl-9"
            onChange={(event) => updateFilters({ query: event.target.value })}
            placeholder={intl.formatMessage({
              id: "home.filters.search.placeholder",
            })}
            type="search"
            value={filters.query}
          />
        </div>
      </label>

      <SelectField
        label={intl.formatMessage({ id: "home.filters.category" })}
        onChange={(value) =>
          updateFilters({ category: value as ServiceCategory | "all" })
        }
        value={filters.category}
      >
        <option value="all">
          {intl.formatMessage({ id: "home.filters.all" })}
        </option>
        {SERVICE_CATEGORIES.map((category) => (
          <option key={category} value={category}>
            {intl.formatMessage({ id: getCategoryMessageId(category) })}
          </option>
        ))}
      </SelectField>

      <SelectField
        label={intl.formatMessage({ id: "home.filters.scope" })}
        onChange={(value) => updateFilters({ scope: value as SiteScopeFilter })}
        value={filters.scope}
      >
        {SITE_SCOPE_FILTERS.map((scope) => (
          <option key={scope} value={scope}>
            {intl.formatMessage({
              id: `home.filters.scope.${scope}` as MessageId,
            })}
          </option>
        ))}
      </SelectField>

      <SelectField
        label={intl.formatMessage({ id: "home.filters.status" })}
        onChange={(value) =>
          updateFilters({ status: value as SiteStatusFilter })
        }
        value={filters.status}
      >
        {SITE_STATUS_FILTERS.map((status) => (
          <option key={status} value={status}>
            {intl.formatMessage({
              id: `home.filters.status.${status}` as MessageId,
            })}
          </option>
        ))}
      </SelectField>

      <SelectField
        label={intl.formatMessage({ id: "home.filters.sort" })}
        onChange={(value) => updateFilters({ sort: value as SiteSortOption })}
        value={filters.sort}
      >
        {SITE_SORT_OPTIONS.map((sort) => (
          <option key={sort} value={sort}>
            {intl.formatMessage({
              id: `home.filters.sort.${sort}` as MessageId,
            })}
          </option>
        ))}
      </SelectField>

      <SelectField
        label={intl.formatMessage({ id: "home.filters.group" })}
        onChange={(value) =>
          updateFilters({ groupBy: value as SiteGroupOption })
        }
        value={filters.groupBy}
      >
        {SITE_GROUP_OPTIONS.map((group) => (
          <option key={group} value={group}>
            {intl.formatMessage({
              id: `home.filters.group.${group}` as MessageId,
            })}
          </option>
        ))}
      </SelectField>

      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        <label className="inline-flex h-8 items-center gap-2 rounded-lg border border-primary/20 bg-background/60 px-2.5 font-mono text-xs text-muted-foreground">
          <input
            checked={filters.wildcardOnly}
            className="accent-current"
            onChange={(event) =>
              updateFilters({ wildcardOnly: event.target.checked })
            }
            type="checkbox"
          />
          {intl.formatMessage({ id: "home.filters.wildcards" })}
        </label>
        <Button
          onClick={() => onFiltersChange(DEFAULT_SITE_VIEW_FILTERS)}
          size="sm"
          type="button"
          variant="outline"
        >
          <SlidersHorizontal />
          {intl.formatMessage({ id: "home.filters.reset" })}
        </Button>
        <Button
          onClick={onRefreshStatuses}
          size="sm"
          type="button"
          variant="outline"
        >
          <RotateCcw />
          {intl.formatMessage({ id: "home.status.refresh" })}
        </Button>
      </div>

      <div className="border-t border-primary/10 pt-3 font-mono text-xs text-muted-foreground lg:col-span-full">
        {intl.formatMessage(
          { id: "home.filters.summary" },
          {
            down: statusSummary.down,
            total: totalCount,
            unknown: statusSummary.unknown,
            up: statusSummary.up,
            visible: visibleCount,
          }
        )}
      </div>
    </section>
  )
}

function SelectField({
  children,
  label,
  onChange,
  value,
}: {
  children: React.ReactNode
  label: React.ReactNode
  onChange: (value: string) => void
  value: string
}) {
  return (
    <label className="space-y-2">
      <span className="hud-label">{label}</span>
      <select
        className="hud-input"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </label>
  )
}

function getCategoryMessageId(category: ServiceCategory): MessageId {
  return `home.category.${category}` as MessageId
}
