import { memo } from 'react';
import { CalendarClock, Pencil, Trash2 } from 'lucide-react';
import type { RecurringDepositAsset } from '@repo/shared/types';
import { calculateFixedDepositStatus } from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils/currency';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { fixedDepositStatusTone } from '@/lib/badgeTones';
import { Button } from '@/components/ui/button';

interface RecurringDepositCardProps {
  rd: RecurringDepositAsset;
  onEdit: (rd: RecurringDepositAsset) => void;
  onDelete: (id: string) => void;
}

function RecurringDepositCardComponent({ rd, onEdit, onDelete }: RecurringDepositCardProps) {
  // RD maturity behaves exactly like an FD's, so it reuses the same status rule
  // rather than duplicating the date maths (RD has no early-withdrawal flag).
  const status = calculateFixedDepositStatus(rd.maturity_date, false);

  return (
    <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-accent text-accent-foreground flex size-9 items-center justify-center rounded-full">
            <CalendarClock className="size-4.5" />
          </div>
          <h3 className="font-semibold">{rd.bank}</h3>
        </div>
        <StatusBadge tone={fixedDepositStatusTone(status)}>{status}</StatusBadge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Monthly Installment</p>
          <p className="font-medium tabular-nums">{formatINR(rd.monthly_installment)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Rate</p>
          <p className="font-medium tabular-nums">{rd.rate_pct}%</p>
        </div>
        <div>
          <p className="text-muted-foreground">Maturity Value</p>
          <p className="font-medium tabular-nums">{formatINR(rd.maturity_value)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Maturity Date</p>
          <p className="font-medium tabular-nums">{rd.maturity_date}</p>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-1 border-t pt-4">
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onEdit(rd)}>
          <Pencil className="size-4" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => {
            if (confirm('Are you sure you want to delete this recurring deposit?')) onDelete(rd.id);
          }}
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}

export const RecurringDepositCard = memo(RecurringDepositCardComponent);
