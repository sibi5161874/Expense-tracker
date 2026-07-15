import { AlertTriangle, Users } from 'lucide-react';
import { formatINR } from '@repo/shared/utils/currency';
import { cn } from '@/lib/utils';

interface CounterpartySummaryCardProps {
  counterparty: string;
  totalGiven: number;
  totalReceived: number;
  netBalance: number;
  hasOverdue: boolean;
}

export function CounterpartySummaryCard({
  counterparty,
  totalGiven,
  totalReceived,
  netBalance,
  hasOverdue,
}: CounterpartySummaryCardProps) {
  const summaryText =
    netBalance > 0
      ? `${counterparty} owes you ${formatINR(netBalance)}`
      : netBalance < 0
        ? `You owe ${counterparty} ${formatINR(Math.abs(netBalance))}`
        : `Settled with ${counterparty}`;

  return (
    <div
      className={cn(
        'bg-card rounded-2xl border p-4 shadow-sm',
        hasOverdue ? 'border-destructive/40 bg-destructive-subtle' : 'border-border/60'
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="bg-accent text-accent-foreground flex size-8 items-center justify-center rounded-full">
            <Users className="size-4" />
          </div>
          <h3 className="font-semibold">{counterparty}</h3>
        </div>
        {hasOverdue && (
          <span className="bg-destructive text-destructive-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
            <AlertTriangle className="size-3" />
            Overdue
          </span>
        )}
      </div>
      <p className="text-muted-foreground mb-3 text-sm">{summaryText}</p>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-muted-foreground">Given</p>
          <p className="font-medium tabular-nums">{formatINR(totalGiven)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Received</p>
          <p className="font-medium tabular-nums">{formatINR(totalReceived)}</p>
        </div>
      </div>
    </div>
  );
}
