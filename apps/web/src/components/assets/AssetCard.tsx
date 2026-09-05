import { Pencil, Trash2, type LucideIcon } from 'lucide-react';
import { StatusBadge, type BadgeTone } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { useConfirmDelete } from '@/hooks/useConfirmDelete';
import { cn } from '@/lib/utils';

export interface AssetCardField {
  label: string;
  value: string;
  /** Takes the full second column width instead of sharing a row — used for a field whose
   * value tends to run long (a policy/account number, a date range) or that reads better
   * given its own line (a P&L total). */
  span2?: boolean;
  /** Colors the value success/destructive, e.g. a profit-or-loss figure. Absent means the
   * default `font-medium` (neutral) color. */
  tone?: 'success' | 'destructive';
  /** `tabular-nums` for digit columns — off for free-text values (dates, account numbers)
   * where digit alignment doesn't mean anything. */
  numeric?: boolean;
}

export interface AssetCardConfig<T> {
  icon: LucideIcon;
  getTitle: (item: T) => string;
  getSubtitle?: (item: T) => string | undefined;
  getBadge?: (item: T) => { tone: BadgeTone; label: string } | undefined;
  getFields: (item: T) => AssetCardField[];
  /** e.g. "Delete gold holding?" — passed straight to useConfirmDelete. */
  confirmTitle: string;
}

interface AssetCardProps<T extends { id: string }> {
  config: AssetCardConfig<T>;
  item: T;
  onEdit: (item: T) => void;
  onDelete: (id: string) => void;
}

const TONE_TEXT_CLASS: Record<'success' | 'destructive', string> = {
  success: 'text-success',
  destructive: 'text-destructive',
};

/**
 * Single renderer for all 13 asset types, replacing what used to be 13 near-identical
 * `*Card.tsx` components (same shell: icon circle, title(+subtitle), optional status badge,
 * a field grid, edit/delete actions) — only the per-type icon/title/badge/field extraction
 * differs, which now lives in `assetCardConfigs.ts` as plain data instead of repeated JSX.
 */
export function AssetCard<T extends { id: string }>({ config, item, onEdit, onDelete }: AssetCardProps<T>) {
  const { requestDelete, dialog } = useConfirmDelete(onDelete, config.confirmTitle, "This can't be undone.");
  const Icon = config.icon;
  const badge = config.getBadge?.(item);
  const subtitle = config.getSubtitle?.(item);
  const fields = config.getFields(item);

  return (
    <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-accent text-accent-foreground flex size-9 items-center justify-center rounded-full">
            <Icon className="size-4.5" />
          </div>
          <div>
            <h3 className="font-semibold">{config.getTitle(item)}</h3>
            {subtitle && <p className="text-muted-foreground text-xs">{subtitle}</p>}
          </div>
        </div>
        {badge && <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>}
      </div>

      {fields.length === 1 ? (
        <div className="text-sm">
          <p className="text-muted-foreground">{fields[0]!.label}</p>
          <p
            className={cn(
              'font-medium',
              fields[0]!.numeric && 'tabular-nums',
              fields[0]!.tone && TONE_TEXT_CLASS[fields[0]!.tone]
            )}
          >
            {fields[0]!.value}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 text-sm">
          {fields.map((field, i) => (
            <div key={i} className={field.span2 ? 'col-span-2' : undefined}>
              <p className="text-muted-foreground">{field.label}</p>
              <p className={cn('font-medium', field.numeric && 'tabular-nums', field.tone && TONE_TEXT_CLASS[field.tone])}>
                {field.value}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-end gap-1 border-t pt-4">
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onEdit(item)}>
          <Pencil className="size-4" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => requestDelete(item.id)}
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>
      {dialog}
    </div>
  );
}
