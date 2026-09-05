'use client';

import { REPORTS } from '@/lib/reportsRegistry';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { FadeIn } from '@/components/landing/FadeIn';
import { CashFlowChart } from '@/components/shared/CashFlowChart';
import { ExpenseBreakdownChart } from '@/components/shared/ExpenseBreakdownChart';
import { StackedAreaChart } from '@/components/shared/StackedAreaChart';

// Illustrative only — this is a public marketing page with no signed-in user, so there's no
// real data to show. Shapes and magnitudes are representative of an actual monthly household
// budget so the charts read as trustworthy previews, not as someone's real numbers.
const SAMPLE_CASH_FLOW = [
  { label: 'Apr', income: 85000, expense: 52000 },
  { label: 'May', income: 85000, expense: 61000 },
  { label: 'Jun', income: 92000, expense: 58000 },
  { label: 'Jul', income: 85000, expense: 49000 },
  { label: 'Aug', income: 88000, expense: 63000 },
  { label: 'Sep', income: 85000, expense: 54000 },
];

const SAMPLE_CATEGORY_BREAKDOWN = [
  { name: 'Rent', value: 22000 },
  { name: 'Groceries', value: 12500 },
  { name: 'Transport', value: 6200 },
  { name: 'Utilities', value: 4800 },
  { name: 'Dining', value: 5100 },
  { name: 'Shopping', value: 3900 },
];

const SAMPLE_SPENDING_TREND = [
  { label: 'Apr', Groceries: 11000, Rent: 22000, Transport: 5800, Dining: 4200, Other: 9000 },
  { label: 'May', Groceries: 12200, Rent: 22000, Transport: 6100, Dining: 5300, Other: 15400 },
  { label: 'Jun', Groceries: 11800, Rent: 22000, Transport: 5900, Dining: 4700, Other: 13600 },
  { label: 'Jul', Groceries: 10500, Rent: 22000, Transport: 5200, Dining: 3900, Other: 7400 },
  { label: 'Aug', Groceries: 13100, Rent: 22000, Transport: 6400, Dining: 6000, Other: 15500 },
  { label: 'Sep', Groceries: 12500, Rent: 22000, Transport: 6200, Dining: 5100, Other: 8100 },
];

export default function ReportsOverviewPage() {
  return (
    <div className="bg-background text-foreground min-h-full">
      <LandingNavbar />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            {REPORTS.length} ways to see your wealth. All free to view.
          </h1>
          <p className="text-muted-foreground mt-4 text-lg">
            From monthly cash flow to portfolio P&amp;L — every report ships in the free tier, and
            every one of them is a real chart, not a spreadsheet dump.
          </p>
        </FadeIn>

        <FadeIn delay={0.1} className="mt-14 grid gap-6 lg:grid-cols-2">
          <div className="border-border/60 bg-card rounded-3xl border p-6">
            <h2 className="text-sm font-semibold">Monthly Summary — Cash Flow</h2>
            <p className="text-muted-foreground mt-1 text-xs">Income vs. expense, month over month.</p>
            <div className="mt-4">
              <CashFlowChart data={SAMPLE_CASH_FLOW} />
            </div>
          </div>
          <div className="border-border/60 bg-card rounded-3xl border p-6">
            <h2 className="text-sm font-semibold">Category Breakdown</h2>
            <p className="text-muted-foreground mt-1 text-xs">Where this month&apos;s spending actually went.</p>
            <div className="mt-4">
              <ExpenseBreakdownChart data={SAMPLE_CATEGORY_BREAKDOWN} />
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.15} className="mt-6">
          <div className="border-border/60 bg-card rounded-3xl border p-6">
            <h2 className="text-sm font-semibold">Spending Trend</h2>
            <p className="text-muted-foreground mt-1 text-xs">Top expense categories over the last 6 months.</p>
            <div className="mt-4">
              <StackedAreaChart
                data={SAMPLE_SPENDING_TREND}
                xKey="label"
                series={['Rent', 'Groceries', 'Transport', 'Dining', 'Other']}
              />
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.2} className="mt-2 text-center">
          <p className="text-muted-foreground mt-4 text-xs">
            Sample data shown for illustration — your dashboard fills in with your own transactions.
          </p>
        </FadeIn>

        <FadeIn delay={0.25} className="mt-16">
          <h2 className="text-center text-xl font-semibold">Every report included</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {REPORTS.map((report, i) => (
              <FadeIn key={report.slug} delay={(i % 4) * 0.06}>
                <div className="border-border/60 bg-card h-full rounded-2xl border p-5">
                  <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
                    {report.category}
                  </span>
                  <h3 className="mt-1.5 text-sm font-semibold">{report.title}</h3>
                  <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">{report.description}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </FadeIn>
      </section>

      <LandingFooter />
    </div>
  );
}
