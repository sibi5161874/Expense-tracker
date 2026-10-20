'use client';

import Link from 'next/link';
import {
  ArrowRight,
  UploadCloud,
  CheckCircle2,
  Lock,
  TrendingUp,
  FileCheck2,
  FileSpreadsheet,
  PieChart,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { FadeIn } from '@/components/landing/FadeIn';

export default function HowItWorksPage() {
  return (
    <div className="bg-background text-foreground min-h-full">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6 lg:px-12 text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-muted/60 border border-border/80 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6 shadow-xs">
            <span className="size-2 rounded-full bg-primary animate-pulse" />
            <span>Zero Setup Friction • Local-First Architecture</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl font-medium tracking-tight text-foreground max-w-3xl mx-auto leading-tight">
            Three steps to total financial clarity.
          </h1>

          <p className="text-muted-foreground mt-5 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            No bank passwords to surrender. No invasive data broker trackers. Complete sovereign financial oversight in three effortless steps.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <span>CAMS &amp; KFintech Native</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Lock className="size-4 text-primary" />
              <span>Zero-Knowledge Decryption</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Zap className="size-4 text-amber-500" />
              <span>3-Second Schema Parsing</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main 3-Step Narrative */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-24 pb-28">
        {/* STEP 1: IMPORT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              Step 01 • Import
            </div>
            <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground leading-tight">
              Drag and drop your bank or broker CSV. We auto-detect the rest.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Say goodbye to manual data entry. Upload your CAMS or KFintech CAS PDF statements, Zerodha/Groww tradebooks, or standard bank statement CSVs. KashMap&apos;s proprietary engine auto-detects column schemas, deduplicates transactions, and matches ISINs in under 3 seconds.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
              <span>Supports 14+ Indian depositories, AMCs, and neo-brokers.</span>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-card rounded-2xl border border-border/80 shadow-md p-6 space-y-5">
              {/* Dropzone */}
              <div className="border border-dashed border-border/80 bg-muted/30 rounded-xl p-7 text-center">
                <UploadCloud className="size-8 text-primary mx-auto mb-2" />
                <p className="text-sm font-semibold text-foreground">Drop your CAS statement or Broker CSV here</p>
                <p className="text-xs text-muted-foreground mt-1">
                  or <span className="text-primary font-medium underline underline-offset-4 cursor-pointer">browse file from device</span> (PDF, CSV, XLSX)
                </p>
              </div>

              {/* Parsing State */}
              <div className="bg-muted/20 border border-border/40 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5 truncate">
                    <FileSpreadsheet className="size-5 text-emerald-600 shrink-0" />
                    <div className="truncate">
                      <p className="font-semibold text-foreground truncate">CAS_Consolidated_2024.pdf</p>
                      <p className="text-[11px] text-muted-foreground">1.8 MB • Encrypted Parser • Ready</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                    100% Parsed
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full w-full" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
                    Auto-Detected Schema Matches
                  </p>
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-background border border-border/60 text-foreground font-medium">
                      ✓ Date → Detected
                    </span>
                    <span className="px-2 py-0.5 rounded bg-background border border-border/60 text-foreground font-medium">
                      ✓ Folio → Matched
                    </span>
                    <span className="px-2 py-0.5 rounded bg-background border border-border/60 text-foreground font-medium">
                      ✓ ISIN → Verified
                    </span>
                    <span className="px-2 py-0.5 rounded bg-background border border-border/60 text-foreground font-medium">
                      ✓ NAV → Live
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40 text-xs text-muted-foreground">
                <Lock className="size-4 text-primary shrink-0" />
                <span>
                  <strong>Zero bank credentials requested.</strong> Statements are parsed client-side in memory inside your browser.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 2: ANALYZE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="order-2 lg:order-1 lg:col-span-7">
            <div className="bg-card rounded-2xl border border-border/80 shadow-md p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-muted/30 border border-border/50">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Consolidated Net Worth
                  </p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-serif text-3xl font-semibold text-foreground">₹1,48,92,450</span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
                      <TrendingUp className="size-3.5 mr-0.5" /> +14.2% YoY
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-background border border-border/60 text-xs font-medium text-foreground">
                  18.64% Trailing 3Y XIRR
                </span>
              </div>

              {/* Trajectory */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Trailing 12 Quarters Trajectory (FY22 - FY25)</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">High: ₹1.49 Cr</span>
                </div>
                <div className="w-full h-24 bg-muted/20 border border-border/40 rounded-xl p-2 flex items-end">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 400 80">
                    <defs>
                      <linearGradient id="wealthGradSteps" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#15803d" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#15803d" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <polygon
                      fill="url(#wealthGradSteps)"
                      points="0,75 35,70 70,64 105,58 140,55 175,48 210,40 245,36 280,28 315,22 350,15 390,6 390,80 0,80"
                    />
                    <polyline
                      fill="none"
                      points="0,75 35,70 70,64 105,58 140,55 175,48 210,40 245,36 280,28 315,22 350,15 390,6"
                      stroke="#15803d"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                    />
                    <circle cx="390" cy="6" r="4" fill="#15803d" />
                  </svg>
                </div>
              </div>

              {/* Multi-asset pill bar */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground uppercase tracking-wider text-[11px]">
                    Multi-Broker Allocation
                  </span>
                  <span className="text-muted-foreground">5 Unified Asset Buckets</span>
                </div>
                <div className="w-full h-3 rounded-full bg-muted flex overflow-hidden gap-0.5">
                  <div className="h-full bg-emerald-600 w-[43%]" title="Equities: 43%" />
                  <div className="h-full bg-amber-600 w-[17%]" title="Real Estate: 17%" />
                  <div className="h-full bg-amber-500 w-[17%]" title="SGBs: 17%" />
                  <div className="h-full bg-blue-600 w-[16%]" title="EPF/PPF: 16%" />
                  <div className="h-full bg-slate-500 w-[7%]" title="Liquid: 7%" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-emerald-600" />
                    Equities: <strong>43%</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-amber-600" />
                    Real Estate: <strong>17%</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-amber-500" />
                    SGBs &amp; Gold: <strong>17%</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-blue-600" />
                    EPF &amp; PPF: <strong>16%</strong>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-slate-500" />
                    Liquid Cash: <strong>7%</strong>
                  </span>
                  <span className="text-muted-foreground text-[11px] text-right">Lakhs / Crores standard</span>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              Step 02 • Analyze
            </div>
            <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground leading-tight">
              See your consolidated Net Worth and Asset Allocation instantly.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Watch your fragmented spreadsheets unify into one live, synchronized balance sheet. View your true liquid net worth, track liabilities against invested capital, and discover your true asset allocation across equities, mutual funds, gold, EPF, and real estate.
            </p>
            <div className="pt-2 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>Real-time XIRR computation accounting for all cash inflows/outflows.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>Proper grouping using Indian numerical formats (₹ Lakhs &amp; Crores).</span>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 3: OPTIMIZE & REPORT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
              Step 03 • Optimize &amp; Report
            </div>
            <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground leading-tight">
              Generate CA-ready tax schedules and harvest capital losses.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tax season shouldn&apos;t require a full weekend of spreadsheet formulas. Export comprehensive capital gains schedules (STCG 20%, LTCG 12.5% per Union Budget 2024 revisions) directly formatted for ITR-2 and ITR-3.
            </p>
            <div className="pt-2 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>Automated tax-loss harvesting alert matrix to offset realized gains.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <span>Pre-computed grandfathering NAVs for pre-2018 equity holdings.</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-card rounded-2xl border border-border/80 shadow-md p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    CA-Ready Schedule Export
                  </span>
                  <h3 className="text-base font-semibold text-foreground">ITR-2 / ITR-3 Tax Pack</h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-muted text-xs font-mono text-muted-foreground">
                  Excel &amp; PDF
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-muted/20 p-3.5 rounded-xl border border-border/40">
                <div>
                  <span className="text-muted-foreground text-[11px]">Total Realized LTCG</span>
                  <p className="font-serif text-lg font-semibold text-foreground mt-0.5">₹4,12,850</p>
                  <span className="text-[10px] text-muted-foreground">After ₹1.25L Sec 112A Exemption</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px]">Total Realized STCG</span>
                  <p className="font-serif text-lg font-semibold text-foreground mt-0.5">₹86,400</p>
                  <span className="text-[10px] text-muted-foreground">Taxed at 20% Sec 111A</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-emerald-600 shrink-0" />
                  <span className="font-medium text-foreground">
                    Tax-Loss Harvesting Identified: <strong>₹42,500 STCL</strong>
                  </span>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Save ₹8,500 Tax</span>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link
            href="/signup"
            className="bg-primary text-primary-foreground group inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold shadow hover:brightness-95 transition-all"
          >
            <span>Start Tracking in 3 Minutes</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
