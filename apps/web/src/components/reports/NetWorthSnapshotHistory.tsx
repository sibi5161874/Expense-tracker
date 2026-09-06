'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Camera, Trash2 } from 'lucide-react';
import { useNetWorthSnapshots } from '@/hooks/useNetWorthSnapshots';
import { useEntitlements } from '@/hooks/useEntitlements';
import {
  buildSnapshotFromBreakdown,
  calculateSnapshotGrowthPct,
  canAddSnapshotThisMonth,
  type NetWorthBreakdown,
} from '@repo/shared/logic';
import { formatMonth } from '@repo/shared/utils';
import { formatINR } from '@repo/shared/utils/currency';
import { Button } from '@/components/ui/button';
import { ProLockedButton } from '@/components/shared/ProGate';
import { DataTable, type DataTableColumn } from '@/components/shared/DataTable';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';

interface NetWorthSnapshotHistoryProps {
  currentBreakdown: NetWorthBreakdown;
}

/** "Take Snapshot" freezes today's live NetWorthBreakdown; history shows growth month-over-month (FinBoom parity). */
export function NetWorthSnapshotHistory({ currentBreakdown }: NetWorthSnapshotHistoryProps) {
  const router = useRouter();
  const { data: snapshots, takeSnapshot, deleteSnapshot, isTakingSnapshot, isDeleting } = useNetWorthSnapshots();
  const { tier } = useEntitlements();
  const [error, setError] = useState<string | null>(null);
  const { requestDelete, dialog } = useConfirmDelete(deleteSnapshot, 'Delete snapshot?', "This can't be undone.");

  const rows = useMemo(() => {
    const sorted = snapshots ?? [];
    return sorted.map((snap, i) => ({
      ...snap,
      growthPct: calculateSnapshotGrowthPct(snap.net_worth, sorted[i - 1]?.net_worth ?? null),
    }));
  }, [snapshots]);

  const currentMonthPrefix = formatMonth(new Date());
  const snapshotsThisMonth = (snapshots ?? []).filter((s) => s.snapshot_date.startsWith(currentMonthPrefix)).length;
  const canTakeSnapshot = canAddSnapshotThisMonth(snapshotsThisMonth, tier);

  function goToUpgrade() {
    toast.info("You've used this month's free snapshots. Start your Pro trial for unlimited snapshots.");
    router.push('/settings?tab=billing');
  }

  async function handleTakeSnapshot() {
    setError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      await takeSnapshot(buildSnapshotFromBreakdown(currentBreakdown, today));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save snapshot');
    }
  }

  const columns: DataTableColumn<(typeof rows)[number]>[] = [
    { id: 'date', header: 'Date', cell: (r) => r.snapshot_date, sortValue: (r) => r.snapshot_date },
    {
      id: 'netWorth',
      header: 'Net Worth',
      className: 'text-right',
      cell: (r) => formatINR(r.net_worth),
      sortValue: (r) => r.net_worth,
    },
    {
      id: 'growth',
      header: 'Growth',
      className: 'text-right',
      cell: (r) =>
        r.growthPct === null ? (
          '—'
        ) : (
          <span className={r.growthPct >= 0 ? 'text-success' : 'text-destructive'}>
            {r.growthPct >= 0 ? '+' : ''}
            {r.growthPct}%
          </span>
        ),
    },
  ];

  return (
    <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Net Worth Over Time</h2>
        {canTakeSnapshot ? (
          <Button size="sm" variant="outline" onClick={handleTakeSnapshot} disabled={isTakingSnapshot}>
            <Camera className="size-4" />
            {isTakingSnapshot ? 'Saving...' : 'Take Snapshot'}
          </Button>
        ) : (
          <ProLockedButton label="Take Snapshot" icon={<Camera className="size-4" />} onUpgradeClick={goToUpgrade} />
        )}
      </div>

      {error && <p className="text-destructive mb-3 text-sm">{error}</p>}

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No snapshots yet. Take one to start tracking net worth growth over time.
        </p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={rows}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="snapshot_date"
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
              />
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
                formatter={(value) => formatINR(Number(value))}
              />
              <Line type="monotone" dataKey="net_worth" stroke="var(--success)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-4">
            <DataTable
              data={rows}
              columns={columns}
              getRowId={(r) => r.id}
              rowActions={(r) => (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive size-8"
                  onClick={() => requestDelete(r.id)}
                  disabled={isDeleting}
                >
                  <Trash2 className="size-4" />
                </Button>
              )}
              emptyMessage="No snapshots."
            />
          </div>
        </>
      )}
      {dialog}
    </div>
  );
}
