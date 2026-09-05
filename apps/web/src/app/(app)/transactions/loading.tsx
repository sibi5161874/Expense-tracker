import { Skeleton } from '@/components/ui/skeleton';

/**
 * Next.js route-level Suspense fallback — shown only while this route segment itself is
 * being loaded (initial navigation / prefetch), not while `useTransactions()` refetches after
 * mount. That post-mount loading state is still `DataTable`'s own `isLoading` prop; this file
 * only covers the gap before the client component exists at all.
 */
export default function TransactionsLoading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
