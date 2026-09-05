'use client';

import { Coffee } from 'lucide-react';
import { useRecentExpensesForInsight } from '@/hooks/useTransactions';
import { calculateCoffeeSpend, calculateLumpsumFutureValue, COFFEE_INSIGHT_MIN_AMOUNT } from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils/currency';

const ASSUMED_ANNUAL_RETURN_PCT = 12;
const PROJECTION_YEARS = 5;

/** A small "what if you invested this instead" nudge — hidden entirely below COFFEE_INSIGHT_MIN_AMOUNT so it doesn't nag over a single ₹40 chai. */
export function DashboardInsightCard() {
  const { data: expenses, isLoading } = useRecentExpensesForInsight();

  if (isLoading || !expenses) return null;

  const spend = calculateCoffeeSpend(expenses);
  if (spend < COFFEE_INSIGHT_MIN_AMOUNT) return null;

  const futureValue = calculateLumpsumFutureValue(spend, ASSUMED_ANNUAL_RETURN_PCT, PROJECTION_YEARS);

  return (
    <div className="bg-warning-subtle border-warning/30 flex items-start gap-3 rounded-2xl border p-4">
      <Coffee className="text-warning-foreground mt-0.5 size-5 shrink-0" />
      <p className="text-warning-foreground text-sm">
        You spent <span className="font-semibold">{formatINR(spend)}</span> on coffee, tea, and food delivery in the
        last 30 days. If invested at {ASSUMED_ANNUAL_RETURN_PCT}% for {PROJECTION_YEARS} years, this would be{' '}
        <span className="font-semibold">{formatINR(futureValue)}</span>.
      </p>
    </div>
  );
}
