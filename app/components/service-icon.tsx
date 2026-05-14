import {
  Activity,
  Bot,
  Box,
  Cloud,
  Database,
  Download,
  Film,
  Gamepad2,
  Gauge,
  Globe2,
  Home,
  Layers3,
  Network,
  Radar,
  Server,
  Shield,
  Workflow,
  type LucideIcon,
} from "lucide-react"
import {
  siDocker,
  siHomeassistant,
  siHomarr,
  siJellyfin,
  siN8n,
  siNetdata,
  siNginxproxymanager,
  siOpenmediavault,
  siPlex,
  siPortainer,
  siProxmox,
  siPterodactyl,
  siQbittorrent,
  siRadarr,
  siSonarr,
  siSyncthing,
  siUptimekuma,
} from "simple-icons"

import type {
  ServiceIconName,
  ServiceLogoName,
  ServiceMetadata,
} from "~/lib/service-catalog"
import { cn } from "~/lib/utils"

const lucideIcons: Record<ServiceIconName, LucideIcon> = {
  activity: Activity,
  bot: Bot,
  box: Box,
  cloud: Cloud,
  database: Database,
  download: Download,
  film: Film,
  gamepad: Gamepad2,
  gauge: Gauge,
  globe: Globe2,
  home: Home,
  layers: Layers3,
  network: Network,
  radar: Radar,
  server: Server,
  shield: Shield,
  workflow: Workflow,
}

const brandIcons = {
  docker: siDocker,
  homeassistant: siHomeassistant,
  jellyfin: siJellyfin,
  n8n: siN8n,
  plex: siPlex,
  proxmox: siProxmox,
  qbittorrent: siQbittorrent,
  syncthing: siSyncthing,
  homarr: siHomarr,
  netdata: siNetdata,
  nginxproxymanager: siNginxproxymanager,
  openmediavault: siOpenmediavault,
  portainer: siPortainer,
  pterodactyl: siPterodactyl,
  radarr: siRadarr,
  sonarr: siSonarr,
  uptimekuma: siUptimekuma,
} satisfies Partial<Record<ServiceLogoName, { path: string; title: string }>>

type ServiceIconProps = {
  className?: string
  service: ServiceMetadata
}

export function ServiceIcon({ className, service }: ServiceIconProps) {
  const brandIcon = service.logo ? brandIcons[service.logo] : null

  if (brandIcon) {
    return (
      <svg
        aria-hidden="true"
        className={cn("size-5 fill-current", className)}
        role="img"
        viewBox="0 0 24 24"
      >
        <path d={brandIcon.path} />
      </svg>
    )
  }

  const Icon = lucideIcons[service.icon]

  return <Icon aria-hidden="true" className={cn("size-5", className)} />
}
