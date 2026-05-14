import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { CaddySite } from "~/lib/caddyfile.server"
import {
  checkDomainStatus,
  DOMAIN_STATUS_CONCURRENCY,
  getCachedDomainStatus,
  type DomainStatusSnapshot,
  writeCachedDomainStatus,
} from "~/lib/domain-status"
import { getSiteHref, type SiteStatusMap } from "~/lib/site-view"

type DomainStatusTarget = {
  href: string
  site: CaddySite
}

export function useDomainStatus(sites: CaddySite[]) {
  const [statuses, setStatuses] = useState<SiteStatusMap>({})
  const runIdRef = useRef(0)
  const targets = useMemo(
    () =>
      sites
        .map((site) => ({ href: getSiteHref(site), site }))
        .filter((target): target is DomainStatusTarget => Boolean(target.href)),
    [sites]
  )

  const checkSiteForRun = useCallback(
    async (site: CaddySite, force: boolean, runId: number) => {
      const href = getSiteHref(site)

      if (!href) {
        setStatuses((currentStatuses) => ({
          ...currentStatuses,
          [site.id]: { status: "unknown" },
        }))
        return
      }

      if (!force) {
        const cachedStatus = getCachedDomainStatus(href)

        if (cachedStatus) {
          setStatuses((currentStatuses) => ({
            ...currentStatuses,
            [site.id]: cachedStatus,
          }))
          return
        }
      }

      setStatuses((currentStatuses) => ({
        ...currentStatuses,
        [site.id]: {
          checkedAt: currentStatuses[site.id]?.checkedAt,
          status: "checking",
        },
      }))

      const status = await checkDomainStatus(href)

      if (runIdRef.current !== runId) {
        return
      }

      writeCachedDomainStatus(href, status)
      setStatuses((currentStatuses) => ({
        ...currentStatuses,
        [site.id]: status,
      }))
    },
    []
  )

  const checkSite = useCallback(
    async (site: CaddySite, force = false) => {
      const runId = runIdRef.current + 1
      runIdRef.current = runId

      await checkSiteForRun(site, force, runId)
    },
    [checkSiteForRun]
  )

  const checkAll = useCallback(
    async (force = false) => {
      const runId = runIdRef.current + 1
      runIdRef.current = runId

      await runWithConcurrency(
        targets,
        DOMAIN_STATUS_CONCURRENCY,
        async (target) => {
          if (runIdRef.current !== runId) {
            return
          }

          await checkSiteForRun(target.site, force, runId)
        }
      )
    },
    [checkSiteForRun, targets]
  )

  useEffect(() => {
    void checkAll(false)
  }, [checkAll])

  return {
    checkAll,
    checkSite,
    statuses,
  }
}

export function getStatusSummary(sites: CaddySite[], statuses: SiteStatusMap) {
  return sites.reduce(
    (summary, site) => {
      const status = statuses[site.id]?.status ?? "unknown"
      summary[status] += 1
      return summary
    },
    {
      checking: 0,
      down: 0,
      unknown: 0,
      up: 0,
    } satisfies Record<DomainStatusSnapshot["status"], number>
  )
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
) {
  const queue = [...items]
  const workers = Array.from(
    { length: Math.min(concurrency, queue.length) },
    async () => {
      while (queue.length > 0) {
        const item = queue.shift()

        if (item) {
          await worker(item)
        }
      }
    }
  )

  await Promise.all(workers)
}
