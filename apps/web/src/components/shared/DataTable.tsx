'use client';

import { useMemo, useState } from 'react';
import { Search, ArrowUp, ArrowDown, ArrowUpDown, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TableSkeleton } from '@/components/shared/TableSkeleton';
import { cn } from '@/lib/utils';

export interface DataTableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
}

export interface DataTableFilter<T> {
  id: string;
  label: string;
  options: { label: string; value: string }[];
  getValue: (row: T) => string;
}

interface DataTableProps<T> {
  data: T[] | undefined;
  columns: DataTableColumn<T>[];
  getRowId: (row: T) => string;
  isLoading?: boolean;
  searchPlaceholder?: string;
  searchableText?: (row: T) => string;
  filters?: DataTableFilter<T>[];
  selectable?: boolean;
  bulkActions?: (selectedIds: string[], clearSelection: () => void) => React.ReactNode;
  rowActions?: (row: T) => React.ReactNode;
  emptyMessage?: string;
  /** Server-side pagination passthrough — search/sort/filter apply only within the currently loaded page. */
  page?: number;
  onPageChange?: (page: number) => void;
  hasNextPage?: boolean;
  animateRows?: boolean;
}

type SortDirection = 'asc' | 'desc';

export function DataTable<T>({
  data,
  columns,
  getRowId,
  isLoading,
  searchPlaceholder = 'Search…',
  searchableText,
  filters = [],
  selectable = false,
  bulkActions,
  rowActions,
  emptyMessage = 'No results.',
  page,
  onPageChange,
  hasNextPage,
  animateRows = false,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ columnId: string; direction: SortDirection } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let rows = data ?? [];

    if (search.trim() && searchableText) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((row) => searchableText(row).toLowerCase().includes(q));
    }

    for (const filter of filters) {
      const selected = activeFilters[filter.id];
      if (selected) {
        rows = rows.filter((row) => filter.getValue(row) === selected);
      }
    }

    if (sort) {
      const column = columns.find((c) => c.id === sort.columnId);
      if (column?.sortValue) {
        rows = [...rows].sort((a, b) => {
          const av = column.sortValue!(a);
          const bv = column.sortValue!(b);
          const cmp = av < bv ? -1 : av > bv ? 1 : 0;
          return sort.direction === 'asc' ? cmp : -cmp;
        });
      }
    }

    return rows;
  }, [data, search, activeFilters, filters, sort, columns]);

  function toggleSort(columnId: string) {
    setSort((prev) => {
      if (!prev || prev.columnId !== columnId) return { columnId, direction: 'asc' };
      if (prev.direction === 'asc') return { columnId, direction: 'desc' };
      return null;
    });
  }

  function toggleRow(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds((prev) => {
      if (prev.size === filtered.length && filtered.length > 0) return new Set();
      return new Set(filtered.map(getRowId));
    });
  }

  const clearSelection = () => setSelectedIds(new Set());
  const hasActiveFilters = search.trim() !== '' || Object.values(activeFilters).some(Boolean);

  if (isLoading) {
    return <TableSkeleton columns={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)} />;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {searchableText && (
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="pl-8"
            />
          </div>
        )}

        {filters.map((filter) => (
          <Select
            key={filter.id}
            value={activeFilters[filter.id] ?? ''}
            onValueChange={(value) =>
              setActiveFilters((prev) => ({ ...prev, [filter.id]: (value as string) ?? '' }))
            }
          >
            <SelectTrigger className="w-fit">
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All {filter.label}</SelectItem>
              {filter.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              setActiveFilters({});
            }}
          >
            <X className="size-3.5" />
            Clear
          </Button>
        )}

        {selectable && selectedIds.size > 0 && bulkActions && (
          <div className="flex items-center gap-2 sm:ml-auto">
            <span className="text-muted-foreground text-xs">{selectedIds.size} selected</span>
            {bulkActions(Array.from(selectedIds), clearSelection)}
          </div>
        )}
      </div>

      <div className="border-border/60 overflow-hidden rounded-2xl border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {selectable && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={filtered.length > 0 && selectedIds.size === filtered.length}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead
                  key={col.id}
                  className={cn(
                    'text-xs font-semibold tracking-wide text-muted-foreground uppercase',
                    col.className,
                    col.sortValue && 'cursor-pointer select-none'
                  )}
                  onClick={() => col.sortValue && toggleSort(col.id)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortValue &&
                      (sort?.columnId === col.id ? (
                        sort.direction === 'asc' ? (
                          <ArrowUp className="size-3" />
                        ) : (
                          <ArrowDown className="size-3" />
                        )
                      ) : (
                        <ArrowUpDown className="size-3 opacity-30" />
                      ))}
                  </span>
                </TableHead>
              ))}
              {rowActions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr:nth-child(even)]:bg-muted/40">
            {filtered.map((row, index) => {
              const id = getRowId(row);
              return (
                <TableRow
                  key={id}
                  className={cn(animateRows && 'animate-in fade-in slide-in-from-bottom-1')}
                  style={animateRows ? { animationDelay: `${index * 20}ms`, animationDuration: '300ms' } : undefined}
                  data-state={selectedIds.has(id) ? 'selected' : undefined}
                >
                  {selectable && (
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(id)}
                        onCheckedChange={() => toggleRow(id)}
                        aria-label="Select row"
                      />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell key={col.id} className={col.className}>
                      {col.cell(row)}
                    </TableCell>
                  ))}
                  {rowActions && <TableCell className="text-right">{rowActions(row)}</TableCell>}
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                  className="text-muted-foreground h-32 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {page !== undefined && onPageChange && (
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => onPageChange(Math.max(0, page - 1))} disabled={page === 0}>
            Previous
          </Button>
          <span className="text-muted-foreground text-sm">Page {page + 1}</span>
          <Button variant="outline" onClick={() => onPageChange(page + 1)} disabled={!hasNextPage}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
