import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BadgeTone } from "@/components/shared/StatusBadge";
import { AmountText } from "@/components/shared/AmountText";

const ICON_TONE_CLASSES: Record<BadgeTone, string> = {
  success: "bg-success-subtle text-success",
  destructive: "bg-destructive-subtle text-destructive",
  warning: "bg-warning-subtle text-warning-foreground",
  info: "bg-info-subtle text-info",
  neutral: "bg-muted text-muted-foreground",
};

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: BadgeTone;
  trend?: string;
  trendTone?: BadgeTone;
  /** Raw currency amount backing `value`. When provided, the card shows the abbreviated
   * form (₹12.5L…) with the full figure on hover instead of `value` verbatim — for
   * amounts, not percentages, counts, or other pre-formatted strings. */
  compactValue?: number;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  trend,
  trendTone,
  compactValue,
}: StatCardProps) {
  return (
    <div className="bg-card rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <p className="text-muted-foreground text-sm">{label}</p>
        <div className={cn("flex size-9 items-center justify-center rounded-full", ICON_TONE_CLASSES[tone])}>
          <Icon className="size-4.5" />
        </div>
      </div>
      {compactValue !== undefined ? (
        <p className="mt-3 text-2xl font-semibold tabular-nums">
          <AmountText value={compactValue} compact colorBySign={false} className="text-2xl font-semibold" />
        </p>
      ) : (
        <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
      )}
      {trend && (
        <p
          className={cn(
            "mt-1 text-xs font-medium",
            trendTone === "success" && "text-success",
            trendTone === "destructive" && "text-destructive",
            !trendTone && "text-muted-foreground"
          )}
        >
          {trend}
        </p>
      )}
    </div>
  );
}
