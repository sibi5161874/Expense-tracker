import { memo } from 'react';
import { Car, Pencil, Trash2 } from 'lucide-react';
import type { VehicleAsset } from '@repo/shared/types';
import { calculateRealEstatePnl } from '@repo/shared/logic';
import { formatINR } from '@repo/shared/utils/currency';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Button } from '@/components/ui/button';

interface VehicleCardProps {
  vehicle: VehicleAsset;
  onEdit: (vehicle: VehicleAsset) => void;
  onDelete: (id: string) => void;
}

function VehicleCardComponent({ vehicle, onEdit, onDelete }: VehicleCardProps) {
  // Same "current minus purchase" rule as real estate — vehicles almost always
  // depreciate, so this reads as a loss by design rather than being a bug.
  const change = calculateRealEstatePnl(vehicle.purchase_value, vehicle.current_value);

  return (
    <div className="bg-card border-border/60 rounded-2xl border p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-accent text-accent-foreground flex size-9 items-center justify-center rounded-full">
            <Car className="size-4.5" />
          </div>
          <div>
            <h3 className="font-semibold">{vehicle.description}</h3>
            <p className="text-muted-foreground text-xs">
              {vehicle.vehicle_type}
              {vehicle.registration_number ? ` · ${vehicle.registration_number}` : ''}
            </p>
          </div>
        </div>
        <StatusBadge tone={change >= 0 ? 'success' : 'destructive'}>
          {change >= 0 ? 'Appreciated' : 'Depreciated'}
        </StatusBadge>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Purchase Value</p>
          <p className="font-medium tabular-nums">{formatINR(vehicle.purchase_value)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Current Value</p>
          <p className="font-medium tabular-nums">{formatINR(vehicle.current_value)}</p>
        </div>
        <div className="col-span-2">
          <p className="text-muted-foreground">Change</p>
          <p className={`font-medium tabular-nums ${change >= 0 ? 'text-success' : 'text-destructive'}`}>
            {formatINR(change)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-1 border-t pt-4">
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onEdit(vehicle)}>
          <Pencil className="size-4" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          onClick={() => {
            if (confirm('Are you sure you want to delete this vehicle?')) onDelete(vehicle.id);
          }}
        >
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}

export const VehicleCard = memo(VehicleCardComponent);
