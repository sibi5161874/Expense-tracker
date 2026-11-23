import { Skeleton } from '@/components/ui/skeleton';

/**
 * Route-level Suspense fallback for /goals.
 * Mirrors the header and the grid of 3-column goal cards.
 */
export default function GoalsLoading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border/60 bg-card p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3.5 w-24" />
              </div>
              <Skeleton className="size-8 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
