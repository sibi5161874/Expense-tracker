import { formatINR } from '@repo/shared/utils/currency';
import { cn } from '@/lib/utils';
import { CountUpAmount } from '@/components/shared/CountUpAmount';
import type { NetWorthBreakdown } from '@repo/shared/logic';

interface NetWorthHeroProps {
  breakdown: NetWorthBreakdown;
  className?: string;
  fxRatesStale?: boolean;
  fxRatesFetchedAt?: string;
}

const CHIPS = [
  { key: 'cashAndBankTotal', label: 'Cash & Bank' } as const,
  { key: 'portfolioValue', label: 'Investments' } as const,
  { key: 'liabilitiesTotal', label: 'Liabilities', negate: true } as const,
];

/**
 * Deliberately no Card/border/background — this is the one number on the page meant to
 * register before any label is read, not "one more box" in the grid.
 */
export function NetWorthHero({ breakdown, className, fxRatesStale, fxRatesFetchedAt }: NetWorthHeroProps) {
  const positive = breakdown.netWorth >= 0;

  return (
    <div className={cn('flex flex-col gap-6 py-6', className)}>
      <div>
        <p className="text-muted-foreground text-sm tracking-wide uppercase">Net Worth</p>
        <CountUpAmount
          value={breakdown.netWorth}
          className={cn('text-hero mt-2 block', positive ? 'text-success' : 'text-destructive')}
        />
        {fxRatesStale && fxRatesFetchedAt && (
          <p className="text-muted-foreground mt-1 text-xs">
            Exchange rates as of{' '}
            {new Date(fxRatesFetchedAt).toLocaleString('en-IN', {
              day: 'numeric',
              month: 'short',
              hour: 'numeric',
              minute: '2-digit',
            })}{' '}
            — the live rate provider is unreachable, so foreign-currency totals use the last successful fetch.
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-6">
        {CHIPS.map(({ key, label, negate }) => {
          const raw = breakdown[key as 'cashAndBankTotal' | 'portfolioValue' | 'liabilitiesTotal'];
          const value = negate ? -raw : raw;
          return (
            <div key={key} className="flex flex-col gap-1">
              <span className="text-muted-foreground text-xs">{label}</span>
              <span
                className={cn(
                  'font-mono text-sm font-medium tabular-nums',
                  negate ? 'text-destructive' : 'text-foreground'
                )}
              >
                {formatINR(value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
