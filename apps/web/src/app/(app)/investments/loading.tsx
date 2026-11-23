import { Skeleton } from '@/components/ui/skeleton';

/**
 * Route-level Suspense fallback for /investments.
 * Mirrors the header, controls, and table rows to eliminate layout shift on navigation.
 */
export default function InvestmentsLoading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-36" />
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between gap-4">
        <Skeleton className="h-10 w-64 rounded-lg" />
        <Skeleton className="h-10 w-48 rounded-lg" />
      </div>

      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    </div>
  );
}
