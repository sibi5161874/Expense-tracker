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

const FILTER_OPTIONS: { label: string; value: FilterType }[] = [
  { label: 'All Holdings', value: 'all' },
  { label: 'Profit Only', value: 'profit' },
  { label: 'Loss Only', value: 'loss' },
];

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
  { label: 'Value (High → Low)', value: 'currentValue_desc' },
  { label: 'Return % (High → Low)', value: 'returnPct_desc' },
  { label: 'Return % (Low → High)', value: 'returnPct_asc' },
  { label: 'Invested (High → Low)', value: 'invested_desc' },
];

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
    <div className="mb-4 flex flex-col gap-3 sm:flex-row">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
        <Input
          type="text"
          placeholder="Search symbol or name…"
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="h-10 w-full pl-9"
        />
      </div>

      <div className="flex items-center gap-2 sm:shrink-0">
        {/* Filter Select */}
        <Select
          value={filterValue}
          onValueChange={(val) => onFilterChange(val as FilterType)}
        >
          <SelectTrigger className="h-10 w-36">
            <SelectValue placeholder="Filter">
              {FILTER_OPTIONS.find((opt) => opt.value === filterValue)?.label ?? 'Filter'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {FILTER_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort Select */}
        <Select
          value={sortValue}
          onValueChange={(val) => onSortChange(val as SortKey)}
        >
          <SelectTrigger className="h-10 w-52">
            <SelectValue placeholder="Sort by">
              {SORT_OPTIONS.find((opt) => opt.value === sortValue)?.label ?? 'Sort by'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
