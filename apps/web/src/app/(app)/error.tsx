'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[AppError]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <AlertTriangle className="text-destructive size-10" />
      <div>
        <h1 className="text-lg font-semibold">This page hit an error</h1>
        <p className="text-muted-foreground mt-1 max-w-sm text-sm">
          The rest of the app is still fine — try reloading this page, or use the sidebar to go elsewhere.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
