import { memo } from 'react';
import { Home, Pencil, Trash2 } from 'lucide-react';
import type { RealEstateAsset } from '@repo/shared/types';
import { calculateRealEstatePnl } from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils/currency';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';

interface RealEstateCardProps {
  property: RealEstateAsset;
  onEdit: (property: RealEstateAsset) => void;
  onDelete: (id: string) => void;
}

function RealEstateCardComponent({ property, onEdit, onDelete }: RealEstateCardProps) {
  const pnl = calculateRealEstatePnl(property.purchase_value, property.current_value);

  return (
    <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-accent text-accent-foreground flex size-9 items-center justify-center rounded-full">
            <Home className="size-4.5" />
          </div>
          <div>
            <h3 className="font-semibold">{property.description}</h3>
            <p className="text-muted-foreground text-xs">
              {property.property_type}
              {property.location ? ` · ${property.location}` : ''}
            </p>
          </div>
        </div>
        <StatusBadge tone={pnl >= 0 ? 'success' : 'destructive'}>{pnl >= 0 ? 'Profit' : 'Loss'}</StatusBadge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Purchase Value</p>
          <p className="font-medium tabular-nums">{formatINR(property.purchase_value)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Current Value</p>
          <p className="font-medium tabular-nums">{formatINR(property.current_value)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-muted-foreground">P&L</p>
          <p className={`font-medium tabular-nums ${pnl >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatINR(pnl)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-1 border-t pt-4">
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onEdit(property)}>
          <Pencil className="size-4" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => {
            if (confirm('Are you sure you want to delete this property?')) onDelete(property.id);
          }}
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}

export const RealEstateCard = memo(RealEstateCardComponent);
