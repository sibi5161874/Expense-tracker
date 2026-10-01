'use client';

import { format, parseISO } from 'date-fns';
import type { DividendCandidate } from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils/currency';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { Account } from '@repo/shared/types';

const ASSET_TYPES = ['Stock', 'ETF', 'Mutual Fund', 'Crypto', 'Bond', 'Other'] as const;

export interface DividendRowState {
  symbol: string;
  exchange: string;
  linked_account_id: string;
  asset_type: (typeof ASSET_TYPES)[number];
  /** User said this isn't actually a dividend — import it as a normal transaction instead. */
  skipped: boolean;
}

interface DividendReviewListProps {
  candidates: DividendCandidate[];
  rowState: Record<number, DividendRowState>;
  onChange: (row: number, next: Partial<DividendRowState>) => void;
  accounts: Account[] | undefined;
}

/**
 * One row per bank-statement credit that looked like a dividend — see
 * buildBankStatementImportPlan's dividendCandidates. The user fills in the stock symbol (the
 * one thing detection can't know) plus exchange/account/asset type, or toggles "not a
 * dividend" to send that row through as a normal transaction instead.
 */
export function DividendReviewList({ candidates, rowState, onChange, accounts }: DividendReviewListProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Detected Dividends ({candidates.length})</h3>
        <p className="text-muted-foreground text-xs">
          These credits look like dividend payouts — confirm the stock for each, and they&apos;ll go straight
          into your Investment Log instead of Transactions.
        </p>
      </div>

      <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
        {candidates.map((c) => {
          const state = rowState[c.row];
          if (!state) return null;
          return (
            <div key={c.row} className="bg-muted/40 space-y-3 rounded-xl p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(c.date), 'PP')}
                  </p>
                  <p className="truncate text-sm font-medium">{c.description}</p>
                </div>
                <p className="font-mono text-sm font-semibold tabular-nums text-success shrink-0">
                  {formatINR(c.amount)}
                </p>
              </div>

              <label className="flex items-center gap-2 text-xs">
                <Checkbox
                  checked={state.skipped}
                  onCheckedChange={(checked) => onChange(c.row, { skipped: checked === true })}
                />
                Not a dividend — import as a normal transaction instead
              </label>

              {!state.skipped && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Symbol</Label>
                    <Input
                      value={state.symbol}
                      onChange={(e) => onChange(c.row, { symbol: e.target.value.toUpperCase() })}
                      placeholder="e.g., RELIANCE"
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Exchange</Label>
                    <Input
                      value={state.exchange}
                      onChange={(e) => onChange(c.row, { exchange: e.target.value })}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Asset Type</Label>
                    <Select
                      value={state.asset_type}
                      onValueChange={(v) => onChange(c.row, { asset_type: (v ?? 'Stock') as DividendRowState['asset_type'] })}
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSET_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Account</Label>
                    <Select
                      value={state.linked_account_id}
                      onValueChange={(v) => onChange(c.row, { linked_account_id: v ?? '' })}
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts?.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { ASSET_TYPES };
