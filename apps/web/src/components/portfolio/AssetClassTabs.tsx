'use client';

import { useMemo } from 'react';
import type { SymbolHolding } from '@repo/shared/logic';
import { cn } from '@/lib/utils';

interface AssetClassTabsProps {
  holdings: SymbolHolding[];
  selectedTab: string;
  onSelectTab: (tab: string) => void;
}

const PREFERRED_ORDER = ['All', 'Stock', 'Mutual Fund', 'ETF', 'Gold', 'Crypto', 'Other'];

export function AssetClassTabs({ holdings, selectedTab, onSelectTab }: AssetClassTabsProps) {
  const tabs = useMemo(() => {
    const counts = new Map<string, number>();
    for (const h of holdings) {
      const type = (h.assetType || 'Other').trim() || 'Other';
      counts.set(type, (counts.get(type) ?? 0) + 1);
    }

    const availableTypes = Array.from(counts.keys());
    // Sort by PREFERRED_ORDER, remaining alphabetically
    availableTypes.sort((a, b) => {
      const idxA = PREFERRED_ORDER.indexOf(a);
      const idxB = PREFERRED_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    return [
      { key: 'All', label: 'All', count: holdings.length },
      ...availableTypes.map((type) => ({
        key: type,
        label: type,
        count: counts.get(type) ?? 0,
      })),
    ];
  }, [holdings]);

  return (
    <div className="overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex gap-2 min-w-max pb-1">
        {tabs.map((tab) => {
          const isActive = selectedTab.toLowerCase() === tab.key.toLowerCase();
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onSelectTab(tab.key)}
              className={cn(
                'px-4 py-2 rounded-full border text-sm font-medium whitespace-nowrap transition-colors cursor-pointer',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted hover:text-foreground'
              )}
            >
              {tab.label}
              <span className="ml-1.5 text-xs opacity-70">({tab.count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
