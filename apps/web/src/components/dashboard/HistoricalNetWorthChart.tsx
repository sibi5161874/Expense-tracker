'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useEntitlements } from '@/hooks/useEntitlements';
import { useNetWorthSnapshots } from '@/hooks/useNetWorthSnapshots';
import { filterSnapshotsByRange, calculateSnapshotGrowthPct, type NetWorthHistoryRange } from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils/currency';
import { ProBlurredPreview } from '@/components/shared/ProGate';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';

const RANGE_OPTIONS: { value: NetWorthHistoryRange; label: string }[] = [
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '6M', label: '6M' },
  { value: '1Y', label: '1Y' },
  { value: 'All', label: 'All' },
];

// Static, no network — shown blurred to free-tier users instead of the real snapshot data.
const PLACEHOLDER_DATA = Array.from({ length: 20 }, (_, i) => ({
  snapshot_date: String(i),
  net_worth: 1_000_000 + i * 22_000 + Math.sin(i / 3) * 35_000,
}));

function NetWorthAreaChart({ data }: { data: { snapshot_date: string; net_worth: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="historicalNetWorthGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--success)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="snapshot_date" tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
        <YAxis
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
          tickFormatter={(v) => (v >= 100000 ? `${(v / 100000).toFixed(1)}L` : `${v}`)}
          width={48}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--popover)',
            color: 'var(--popover-foreground)',
            border: '1px solid var(--border)',
            borderRadius: '0.5rem',
            fontSize: 12,
          }}
          formatter={(value) => formatINR(Number(value))}
        />
        <Area type="monotone" dataKey="net_worth" stroke="var(--success)" fill="url(#historicalNetWorthGradient)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function LiveHistoricalChart() {
  const [range, setRange] = useState<NetWorthHistoryRange>('1Y');
  const { data: snapshots, isLoading, error } = useNetWorthSnapshots();

  const filtered = useMemo(() => filterSnapshotsByRange(snapshots ?? [], range), [snapshots, range]);
  const currentNetWorth = filtered.length > 0 ? filtered[filtered.length - 1]!.net_worth : null;
  const firstNetWorth = filtered.length > 0 ? filtered[0]!.net_worth : null;
  const pctChange = currentNetWorth !== null ? calculateSnapshotGrowthPct(currentNetWorth, firstNetWorth) : null;

  return (
    <Card>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Net Worth History</h2>
          <SegmentedControl options={RANGE_OPTIONS} value={range} onChange={setRange} />
        </div>

        {isLoading ? (
          <LoadingState label="Loading history..." />
        ) : error ? (
          <ErrorState error={error} />
        ) : (snapshots ?? []).length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-muted-foreground text-sm">Take a net worth snapshot to start building your history.</p>
            <Link
              href="/reports/net-worth"
              className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-semibold transition-all hover:brightness-95 active:scale-[0.98]"
            >
              Take a Snapshot
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">No snapshots in this range yet.</p>
        ) : (
          <>
            <div className="mb-4 flex items-baseline gap-3">
              <p className="text-2xl font-semibold tabular-nums">{formatINR(currentNetWorth ?? 0)}</p>
              {pctChange !== null && (
                <span
                  className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    pctChange >= 0 ? 'bg-success-subtle text-success' : 'bg-destructive-subtle text-destructive'
                  }`}
                >
                  {pctChange >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                  {Math.abs(pctChange)}%
                </span>
              )}
            </div>
            <NetWorthAreaChart data={filtered} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

function HistoricalChartPlaceholder() {
  return (
    <Card>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Net Worth History</h2>
          <SegmentedControl options={RANGE_OPTIONS} value="1Y" onChange={() => {}} />
        </div>
        <div className="mb-4 flex items-baseline gap-3">
          <p className="text-2xl font-semibold tabular-nums">{formatINR(1_400_000)}</p>
          <span className="bg-success-subtle text-success inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold">
            <ArrowUpRight className="size-3.5" />
            12.5%
          </span>
        </div>
        <NetWorthAreaChart data={PLACEHOLDER_DATA} />
      </CardContent>
    </Card>
  );
}

/** Dropped into the dashboard — a longer-range, filterable view of net worth history than the always-visible NetWorthSnapshotHistory on the Net Worth report, so this one is worth gating. */
export function HistoricalNetWorthChart() {
  const router = useRouter();
  const { hasFeature } = useEntitlements();

  function goToUpgrade() {
    toast.info('Historical net worth charts are a Pro feature — start your free trial to unlock it.');
    router.push('/settings?tab=billing');
  }

  return (
    <ProBlurredPreview
      feature="historicalCharts"
      title="Net Worth History"
      description="See your net worth trend over any time range, from 1 month to all-time."
      onUpgradeClick={goToUpgrade}
    >
      {hasFeature('historicalCharts') ? <LiveHistoricalChart /> : <HistoricalChartPlaceholder />}
    </ProBlurredPreview>
  );
}
