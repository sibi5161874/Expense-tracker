'use client';

import { useMemo, useState } from 'react';
import { Search, ArrowUp, ArrowDown, ArrowUpDown, X, ChevronLeft, ChevronRight } from 'lucide-react';
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
  /** Total row count across all pages and the server's page size — when both are given, the
   * footer renders "Page X of Y" with numbered page buttons instead of the plain Previous/Next
   * fallback used when the caller doesn't know the total (hasNextPage stays the source of
   * truth for whether Next is enabled in that fallback mode). */
  totalCount?: number;
  pageSize?: number;
  /** Renders a "Rows per page" select next to the pagination info when provided, alongside `totalCount`. */
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  animateRows?: boolean;
}

type SortDirection = 'asc' | 'desc';

/**
 * Numbered-pagination range with ellipsis gaps — always keeps the first and last page
 * visible plus a window of `siblingCount` pages around the current one, collapsing anything
 * further away into a single "…" per side instead of listing every page.
 */
function paginationRange(current: number, total: number, siblingCount = 1): (number | 'ellipsis')[] {
  const totalNumbers = siblingCount * 2 + 5; // first + last + current + 2 ellipses + siblings
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
  page,
  onPageChange,
  hasNextPage,
  totalCount,
  pageSize = 50,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
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
  }, [data, search, activeFilters, filters, sort, columns, searchableText]);

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
              disabled={isLoading}
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

      {isLoading ? (
        <TableSkeleton columns={columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0)} />
      ) : (
      <div className="bg-card overflow-hidden rounded-2xl">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
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
          <TableBody className="[&_tr:nth-child(even)]:bg-muted/70">
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
      )}

      {!isLoading && page !== undefined && onPageChange && (
        <div className="bg-card border-border/60 rounded-2xl border px-4 py-3">
        {totalCount !== undefined ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
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
                    <SelectContent>
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
              >
                <ChevronLeft className="size-3.5" />
                Previous
              </Button>
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page + 1 >= Math.ceil(totalCount / pageSize)}
              >
                Next
                <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => onPageChange(Math.max(0, page - 1))} disabled={page === 0}>
              Previous
            </Button>
            <span className="text-muted-foreground text-sm">
              {filtered.length} {filtered.length === 1 ? 'row' : 'rows'} · Page {page + 1}
            </span>
            <Button variant="outline" onClick={() => onPageChange(page + 1)} disabled={!hasNextPage}>
              Next
            </Button>
          </div>
        )}
        </div>
      )}
    </div>
  );
}
