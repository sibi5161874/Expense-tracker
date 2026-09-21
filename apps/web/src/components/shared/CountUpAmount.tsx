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

  return <span className={cn("font-mono tabular-nums", className)}>{formatINR(display)}</span>;
}
