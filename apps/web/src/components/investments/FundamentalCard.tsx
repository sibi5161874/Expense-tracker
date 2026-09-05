'use client';

import { useStockFundamentals } from '@/hooks/useStockFundamentals';
import { LoadingState, ErrorState } from '@/components/shared/QueryState';
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
export function FundamentalCard({ ticker }: { ticker: string }) {
  const { data, isLoading, error } = useStockFundamentals(ticker);

  return (
    <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold">Fundamentals</h2>

      {isLoading ? (
        <LoadingState label="Loading fundamentals..." />
      ) : error ? (
        <ErrorState error={error} />
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
