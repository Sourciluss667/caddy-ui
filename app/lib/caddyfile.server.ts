import { readFile } from "node:fs/promises"

const DEFAULT_CADDYFILE_PATH = "/etc/caddy/Caddyfile"

export type CaddySite = {
  id: string
  addresses: string[]
  sourceLine: number
  warnings: string[]
}

export type CaddyfileLoadResult = {
  path: string
  sites: CaddySite[]
  warnings: string[]
  error: CaddyfileLoadError | null
}

export type CaddyfileLoadError = {
  code: string
  message: string
}

type PendingHeader = {
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
  const warnings = new Set<string>()
  const pendingHeader: PendingHeader = { lines: [], sourceLine: 1 }
  let depth = 0

  const lines = content.split(/\r?\n/)

  lines.forEach((line, index) => {
    const lineNumber = index + 1
    const strippedLine = stripComment(line).trim()

    if (containsJinja(strippedLine)) {
      warnings.add(
        "The file contains Jinja expressions; they are displayed without being evaluated.",
      )
    }

    if (!strippedLine) {
      return
    }

    if (depth === 0) {
      const openingBraceIndex = findOpeningBlockBrace(strippedLine)

      if (openingBraceIndex >= 0) {
        const inlineHeader = strippedLine.slice(0, openingBraceIndex).trim()
        const headerLines = [...pendingHeader.lines]

        if (inlineHeader) {
          headerLines.push(inlineHeader)
        }

        addSiteBlock(
          sites,
          warnings,
          headerLines.join(" "),
          pendingHeader.lines.length > 0
            ? pendingHeader.sourceLine
            : lineNumber,
        )

        pendingHeader.lines = []
        pendingHeader.sourceLine = lineNumber
      } else if (mayBePendingHeader(strippedLine)) {
        if (pendingHeader.lines.length === 0) {
          pendingHeader.sourceLine = lineNumber
        }

        pendingHeader.lines.push(strippedLine)
      }
    }

    depth = Math.max(0, depth + getBraceDelta(strippedLine))

    if (depth === 0 && strippedLine.endsWith("}")) {
      pendingHeader.lines = []
      pendingHeader.sourceLine = lineNumber + 1
    }
  })

  return {
    sites,
    warnings: [...warnings],
  }
}

function addSiteBlock(
  sites: CaddySite[],
  warnings: Set<string>,
  header: string,
  sourceLine: number,
) {
  if (!header || isGlobalOptionsBlock(header) || isSnippetBlock(header)) {
    return
  }

  const addresses = splitAddressList(header)

  if (addresses.length === 0 || isDirectiveOnlyBlock(addresses)) {
    return
  }

  const siteWarnings: string[] = []

  if (addresses.some(containsJinja)) {
    siteWarnings.push("Address comes from an unrendered Jinja template.")
  }

  siteWarnings.forEach((warning) => {
    warnings.add(`Line ${sourceLine}: ${warning}`)
  })

  sites.push({
    id: `${sourceLine}:${addresses.join(",")}`,
    addresses,
    sourceLine,
    warnings: siteWarnings,
  })
}

function splitAddressList(header: string) {
  const addresses: string[] = []
  let current = ""
  let quote: string | null = null
  let inJinjaExpression = false

  for (let index = 0; index < header.length; index += 1) {
    const char = header[index]
    const next = header[index + 1]

    if (!quote && char === "{" && next === "{") {
      inJinjaExpression = true
      current += char
      continue
    }

    if (inJinjaExpression && char === "}" && next === "}") {
      inJinjaExpression = false
      current += char
      continue
    }

    if (!inJinjaExpression && (char === "\"" || char === "'")) {
      quote = quote === char ? null : quote ?? char
      current += char
      continue
    }

    if (!quote && !inJinjaExpression && (char === "," || /\s/.test(char))) {
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
    const next = line[index + 1]

    if (char === "\"" || char === "'") {
      quote = quote === char ? null : quote ?? char
      result += char
      continue
    }

    if (!quote && char === "{" && next === "#") {
      const commentEndIndex = line.indexOf("#}", index + 2)

      if (commentEndIndex === -1) {
        return result
      }

      index = commentEndIndex + 1
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
  let inJinjaExpression = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const next = line[index + 1]

    if (!quote && char === "{" && (next === "{" || next === "%" || next === "#")) {
      inJinjaExpression = true
      index += 1
      continue
    }

    if (
      inJinjaExpression &&
      (char === "}" || char === "%" || char === "#") &&
      next === "}"
    ) {
      inJinjaExpression = false
      index += 1
      continue
    }

    if (!inJinjaExpression && (char === "\"" || char === "'")) {
      quote = quote === char ? null : quote ?? char
      continue
    }

    if (!quote && !inJinjaExpression && char === "{") {
      return index
    }
  }

  return -1
}

function getBraceDelta(line: string) {
  let delta = 0
  let quote: string | null = null

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]

    if (char === "\"" || char === "'") {
      quote = quote === char ? null : quote ?? char
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
  return (
    !line.startsWith("@") &&
    !line.startsWith("import ") &&
    !isJinjaControlLine(line)
  )
}

function isJinjaControlLine(line: string) {
  return line.startsWith("{%")
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

function containsJinja(value: string) {
  return /({[{%#]|[%#}]})/.test(value)
}

function toLoadError(error: unknown): CaddyfileLoadError {
  if (isNodeError(error)) {
    if (error.code === "ENOENT") {
      return {
        code: error.code,
        message: "Caddy file not found.",
      }
    }

    if (error.code === "EACCES" || error.code === "EPERM") {
      return {
        code: error.code,
        message: "Insufficient permissions to read the Caddy file.",
      }
    }

    return {
      code: error.code ?? "UNKNOWN",
      message: error.message,
    }
  }

  return {
    code: "UNKNOWN",
    message: "Unable to read the Caddy configuration.",
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error
}
