import { memo } from 'react';
import { HandCoins, Pencil, Trash2 } from 'lucide-react';
import type { LoanLiability } from '@repo/shared/types';
import { formatINR } from '@repo/shared/utils/currency';
import { Button } from '@/components/ui/button';

interface LoanCardProps {
  loan: LoanLiability;
  onEdit: (loan: LoanLiability) => void;
  onDelete: (id: string) => void;
}

function LoanCardComponent({ loan, onEdit, onDelete }: LoanCardProps) {
  return (
    <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="bg-accent text-accent-foreground flex size-9 items-center justify-center rounded-full">
          <HandCoins className="size-4.5" />
        </div>
        <h3 className="font-semibold">{loan.lender}</h3>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Outstanding</p>
          <p className="font-medium tabular-nums">{formatINR(loan.outstanding)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">EMI</p>
          <p className="font-medium tabular-nums">{loan.emi != null ? formatINR(loan.emi) : '-'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Interest Rate</p>
          <p className="font-medium">{loan.interest_rate_pct != null ? `${loan.interest_rate_pct}%` : '-'}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Months Left</p>
          <p className="font-medium tabular-nums">{loan.months_left ?? '-'}</p>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-1 border-t pt-4">
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onEdit(loan)}>
          <Pencil className="size-4" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => {
            if (confirm('Are you sure you want to delete this loan?')) onDelete(loan.id);
          }}
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}

export const LoanCard = memo(LoanCardComponent);
