import { Skeleton } from '@/components/ui/skeleton';

/** Route-level Suspense fallback — see transactions/loading.tsx for why this doesn't replace
 * the asset hooks' own `isLoading` states, only the gap before this route's client component
 * has mounted at all. */
export default function AssetsLoading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-24 shrink-0 rounded-full" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
