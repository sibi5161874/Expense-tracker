import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({ className, type, value, ...props }: React.ComponentProps<"input">) {
  // react-hook-form's `field.value` starts `undefined` for any schema field without an
  // explicit default, which flips the input from uncontrolled -> controlled on first
  // keystroke and triggers React's warning. Every real caller here is either genuinely
  // controlled (react-hook-form or local state) or doesn't pass `value` at all, so this
  // coercion is safe everywhere except file inputs, which must stay uncontrolled.
  const resolvedValue = type === "file" ? undefined : (value ?? "");

  return (
    <InputPrimitive
      type={type}
      value={resolvedValue}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border border-input bg-transparent px-4 py-2 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        // The browser's native number spin buttons render on top of the value/placeholder
        // text and any suffix badge (₹, % p.a., years) layered over the field with absolute
        // positioning — every numeric field in the app is affected, not just one page, so
        // this is disabled here once rather than per call site.
        type === "number" &&
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        className
      )}
      {...props}
    />
  )
}

export { Input }
