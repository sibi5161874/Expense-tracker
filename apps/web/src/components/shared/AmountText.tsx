import { formatINR } from "@repo/shared/utils";
import { cn } from "@/lib/utils";

interface AmountTextProps {
  value: number;
  /** When set, colors by sign regardless of `sign`. Use for raw +/- amounts. */
  colorBySign?: boolean;
  /** Force a color independent of the numeric sign (e.g. Income always green even though stored positive). */
  sign?: "positive" | "negative" | "neutral";
  className?: string;
}

export function AmountText({ value, colorBySign = true, sign, className }: AmountTextProps) {
  const resolvedSign = sign ?? (colorBySign ? (value > 0 ? "positive" : value < 0 ? "negative" : "neutral") : "neutral");

  return (
    <span
      className={cn(
        "font-mono tabular-nums",
        resolvedSign === "positive" && "text-success",
        resolvedSign === "negative" && "text-destructive",
        className
      )}
    >
      {formatINR(value)}
    </span>
  );
}
