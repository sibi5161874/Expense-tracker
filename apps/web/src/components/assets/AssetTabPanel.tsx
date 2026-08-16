import type { ReactNode } from 'react';
import { TabsContent } from '@/components/ui/tabs';

interface AssetTabPanelProps<T> {
  value: string;
  items: T[] | undefined;
  getKey: (item: T) => string;
  renderCard: (item: T) => ReactNode;
  emptyMessage: string;
}

/**
 * The card-grid + empty-state shell every asset tab shares. Previously copy-pasted
 * once per asset type on the Assets page; holding it here means a layout tweak is
 * one edit instead of ten, and adding an asset type doesn't grow the page file.
 */
export function AssetTabPanel<T>({ value, items, getKey, renderCard, emptyMessage }: AssetTabPanelProps<T>) {
  return (
    <TabsContent value={value} className="mt-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items?.map((item) => <div key={getKey(item)}>{renderCard(item)}</div>)}
        {items?.length === 0 && (
          <div className="text-muted-foreground col-span-full rounded-2xl border border-dashed p-12 text-center">
            {emptyMessage}
          </div>
        )}
      </div>
    </TabsContent>
  );
}
