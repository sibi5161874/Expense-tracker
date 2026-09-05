'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useTransactionsForDate } from '@/hooks/useTransactions';
import { formatINR } from '@repo/shared/utils/currency';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { AmountText } from '@/components/shared/AmountText';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';
import { transactionTypeTone } from '@/lib/badgeTones';
import { TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';

export default function TransactionsByDatePage() {
  const params = useParams<{ date: string }>();
  const date = decodeURIComponent(params.date);
  const router = useRouter();
  const { data: transactions, isLoading, error } = useTransactionsForDate(date);

  const summary = useMemo(() => {
    const totalIn = (transactions ?? []).reduce((sum, t) => (t.type === 'Income' ? sum + t.amount : sum), 0);
    const totalOut = (transactions ?? []).reduce((sum, t) => (t.type === 'Expense' ? sum + t.amount : sum), 0);
    return { totalIn, totalOut, net: totalIn - totalOut };
  }, [transactions]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={date}
        description="Transactions on this day."
        action={
          <button
            onClick={() => router.push('/transactions')}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="size-4" />
            Back to Transactions
          </button>
        }
      />

      {isLoading ? (
        <LoadingState label="Loading transactions..." />
      ) : error ? (
        <ErrorState error={error} />
      ) : (transactions ?? []).length === 0 ? (
        <p className="text-muted-foreground text-sm">No transactions on this date.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total In" value={formatINR(summary.totalIn)} icon={TrendingUp} tone="success" />
            <StatCard label="Total Out" value={formatINR(summary.totalOut)} icon={TrendingDown} tone="destructive" />
            <StatCard
              label="Net"
              value={formatINR(summary.net)}
              icon={PiggyBank}
              tone={summary.net >= 0 ? 'success' : 'destructive'}
            />
          </div>

          <div className="bg-card divide-border/60 overflow-hidden rounded-2xl divide-y">
            {(transactions ?? []).map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <StatusBadge tone={transactionTypeTone(t.type)}>{t.type}</StatusBadge>
                  <div>
                    <p className="text-sm font-medium">{t.category?.name ?? 'Uncategorized'}</p>
                    <p className="text-muted-foreground text-xs">
                      {t.from_account?.name ?? ''}
                      {t.notes ? ` — ${t.notes}` : ''}
                    </p>
                  </div>
                </div>
                <AmountText
                  value={t.amount}
                  sign={t.type === 'Income' ? 'positive' : t.type === 'Expense' ? 'negative' : 'neutral'}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
