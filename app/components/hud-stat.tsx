import type { ReactNode } from "react"

import { cn } from "~/lib/utils"

type HudStatProps = {
  className?: string
  icon?: ReactNode
  label: ReactNode
  value: ReactNode
}

export function HudStat({ className, icon, label, value }: HudStatProps) {
  return (
    <div className={cn("hud-panel p-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[0.65rem] font-semibold tracking-[0.32em] text-muted-foreground uppercase">
          {label}
        </span>
        {icon ? (
          <span className="text-primary drop-shadow-[0_0_12px_color-mix(in_oklch,var(--primary),transparent_30%)]">
            {icon}
          </span>
        ) : null}
      </div>
      <div className="mt-3 font-mono text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </div>
    </div>
  )
}
