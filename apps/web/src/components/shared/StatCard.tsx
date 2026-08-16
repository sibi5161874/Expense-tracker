import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BadgeTone } from "@/components/shared/StatusBadge";

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
}

export function StatCard({ label, value, icon: Icon, tone = "neutral", trend, trendTone }: StatCardProps) {
  return (
    <div className="bg-card rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <p className="text-muted-foreground text-sm">{label}</p>
        <div className={cn("flex size-9 items-center justify-center rounded-full", ICON_TONE_CLASSES[tone])}>
          <Icon className="size-4.5" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
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
