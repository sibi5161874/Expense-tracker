import Link from 'next/link';
import { FileQuestion } from 'lucide-react';

/**
 * Rendered for any unmatched route. Links home rather than to /dashboard because this is
 * reachable while logged out too — the root route sends signed-in users to the dashboard
 * and everyone else to the landing page, so "/" is correct for both.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 p-8 text-center">
      <FileQuestion className="text-muted-foreground size-10" />
      <div>
        <h1 className="text-lg font-semibold">Page not found</h1>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          That page doesn&apos;t exist, or it may have moved.
        </p>
      </div>
      <Link
        href="/"
        className="bg-primary text-primary-foreground rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all hover:brightness-95 active:scale-[0.98]"
      >
        Go home
      </Link>
    </div>
  );
}
