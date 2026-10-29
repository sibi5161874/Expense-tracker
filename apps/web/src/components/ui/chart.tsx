"use client";

import * as React from "react";
import { ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { cn } from "@/lib/utils";

/** Per-series display config: label text + color token, keyed by the series' dataKey/name. */
export type ChartConfig = Record<string, { label: string; color: string }>;

const ChartContext = React.createContext<ChartConfig | null>(null);

function useChartConfig() {
  const ctx = React.useContext(ChartContext);
  if (!ctx) throw new Error("Chart tooltip/legend components must be used within <ChartContainer>");
  return ctx;
}

interface ChartContainerProps extends Omit<React.ComponentProps<"div">, "children"> {
  config: ChartConfig;
  height?: number | string;
  /** The single Recharts chart element — Recharts' ResponsiveContainer requires exactly one. */
  chart: React.ReactElement;
  /** Extra content below the chart (e.g. <ChartLegendContent>), still inside the config context. */
  children?: React.ReactNode;
}

/**
 * Shared chart shell — fixes height via Recharts' own ResponsiveContainer, applies the
 * muted hairline grid/axis treatment every chart in the app wants, and makes each
 * series' label/color available to ChartTooltipContent/ChartLegendContent via context
 * instead of every chart re-deriving its own tooltip styling from scratch.
 */
export function ChartContainer({ config, height = 280, className, chart, children, ...props }: ChartContainerProps) {
  return (
    <ChartContext.Provider value={config}>
      <div
        data-slot="chart"
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/60 [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            {chart}
          </ResponsiveContainer>
        </div>
        {children}
      </div>
    </ChartContext.Provider>
  );
}

export const ChartTooltip = RechartsTooltip;

type RechartsTooltipContentProp = React.ComponentProps<typeof RechartsTooltip>["content"];

interface TooltipPayloadItem {
  dataKey?: string | number;
  name?: string | number;
  value?: number | string;
  color?: string;
}

interface ChartTooltipContentProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  indicator?: "dot" | "line";
  formatter?: (value: number) => string;
  hideLabel?: boolean;
}

/**
 * Elevated card tooltip — values lead (Strong, high-contrast), series names follow,
 * each row keyed with a short dot/line of the series color. Replaces every chart's
 * hand-rolled inline `contentStyle` object with one consistent, properly spaced card.
 */
export function ChartTooltipContent({
  active,
  payload,
  label,
  indicator = "dot",
  formatter,
  hideLabel = false,
}: ChartTooltipContentProps) {
  const config = useChartConfig();
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-popover text-popover-foreground border-border/80 min-w-[9rem] rounded-xl border p-2.5 text-xs shadow-lg">
      {!hideLabel && label != null && <p className="text-muted-foreground mb-1.5 font-medium">{label}</p>}
      <div className="space-y-1">
        {payload.map((item, i) => {
          const key = String(item.dataKey ?? item.name ?? i);
          const entry = config[key];
          const color = item.color ?? entry?.color ?? "var(--muted-foreground)";
          const value = typeof item.value === "number" ? item.value : Number(item.value ?? 0);
          return (
            <div key={key} className="flex items-center gap-2">
              {indicator === "dot" ? (
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              ) : (
                <span className="h-0.5 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              )}
              <span className="text-muted-foreground min-w-0 flex-1 truncate">{entry?.label ?? String(item.name ?? "")}</span>
              <span className="text-foreground font-semibold tabular-nums">{formatter ? formatter(value) : value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Satisfies Recharts' `content` prop type at call sites: `content={<ChartTooltipContent ... />}`.
export type { RechartsTooltipContentProp };

interface ChartLegendContentProps {
  items: string[];
}

/**
 * Standardized legend — a dot per series in the series color and its label, laid out
 * with real spacing. Replaces Recharts' cramped default `<Legend>` everywhere it was
 * used, matching the dataviz rule that 2+ series always carry a legend.
 */
export function ChartLegendContent({ items }: ChartLegendContentProps) {
  const config = useChartConfig();
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs">
      {items.map((key) => {
        const entry = config[key];
        if (!entry) return null;
        return (
          <span key={key} className="text-muted-foreground flex items-center gap-1.5">
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.label}
          </span>
        );
      })}
    </div>
  );
}
