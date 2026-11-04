'use client';

import { useState, type ReactNode } from 'react';
import { Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StickyHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  sticky?: boolean;
}

/**
 * Reusable sticky page header component for mobile and desktop.
 * On mobile, provides a sticky banner with high contrast, backdrop blur,
 * touch-friendly action area, and an expandable info tooltip for secondary descriptions.
 */
export function StickyHeader({
  title,
  description,
  action,
  className,
  sticky = true,
}: StickyHeaderProps) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div
      className={cn(
        'mb-5 w-full',
        sticky && 'sticky top-0 z-20 -mx-4 px-4 pt-1 pb-3 backdrop-blur-md md:static md:mx-0 md:px-0 md:pt-0 md:backdrop-blur-none',
        'border-b border-border/40 md:border-b-0',
        className
      )}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          {description && (
            <button
              type="button"
              onClick={() => setShowInfo((prev) => !prev)}
              aria-label={showInfo ? 'Hide description' : 'Show description'}
              className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 sm:hidden"
            >
              {showInfo ? <X className="size-4" /> : <Info className="size-4" />}
            </button>
          )}
        </div>

        {action && (
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 [&_button]:min-h-[44px] sm:[&_button]:min-h-0">
            {action}
          </div>
        )}
      </div>

      {description && (
        <p
          className={cn(
            'text-muted-foreground mt-1 text-xs sm:text-sm',
            'transition-all duration-200',
            showInfo ? 'block sm:block' : 'hidden sm:block'
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}

