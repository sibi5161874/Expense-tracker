'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ChevronDown } from 'lucide-react';
import type { SymbolHolding } from '@repo/shared/logic';
import { estimateTaxSavings } from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils/currency';
import { cn } from '@/lib/utils';

interface LossMakingHoldingsCardProps {
  holdings: SymbolHolding[];
}

const MAX_VISIBLE_ROWS = 8;

export function LossMakingHoldingsCard({ holdings }: LossMakingHoldingsCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const losingHoldings = useMemo(() => {
    return holdings
      .filter((h) => h.unrealisedPnl < 0 || h.returnPct < 0)
      .sort((a, b) => a.returnPct - b.returnPct); // worst first
  }, [holdings]);

  const totalUnrealizedLoss = useMemo(() => {
    return losingHoldings.reduce((sum, h) => sum + Math.abs(h.unrealisedPnl), 0);
  }, [losingHoldings]);

  const estimatedTaxSavings = useMemo(() => {
    return estimateTaxSavings(totalUnrealizedLoss);
  }, [totalUnrealizedLoss]);

  if (losingHoldings.length === 0) {
    return null;
  }

  const visibleHoldings = losingHoldings.slice(0, MAX_VISIBLE_ROWS);
  const overflowCount = losingHoldings.length - MAX_VISIBLE_ROWS;

  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 space-y-3">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between text-left focus:outline-none"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-destructive shrink-0" />
          <h2 className="text-sm font-semibold text-destructive">
            Loss-Making Holdings ({losingHoldings.length})
          </h2>
        </div>
        <ChevronDown
          className={cn(
            'size-4 text-destructive transition-transform duration-200',
            isExpanded && 'rotate-180'
          )}
        />
      </button>

      {/* Collapsible Content */}
      {isExpanded && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-destructive/20 text-xs font-semibold uppercase tracking-wide text-destructive/80">
                  <th className="py-2 pr-3">Symbol</th>
                  <th className="py-2 px-3">Asset</th>
                  <th className="py-2 px-3 text-right">Invested</th>
                  <th className="py-2 px-3 text-right">Current</th>
                  <th className="py-2 pl-3 text-right">P&L %</th>
                </tr>
              </thead>
              <tbody>
                {visibleHoldings.map((h) => (
                  <tr key={`${h.symbol}-${h.exchange}`} className="border-b border-destructive/10 text-sm">
                    <td className="py-2 pr-3 font-medium text-foreground">{h.symbol}</td>
                    <td className="py-2 px-3 text-muted-foreground">{h.assetType || 'Stock'}</td>
                    <td className="py-2 px-3 font-mono tabular-nums text-right text-muted-foreground">
                      {formatINR(h.invested)}
                    </td>
                    <td className="py-2 px-3 font-mono tabular-nums text-right text-muted-foreground">
                      {formatINR(h.currentValue)}
                    </td>
                    <td className="py-2 pl-3 font-mono tabular-nums text-right font-semibold text-destructive">
                      {(h.returnPct * 100).toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {overflowCount > 0 && (
            <p className="text-xs text-destructive/80 font-medium pt-1">
              + {overflowCount} more — view full list below
            </p>
          )}

          {/* Footer */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 pt-3 border-t border-destructive/20">
            <div>
              <span className="text-xs text-muted-foreground block">Total Unrealized Loss:</span>
              <span className="font-mono tabular-nums text-destructive font-semibold text-base">
                {formatINR(totalUnrealizedLoss)}
              </span>
            </div>

            <div className="sm:text-right">
              <span
                className="text-xs text-muted-foreground block"
                title="Estimate assumes 15% STCG offset. Consult a CA for your actual liability."
              >
                Estimated Tax Savings:
              </span>
              <span
                className="font-mono tabular-nums text-success font-semibold text-base block"
                title="Estimate assumes 15% STCG offset. Consult a CA for your actual liability."
              >
                {formatINR(estimatedTaxSavings)}
              </span>
              <Link
                href="/reports/portfolio-summary"
                className="text-xs text-primary hover:underline inline-block mt-0.5"
              >
                View Tax-Loss Harvesting Report →
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
