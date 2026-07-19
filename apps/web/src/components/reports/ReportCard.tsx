import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { ReportMeta } from '@/lib/reportsRegistry';

export function ReportCard({ report }: { report: ReportMeta }) {
  return (
    <Link
      href={`/reports/${report.slug}`}
      className="bg-card border-border/60 hover:border-primary/40 group flex items-start justify-between gap-3 rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div>
        <h3 className="font-semibold">{report.title}</h3>
        <p className="text-muted-foreground mt-1 text-sm">{report.description}</p>
      </div>
      <ChevronRight className="text-muted-foreground group-hover:text-foreground mt-1 size-4 shrink-0" />
    </Link>
  );
}
