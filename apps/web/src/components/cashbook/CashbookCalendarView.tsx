'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAllCashbook } from '@/hooks/useCashbook';
import { formatMonth } from '@repo/shared/utils';
import { formatINR } from '@repo/shared/utils/currency';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';
import { cn } from '@/lib/utils';

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function shiftMonth(month: string, delta: number): string {
  const [year, mo] = month.split('-').map(Number) as [number, number];
  const shifted = new Date(Date.UTC(year, mo - 1 + delta, 1));
  return formatMonth(shifted);
}

function monthLabel(month: string): string {
  const [year, mo] = month.split('-').map(Number) as [number, number];
  return new Date(Date.UTC(year, mo - 1, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** Mon-first 6-week grid for the given month — `null` cells pad the leading/trailing days. */
function buildGrid(month: string): (string | null)[] {
  const [year, mo] = month.split('-').map(Number) as [number, number];
  const firstOfMonth = new Date(Date.UTC(year, mo - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, mo, 0)).getUTCDate();
  const leadingBlanks = (firstOfMonth.getUTCDay() + 6) % 7; // convert Sun=0 to Mon-first
  const cells: (string | null)[] = Array(leadingBlanks).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${month}-${String(d).padStart(2, '0')}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function CashbookCalendarView() {
  const [month, setMonth] = useState(() => formatMonth(new Date()));
  const { data: allRows, isLoading, error } = useAllCashbook();

  const rows = useMemo(() => (allRows ?? []).filter((r) => r.date.startsWith(month)), [allRows, month]);

  const byDate = useMemo(() => {
    const map = new Map<string, { hasGave: boolean; hasReceived: boolean }>();
    for (const r of rows) {
      const entry = map.get(r.date) ?? { hasGave: false, hasReceived: false };
      if (r.flow === 'Gave') entry.hasGave = true;
      else entry.hasReceived = true;
      map.set(r.date, entry);
    }
    return map;
  }, [rows]);

  const cells = useMemo(() => buildGrid(month), [month]);

  const summary = useMemo(() => {
    const gave = rows.filter((r) => r.flow === 'Gave').reduce((sum, r) => sum + r.amount, 0);
    const received = rows.filter((r) => r.flow === 'Received').reduce((sum, r) => sum + r.amount, 0);
    return { gave, received, net: received - gave, count: rows.length };
  }, [rows]);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <div className="bg-card border-border/60 w-full shrink-0 rounded-2xl border p-4 shadow-sm lg:w-72">
        <div className="mb-3 flex items-center justify-between">
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
          <LoadingState label="Loading cashbook..." />
        ) : error ? (
          <ErrorState error={error} />
        ) : (
          <>
            <div className="grid grid-cols-7 gap-0.5">
              {WEEKDAY_LABELS.map((label, i) => (
                <div key={i} className="text-muted-foreground py-1 text-center text-[0.65rem] font-semibold uppercase">
                  {label}
                </div>
              ))}
              {cells.map((date, i) => {
                if (date === null) return <div key={`blank-${i}`} />;
                const flags = byDate.get(date);
                return (
                  <div
                    key={date}
                    className={cn(
                      'mx-auto flex size-8 flex-col items-center justify-center gap-0.5 rounded-full transition-colors',
                      flags && 'bg-muted/50'
                    )}
                  >
                    <span className="text-xs tabular-nums">{Number(date.slice(-2))}</span>
                    <div className="flex gap-0.5">
                      {flags?.hasGave && <span className="bg-destructive size-1 rounded-full" aria-label="Gave" />}
                      {flags?.hasReceived && <span className="bg-success size-1 rounded-full" aria-label="Received" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-muted-foreground mt-3 flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="bg-destructive size-1.5 rounded-full" /> Gave
              </span>
              <span className="flex items-center gap-1.5">
                <span className="bg-success size-1.5 rounded-full" /> Received
              </span>
            </div>
          </>
        )}
      </div>

      {!isLoading && !error && (
        <div className="bg-card border-border/60 flex-1 rounded-2xl border p-5 shadow-sm">
          <h3 className="text-sm font-semibold">{monthLabel(month)} summary</h3>
          <p className="text-muted-foreground text-xs">
            {summary.count} entr{summary.count === 1 ? 'y' : 'ies'} this month
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="bg-muted/60 rounded-2xl p-3">
              <p className="text-muted-foreground text-xs">Gave</p>
              <p className="text-destructive mt-1 font-mono text-lg font-semibold tabular-nums">
                {formatINR(summary.gave)}
              </p>
            </div>
            <div className="bg-muted/60 rounded-2xl p-3">
              <p className="text-muted-foreground text-xs">Received</p>
              <p className="text-success mt-1 font-mono text-lg font-semibold tabular-nums">
                {formatINR(summary.received)}
              </p>
            </div>
            <div className="bg-muted/60 rounded-2xl p-3">
              <p className="text-muted-foreground text-xs">Net</p>
              <p className="mt-1 font-mono text-lg font-semibold tabular-nums">{formatINR(summary.net)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
