import { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const AVATAR_GRADIENTS = [
  'from-blue-600 to-indigo-600 text-white',
  'from-emerald-600 to-teal-600 text-white',
  'from-violet-600 to-purple-600 text-white',
  'from-amber-600 to-orange-600 text-white',
  'from-rose-600 to-pink-600 text-white',
  'from-cyan-600 to-blue-600 text-white',
  'from-fuchsia-600 to-rose-600 text-white',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getAvatarGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index] ?? AVATAR_GRADIENTS[0]!;
}

interface CounterpartySummaryCardProps {
  counterparty: string;
  totalGiven: number;
  totalReceived: number;
  netBalance: number;
  hasOverdue: boolean;
  transactionCount?: number;
  onRemove?: (counterparty: string) => void;
  isRemoving?: boolean;
}

export function CounterpartySummaryCard({
  counterparty,
  totalGiven,
  totalReceived,
  netBalance,
  hasOverdue,
  transactionCount,
  onRemove,
  isRemoving,
}: CounterpartySummaryCardProps) {
  const { format } = useCurrency();
  const [imageFailed, setImageFailed] = useState(false);

  const summaryText =
    netBalance > 0
      ? `${counterparty} owes you ${format(netBalance)}`
      : netBalance < 0
        ? `You owe ${counterparty} ${format(Math.abs(netBalance))}`
        : `Settled with ${counterparty}`;

  const initials = getInitials(counterparty);
  const gradient = getAvatarGradient(counterparty);
  const avatarUrl = `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(counterparty)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;

  return (
    <div
      className={cn(
        'group bg-card relative flex min-w-[300px] max-w-[340px] shrink-0 snap-start flex-col justify-between rounded-2xl border p-4 shadow-sm transition-all',
        hasOverdue ? 'border-destructive/40 bg-destructive-subtle' : 'border-border/60 hover:border-border'
      )}
    >
      <div>
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'relative flex size-10 items-center justify-center overflow-hidden rounded-full text-xs font-bold tracking-wider shadow-inner ring-2 ring-white/10 bg-muted shrink-0'
              )}
            >
              {!imageFailed ? (
                <img
                  src={avatarUrl}
                  alt={counterparty}
                  className="size-full object-cover"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <div
                  className={cn(
                    'flex size-full items-center justify-center bg-gradient-to-tr',
                    gradient
                  )}
                >
                  {initials}
                </div>
              )}
            </div>
            <div>
              <h3 className="line-clamp-1 font-semibold">{counterparty}</h3>
              {typeof transactionCount === 'number' && (
                <p className="text-muted-foreground text-xs">
                  {transactionCount} transaction{transactionCount === 1 ? '' : 's'}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {hasOverdue && (
              <span className="bg-destructive text-destructive-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium">
                <AlertTriangle className="size-3" />
                Overdue
              </span>
            )}
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(counterparty)}
                disabled={isRemoving}
                title={`Remove ${counterparty}`}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 size-7 opacity-60 transition-opacity group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-muted-foreground mb-3 text-sm">{summaryText}</p>
      </div>

      <div className="border-border/40 grid grid-cols-2 gap-2 border-t pt-2 text-sm">
        <div>
          <p className="text-muted-foreground text-xs">Given</p>
          <p className="font-medium tabular-nums">{format(totalGiven)}</p>
        </div>
        <div>
          <p className="text-muted-foreground text-xs">Received</p>
          <p className="font-medium tabular-nums">{format(totalReceived)}</p>
        </div>
      </div>
    </div>
  );
}
