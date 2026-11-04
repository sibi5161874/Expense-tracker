'use client';

import { ExternalLink } from 'lucide-react';
import type { SymbolHolding } from '@repo/shared/logic';
import { cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AmountText } from '@/components/shared/AmountText';

const NUMERIC_HEAD = 'text-right text-xs font-medium text-muted-foreground';
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

export function getTradingViewUrl(symbol: string, exchange?: string, assetType?: string): string {
  const cleanSymbol = symbol.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const cleanExchange = (exchange || 'NSE').trim().toUpperCase();

  if (assetType === 'Crypto' || cleanExchange === 'CRYPTO') {
    return `https://in.tradingview.com/symbols/${cleanSymbol}USDT/`;
  }

  if (cleanExchange === 'BSE') {
    return `https://in.tradingview.com/symbols/BSE-${cleanSymbol}/`;
  }
  if (cleanExchange === 'NASDAQ' || cleanExchange === 'NYSE') {
    return `https://in.tradingview.com/symbols/${cleanExchange}-${cleanSymbol}/`;
  }
  // Default to NSE for Indian stocks and ETFs
  return `https://in.tradingview.com/symbols/NSE-${cleanSymbol}/`;
}

export function HoldingsTable({
  holdings,
  animateRows = false,
  foreignPriceCurrencies,
  displayNames,
}: HoldingsTableProps) {
  const handleHoldingClick = (holding: SymbolHolding) => {
    const isTradingViewAsset =
      holding.assetType === 'Stock' ||
      holding.assetType === 'ETF' ||
      holding.assetType === 'Crypto' ||
      (!holding.assetType && holding.exchange !== 'AMFI');

    if (isTradingViewAsset) {
      const url = getTradingViewUrl(holding.symbol, holding.exchange, holding.assetType);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    // For Mutual Fund, Bond, Other: keep on the same screen (no broken routing)
  };

  return (
    <>
      {/* Below `md:`, this 9-column table forces horizontal scrolling — a one-card-per-holding
          stack reads far better on a phone (same data, same click-through to TradingView). */}
      <div className="space-y-2 md:hidden">
        {holdings.map((holding, index) => {
          const isLoss = holding.returnPct < 0 || holding.unrealisedPnl < 0;
          const isTradingViewAsset =
            holding.assetType === 'Stock' ||
            holding.assetType === 'ETF' ||
            holding.assetType === 'Crypto' ||
            (!holding.assetType && holding.exchange !== 'AMFI');

          return (
            <div
              key={`${holding.symbol}-${holding.exchange}`}
              data-testid="holding-card"
              onClick={() => handleHoldingClick(holding)}
              title={
                isTradingViewAsset
                  ? `Open ${holding.symbol} on TradingView`
                  : `${holding.symbol} (${holding.assetType || 'Holding'})`
              }
              className={cn(
                'bg-card active:bg-accent/40 active:scale-[0.99] cursor-pointer min-h-[44px] space-y-2.5 rounded-2xl border border-border/60 p-4 transition-transform motion-reduce:transform-none select-none',
                isLoss && 'border-l-2 border-destructive',
                animateRows && 'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 duration-300'
              )}
              style={animateRows ? { animationDelay: `${index * 20}ms`, animationFillMode: 'both' } : undefined}
            >
              {/* Primary line: ticker + current value */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 truncate font-medium text-foreground">
                  <span className="truncate">{displayNames?.[holding.symbol] || holding.symbol}</span>
                  {isTradingViewAsset && <ExternalLink className="text-muted-foreground/60 size-3 shrink-0" />}
                </div>
                <div className="shrink-0 text-right">
                  <AmountText value={holding.currentValue} colorBySign={false} className="font-semibold text-foreground" />
                </div>
              </div>

              {/* Secondary line: exchange + units held + return % */}
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <div className="truncate">
                  {displayNames?.[holding.symbol] ? `${holding.symbol} · ` : ''}
                  {holding.exchange} · {holding.unitsHeld} units
                  {foreignPriceCurrencies?.[holding.symbol] && ` · ${foreignPriceCurrencies[holding.symbol]}`}
                </div>
                <div className={cn('shrink-0 font-medium font-mono tabular-nums', isLoss ? 'text-destructive' : 'text-success')}>
                  {holding.returnPct >= 0 ? '+' : ''}{(holding.returnPct * 100).toFixed(2)}%
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-border/40" />

              {/* Tertiary row: Avg Cost, Invested, P&L (smaller, muted) */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <div className="text-muted-foreground/80 text-[11px]">Avg Cost</div>
                  <AmountText value={holding.avgBuyPrice} colorBySign={false} className="font-mono text-xs text-muted-foreground" />
                </div>
                <div>
                  <div className="text-muted-foreground/80 text-[11px]">Invested</div>
                  <AmountText value={holding.invested} colorBySign={false} className="font-mono text-xs text-muted-foreground" />
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground/80 text-[11px]">P&L</div>
                  <AmountText value={holding.unrealisedPnl} className="font-mono text-xs font-medium" />
                </div>
              </div>
            </div>
          );
        })}
        {holdings.length === 0 && (
          <div className="bg-card text-muted-foreground rounded-2xl p-8 text-center text-sm">
            No holdings match the selected filters.
          </div>
        )}
      </div>

      <div className="bg-card hidden overflow-hidden rounded-2xl md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-xs font-medium text-muted-foreground">Symbol</TableHead>
              <TableHead className="text-xs font-medium text-muted-foreground">Exchange</TableHead>
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
              const isTradingViewAsset =
                holding.assetType === 'Stock' ||
                holding.assetType === 'ETF' ||
                holding.assetType === 'Crypto' ||
                (!holding.assetType && holding.exchange !== 'AMFI');

              return (
                <TableRow
                  key={`${holding.symbol}-${holding.exchange}`}
                  onClick={() => handleHoldingClick(holding)}
                  title={
                    isTradingViewAsset
                      ? `Open ${holding.symbol} on TradingView`
                      : `${holding.symbol} (${holding.assetType || 'Holding'})`
                  }
                  className={cn(
                    'group hover:bg-accent/40 cursor-pointer transition-colors duration-150',
                    isLoss && 'border-l-2 border-destructive',
                    animateRows && 'motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-1 duration-300'
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
                        <span>{holding.symbol}</span>
                      )}
                      {isTradingViewAsset && (
                        <ExternalLink className="text-muted-foreground/60 size-3 opacity-0 group-hover:opacity-100 hover:text-foreground transition-opacity" />
                      )}
                      {foreignPriceCurrencies?.[holding.symbol] && (
                        <span
                          title={`Live price is quoted in ${foreignPriceCurrencies[holding.symbol]} and is not converted to INR — portfolio totals add it at face value.`}
                          className="bg-warning/10 text-warning rounded px-1 py-0.5 text-[10px] font-semibold"
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
                          className="bg-info-subtle text-info rounded px-1 py-0.5 text-[10px] font-semibold"
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
                          className="bg-warning-subtle text-warning-foreground rounded px-1 py-0.5 text-[10px] font-semibold"
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
    </>
  );
}
