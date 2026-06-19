import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

type BadgeVariant = "default" | "secondary" | "outline" | "muted"

const VARIANTS: Record<BadgeVariant, string> = {
  default: "border-transparent bg-primary text-primary-foreground",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  outline: "text-foreground border-border",
  muted: "border-transparent bg-muted text-muted-foreground",
}

function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & { variant?: BadgeVariant }) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-md border px-1.5 py-0.5 text-[0.6875rem] font-medium whitespace-nowrap [&>svg]:pointer-events-none [&>svg]:size-3",
        VARIANTS[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
