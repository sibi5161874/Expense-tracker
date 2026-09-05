'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { PiggyBank } from 'lucide-react';
import { useEntitlements } from '@/hooks/useEntitlements';
import { usePassiveIncome } from '@/hooks/usePassiveIncome';
import { formatINR } from '@repo/shared/utils/currency';
import { ProBlurredPreview } from '@/components/shared/ProGate';
import { Card, CardContent } from '@/components/ui/card';
import type { SymbolHolding } from '@repo/shared/logic';

function LivePassiveIncome({ holdings }: { holdings: SymbolHolding[] }) {
  const { annualIncome, monthlyIncome, isLoading } = usePassiveIncome(holdings);

  return (
    <Card>
      <CardContent>
        <div className="mb-1 flex items-center gap-2">
          <PiggyBank className="text-success size-4" />
          <h2 className="text-sm font-semibold">Passive Income</h2>
        </div>
        {isLoading ? (
          <p className="text-muted-foreground py-2 text-sm">Calculating from your holdings&apos; dividend yield...</p>
        ) : (
          <>
            <p className="text-2xl font-semibold tabular-nums">
              {formatINR(annualIncome)}
              <span className="text-muted-foreground ml-1 text-sm font-normal">/ year</span>
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              You earn {formatINR(annualIncome)} per year in passive income — about {formatINR(monthlyIncome)} per month.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/** Static, no network — shown blurred to free-tier users instead of mounting the real fetch (which the server would 403 anyway). */
function PassiveIncomePlaceholder() {
  return (
    <Card>
      <CardContent>
        <div className="mb-1 flex items-center gap-2">
          <PiggyBank className="text-success size-4" />
          <h2 className="text-sm font-semibold">Passive Income</h2>
        </div>
        <p className="text-2xl font-semibold tabular-nums">
          {formatINR(42_000)}
          <span className="text-muted-foreground ml-1 text-sm font-normal">/ year</span>
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          You earn {formatINR(42_000)} per year in passive income — about {formatINR(3_500)} per month.
        </p>
      </CardContent>
    </Card>
  );
}

/** Dropped into the dashboard — projects annual/monthly dividend income across every holding from its live trailing dividend yield. Refreshes automatically on every app load (React Query's default refetch-on-mount) and again after 6 hours, matching the fundamentals endpoint's own server-side cache window — there's no separate cron, since a client-side interval can't run when the app isn't open anyway. */
export function PassiveIncomeWidget({ holdings }: { holdings: SymbolHolding[] }) {
  const router = useRouter();
  const { hasFeature } = useEntitlements();

  function goToUpgrade() {
    toast.info('Passive income tracking is a Pro feature — start your free trial to unlock it.');
    router.push('/settings?tab=billing');
  }

  return (
    <ProBlurredPreview
      feature="livePriceRefresh"
      title="Passive Income Tracker"
      description="See your projected annual dividend income across all holdings."
      onUpgradeClick={goToUpgrade}
    >
      {hasFeature('livePriceRefresh') ? <LivePassiveIncome holdings={holdings} /> : <PassiveIncomePlaceholder />}
    </ProBlurredPreview>
  );
}
