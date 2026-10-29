'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Lock } from 'lucide-react';
import { REPORTS, ReportMeta } from '@/lib/reportsRegistry';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { FadeIn } from '@/components/landing/FadeIn';

type FilterCategory = 'all' | 'tax' | 'portfolio' | 'allocation' | 'cashflow';

export default function ReportsOverviewPage() {
  const [filter, setFilter] = useState<FilterCategory>('all');

  const filteredReports = REPORTS.filter((report) => {
    if (filter === 'all') return true;
    if (filter === 'tax') return ['capital-gains', 'asset-maturity-calendar', 'year-in-review'].includes(report.slug);
    if (filter === 'portfolio') return ['portfolio-summary', 'xirr-analysis', 'dividend-income', 'best-worst-performers'].includes(report.slug);
    if (filter === 'allocation') return ['asset-allocation', 'net-worth', 'goal-progress'].includes(report.slug);
    if (filter === 'cashflow') return ['monthly-summary', 'budget-vs-actual', 'category-breakdown', 'spending-trend', 'account-flow', 'cashbook-net-position'].includes(report.slug);
    return true;
  });

  return (
    <div className="bg-background text-foreground min-h-full">
      <LandingNavbar />

      <section className="relative overflow-hidden pt-10 pb-20 px-4 sm:px-6 lg:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Overline Metadata Strip */}
          <div className="flex flex-wrap items-center justify-between pb-4 border-b border-border/60 text-xs text-muted-foreground gap-3">
            <div className="flex items-center gap-2 font-medium">
              <span className="size-2 rounded-full bg-success inline-block" />
              <span>Sovereign wealth reporting suite</span>
              <span className="text-border">·</span>
              <span>FY 2024-25 budget compliant</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Lock className="size-3.5 text-primary" />
                Local-first decryption
              </span>
              <span className="text-border">·</span>
              <span className="text-foreground font-semibold">{REPORTS.length} reports ready</span>
            </div>
          </div>

          {/* Hero Header */}
          <div className="mt-8 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/60 border border-border/80 text-xs font-semibold text-foreground mb-4">
              <CheckCircle2 className="size-3.5 text-success" />
              <span>Built for high-net-worth Indian investors and family portfolios</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-6xl font-medium tracking-tight text-foreground leading-tight">
              {REPORTS.length} reports. One dashboard.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
              Stop guessing. Get CA-ready reports, capital gains analysis, and XIRR tracking engineered precisely for ITR-2 / ITR-3 schedules.
            </p>
          </div>

          {/* Featured Report: Capital Gains Tax Schedule — the one not already shown in the hero */}
          <div className="mt-12 max-w-xl">
            <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-warning-subtle text-warning">
                    CA-ready tax
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">REP-02</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">Capital gains tax schedule</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  STCG (20%) and LTCG (12.5%) calculations compliant with revised Union Budget 2024 regulations. Ready for ITR-2 &amp; ITR-3.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 bg-muted/20 p-4 rounded-xl border border-border/40 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">Section 112A / 111A</span>
                  <span className="font-mono text-warning font-semibold text-[11px]">Est. tax: ₹74,320</span>
                </div>

                <div className="overflow-x-auto text-[11px]">
                  <table className="w-full text-left font-mono">
                    <tbody className="divide-y divide-border/40">
                      <tr>
                        <td className="py-1 font-sans text-foreground">HDFC Bank</td>
                        <td className="py-1 text-center"><span className="px-1 rounded bg-muted text-[10px]">LTCG</span></td>
                        <td className="py-1 text-right text-success">+1,84,200</td>
                        <td className="py-1 text-right text-muted-foreground">12.5%</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-sans text-foreground">Tata Motors</td>
                        <td className="py-1 text-center"><span className="px-1 rounded bg-muted text-[10px]">STCG</span></td>
                        <td className="py-1 text-right text-success">+42,150</td>
                        <td className="py-1 text-right text-muted-foreground">20.0%</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-sans text-foreground">PPFAS Flexi</td>
                        <td className="py-1 text-center"><span className="px-1 rounded bg-muted text-[10px]">LTCG</span></td>
                        <td className="py-1 text-right text-success">+3,12,000</td>
                        <td className="py-1 text-right text-muted-foreground">12.5%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                  <span>Pre-2018 NAVs grandfathered</span>
                  <span className="font-mono">₹1.25L exemption applied</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="mt-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
            <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl overflow-x-auto max-w-full">
              {(
                [
                  { id: 'all', label: `All Reports (${REPORTS.length})` },
                  { id: 'tax', label: 'Tax & CA-Ready' },
                  { id: 'portfolio', label: 'Portfolio & XIRR' },
                  { id: 'allocation', label: 'Asset Allocation' },
                  { id: 'cashflow', label: 'Cash Flow & Runway' },
                ] as const
              ).map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setFilter(id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    filter === id
                      ? 'bg-card text-foreground font-semibold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="text-xs text-muted-foreground">
              Showing {filteredReports.length} of {REPORTS.length} available reports
            </div>
          </div>

          {/* Full Grid of Reports */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filteredReports.map((report) => (
              <div
                key={report.slug}
                className="bg-card border border-border/70 hover:border-border rounded-xl p-5 shadow-xs flex flex-col justify-between transition-colors"
              >
                <div>
                  <span className="text-[11px] font-medium text-muted-foreground">{report.category}</span>
                  <h3 className="mt-1.5 text-sm font-semibold text-foreground">{report.title}</h3>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{report.description}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-muted-foreground">Excel / PDF</span>
                  <Link
                    href="/signup"
                    className="text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>View</span>
                    <ArrowRight className="size-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
