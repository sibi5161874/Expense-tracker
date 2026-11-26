import { formatINR, formatCompactCurrency } from "@repo/shared/utils";
import { AppText } from "@/components/common/AppText";
import { cn } from "@/lib/cn";
import type { StyleProp, TextStyle } from "react-native";

export interface AmountTextProps {
  value: number;
  /** When set, colors by sign regardless of `sign`. Use for raw +/- amounts. */
  colorBySign?: boolean;
  /** Force a color independent of the numeric sign (e.g. Income always green even though stored positive). */
  sign?: "positive" | "negative" | "neutral";
  /** Format in compact notation (e.g. ₹40K, ₹7.5L) */
  compact?: boolean;
  className?: string;
  style?: StyleProp<TextStyle>;
}

/**
 * Smart currency formatter for mobile screens:
 * - When `compact: true`, uses locale-aware compact representation (e.g. ₹40K, ₹7.5L).
 * - When amount is an exact integer, omits trailing `.00` to prevent cramped numbers from overflowing cards.
 * - Tabular number alignment is preserved.
 */
export function formatSmartINR(value: number, compact: boolean = false): string {
  if (compact) {
    return formatCompactCurrency(value, "INR");
  }
  // If amount is an integer, omit .00 to prevent text overflow
  if (Math.abs(value % 1) < 0.005) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
  return formatINR(value);
}

/**
 * Mirrors apps/web/src/components/shared/AmountText.tsx with mobile responsive safeguards.
 */
export function AmountText({
  value,
  colorBySign = true,
  sign,
  compact = false,
  className,
  style,
}: AmountTextProps) {
  const resolvedSign =
    sign ??
    (colorBySign
      ? value > 0
        ? "positive"
        : value < 0
        ? "negative"
        : "neutral"
      : "neutral");

  return (
    <AppText
      style={[{ fontVariant: ["tabular-nums"] }, style]}
      className={cn(
        resolvedSign === "positive" && "text-success",
        resolvedSign === "negative" && "text-destructive",
        className
      )}
    >
      {formatSmartINR(value, compact)}
    </AppText>
  );
}
