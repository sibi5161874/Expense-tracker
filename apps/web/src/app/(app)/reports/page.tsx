import Link from 'next/link';
import { FileStack, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { ReportCard } from '@/components/reports/ReportCard';
import { REPORTS } from '@/lib/reportsRegistry';

const CATEGORIES = ['Expense', 'Investment', 'Combined'] as const;

export default function ReportsPage() {
  return (
    <div>
      <PageHeader
        title="Reports"
        description="Every report is downloadable as PDF, and as Excel where the data is tabular."
      />

      <Link
        href="/reports/overall"
        className="bg-primary/5 border-primary/30 hover:border-primary/50 group mb-10 flex items-center justify-between gap-3 rounded-2xl border p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="bg-primary text-primary-foreground flex size-10 shrink-0 items-center justify-center rounded-xl">
            <FileStack className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold">Overall Report</h3>
            <p className="text-muted-foreground mt-0.5 text-sm">
              All {REPORTS.length} reports combined into a single document. PDF download only.
            </p>
          </div>
        </div>
        <ChevronRight className="text-muted-foreground group-hover:text-foreground size-4 shrink-0" />
      </Link>

      <div className="space-y-10">
        {CATEGORIES.map((category) => (
          <section key={category}>
            <h2 className="mb-4 text-lg font-semibold">{category} Reports</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {REPORTS.filter((r) => r.category === category).map((report) => (
                <ReportCard key={report.slug} report={report} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
