'use client';

import { useMemo } from 'react';
import type { SymbolHolding } from '@repo/shared/logic';
import { segmentHoldingsByAssetClass } from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils/currency';
import { cn } from '@/lib/utils';

interface AssetClassBreakdownCardProps {
  holdings: SymbolHolding[];
}

export function AssetClassBreakdownCard({ holdings }: AssetClassBreakdownCardProps) {
  const segments = useMemo(() => segmentHoldingsByAssetClass(holdings), [holdings]);

  const totalInvested = useMemo(
    () => segments.reduce((sum, s) => sum + s.totalInvested, 0),
    [segments]
  );
  const totalCurrent = useMemo(
    () => segments.reduce((sum, s) => sum + s.totalCurrent, 0),
    [segments]
  );
  const totalPnl = totalCurrent - totalInvested;
  const totalReturnPct = totalInvested > 0 ? (totalPnl / totalInvested) * 100 : 0;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
      <h2 className="text-sm font-semibold">Asset Class Breakdown</h2>

      {segments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Add holdings to see asset-class performance
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="py-2 pr-3">Asset Class</th>
                <th className="py-2 px-3 text-right">Invested</th>
                <th className="py-2 px-3 text-right">Current Value</th>
                <th className="py-2 pl-3 text-right">Return %</th>
              </tr>
            </thead>
            <tbody>
              {segments.map((seg) => {
                const returnPctValue = seg.avgReturnPct * 100;
                return (
                  <tr
                    key={seg.assetType}
                    className="border-b border-border/50 text-sm last:border-0"
                  >
                    <td className="py-2.5 pr-3 font-medium text-sm text-foreground">
                      {seg.assetType}
                      <span className="text-xs text-muted-foreground ml-1.5">
                        ({seg.holdings.length})
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-sm text-right text-muted-foreground">
                      {formatINR(seg.totalInvested)}
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-sm text-right font-medium text-foreground">
                      {formatINR(seg.totalCurrent)}
                    </td>
                    <td
                      className={cn(
                        'py-2.5 pl-3 font-mono tabular-nums text-sm text-right font-semibold',
                        returnPctValue >= 0 ? 'text-success' : 'text-destructive'
                      )}
                    >
                      {returnPctValue.toFixed(2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border font-semibold">
                <td className="pt-3 pr-3 text-sm uppercase tracking-wide">Total</td>
                <td className="pt-3 px-3 font-mono tabular-nums text-sm text-right text-muted-foreground">
                  {formatINR(totalInvested)}
                </td>
                <td className="pt-3 px-3 font-mono tabular-nums text-sm text-right text-foreground">
                  {formatINR(totalCurrent)}
                </td>
                <td
                  className={cn(
                    'pt-3 pl-3 font-mono tabular-nums text-sm text-right font-semibold',
                    totalReturnPct >= 0 ? 'text-success' : 'text-destructive'
                  )}
                >
                  {totalReturnPct.toFixed(2)}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
