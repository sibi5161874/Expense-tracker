'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Percent,
  CheckCircle2,
  Lock,
  Layers,
  FileCheck2,
} from 'lucide-react';
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
            <div className="flex items-center gap-2 uppercase tracking-widest font-semibold text-[11px]">
              <span className="size-2 rounded-full bg-emerald-500 inline-block" />
              <span>Sovereign Wealth Reporting Suite</span>
              <span className="text-border">•</span>
              <span>FY 2024-25 Budget Compliant</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Lock className="size-3.5 text-primary" />
                Local-First Decryption
              </span>
              <span className="text-border">|</span>
              <span className="font-mono text-foreground font-semibold">16 Reports Ready</span>
            </div>
          </div>

          {/* Hero Header */}
          <div className="mt-8 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/60 border border-border/80 text-xs font-semibold text-foreground mb-4">
              <CheckCircle2 className="size-3.5 text-emerald-600" />
              <span>Built for High-Net-Worth Indian Investors &amp; Family Portfolios</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-6xl font-medium tracking-tight text-foreground leading-tight">
              16 reports. One dashboard.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed">
              Stop guessing. Get CA-ready reports, capital gains analysis, and XIRR tracking engineered precisely for ITR-2 / ITR-3 schedules.
            </p>
          </div>

          {/* 3 Featured High-Fidelity Report Cards */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Net Worth Trajectory */}
            <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    Wealth Overview
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">REP-01</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">Net Worth Trajectory</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Consolidated historical net worth evolution across all 14 asset classes with inflation adjustment toggles.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 bg-muted/20 p-4 rounded-xl border border-border/40">
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground font-semibold block">Portfolio Net Value</span>
                    <span className="font-serif text-2xl font-semibold text-foreground">₹1,48,20,540</span>
                  </div>
                  <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="size-3.5" /> +24.8%
                  </span>
                </div>

                <div className="h-16 w-full pt-1">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 300 70">
                    <defs>
                      <linearGradient id="grad-report-1" x1="0%" x2="0%" y1="0%" y2="100%">
                        <stop offset="0%" stopColor="#15803d" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#15803d" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path d="M 0,55 Q 40,50 80,40 T 160,28 T 230,18 T 300,6 L 300,70 L 0,70 Z" fill="url(#grad-report-1)" />
                    <path d="M 0,55 Q 40,50 80,40 T 160,28 T 230,18 T 300,6" fill="none" stroke="#15803d" strokeWidth="2.2" strokeLinecap="round" />
                    <circle cx="300" cy="6" r="3.5" fill="#15803d" />
                  </svg>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-2 border-t border-border/40 mt-2">
                  <span className="font-medium text-foreground">Trailing 12 Cycles</span>
                  <span className="font-mono">Real vs Nominal: 8.2%</span>
                </div>
              </div>
            </div>

            {/* Card 2: Capital Gains Tax Schedule */}
            <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    CA-Ready Tax
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">REP-02</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">Capital Gains Tax Schedule</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  STCG (20%) and LTCG (12.5%) calculations compliant with revised Union Budget 2024 regulations. Ready for ITR-2 &amp; ITR-3.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 bg-muted/20 p-4 rounded-xl border border-border/40 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">Section 112A / 111A</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold text-[11px]">Est. Tax: ₹74,320</span>
                </div>

                <div className="overflow-x-auto text-[11px]">
                  <table className="w-full text-left font-mono">
                    <tbody className="divide-y divide-border/40">
                      <tr>
                        <td className="py-1 font-sans text-foreground">HDFC Bank</td>
                        <td className="py-1 text-center"><span className="px-1 rounded bg-muted text-[10px]">LTCG</span></td>
                        <td className="py-1 text-right text-emerald-600 dark:text-emerald-400">+1,84,200</td>
                        <td className="py-1 text-right text-muted-foreground">12.5%</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-sans text-foreground">Tata Motors</td>
                        <td className="py-1 text-center"><span className="px-1 rounded bg-muted text-[10px]">STCG</span></td>
                        <td className="py-1 text-right text-emerald-600 dark:text-emerald-400">+42,150</td>
                        <td className="py-1 text-right text-muted-foreground">20.0%</td>
                      </tr>
                      <tr>
                        <td className="py-1 font-sans text-foreground">PPFAS Flexi</td>
                        <td className="py-1 text-center"><span className="px-1 rounded bg-muted text-[10px]">LTCG</span></td>
                        <td className="py-1 text-right text-emerald-600 dark:text-emerald-400">+3,12,000</td>
                        <td className="py-1 text-right text-muted-foreground">12.5%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1">
                  <span>✓ Pre-2018 NAVs grandfathered</span>
                  <span className="font-mono">₹1.25L Exemption Applied</span>
                </div>
              </div>
            </div>

            {/* Card 3: XIRR & Annualized Returns */}
            <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    Portfolio Returns
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">REP-03</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground">XIRR &amp; Annualized Returns</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  Money-weighted internal rate of return factoring in every SIP installment, bonus share, and dividend cashflow.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50 bg-muted/20 p-4 rounded-xl border border-border/40 space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground font-semibold">3-Year Trailing XIRR</span>
                    <div className="font-serif text-3xl font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      18.64%
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-muted-foreground font-semibold">Nifty 50 TRI</span>
                    <div className="font-mono text-base font-semibold text-muted-foreground mt-0.5">13.20%</div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                    <span>Alpha Generated</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">+5.44% Over Benchmark</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full w-[76%]" />
                  </div>
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
                    {report.category}
                  </span>
                  <h3 className="mt-1.5 text-sm font-semibold text-foreground">{report.title}</h3>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{report.description}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-border/40 flex items-center justify-between text-xs">
                  <span className="font-mono text-[11px] text-muted-foreground">Excel / PDF</span>
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

          {/* Bottom CTA */}
          <div className="mt-20 text-center bg-muted/30 border border-border/80 rounded-2xl p-10">
            <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground">
              All 16 reports available with your own data.
            </h2>
            <p className="text-muted-foreground mt-2 max-w-lg mx-auto text-sm">
              Free to view on-screen, instant export to Excel &amp; PDF for CA review in Pro.
            </p>
            <div className="mt-6">
              <Link
                href="/signup"
                className="bg-primary text-primary-foreground group inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold shadow hover:brightness-95 transition-all"
              >
                <span>Get Started for Free</span>
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
