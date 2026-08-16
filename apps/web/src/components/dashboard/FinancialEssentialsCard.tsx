'use client';

import Link from 'next/link';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useFinancialEssentials } from '@/hooks/useFinancialEssentials';
import { formatINR } from '@repo/shared/utils/currency';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge, type BadgeTone } from '@/components/shared/StatusBadge';
import { cn } from '@/lib/utils';

function scoreTone(score: number): BadgeTone {
  if (score >= 8) return 'success';
  if (score >= 5) return 'warning';
  return 'destructive';
}

export function FinancialEssentialsCard() {
  const { items, isLoading, hasProfileData, score } = useFinancialEssentials();

  if (isLoading) return null;

  return (
    <Card>
      <CardContent>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">Financial Essentials Check</h2>
            {score !== null && <StatusBadge tone={scoreTone(score)}>{score}/10</StatusBadge>}
          </div>
          {!hasProfileData && (
            <Link href="/settings?tab=profile" className="text-primary text-xs hover:underline">
              Add income &amp; age for personalized numbers
            </Link>
          )}
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.key} className="flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2">
                {item.adequate ? (
                  <CheckCircle2 className="text-success size-4 shrink-0" />
                ) : (
                  <XCircle className="text-destructive size-4 shrink-0" />
                )}
                <span className="font-medium">{item.label}</span>
              </div>
              <span
                className={cn(
                  'font-mono text-xs tabular-nums',
                  item.adequate ? 'text-success' : 'text-destructive'
                )}
              >
                {formatINR(item.current)} / {formatINR(item.recommended)}
              </span>
            </div>
          ))}
        </div>

        <p className="text-muted-foreground mt-4 text-xs">
          Simplified estimates based on your profile and data — not financial advice.
        </p>
      </CardContent>
    </Card>
  );
}
