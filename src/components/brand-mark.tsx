import Link from "next/link"

import { cn } from "@/lib/utils"

type BrandMarkProps = {
  href?: string
  className?: string
  iconOnly?: boolean
}

export function BrandMark({ href = "/", className, iconOnly = false }: BrandMarkProps) {
  const content = iconOnly ? (
    <span
      className={cn(
        "inline-grid h-11 w-11 place-items-center rounded-[1.35rem] border border-border/70 bg-white/80 text-lg font-semibold text-foreground shadow-[0_16px_40px_-28px_rgba(15,15,15,0.45)] backdrop-blur-sm",
        className
      )}
    >
      <span className="font-display tracking-[-0.08em]">S</span>
    </span>
  ) : (
    <span className={cn("inline-flex items-start gap-1.5 text-foreground", className)}>
      <span className="font-display text-[2.35rem] leading-none font-semibold tracking-[-0.09em]">Spikr</span>
      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-foreground/90" aria-hidden="true" />
    </span>
  )

  return (
    <Link href={href} className="inline-flex items-center" aria-label="Spikr">
      {content}
    </Link>
  )
}