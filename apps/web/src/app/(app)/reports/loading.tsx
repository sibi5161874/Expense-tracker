import { Skeleton } from '@/components/ui/skeleton';

/** Route-level Suspense fallback — see transactions/loading.tsx for why this doesn't replace
 * each report's own `isLoading` state, only the gap before this route's client component has
 * mounted at all. */
export default function ReportsLoading() {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
