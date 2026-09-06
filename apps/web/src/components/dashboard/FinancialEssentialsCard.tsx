'use client';

import Link from 'next/link';
import { CheckCircle2, XCircle, Shield, HeartPulse, PiggyBank, type LucideIcon } from 'lucide-react';
import { useFinancialEssentials } from '@/hooks/useFinancialEssentials';
import { formatINR } from '@repo/shared/utils/currency';
import type { FinancialEssentialItem } from '@repo/shared/logic';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge, type BadgeTone } from '@/components/shared/StatusBadge';
import { cn } from '@/lib/utils';

function scoreTone(score: number): BadgeTone {
  if (score >= 8) return 'success';
  if (score >= 5) return 'warning';
  return 'destructive';
}

const ITEM_ICONS: Record<FinancialEssentialItem['key'], LucideIcon> = {
  term: Shield,
  health: HeartPulse,
  emergencyFund: PiggyBank,
};

function EssentialItemRow({ item }: { item: FinancialEssentialItem }) {
  const Icon = ITEM_ICONS[item.key];
  const percent = item.recommended > 0 ? Math.min(100, Math.round((item.current / item.recommended) * 100)) : 100;

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-full',
              item.adequate ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
            )}
          >
            <Icon className="size-4" />
          </div>
          <span className="text-sm font-medium">{item.label}</span>
        </div>
        {item.adequate ? (
          <CheckCircle2 className="text-success size-4 shrink-0" />
        ) : (
          <XCircle className="text-destructive size-4 shrink-0" />
        )}
      </div>

      <div className="bg-muted mt-2.5 h-2 w-full overflow-hidden rounded-full">
        <div
          className={cn('h-full rounded-full transition-[width] duration-500', item.adequate ? 'bg-success' : 'bg-destructive')}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-1.5 flex items-center justify-between text-xs">
        <span className={cn('font-mono tabular-nums', item.adequate ? 'text-success' : 'text-destructive')}>
          {formatINR(item.current)}
        </span>
        <span className="text-muted-foreground font-mono tabular-nums">of {formatINR(item.recommended)}</span>
      </div>
    </div>
  );
}

export function FinancialEssentialsCard() {
  const { items, isLoading, hasProfileData, score } = useFinancialEssentials();

  if (isLoading) return null;

  return (
    <Card>
      <CardContent>
        <div className="mb-5 flex items-center justify-between">
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

        <div className="space-y-5">
          {items.map((item) => (
            <EssentialItemRow key={item.key} item={item} />
          ))}
        </div>

        <p className="text-muted-foreground mt-5 text-xs">
          Simplified estimates based on your profile and data — not financial advice.
        </p>
      </CardContent>
    </Card>
  );
}
