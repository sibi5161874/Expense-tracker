'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { formatINR } from '@repo/shared/utils';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegendContent, type ChartConfig } from '@/components/ui/chart';

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

interface StackedAreaChartProps {
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: string[];
}

export function StackedAreaChart({ data, xKey, series }: StackedAreaChartProps) {
  const config: ChartConfig = Object.fromEntries(
    series.map((key, i) => [key, { label: key, color: COLORS[i % COLORS.length] }])
  );

  return (
    <ChartContainer
      config={config}
      height={320}
      chart={
        <AreaChart data={data}>
          <defs>
            {series.map((key, i) => (
              <linearGradient key={key} id={`stacked-area-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.4} />
                <stop offset="95%" stopColor={COLORS[i % COLORS.length]} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeOpacity={0.6} />
          <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
            tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : `${v}`)}
            width={40}
          />
          <ChartTooltip cursor={{ stroke: 'var(--border)' }} content={<ChartTooltipContent formatter={formatINR} />} />
          {series.map((key, i) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stackId="1"
              stroke={COLORS[i % COLORS.length]}
              strokeWidth={2}
              fill={`url(#stacked-area-${key})`}
            />
          ))}
        </AreaChart>
      }
    >
      <ChartLegendContent items={series} />
    </ChartContainer>
  );
}
