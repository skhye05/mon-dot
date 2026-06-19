import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "border-input bg-background placeholder:text-muted-foreground flex h-7 w-full min-w-0 rounded-md border px-2 py-1 text-xs shadow-xs transition-[color,box-shadow] outline-none",
        "file:text-foreground file:inline-flex file:border-0 file:bg-transparent file:text-xs file:font-medium",
        "focus-visible:border-ring focus-visible:ring-ring/30 focus-visible:ring-2",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
