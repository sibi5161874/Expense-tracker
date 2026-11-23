import Link from 'next/link';
import { PlusCircle, Sparkles, UploadCloud } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';

export function DashboardEmptyState() {
  return (
    <EmptyState
      icon={Sparkles}
      title="Your dashboard is ready"
      description="Track multi-bank cash flow, EPF, PPF, mutual funds, gold, and real estate in one unified Indian wealth dashboard."
      action={
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button nativeButton={false} render={<Link href="/transactions" />}>
            <PlusCircle className="size-4" />
            Add your first transaction
          </Button>
          <Button variant="outline" nativeButton={false} render={<Link href="/transactions" />}>
            <UploadCloud className="size-4" />
            Import Bank Statement
          </Button>
        </div>
      }
    />
  );
}
