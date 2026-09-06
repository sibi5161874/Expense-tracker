'use client';

import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatINR } from '@repo/shared/utils';

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)'];

interface StackedAreaChartProps {
  data: Array<Record<string, string | number>>;
  xKey: string;
  series: string[];
}

export function StackedAreaChart({ data, xKey, series }: StackedAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <AreaChart data={data}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey={xKey} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
          tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : `${v}`)}
          width={40}
        />
        <Tooltip
          cursor={{ stroke: 'var(--border)' }}
          contentStyle={{
            background: 'var(--popover)',
            color: 'var(--popover-foreground)',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            fontSize: 12,
          }}
          formatter={(value) => formatINR(Number(value))}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map((key, i) => (
          <Area
            key={key}
            type="monotone"
            dataKey={key}
            stackId="1"
            stroke={COLORS[i % COLORS.length]}
            fill={COLORS[i % COLORS.length]}
            fillOpacity={0.5}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
