import type { ReactNode } from 'react';
import { Landmark, Plus } from 'lucide-react';
import { TabsContent } from '@/components/ui/tabs';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';

interface AssetTabPanelProps<T> {
  value: string;
  items: T[] | undefined;
  getKey: (item: T) => string;
  renderCard: (item: T) => ReactNode;
  emptyMessage: string;
  onAdd?: () => void;
  addLabel?: string;
}

/**
 * The card-grid + empty-state shell every asset tab shares. Previously copy-pasted
 * once per asset type on the Assets page; holding it here means a layout tweak is
 * one edit instead of ten, and adding an asset type doesn't grow the page file.
 */
export function AssetTabPanel<T>({
  value,
  items,
  getKey,
  renderCard,
  emptyMessage,
  onAdd,
  addLabel,
}: AssetTabPanelProps<T>) {
  return (
    <TabsContent value={value} className="mt-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items?.map((item) => (
          <div key={getKey(item)}>{renderCard(item)}</div>
        ))}
        {items?.length === 0 && (
          <div className="col-span-full">
            <EmptyState
              icon={Landmark}
              title={emptyMessage}
              subtitle="Start tracking this asset to keep your net worth calculations accurate and up to date."
              adSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_EMPTY}
              action={
                onAdd ? (
                  <Button onClick={onAdd} className="min-h-[44px]">
                    <Plus className="size-4" />
                    Add {addLabel ?? 'Asset'}
                  </Button>
                ) : undefined
              }
            />
          </div>
        )}
      </div>
    </TabsContent>
  );
}
