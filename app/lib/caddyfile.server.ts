import { readFile } from "node:fs/promises"

import {
  resolveServiceMetadata,
  type ServiceMetadata,
} from "~/lib/service-catalog"

const DEFAULT_CADDYFILE_PATH = "/etc/caddy/Caddyfile"

export type CaddySite = {
  id: string
  addresses: string[]
  hostnames: string[]
  primaryHost: string
  isWildcard: boolean
  isLocal: boolean
  isPublic: boolean
  sourceLine: number
  upstreams: CaddyUpstream[]
  hasHsts: boolean
  hasTlsSkipVerify: boolean
  hasStreamingHints: boolean
  hasRestrictedHandle: boolean
  service: ServiceMetadata
  warnings: string[]
}

export type CaddyUpstream = {
  raw: string
  protocol: string | null
  host: string
  port: string | null
}

export type CaddyfileLoadResult = {
  path: string
  sites: CaddySite[]
  warnings: string[]
  error: CaddyfileLoadError | null
}

export type CaddyfileLoadError = {
  code: string
  detail?: string
}

type PendingHeader = {
  lines: string[]
  sourceLine: number
}

type ActiveSiteBlock = {
  header: string
  lines: string[]
  sourceLine: number
}

export function resolveCaddyfilePath() {
  return process.env.CADDYFILE_PATH?.trim() || DEFAULT_CADDYFILE_PATH
}

export async function loadCaddyfileSites(): Promise<CaddyfileLoadResult> {
  const path = resolveCaddyfilePath()

  try {
    const content = await readFile(path, "utf8")
    const parsed = parseCaddyfile(content)

    return {
      path,
      sites: parsed.sites,
      warnings: parsed.warnings,
      error: null,
    }
  } catch (error) {
    return {
      path,
      sites: [],
      warnings: [],
      error: toLoadError(error),
    }
  }
}

export function parseCaddyfile(content: string) {
  const sites: CaddySite[] = []
  const pendingHeader: PendingHeader = { lines: [], sourceLine: 1 }
  let activeSiteBlock: ActiveSiteBlock | null = null
  let depth = 0

  const lines = content.split(/\r?\n/)

  lines.forEach((line, index) => {
    const lineNumber = index + 1
    const strippedLine = stripComment(line).trim()

    if (!strippedLine) {
      return
    }

    const previousDepth = depth

    if (previousDepth === 0) {
      const openingBraceIndex = findOpeningBlockBrace(strippedLine)

      if (openingBraceIndex >= 0) {
        const inlineHeader = strippedLine.slice(0, openingBraceIndex).trim()
        const headerLines = [...pendingHeader.lines]

        if (inlineHeader) {
          headerLines.push(inlineHeader)
        }

        activeSiteBlock = {
          header: headerLines.join(" "),
          lines: [],
          sourceLine:
            pendingHeader.lines.length > 0
              ? pendingHeader.sourceLine
              : lineNumber,
        }

        const inlineBody = strippedLine.slice(openingBraceIndex + 1).trim()

        if (inlineBody && inlineBody !== "}") {
          activeSiteBlock.lines.push(inlineBody)
        }

        pendingHeader.lines = []
        pendingHeader.sourceLine = lineNumber
      } else if (mayBePendingHeader(strippedLine)) {
        if (pendingHeader.lines.length === 0) {
          pendingHeader.sourceLine = lineNumber
        }

        pendingHeader.lines.push(strippedLine)
      }
    } else if (activeSiteBlock) {
      activeSiteBlock.lines.push(strippedLine)
    }

    depth = Math.max(0, depth + getBraceDelta(strippedLine))

    if (activeSiteBlock && depth === 0) {
      addSiteBlock(sites, activeSiteBlock)
      activeSiteBlock = null
    }

    if (depth === 0 && strippedLine.endsWith("}")) {
      pendingHeader.lines = []
      pendingHeader.sourceLine = lineNumber + 1
    }
  })

  return {
    sites,
    warnings: [],
  }
}

function addSiteBlock(sites: CaddySite[], siteBlock: ActiveSiteBlock) {
  const { header, lines, sourceLine } = siteBlock

  if (!header || isGlobalOptionsBlock(header) || isSnippetBlock(header)) {
    return
  }

  const addresses = splitAddressList(header)

  if (addresses.length === 0 || isDirectiveOnlyBlock(addresses)) {
    return
  }

  const hostnames = addresses.map(normalizeAddressToHost).filter(Boolean)
  const primaryHost = hostnames[0] ?? addresses[0] ?? "unknown"
  const upstreams = getUpstreams(lines)
  const isLocal = hostnames.some(isLocalHostname)
  const isWildcard = hostnames.some((hostname) => hostname.startsWith("*."))

  sites.push({
    id: `${sourceLine}:${addresses.join(",")}`,
    addresses,
    hostnames,
    primaryHost,
    isWildcard,
    isLocal,
    isPublic: !isLocal && hostnames.length > 0,
    sourceLine,
    upstreams,
    hasHsts: lines.some((line) => line.includes("Strict-Transport-Security")),
    hasTlsSkipVerify: lines.some((line) =>
      line.includes("tls_insecure_skip_verify")
    ),
    hasStreamingHints: lines.some((line) =>
      /^(flush_interval|stream_timeout|stream_close_delay)\b/.test(line)
    ),
    hasRestrictedHandle: lines.some((line) => /^respond\s+403\b/.test(line)),
    service: resolveServiceMetadata(primaryHost),
    warnings: [],
  })
}

function getUpstreams(lines: string[]) {
  const upstreams: CaddyUpstream[] = []

  for (const line of lines) {
    const reverseProxyMatch = line.match(/^reverse_proxy\s+(.+)$/)

    if (!reverseProxyMatch) {
      continue
    }

    const targets = reverseProxyMatch[1]
      .replace(/\s+\{$/, "")
      .split(/\s+/)
      .filter((target) => target && !target.startsWith("@"))

    upstreams.push(...targets.map(parseUpstream))
  }

  return upstreams
}

function parseUpstream(raw: string): CaddyUpstream {
  const trimmed = raw.replace(/[{}]$/g, "")
  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `http://${trimmed}`

  try {
    const url = new URL(withProtocol)

    return {
      raw: trimmed,
      protocol: url.protocol.replace(":", "") || null,
      host: url.hostname || trimmed,
      port: url.port || null,
    }
  } catch {
    const [host, port] = trimmed.split(":")

    return {
      raw: trimmed,
      protocol: null,
      host: host || trimmed,
      port: port || null,
    }
  }
}

function normalizeAddressToHost(address: string) {
  const normalizedAddress = address.trim().replace(/\/+$/, "")

  if (!normalizedAddress) {
    return ""
  }

  if (normalizedAddress.startsWith(":")) {
    return normalizedAddress
  }

  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(normalizedAddress)
    ? normalizedAddress
    : `http://${normalizedAddress}`

  try {
    const url = new URL(withProtocol)
    return url.hostname || normalizedAddress
  } catch {
    return normalizedAddress.split("/")[0]?.split(":")[0] ?? normalizedAddress
  }
}

function isLocalHostname(hostname: string) {
  return (
    hostname === "localhost" ||
    hostname.endsWith(".local") ||
    hostname.includes(".local.") ||
    hostname.startsWith(":")
  )
}

function splitAddressList(header: string) {
  const addresses: string[] = []
  let current = ""
  let quote: string | null = null

  for (let index = 0; index < header.length; index += 1) {
    const char = header[index]

    if (char === '"' || char === "'") {
      quote = quote === char ? null : (quote ?? char)
      current += char
      continue
    }

    if (!quote && (char === "," || /\s/.test(char))) {
      pushAddress(addresses, current)
      current = ""
      continue
    }

    current += char
  }

  pushAddress(addresses, current)

  return addresses
}

function pushAddress(addresses: string[], address: string) {
  const trimmedAddress = address.trim().replace(/^["']|["']$/g, "")

  if (trimmedAddress) {
    addresses.push(trimmedAddress)
  }
}

function stripComment(line: string) {
  let quote: string | null = null
  let result = ""

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]

    if (char === '"' || char === "'") {
      quote = quote === char ? null : (quote ?? char)
      result += char
      continue
    }

    if (!quote && char === "#") {
      return result
    }

    result += char
  }

  return result
}

function findOpeningBlockBrace(line: string) {
  let quote: string | null = null

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]

    if (char === '"' || char === "'") {
      quote = quote === char ? null : (quote ?? char)
      continue
    }

    if (quote || char !== "{") {
      continue
    }

    if (isInlinePlaceholder(line, index)) {
      index = line.indexOf("}", index)
      continue
    }

    if (char === "{") {
      return index
    }
  }

  return -1
}

function isInlinePlaceholder(line: string, openingBraceIndex: number) {
  const closingBraceIndex = line.indexOf("}", openingBraceIndex + 1)

  return (
    closingBraceIndex > openingBraceIndex &&
    !/\s/.test(line.slice(openingBraceIndex + 1, closingBraceIndex))
  )
}

function getBraceDelta(line: string) {
  let delta = 0
  let quote: string | null = null

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]

    if (char === '"' || char === "'") {
      quote = quote === char ? null : (quote ?? char)
      continue
    }

    if (quote) {
      continue
    }

    if (char === "{") {
      delta += 1
    } else if (char === "}") {
      delta -= 1
    }
  }

  return delta
}

function mayBePendingHeader(line: string) {
  return !line.startsWith("@") && !line.startsWith("import ")
}

function isGlobalOptionsBlock(header: string) {
  return header === ""
}

function isSnippetBlock(header: string) {
  return header.startsWith("(") && header.endsWith(")")
}

function isDirectiveOnlyBlock(addresses: string[]) {
  return addresses.length === 1 && addresses[0] === "handle"
}

function toLoadError(error: unknown): CaddyfileLoadError {
  if (isNodeError(error)) {
    if (error.code === "ENOENT") {
      return {
        code: error.code,
      }
    }

    if (error.code === "EACCES" || error.code === "EPERM") {
      return {
        code: error.code,
      }
    }

    return {
      code: error.code ?? "UNKNOWN",
      detail: error.message,
    }
  }

  return {
    code: "UNKNOWN",
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error
}
