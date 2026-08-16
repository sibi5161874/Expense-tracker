import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Floating Action Button per design spec §5C: fixed bottom-right, solid primary blue,
 * white icon, subtle inset highlight instead of a drop shadow.
 */
export function Fab({ className, children, ...props }: ComponentProps<"button">) {
  return (
    <button
      type="button"
      className={cn(
        "fixed right-6 bottom-6 z-40 flex size-14 items-center justify-center rounded-full",
        "bg-primary text-primary-foreground shadow-fab-inset transition-transform active:scale-95",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
