"use client";

import { useEffect, useRef, useState } from "react";
import { formatCurrency, formatCompactCurrency } from "@repo/shared/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AmountTextProps {
  value: number;
  currency?: string;
  /** When set, colors by sign regardless of `sign`. Use for raw +/- amounts. */
  colorBySign?: boolean;
  /** Force a color independent of the numeric sign (e.g. Income always green even though stored positive). */
  sign?: "positive" | "negative" | "neutral";
  className?: string;
  /** Abbreviates large amounts (₹12.5L, ₹4.6Cr, $5.6M, $6.6B…) with the full value on hover
   * instead of always spelling out every digit. Reserved for hero/KPI-style numbers where the
   * precise value isn't the point — tables and anywhere the exact figure matters should leave
   * this off. */
  compact?: boolean;
}

export function AmountText({ value, currency, colorBySign = true, sign, className, compact = false }: AmountTextProps) {
  const { currency: defaultCurrency } = useCurrency();
  const activeCurrency = currency ?? defaultCurrency;
  const resolvedSign = sign ?? (colorBySign ? (value > 0 ? "positive" : value < 0 ? "negative" : "neutral") : "neutral");

  // Fades a value change in place (e.g. after an edit) — never fires on initial mount, so a
  // page full of amounts doesn't all flash together on first load.
  const [isFlashing, setIsFlashing] = useState(false);
  const prevValueRef = useRef(value);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      prevValueRef.current = value;
      return;
    }
    if (prevValueRef.current === value) return;
    prevValueRef.current = value;
    setIsFlashing(true);
    const timeout = setTimeout(() => setIsFlashing(false), 300);
    return () => clearTimeout(timeout);
  }, [value]);

  const spanClassName = cn(
    "font-mono tabular-nums",
    resolvedSign === "positive" && "text-success",
    resolvedSign === "negative" && "text-destructive",
    isFlashing && "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-300",
    className
  );

  if (!compact) {
    return <span className={spanClassName}>{formatCurrency(value, activeCurrency)}</span>;
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
          {formatCompactCurrency(value, activeCurrency)}
        </span>
      </TooltipTrigger>
      <TooltipContent>{formatCurrency(value, activeCurrency)}</TooltipContent>
    </Tooltip>
  );
}
