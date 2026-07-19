'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useBudgetLimits } from '@/hooks/useBudgetLimits';
import { useMonthlyOverview } from '@/hooks/useTransactions';
import { calculateBudgetStatus, type BudgetStatus } from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils/currency';
import { formatMonth } from '@repo/shared/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { budgetStatusTone } from '@/lib/badgeTones';

const INDICATOR_CLASSES: Record<BudgetStatus, string> = {
  ok: 'bg-success',
  warning: 'bg-warning',
  over: 'bg-destructive',
};

export function BudgetHealthCard() {
  const currentMonth = formatMonth(new Date());
  const { data: budgetLimits } = useBudgetLimits();
  const { categoryBreakdown } = useMonthlyOverview(currentMonth);

  const rows = useMemo(() => {
    if (!budgetLimits) return [];
    return budgetLimits
      .map((limit) => {
        const actual = categoryBreakdown.find((c) => c.name === limit.category?.name)?.value ?? 0;
        return {
          category: limit.category?.name ?? 'Unknown',
          limit: limit.monthly_limit,
          actual,
          status: calculateBudgetStatus(actual, limit.monthly_limit),
          pct: limit.monthly_limit > 0 ? Math.min((actual / limit.monthly_limit) * 100, 100) : 0,
        };
      })
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 4);
  }, [budgetLimits, categoryBreakdown]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget health</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No budget limits set yet.{' '}
            <Link href="/settings" className="text-primary hover:underline">
              Add some in Settings
            </Link>{' '}
            to track spend against a monthly cap.
          </p>
        ) : (
          <div className="space-y-4">
            {rows.map((row) => (
              <div key={row.category}>
                <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                  <span className="truncate font-medium">{row.category}</span>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-muted-foreground font-mono text-xs tabular-nums">
                      {formatINR(row.actual)} / {formatINR(row.limit)}
                    </span>
                    <StatusBadge tone={budgetStatusTone(row.status)}>{row.status}</StatusBadge>
                  </div>
                </div>
                <Progress value={row.pct} indicatorClassName={INDICATOR_CLASSES[row.status]} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
