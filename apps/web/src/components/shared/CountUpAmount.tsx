"use client";

import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";
import { formatINR } from "@repo/shared/utils";
import { cn } from "@/lib/utils";

interface CountUpAmountProps {
  value: number;
  className?: string;
}

/**
 * Animates from 0 to `value` once, on first mount only — not on every re-render or refetch.
 * Reserved for hero numbers (Dashboard's Net Worth today; Portfolio's Current Value once
 * Portfolio gets a hero treatment).
 */
export function CountUpAmount({ value, className }: CountUpAmountProps) {
  const [display, setDisplay] = useState(0);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (hasAnimatedRef.current) return;
    hasAnimatedRef.current = true;

    const controls = animate(0, value, {
      duration: 0.6,
      ease: "easeOut",
      onUpdate: (latest) => setDisplay(latest),
    });

    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally mount-once, not value-reactive
  }, []);

  return <span className={cn("font-mono tabular-nums", className)}>{formatINR(display)}</span>;
}
