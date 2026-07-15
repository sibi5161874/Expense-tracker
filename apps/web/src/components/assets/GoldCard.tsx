import { memo } from 'react';
import { Gem, Pencil, Trash2 } from 'lucide-react';
import type { GoldAsset } from '@repo/shared/types';
import { calculateGoldMetrics } from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils/currency';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';

interface GoldCardProps {
  gold: GoldAsset;
  onEdit: (gold: GoldAsset) => void;
  onDelete: (id: string) => void;
}

function GoldCardComponent({ gold, onEdit, onDelete }: GoldCardProps) {
  const metrics = calculateGoldMetrics(gold.grams, gold.rate_per_gram, gold.purchase_value);

  return (
    <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-accent text-accent-foreground flex size-9 items-center justify-center rounded-full">
            <Gem className="size-4.5" />
          </div>
          <h3 className="font-semibold">{gold.description}</h3>
        </div>
        <StatusBadge tone={metrics.pnl >= 0 ? 'success' : 'destructive'}>
          {metrics.pnl >= 0 ? 'Profit' : 'Loss'}
        </StatusBadge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Grams</p>
          <p className="font-medium tabular-nums">{gold.grams}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Rate/gram</p>
          <p className="font-medium tabular-nums">{formatINR(gold.rate_per_gram)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Purchase Value</p>
          <p className="font-medium tabular-nums">{formatINR(gold.purchase_value)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Current Value</p>
          <p className="font-medium tabular-nums">{formatINR(metrics.currentValue)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-muted-foreground">P&L</p>
          <p className={`font-medium tabular-nums ${metrics.pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatINR(metrics.pnl)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-1 border-t pt-4">
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onEdit(gold)}>
          <Pencil className="size-4" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => {
            if (confirm('Are you sure you want to delete this gold holding?')) onDelete(gold.id);
          }}
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}

export const GoldCard = memo(GoldCardComponent);
