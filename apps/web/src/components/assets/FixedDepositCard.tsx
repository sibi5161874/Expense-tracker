import { memo } from 'react';
import { Landmark, Pencil, Trash2 } from 'lucide-react';
import type { FixedDeposit } from '@repo/shared/types';
import { calculateDaysLeft, calculateFixedDepositStatus } from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils/currency';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { fixedDepositStatusTone } from '@/lib/badgeTones';

interface FixedDepositCardProps {
  fd: FixedDeposit;
  onEdit: (fd: FixedDeposit) => void;
  onDelete: (id: string) => void;
}

function FixedDepositCardComponent({ fd, onEdit, onDelete }: FixedDepositCardProps) {
  const daysLeft = calculateDaysLeft(fd.maturity_date);
  const status = calculateFixedDepositStatus(fd.maturity_date, fd.withdrawn);

  return (
    <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-accent text-accent-foreground flex size-9 items-center justify-center rounded-full">
            <Landmark className="size-4.5" />
          </div>
          <h3 className="font-semibold">{fd.bank}</h3>
        </div>
        <StatusBadge tone={fixedDepositStatusTone(status)}>{status}</StatusBadge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Principal</p>
          <p className="font-medium tabular-nums">{formatINR(fd.principal)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Interest Rate</p>
          <p className="font-medium">{fd.rate_pct}%</p>
        </div>
        <div>
          <p className="text-muted-foreground">Maturity Date</p>
          <p className="font-medium">{fd.maturity_date}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Days Left</p>
          <p className="font-medium tabular-nums">{daysLeft}</p>
        </div>
        <div className="col-span-2">
          <p className="text-muted-foreground">Maturity Value</p>
          <p className="font-medium tabular-nums">{formatINR(fd.maturity_value)}</p>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-1 border-t pt-4">
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onEdit(fd)}>
          <Pencil className="size-4" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => {
            if (confirm('Are you sure you want to delete this FD?')) onDelete(fd.id);
          }}
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}

export const FixedDepositCard = memo(FixedDepositCardComponent);
