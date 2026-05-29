import * as React from "react"
import { Label } from "./label"
import { cn } from "@/lib/utils"

function FormField({
  label,
  error,
  required,
  children,
  className,
  ...props
}) {
  return (
    <div className={cn("space-y-1.5 w-full", className)} {...props}>
      {label && (
        <Label className="text-slate-700 dark:text-slate-300 font-medium">
          {label}
          {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </Label>
      )}
      <div className="relative">
        {children}
      </div>
      {error && (
        <p className="text-xs font-medium text-red-500 mt-1 animate-in fade-in-50 slide-in-from-top-1 duration-150">
          {error}
        </p>
      )}
    </div>
  )
}

export { FormField }
