import { memo } from 'react';
import { PiggyBank, Pencil, Trash2 } from 'lucide-react';
import type { NpsAsset } from '@repo/shared/types';
import { formatINR } from '@repo/shared/utils/currency';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';

interface NpsCardProps {
  nps: NpsAsset;
  onEdit: (nps: NpsAsset) => void;
  onDelete: (id: string) => void;
}

function NpsCardComponent({ nps, onEdit, onDelete }: NpsCardProps) {
  return (
    <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-accent text-accent-foreground flex size-9 items-center justify-center rounded-full">
            <PiggyBank className="size-4.5" />
          </div>
          <h3 className="font-semibold">{nps.pran_number}</h3>
        </div>
        <StatusBadge tone="info">{nps.tier}</StatusBadge>
      </div>

      <div className="text-sm">
        <p className="text-muted-foreground">Current Value</p>
        <p className="font-medium tabular-nums">{formatINR(nps.current_value)}</p>
      </div>

      <div className="mt-4 flex justify-end gap-1 border-t pt-4">
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onEdit(nps)}>
          <Pencil className="size-4" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => {
            if (confirm('Are you sure you want to delete this NPS account?')) onDelete(nps.id);
          }}
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}

export const NpsCard = memo(NpsCardComponent);
