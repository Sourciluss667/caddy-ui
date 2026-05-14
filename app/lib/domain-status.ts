export const DOMAIN_STATUS_CACHE_KEY = "caddy-ui-domain-status"
export const DOMAIN_STATUS_CACHE_TTL_MS = 1000 * 60 * 5
export const DOMAIN_STATUS_TIMEOUT_MS = 8000
export const DOMAIN_STATUS_CONCURRENCY = 6

export type DomainStatus = "unknown" | "checking" | "up" | "down"

export type DomainStatusSnapshot = {
  checkedAt?: number
  error?: string
  status: DomainStatus
}

type CachedDomainStatus = {
  checkedAt: number
  status: Exclude<DomainStatus, "checking">
}

type DomainStatusCache = Record<string, CachedDomainStatus>

export async function checkDomainStatus(
  href: string,
  timeoutMs = DOMAIN_STATUS_TIMEOUT_MS
): Promise<DomainStatusSnapshot> {
  const checkedAt = Date.now()
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)

  try {
    await fetch(href, {
      cache: "no-store",
      mode: "no-cors",
      signal: controller.signal,
    })

    return {
      checkedAt,
      status: "up",
    }
  } catch (error) {
    return {
      checkedAt,
      error: error instanceof Error ? error.message : "Network error",
      status: "down",
    }
  } finally {
    window.clearTimeout(timeout)
  }
}

export function getCachedDomainStatus(
  href: string,
  ttlMs = DOMAIN_STATUS_CACHE_TTL_MS
): DomainStatusSnapshot | null {
  const cache = readDomainStatusCache()
  const cachedStatus = cache[href]

  if (!cachedStatus || Date.now() - cachedStatus.checkedAt > ttlMs) {
    return null
  }

  return cachedStatus
}

export function writeCachedDomainStatus(
  href: string,
  status: DomainStatusSnapshot
) {
  if (status.status === "checking") {
    return
  }

  const cache = readDomainStatusCache()

  cache[href] = {
    checkedAt: status.checkedAt ?? Date.now(),
    status: status.status,
  }

  writeDomainStatusCache(cache)
}

function readDomainStatusCache(): DomainStatusCache {
  try {
    const storedCache = window.localStorage.getItem(DOMAIN_STATUS_CACHE_KEY)

    if (!storedCache) {
      return {}
    }

    const parsedCache = JSON.parse(storedCache)

    if (typeof parsedCache !== "object" || parsedCache === null) {
      return {}
    }

    return Object.fromEntries(
      Object.entries(parsedCache).filter(
        (entry): entry is [string, CachedDomainStatus] => {
          const [, value] = entry

          return (
            typeof value === "object" &&
            value !== null &&
            typeof (value as CachedDomainStatus).checkedAt === "number" &&
            isCacheableStatus((value as CachedDomainStatus).status)
          )
        }
      )
    )
  } catch {
    return {}
  }
}

function isCacheableStatus(
  status: unknown
): status is CachedDomainStatus["status"] {
  return status === "up" || status === "down" || status === "unknown"
}

function writeDomainStatusCache(cache: DomainStatusCache) {
  try {
    window.localStorage.setItem(DOMAIN_STATUS_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore storage quota and privacy-mode failures.
  }
}
