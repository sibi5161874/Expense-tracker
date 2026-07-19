import { memo } from 'react';
import { Heart, Pencil, Trash2 } from 'lucide-react';
import type { SsyAsset } from '@repo/shared/types';
import { calculateDaysLeft, calculateFixedDepositStatus, calculateSsyMaturityDate } from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils/currency';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { fixedDepositStatusTone } from '@/lib/badgeTones';

interface SsyCardProps {
  ssy: SsyAsset;
  onEdit: (ssy: SsyAsset) => void;
  onDelete: (id: string) => void;
}

function SsyCardComponent({ ssy, onEdit, onDelete }: SsyCardProps) {
  const maturityDate = calculateSsyMaturityDate(ssy.opening_date);
  const daysLeft = calculateDaysLeft(maturityDate);
  const status = calculateFixedDepositStatus(maturityDate, false);

  return (
    <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-accent text-accent-foreground flex size-9 items-center justify-center rounded-full">
            <Heart className="size-4.5" />
          </div>
          <h3 className="font-semibold">{ssy.account_holder_name}</h3>
        </div>
        <StatusBadge tone={fixedDepositStatusTone(status)}>{status}</StatusBadge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Current Balance</p>
          <p className="font-medium tabular-nums">{formatINR(ssy.current_balance)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Days Left</p>
          <p className="font-medium tabular-nums">{daysLeft}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Account Number</p>
          <p className="font-medium">{ssy.account_number}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Maturity Date</p>
          <p className="font-medium">{maturityDate}</p>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-1 border-t pt-4">
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onEdit(ssy)}>
          <Pencil className="size-4" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => {
            if (confirm('Are you sure you want to delete this SSY account?')) onDelete(ssy.id);
          }}
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}

export const SsyCard = memo(SsyCardComponent);
