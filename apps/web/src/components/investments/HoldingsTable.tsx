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
}

export function HoldingsTable({ holdings, animateRows = false }: HoldingsTableProps) {
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
          {holdings.map((holding, index) => (
            <TableRow
              key={`${holding.symbol}-${holding.exchange}`}
              onClick={() => router.push(`/portfolio/${encodeURIComponent(holding.symbol)}`)}
              className={cn(
                'hover:bg-accent/40 cursor-pointer transition-colors duration-150',
                animateRows && 'animate-in fade-in-0 slide-in-from-bottom-1 duration-300'
              )}
              style={animateRows ? { animationDelay: `${index * 20}ms`, animationFillMode: 'both' } : undefined}
            >
              <TableCell className="font-medium">{holding.symbol}</TableCell>
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
                <span className={cn(holding.returnPct >= 0 ? 'text-success' : 'text-destructive')}>
                  {(holding.returnPct * 100).toFixed(2)}%
                </span>
              </TableCell>
            </TableRow>
          ))}
          {holdings.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={9} className="text-muted-foreground h-32 text-center">
                No holdings found. Add your first investment to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
