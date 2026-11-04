'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, SearchX, ArrowUp, ArrowDown, ArrowUpDown, X, ChevronLeft, ChevronRight } from 'lucide-react';
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
  search?: string;
  onSearchChange?: (value: string) => void;
  filterValues?: Record<string, string>;
  onFilterChange?: (filterId: string, value: string) => void;
  page?: number;
  onPageChange?: (page: number) => void;
  hasNextPage?: boolean;
  totalCount?: number;
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  animateRows?: boolean;
  sort?: { columnId: string; direction: SortDirection } | null;
  onSortChange?: (next: { columnId: string; direction: SortDirection } | null) => void;
}

export type SortDirection = 'asc' | 'desc';

const EMPTY_FILTERS: Record<string, string> = {};

function paginationRange(current: number, total: number, siblingCount = 1): (number | 'ellipsis')[] {
  const totalNumbers = siblingCount * 2 + 5;
  if (total <= totalNumbers) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const leftSibling = Math.max(current - siblingCount, 1);
  const rightSibling = Math.min(current + siblingCount, total);
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < total - 1;

  const pages: (number | 'ellipsis')[] = [1];
  if (showLeftEllipsis) pages.push('ellipsis');
  for (let p = Math.max(leftSibling, 2); p <= Math.min(rightSibling, total - 1); p++) {
    pages.push(p);
  }
  if (showRightEllipsis) pages.push('ellipsis');
  pages.push(total);

  return pages;
}

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
  search: controlledSearch,
  onSearchChange,
  filterValues: controlledFilterValues,
  onFilterChange,
  page,
  onPageChange,
  hasNextPage,
  totalCount,
  pageSize = 50,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  animateRows = false,
  sort: controlledSort,
  onSortChange,
}: DataTableProps<T>) {
  const isSearchControlled = onSearchChange !== undefined;
  const isFilterControlled = onFilterChange !== undefined;
  const isSortControlled = onSortChange !== undefined;

  const [uncontrolledSearch, setUncontrolledSearch] = useState('');
  const [uncontrolledFilters, setUncontrolledFilters] = useState<Record<string, string>>({});
  const [uncontrolledSort, setUncontrolledSort] = useState<{ columnId: string; direction: SortDirection } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const search = isSearchControlled ? (controlledSearch ?? '') : uncontrolledSearch;
  const activeFilters = isFilterControlled ? (controlledFilterValues ?? EMPTY_FILTERS) : uncontrolledFilters;
  const activeSort = isSortControlled ? (controlledSort ?? null) : uncontrolledSort;

  const [localSearch, setLocalSearch] = useState(search);
  const [lastSearch, setLastSearch] = useState(search);
  if (search !== lastSearch) {
    setLastSearch(search);
    setLocalSearch(search);
  }
  useEffect(() => {
    if (!isSearchControlled) return;
    const timer = setTimeout(() => {
      if (localSearch !== search) onSearchChange(localSearch);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localSearch]);

  const filtered = useMemo(() => {
    let rows = data ?? [];

    if (!isSearchControlled && search.trim() && searchableText) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((row) => searchableText(row).toLowerCase().includes(q));
    }

    if (!isFilterControlled) {
      for (const filter of filters) {
        const selected = activeFilters[filter.id];
        if (selected) {
          rows = rows.filter((row) => filter.getValue(row) === selected);
        }
      }
    }

    if (!isSortControlled && activeSort) {
      const column = columns.find((c) => c.id === activeSort.columnId);
      if (column?.sortValue) {
        rows = [...rows].sort((a, b) => {
          const av = column.sortValue!(a);
          const bv = column.sortValue!(b);
          const cmp = av < bv ? -1 : av > bv ? 1 : 0;
          return activeSort.direction === 'asc' ? cmp : -cmp;
        });
      }
    }

    return rows;
  }, [data, search, activeFilters, filters, activeSort, columns, searchableText, isSearchControlled, isFilterControlled, isSortControlled]);

  function toggleSort(columnId: string) {
    const current = activeSort;
    const next: { columnId: string; direction: SortDirection } | null =
      !current || current.columnId !== columnId
        ? { columnId, direction: 'asc' }
        : current.direction === 'asc'
          ? { columnId, direction: 'desc' }
          : null;

    if (isSortControlled) onSortChange(next);
    else setUncontrolledSort(next);
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

  function setFilterValue(filterId: string, value: string) {
    if (isFilterControlled) {
      onFilterChange(filterId, value);
    } else {
      setUncontrolledFilters((prev) => ({ ...prev, [filterId]: value }));
    }
  }

  function clearSearchAndFilters() {
    setLocalSearch('');
    if (isSearchControlled) onSearchChange('');
    else setUncontrolledSearch('');
    if (isFilterControlled) {
      for (const filter of filters) onFilterChange(filter.id, '');
    } else {
      setUncontrolledFilters({});
    }
  }

  return (
    <div className="space-y-3">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-2">
        {(searchableText || isSearchControlled) && (
          <div className="relative w-full sm:w-auto sm:min-w-[200px] sm:max-w-xs flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
            <Input
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                if (!isSearchControlled) setUncontrolledSearch(e.target.value);
              }}
              placeholder={searchPlaceholder}
              className="pl-8"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => (
            <Select
              key={filter.id}
              value={activeFilters[filter.id] ?? ''}
              onValueChange={(value) => setFilterValue(filter.id, (value as string) ?? '')}
              disabled={isLoading}
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
            <Button variant="ghost" size="sm" onClick={clearSearchAndFilters}>
              <X className="size-3.5" />
              Clear
            </Button>
          )}
        </div>

        {selectable && selectedIds.size > 0 && bulkActions && (
          <div className="flex items-center gap-2 sm:ml-auto">
            <span className="text-muted-foreground text-xs">{selectedIds.size} selected</span>
            {bulkActions(Array.from(selectedIds), clearSelection)}
          </div>
        )}
      </div>

      {isLoading ? (
        <TableSkeleton columns={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)} />
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border/60">
          <div className="flex h-32 flex-col items-center justify-center gap-2">
            {hasActiveFilters ? (
              <>
                <SearchX className="text-muted-foreground size-6" aria-hidden="true" />
                <span className="text-muted-foreground text-sm">
                  No results{search.trim() ? ` for "${search.trim()}"` : ''}.
                </span>
                <Button variant="ghost" size="sm" onClick={clearSearchAndFilters}>
                  Clear search
                </Button>
              </>
            ) : (
              <span className="text-muted-foreground">{emptyMessage}</span>
            )}
          </div>
        </div>
      ) : (
        /* Real Data Table on All Viewports with Smooth Horizontal Scroll on Mobile */
        <div className="relative w-full overflow-hidden rounded-2xl border border-border/70 bg-card shadow-xs">
          {/* Subtle scroll hint gradient on mobile right edge */}
          <div
            className="pointer-events-none absolute top-0 right-0 bottom-0 z-10 w-8 bg-gradient-to-l from-card via-card/70 to-transparent md:hidden"
            aria-hidden="true"
          />

          <div className="w-full overflow-x-auto scrollbar-thin overscroll-x-contain">
            <Table className="min-w-[640px] w-full text-left">
              <TableHeader>
                <TableRow className="bg-muted/70 hover:bg-muted/70 border-b border-border/60">
                  {selectable && (
                    <TableHead className="w-12 px-3 text-center">
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
                        'h-11 px-3.5 text-xs font-semibold text-muted-foreground whitespace-nowrap',
                        col.className,
                        col.sortValue && 'cursor-pointer select-none hover:text-foreground'
                      )}
                      onClick={() => col.sortValue && toggleSort(col.id)}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        {col.header}
                        {col.sortValue &&
                          (activeSort?.columnId === col.id ? (
                            activeSort.direction === 'asc' ? (
                              <ArrowUp className="size-3 text-foreground" />
                            ) : (
                              <ArrowDown className="size-3 text-foreground" />
                            )
                          ) : (
                            <ArrowUpDown className="size-3 opacity-35" />
                          ))}
                      </span>
                    </TableHead>
                  ))}
                  {rowActions && (
                    <TableHead className="text-right px-3.5 h-11 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody className="[&_tr:nth-child(even)]:bg-muted/30 divide-y divide-border/20">
                {filtered.map((row, index) => {
                  const id = getRowId(row);
                  return (
                    <TableRow
                      key={id}
                      className={cn(
                        'transition-colors hover:bg-muted/40 border-b border-border/20 last:border-0',
                        animateRows && 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1'
                      )}
                      style={animateRows ? { animationDelay: `${index * 20}ms`, animationDuration: '300ms' } : undefined}
                      data-state={selectedIds.has(id) ? 'selected' : undefined}
                    >
                      {selectable && (
                        <TableCell className="w-12 px-3 text-center">
                          <Checkbox
                            checked={selectedIds.has(id)}
                            onCheckedChange={() => toggleRow(id)}
                            aria-label="Select row"
                          />
                        </TableCell>
                      )}
                      {columns.map((col) => (
                        <TableCell key={col.id} className={cn('px-3.5 py-3 align-middle whitespace-nowrap text-sm', col.className)}>
                          {col.cell(row)}
                        </TableCell>
                      ))}
                      {rowActions && (
                        <TableCell className="text-right px-3.5 py-3 align-middle whitespace-nowrap">
                          {rowActions(row)}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
                {pageSize && filtered.length < pageSize && (
                  Array.from({ length: pageSize - filtered.length }).map((_, i) => (
                    <TableRow
                      key={`empty-placeholder-${i}`}
                      className="h-[49px] border-border/20 hover:bg-transparent pointer-events-none select-none"
                      aria-hidden="true"
                    >
                      <TableCell
                        colSpan={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)}
                        className="h-[49px] py-0 text-transparent"
                      >
                        &nbsp;
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Pagination Bar */}
      {!isLoading && page !== undefined && onPageChange && (
        <div className="bg-card border-border/60 rounded-2xl border p-3 sm:px-4 sm:py-3 shadow-xs">
          {totalCount !== undefined ? (
            <>
              {/* Mobile pagination layout (clean 2-row thumb-friendly design) */}
              <div className="flex flex-col gap-2.5 sm:hidden">
                <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
                  <span className="font-medium">
                    Page {page + 1} of {Math.max(1, Math.ceil(totalCount / pageSize))}
                  </span>
                  {onPageSizeChange && (
                    <div className="flex items-center gap-1.5">
                      <span>Rows:</span>
                      <Select
                        value={String(pageSize)}
                        onValueChange={(value) => onPageSizeChange(Number(value))}
                      >
                        <SelectTrigger size="sm" className="h-7 w-16 px-2 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent collisionAvoidance={{ side: 'flip' }}>
                          {pageSizeOptions.map((size) => (
                            <SelectItem key={size} value={String(size)}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-full rounded-xl text-xs font-medium gap-1"
                    onClick={() => onPageChange(Math.max(0, page - 1))}
                    disabled={page === 0}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="size-3.5" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-full rounded-xl text-xs font-medium gap-1"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page + 1 >= Math.ceil(totalCount / pageSize)}
                    aria-label="Next page"
                  >
                    Next
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/* Desktop pagination layout (identical to original) */}
              <div className="hidden sm:flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground text-sm">
                    Page {page + 1} of {Math.max(1, Math.ceil(totalCount / pageSize))}
                  </span>
                  {onPageSizeChange && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground text-sm">Rows per page</span>
                      <Select
                        value={String(pageSize)}
                        onValueChange={(value) => onPageSizeChange(Number(value))}
                      >
                        <SelectTrigger size="sm" className="w-[70px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent collisionAvoidance={{ side: 'flip' }}>
                          {pageSizeOptions.map((size) => (
                            <SelectItem key={size} value={String(size)}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.max(0, page - 1))}
                    disabled={page === 0}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="size-3.5" />
                    <span>Previous</span>
                  </Button>
                  <div className="flex items-center gap-1">
                    {paginationRange(page + 1, Math.max(1, Math.ceil(totalCount / pageSize))).map((p, i) =>
                      p === 'ellipsis' ? (
                        <span key={`ellipsis-${i}`} className="text-muted-foreground px-1.5 text-sm">
                          …
                        </span>
                      ) : (
                        <Button
                          key={p}
                          variant={p === page + 1 ? 'default' : 'outline'}
                          size="sm"
                          className="w-8 px-0"
                          onClick={() => onPageChange(p - 1)}
                        >
                          {p}
                        </Button>
                      )
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page + 1 >= Math.ceil(totalCount / pageSize)}
                    aria-label="Next page"
                  >
                    <span>Next</span>
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Mobile pagination without totalCount */}
              <div className="flex flex-col gap-2 sm:hidden">
                <span className="text-muted-foreground text-xs text-center font-medium">
                  {filtered.length} {filtered.length === 1 ? 'row' : 'rows'} · Page {page + 1}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-full rounded-xl text-xs font-medium gap-1"
                    onClick={() => onPageChange(Math.max(0, page - 1))}
                    disabled={page === 0}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="size-3.5" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-full rounded-xl text-xs font-medium gap-1"
                    onClick={() => onPageChange(page + 1)}
                    disabled={!hasNextPage}
                    aria-label="Next page"
                  >
                    Next
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              </div>

              {/* Desktop pagination without totalCount */}
              <div className="hidden sm:flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(Math.max(0, page - 1))}
                  disabled={page === 0}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="size-3.5" />
                  <span>Previous</span>
                </Button>
                <span className="text-muted-foreground text-sm">
                  {filtered.length} {filtered.length === 1 ? 'row' : 'rows'} · Page {page + 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange(page + 1)}
                  disabled={!hasNextPage}
                  aria-label="Next page"
                >
                  <span>Next</span>
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
