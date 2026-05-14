export const SERVICE_CATEGORIES = [
  "gateway",
  "infrastructure",
  "observability",
  "media",
  "automation",
  "storage",
  "downloads",
  "gaming",
  "custom",
] as const

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number]

export type ServiceIconName =
  | "activity"
  | "bot"
  | "box"
  | "cloud"
  | "database"
  | "download"
  | "film"
  | "gamepad"
  | "gauge"
  | "globe"
  | "home"
  | "layers"
  | "network"
  | "radar"
  | "server"
  | "shield"
  | "workflow"

export type ServiceLogoName =
  | "docker"
  | "homeassistant"
  | "homarr"
  | "jellyfin"
  | "n8n"
  | "netdata"
  | "nginxproxymanager"
  | "openmediavault"
  | "plex"
  | "portainer"
  | "proxmox"
  | "pterodactyl"
  | "qbittorrent"
  | "radarr"
  | "sonarr"
  | "syncthing"
  | "uptimekuma"

export type ServiceMetadata = {
  key: string
  name: string
  category: ServiceCategory
  icon: ServiceIconName
  logo?: ServiceLogoName
  accent: "cyan" | "amber" | "blue" | "green" | "orange" | "purple" | "rose"
}

type ServiceRule = {
  match: RegExp
  metadata: ServiceMetadata
}

const serviceRules: ServiceRule[] = [
  service(
    "nginx",
    /(^|\.)nginx\./,
    "Nginx Proxy Manager",
    "gateway",
    "network",
    "green",
    "nginxproxymanager"
  ),
  service(
    "omv",
    /(^|\.)omv\./,
    "OpenMediaVault",
    "storage",
    "database",
    "blue",
    "openmediavault"
  ),
  service(
    "proxmox",
    /(^|\.)(proxmox|pve)\./,
    "Proxmox VE",
    "infrastructure",
    "server",
    "orange",
    "proxmox"
  ),
  service(
    "homarr",
    /(^|\.)homarr\.|^local\./,
    "Homarr",
    "gateway",
    "layers",
    "cyan",
    "homarr"
  ),
  service(
    "netdata",
    /(^|\.)netdata\./,
    "Netdata",
    "observability",
    "activity",
    "green",
    "netdata"
  ),
  service(
    "jellyfin",
    /(^|\.)jellyfin/,
    "Jellyfin",
    "media",
    "film",
    "purple",
    "jellyfin"
  ),
  service("plex", /(^|\.)plex\./, "Plex", "media", "film", "amber", "plex"),
  service(
    "jellystat",
    /(^|\.)jellystat\./,
    "Jellystat",
    "observability",
    "gauge",
    "purple"
  ),
  service("tdarr", /(^|\.)tdarr\./, "Tdarr", "media", "film", "blue"),
  service(
    "tautulli",
    /(^|\.)tautulli\./,
    "Tautulli",
    "observability",
    "gauge",
    "amber"
  ),
  service(
    "docker",
    /(^|\.)(docker|portainer)/,
    "Portainer",
    "infrastructure",
    "box",
    "blue",
    "portainer"
  ),
  service(
    "prowlarr",
    /(^|\.)prowlarr\./,
    "Prowlarr",
    "downloads",
    "radar",
    "purple"
  ),
  service(
    "radarr",
    /(^|\.)radarr\./,
    "Radarr",
    "media",
    "film",
    "blue",
    "radarr"
  ),
  service(
    "sonarr",
    /(^|\.)sonarr/,
    "Sonarr",
    "media",
    "film",
    "blue",
    "sonarr"
  ),
  service("bazarr", /(^|\.)bazarr/, "Bazarr", "media", "film", "green"),
  service(
    "jackett",
    /(^|\.)jackett\./,
    "Jackett",
    "downloads",
    "radar",
    "purple"
  ),
  service(
    "overseerr",
    /(^|\.)(overseerr|seerr)\./,
    "Overseerr",
    "media",
    "film",
    "rose"
  ),
  service(
    "homeassistant",
    /(^|\.)homeassistant\./,
    "Home Assistant",
    "automation",
    "home",
    "cyan",
    "homeassistant"
  ),
  service(
    "syncthing",
    /(^|\.)syncthing/,
    "Syncthing",
    "storage",
    "cloud",
    "blue",
    "syncthing"
  ),
  service("tos", /(^|\.)tos-nas\./, "NAS", "storage", "database", "green"),
  service(
    "qbittorrent",
    /(^|\.)qbittorrent\./,
    "qBittorrent",
    "downloads",
    "download",
    "green",
    "qbittorrent"
  ),
  service(
    "pterodactyl",
    /(^|\.)pterodactyl\./,
    "Pterodactyl",
    "gaming",
    "gamepad",
    "amber",
    "pterodactyl"
  ),
  service(
    "uptime",
    /(^|\.)uptime\./,
    "Uptime Kuma",
    "observability",
    "activity",
    "green",
    "uptimekuma"
  ),
  service(
    "n8n",
    /(^|\.)(n8n|webhook-n8n)\./,
    "n8n",
    "automation",
    "workflow",
    "orange",
    "n8n"
  ),
  service(
    "jdownloader",
    /(^|\.)jdownloader\./,
    "JDownloader",
    "downloads",
    "download",
    "blue"
  ),
  service(
    "torrent-creator",
    /(^|\.)torrent-creator\./,
    "Torrent Creator",
    "downloads",
    "download",
    "cyan"
  ),
  service(
    "gateway",
    /(^|\.)gateway\./,
    "Gateway",
    "gateway",
    "shield",
    "amber"
  ),
  service("clea", /(^|\.)clea\.|crabwalk/, "Clea", "custom", "bot", "rose"),
  service("eve", /(^|\.)eve\./, "Eve", "custom", "globe", "purple"),
  service("quentn", /quentn\.xyz$/, "Quentn", "custom", "cloud", "cyan"),
]

export function resolveServiceMetadata(hostname: string): ServiceMetadata {
  const normalizedHostname = hostname.toLowerCase()
  const matchedRule = serviceRules.find((rule) =>
    rule.match.test(normalizedHostname)
  )

  if (matchedRule) {
    return matchedRule.metadata
  }

  return {
    key: "custom",
    name: getFallbackServiceName(normalizedHostname),
    category: "custom",
    icon: "globe",
    accent: "cyan",
  }
}

function service(
  key: string,
  match: RegExp,
  name: string,
  category: ServiceCategory,
  icon: ServiceIconName,
  accent: ServiceMetadata["accent"],
  logo?: ServiceLogoName
): ServiceRule {
  return {
    match,
    metadata: {
      key,
      name,
      category,
      icon,
      accent,
      logo,
    },
  }
}

function getFallbackServiceName(hostname: string) {
  const firstSegment = hostname.replace(/^\*\./, "").split(".").find(Boolean)

  if (!firstSegment) {
    return "Caddy endpoint"
  }

  return firstSegment
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}
