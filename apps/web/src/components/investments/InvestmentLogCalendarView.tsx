'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAllInvestmentLog } from '@/hooks/useInvestmentLog';
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

export function InvestmentLogCalendarView() {
  const [month, setMonth] = useState(() => formatMonth(new Date()));
  const { data: allRows, isLoading, error } = useAllInvestmentLog();

  const rows = useMemo(() => (allRows ?? []).filter((r) => r.date.startsWith(month)), [allRows, month]);

  const byDate = useMemo(() => {
    const map = new Map<string, { hasBuy: boolean; hasSell: boolean; hasOther: boolean }>();
    for (const r of rows) {
      const entry = map.get(r.date) ?? { hasBuy: false, hasSell: false, hasOther: false };
      if (r.action === 'BUY') entry.hasBuy = true;
      else if (r.action === 'SELL') entry.hasSell = true;
      else entry.hasOther = true;
      map.set(r.date, entry);
    }
    return map;
  }, [rows]);

  const cells = useMemo(() => buildGrid(month), [month]);

  const summary = useMemo(() => {
    const invested = rows.filter((r) => r.action === 'BUY').reduce((sum, r) => sum + r.quantity * r.price, 0);
    const divested = rows.filter((r) => r.action === 'SELL').reduce((sum, r) => sum + r.quantity * r.price, 0);
    return { invested, divested, count: rows.length };
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
          <LoadingState label="Loading investment log..." />
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
                      {flags?.hasBuy && <span className="bg-success size-1 rounded-full" aria-label="Buy" />}
                      {flags?.hasSell && <span className="bg-destructive size-1 rounded-full" aria-label="Sell" />}
                      {flags?.hasOther && <span className="bg-info size-1 rounded-full" aria-label="Other" />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-muted-foreground mt-3 flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="bg-success size-1.5 rounded-full" /> Buy
              </span>
              <span className="flex items-center gap-1.5">
                <span className="bg-destructive size-1.5 rounded-full" /> Sell
              </span>
              <span className="flex items-center gap-1.5">
                <span className="bg-info size-1.5 rounded-full" /> Other
              </span>
            </div>
          </>
        )}
      </div>

      {!isLoading && !error && (
        <div className="bg-card border-border/60 flex-1 rounded-2xl border p-5 shadow-sm">
          <h3 className="text-sm font-semibold">{monthLabel(month)} summary</h3>
          <p className="text-muted-foreground text-xs">
            {summary.count} event{summary.count === 1 ? '' : 's'} this month
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-muted/60 rounded-2xl p-3">
              <p className="text-muted-foreground text-xs">Invested (Buy)</p>
              <p className="text-success mt-1 font-mono text-lg font-semibold tabular-nums">
                {formatINR(summary.invested)}
              </p>
            </div>
            <div className="bg-muted/60 rounded-2xl p-3">
              <p className="text-muted-foreground text-xs">Divested (Sell)</p>
              <p className="text-destructive mt-1 font-mono text-lg font-semibold tabular-nums">
                {formatINR(summary.divested)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
