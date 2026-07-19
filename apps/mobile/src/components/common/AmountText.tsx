import { formatINR } from "@repo/shared/utils";
import { AppText } from "@/components/common/AppText";
import { cn } from "@/lib/cn";

interface AmountTextProps {
  value: number;
  /** When set, colors by sign regardless of `sign`. Use for raw +/- amounts. */
  colorBySign?: boolean;
  /** Force a color independent of the numeric sign (e.g. Income always green even though stored positive). */
  sign?: "positive" | "negative" | "neutral";
  className?: string;
}

/**
 * Mirrors apps/web/src/components/shared/AmountText.tsx. RN has no `tabular-nums` Tailwind
 * utility that reliably reaches the native text renderer, so tabular alignment is applied via
 * the `fontVariant` style prop directly — the platform-correct primitive for this on iOS/Android.
 */
export function AmountText({ value, colorBySign = true, sign, className }: AmountTextProps) {
  const resolvedSign = sign ?? (colorBySign ? (value > 0 ? "positive" : value < 0 ? "negative" : "neutral") : "neutral");

  return (
    <AppText
      style={{ fontVariant: ["tabular-nums"] }}
      className={cn(
        resolvedSign === "positive" && "text-success",
        resolvedSign === "negative" && "text-destructive",
        className
      )}
    >
      {formatINR(value)}
    </AppText>
  );
}
