'use client';

import { useMemo, useState } from 'react';
import { calculateInflatedFutureValue, DEFAULT_INFLATION_RATE } from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils';
import { Input } from '@/components/ui/input';

interface GoalInflationHelperProps {
  targetDate: string | undefined;
  onApply: (amount: number) => void;
}

/** Optional "what does this cost today, inflated to the target date" calculator for GoalForm's Target Amount. */
export function GoalInflationHelper({ targetDate, onApply }: GoalInflationHelperProps) {
  const [presentCost, setPresentCost] = useState<number | undefined>(undefined);

  const inflatedFutureValue = useMemo(() => {
    if (!presentCost || presentCost <= 0 || !targetDate) return null;
    return calculateInflatedFutureValue(presentCost, targetDate);
  }, [presentCost, targetDate]);

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">Today&apos;s Cost (optional)</label>
      <Input
        type="number"
        step="0.01"
        placeholder="What this costs today, before inflation"
        value={presentCost ?? ''}
        onChange={(e) => setPresentCost(e.target.valueAsNumber || undefined)}
      />
      <p className="text-muted-foreground mt-1 text-xs">
        Set a target date below, then use this to estimate the inflation-adjusted target amount.
      </p>
      {inflatedFutureValue !== null && (
        <p className="text-muted-foreground mt-2 text-sm">
          ≈ {formatINR(inflatedFutureValue)} by the target date at {DEFAULT_INFLATION_RATE * 100}% inflation
          {' — '}
          <button type="button" className="text-primary hover:underline" onClick={() => onApply(inflatedFutureValue)}>
            Use this
          </button>
        </p>
      )}
    </div>
  );
}
