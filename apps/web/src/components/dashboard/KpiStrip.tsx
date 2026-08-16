import type { LucideIcon } from 'lucide-react';
import { formatINR } from '@repo/shared/utils/currency';
import { cn } from '@/lib/utils';
import type { BadgeTone } from '@/components/shared/StatusBadge';

const VALUE_TONE_CLASSES: Record<BadgeTone, string> = {
  success: 'text-success',
  destructive: 'text-destructive',
  warning: 'text-warning-foreground',
  info: 'text-info',
  neutral: 'text-foreground',
};

export interface KpiStatItem {
  label: string;
  icon: LucideIcon;
  tone?: BadgeTone;
  /** Numeric amounts render through formatINR with tabular-nums; pass a pre-formatted string (e.g. "12.4%") otherwise. */
  value: number | string;
}

/**
 * Each stat gets its own flat rounded-2xl card — no divider lines between them (design
 * spec §4: hierarchy comes from weight/size/color, never lines/borders). Meaning is
 * signaled by the value's color and a small inline icon, never an icon-in-a-circle.
 */
export function KpiStrip({ items, className }: { items: KpiStatItem[]; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-3 sm:grid-cols-4', className)}>
      {items.map(({ label, icon: Icon, tone = 'neutral', value }) => (
        <div key={label} className="bg-muted/40 flex flex-col gap-1.5 rounded-2xl px-5 py-4">
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Icon className="size-3.5" />
            {label}
          </span>
          <span className={cn('font-mono text-xl font-semibold tabular-nums', VALUE_TONE_CLASSES[tone])}>
            {typeof value === 'number' ? formatINR(value) : value}
          </span>
        </div>
      ))}
    </div>
  );
}
