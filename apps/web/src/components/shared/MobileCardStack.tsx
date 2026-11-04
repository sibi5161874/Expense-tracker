'use client';

import * as React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

export interface MobileCardColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
}

export interface MobileCardStackProps<T> {
  data: T[];
  getRowId: (row: T) => string;
  columns: MobileCardColumn<T>[];
  selectedIds?: Set<string>;
  onToggleRow?: (id: string) => void;
  selectable?: boolean;
  rowActions?: (row: T) => React.ReactNode;
  animateRows?: boolean;
  className?: string;
}

/**
 * Mobile-first card stack renderer for tabular datasets.
 * Displays below `md:`, rendering the first column as the primary title/entity
 * and subsequent columns in a clean 2-column key-value grid, with row actions
 * pinned to the top right.
 */
export function MobileCardStack<T>({
  data,
  getRowId,
  columns,
  selectedIds,
  onToggleRow,
  selectable = false,
  rowActions,
  animateRows = false,
  className,
}: MobileCardStackProps<T>) {
  if (!data || data.length === 0) return null;

  const [primary, ...rest] = columns;

  return (
    <div className={cn('space-y-2.5 md:hidden', className)}>
      {data.map((row, index) => {
        const id = getRowId(row);
        const isSelected = selectedIds ? selectedIds.has(id) : false;

        return (
          <div
            key={id}
            className={cn(
              'bg-card space-y-2.5 rounded-2xl border border-border/60 p-4 transition-colors',
              animateRows && 'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1',
              isSelected && 'border-primary/50 bg-primary/5'
            )}
            style={animateRows ? { animationDelay: `${index * 20}ms`, animationDuration: '300ms' } : undefined}
          >
            {/* Header: Select box, Primary column cell, and Row Actions */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                {selectable && onToggleRow && (
                  <div className="flex min-h-[44px] min-w-[36px] items-center justify-center -ml-1">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleRow(id)}
                      aria-label="Select row"
                      className="shrink-0 size-4.5"
                    />
                  </div>
                )}
                {primary && (
                  <div className="min-w-0 flex-1 truncate font-medium text-foreground">
                    {primary.cell(row)}
                  </div>
                )}
              </div>
              {rowActions && (
                <div className="-mr-1.5 shrink-0 flex items-center [&_button]:min-h-[44px] [&_button]:min-w-[44px] [&_button]:size-11 [&_button]:rounded-xl">
                  {rowActions(row)}
                </div>
              )}
            </div>

            {/* Body: Secondary attributes in a responsive 2-column grid */}
            {rest.length > 0 && (
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border/40 pt-2 text-sm">
                {rest.map((col) => (
                  <div key={col.id} className="min-w-0 space-y-0.5">
                    <span className="text-muted-foreground block text-xs font-medium">
                      {col.header}
                    </span>
                    <div className="truncate text-foreground text-xs sm:text-sm">
                      {col.cell(row)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
