'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { TrendingDown } from 'lucide-react';
import { useEntitlements } from '@/hooks/useEntitlements';
import { calculateUnrealizedLosses, type SymbolHolding } from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils/currency';
import { ProBlurredPreview } from '@/components/shared/ProGate';

const LTCG_OFFSET_LIMIT = 100_000;

// Static, no real holdings — shown blurred to free-tier users.
const PLACEHOLDER_LOSERS: SymbolHolding[] = [
  { symbol: 'STOCKA', exchange: 'NSE', assetType: 'Stock', unitsHeld: 20, avgBuyPrice: 500, currentPrice: 420, currentValue: 8400, invested: 10000, unrealisedPnl: -1600, returnPct: -0.16, lotCount: 1, hasLivePrice: true },
  { symbol: 'STOCKB', exchange: 'NSE', assetType: 'Stock', unitsHeld: 10, avgBuyPrice: 1200, currentPrice: 1080, currentValue: 10800, invested: 12000, unrealisedPnl: -1200, returnPct: -0.1, lotCount: 1, hasLivePrice: true },
];

function LosersList({ losers }: { losers: SymbolHolding[] }) {
  return (
    <ul className="mt-4 space-y-2">
      {losers.map((h) => (
        <li key={`${h.symbol}-${h.exchange}`} className="flex items-center justify-between text-sm">
          <span className="font-medium">{h.symbol}</span>
          <span className="text-destructive font-mono tabular-nums">{formatINR(h.unrealisedPnl)}</span>
        </li>
      ))}
    </ul>
  );
}

function LiveTaxLossCard({ holdings }: { holdings: SymbolHolding[] }) {
  const { totalLoss, topLosers } = calculateUnrealizedLosses(holdings);

  if (totalLoss === 0) {
    return (
      <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <TrendingDown className="text-muted-foreground size-5" />
          <h2 className="text-sm font-semibold">Tax-Loss Harvesting</h2>
        </div>
        <p className="text-muted-foreground mt-2 text-sm">No unrealized losses right now — nothing to harvest.</p>
      </div>
    );
  }

  return (
    <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <TrendingDown className="text-destructive size-5" />
        <h2 className="text-sm font-semibold">Tax-Loss Harvesting</h2>
      </div>
      <p className="text-muted-foreground mt-2 text-sm">
        You have <span className="text-destructive font-semibold">{formatINR(totalLoss)}</span> in unrealized
        losses. You can offset up to {formatINR(LTCG_OFFSET_LIMIT)} of your Capital Gains tax this year!
      </p>
      <LosersList losers={topLosers} />
    </div>
  );
}

function TaxLossHarvestingPlaceholder() {
  const { totalLoss, topLosers } = calculateUnrealizedLosses(PLACEHOLDER_LOSERS);
  return (
    <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <TrendingDown className="text-destructive size-5" />
        <h2 className="text-sm font-semibold">Tax-Loss Harvesting</h2>
      </div>
      <p className="text-muted-foreground mt-2 text-sm">
        You have <span className="text-destructive font-semibold">{formatINR(totalLoss)}</span> in unrealized
        losses. You can offset up to {formatINR(LTCG_OFFSET_LIMIT)} of your Capital Gains tax this year!
      </p>
      <LosersList losers={topLosers} />
    </div>
  );
}

/** Dropped into the Portfolio page — surfaces unrealized losses worth harvesting before the financial year closes. Not tax advice (no cost-inflation indexing, no LTCG/STCG classification by holding period) — a pointer at what to look into, same spirit as the calculator suite's disclaimer. */
export function TaxLossHarvestingCard({ holdings }: { holdings: SymbolHolding[] }) {
  const router = useRouter();
  const { hasFeature } = useEntitlements();

  function goToUpgrade() {
    toast.info('Tax-loss harvesting insights are a Pro feature — start your free trial to unlock it.');
    router.push('/settings?tab=billing');
  }

  return (
    <ProBlurredPreview
      feature="taxLossHarvesting"
      title="Tax-Loss Harvesting"
      description="Find unrealized losses worth harvesting before the financial year closes."
      onUpgradeClick={goToUpgrade}
    >
      {hasFeature('taxLossHarvesting') ? <LiveTaxLossCard holdings={holdings} /> : <TaxLossHarvestingPlaceholder />}
    </ProBlurredPreview>
  );
}
