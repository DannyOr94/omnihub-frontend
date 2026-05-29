import * as React from "react"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  ...props
}) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-base transition-all placeholder:text-slate-400/80 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/25 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:border-slate-850 dark:bg-slate-950 dark:placeholder:text-slate-500 dark:disabled:bg-slate-900",
        className
      )}
      {...props} />
  );
}

export { Input }
