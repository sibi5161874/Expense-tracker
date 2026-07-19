import { memo } from 'react';
import { Coins, Pencil, Trash2 } from 'lucide-react';
import type { SgbAsset } from '@repo/shared/types';
import {
  calculateDaysLeft,
  calculateFixedDepositStatus,
  calculateGoldMetrics,
  calculateSgbMaturityDate,
} from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils/currency';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';
import { fixedDepositStatusTone } from '@/lib/badgeTones';

interface SgbCardProps {
  sgb: SgbAsset;
  onEdit: (sgb: SgbAsset) => void;
  onDelete: (id: string) => void;
}

function SgbCardComponent({ sgb, onEdit, onDelete }: SgbCardProps) {
  const maturityDate = calculateSgbMaturityDate(sgb.issue_date);
  const daysLeft = calculateDaysLeft(maturityDate);
  const status = calculateFixedDepositStatus(maturityDate, false);
  const { currentValue, pnl } = calculateGoldMetrics(sgb.units_held, sgb.rate_per_gram, sgb.units_held * sgb.issue_price);

  return (
    <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-accent text-accent-foreground flex size-9 items-center justify-center rounded-full">
            <Coins className="size-4.5" />
          </div>
          <h3 className="font-semibold">{sgb.units_held}g SGB</h3>
        </div>
        <StatusBadge tone={fixedDepositStatusTone(status)}>{status}</StatusBadge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Current Value</p>
          <p className="font-medium tabular-nums">{formatINR(currentValue)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">P&L</p>
          <p className={`font-medium tabular-nums ${pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatINR(pnl)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Days Left</p>
          <p className="font-medium tabular-nums">{daysLeft}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Maturity Date</p>
          <p className="font-medium">{maturityDate}</p>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-1 border-t pt-4">
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onEdit(sgb)}>
          <Pencil className="size-4" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => {
            if (confirm('Are you sure you want to delete this SGB holding?')) onDelete(sgb.id);
          }}
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}

export const SgbCard = memo(SgbCardComponent);
