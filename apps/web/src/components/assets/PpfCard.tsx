import { memo } from 'react';
import { Landmark, Pencil, Trash2 } from 'lucide-react';
import type { PpfAsset } from '@repo/shared/types';
import { formatINR } from '@repo/shared/utils/currency';
import { Button } from '@/components/ui/button';

interface PpfCardProps {
  ppf: PpfAsset;
  onEdit: (ppf: PpfAsset) => void;
  onDelete: (id: string) => void;
}

function PpfCardComponent({ ppf, onEdit, onDelete }: PpfCardProps) {
  return (
    <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="bg-accent text-accent-foreground flex size-9 items-center justify-center rounded-full">
          <Landmark className="size-4.5" />
        </div>
        <h3 className="font-semibold">PPF · {ppf.account_number}</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Current Balance</p>
          <p className="font-medium tabular-nums">{formatINR(ppf.current_balance)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Annual Contribution</p>
          <p className="font-medium tabular-nums">{formatINR(ppf.annual_contribution)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-muted-foreground">Opening Date</p>
          <p className="font-medium tabular-nums">{ppf.opening_date}</p>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-1 border-t pt-4">
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onEdit(ppf)}>
          <Pencil className="size-4" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => {
            if (confirm('Are you sure you want to delete this PPF account?')) onDelete(ppf.id);
          }}
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}

export const PpfCard = memo(PpfCardComponent);
