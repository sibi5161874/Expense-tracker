'use client';

import { Lock } from 'lucide-react';
import { useEntitlements } from '@/hooks/useEntitlements';
import { Button } from '@/components/ui/button';
import type { FeatureKey } from '@repo/shared/config';

interface ProGateProps {
  feature: FeatureKey;
  /** Rendered when the user has access. */
  children: React.ReactNode;
  /** What the locked state looks like — omit to just hide `children` entirely. */
  fallback?: React.ReactNode;
}

/**
 * Wraps a feature's UI, rendering `children` only when the current user's
 * tier grants `feature` (per packages/shared/config/tierConfig.ts). This is a
 * UI convenience, not the security boundary — RLS is what actually protects
 * data; this only decides what renders.
 */
export function ProGate({ feature, children, fallback }: ProGateProps) {
  const { hasFeature } = useEntitlements();
  if (hasFeature(feature)) return <>{children}</>;
  return fallback ?? null;
}

interface ProLockedButtonProps {
  label: string;
  icon?: React.ReactNode;
  onUpgradeClick: () => void;
}

/** The disabled, upsell-labeled stand-in for a button a free-tier user can't use yet. */
export function ProLockedButton({ label, icon, onUpgradeClick }: ProLockedButtonProps) {
  return (
    <Button variant="outline" onClick={onUpgradeClick} title="Available on Pro">
      {icon ?? <Lock className="size-4" />}
      {label}
      <span className="bg-warning-subtle text-warning-foreground ml-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
        Pro
      </span>
    </Button>
  );
}
