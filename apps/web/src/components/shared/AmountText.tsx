"use client";

import { useEffect, useRef, useState } from "react";
import { formatCurrency } from "@repo/shared/utils";
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";

interface AmountTextProps {
  value: number;
  currency?: string;
  /** When set, colors by sign regardless of `sign`. Use for raw +/- amounts. */
  colorBySign?: boolean;
  /** Force a color independent of the numeric sign (e.g. Income always green even though stored positive). */
  sign?: "positive" | "negative" | "neutral";
  className?: string;
}

export function AmountText({ value, currency, colorBySign = true, sign, className }: AmountTextProps) {
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

  return (
    <span
      className={cn(
        "font-mono tabular-nums",
        resolvedSign === "positive" && "text-success",
        resolvedSign === "negative" && "text-destructive",
        isFlashing && "animate-in fade-in-0 duration-300",
        className
      )}
    >
      {formatCurrency(value, activeCurrency)}
    </span>
  );
}
