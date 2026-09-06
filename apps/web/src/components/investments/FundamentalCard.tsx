'use client';

import { AlertCircle } from 'lucide-react';
import { useStockFundamentals } from '@/hooks/useStockFundamentals';
import { LoadingState } from '@/components/shared/QueryState';
import { formatINR } from '@repo/shared/utils/currency';

function formatMarketCap(value: number | null): string {
  if (value === null) return '—';
  if (value >= 1e7) return `₹${(value / 1e7).toFixed(0)} Cr`;
  return formatINR(value);
}

function formatPercent(value: number | null): string {
  return value === null ? '—' : `${(value * 100).toFixed(2)}%`;
}

function formatNumber(value: number | null, digits = 2): string {
  return value === null ? '—' : value.toFixed(digits);
}

interface StatProps {
  label: string;
  value: string;
}

function Stat({ label, value }: StatProps) {
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-mono text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

/** A holding's fundamentals — P/E, 52-week range, margins, market cap, beta, dividend yield — shown on its detail page. Gating happens one level up (the page decides whether to mount this at all); if it's mounted, the ticker is assumed entitled. */
export function FundamentalCard({ ticker, exchange }: { ticker: string; exchange: string }) {
  const { data, isLoading, error } = useStockFundamentals(ticker, exchange);

  return (
    <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold">Fundamentals</h2>

      {isLoading ? (
        <LoadingState label="Loading fundamentals..." />
      ) : error ? (
        // Not the generic parseSupabaseError/ErrorState pipeline — /api/stock/fundamentals
        // already crafts a specific, safe, user-facing message for every failure mode (no
        // data found, Pro-gate, upstream error), and useStockFundamentals throws it verbatim.
        // Routing it through parseSupabaseError would discard that specific message and
        // always show the same generic "Couldn't complete that action" text instead, since a
        // plain Error (no Postgrest `.code`) falls through to that pipeline's default case.
        <div className="border-destructive/30 bg-destructive-subtle flex h-32 flex-col items-center justify-center gap-2 rounded-xl border text-center">
          <AlertCircle className="text-destructive size-5" />
          <p className="text-destructive text-sm font-medium">{error.message}</p>
        </div>
      ) : !data ? null : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Stat label="Trailing P/E" value={formatNumber(data.trailingPE)} />
          <Stat label="Forward P/E" value={formatNumber(data.forwardPE)} />
          <Stat label="52W High" value={data.fiftyTwoWeekHigh === null ? '—' : formatINR(data.fiftyTwoWeekHigh)} />
          <Stat label="52W Low" value={data.fiftyTwoWeekLow === null ? '—' : formatINR(data.fiftyTwoWeekLow)} />
          <Stat label="Profit Margin" value={formatPercent(data.profitMargins)} />
          <Stat label="Market Cap" value={formatMarketCap(data.marketCap)} />
          <Stat label="Beta" value={formatNumber(data.beta)} />
          <Stat label="Dividend Yield" value={formatPercent(data.trailingAnnualDividendYield)} />
        </div>
      )}
    </div>
  );
}
