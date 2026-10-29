"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { formatINR } from "@repo/shared/utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegendContent, type ChartConfig } from "@/components/ui/chart";

const CHART_CONFIG: ChartConfig = {
  income: { label: "Income", color: "var(--success)" },
  expense: { label: "Expense", color: "var(--destructive)" },
};

interface CashFlowChartProps {
  data: Array<{ label: string; income: number; expense: number }>;
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  const hasData = data.some((d) => d.income > 0 || d.expense > 0);

  if (!hasData) {
    return (
      <div className="text-muted-foreground flex h-[280px] items-center justify-center text-sm">
        No cash flow yet. It fills in as you log transactions.
      </div>
    );
  }

  return (
    <ChartContainer
      config={CHART_CONFIG}
      height={280}
      chart={
        <BarChart data={data} barGap={4}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.6} />
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
          <ChartTooltip cursor={{ fill: "var(--muted)" }} content={<ChartTooltipContent formatter={formatINR} />} />
          {/* Income/expense are sign-coded, not categorical — match every other money display in the app. */}
          <Bar dataKey="income" name="Income" fill="var(--success)" radius={[4, 4, 0, 0]} maxBarSize={24} />
          <Bar dataKey="expense" name="Expense" fill="var(--destructive)" radius={[4, 4, 0, 0]} maxBarSize={24} />
        </BarChart>
      }
    >
      <ChartLegendContent items={["income", "expense"]} />
    </ChartContainer>
  );
}
