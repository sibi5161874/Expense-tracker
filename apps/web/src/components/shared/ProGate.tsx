'use client';

import { Lock } from 'lucide-react';
import { useEntitlements } from '@/hooks/useEntitlements';
import { Button } from '@/components/ui/button';
import type { FeatureKey } from '@repo/shared/config';
import { cn } from '@/lib/utils';

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

interface ProBlurredPreviewProps {
  feature: FeatureKey;
  /** The real content — a chart, a table, whatever's being teased. Still mounted (and still fetching its own data) behind the blur, just visually obscured, so this must not assume it's ever hidden outright. */
  children: React.ReactNode;
  title: string;
  description: string;
  onUpgradeClick: () => void;
  className?: string;
}

/**
 * A softer upsell than ProGate's hide-entirely default: shows the real content blurred
 * behind a CTA card, so a free-tier user can see there's something worth upgrading for
 * instead of an unexplained gap in the layout. Used for visual features (charts, graphs)
 * where "this exists and looks good" is itself the pitch — ProGate/ProLockedButton stay
 * right for actions (buttons, exports) where a blurred button makes no sense.
 */
export function ProBlurredPreview({ feature, children, title, description, onUpgradeClick, className }: ProBlurredPreviewProps) {
  const { hasFeature } = useEntitlements();
  if (hasFeature(feature)) return <>{children}</>;

  return (
    <div className={cn('relative overflow-hidden rounded-2xl', className)}>
      <div className="pointer-events-none blur-sm select-none" aria-hidden>
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/40 p-4">
        <div className="bg-card border-border/60 flex max-w-xs flex-col items-center gap-2 rounded-2xl border p-5 text-center shadow-sm">
          <span className="bg-warning-subtle text-warning-foreground rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase">
            Pro
          </span>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-muted-foreground text-xs">{description}</p>
          <Button size="sm" className="mt-1" onClick={onUpgradeClick}>
            Upgrade to Pro
          </Button>
        </div>
      </div>
    </div>
  );
}
