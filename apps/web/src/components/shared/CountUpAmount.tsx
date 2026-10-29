"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";
import { formatINR, formatCompactCurrency } from "@repo/shared/utils";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CountUpAmountProps {
  value: number;
  className?: string;
  /** Abbreviates the settled value (₹12.5L, ₹4.6Cr…) with the full amount on hover — the count-up
   * animation itself still runs through every digit, only the resting display is shortened. */
  compact?: boolean;
}

/**
 * Animates from 0 to `value` once, on first mount only — not on every re-render or refetch.
 * Reserved for hero numbers (Dashboard's Net Worth today; Portfolio's Current Value once
 * Portfolio gets a hero treatment).
 */
export function CountUpAmount({ value, className, compact = false }: CountUpAmountProps) {
  const [display, setDisplay] = useState(0);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (hasAnimatedRef.current) return;
    hasAnimatedRef.current = true;

    // No cleanup that stops the animation: React Strict Mode's dev-only double-invoke
    // (mount -> cleanup -> mount) would otherwise kill the animation on its first real start
    // — the ref guard above then skips the second invocation, leaving `display` stuck at 0
    // forever. Letting it run to completion is safe; the component staying mounted is exactly
    // what the ref is guarding for.
    animate(0, value, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate: (latest) => setDisplay(latest),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally mount-once, not value-reactive
  }, []);

  const spanClassName = cn("font-mono tabular-nums", className);

  // While the animation is running, show the full figure counting up — only the settled value
  // (display === value, the exact end state `animate`'s last `onUpdate` call reaches) switches
  // to the abbreviated form, so the digits don't jump to a shortened form mid-count.
  if (!compact || display !== value) {
    return <span className={spanClassName}>{formatINR(display)}</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            spanClassName,
            "cursor-default rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          )}
        >
          {formatCompactCurrency(value)}
        </span>
      </TooltipTrigger>
      <TooltipContent>{formatINR(value)}</TooltipContent>
    </Tooltip>
  );
}
