import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  sticky?: boolean;
  className?: string;
}

export function PageHeader({ title, description, action, sticky = false, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4",
        sticky && "sticky top-0 z-20 -mx-4 px-4 py-2.5 bg-background/95 backdrop-blur-md border-b border-border/40 md:static md:mx-0 md:px-0 md:py-0 md:bg-transparent md:border-b-0",
        className
      )}
    >
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-muted-foreground mt-1 text-xs sm:text-sm">{description}</p>}
      </div>
      {action && (
        <div className="w-full sm:w-auto shrink-0 flex items-center gap-2 [&_button]:min-h-[44px] sm:[&_button]:min-h-0">
          {action}
        </div>
      )}
    </div>
  );
}
