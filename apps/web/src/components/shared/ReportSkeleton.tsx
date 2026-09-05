import { Skeleton } from '@/components/ui/skeleton';

/**
 * Content-shaped loading state for a report, used in place of a generic spinner while its
 * data resolves. Approximates the shape most reports share (title/description, a chart or
 * summary card, a data table beneath it) rather than one custom skeleton per report — a
 * closer visual match than a spinner without needing 13+ bespoke layouts.
 */
export function ReportSkeleton() {
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
