"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatINR } from "@repo/shared/utils";

interface CashFlowChartProps {
  data: Array<{ label: string; income: number; expense: number }>;
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  const hasData = data.some((d) => d.income > 0 || d.expense > 0);

  if (!hasData) {
    return (
      <div className="text-muted-foreground flex h-[280px] items-center justify-center text-sm">
        No cash flow yet — it fills in as you log transactions.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} barGap={4}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : `${v}`)}
          width={40}
        />
        <Tooltip
          cursor={{ fill: "var(--muted)" }}
          contentStyle={{
            background: "var(--popover)",
            color: "var(--popover-foreground)",
            border: "1px solid var(--border)",
            borderRadius: "0.5rem",
            fontSize: 12,
          }}
          formatter={(value) => formatINR(Number(value))}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" iconSize={8} />
        {/* Income/expense are sign-coded, not categorical — match every other money display in the app. */}
        <Bar dataKey="income" name="Income" fill="var(--success)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expense" name="Expense" fill="var(--destructive)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
