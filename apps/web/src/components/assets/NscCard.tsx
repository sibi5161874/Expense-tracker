import { memo } from 'react';
import { ScrollText, Pencil, Trash2 } from 'lucide-react';
import type { NscAsset } from '@repo/shared/types';
import { calculateFixedDepositStatus } from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils/currency';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { fixedDepositStatusTone } from '@/lib/badgeTones';
import { Button } from '@/components/ui/button';

interface NscCardProps {
  nsc: NscAsset;
  onEdit: (nsc: NscAsset) => void;
  onDelete: (id: string) => void;
}

function NscCardComponent({ nsc, onEdit, onDelete }: NscCardProps) {
  const status = calculateFixedDepositStatus(nsc.maturity_date, false);

  return (
    <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-accent text-accent-foreground flex size-9 items-center justify-center rounded-full">
            <ScrollText className="size-4.5" />
          </div>
          <h3 className="font-semibold">NSC · {nsc.certificate_number}</h3>
        </div>
        <StatusBadge tone={fixedDepositStatusTone(status)}>{status}</StatusBadge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Purchase Value</p>
          <p className="font-medium tabular-nums">{formatINR(nsc.purchase_value)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Maturity Value</p>
          <p className="font-medium tabular-nums">{formatINR(nsc.maturity_value)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Rate</p>
          <p className="font-medium tabular-nums">{nsc.rate_pct}%</p>
        </div>
        <div>
          <p className="text-muted-foreground">Maturity Date</p>
          <p className="font-medium tabular-nums">{nsc.maturity_date}</p>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-1 border-t pt-4">
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onEdit(nsc)}>
          <Pencil className="size-4" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => {
            if (confirm('Are you sure you want to delete this NSC certificate?')) onDelete(nsc.id);
          }}
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}

export const NscCard = memo(NscCardComponent);
