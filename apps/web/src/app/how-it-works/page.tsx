'use client';

import {
  UploadCloud,
  CheckCircle2,
  Lock,
  TrendingUp,
  FileSpreadsheet,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function HowItWorksPage() {
  return (
    <div className="bg-background text-foreground min-h-full">
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6 lg:px-12 text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-muted/60 border border-border/80 text-xs font-medium text-muted-foreground mb-6 shadow-xs">
            <span className="size-2 rounded-full bg-primary motion-safe:animate-pulse" />
            <span>Zero setup friction, local-first architecture</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl font-medium tracking-tight text-foreground max-w-3xl mx-auto leading-tight">
            Three steps to total financial clarity.
          </h1>

          <p className="text-muted-foreground mt-5 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            No bank passwords to surrender. No invasive data broker trackers. Complete sovereign financial oversight in three simple steps.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <CheckCircle2 className="size-4 text-success" />
              <span>CAMS &amp; KFintech native</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Lock className="size-4 text-primary" />
              <span>Zero-knowledge decryption</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Zap className="size-4 text-warning" />
              <span>3-second schema parsing</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main 3-Step Narrative */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-20 space-y-24">
        {/* STEP 1: IMPORT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
              Step 01, import
            </div>
            <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground leading-tight">
              Drag and drop your bank or broker CSV. We auto-detect the rest.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              No more manual data entry. Upload your CAMS or KFintech CAS PDF statements, Zerodha/Groww tradebooks, or standard bank statement CSVs. KashMap&apos;s engine auto-detects column schemas, deduplicates transactions, and matches ISINs in under 3 seconds.
            </p>
            <div className="pt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="size-4 text-success shrink-0" />
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
                    <FileSpreadsheet className="size-5 text-success shrink-0" />
                    <div className="truncate">
                      <p className="font-semibold text-foreground truncate">CAS_Consolidated_2024.pdf</p>
                      <p className="text-[11px] text-muted-foreground">1.8 MB, encrypted parser, ready</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-success-subtle text-success font-semibold text-[11px]">
                    100% parsed
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div className="bg-success h-full rounded-full w-full" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-2">
                    Auto-detected schema matches
                  </p>
                  <div className="flex flex-wrap gap-1.5 text-[11px]">
                    {[
                      ['Date', 'Detected'],
                      ['Folio', 'Matched'],
                      ['ISIN', 'Verified'],
                      ['NAV', 'Live'],
                    ].map(([field, status]) => (
                      <span
                        key={field}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-background border border-border/60 text-foreground font-medium"
                      >
                        <CheckCircle2 className="text-success size-3" />
                        {field} → {status}
                      </span>
                    ))}
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
                  <p className="text-xs font-medium text-muted-foreground">Consolidated net worth</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-serif text-3xl font-semibold text-foreground">₹1,48,92,450</span>
                    <span className="text-xs text-success font-semibold flex items-center">
                      <TrendingUp className="size-3.5 mr-0.5" /> +14.2% YoY
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-background border border-border/60 text-xs font-medium text-foreground">
                  18.64% trailing 3Y XIRR
                </span>
              </div>

              {/* Before / after — distinct from the hero's own chart+allocation visual */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-border/40 bg-muted/20 p-4">
                  <p className="text-[11px] font-medium text-muted-foreground">Before</p>
                  <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                    <li>4 spreadsheets, 3 broker logins</li>
                    <li>Balances stale within a week</li>
                    <li>XIRR computed by hand</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-success/30 bg-success-subtle p-4">
                  <p className="text-[11px] font-medium text-success">After</p>
                  <ul className="mt-2 space-y-1.5 text-xs text-foreground">
                    <li>One synchronized balance sheet</li>
                    <li>Updated the moment you import</li>
                    <li>XIRR computed automatically</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2 lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
              Step 02, analyze
            </div>
            <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground leading-tight">
              See your consolidated Net Worth and Asset Allocation instantly.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Watch your fragmented spreadsheets unify into one live, synchronized balance sheet. View your true liquid net worth, track liabilities against invested capital, and discover your true asset allocation across equities, mutual funds, gold, EPF, and real estate.
            </p>
            <div className="pt-2 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-success" />
                <span>Real-time XIRR computation accounting for all cash inflows/outflows.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-success" />
                <span>Proper grouping using Indian numerical formats (₹ lakhs &amp; crores).</span>
              </div>
            </div>
          </div>
        </div>

        {/* STEP 3: OPTIMIZE & REPORT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
              Step 03, optimize and report
            </div>
            <h2 className="font-serif text-3xl font-medium tracking-tight text-foreground leading-tight">
              Generate CA-ready tax schedules and harvest capital losses.
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Tax season shouldn&apos;t require a full weekend of spreadsheet formulas. Export comprehensive capital gains schedules (STCG 20%, LTCG 12.5% per Union Budget 2024 revisions) directly formatted for ITR-2 and ITR-3.
            </p>
            <div className="pt-2 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-success" />
                <span>Automated tax-loss harvesting alert matrix to offset realized gains.</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-success" />
                <span>Pre-computed grandfathering NAVs for pre-2018 equity holdings.</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-card rounded-2xl border border-border/80 shadow-md p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/50">
                <div>
                  <span className="text-xs font-medium text-success">CA-ready schedule export</span>
                  <h3 className="text-base font-semibold text-foreground">ITR-2 / ITR-3 tax pack</h3>
                </div>
                <span className="px-2 py-0.5 rounded bg-muted text-xs font-medium text-muted-foreground">
                  Excel &amp; PDF
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-muted/20 p-3.5 rounded-xl border border-border/40">
                <div>
                  <span className="text-muted-foreground text-[11px]">Total realized LTCG</span>
                  <p className="font-serif text-lg font-semibold text-foreground mt-0.5">₹4,12,850</p>
                  <span className="text-[10px] text-muted-foreground">After ₹1.25L Sec 112A exemption</span>
                </div>
                <div>
                  <span className="text-muted-foreground text-[11px]">Total realized STCG</span>
                  <p className="font-serif text-lg font-semibold text-foreground mt-0.5">₹86,400</p>
                  <span className="text-[10px] text-muted-foreground">Taxed at 20% Sec 111A</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-success-subtle border border-success/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-success shrink-0" />
                  <span className="font-medium text-foreground">
                    Tax-loss harvesting identified: <strong>₹42,500 STCL</strong>
                  </span>
                </div>
                <span className="text-success font-semibold">Save ₹8,500 tax</span>
              </div>
            </div>
          </div>
        </div>

      </section>

      <LandingFooter />
    </div>
  );
}
