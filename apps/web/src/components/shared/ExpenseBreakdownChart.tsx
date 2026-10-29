"use client";

import { Cell, Pie, PieChart } from "recharts";
import { formatINR } from "@repo/shared/utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { AmountText } from "@/components/shared/AmountText";

const COLOR_KEYS = ["chart-1", "chart-2", "chart-3", "chart-4", "chart-5"] as const;
const COLORS = COLOR_KEYS.map((k) => `var(--${k})`);

interface ExpenseBreakdownChartProps {
  data: Array<{ name: string; value: number }>;
  /** Abbreviates the center total and legend amounts (₹12.5L…) with the full figure on hover —
   * for glanceable "spending this month" overviews. Leave off (the default) wherever the exact
   * number matters, e.g. an allocation-by-holding breakdown someone is using to size a trade. */
  compact?: boolean;
}

export function ExpenseBreakdownChart({ data, compact = false }: ExpenseBreakdownChartProps) {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const top = sorted.slice(0, 4);
  const otherTotal = sorted.slice(4).reduce((sum, d) => sum + d.value, 0);
  const slices = otherTotal > 0 ? [...top, { name: "Other", value: otherTotal }] : top;
  const total = slices.reduce((sum, d) => sum + d.value, 0);

  if (slices.length === 0) {
    return (
      <div className="text-muted-foreground flex h-[220px] items-center justify-center text-sm">
        No expenses this month yet.
      </div>
    );
  }

  const config: ChartConfig = Object.fromEntries(
    slices.map((entry, i) => [entry.name, { label: entry.name, color: COLORS[i % COLORS.length] }])
  );

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="relative w-full sm:max-w-[200px]">
        <ChartContainer
          config={config}
          height={200}
          chart={
            <PieChart>
              <Pie data={slices} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2}>
                {slices.map((entry, i) => (
                  <Cell key={entry.name} fill={COLORS[i % COLORS.length]} stroke="none" />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent formatter={formatINR} hideLabel />} />
            </PieChart>
          }
        />
        {/* Center total — the hero figure a donut earns once it has a real sum to show. */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-muted-foreground text-[11px] font-medium">Total</span>
          {compact ? (
            <span className="pointer-events-auto">
              <AmountText value={total} compact colorBySign={false} className="text-lg font-semibold" />
            </span>
          ) : (
            <span className="text-foreground text-lg font-semibold tabular-nums">{formatINR(total)}</span>
          )}
        </div>
      </div>
      <ul className="w-full space-y-2">
        {slices.map((entry, i) => (
          <li key={entry.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="truncate">{entry.name}</span>
            </span>
            {compact ? (
              <AmountText value={entry.value} compact colorBySign={false} className="font-medium" />
            ) : (
              <span className="tabular-nums font-medium">{formatINR(entry.value)}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
