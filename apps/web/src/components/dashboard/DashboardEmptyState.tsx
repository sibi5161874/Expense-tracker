import Link from 'next/link';
import { PlusCircle, Sparkles } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';

export function DashboardEmptyState() {
  return (
    <EmptyState
      icon={Sparkles}
      title="Your dashboard is ready"
      description="Log your first transaction to see income, expenses, and net worth come together here."
      action={
        <Button nativeButton={false} render={<Link href="/transactions" />}>
          <PlusCircle className="size-4" />
          Add your first transaction
        </Button>
      }
    />
  );
}
