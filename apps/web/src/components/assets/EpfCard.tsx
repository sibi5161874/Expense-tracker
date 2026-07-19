import { memo } from 'react';
import { Briefcase, Pencil, Trash2 } from 'lucide-react';
import type { EpfAsset } from '@repo/shared/types';
import { formatINR } from '@repo/shared/utils/currency';
import { Button } from '@/components/ui/button';

interface EpfCardProps {
  epf: EpfAsset;
  onEdit: (epf: EpfAsset) => void;
  onDelete: (id: string) => void;
}

function EpfCardComponent({ epf, onEdit, onDelete }: EpfCardProps) {
  return (
    <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="bg-accent text-accent-foreground flex size-9 items-center justify-center rounded-full">
          <Briefcase className="size-4.5" />
        </div>
        <h3 className="font-semibold">{epf.employer_name}</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Current Balance</p>
          <p className="font-medium tabular-nums">{formatINR(epf.current_balance)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Monthly Contribution</p>
          <p className="font-medium tabular-nums">{formatINR(epf.monthly_contribution)}</p>
        </div>
        {epf.uan_number && (
          <div className="col-span-2">
            <p className="text-muted-foreground">UAN Number</p>
            <p className="font-medium">{epf.uan_number}</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end gap-1 border-t pt-4">
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onEdit(epf)}>
          <Pencil className="size-4" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => {
            if (confirm('Are you sure you want to delete this EPF account?')) onDelete(epf.id);
          }}
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}

export const EpfCard = memo(EpfCardComponent);
