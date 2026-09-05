'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTransactionsForMonth } from '@/hooks/useTransactions';
import { groupTransactionsByDate, buildCalendarGrid } from '@repo/shared/logic';
import { formatMonth } from '@repo/shared/utils';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';
import { cn } from '@/lib/utils';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function shiftMonth(month: string, delta: number): string {
  const [year, mo] = month.split('-').map(Number) as [number, number];
  const shifted = new Date(Date.UTC(year, mo - 1 + delta, 1));
  return formatMonth(shifted);
}

function monthLabel(month: string): string {
  const [year, mo] = month.split('-').map(Number) as [number, number];
  return new Date(Date.UTC(year, mo - 1, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function TransactionsCalendarView() {
  const router = useRouter();
  const [month, setMonth] = useState(() => formatMonth(new Date()));
  const { data: transactions, isLoading, error } = useTransactionsForMonth(month);

  const cells = useMemo(() => {
    const byDate = groupTransactionsByDate(transactions ?? []);
    return buildCalendarGrid(month, byDate);
  }, [transactions, month]);

  return (
    <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => setMonth((m) => shiftMonth(m, -1))}
          className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="size-4" />
        </button>
        <h2 className="text-sm font-semibold">{monthLabel(month)}</h2>
        <button
          onClick={() => setMonth((m) => shiftMonth(m, 1))}
          className="text-muted-foreground hover:text-foreground rounded-lg p-1.5 transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {isLoading ? (
        <LoadingState label="Loading transactions..." />
      ) : error ? (
        <ErrorState error={error} />
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="text-muted-foreground py-1 text-center text-xs font-semibold uppercase">
                {label}
              </div>
            ))}
            {cells.map((cell, i) =>
              cell.date === null ? (
                <div key={`blank-${i}`} />
              ) : (
                <button
                  key={cell.date}
                  onClick={() => router.push(`/transactions/date/${cell.date}`)}
                  className={cn(
                    'hover:bg-accent/60 flex aspect-square flex-col items-center justify-center gap-1 rounded-xl transition-colors',
                    (cell.hasIncome || cell.hasExpense || cell.hasTransfer) && 'bg-muted/50'
                  )}
                >
                  <span className="text-sm tabular-nums">{Number(cell.date.slice(-2))}</span>
                  <div className="flex gap-0.5">
                    {cell.hasIncome && <span className="bg-success size-1.5 rounded-full" aria-label="Income" />}
                    {cell.hasExpense && <span className="bg-destructive size-1.5 rounded-full" aria-label="Expense" />}
                    {cell.hasTransfer && <span className="bg-info size-1.5 rounded-full" aria-label="Transfer" />}
                  </div>
                </button>
              )
            )}
          </div>

          <div className="text-muted-foreground mt-4 flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="bg-success size-1.5 rounded-full" /> Income
            </span>
            <span className="flex items-center gap-1.5">
              <span className="bg-destructive size-1.5 rounded-full" /> Expense
            </span>
            <span className="flex items-center gap-1.5">
              <span className="bg-info size-1.5 rounded-full" /> Transfer
            </span>
          </div>
        </>
      )}
    </div>
  );
}
