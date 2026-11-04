'use client';

import { useEffect, useId } from 'react';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdBannerProps {
  slot: string | undefined;
  format?: 'banner' | 'auto';
  className?: string;
}

/**
 * Renders null in E2E mode, when AdSense is disabled, when no client/slot is
 * configured yet (pre-approval), or in dev — so the empty component is always
 * safe to leave mounted on an approved route.
 */
export function AdBanner({ slot, format = 'banner', className }: AdBannerProps) {
  const adsenseEnabled = process.env.NEXT_PUBLIC_ADSENSE_ENABLED === 'true';
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const isE2E = process.env.NEXT_PUBLIC_E2E_MODE === 'true';
  const instanceId = useId();
  const shouldRender = adsenseEnabled && !isE2E && !!client && !!slot;

  useEffect(() => {
    if (!shouldRender) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script not yet loaded or blocked — the <ins> stays empty, no layout break.
    }
  }, [shouldRender, instanceId]);

  if (!shouldRender) return null;

  return (
    <div
      data-testid="ad-banner"
      className={cn(
        'min-h-[100px] sm:min-h-[90px] border border-border bg-muted/20 rounded-lg p-2 w-full max-w-[728px] mx-auto overflow-hidden',
        className,
      )}
    >
      <div className="text-xs text-muted-foreground mb-2">Sponsored</div>
      <ins
        className="adsbygoogle motion-reduce:animate-none"
        style={{ display: 'block' }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format === 'auto' ? 'auto' : undefined}
        data-full-width-responsive="true"
      />
    </div>
  );
}
