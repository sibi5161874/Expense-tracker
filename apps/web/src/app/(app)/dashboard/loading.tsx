import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';

/**
 * Next.js route-level Suspense fallback for /dashboard.
 * Displays during client route transitions before the client component tree mounts.
 */
export default function DashboardLoading() {
  return <DashboardSkeleton />;
}
