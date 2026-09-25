'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import type { FilterType, SortKey } from '@repo/shared/types';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface HoldingsFilterBarProps {
  sortValue: SortKey;
  onSortChange: (value: SortKey) => void;
  filterValue: FilterType;
  onFilterChange: (value: FilterType) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function HoldingsFilterBar({
  sortValue,
  onSortChange,
  filterValue,
  onFilterChange,
  searchQuery,
  onSearchChange,
}: HoldingsFilterBarProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);

  // Sync state during render when external searchQuery prop changes
  if (prevSearchQuery !== searchQuery) {
    setPrevSearchQuery(searchQuery);
    setLocalSearch(searchQuery);
  }

  // 200ms debounce on user typing
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        onSearchChange(localSearch);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, onSearchChange]);

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder="Search symbol or name…"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="pl-9 h-10 w-full"
        />
      </div>

      <div className="flex items-center gap-2 sm:shrink-0">
        {/* Filter Select */}
        <Select
          value={filterValue}
          onValueChange={(val) => onFilterChange(val as FilterType)}
        >
          <SelectTrigger className="w-36 h-10">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Holdings</SelectItem>
            <SelectItem value="profit">Profit Only</SelectItem>
            <SelectItem value="loss">Loss Only</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Select */}
        <Select
          value={sortValue}
          onValueChange={(val) => onSortChange(val as SortKey)}
        >
          <SelectTrigger className="w-48 h-10">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="currentValue_desc">Value (High → Low)</SelectItem>
            <SelectItem value="returnPct_desc">Return % (High → Low)</SelectItem>
            <SelectItem value="returnPct_asc">Return % (Low → High)</SelectItem>
            <SelectItem value="invested_desc">Invested (High → Low)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
