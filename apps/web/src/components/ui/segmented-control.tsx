"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

/**
 * Pill-shaped segmented toggle per design spec §5C: solid accent2 (purple) fill + white
 * text on the active side, transparent + 1px border on inactive sides.
 * Animated sliding pill indicator powered by Framer Motion layoutId.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  id: customId,
}: {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  id?: string;
}) {
  const generatedId = useId();
  const layoutId = customId ?? generatedId;

  return (
    <div
      role="tablist"
      className={cn("inline-flex items-center gap-1 rounded-2xl border border-border p-1 bg-surface-muted/30", className)}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative rounded-xl px-3 py-2 sm:py-1.5 min-h-[44px] sm:min-h-0 text-sm font-medium whitespace-nowrap transition-colors flex items-center justify-center cursor-pointer",
              active
                ? "text-accent2-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <motion.div
                layoutId={`segmented-active-pill-${layoutId}`}
                className="absolute inset-0 rounded-xl bg-accent2 shadow-xs"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
