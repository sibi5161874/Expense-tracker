"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatINR } from "@repo/shared/utils";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

interface ExpenseBreakdownChartProps {
  data: Array<{ name: string; value: number }>;
}

export function ExpenseBreakdownChart({ data }: ExpenseBreakdownChartProps) {
  const top = data.slice(0, 5);

  if (top.length === 0) {
    return (
      <div className="text-muted-foreground flex h-[220px] items-center justify-center text-sm">
        No expenses this month yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <ResponsiveContainer width="100%" height={200} className="sm:max-w-[200px]">
        <PieChart>
          <Pie data={top} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2}>
            {top.map((entry, i) => (
              <Cell key={entry.name} fill={COLORS[i % COLORS.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              color: "var(--popover-foreground)",
              border: "1px solid var(--border)",
              borderRadius: "0.5rem",
              fontSize: 12,
            }}
            formatter={(value) => formatINR(Number(value))}
          />
        </PieChart>
      </ResponsiveContainer>
      <ul className="w-full space-y-2">
        {top.map((entry, i) => (
          <li key={entry.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="truncate">{entry.name}</span>
            </span>
            <span className="tabular-nums font-medium">{formatINR(entry.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
