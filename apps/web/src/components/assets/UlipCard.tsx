import { memo } from 'react';
import { Umbrella, Pencil, Trash2 } from 'lucide-react';
import type { UlipAsset } from '@repo/shared/types';
import { calculateDaysLeft, calculateFixedDepositStatus } from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils/currency';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { fixedDepositStatusTone } from '@/lib/badgeTones';

interface UlipCardProps {
  ulip: UlipAsset;
  onEdit: (ulip: UlipAsset) => void;
  onDelete: (id: string) => void;
}

function UlipCardComponent({ ulip, onEdit, onDelete }: UlipCardProps) {
  const daysLeft = calculateDaysLeft(ulip.maturity_date);
  const status = calculateFixedDepositStatus(ulip.maturity_date, false);

  return (
    <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-accent text-accent-foreground flex size-9 items-center justify-center rounded-full">
            <Umbrella className="size-4.5" />
          </div>
          <h3 className="font-semibold">{ulip.insurer}</h3>
        </div>
        <StatusBadge tone={fixedDepositStatusTone(status)}>{status}</StatusBadge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Current Fund Value</p>
          <p className="font-medium tabular-nums">{formatINR(ulip.current_fund_value)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Sum Assured</p>
          <p className="font-medium tabular-nums">{formatINR(ulip.sum_assured)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Premium</p>
          <p className="font-medium tabular-nums">
            {formatINR(ulip.premium_amount)} / {ulip.premium_frequency}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Days Left</p>
          <p className="font-medium tabular-nums">{daysLeft}</p>
        </div>
        <div className="col-span-2">
          <p className="text-muted-foreground">Policy Number</p>
          <p className="font-medium">{ulip.policy_number}</p>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-1 border-t pt-4">
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onEdit(ulip)}>
          <Pencil className="size-4" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => {
            if (confirm('Are you sure you want to delete this ULIP policy?')) onDelete(ulip.id);
          }}
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}

export const UlipCard = memo(UlipCardComponent);
