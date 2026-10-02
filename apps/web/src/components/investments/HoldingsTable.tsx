'use client';

import { useRouter } from 'next/navigation';
import type { SymbolHolding } from '@repo/shared/logic';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AmountText } from '@/components/shared/AmountText';

const NUMERIC_HEAD = 'text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase';
const NUMERIC_CELL = 'text-right font-mono tabular-nums';

interface HoldingsTableProps {
  holdings: SymbolHolding[];
  /** True only for the first successful load — never on refetch, so rows don't re-stagger. */
  animateRows?: boolean;
  /** symbol -> currency its live price is quoted in (only non-INR ones are worth passing). */
  foreignPriceCurrencies?: Record<string, string>;
  /** symbol -> real name (mutual funds, whose symbol is just an AMFI scheme code). */
  displayNames?: Record<string, string>;
}

export function HoldingsTable({
  holdings,
  animateRows = false,
  foreignPriceCurrencies,
  displayNames,
}: HoldingsTableProps) {
  const router = useRouter();

  return (
    <div className="bg-card overflow-hidden rounded-2xl">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Symbol
            </TableHead>
            <TableHead className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Exchange
            </TableHead>
            <TableHead className={NUMERIC_HEAD}>Quantity</TableHead>
            <TableHead className={NUMERIC_HEAD}>Avg Cost</TableHead>
            <TableHead className={NUMERIC_HEAD}>Current Price</TableHead>
            <TableHead className={NUMERIC_HEAD}>Invested</TableHead>
            <TableHead className={NUMERIC_HEAD}>Current Value</TableHead>
            <TableHead className={NUMERIC_HEAD}>P&L</TableHead>
            <TableHead className={NUMERIC_HEAD}>P&L %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="[&_tr:nth-child(even)]:bg-muted/40">
          {holdings.map((holding, index) => {
            const isLoss = holding.returnPct < 0 || holding.unrealisedPnl < 0;

            return (
              <TableRow
                key={`${holding.symbol}-${holding.exchange}`}
                onClick={() => router.push(`/portfolio/${encodeURIComponent(holding.symbol)}`)}
                className={cn(
                  'hover:bg-accent/40 cursor-pointer transition-colors duration-150',
                  isLoss && 'border-l-2 border-destructive',
                  animateRows && 'animate-in fade-in-0 slide-in-from-bottom-1 duration-300'
                )}
                style={animateRows ? { animationDelay: `${index * 20}ms`, animationFillMode: 'both' } : undefined}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-1.5">
                    {displayNames?.[holding.symbol] ? (
                      <span>
                        {displayNames[holding.symbol]}
                        <span className="text-muted-foreground block text-xs font-normal">{holding.symbol}</span>
                      </span>
                    ) : (
                      holding.symbol
                    )}
                    {foreignPriceCurrencies?.[holding.symbol] && (
                      <span
                        title={`Live price is quoted in ${foreignPriceCurrencies[holding.symbol]} and is not converted to INR — portfolio totals add it at face value.`}
                        className="bg-warning/10 text-warning rounded px-1 py-0.5 text-[10px] font-semibold uppercase"
                      >
                        {foreignPriceCurrencies[holding.symbol]}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{holding.exchange}</TableCell>
                <TableCell className={NUMERIC_CELL}>{holding.unitsHeld}</TableCell>
                <TableCell className={NUMERIC_CELL}>
                  <div className="flex items-center justify-end gap-1.5">
                    <AmountText value={holding.avgBuyPrice} colorBySign={false} />
                    {holding.lotCount > 1 && (
                      <span
                        title={`Weighted average across ${holding.lotCount} purchases`}
                        className="bg-info-subtle text-info rounded px-1 py-0.5 text-[10px] font-semibold uppercase"
                      >
                        WAC
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className={NUMERIC_CELL}>
                  <div className="flex items-center justify-end gap-1.5">
                    <AmountText value={holding.currentPrice} colorBySign={false} />
                    {!holding.hasLivePrice && (
                      <span
                        title="No live price has ever been fetched for this symbol — showing the most recent trade price instead."
                        className="bg-warning-subtle text-warning-foreground rounded px-1 py-0.5 text-[10px] font-semibold uppercase"
                      >
                        Est.
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className={NUMERIC_CELL}>
                  <AmountText value={holding.invested} colorBySign={false} />
                </TableCell>
                <TableCell className={NUMERIC_CELL}>
                  <AmountText value={holding.currentValue} colorBySign={false} />
                </TableCell>
                <TableCell className={NUMERIC_CELL}>
                  <AmountText value={holding.unrealisedPnl} />
                </TableCell>
                <TableCell className={NUMERIC_CELL}>
                  <span className={cn(isLoss ? 'text-destructive font-semibold' : 'text-success font-semibold')}>
                    {(holding.returnPct * 100).toFixed(2)}%
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
          {holdings.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={9} className="text-muted-foreground h-32 text-center">
                No holdings match the selected filters.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
