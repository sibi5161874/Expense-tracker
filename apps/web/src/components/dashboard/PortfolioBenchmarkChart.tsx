'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useNetWorthSnapshots } from '@/hooks/useNetWorthSnapshots';
import { useBenchmarkHistory, type BenchmarkRange } from '@/hooks/useBenchmarkHistory';
import { buildBenchmarkSeries, type BenchmarkPoint } from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils/currency';
import { ProBlurredPreview } from '@/components/shared/ProGate';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';

// Static, no network — purely a visual stand-in shown blurred to free-tier users. The real
// chart's data (net worth snapshots + Nifty history) is gated server-side, so mounting the
// real fetching component for a free user would just produce a 403 hidden under the blur.
const PLACEHOLDER_SERIES: BenchmarkPoint[] = Array.from({ length: 24 }, (_, i) => ({
  date: String(i),
  netWorth: 1_000_000 + i * 18_000 + Math.sin(i / 2) * 40_000,
  benchmark: 1_000_000 + i * 12_000 + Math.cos(i / 3) * 30_000,
}));

const NIFTY_TICKER = '^NSEI';

const RANGE_OPTIONS: { value: BenchmarkRange; label: string }[] = [
  { value: '1mo', label: '1M' },
  { value: '3mo', label: '3M' },
  { value: '6mo', label: '6M' },
  { value: '1y', label: '1Y' },
];

function BenchmarkAreaChart({ series }: { series: BenchmarkPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={series}>
        <defs>
          <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--success)" stopOpacity={0.25} />
            <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="benchmarkGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.2} />
            <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
          tickFormatter={(v) => (v >= 100000 ? `${(v / 100000).toFixed(1)}L` : `${v}`)}
          width={48}
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
          formatter={(value, name) => [formatINR(Number(value)), name]}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area type="monotone" dataKey="netWorth" name="Your Net Worth" stroke="var(--success)" fill="url(#netWorthGradient)" strokeWidth={2} />
        <Area type="monotone" dataKey="benchmark" name="Nifty 50 (scaled)" stroke="var(--chart-2)" fill="url(#benchmarkGradient)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function LiveBenchmarkChart() {
  const [range, setRange] = useState<BenchmarkRange>('1y');
  const { data: snapshots, isLoading: snapshotsLoading, error: snapshotsError } = useNetWorthSnapshots();
  const { data: history, isLoading: historyLoading, error: historyError } = useBenchmarkHistory(NIFTY_TICKER, range);

  const series = useMemo(() => {
    if (!snapshots || !history) return [];
    return buildBenchmarkSeries(snapshots, history);
  }, [snapshots, history]);

  return (
    <Card>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Portfolio vs Nifty 50</h2>
          <SegmentedControl options={RANGE_OPTIONS} value={range} onChange={setRange} />
        </div>

        {snapshotsLoading || historyLoading ? (
          <LoadingState label="Loading benchmark..." />
        ) : snapshotsError || historyError ? (
          <ErrorState error={(snapshotsError ?? historyError)!} />
        ) : (snapshots ?? []).length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-muted-foreground text-sm">
              Take a net worth snapshot to start comparing your growth against Nifty 50.
            </p>
            <Link
              href="/reports/net-worth"
              className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:brightness-95 active:scale-[0.98]"
            >
              Take a Snapshot
            </Link>
          </div>
        ) : series.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">No Nifty 50 history for this range yet.</p>
        ) : (
          <BenchmarkAreaChart series={series} />
        )}
      </CardContent>
    </Card>
  );
}

function BenchmarkPlaceholder() {
  return (
    <Card>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Portfolio vs Nifty 50</h2>
          <SegmentedControl options={RANGE_OPTIONS} value="1y" onChange={() => {}} />
        </div>
        <BenchmarkAreaChart series={PLACEHOLDER_SERIES} />
      </CardContent>
    </Card>
  );
}

/** Dropped into the dashboard — teased blurred with an upgrade CTA on the free tier, since seeing that this exists is itself part of the pitch. */
export function PortfolioBenchmarkChart() {
  const router = useRouter();
  const { hasFeature } = useEntitlements();

  function goToUpgrade() {
    toast.info('Comparing your net worth against Nifty 50 is a Pro feature — start your free trial to unlock it.');
    router.push('/settings?tab=billing');
  }

  return (
    <ProBlurredPreview
      feature="livePriceRefresh"
      title="Portfolio vs Nifty 50"
      description="See how your net worth growth stacks up against the market, over any time range."
      onUpgradeClick={goToUpgrade}
    >
      {hasFeature('livePriceRefresh') ? <LiveBenchmarkChart /> : <BenchmarkPlaceholder />}
    </ProBlurredPreview>
  );
}
