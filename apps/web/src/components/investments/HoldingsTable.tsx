import type { SymbolHolding } from '@repo/shared/logic';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AmountText } from '@/components/shared/AmountText';

export function HoldingsTable({ holdings }: { holdings: SymbolHolding[] }) {
  return (
    <div className="bg-card border-border/60 overflow-hidden rounded-2xl border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead>Exchange</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Avg Cost</TableHead>
            <TableHead className="text-right">Current Price</TableHead>
            <TableHead className="text-right">Invested</TableHead>
            <TableHead className="text-right">Current Value</TableHead>
            <TableHead className="text-right">P&L</TableHead>
            <TableHead className="text-right">P&L %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {holdings.map((holding) => (
            <TableRow key={`${holding.symbol}-${holding.exchange}`}>
              <TableCell className="font-medium">{holding.symbol}</TableCell>
              <TableCell className="text-muted-foreground">{holding.exchange}</TableCell>
              <TableCell className="text-right tabular-nums">{holding.unitsHeld}</TableCell>
              <TableCell className="text-right">
                <AmountText value={holding.avgBuyPrice} colorBySign={false} />
              </TableCell>
              <TableCell className="text-right">
                <AmountText value={holding.currentPrice} colorBySign={false} />
              </TableCell>
              <TableCell className="text-right">
                <AmountText value={holding.invested} colorBySign={false} />
              </TableCell>
              <TableCell className="text-right">
                <AmountText value={holding.currentValue} colorBySign={false} />
              </TableCell>
              <TableCell className="text-right">
                <AmountText value={holding.unrealisedPnl} />
              </TableCell>
              <TableCell className="text-right">
                <span className={holding.returnPct >= 0 ? 'text-success' : 'text-destructive'}>
                  {(holding.returnPct * 100).toFixed(2)}%
                </span>
              </TableCell>
            </TableRow>
          ))}
          {holdings.length === 0 && (
            <TableRow>
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
