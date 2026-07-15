import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "success" | "destructive" | "warning" | "info" | "neutral";

const TONE_CLASSES: Record<BadgeTone, string> = {
  success: "bg-success-subtle text-success border-transparent",
  destructive: "bg-destructive-subtle text-destructive border-transparent",
  warning: "bg-warning-subtle text-warning-foreground border-transparent",
  info: "bg-info-subtle text-info border-transparent",
  neutral: "bg-muted text-muted-foreground border-transparent",
};

interface StatusBadgeProps {
  tone: BadgeTone;
  children: ReactNode;
  className?: string;
}

export function StatusBadge({ tone, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TONE_CLASSES[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
