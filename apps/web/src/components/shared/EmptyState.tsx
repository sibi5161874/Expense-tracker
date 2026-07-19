import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

/** Shared full-region empty state — one centered icon circle, never per-item badges. */
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="animate-in fade-in-0 duration-300">
      <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="bg-accent text-accent-foreground flex size-14 items-center justify-center rounded-full">
          <Icon className="size-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-muted-foreground mx-auto max-w-sm text-sm">{description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
