import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AdBanner } from '@/components/shared/AdBanner';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  /** AdSense slot id — only pass this on routes approved for empty-state ads (see AdBanner usage). */
  adSlot?: string;
}

/**
 * Shared industry-standard empty state component:
 * Displays a 48px muted icon circle, prominent title, explanatory subtitle,
 * and an accessible primary action CTA (≥44px tall, responsive full-width on mobile).
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  subtitle,
  action,
  className,
  adSlot,
}: EmptyStateProps) {
  const text = subtitle || description;

  return (
    <Card className={cn('animate-in fade-in-0 duration-300 rounded-2xl border border-dashed border-border/70', className)}>
      <CardContent className="flex flex-col items-center gap-4 py-12 px-4 sm:py-16 text-center">
        <div className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-2xl ring-1 ring-border/50">
          <Icon className="size-7" />
        </div>
        <div className="space-y-1.5 max-w-sm">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">{title}</h2>
          {text && <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{text}</p>}
        </div>
        {action && (
          <div className="mt-2 w-full sm:w-auto [&_button]:min-h-[44px] [&_button]:w-full sm:[&_button]:w-auto">
            {action}
          </div>
        )}
        {adSlot && <AdBanner slot={adSlot} className="mt-4" />}
      </CardContent>
    </Card>
  );
}
